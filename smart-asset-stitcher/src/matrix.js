/**
 * Build the staged-asset ROOT world matrix for the base object.
 *
 * The API bakes a `transformMatrix` into every docked `metaData` part but NOT into the
 * base object (`stagedAsset.asset`) — the base only carries the scalar `initialState`
 * placement. The live renderer places the base GLB at the staged-asset root and applies
 * the model→FieldTwin correction (+90° about X) there (see docs/ARCHITECTURE.md §Proof,
 * point 4). We reproduce the same matrix the API would have produced for a node with no
 * docking, following its documented stack order:
 *
 *   M = correction · translation(x, z, −y) · heading · yRot · xRot · scale
 *
 * The FieldTwin→three axis swap (`x, z, −y`) combined with the +90°X correction yields a
 * final translation column equal to the world `(x, y, z)` — verified against a real part
 * whose euler angles are all ~0 (its matrix is exactly `correction · T(x, z, −y)`).
 *
 * @typedef {Object} InitialState
 * @property {number} [x]
 * @property {number} [y]
 * @property {number} [z]
 * @property {number} [scale]
 * @property {number} [rotation] Heading in degrees (about the up axis).
 * @property {number} [xRotation] Tilt in degrees.
 * @property {number} [yRotation] Tilt in degrees.
 *
 * @param {InitialState} initialState
 * @returns {number[]} 16-element, column-major, absolute world matrix.
 */
export function stagedAssetRootMatrix(initialState) {
  const x = num(initialState?.x)
  const y = num(initialState?.y)
  const z = num(initialState?.z)
  const scale = initialState?.scale === undefined ? 1 : num(initialState.scale)
  const heading = deg2rad(num(initialState?.rotation))
  const xRot = deg2rad(num(initialState?.xRotation))
  const yRot = deg2rad(num(initialState?.yRotation))

  let m = CORRECTION
  m = multiply(m, translation(x, z, -y))
  m = multiply(m, rotationY(heading))
  m = multiply(m, rotationY(yRot))
  m = multiply(m, rotationX(xRot))
  m = multiply(m, uniformScale(scale))
  return m
}

/** +90° about X — the model→FieldTwin correction, column-major. */
const CORRECTION = [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1]

/**
 * Coerce to a finite number, defaulting to 0.
 * @param {unknown} v
 * @returns {number}
 */
function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

/**
 * @param {number} deg
 * @returns {number}
 */
function deg2rad(deg) {
  return (deg * Math.PI) / 180
}

/**
 * Column-major 4×4 multiply: returns a · b.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]}
 */
function multiply(a, b) {
  const out = new Array(16).fill(0)
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      let sum = 0
      for (let k = 0; k < 4; k += 1) {
        sum += a[k * 4 + row] * b[col * 4 + k]
      }
      out[col * 4 + row] = sum
    }
  }
  return out
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {number[]}
 */
function translation(x, y, z) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]
}

/**
 * @param {number} a Radians.
 * @returns {number[]}
 */
function rotationX(a) {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]
}

/**
 * @param {number} a Radians.
 * @returns {number[]}
 */
function rotationY(a) {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]
}

/**
 * @param {number} s
 * @returns {number[]}
 */
function uniformScale(s) {
  return [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1]
}
