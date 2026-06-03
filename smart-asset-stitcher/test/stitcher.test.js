import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Document, NodeIO } from '@gltf-transform/core'

import { buildGlb } from '../src/stitcher.js'

/**
 * Create a minimal single-node GLB on disk and return its path.
 *
 * @param {NodeIO} io
 * @param {string} dir
 * @param {string} name
 * @returns {Promise<string>}
 */
async function writeMinimalGlb(io, dir, name) {
  const doc = new Document()
  const scene = doc.createScene(name)
  scene.addChild(doc.createNode(`${name}-root`))
  doc.getRoot().setDefaultScene(scene)
  const path = join(dir, `${name}.glb`)
  await io.write(path, doc)
  return path
}

/**
 * Attach a trivial single-triangle mesh to a node so it survives prune().
 *
 * @param {Document} doc
 * @param {string} name
 * @returns {import('@gltf-transform/core').Node}
 */
function meshedNode(doc, name) {
  const buffer = doc.getRoot().listBuffers()[0] ?? doc.createBuffer()
  const position = doc
    .createAccessor()
    .setType('VEC3')
    .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]))
    .setBuffer(buffer)
  const prim = doc.createPrimitive().setAttribute('POSITION', position)
  const mesh = doc.createMesh(name).addPrimitive(prim)
  return doc.createNode(name).setMesh(mesh)
}

/**
 * Write a GLB whose scene holds a real meshed node plus a FieldTwin helper node
 * (docking-socket marker), to exercise helper stripping.
 *
 * @param {NodeIO} io
 * @param {string} dir
 * @param {string} name
 * @returns {Promise<string>}
 */
async function writeGlbWithHelper(io, dir, name) {
  const doc = new Document()
  const scene = doc.createScene(name)
  scene.addChild(meshedNode(doc, 'real_model'))
  scene.addChild(meshedNode(doc, 'docking_male_001'))
  doc.getRoot().setDefaultScene(scene)
  const path = join(dir, `${name}.glb`)
  await io.write(path, doc)
  return path
}

test('buildGlb places each part as a sibling node with its own matrix', async () => {
  const io = new NodeIO()
  const dir = await mkdtemp(join(tmpdir(), 'sas-stitch-'))
  try {
    const fileA = await writeMinimalGlb(io, dir, 'a')
    const fileB = await writeMinimalGlb(io, dir, 'b')

    const matrixA = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 20, 30, 1]
    const matrixB = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -5, -6, -7, 1]
    const parts = [
      { assetName: 'a', partId: 'p/a', docking: '001', model3dUrl: 'x', transformMatrix: matrixA, localPath: fileA },
      { assetName: 'b', partId: 'p/b', docking: '002', model3dUrl: 'y', transformMatrix: matrixB, localPath: fileB },
    ]

    const outPath = join(dir, 'stitched.glb')
    const result = await buildGlb(parts, outPath)
    assert.equal(result.nodeCount, 2)

    const out = await io.read(outPath)
    const scene = out.getRoot().getDefaultScene()
    // Parts hang off a single frame-root node that applies the FieldTwin→glTF conversion.
    const roots = scene.listChildren()
    assert.equal(roots.length, 1)
    const frameRoot = roots[0]
    assert.equal(frameRoot.getName(), 'fieldtwin-root')
    // The frame root applies the FieldTwin→glTF (−90°X) conversion, column-major.
    const expectedFrame = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]
    frameRoot.getMatrix().forEach((v, i) => assert.ok(Math.abs(v - expectedFrame[i]) < 1e-9))
    const children = frameRoot.listChildren()
    assert.equal(children.length, 2)

    const byName = new Map(children.map((node) => [node.getName(), node.getMatrix()]))
    assert.ok(byName.has('p/a'))
    assert.ok(byName.has('p/b'))
    for (let i = 0; i < 16; i += 1) {
      assert.ok(Math.abs(byName.get('p/a')[i] - matrixA[i]) < 1e-6)
      assert.ok(Math.abs(byName.get('p/b')[i] - matrixB[i]) < 1e-6)
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('buildGlb strips FieldTwin editor helper nodes (sockets, tags)', async () => {
  const io = new NodeIO()
  const dir = await mkdtemp(join(tmpdir(), 'sas-helper-'))
  try {
    const file = await writeGlbWithHelper(io, dir, 'part')
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    const parts = [
      { assetName: 'part', partId: 'p', docking: '001', model3dUrl: 'x', transformMatrix: identity, localPath: file },
    ]

    const outPath = join(dir, 'stitched.glb')
    await buildGlb(parts, outPath)

    const out = await io.read(outPath)
    const names = out
      .getRoot()
      .listNodes()
      .map((n) => n.getName())
    assert.ok(names.includes('real_model'), 'real model kept')
    assert.ok(!names.some((n) => /^docking_male_/.test(n)), 'docking helper removed')
    // keepHelpers retains them.
    const keptPath = join(dir, 'kept.glb')
    await buildGlb(parts, keptPath, { keepHelpers: true })
    const kept = await io.read(keptPath)
    const keptNames = kept
      .getRoot()
      .listNodes()
      .map((n) => n.getName())
    assert.ok(
      keptNames.some((n) => /^docking_male_/.test(n)),
      'docking helper kept with keepHelpers'
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
