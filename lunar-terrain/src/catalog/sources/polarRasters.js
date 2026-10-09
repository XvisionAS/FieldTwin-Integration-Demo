import { describeFootprint, formatResolution } from './pdsLola.js'

/**
 * @typedef {import('../catalog.js').CatalogProduct} CatalogProduct
 * @typedef {import('../catalog.js').CatalogSource} CatalogSource
 * @typedef {import('../catalog.js').ProductKind} ProductKind
 */

/**
 * @typedef {Object} PolarRaster - A polar GeoTIFF, as measured with gdalinfo and a HEAD request
 * @property {string} url
 * @property {ProductKind} kind
 * @property {string} [label] - Tells apart files of one kind with the same coverage, e.g. 'Summer maximum'
 * @property {'south' | 'north'} pole
 * @property {number} latitudeLimit
 * @property {number} halfWidthMeters - Half the side of the square grid centred on the pole
 * @property {number} resolutionMeters
 * @property {number} bytes
 * @property {string} unit - Of the values FieldTwin reads
 */

const SOURCE_ID = 'polar-rasters'
const PGDA = 'https://pgda.gsfc.nasa.gov/data/'
const DIVINER = 'https://luna1.diviner.ucla.edu/~jpierre/diviner/level4_polar/'
const USGS = 'https://planetarymaps.usgs.gov/mosaic/Lunar_Research/IceFavorabilityIndex/'

// The Mazarico et al. (2011, 2016 release) illumination grids, one per pole and latitude limit
const PGDA_GRIDS = [
  { pole: 'south', name: '85S_060M', latitudeLimit: -85, halfWidthMeters: 151740, resolutionMeters: 60 },
  { pole: 'south', name: '75S_120M', latitudeLimit: -75, halfWidthMeters: 457440, resolutionMeters: 120 },
  { pole: 'south', name: '65S_240M', latitudeLimit: -65, halfWidthMeters: 770400, resolutionMeters: 240 },
  { pole: 'north', name: '85N_060M', latitudeLimit: 85, halfWidthMeters: 151740, resolutionMeters: 60 },
  { pole: 'north', name: '75N_120M', latitudeLimit: 75, halfWidthMeters: 457440, resolutionMeters: 120 },
  { pole: 'north', name: '65N_240M', latitudeLimit: 65, halfWidthMeters: 770400, resolutionMeters: 240 },
]
/** @type {Record<string, [number, number, number]>} Download sizes: sunlight, Earth visibility, shadow */
const PGDA_BYTES = {
  '85S_060M': [33994464, 24862958, 656183],
  '75S_120M': [83052039, 43148153, 1046706],
  '65S_240M': [60394652, 22963503, 582074],
  '85N_060M': [36856252, 29073989, 824237],
  '75N_120M': [85114777, 45957495, 1105159],
  '65N_240M': [61184010, 23239031, 613892],
}
// Diviner grids of the south pole only: the north files are georeferenced on the south pole by mistake
const DIVINER_SOUTH = { pole: 'south', latitudeLimit: -80, halfWidthMeters: 304005, resolutionMeters: 240.04 }

/** @type {PolarRaster[]} */
export const POLAR_RASTERS = [
  ...PGDA_GRIDS.flatMap(({ name, ...grid }) => [
    { ...grid, kind: 'illumination', url: `${PGDA}MoonIllumination/AVGVISIB_${name}_201608.TIF`, bytes: PGDA_BYTES[name][0], unit: 'fraction' },
    { ...grid, kind: 'earth-visibility', url: `${PGDA}MoonIllumination/AVGVISIB_${name}_201608_EARTH.TIF`, bytes: PGDA_BYTES[name][1], unit: 'fraction' },
    { ...grid, kind: 'shadow', url: `${PGDA}MoonIllumination/LPSR_${name}_201608.TIF`, bytes: PGDA_BYTES[name][2], unit: 'none' },
  ]),
  // Permanent shadow from the 20 m LOLA terrain, in IAU_2015:30135/30130 themselves. South pole: Barker et al.
  // (2023). North pole: Barker et al. (2025).
  { kind: 'shadow', url: `${PGDA}LOLA_20mpp/LPSR_80S_20MPP_ADJ.TIF`, pole: 'south', latitudeLimit: -80, halfWidthMeters: 304000, resolutionMeters: 20, bytes: 154221202, unit: 'none' },
  { kind: 'shadow', url: `${PGDA}LOLA_20mpp_NP/LPSR_80N_20MPP_ADJ.TIF`, pole: 'north', latitudeLimit: 80, halfWidthMeters: 304000, resolutionMeters: 20, bytes: 128792644, unit: 'none' },
  { ...DIVINER_SOUTH, kind: 'temperature', label: 'Summer maximum', url: `${DIVINER}additional_maps/polar_south_80_summer_max-float.tif`, bytes: 25686193, unit: 'kelvin' },
  { ...DIVINER_SOUTH, kind: 'temperature', label: 'Winter minimum', url: `${DIVINER}additional_maps/polar_south_80_winter_min-float.tif`, bytes: 25686193, unit: 'kelvin' },
  { ...DIVINER_SOUTH, kind: 'ice-depth', url: `${DIVINER}24x6_240m/additional_maps/polar_south_80_zit_float32.tif`, bytes: 25702843, unit: 'meter' },
  // Polar stereographic with a -70/70 standard parallel, so the grid is a little wider on the ground than this
  { kind: 'ice-favorability', url: `${USGS}Moon_IceFavorabilityIndex_90S000E_591mp.tif`, pole: 'south', latitudeLimit: -80, halfWidthMeters: 295481, resolutionMeters: 590.96, bytes: 4003661, unit: 'none' },
  { kind: 'ice-favorability', url: `${USGS}Moon_IceFavorabilityIndex_90N000E_591mp.tif`, pole: 'north', latitudeLimit: 80, halfWidthMeters: 295481, resolutionMeters: 590.96, bytes: 4003661, unit: 'none' },
]

/**
 * Polar GeoTIFFs from NASA GSFC's PGDA (illumination, Earth visibility, permanent shadow), UCLA's Diviner
 * polar maps (temperature, ice table depth) and USGS (ice favorability). None of these servers lists its
 * files, so they are a fixed list, measured with gdalinfo and HEAD requests on 2026-09-28. Unlike the LOLA
 * JPEG 2000 files, they carry their scale and missing-value marker (or are plain floats with NaN for missing),
 * which FieldTwin's upload applies, so FieldTwin reads the real values.
 * @type {CatalogSource}
 */
export const polarRastersSource = {
  id: SOURCE_ID,
  name: 'Polar value maps (NASA GSFC PGDA, UCLA Diviner, USGS)',
  homepage: 'https://pgda.gsfc.nasa.gov/products/69',
  listProducts: async () => POLAR_RASTERS.map(toProduct),
}

/**
 * @param {PolarRaster} raster
 * @returns {CatalogProduct}
 */
export function toProduct({ url, kind, label, pole, latitudeLimit, halfWidthMeters, resolutionMeters, bytes, unit }) {
  const footprint = { kind: 'polar', pole, latitudeLimit, halfWidthMeters }
  const coverage = `${describeFootprint(footprint)}, ${formatResolution(resolutionMeters)}`
  const fileName = url.split('/').pop()
  return {
    id: `${SOURCE_ID}:${fileName.replace(/\.tif$/i, '').toLowerCase()}`,
    source: SOURCE_ID,
    kind,
    name: label ? `${label}, ${coverage}` : coverage,
    downloadUrl: url,
    bytes,
    resolutionMeters,
    footprint,
    values: { scale: 1, offset: 0, unit },
  }
}
