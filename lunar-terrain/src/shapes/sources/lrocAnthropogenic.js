import { roundCoordinate } from './iauNomenclature.js'

/**
 * @typedef {import('./iauNomenclature.js').GdalFeature} GdalFeature
 * @typedef {import('./iauNomenclature.js').PointDataset} PointDataset
 */

export const LROC_ANTHROPOGENIC_URL =
  'https://pds.lroc.im-ldi.com/data/LRO-L-LROC-5-RDR-V1.0/LROLRC_2001/EXTRAS/SHAPEFILE/ANTHROPOGENIC_OBJECTS/ANTHROPOGENIC_OBJECTS_180.ZIP'
export const LROC_ANTHROPOGENIC_LAYER = 'ANTHROPOGENIC_OBJECTS_180'
export const LROC_ANTHROPOGENIC_FIELDS = [
  'OBJECT_ID',
  'SHORT_NAME',
  'MISSION',
  'OBJECT',
  'LATITUDE',
  'LONGITUDE',
  'UNCERTAIN',
  'COORD_SRC',
]

// The source's own object descriptions ('Descent stage of Lunar Module "Eagle"', 'Retroreflector: Lunokhod 1 rover',
// ...) grouped into a few types to tag by. Checked in this order: an impact site of a lander stage is an impact site.
const OBJECT_TYPES = [
  { type: 'Impact site', pattern: /impact/i },
  { type: 'Rover', pattern: /rover|roving/i },
  { type: 'Lander', pattern: /lander|lunar module/i },
]
const OTHER_TYPE = 'Surface experiment'

/**
 * Builds the bundled landing-sites dataset from LROC's coordinates of anthropogenic features on the Moon
 * (landers, rovers, experiments and impact sites, measured on LROC NAC images), as read by GDAL.
 * @param {GdalFeature[]} gdalFeatures
 * @param {Date} [now]
 * @returns {PointDataset}
 */
export function buildLandingSites(gdalFeatures, now = new Date()) {
  const features = gdalFeatures.map(({ properties }) => ({
    id: `lroc:${properties.OBJECT_ID}`,
    name: String(properties.SHORT_NAME),
    type: objectType(String(properties.OBJECT)),
    diameterKm: 0,
    latitude: roundCoordinate(Number(properties.LATITUDE)),
    longitude: roundCoordinate(Number(properties.LONGITUDE)),
    description: describeObject(properties),
    attributes: {
      mission: String(properties.MISSION),
      object: String(properties.OBJECT),
      uncertainty_m: Number(properties.UNCERTAIN) || 0,
    },
  }))
  features.sort((a, b) => a.name.localeCompare(b.name))
  return {
    id: 'lroc-landing-sites',
    name: 'Landing sites',
    source: LROC_ANTHROPOGENIC_URL,
    citation: 'Wagner, R.V., et al. (2017), Coordinates of anthropogenic features on the Moon, Icarus 283, 92-103, doi:10.1016/j.icarus.2016.05.011; LROC',
    generatedAt: now.toISOString(),
    features,
  }
}

/**
 * e.g. 'Descent stage of Lunar Module "Eagle", Apollo 11. Position from NAC DTM, within 0.3 m.'
 * @param {Record<string, string | number | null>} properties
 * @returns {string}
 */
function describeObject(properties) {
  const uncertainty = Number(properties.UNCERTAIN) || 0
  // Laser-ranged retroreflectors are listed with no uncertainty
  const accuracy = uncertainty > 0 ? `, within ${uncertainty} m` : ''
  return `${properties.OBJECT}, ${properties.MISSION}. Position from ${properties.COORD_SRC}${accuracy}.`
}

/**
 * @param {string} object
 * @returns {string}
 */
function objectType(object) {
  return OBJECT_TYPES.find(({ pattern }) => pattern.test(object))?.type || OTHER_TYPE
}
