import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildDescription } from '../src/description.js'

const stagedAsset = {
  id: '-OP5jKjeGPz619z_4b_m',
  name: 'TBE-SMART #1',
  asset: {
    id: '-OP5hZrFGqswXDGsXAkA',
    name: 'TBE-SMART',
    model3dUrl: 'https://example/base.glb',
    dockingFemale: { name: '001', matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 0, 4, 1] },
    dockingMales: [{ name: '001', matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 4, 4, 1] }],
  },
}

const parts = [
  {
    assetName: 'TBE-SMART',
    partId: '001',
    docking: '001',
    model3dUrl: 'https://example/part0.glb',
    transformMatrix: new Array(16).fill(0),
    localPath: '/tmp/out/parts/0_001.glb',
  },
]

const meta = {
  projectId: 'p',
  subProjectId: 'sp',
  streamId: 's',
  outputGlb: 'stitched.glb',
  skippedNodes: 1,
  generatedAt: '2026-06-02T00:00:00.000Z',
}

test('buildDescription records source ids, base asset and per-part placement', () => {
  const description = buildDescription(stagedAsset, parts, meta)

  assert.equal(description.stagedAssetId, '-OP5jKjeGPz619z_4b_m')
  assert.equal(description.stagedAssetName, 'TBE-SMART #1')
  assert.equal(description.projectId, 'p')
  assert.equal(description.outputGlb, 'stitched.glb')
  assert.equal(description.matrixConvention, 'column-major')
  assert.equal(description.correctionApplied, 'baked-in-by-api')
  assert.equal(description.skippedNodes, 1)

  assert.equal(description.baseAsset.assetId, '-OP5hZrFGqswXDGsXAkA')
  assert.equal(description.baseAsset.model3dUrl, 'https://example/base.glb')
  assert.equal(description.baseAsset.dockingMales[0].name, '001')

  assert.equal(description.parts.length, 1)
  assert.equal(description.parts[0].localFile, '0_001.glb')
  assert.equal(description.parts[0].transformMatrix.length, 16)
})

test('buildDescription emits null localFile when a part was not downloaded', () => {
  const undownloaded = [{ ...parts[0], localPath: null }]
  const description = buildDescription(stagedAsset, undownloaded, meta)
  assert.equal(description.parts[0].localFile, null)
})
