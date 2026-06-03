import { test } from 'node:test'
import assert from 'node:assert/strict'

import { stagedAssetRootMatrix } from '../src/matrix.js'

test('a rotation-free placement yields T(x,y,z) · correction(+90°X)', () => {
  const m = stagedAssetRootMatrix({ x: 10, y: 20, z: 30, scale: 1, rotation: 0, xRotation: 0, yRotation: 0 })

  // Translation column equals the world (x, y, z) directly (axis swap + correction cancel).
  assert.ok(Math.abs(m[12] - 10) < 1e-9)
  assert.ok(Math.abs(m[13] - 20) < 1e-9)
  assert.ok(Math.abs(m[14] - 30) < 1e-9)

  // Rotation 3×3 is exactly the +90° about X correction (column-major).
  const correction = [1, 0, 0, 0, 0, 1, 0, -1, 0]
  const got = [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]
  for (let i = 0; i < 9; i += 1) {
    assert.ok(Math.abs(got[i] - correction[i]) < 1e-9, `rot[${i}] = ${got[i]}`)
  }
})

test('missing initialState fields default to origin + unit scale', () => {
  const m = stagedAssetRootMatrix({})
  assert.equal(m.length, 16)
  assert.ok(Math.abs(m[12]) < 1e-9 && Math.abs(m[13]) < 1e-9 && Math.abs(m[14]) < 1e-9)
  assert.ok(Math.abs(m[15] - 1) < 1e-9)
})

test('uniform scale is applied', () => {
  const m = stagedAssetRootMatrix({ scale: 2 })
  // First basis column length should reflect the scale factor.
  const len = Math.hypot(m[0], m[1], m[2])
  assert.ok(Math.abs(len - 2) < 1e-9)
})
