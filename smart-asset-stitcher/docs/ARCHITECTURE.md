# Architecture & rationale

This document explains how the stitcher works and **proves** the central design
decision: that the API's `transformMatrix` can be applied directly to each part GLB.

## Data model

A FieldTwin **staged smart asset** (from the v1.10 API) has:

- `asset` — the base object: `model3dUrl`, `dockingMales[]` (each `{ name, matrix }`),
  `dockingFemale` (`{ name, matrix }`), and geometry params. This is the root model the
  docked parts attach to. Unlike the parts it has **no `transformMatrix`** — its placement
  is the staged-asset top-level `initialState` (see "The base object" below).
- `initialState` — the staged asset's own world placement: `{ x, y, z, scale, rotation,
  xRotation, yRotation }`. These are the base object's world coords and orientation.
- `metaData[]` — a recursive tree of nodes of `type: "asset"`. Each node:
  - `model3dUrl` — signed GLB URL for that part,
  - `docking` — the docking slot name (e.g. `"001"`),
  - `params.initialState.transformMatrix` — **16-element, column-major, absolute world**
    4×4 matrix giving that part's final placement,
  - `params.initialState.{x,y,z,rotation,xRotation,yRotation,zRotation}` — scalar form,
  - `subValue[]` — child parts (same shape, recursive; observed up to ~7 deep).
- The deepest leaf terminates with empty `params: {}` and no `model3dUrl`.

### Why we use `transformMatrix` and not the euler fields

The scalar `xRotation/yRotation/zRotation` fields are **correction-stripped** by the API
(it multiplies by `modelCorrectionMatrixInverse` only when extracting euler angles).
`transformMatrix` is NOT stripped — it contains the full, render-ready transform. Use it.

### The base object (synthesizing its matrix)

The docked `metaData` parts each carry an API `transformMatrix`, but the **base object**
(`stagedAsset.asset`) does not — the live renderer places its GLB at the staged-asset root
and applies the +90°X correction there (proof point 4 below). So `src/matrix.js`
reproduces the matrix the API *would* have built for a node with no docking, in the same
stack order proven below:

```
M = correction(+90°X) · translation(x, z, −y) · headingⒷ · yRotⒷ · xRotⒷ · scaleⒷ
```

where `(x, y, z, rotation, xRotation, yRotation, scale)` come from the top-level
`initialState`. The FieldTwin→three axis swap (`x, z, −y`) combined with the correction
makes the final translation column equal the world `(x, y, z)`.

**Verified empirically:** a real docked part whose euler angles are all ~0 has the matrix
`correction · translation(x, z, −y)` exactly; feeding that part's `initialState` through
`stagedAssetRootMatrix()` reproduces its API matrix to ~1e-6. Real bases observed so far
are rotation-free (`rotation = xRotation = yRotation = 0`), so only translation +
correction are exercised end-to-end; the heading/tilt terms follow the documented stack
order but a rotated base has not yet been checked against a live render.

## The pipeline

```
descriptor.json
   │  loadDescriptor + validate           (src/descriptor.js)
   ▼
fetchStagedAsset(id)                       (src/apiClient.js)
   │  GET /API/v1.10/{proj}/subProject/{sub}:{stream}/stagedAssets/{id}
   ▼
flattenParts(stagedAsset)                  (src/treeWalker.js)
   │  emit the base object (synthesized matrix, see below), then walk metaData +
   │  subValue, keeping nodes with model3dUrl AND a 16-len matrix
   │  → [{ assetName, partId, docking, model3dUrl, transformMatrix, localPath:null }]
   ▼
downloadAll(parts, outDir)                 (src/downloader.js)
   │  bounded pool (8), dedup identical URLs, retry x3, populate localPath
   ▼
buildGlb(parts, outPath)                   (src/stitcher.js)
   │  for each part: merge its GLB, re-home roots under a node, node.setMatrix(matrix)
   │  all part nodes are SIBLINGS under one `fieldtwin-root` node (−90°X frame conversion)
   │  strip editor-only helper nodes (docking sockets, tags); prune orphans
   ▼
buildDescription(...) + write              (src/description.js, src/run.js)
   → stitched.glb + description.json
```

## Proof: the matrix is directly applicable (no correction, no transpose)

The FieldTwin v1.9/v1.10 API builds each part's `transformMatrix` by multiplying a
matrix stack. The stack is **seeded with the model-correction rotation**, then world
placement, then per-part docking matrices:

1. **Model correction.** The model→FieldTwin correction is a **+90° rotation about X**
   (`setFromAxisAngle((1,0,0), π/2)`). Raw exported models are authored lying down; this
   stands them upright in FieldTwin's frame.

2. **World placement.** The correction matrix is pushed **first**, then world translation —
   with the FieldTwin↔three axis swap `translate(x, z, −y)` — then heading, the y/x
   rotations, and scale, in that stack order.

3. **Docking + recursion.** For each `metaData` node the API extends that stack with the
   docking male/female matrices, multiplies the whole list, and stores the result as
   `params.initialState.transformMatrix` (`matrix.toArray()`). It then recurses into
   `subValue`, passing the accumulated stack down — so **every nested part's matrix already
   includes the correction + the full ancestor chain.**

4. **Equivalence with the live renderer.** In the live FieldTwin renderer the correction is
   applied **once, at the staged-asset root**, and the loaded GLB scene is used as-is. The
   API output achieves the equivalent by baking the correction into each part matrix
   instead. **The two representations are equivalent.**

### Conclusions

- **Absolute, not relative.** Each matrix is the full product root→part. Therefore part
  nodes must be **siblings** under the scene root — nesting would apply ancestor
  transforms twice.
- **Direct application.** `Node.setMatrix(array)` in `@gltf-transform` expects the same
  16-element column-major layout produced by three.js `matrix.toArray()`. No transpose.
- **No extra correction.** The +90°X correction and axis swap are already inside the
  matrix. Re-applying them would double-rotate the model.

## How `buildGlb` merges (gltf-transform v4)

```js
const doc = new Document()
const scene = doc.createScene('stitched')
const frameRoot = doc.createNode('fieldtwin-root').setMatrix(FIELDTWIN_TO_GLTF) // −90°X
scene.addChild(frameRoot)
for (const part of parts) {
  const partDoc = await io.read(part.localPath)
  mergeDocuments(doc, partDoc)                        // v4: was doc.merge(partDoc)
  const merged = doc.getRoot().listScenes().at(-1)    // the just-merged scene
  const node = doc.createNode(part.partId)
  node.setMatrix(part.transformMatrix)
  for (const root of merged.listChildren()) { merged.removeChild(root); node.addChild(root) }
  frameRoot.addChild(node)                            // siblings under the frame root
  merged.dispose()                                    // drop the now-empty merged scene
}
doc.getRoot().setDefaultScene(scene)
stripHelperNodes(doc)                                 // docking sockets + tags
await doc.transform(prune(), unpartition())           // drop orphans; one GLB buffer
await io.write(outPath, doc)
```

`mergeDocuments()` (v4 replacement for `doc.merge()`) copies all of `partDoc`'s resources
into `doc` and appends its scene(s); we take the last-added scene, re-home its root nodes
under one matrix node, and discard the empty scene. Identical part URLs are downloaded once
(deduped by the downloader) but each node still gets its own matrix. `unpartition()` is
required because GLB allows only 0–1 buffers and each merged part brought its own.

### Frame conversion and helper stripping

- **`fieldtwin-root` (−90°X).** API matrices are FieldTwin world coords (Z-up, +90°X model
  correction baked in). glTF/three viewers are Y-up. A single root node applies −90°X to the
  whole assembly — the same node FieldTwin's own `THREE.GLTFExporter` emits at the top of
  `real-coord.gltf`. It is a coordinate-frame conversion applied once, NOT a per-part
  rotation; the part matrices are untouched.
- **Helper stripping.** Part GLBs embed editor-only geometry: docking-socket markers
  (`docking_male_NNN`, `docking_female_NNN`) and tags (`tag_NNN`). The FieldTwin export drops
  them; `buildGlb` strips nodes matching `/^(docking_male|docking_female|tag)_/i` by default
  (`keepHelpers: true` to retain), then `prune()` removes the orphaned meshes/accessors.

