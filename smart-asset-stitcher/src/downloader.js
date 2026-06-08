import { createHash } from 'node:crypto'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * @typedef {import('./treeWalker.js').Part} Part
 */

const DEFAULT_CONCURRENCY = 8
const MAX_RETRIES = 3

/**
 * Content-addressed cache filename for a part URL: a short hash of the URL plus a
 * `.glb` extension. Identical URLs map to the same file, so a model shared by many
 * staged assets is stored — and downloaded — exactly once, and re-runs reuse it.
 *
 * @param {string} url
 * @returns {string}
 */
export function cacheFileName(url) {
  return `${createHash('sha1').update(url).digest('hex').slice(0, 16)}.glb`
}

/**
 * Sleep helper for retry backoff.
 *
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Whether a path already exists as a non-empty file (a previously cached download).
 *
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function fileExists(path) {
  try {
    const info = await stat(path)
    return info.isFile() && info.size > 0
  } catch {
    return false
  }
}

/**
 * Download a single URL to disk with retry + backoff. 403 is surfaced with an
 * actionable hint because signed URLs in descriptors expire.
 *
 * @param {string} url
 * @param {string} destination Absolute path to write the GLB to.
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<void>}
 */
async function downloadOne(url, destination, fetchImpl) {
  let lastError
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchImpl(url)
      if (response.status === 403) {
        throw new Error('403 Forbidden — the signed URL has likely expired; regenerate the descriptor')
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const buffer = Buffer.from(await response.arrayBuffer())
      await writeFile(destination, buffer)
      return
    } catch (error) {
      lastError = error
      if (attempt < MAX_RETRIES) {
        await delay(attempt * 250)
      }
    }
  }
  throw lastError
}

/**
 * Download every part GLB into a shared, content-addressed cache directory, then
 * point each part's `localPath` at its cached file. Parts are deduped by URL across
 * the whole list — so a model used by N staged assets is fetched once — and a file
 * already present in the cache (e.g. from a prior run) is reused without a network
 * call. Failures are collected and reported together so one bad URL does not mask the rest.
 *
 * @param {Part[]} parts All parts to resolve (may span many staged assets).
 * @param {string} cacheDir Directory to cache GLBs in (created if missing).
 * @param {{ concurrency?: number, fetchImpl?: typeof fetch, log?: (msg: string) => void }} [options]
 * @returns {Promise<Part[]>} The same parts, with `localPath` populated.
 */
export async function downloadAll(parts, cacheDir, options = {}) {
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY
  const fetchImpl = options.fetchImpl ?? fetch
  const log = options.log ?? (() => {})
  await mkdir(cacheDir, { recursive: true })

  // Resolve one job per unique URL; many parts may share a URL and reuse its file.
  const uniqueUrls = [...new Set(parts.map((part) => part.model3dUrl))]
  /** @type {Map<string, string>} */
  const urlToFile = new Map()
  /** @type {{ url: string, message: string }[]} */
  const failures = []
  let cursor = 0

  const worker = async () => {
    while (cursor < uniqueUrls.length) {
      const url = uniqueUrls[cursor]
      cursor += 1
      const destination = join(cacheDir, cacheFileName(url))
      try {
        if (await fileExists(destination)) {
          log(`Cached ${url}`)
        } else {
          await downloadOne(url, destination, fetchImpl)
        }
        urlToFile.set(url, destination)
      } catch (error) {
        failures.push({ url, message: /** @type {Error} */ (error).message })
      }
    }
  }

  const workerCount = Math.min(concurrency, uniqueUrls.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))

  if (failures.length > 0) {
    const lines = failures.map((f) => `  - ${f.url}: ${f.message}`)
    throw new Error(`Failed to download ${failures.length} asset(s):\n${lines.join('\n')}`)
  }

  for (const part of parts) {
    part.localPath = urlToFile.get(part.model3dUrl) ?? null
  }
  return parts
}
