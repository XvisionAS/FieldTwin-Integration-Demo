import { mapWithConcurrency } from '../mapWithConcurrency.js'
import { parsePds3Label, parseQuantity } from '../pds3Label.js'

/**
 * @typedef {import('../pds3Label.js').Pds3Label} Pds3Label
 * @typedef {import('../catalog.js').CatalogProduct} CatalogProduct
 * @typedef {import('../catalog.js').CatalogSource} CatalogSource
 * @typedef {import('../catalog.js').Footprint} Footprint
 * @typedef {import('../catalog.js').FetchText} FetchText
 */

/**
 * @typedef {Object} ListingFile
 * @property {string} name - File name as listed, e.g. 'ldem_875s_20m.jp2'
 * @property {string} url - Absolute URL of the file
 * @property {number} bytes
 */

const BASE_URL = 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/'
const FOLDERS = ['cylindrical/jp2/', 'polar/jp2/']
const SOURCE_ID = 'pds-lola'
// The LOLA gridded products worth a layer, by file prefix. Albedo and roughness counts (ldac, ldrc) are left out.
/** @type {Record<string, import('../catalog.js').ProductKind>} */
const KIND_BY_PREFIX = {
  ldem: 'elevation',
  ldsm: 'slope',
  ldrm: 'roughness',
  ldam: 'albedo',
  ldec: 'shot-count',
}
// Global (ldem_4), polar (ldsm_85s_40m) and tile (ldem_1024_00n_15n_000_030) names; variants with a suffix
// (ldsm_16_rg, ldrm_32_25, ldrm_40s_1000m_nn) are alternative computations of the same product and are skipped
const PRODUCT_NAME = /^(ldem|ldsm|ldrm|ldam|ldec)_(\d+|\d+[ns]_\d+m|\d+_\d{2}[ns]_\d{2}[ns]_\d{3}_\d{3})\.jp2$/i
// Fetching ~200 small labels; keep the PDS server load polite
const LABEL_FETCH_CONCURRENCY = 8

/**
 * LOLA gridded elevation, slope, roughness, albedo and shot count products from PDS Geosciences, as
 * single-file JPEG 2000 downloads.
 * @type {CatalogSource}
 */
export const pdsLolaSource = {
  id: SOURCE_ID,
  name: 'LRO LOLA gridded data records (PDS Geosciences)',
  homepage: BASE_URL,
  listProducts,
}

/**
 * @param {FetchText} fetchText
 * @returns {Promise<CatalogProduct[]>}
 */
async function listProducts(fetchText) {
  /** @type {ListingFile[]} */
  let files = []
  for (const folder of FOLDERS) {
    const folderUrl = BASE_URL + folder
    files = files.concat(parseDirectoryListing(await fetchText(folderUrl), folderUrl))
  }
  const productFiles = files.filter((file) => PRODUCT_NAME.test(file.name))
  return mapWithConcurrency(productFiles, LABEL_FETCH_CONCURRENCY, async (file) => {
    const labelUrl = file.url.replace(/\.jp2$/i, '_jp2.lbl')
    return toProduct(file, parsePds3Label(await fetchText(labelUrl)))
  })
}

/**
 * Reads the files of an IIS directory listing page (the format PDS Geosciences serves).
 * Folders and the parent link carry no size and are skipped.
 * @param {string} html
 * @param {string} pageUrl
 * @returns {ListingFile[]}
 */
export function parseDirectoryListing(html, pageUrl) {
  const files = []
  for (const match of html.matchAll(/(\d+)\s+<A HREF="([^"]+)">([^<]+)<\/A>/gi)) {
    files.push({ name: match[3], url: new URL(match[2], pageUrl).href, bytes: Number(match[1]) })
  }
  return files
}

/**
 * Builds the catalog entry for one LOLA JPEG 2000 file from its listing entry and its `_jp2.lbl` label.
 * @param {ListingFile} file
 * @param {Pds3Label} label
 * @returns {CatalogProduct}
 */
export function toProduct(file, label) {
  const productName = file.name.replace(/\.jp2$/i, '').toLowerCase()
  const kind = KIND_BY_PREFIX[productName.slice(0, 4)]
  if (!kind) {
    throw new Error(`Unrecognised LOLA product: ${productName}`)
  }
  const projection = requireObject(label, 'IMAGE_MAP_PROJECTION', productName)
  const image = requireObject(requireObject(label, 'UNCOMPRESSED_FILE', productName), 'IMAGE', productName)
  const compressed = requireObject(label, 'COMPRESSED_FILE', productName)
  const resolutionMeters = toMeters(parseQuantity(requireValue(projection, 'MAP_SCALE', productName)), productName)
  const footprint =
    requireValue(projection, 'MAP_PROJECTION_TYPE', productName) === 'POLAR STEREOGRAPHIC'
      ? polarFootprint(projection, image, resolutionMeters, productName)
      : boxFootprint(productName, projection)

  return {
    id: `${SOURCE_ID}:${productName}`,
    source: SOURCE_ID,
    kind,
    name: `${describeFootprint(footprint)}, ${formatResolution(resolutionMeters)}`,
    downloadUrl: file.url,
    bytes: file.bytes,
    resolutionMeters,
    footprint,
    values: sampleEncoding(compressed, image),
  }
}

/**
 * Reads how the JPEG 2000 samples encode values. Each keyword comes from the label's COMPRESSED_FILE
 * object. The tile labels give them only in UNCOMPRESSED_FILE IMAGE. That object is the fallback for each
 * missing keyword. The file itself doesn't carry this: the scale and offset are only in the side-car
 * _aux.xml and the missing-value marker only in the label, and a single-file upload sees neither.
 * @param {Pds3Label} compressed - The label's COMPRESSED_FILE object
 * @param {Pds3Label} image - The label's UNCOMPRESSED_FILE IMAGE object
 * @returns {import('../catalog.js').SampleEncoding}
 */
function sampleEncoding(compressed, image) {
  /** @param {string} keyword */
  const number = (keyword) => optionalNumber(compressed, keyword) ?? optionalNumber(image, keyword)
  const unit = compressed.UNIT ?? image.UNIT
  /** @type {import('../catalog.js').SampleEncoding} */
  const values = {
    scale: number('SCALING_FACTOR') ?? 1,
    offset: number('OFFSET') ?? 0,
    unit: typeof unit === 'string' ? unit.toLowerCase() : 'none',
  }
  const missing = number('MISSING_CONSTANT')
  if (missing !== undefined) {
    values.missing = missing
  }
  return values
}

/**
 * @param {Pds3Label} label
 * @param {string} keyword
 * @returns {number | undefined}
 */
function optionalNumber(label, keyword) {
  const value = label[keyword]
  return typeof value === 'string' ? parseQuantity(value).value : undefined
}

/**
 * @param {Pds3Label} projection
 * @param {Pds3Label} image
 * @param {number} resolutionMeters
 * @param {string} productName
 * @returns {Footprint}
 */
function polarFootprint(projection, image, resolutionMeters, productName) {
  const isSouth = parseQuantity(requireValue(projection, 'CENTER_LATITUDE', productName)).value < 0
  const latitudeLimit = parseQuantity(
    requireValue(projection, isSouth ? 'MAXIMUM_LATITUDE' : 'MINIMUM_LATITUDE', productName)
  ).value
  const widthPixels = parseQuantity(requireValue(image, 'LINE_SAMPLES', productName)).value
  // The grid is a square centred on the pole, so it reaches past latitudeLimit in its corners
  return {
    kind: 'polar',
    pole: isSouth ? 'south' : 'north',
    latitudeLimit,
    halfWidthMeters: (widthPixels * resolutionMeters) / 2,
  }
}

/**
 * @param {string} productName
 * @param {Pds3Label} projection
 * @returns {Footprint}
 */
function boxFootprint(productName, projection) {
  const south = parseQuantity(requireValue(projection, 'MINIMUM_LATITUDE', productName)).value
  const north = parseQuantity(requireValue(projection, 'MAXIMUM_LATITUDE', productName)).value
  // Tiles are named <prefix>_<res>_<lat>_<lat>_<lon>_<lon>. Their JPEG 2000 labels give longitudes shifted
  // by 180 degrees, while the files' own georeferencing matches the name, so the name is the reference.
  const tile = productName.match(/^[a-z]{4}_\d+_\d{2}[ns]_\d{2}[ns]_(\d{3})_(\d{3})$/)
  if (tile) {
    return { kind: 'box', south, north, west: Number(tile[1]), east: Number(tile[2]) }
  }
  if (/^[a-z]{4}_\d+$/.test(productName)) {
    return { kind: 'box', south, north, west: 0, east: 360 }
  }
  throw new Error(`Unrecognised cylindrical LOLA product name: ${productName}`)
}

/**
 * @param {import('../pds3Label.js').Quantity} scale
 * @param {string} productName
 * @returns {number}
 */
function toMeters(scale, productName) {
  if (scale.unit === 'km/pix') {
    return scale.value * 1000
  }
  if (scale.unit === 'm/pix') {
    return scale.value
  }
  throw new Error(`Unexpected MAP_SCALE unit "${scale.unit}" in ${productName}`)
}

/**
 * @param {Footprint} footprint
 * @returns {string}
 */
export function describeFootprint(footprint) {
  if (footprint.kind === 'polar') {
    return `${footprint.pole === 'south' ? 'South' : 'North'} pole to ${formatLatitude(footprint.latitudeLimit)}`
  }
  if (footprint.west === 0 && footprint.east === 360 && footprint.south === -90 && footprint.north === 90) {
    return 'Global'
  }
  return `${formatLatitude(footprint.south)} to ${formatLatitude(footprint.north)}, ${footprint.west}°E to ${footprint.east}°E`
}

/**
 * @param {number} latitude
 * @returns {string}
 */
function formatLatitude(latitude) {
  if (latitude === 0) {
    return '0°'
  }
  return latitude > 0 ? `${latitude}°N` : `${-latitude}°S`
}

/**
 * @param {number} meters
 * @returns {string}
 */
export function formatResolution(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km/px` : `${Math.round(meters)} m/px`
}

/**
 * @param {Pds3Label} label
 * @param {string} name
 * @param {string} productName
 * @returns {Pds3Label}
 */
function requireObject(label, name, productName) {
  const value = label[name]
  if (typeof value !== 'object') {
    throw new Error(`Missing OBJECT ${name} in the label of ${productName}`)
  }
  return value
}

/**
 * @param {Pds3Label} label
 * @param {string} keyword
 * @param {string} productName
 * @returns {string}
 */
function requireValue(label, keyword, productName) {
  const value = label[keyword]
  if (typeof value !== 'string') {
    throw new Error(`Missing ${keyword} in the label of ${productName}`)
  }
  return value
}
