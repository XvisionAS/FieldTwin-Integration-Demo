import { basename } from 'node:path'

/**
 * @typedef {import('./treeWalker.js').StagedAsset} StagedAsset
 * @typedef {import('./treeWalker.js').Part} Part
 */

/**
 * @typedef {Object} DescriptionMeta
 * @property {string} projectId
 * @property {string} subProjectId
 * @property {string} streamId
 * @property {string} outputGlb Filename of the stitched glb (not a full path).
 * @property {number} skippedNodes Count of metaData nodes skipped (no model/matrix).
 * @property {string} [generatedAt] ISO timestamp; stamped by the orchestrator.
 */

/**
 * Extract the base-asset summary from a staged asset.
 *
 * @param {StagedAsset & { asset?: Record<string, any> }} stagedAsset
 * @returns {Record<string, any>}
 */
function describeBaseAsset(stagedAsset) {
  const asset = stagedAsset?.asset ?? {}
  return {
    assetId: asset.id,
    name: asset.name,
    model3dUrl: asset.model3dUrl,
    dockingFemale: asset.dockingFemale,
    dockingMales: asset.dockingMales,
  }
}

/**
 * Build the description.json object describing how parts were stitched. This is a
 * pure function — the human-facing manifest the tool emits alongside the glb.
 *
 * @param {StagedAsset & { asset?: Record<string, any> }} stagedAsset
 * @param {Part[]} parts Parts with `localPath` populated.
 * @param {DescriptionMeta} meta
 * @returns {Record<string, any>}
 */
export function buildDescription(stagedAsset, parts, meta) {
  return {
    stagedAssetId: stagedAsset?.id,
    stagedAssetName: stagedAsset?.name,
    projectId: meta.projectId,
    subProjectId: meta.subProjectId,
    streamId: meta.streamId,
    generatedAt: meta.generatedAt,
    outputGlb: meta.outputGlb,
    matrixConvention: 'column-major',
    correctionApplied: 'baked-in-by-api',
    baseAsset: describeBaseAsset(stagedAsset),
    skippedNodes: meta.skippedNodes,
    parts: parts.map((part) => ({
      assetName: part.assetName,
      partId: part.partId,
      isBase: part.isBase === true,
      docking: part.docking,
      model3dUrl: part.model3dUrl,
      localFile: part.localPath ? basename(part.localPath) : null,
      transformMatrix: part.transformMatrix,
    })),
  }
}
