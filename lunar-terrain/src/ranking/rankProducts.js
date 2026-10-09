import { MOON_RADIUS_METERS } from '../site/moonSite.js'

/**
 * @typedef {import('../catalog/catalog.js').CatalogProduct} CatalogProduct
 * @typedef {import('../catalog/catalog.js').Footprint} Footprint
 * @typedef {import('../site/moonSite.js').Site} Site
 * @typedef {import('../site/moonSite.js').LatLon} LatLon
 */

/**
 * @typedef {Object} RankedProduct
 * @property {CatalogProduct} product
 * @property {boolean} meetsTarget - Fine enough for the chosen upload quality
 */

// A file slightly coarser than the target (e.g. 40 m for a 39 m target) looks the same once gridded
const TARGET_TOLERANCE = 1.1

/**
 * The files that fully cover the site, best choice first. Once a file is fine enough for the upload grid,
 * the grid decides what the terrain looks like, so among those the smallest download wins. Files too
 * coarse for the grid come last, finest first.
 * @param {CatalogProduct[]} products
 * @param {Site} site
 * @param {number} gridSize - The upload Quality: grid cells along the longer side (64, 128, 256 or 512)
 * @returns {RankedProduct[]}
 */
export function rankProducts(products, site, gridSize) {
  const targetResolution = targetResolutionMeters(site, gridSize)
  const ranked = products
    .filter((product) => coversSite(product.footprint, site.points))
    .map((product) => ({ product, meetsTarget: product.resolutionMeters <= targetResolution * TARGET_TOLERANCE }))
  return ranked.sort((a, b) => {
    if (a.meetsTarget !== b.meetsTarget) {
      return a.meetsTarget ? -1 : 1
    }
    if (a.meetsTarget) {
      return a.product.bytes - b.product.bytes || b.product.resolutionMeters - a.product.resolutionMeters
    }
    return a.product.resolutionMeters - b.product.resolutionMeters || a.product.bytes - b.product.bytes
  })
}

/**
 * @param {Site} site
 * @param {number} gridSize
 * @returns {number} The grid spacing the upload will produce for this site
 */
export function targetResolutionMeters(site, gridSize) {
  return site.widthMeters / gridSize
}

/**
 * @param {Footprint} footprint
 * @param {LatLon[]} points
 * @returns {boolean} Whether every point is inside the file's grid
 */
export function coversSite(footprint, points) {
  if (footprint.kind === 'polar') {
    return points.every((point) => insidePolarGrid(footprint.pole, footprint.halfWidthMeters, point))
  }
  return points.every((point) => {
    const longitude = ((point.longitude % 360) + 360) % 360
    return (
      point.latitude >= footprint.south &&
      point.latitude <= footprint.north &&
      longitude >= footprint.west &&
      longitude <= footprint.east
    )
  })
}

/**
 * Tests a point against the square polar stereographic grid (spherical, true at the pole) of a polar product.
 * @param {'north' | 'south'} pole
 * @param {number} halfWidthMeters
 * @param {LatLon} point
 * @returns {boolean}
 */
function insidePolarGrid(pole, halfWidthMeters, point) {
  const toRadians = Math.PI / 180
  const colatitude = (pole === 'south' ? 90 + point.latitude : 90 - point.latitude) * toRadians
  const radius = 2 * MOON_RADIUS_METERS * Math.tan(colatitude / 2)
  const longitude = point.longitude * toRadians
  return (
    Math.abs(radius * Math.sin(longitude)) <= halfWidthMeters &&
    Math.abs(radius * Math.cos(longitude)) <= halfWidthMeters
  )
}
