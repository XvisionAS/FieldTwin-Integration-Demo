import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { fetchStagedAsset, fetchSubProject } from './apiClient.js'
import { flattenParts, listStagedAssets } from './treeWalker.js'
import { downloadAll } from './downloader.js'
import { buildGlb } from './stitcher.js'
import { buildDescription } from './description.js'

/**
 * @typedef {import('./descriptor.js').Descriptor} Descriptor
 * @typedef {import('./treeWalker.js').StagedAsset} StagedAsset
 * @typedef {import('./treeWalker.js').Part} Part
 */

/**
 * @typedef {Object} StitchResult
 * @property {string} stagedAssetId
 * @property {string} outputDir Directory holding the stitched glb and description.
 * @property {string} glbPath Path to the stitched .glb.
 * @property {string} descriptionPath Path to description.json.
 * @property {number} partCount Number of parts stitched.
 * @property {number} skippedNodes Number of metaData nodes skipped.
 */

/**
 * @typedef {Object} StitchEntry A staged asset flattened and ready to stitch.
 * @property {string} stagedAssetId
 * @property {StagedAsset} stagedAsset
 * @property {Part[]} parts
 * @property {number} skippedNodes
 */

/** @typedef {{ fetchImpl?: typeof fetch, now?: () => string, log?: (msg: string) => void }} RunDeps */

const GLB_NAME = 'stitched.glb'
const DESCRIPTION_NAME = 'description.json'
// Shared, content-addressed part cache under the output dir. Every staged asset's parts
// resolve here so a model used by many of them is downloaded and stored exactly once.
const ASSETS_DIR = 'assets'

/**
 * Flatten one staged asset into a stitch entry.
 *
 * @param {StagedAsset} stagedAsset
 * @param {string} [fallbackId] Used when the staged asset carries no `id` (specific mode).
 * @returns {StitchEntry}
 */
function flattenEntry(stagedAsset, fallbackId) {
  const { parts, skippedNodes } = flattenParts(stagedAsset)
  return { stagedAssetId: stagedAsset?.id ?? fallbackId ?? 'unknown', stagedAsset, parts, skippedNodes }
}

/**
 * A multi-part smart asset has at least one docked (non-base) part. Plain single-model
 * staged assets yield only a base and are skipped in whole-sub-project mode.
 *
 * @param {StitchEntry} entry
 * @returns {boolean}
 */
function isSmartAsset(entry) {
  return entry.parts.some((part) => !part.isBase)
}

/**
 * Collect the staged assets to stitch. With `stagedAssetIds` set, fetch exactly those
 * (each must be a placeable smart asset). Otherwise fetch the whole sub-project in one
 * request and keep every multi-part smart asset it contains.
 *
 * @param {Descriptor} descriptor
 * @param {typeof fetch} fetchImpl
 * @param {(msg: string) => void} log
 * @returns {Promise<StitchEntry[]>}
 */
async function collectEntries(descriptor, fetchImpl, log) {
  const ids = descriptor.stagedAssetIds
  if (Array.isArray(ids) && ids.length > 0) {
    log(`Fetching ${ids.length} staged asset(s) by id`)
    /** @type {StitchEntry[]} */
    const entries = []
    for (const id of ids) {
      const stagedAsset = await fetchStagedAsset({
        api: descriptor.api,
        token: descriptor.token,
        projectId: descriptor.projectId,
        subProjectId: descriptor.subProjectId,
        streamId: descriptor.streamId,
        id,
        fetchImpl,
      })
      const entry = flattenEntry(stagedAsset, id)
      if (entry.parts.length === 0) {
        throw new Error(`Staged asset "${id}" produced no placeable parts (is it a smart asset?)`)
      }
      entries.push(entry)
    }
    return entries
  }

  log('Fetching whole sub-project')
  const subProject = await fetchSubProject({
    api: descriptor.api,
    token: descriptor.token,
    projectId: descriptor.projectId,
    subProjectId: descriptor.subProjectId,
    streamId: descriptor.streamId,
    fetchImpl,
  })
  const all = listStagedAssets(subProject)
  const entries = all.map((stagedAsset) => flattenEntry(stagedAsset)).filter(isSmartAsset)
  const skipped = all.length - entries.length
  log(`Sub-project has ${all.length} staged asset(s); ${entries.length} smart, ${skipped} skipped (no docked parts)`)
  return entries
}

/**
 * Stitch one already-downloaded entry: build the glb and write its description.
 *
 * @param {Descriptor} descriptor
 * @param {StitchEntry} entry Parts already have `localPath` populated.
 * @param {() => string} now
 * @param {(msg: string) => void} log
 * @returns {Promise<StitchResult>}
 */
async function stitchEntry(descriptor, entry, now, log) {
  const { stagedAssetId, stagedAsset, parts, skippedNodes } = entry
  const outputDir = join(descriptor.output, stagedAssetId)
  await mkdir(outputDir, { recursive: true })

  log(`Stitching ${stagedAssetId}: ${parts.length} part(s), ${skippedNodes} skipped`)
  const glbPath = join(outputDir, GLB_NAME)
  await buildGlb(parts, glbPath, {
    optimize: descriptor.optimize === true,
    keepHelpers: descriptor.keepHelpers === true,
  })

  const description = buildDescription(stagedAsset, parts, {
    projectId: descriptor.projectId,
    subProjectId: descriptor.subProjectId,
    streamId: descriptor.streamId,
    outputGlb: GLB_NAME,
    skippedNodes,
    generatedAt: now(),
  })
  const descriptionPath = join(outputDir, DESCRIPTION_NAME)
  await writeFile(descriptionPath, `${JSON.stringify(description, null, 2)}\n`)

  return { stagedAssetId, outputDir, glbPath, descriptionPath, partCount: parts.length, skippedNodes }
}

/**
 * Process one staged asset end-to-end: fetch, flatten, download, stitch, describe.
 * Downloads land in the shared `<output>/assets` cache, so repeated runs and other
 * staged assets reuse the same files.
 *
 * @param {Descriptor} descriptor
 * @param {string} stagedAssetId
 * @param {RunDeps} [deps]
 * @returns {Promise<StitchResult>}
 */
export async function stitchStagedAsset(descriptor, stagedAssetId, deps = {}) {
  const fetchImpl = deps.fetchImpl ?? fetch
  const now = deps.now ?? (() => new Date().toISOString())
  const log = deps.log ?? (() => {})

  log(`Fetching staged asset ${stagedAssetId}`)
  const stagedAsset = await fetchStagedAsset({
    api: descriptor.api,
    token: descriptor.token,
    projectId: descriptor.projectId,
    subProjectId: descriptor.subProjectId,
    streamId: descriptor.streamId,
    id: stagedAssetId,
    fetchImpl,
  })
  const entry = flattenEntry(stagedAsset, stagedAssetId)
  if (entry.parts.length === 0) {
    throw new Error(`Staged asset "${stagedAssetId}" produced no placeable parts (is it a smart asset?)`)
  }

  const cacheDir = join(descriptor.output, ASSETS_DIR)
  log(`Downloading ${new Set(entry.parts.map((p) => p.model3dUrl)).size} unique asset file(s)`)
  await downloadAll(entry.parts, cacheDir, { fetchImpl, log })

  return stitchEntry(descriptor, entry, now, log)
}

/**
 * Run the full pipeline. Collects the staged assets to stitch (specific ids, or the whole
 * sub-project when none are given), flattens them all, downloads every unique part exactly
 * once into the shared cache, then stitches each staged asset reusing those files.
 *
 * @param {Descriptor} descriptor
 * @param {RunDeps} [deps]
 * @returns {Promise<StitchResult[]>}
 */
export async function orchestrate(descriptor, deps = {}) {
  const fetchImpl = deps.fetchImpl ?? fetch
  const now = deps.now ?? (() => new Date().toISOString())
  const log = deps.log ?? (() => {})

  const entries = await collectEntries(descriptor, fetchImpl, log)
  if (entries.length === 0) {
    throw new Error('No smart assets to stitch — the sub-project contains none with docked parts.')
  }

  const cacheDir = join(descriptor.output, ASSETS_DIR)
  const allParts = entries.flatMap((entry) => entry.parts)
  const uniqueUrlCount = new Set(allParts.map((part) => part.model3dUrl)).size
  log(
    `Downloading ${uniqueUrlCount} unique asset file(s) for ${entries.length} staged asset(s) ` +
      `(${allParts.length} part placement(s))`
  )
  await downloadAll(allParts, cacheDir, { fetchImpl, log })

  /** @type {StitchResult[]} */
  const results = []
  for (const entry of entries) {
    results.push(await stitchEntry(descriptor, entry, now, log))
  }
  return results
}
