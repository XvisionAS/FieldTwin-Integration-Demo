import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { fetchStagedAsset } from './apiClient.js'
import { flattenParts } from './treeWalker.js'
import { downloadAll } from './downloader.js'
import { buildGlb } from './stitcher.js'
import { buildDescription } from './description.js'

/**
 * @typedef {import('./descriptor.js').Descriptor} Descriptor
 */

/**
 * @typedef {Object} StitchResult
 * @property {string} stagedAssetId
 * @property {string} outputDir Directory holding the parts, glb and description.
 * @property {string} glbPath Path to the stitched .glb.
 * @property {string} descriptionPath Path to description.json.
 * @property {number} partCount Number of parts stitched.
 * @property {number} skippedNodes Number of metaData nodes skipped.
 */

const GLB_NAME = 'stitched.glb'
const DESCRIPTION_NAME = 'description.json'

/**
 * Process one staged asset end-to-end: fetch, flatten, download, stitch, describe.
 *
 * @param {Descriptor} descriptor
 * @param {string} stagedAssetId
 * @param {{ fetchImpl?: typeof fetch, now?: () => string, log?: (msg: string) => void }} [deps]
 * @returns {Promise<StitchResult>}
 */
export async function stitchStagedAsset(descriptor, stagedAssetId, deps = {}) {
  const fetchImpl = deps.fetchImpl ?? fetch
  const now = deps.now ?? (() => new Date().toISOString())
  const log = deps.log ?? (() => {})

  const outputDir = join(descriptor.output, stagedAssetId)
  await mkdir(outputDir, { recursive: true })
  const partsDir = join(outputDir, 'parts')

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

  const { parts, skippedNodes } = flattenParts(stagedAsset)
  if (parts.length === 0) {
    throw new Error(`Staged asset "${stagedAssetId}" produced no placeable parts (is it a smart asset?)`)
  }
  log(`Found ${parts.length} part(s), ${skippedNodes} node(s) skipped`)

  log(`Downloading ${parts.length} part file(s)`)
  await downloadAll(parts, partsDir, { fetchImpl })

  log('Stitching parts into a single glb')
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

  return {
    stagedAssetId,
    outputDir,
    glbPath,
    descriptionPath,
    partCount: parts.length,
    skippedNodes,
  }
}

/**
 * Run the full pipeline for every staged asset listed in the descriptor.
 *
 * @param {Descriptor} descriptor
 * @param {{ fetchImpl?: typeof fetch, now?: () => string, log?: (msg: string) => void }} [deps]
 * @returns {Promise<StitchResult[]>}
 */
export async function orchestrate(descriptor, deps = {}) {
  /** @type {StitchResult[]} */
  const results = []
  for (const stagedAssetId of descriptor.stagedAssetIds) {
    results.push(await stitchStagedAsset(descriptor, stagedAssetId, deps))
  }
  return results
}
