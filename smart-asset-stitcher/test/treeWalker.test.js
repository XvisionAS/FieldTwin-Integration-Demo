import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { flattenParts, listStagedAssets } from '../src/treeWalker.js'

const fixtureUrl = new URL('./fixtures/staged-smart-asset.json', import.meta.url)

/** @returns {Promise<import('../src/treeWalker.js').StagedAsset>} */
async function loadFixture() {
  return JSON.parse(await readFile(fileURLToPath(fixtureUrl), 'utf8'))
}

test('flattenParts collects every placeable node and skips the empty leaf', async () => {
  const stagedAsset = await loadFixture()
  const { parts, skippedNodes } = flattenParts(stagedAsset)

  // The base object plus a 7-deep chain; the final leaf has empty params and no model.
  assert.equal(parts.length, 8)
  assert.equal(parts.filter((p) => !p.isBase).length, 7)
  assert.equal(skippedNodes, 1)
})

test('flattenParts prepends the base object with a synthesized matrix', async () => {
  const stagedAsset = await loadFixture()
  const { parts } = flattenParts(stagedAsset)

  const base = parts[0]
  assert.equal(base.isBase, true)
  assert.equal(base.partId, 'base')
  assert.equal(base.model3dUrl, stagedAsset.asset.model3dUrl)
  assert.equal(base.transformMatrix.length, 16)
  // No transformMatrix exists for the base in the API; it is built from initialState,
  // whose x/y/z (after the FieldTwin axis swap + correction) land in slots 12/13/14.
  const is = stagedAsset.initialState
  assert.ok(Math.abs(base.transformMatrix[12] - is.x) < 1e-6)
  assert.ok(Math.abs(base.transformMatrix[13] - is.y) < 1e-6)
  assert.ok(Math.abs(base.transformMatrix[14] - is.z) < 1e-6)
})

test('flattenParts omits the base when the staged asset has no base model', async () => {
  const stagedAsset = await loadFixture()
  const { asset, ...withoutAsset } = stagedAsset
  const { parts } = flattenParts(withoutAsset)
  assert.ok(parts.every((p) => !p.isBase))
})

test('flattenParts produces unique partIds even when names/docking repeat', async () => {
  const stagedAsset = await loadFixture()
  const { parts } = flattenParts(stagedAsset)
  const ids = parts.map((p) => p.partId)
  assert.equal(new Set(ids).size, ids.length)
})

test('each part carries a 16-element matrix whose translation matches the node x/y/z', async () => {
  const stagedAsset = await loadFixture()
  const { parts } = flattenParts(stagedAsset)
  for (const part of parts) {
    assert.equal(part.transformMatrix.length, 16)
    assert.equal(typeof part.model3dUrl, 'string')
    assert.equal(part.localPath, null)
  }

  // Slots 12/13/14 of a column-major matrix are the translation; the API also reports
  // them as initialState.x/y/z on the first metaData node.
  const firstPart = parts.find((p) => !p.isBase)
  const initial = stagedAsset.metaData[0].params.initialState
  assert.ok(Math.abs(firstPart.transformMatrix[12] - initial.x) < 1e-9)
  assert.ok(Math.abs(firstPart.transformMatrix[13] - initial.y) < 1e-9)
  assert.ok(Math.abs(firstPart.transformMatrix[14] - initial.z) < 1e-9)
})

test('flattenParts tolerates an empty / missing metaData array', () => {
  assert.deepEqual(flattenParts({}), { parts: [], skippedNodes: 0 })
  assert.deepEqual(flattenParts({ metaData: [] }), { parts: [], skippedNodes: 0 })
})

test('listStagedAssets returns the keyed staged assets in stable id order', () => {
  const subProject = {
    stagedAssets: {
      b: { id: 'b', name: 'Beta' },
      a: { id: 'a', name: 'Alpha' },
    },
  }
  const list = listStagedAssets(subProject)
  assert.deepEqual(
    list.map((s) => s.id),
    ['a', 'b']
  )
})

test('listStagedAssets tolerates a missing or empty stagedAssets map', () => {
  assert.deepEqual(listStagedAssets({}), [])
  assert.deepEqual(listStagedAssets({ stagedAssets: {} }), [])
  assert.deepEqual(listStagedAssets(undefined), [])
})
