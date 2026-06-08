# CLAUDE.md — smart-asset-stitcher

Guidance for Claude Code (and humans) working on this package. Read this first to
resume work at any time.

## What this is

A **standalone, publishable npm package** (NOT part of the `field-activity-planner`
monorepo). It is a CLI **and** a library that assembles FieldTwin **smart assets**
(multi-part 3D models) into a single self-contained GLTF/GLB.

Pipeline: read a descriptor JSON → **collect** the staged assets to stitch (either the
specific `stagedAssetIds`, OR the whole sub-project in one request when none are given) →
walk each one's recursive `metaData`/`subValue` tree to collect placeable parts →
**download every UNIQUE part GLB once** into a shared content-addressed cache (deduped
across all staged assets) → stitch each staged asset under one scene using each part's
precomputed transform matrix → write `stitched.glb` + `description.json` per asset.

**Two modes (same efficient backend):**
- **Specific** — `stagedAssetIds: [...]` present: fetch exactly those staged assets.
- **Whole sub-project** — `stagedAssetIds` omitted/empty: `fetchSubProject()` pulls every
  staged asset in one call (the sub-project endpoint matrix-enriches them through the same
  code path as the single-asset endpoint), and only the **multi-part smart assets** (those
  with ≥1 docked, non-base part) are stitched; plain single-model staged assets are skipped.

Both modes funnel into one global `downloadAll(allParts, <output>/assets)`, so a model
shared by N staged assets is fetched and stored **once** (the original code re-downloaded
per staged asset). The shared cache is content-addressed (`sha1(url)`) and re-run-safe:
an already-present file is reused without a network call.

## The one insight that drives the whole design

The API has **already done the docking math.** Every placeable node in the response
carries `params.initialState.transformMatrix` — a **16-element, column-major,
ABSOLUTE world** matrix. So this tool does NOT recompute docking from sockets; it
just collects `(model3dUrl, transformMatrix)` pairs and applies them.

Three rules that follow (do not violate these):
1. **Apply the matrix directly** — no transpose, no extra rotation. gltf-transform
   `Node.setMatrix()` uses the same column-major layout as the API's `matrix.toArray()`.
   The model→FieldTwin correction (+90° about X) and the axis swap are already baked in.
2. **Parts are siblings, never nested.** Matrices are absolute, so nesting would
   compound transforms twice. Each part gets its own node under one shared **frame-root**
   node (see rule 4) — siblings of each other, never of differing depth.
3. **Use `transformMatrix`, not the `xRotation/yRotation/zRotation` euler fields** —
   those are correction-stripped and would render wrong.

**One exception — the base object.** `stagedAsset.asset` (the root model the parts dock
onto) has NO `transformMatrix`; the API only matrix-enriches the `metaData` parts. Its
placement is the staged-asset top-level `initialState`. `src/matrix.js` synthesizes the
base matrix (`correction · T(x,z,−y) · heading · y · x · scale`) — confirmed by
reconstructing a real euler-≈0 part's API matrix to ~1e-6. `flattenParts` emits the base
as the first part (`partId: "base"`). Without this, the stitched glb is missing the base
model (parts float around an empty centre).

4. **Frame root: −90°X.** API matrices are FieldTwin world (Z-up, +90°X correction baked
   in); glTF/three viewers are Y-up. `buildGlb` parents all part nodes under ONE frame-root
   node (`fieldtwin-root`) carrying a −90°X matrix, exactly like the root node FieldTwin's
   own THREE.GLTFExporter emits. This is a one-time coordinate-frame conversion, NOT a
   per-part rotation — do not also touch the part matrices. Verified: every model mesh lands
   on the FieldTwin-exported reference (`real-coord.gltf`) to ~3e-5.
5. **Strip editor helpers.** Part GLBs embed FieldTwin editor-only geometry — docking-socket
   markers (`docking_male_NNN`, `docking_female_NNN`) and tags (`tag_NNN`). FieldTwin's own
   export omits them; `buildGlb` strips nodes matching `HELPER_NODE` by default (opt out with
   `keepHelpers: true`). A `prune()` pass then drops the orphaned meshes/accessors.

See `docs/ARCHITECTURE.md` for the full proof (with monorepo file/line references), and
`docs/GUIDE.md` for the extensive beginner-friendly walkthrough (3D concepts, mermaid
diagrams, client Q&A, modification recipes).

## API endpoint

```
GET {api}/API/v1.10/{projectId}/subProject/{subProjectId}:{streamId}/stagedAssets/{stagedAssetId}
header: token: <apiToken>
```
`metaData[]` (entries of `type: "asset"`) is the recursive part tree; each node may
have `subValue[]` children. The deepest leaf has empty `params: {}` and no model — it
is skipped and counted as `skippedNodes`.

**Whole sub-project endpoint** (one request → all staged assets):
```
GET {api}/API/v1.10/{projectId}/subProject/{subProjectId}:{streamId}
header: token: <apiToken>
```
Returns `stagedAssets` as an **object keyed by id**; `listStagedAssets()` turns it into a
sorted array. Each entry carries the same matrix-enriched `asset` + `initialState` +
`metaData[]` form as the single-asset endpoint, so `flattenParts()` is reused unchanged.

## File map

```
bin/cli.js            # CLI entry (#!/usr/bin/env node), arg parsing, calls orchestrate()
index.js              # library public API (re-exports)
index.d.ts            # hand-written types for consumers
src/descriptor.js     # loadDescriptor() + validateDescriptor() — pure; stagedAssetIds optional
src/apiClient.js      # fetchStagedAsset()/stagedAssetUrl() + fetchSubProject()/subProjectUrl()
src/matrix.js         # stagedAssetRootMatrix(initialState) — synthesize base-object matrix
src/treeWalker.js     # flattenParts(stagedAsset) + listStagedAssets(subProject) — pure; base first
src/downloader.js     # downloadAll(parts, cacheDir) — content-addressed (sha1) shared cache,
                       #   one fetch per UNIQUE url, skips already-cached files, pool (8), retry
src/io.js             # createIO() — NodeIO with KHR_draco_mesh_compression registered
src/stitcher.js       # buildGlb(parts, outPath) — frame root + setMatrix + strip helpers + unpartition
src/description.js    # buildDescription(stagedAsset, parts, meta) — pure
src/run.js            # orchestrate() (collect→flatten-all→global download→stitch each) +
                       #   stitchStagedAsset() single-asset path. Both share <output>/assets cache.
test/*.test.js        # node:test unit tests
test/fixtures/staged-smart-asset.json  # copied from the monorepo mock (self-contained)
```

## Conventions

- **Plain JavaScript ESM** (`"type": "module"`). **No TypeScript source.** Types live in
  `index.d.ts` only.
- No build step. Ship `src/` as-is.
- Prettier: 2-space, **no semicolons**, single quotes, printWidth 120 (`.prettierrc`).
- JSDoc on every exported function. Import types via `@typedef {import('...').X} X`.
- Always brace control statements. Early returns over deep nesting. Small pure functions.
- **No new runtime deps unless justified.** HTTP = native `fetch`; concurrency =
  hand-rolled pool. Deps: `@gltf-transform/core`, `@gltf-transform/functions`,
  `@gltf-transform/extensions`, `draco3dgltf`. Real FieldTwin part GLBs are
  Draco-compressed, so `src/io.js#createIO()` registers `KHRDracoMeshCompression` +
  the WASM decoder/encoder on the `NodeIO` — always use `createIO()`, never a bare
  `new NodeIO()`, when reading/writing part GLBs. If a future asset uses Meshopt, add
  `EXTMeshoptCompression` + the `meshoptimizer` decoder the same way.
- Errors: throw with actionable context (status codes, ids). 403 on download = expired
  signed URL → tell the user to regenerate the descriptor.
- Downloads: keep concurrency ≤ 8 (well under any rate limit; FieldTwin convention is to
  batch above 20 simultaneous requests).

## Descriptor shape

```json
{
  "api": "https://host/",
  "token": "<api-token-or-jwt>",
  "projectId": "...",
  "subProjectId": "...",
  "streamId": "...",
  "stagedAssetIds": ["-OP5jKjeGPz619z_4b_m"],
  "output": "./out",
  "optimize": false,
  "keepHelpers": false
}
```
`stagedAssetIds` is **optional**: omit it (or pass `[]`) to fetch the whole sub-project and
stitch every multi-part smart asset in it.

## Output

```
<output>/assets/<sha1>.glb            # shared, deduped part cache (one file per unique url)
<output>/<stagedAssetId>/stitched.glb
<output>/<stagedAssetId>/description.json
```
Parts are NO LONGER copied into a per-asset `parts/` folder — they live once in the shared
`assets/` cache, and `description.json#parts[].localFile` names the cache file.

`description.json` records: source ids, base asset (model + docking sockets),
`skippedNodes`, and per-part `{ assetName, partId, isBase, docking, model3dUrl, localFile,
transformMatrix }`. The base object is emitted as the first part (`partId: "base"`,
`isBase: true`). It also stamps `matrixConvention: "column-major"` and
`correctionApplied: "baked-in-by-api"` so downstream consumers don't re-apply the
+90°X correction.

## Current status (last session: 2026-06-08)

- [x] **PR-review restructure: fetch-once / download-once.** Added whole-sub-project mode
      (`fetchSubProject()` + `listStagedAssets()`); `stagedAssetIds` is now optional (omit ⇒
      stitch all multi-part smart assets in the sub-project). `downloadAll` rewritten to a
      content-addressed shared cache (`<output>/assets/<sha1>.glb`): one fetch per UNIQUE url
      across ALL staged assets (was per-staged-asset), and already-cached files are reused
      with no network call. `orchestrate()` now collects → flattens all → one global download
      → stitches each. Per-asset `parts/` folder removed. New tests: apiClient URLs,
      downloader dedup/reuse, listStagedAssets. `npm test` → 21 green.

## Previous status (2026-06-02)

- [x] Package scaffolded, all source modules + entry points written.
- [x] README, LICENSE (MIT), .prettierrc, .gitignore, CLAUDE.md, docs/ARCHITECTURE.md.
- [x] Unit tests written: `treeWalker`, `description`, `stitcher`, `matrix`.
- [x] `npm install` run — 30 packages, 0 vulnerabilities.
- [x] `npm test` — all 12 tests green. Fixed one gltf-transform v4 mismatch:
      `Document.merge()` is removed; now uses `mergeDocuments(target, source)` from
      `@gltf-transform/functions` (see `src/stitcher.js`).
- [x] `npm pack --dry-run` — tarball is clean (13 files, 9.7 kB): only `files` entries
      (LICENSE, README, bin/, index.js, index.d.ts, package.json, src/). No tests/docs/fixtures.
- [x] CLI smoke-tested: `node bin/cli.js` and `--help` print usage and exit 0.
- [x] **End-to-end run against a live API DONE** (local dev API at lvh.me, staged asset
      `-Ou7JZqf354wxP2XTZT4`: 8 parts, 9 skipped nodes → `stitched.glb`). Three fixes were
      needed and are now in place:
      1. **Double version-path** — descriptors whose `api` already ends in `/API/v1.10/`
         produced a doubled segment and 404. `stagedAssetUrl()` now strips a trailing
         `/API/vX.Y` from the base (`src/apiClient.js`).
      2. **Draco** — real part GLBs ARE `KHR_draco_mesh_compression`-encoded. Added
         `draco3dgltf` + `@gltf-transform/extensions`; new `src/io.js#createIO()` registers
         the extension + WASM decoder/encoder. `buildGlb` defaults to `await createIO()`.
      3. **GLB single-buffer** — `mergeDocuments()` leaves one buffer per part; GLB allows
         0–1. `buildGlb` now runs `unpartition()` (always) before `io.write`.
- [x] **Base object was missing — FIXED.** `flattenParts` only walked `metaData[]`, so
      the base object (`stagedAsset.asset`) never got stitched (parts placed correctly,
      base absent — confirmed by the user's render). The base has no API `transformMatrix`;
      `src/matrix.js#stagedAssetRootMatrix()` synthesizes it from top-level `initialState`,
      and `flattenParts` now emits it first as `partId: "base"`. Live run is now **9 parts**
      (8 + base).
- [x] **Numeric correctness CONFIRMED**: read `stitched.glb` back — 9 sibling nodes (not
      nested), each node's matrix matches its recorded matrix to 1.48e-7, all 9 carry mesh
      content, and the `base` node sits at the staged-asset `initialState` world coords
      (centred among the parts that dock to it). `--optimize` works (dedup 696 kB → 164 kB).
- [x] **Matched against FieldTwin's own export.** User provided `real-coord.gltf` (a
      THREE.GLTFExporter dump of the same asset). Comparing per-mesh world centroids, all 9
      of our model meshes (base + 8 parts) coincide with the reference to ~3e-5 — after two
      adjustments: (a) a `fieldtwin-root` node applying −90°X (FieldTwin Z-up → glTF Y-up),
      and (b) stripping editor-only helper geometry (`docking_male/female_*`, `tag_*`) that
      the FieldTwin export also omits. The reference's one extra mesh is a standalone scene
      object (`node 28`) OUTSIDE the staged asset — correctly not part of our output.
- [ ] **Visual render check still pending** (human eye in a glTF viewer) — numeric match to
      the FieldTwin export is exact; a quick eyeball is still worthwhile. Real bases seen so
      far are rotation-free, so the base matrix's heading/tilt terms are untested live.
- [ ] No commits made yet (git repo initialized).

## Next steps to resume

1. ~~`npm install`~~ — done.
2. ~~`npm test`~~ — done, all 7 green (gltf-transform v4 `mergeDocuments` fix applied).
3. Create a real `descriptor.json` (gitignored) pointing at a project/subproject with a
   known smart asset and run `node bin/cli.js ./descriptor.json`.
4. **Verify correctness (the important check):** open `stitched.glb` in a glTF viewer
   and confirm it matches the in-app render of the same smart asset. Numerically:
   each part's world-space centroid should align with the API's per-part `x/y/z`
   (which equal `transformMatrix[12..14]`).
5. `npm pack` and inspect the tarball only contains the `files` entries.

## Verification notes / open risks

- **Coordinate correctness was proven by static code trace, not yet by a live render.**
  Step 4 above is the confirmation. If the model looks rotated 90° about X, something is
  re-applying or dropping the correction — but per the trace it should be correct.
- The mock fixture repeats the same `model3dUrl` and name across all depths; real data
  has distinct URLs per part. `partId` is depth-path based to stay unique regardless.
- Draco is handled (`src/io.js`). Meshopt is NOT yet — a Meshopt-compressed part would
  fail `io.read` until `EXTMeshoptCompression` + the `meshoptimizer` decoder are added.

## Background (monorepo source — rationale only, NOT a dependency)

These files in `~/Documents/field-activity-planner` explain *why* the matrix is directly
applicable. They are reference only; this package must never import from the monorepo.
- `common/libraries/three/utils/modelQuaternion.js:5` — correction = +90°X.
- `backends/fieldtwinapi/routes/API.v1.9/subProject/API.utils.v1.9.subProject.outputs.js:30-73`
- `backends/fieldtwinapi/routes/API.v1.9/API.utils.v1.9.output.js:330-378`
- `common/libraries/three/visualizer/objects/StagedAssetMesh.js:982`
- Mock source: `APItest/__mocks__/v1.10/stagedAssets/staged-smart-asset--OP5jKjeGPz619z_4b_m.json`
