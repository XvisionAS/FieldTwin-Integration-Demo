import { Document, NodeIO } from '@gltf-transform/core'
import { dedup, prune, mergeDocuments, unpartition } from '@gltf-transform/functions'
import { createIO } from './io.js'

/**
 * @typedef {import('./treeWalker.js').Part} Part
 */

/**
 * FieldTwin→glTF frame conversion, applied once at the scene root: a −90° rotation about
 * X (column-major). FieldTwin world matrices are Z-up with the model-correction (+90°X)
 * baked into every part matrix; standard glTF/three viewers are Y-up. This root matrix
 * converts the whole assembly to the viewer frame — identical to the root node FieldTwin's
 * own THREE.GLTFExporter emits (see docs/ARCHITECTURE.md). It is NOT a per-part rotation:
 * the parts keep their absolute matrices and stay siblings under this single frame node.
 */
const FIELDTWIN_TO_GLTF = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]

/**
 * FieldTwin part GLBs embed editor-only helper geometry — docking-socket markers
 * (`docking_male_NNN`, `docking_female_NNN`) and label tags (`tag_NNN`) — that the
 * FieldTwin app shows for editing but its own glTF export omits. We strip them by name
 * so the stitched output contains only real model geometry, matching that export.
 */
const HELPER_NODE = /^(docking_male|docking_female|tag)_/i

/**
 * Build a single stitched glTF document from downloaded parts and write it to disk.
 *
 * Each part is merged in, then its scene roots are re-parented under one new node
 * carrying the part's absolute world matrix. The API already baked the model-correction
 * rotation and axis swap into that matrix, so it is applied directly (column-major,
 * no transpose) and parts are siblings — never nested — to avoid compounding transforms.
 * All part nodes hang off one frame-root node that applies the FieldTwin→glTF (−90°X)
 * conversion so the output is Y-up for standard viewers.
 *
 * @param {Part[]} parts Parts with `localPath` populated by the downloader.
 * @param {string} outPath Destination .glb path.
 * @param {{ optimize?: boolean, keepHelpers?: boolean, io?: NodeIO }} [options]
 * @returns {Promise<{ outPath: string, nodeCount: number }>}
 */
export async function buildGlb(parts, outPath, options = {}) {
  const io = options.io ?? (await createIO())
  const doc = new Document()
  doc.getRoot().getAsset().generator = 'smart-asset-stitcher'
  const scene = doc.createScene('stitched')
  const frameRoot = doc.createNode('fieldtwin-root')
  frameRoot.setMatrix(FIELDTWIN_TO_GLTF)
  scene.addChild(frameRoot)

  for (const part of parts) {
    if (!part.localPath) {
      throw new Error(`Part "${part.partId}" has no local file to stitch (download missing)`)
    }
    let partDoc
    try {
      partDoc = await io.read(part.localPath)
    } catch (error) {
      throw new Error(
        `Failed to read GLB for part "${part.partId}" (${part.localPath}): ${/** @type {Error} */ (error).message}`
      )
    }
    mergeDocuments(doc, partDoc)

    // mergeDocuments() appends the part's scene(s) to the root scene list; the just-added
    // scene is the last one. Re-home its roots under a matrix node and drop it.
    const scenes = doc.getRoot().listScenes()
    const mergedScene = scenes[scenes.length - 1]
    const node = doc.createNode(part.partId)
    node.setMatrix(part.transformMatrix)
    for (const root of mergedScene.listChildren()) {
      mergedScene.removeChild(root)
      node.addChild(root)
    }
    frameRoot.addChild(node)
    mergedScene.dispose()
  }

  doc.getRoot().setDefaultScene(scene)

  const stripped = options.keepHelpers === true ? 0 : stripHelperNodes(doc)

  // mergeDocuments() leaves one buffer per source part; GLB allows only 0–1 buffers, so
  // unpartition() consolidates them all into a single buffer before writing. prune() drops
  // anything orphaned — meshes/accessors left behind by stripped helper nodes — so it runs
  // whenever we stripped (or when optimizing).
  const transforms = []
  if (options.optimize) {
    transforms.push(dedup())
  }
  if (options.optimize || stripped > 0) {
    transforms.push(prune())
  }
  transforms.push(unpartition())
  await doc.transform(...transforms)

  await io.write(outPath, doc)
  return { outPath, nodeCount: parts.length }
}

/**
 * Dispose every node whose name marks it as FieldTwin editor-only helper geometry
 * (docking-socket markers and tags). These nodes are leaves in practice; the following
 * prune() pass removes the meshes/accessors they leave orphaned.
 *
 * @param {Document} doc
 * @returns {number} Count of helper nodes removed.
 */
function stripHelperNodes(doc) {
  let removed = 0
  for (const node of doc.getRoot().listNodes()) {
    if (HELPER_NODE.test(node.getName() || '')) {
      node.dispose()
      removed += 1
    }
  }
  return removed
}
