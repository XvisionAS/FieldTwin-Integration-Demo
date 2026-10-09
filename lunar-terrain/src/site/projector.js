/** @typedef {import('./moonSite.js').LatLon} LatLon */

// Moon (2015) sphere, planetocentric latitude/longitude
const MOON_GEOGRAPHIC_CRS = 'IAU_2015:30100'
// Points per projector request, so a big site's shapes don't make one huge request body
const TRANSFORM_BATCH_SIZE = 5000

/**
 * Reprojects project-CRS points to Moon latitude/longitude with FieldTwin's projector service.
 * @param {string} projectorUrl - The `projectorUrl` of the `loaded` message, e.g. 'https://backend.x.fieldtwin.com/projector'
 * @param {string} projectCRS
 * @param {number[][]} points - [x, y] in the project CRS
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<LatLon[]>}
 */
export async function toMoonLatLon(projectorUrl, projectCRS, points, fetchImpl = fetch) {
  const transformed = await transform(projectorUrl, projectCRS, MOON_GEOGRAPHIC_CRS, points, fetchImpl)
  // The projector answers in the target CRS's axis order, which is latitude first ("ne") for IAU_2015:30100
  return transformed.map(([latitude, longitude]) => ({ latitude, longitude }))
}

/**
 * Reprojects Moon latitude/longitude to project-CRS [x, y] with FieldTwin's projector service.
 * @param {string} projectorUrl
 * @param {string} projectCRS - A projected Moon CRS, whose axes are easting then northing
 * @param {LatLon[]} positions
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<number[][]>}
 */
export function fromMoonLatLon(projectorUrl, projectCRS, positions, fetchImpl = fetch) {
  const points = positions.map(({ latitude, longitude }) => [latitude, longitude])
  return transform(projectorUrl, MOON_GEOGRAPHIC_CRS, projectCRS, points, fetchImpl)
}

/**
 * @param {string} projectorUrl
 * @param {string} source
 * @param {string} target
 * @param {number[][]} points - In the source CRS's axis order
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<number[][]>} In the target CRS's axis order
 */
async function transform(projectorUrl, source, target, points, fetchImpl) {
  /** @type {number[][]} */
  let transformed = []
  for (let start = 0; start < points.length; start += TRANSFORM_BATCH_SIZE) {
    const response = await fetchImpl(`${projectorUrl.replace(/\/$/, '')}/transform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, target, points: points.slice(start, start + TRANSFORM_BATCH_SIZE) }),
    })
    if (!response.ok) {
      throw new Error(`The projector could not convert ${source} to ${target} (HTTP ${response.status})`)
    }
    transformed = transformed.concat(await response.json())
  }
  return transformed
}
