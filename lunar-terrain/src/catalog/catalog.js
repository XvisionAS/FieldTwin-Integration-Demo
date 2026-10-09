/**
 * @typedef {Object} PolarFootprint
 * @property {'polar'} kind
 * @property {'north' | 'south'} pole
 * @property {number} latitudeLimit - Latitude the grid fully covers down to (e.g. -87.5 for a south cap)
 * @property {number} halfWidthMeters - Half the side of the square polar stereographic grid, centred on the pole
 */

/**
 * @typedef {Object} BoxFootprint
 * @property {'box'} kind
 * @property {number} south - Degrees, planetocentric
 * @property {number} north
 * @property {number} west - Degrees east, 0 to 360
 * @property {number} east - Degrees east, 0 to 360, greater than west
 */

/** @typedef {PolarFootprint | BoxFootprint} Footprint */

/**
 * @typedef {'elevation' | 'slope' | 'roughness' | 'albedo' | 'shot-count' | 'illumination' | 'earth-visibility'
 *   | 'shadow' | 'temperature' | 'ice-depth' | 'ice-favorability'} ProductKind
 */

/**
 * @typedef {Object} SampleEncoding - How the file's samples encode values: value = sample * scale + offset.
 *   FieldTwin's upload reads the raw samples, so scale and offset must be applied by the user (Z Scale for
 *   heights, a conversion for colour scales).
 * @property {number} scale
 * @property {number} offset - For heights, the radius of the sphere they are relative to
 * @property {string} unit - Lower case as in the label, e.g. 'meter', 'degree', 'none'
 * @property {number} [missing] - Sample marking a missing value, to enter as the upload's NODATA
 */

/**
 * @typedef {Object} CatalogProduct
 * @property {string} id - '<source>:<product>', e.g. 'pds-lola:ldem_875s_20m'
 * @property {string} source - Id of the CatalogSource it came from
 * @property {ProductKind} kind - What the file's values are
 * @property {string} name - Human-readable coverage and resolution
 * @property {string} downloadUrl - A single file the FieldTwin 3D surface upload accepts
 * @property {number} bytes - Download size
 * @property {number} resolutionMeters - Grid spacing (at the equator for cylindrical products)
 * @property {Footprint} footprint
 * @property {SampleEncoding} values
 */

/**
 * @callback FetchText
 * @param {string} url
 * @returns {Promise<string>}
 */

/**
 * @typedef {Object} CatalogSource
 * @property {string} id
 * @property {string} name
 * @property {string} homepage
 * @property {(fetchText: FetchText) => Promise<CatalogProduct[]>} listProducts
 */

/**
 * @typedef {Object} Catalog
 * @property {string} generatedAt - ISO date
 * @property {{ id: string, name: string, homepage: string }[]} sources
 * @property {CatalogProduct[]} products - Sorted by id
 */

/**
 * Collects the products of every source into one catalog.
 * @param {CatalogSource[]} sources
 * @param {FetchText} fetchText
 * @param {Date} [now]
 * @returns {Promise<Catalog>}
 */
export async function buildCatalog(sources, fetchText, now = new Date()) {
  /** @type {CatalogProduct[]} */
  let products = []
  for (const source of sources) {
    products = products.concat(await source.listProducts(fetchText))
  }
  products.sort((a, b) => a.id.localeCompare(b.id))
  return {
    generatedAt: now.toISOString(),
    sources: sources.map(({ id, name, homepage }) => ({ id, name, homepage })),
    products,
  }
}
