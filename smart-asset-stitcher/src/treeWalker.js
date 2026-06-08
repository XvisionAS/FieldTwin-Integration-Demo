/**
 * @typedef {Object} MetaDatumNode
 * @property {string} [assetName] Human-readable name of the asset this node represents.
 * @property {string} [name] Fallback name when assetName is absent.
 * @property {string} [docking] Docking slot name the part is attached to (e.g. "001").
 * @property {string} [model3dUrl] Signed URL of the part's GLB file.
 * @property {{ initialState?: { transformMatrix?: number[] } }} [params] Computed placement.
 * @property {MetaDatumNode[]} [subValue] Recursive child parts.
 */

/**
 * @typedef {Object} StagedAsset
 * @property {string} [id]
 * @property {string} [name]
 * @property {{ id?: string, name?: string, model3dUrl?: string }} [asset] The base object.
 * @property {import('./matrix.js').InitialState} [initialState] Base-object world placement.
 * @property {MetaDatumNode[]} [metaData] Recursive part tree (entries of type "asset").
 */

/**
 * @typedef {Object} SubProject
 * @property {Object<string, StagedAsset>} [stagedAssets] Staged assets keyed by id.
 */

/**
 * @typedef {Object} Part
 * @property {string} assetName Name of the asset for this part.
 * @property {string} partId Stable id unique within a staged asset (depth-path based).
 * @property {(string|undefined)} docking Docking slot name, when present.
 * @property {string} model3dUrl Signed GLB URL to download.
 * @property {number[]} transformMatrix Absolute 4x4 column-major world transform (16 numbers).
 * @property {(string|null)} localPath Filled in by the downloader once the GLB is on disk.
 * @property {boolean} [isBase] True for the staged-asset base object (not a docked part).
 */

import { stagedAssetRootMatrix } from './matrix.js'

const MATRIX_LENGTH = 16

/**
 * Whether a metaData node carries everything needed to place a part: a model URL
 * and a full 16-element transform matrix. The deepest leaf in a smart-asset chain
 * has empty `params: {}` and no model and is intentionally excluded.
 *
 * @param {MetaDatumNode} node
 * @returns {boolean}
 */
function isPlaceablePart(node) {
  const matrix = node?.params?.initialState?.transformMatrix
  return typeof node?.model3dUrl === 'string' && Array.isArray(matrix) && matrix.length === MATRIX_LENGTH
}

/**
 * Build the base-object part from the staged asset, if it has a model. The base object
 * (`stagedAsset.asset`) is the root the docked parts attach to; unlike the parts the API
 * gives it no `transformMatrix`, so we synthesize one from the staged-asset `initialState`
 * (see src/matrix.js). Returns null when there is no base model to place.
 *
 * @param {StagedAsset} stagedAsset
 * @returns {Part|null}
 */
function baseObjectPart(stagedAsset) {
  const model3dUrl = stagedAsset?.asset?.model3dUrl
  if (typeof model3dUrl !== 'string') {
    return null
  }
  return {
    assetName: stagedAsset.asset?.name ?? stagedAsset.name ?? 'base',
    partId: 'base',
    docking: undefined,
    model3dUrl,
    transformMatrix: stagedAssetRootMatrix(stagedAsset.initialState ?? {}),
    localPath: null,
    isBase: true,
  }
}

/**
 * Flatten a staged smart-asset into a flat list of placeable parts: the base object
 * first, then every node in the recursive metaData/subValue tree. Each part keeps its
 * own absolute world matrix (the API's for parts, a synthesized one for the base), so
 * parts are siblings (never nested) when stitched.
 *
 * @param {StagedAsset} stagedAsset The staged asset returned by the API.
 * @returns {{ parts: Part[], skippedNodes: number }} Parts in traversal order plus a skipped count.
 */
export function flattenParts(stagedAsset) {
  /** @type {Part[]} */
  const parts = []
  let skippedNodes = 0

  const base = baseObjectPart(stagedAsset)
  if (base) {
    parts.push(base)
  }

  /**
   * @param {MetaDatumNode} node
   * @param {string[]} ancestry Docking-slot path from the root to this node's parent.
   */
  const walk = (node, ancestry) => {
    const slot = node?.docking ?? String(parts.length + skippedNodes)
    const path = [...ancestry, slot]
    if (isPlaceablePart(node)) {
      parts.push({
        assetName: node.assetName ?? node.name ?? 'part',
        partId: path.join('/'),
        docking: node.docking,
        model3dUrl: /** @type {string} */ (node.model3dUrl),
        transformMatrix: /** @type {number[]} */ (node.params.initialState.transformMatrix),
        localPath: null,
      })
    } else {
      skippedNodes += 1
    }
    for (const child of node?.subValue ?? []) {
      walk(child, path)
    }
  }

  for (const metaDatum of stagedAsset?.metaData ?? []) {
    walk(metaDatum, [])
  }

  return { parts, skippedNodes }
}

/**
 * Extract the staged assets from a sub-project response. The API returns them as an
 * object keyed by id; this yields them as an array (each carries its own id) in a
 * stable key order so downstream traversal is deterministic.
 *
 * @param {SubProject} subProject The sub-project returned by fetchSubProject.
 * @returns {StagedAsset[]} Every staged asset in the sub-project (empty when none).
 */
export function listStagedAssets(subProject) {
  const map = subProject?.stagedAssets
  if (!map || typeof map !== 'object') {
    return []
  }
  return Object.keys(map)
    .sort()
    .map((id) => map[id])
    .filter((stagedAsset) => stagedAsset && typeof stagedAsset === 'object')
}
