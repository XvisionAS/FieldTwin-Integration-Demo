import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * @typedef {import('./treeWalker.js').Part} Part
 */

const DEFAULT_CONCURRENCY = 8
const MAX_RETRIES = 3

/**
 * Turn a partId into a filesystem-safe base filename.
 *
 * @param {string} partId
 * @param {number} index Used to guarantee uniqueness across parts.
 * @returns {string}
 */
function partFileName(partId, index) {
  const safe = partId.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '')
  return `${index}_${safe || 'part'}.glb`
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
 * Download all part GLBs into `outDir`, mutating each part's `localPath`. Identical
 * URLs are fetched once and reused. Failures are collected and reported together so
 * a single bad part does not mask the rest.
 *
 * @param {Part[]} parts
 * @param {string} outDir Directory to write GLBs into (created if missing).
 * @param {{ concurrency?: number, fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<Part[]>} The same parts, with `localPath` populated.
 */
export async function downloadAll(parts, outDir, options = {}) {
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY
  const fetchImpl = options.fetchImpl ?? fetch
  await mkdir(outDir, { recursive: true })

  /** @type {Map<string, string>} */
  const urlToFile = new Map()
  /** @type {{ partId: string, url: string, message: string }[]} */
  const failures = []
  let cursor = 0

  const worker = async () => {
    while (cursor < parts.length) {
      const index = cursor
      cursor += 1
      const part = parts[index]
      const fileName = partFileName(part.partId, index)
      const destination = join(outDir, fileName)
      const cached = urlToFile.get(part.model3dUrl)
      if (cached) {
        part.localPath = cached
        continue
      }
      try {
        await downloadOne(part.model3dUrl, destination, fetchImpl)
        urlToFile.set(part.model3dUrl, destination)
        part.localPath = destination
      } catch (error) {
        failures.push({ partId: part.partId, url: part.model3dUrl, message: /** @type {Error} */ (error).message })
      }
    }
  }

  const workerCount = Math.min(concurrency, parts.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))

  if (failures.length > 0) {
    const lines = failures.map((f) => `  - ${f.partId} (${f.url}): ${f.message}`)
    throw new Error(`Failed to download ${failures.length} part(s):\n${lines.join('\n')}`)
  }
  return parts
}
