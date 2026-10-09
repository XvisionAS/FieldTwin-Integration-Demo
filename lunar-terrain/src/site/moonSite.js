/**
 * @typedef {Object} ViewBox - The view box FieldTwin's `viewBox` reply gives, in project CRS coordinates
 * @property {number} x1
 * @property {number} y1
 * @property {number} x2
 * @property {number} y2
 */

/**
 * @typedef {Object} LatLon
 * @property {number} latitude - Degrees, planetocentric
 * @property {number} longitude - Degrees east
 */

/**
 * @typedef {Object} Site
 * @property {LatLon} center
 * @property {LatLon[]} points - Corners and edge midpoints of the view box, to test coverage against
 * @property {number} widthMeters - The larger side of the view box
 */

export const MOON_RADIUS_METERS = 1737400

// Order of the sample points: 4 corners, then the left/right/bottom/top edge midpoints, then the centre
const MID_LEFT = 4
const MID_RIGHT = 5
const MID_BOTTOM = 6
const MID_TOP = 7
const CENTER = 8

/**
 * Whether a project CRS is one of the IAU 2015 Moon CRSs (body code 301).
 * @param {string} crs
 * @returns {boolean}
 */
export function isMoonCRS(crs) {
  return /^IAU_2015:301\d{2}$/i.test(crs)
}

/**
 * Points of the view box to reproject: corners, edge midpoints and centre, as [x, y] in project coordinates.
 * @param {ViewBox} viewBox
 * @returns {number[][]}
 */
export function viewBoxSamplePoints({ x1, y1, x2, y2 }) {
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  return [
    [x1, y1],
    [x2, y1],
    [x2, y2],
    [x1, y2],
    [x1, midY],
    [x2, midY],
    [midX, y1],
    [midX, y2],
    [midX, midY],
  ]
}

/**
 * Describes the site from the view box sample points once reprojected to Moon latitude/longitude.
 * @param {LatLon[]} samples - In the order of viewBoxSamplePoints()
 * @returns {Site}
 */
export function describeSite(samples) {
  const width = greatCircleMeters(samples[MID_LEFT], samples[MID_RIGHT])
  const height = greatCircleMeters(samples[MID_BOTTOM], samples[MID_TOP])
  return {
    center: samples[CENTER],
    points: samples.slice(0, CENTER),
    widthMeters: Math.max(width, height),
  }
}

/**
 * @param {LatLon} a
 * @param {LatLon} b
 * @returns {number} Distance along the Moon's surface
 */
export function greatCircleMeters(a, b) {
  const toRadians = Math.PI / 180
  const dLat = (b.latitude - a.latitude) * toRadians
  const dLon = (b.longitude - a.longitude) * toRadians
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * toRadians) * Math.cos(b.latitude * toRadians) * Math.sin(dLon / 2) ** 2
  return 2 * MOON_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)))
}
