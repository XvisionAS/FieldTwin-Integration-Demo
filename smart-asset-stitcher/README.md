# smart-asset-stitcher

Assemble FieldTwin **smart assets** (multi-part 3D models) into a single, self-contained
GLTF/GLB.

A smart asset is a base model plus child parts docked together via
`dockingMale`/`dockingFemale` sockets. The FieldTwin API already computes the final
placement of every part as an absolute 4×4 transform matrix. This tool calls the API,
downloads each part GLB, applies those matrices, and writes one stitched `.glb` plus a
`description.json` manifest recording which file went where.

It works two ways: stitch **specific** staged assets by id, or stitch a **whole
sub-project** at once (omit the ids). Either way it fetches each part GLB only **once** —
a model shared by many staged assets is downloaded a single time into a shared cache.

## Install

```bash
npm install -g smart-asset-stitcher
# or run ad-hoc
npx smart-asset-stitcher ./descriptor.json
```

Requires Node.js >= 20.

## Usage (CLI)

```bash
smart-asset-stitcher <descriptor.json> [--optimize]
```

- `--optimize` runs `dedup` + `prune` on the output to reduce file size.

### Descriptor

```json
{
  "api": "https://your-fieldtwin-host/",
  "token": "<api-token-or-jwt>",
  "projectId": "-LM78qPOH8A5iZFM7GmI",
  "subProjectId": "-LM78xhiiKEWdlr8Ixuj",
  "streamId": "-Npt9mDwxOc-GzO3kTcc",
  "stagedAssetIds": ["-OP5jKjeGPz619z_4b_m"],
  "output": "./out"
}
```

`stagedAssetIds` is **optional**:

- **Present** — stitch exactly those staged assets.
- **Omitted (or `[]`)** — fetch the whole sub-project and stitch every multi-part smart
  asset in it (plain single-model staged assets are skipped).

The `token` is sent in the `token` header to one of:

```
# specific staged asset (when stagedAssetIds is set)
GET {api}/API/v1.10/{projectId}/subProject/{subProjectId}:{streamId}/stagedAssets/{stagedAssetId}

# whole sub-project (when stagedAssetIds is omitted) — one request returns all staged assets
GET {api}/API/v1.10/{projectId}/subProject/{subProjectId}:{streamId}
```

### Output

Part GLBs are downloaded once into a shared, deduped cache; each stitched staged asset gets
its own folder:

```
out/
  assets/<sha1>.glb         # shared part cache — one file per unique URL, reused across assets & runs
  <stagedAssetId>/
    stitched.glb            # the assembled model
    description.json        # manifest (parts, matrices, source URLs, base asset)
```

## Usage (library)

```js
import { orchestrate, loadDescriptor } from 'smart-asset-stitcher'

const descriptor = await loadDescriptor('./descriptor.json')
const results = await orchestrate(descriptor, { log: console.error })
// results: [{ stagedAssetId, outputDir, glbPath, descriptionPath, partCount, skippedNodes }]
```

`orchestrate` handles both modes from the descriptor: with `stagedAssetIds` it stitches
those; without, it fetches the whole sub-project and stitches every smart asset in it. In
both cases parts are downloaded once into `<output>/assets`.

Lower-level building blocks are also exported if you want to assemble your own flow:
`fetchStagedAsset`, `fetchSubProject`, `listStagedAssets`, `flattenParts`, `downloadAll`,
`buildGlb`, `buildDescription`, plus the URL builders `stagedAssetUrl` / `subProjectUrl`.

## How placement works

Each placeable node in the API response carries
`params.initialState.transformMatrix` — a 16-element **column-major** matrix that is an
**absolute world transform**. The API has already baked in the model→FieldTwin
correction (a +90° rotation about X) and the axis swap, so the matrix is applied
**directly** to each part (no transpose, no extra correction) and parts are stitched as
**siblings** under the scene root — never nested — to avoid compounding transforms.

The deepest leaf of a smart-asset chain has empty `params` and no model URL; such nodes
are skipped and counted in `description.json` as `skippedNodes`.

## Develop

```bash
npm install
npm test       # node --test
npm run format # prettier
```

## License

MIT
