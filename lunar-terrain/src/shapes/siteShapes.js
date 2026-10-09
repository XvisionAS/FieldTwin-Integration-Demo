import { MOON_RADIUS_METERS, greatCircleMeters } from '../site/moonSite.js'

/**
 * @typedef {import('../site/moonSite.js').LatLon} LatLon
 * @typedef {import('../site/moonSite.js').Site} Site
 * @typedef {import('../site/moonSite.js').ViewBox} ViewBox
 * @typedef {import('./sources/iauNomenclature.js').PointFeature} PointFeature
 * @typedef {import('./sources/unifiedGeology.js').GeologyDataset} GeologyDataset
 */

/**
 * @typedef {Object} SiteShape - A feature to import as a FieldTwin polygon shape, outlined on the Moon
 * @property {string} id - Stable across downloads, so a new import updates the shapes it made before
 * @property {string} name
 * @property {string} type - Also used as a tag
 * @property {LatLon[]} ring - Closed outline, first point repeated last
 * @property {string} [description] - Becomes the shape's description
 * @property {Record<string, string | number>} [attributes] - Extra GeoJSON properties
 */

/**
 * @typedef {Object} ProjectedShape - A SiteShape in the project CRS, possibly with holes
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {number[][][]} rings - Outer ring then holes, closed, as [x, y] in the project CRS
 * @property {string} [description]
 * @property {Record<string, string | number>} [attributes]
 */

/**
 * @typedef {Object} ColorRules - Colours shapes by the value of one of their attributes
 * @property {string} attribute - e.g. 'unit'
 * @property {{ value: string, label: string, color: string }[]} colors - e.g. { value: 'pNbm', label: 'pNbm: pre-Nectarian Basin Massif', color: '#4E3A37' }
 */

/**
 * @callback ProjectPositions - Reprojects Moon positions to project-CRS [x, y], keeping their order
 * @param {LatLon[]} positions
 * @returns {Promise<number[][]>}
 */

/**
 * @typedef {Object} ShapeImport - What the rules file creates
 * @property {string} configurationId - The saved import configuration; the same id updates earlier imports
 * @property {string} name - Shown as the configuration and ruleset name
 * @property {string} tag - Put on every shape, to find them again
 */

const RING_VERTICES = 48
// Features with no size (e.g. landing site names) get a marker of this diameter, or 1/200 of the site if larger
const MARKER_DIAMETER_METERS = 100
const MARKER_SITE_FRACTION = 1 / 200
// A feature much larger than the site (a mare around a 20 km site) outlines nothing useful in the view
const MAX_FEATURE_TO_SITE_RATIO = 5

/**
 * The point features whose outline shows in the site: a disc of their diameter (or a small marker) meets
 * the site, and they aren't so large that the whole view sits inside them.
 * @param {PointFeature[]} features
 * @param {Site} site
 * @returns {SiteShape[]}
 */
export function pointFeatureShapes(features, site) {
  const siteRadius = Math.max(...site.points.map((point) => greatCircleMeters(site.center, point)))
  const markerDiameter = Math.max(MARKER_DIAMETER_METERS, site.widthMeters * MARKER_SITE_FRACTION)
  const shapes = []
  for (const feature of features) {
    const diameter = feature.diameterKm > 0 ? feature.diameterKm * 1000 : markerDiameter
    if (diameter > site.widthMeters * MAX_FEATURE_TO_SITE_RATIO) {
      continue
    }
    const center = { latitude: feature.latitude, longitude: feature.longitude }
    if (greatCircleMeters(site.center, center) > siteRadius + diameter / 2) {
      continue
    }
    shapes.push({
      id: feature.id,
      name: feature.name,
      type: feature.type,
      ring: circleRing(center, diameter / 2),
      ...(feature.description ? { description: feature.description } : {}),
      attributes: feature.diameterKm > 0 ? { diameter_km: feature.diameterKm, ...feature.attributes } : feature.attributes,
    })
  }
  return shapes
}

/**
 * Reprojects the outlines of SiteShapes to the project CRS, in one batch.
 * @param {SiteShape[]} shapes
 * @param {ProjectPositions} project
 * @returns {Promise<ProjectedShape[]>}
 */
export async function projectShapes(shapes, project) {
  const projected = await project(shapes.flatMap((shape) => shape.ring))
  let start = 0
  return shapes.map(({ ring, ...shape }) => {
    const projectedRing = projected.slice(start, start + ring.length)
    start += ring.length
    return { ...shape, rings: [projectedRing] }
  })
}

/**
 * The geologic units in the view, clipped to it. Only the polar caps are bundled, so a site outside them
 * gets none.
 * @param {GeologyDataset} dataset
 * @param {Site} site
 * @param {ViewBox} viewBox - The view, in the project CRS
 * @param {ProjectPositions} project
 * @returns {Promise<ProjectedShape[]>}
 */
export async function geologyShapes(dataset, site, viewBox, project) {
  const cap = [dataset.caps.south, dataset.caps.north].find((entry) =>
    entry.latitudeLimit < 0 ? site.center.latitude <= entry.latitudeLimit : site.center.latitude >= entry.latitudeLimit
  )
  if (!cap) {
    return []
  }
  // The whole cap is reprojected at once (tens of thousands of vertices) rather than tested unit by unit
  // in latitude/longitude, where boxes around the pole are awkward
  const positions = cap.units.flatMap((unit) =>
    unit.rings.flatMap((ring) => ring.map(([longitude, latitude]) => ({ latitude, longitude })))
  )
  const projected = await project(positions)
  const shapes = []
  let start = 0
  for (const unit of cap.units) {
    const unitRings = unit.rings.map((ring) => projected.slice(start, (start += ring.length)))
    // Near a pole, some CRSs (e.g. Mercator) have no finite coordinates
    const outer = unitRings[0].every((point) => point.every(Number.isFinite))
      ? clipRingToBox(unitRings[0], viewBox)
      : []
    if (outer.length === 0) {
      continue
    }
    const holes = unitRings
      .slice(1)
      .map((hole) => clipRingToBox(hole, viewBox))
      .filter((hole) => hole.length > 0)
    const rings = [outer, ...holes]
    const legend = dataset.legend[unit.unit]
    shapes.push({
      id: unit.id,
      name: `${legend.name} (${unit.unit})`,
      type: legend.name,
      description: legend.description,
      rings,
      attributes: { unit: unit.unit, period: legend.period, color: legend.color },
    })
  }
  return shapes
}

/**
 * Clips a closed ring to an axis-aligned box (Sutherland-Hodgman). The box is convex, so the result is one
 * ring, which may run along the box edges where the ring left the view.
 * @param {number[][]} ring - Closed, as [x, y]
 * @param {ViewBox} box
 * @returns {number[][]} Closed, or empty when nothing of the ring is inside
 */
export function clipRingToBox(ring, { x1, y1, x2, y2 }) {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)
  /** @type {{ inside: (point: number[]) => boolean, cross: (a: number[], b: number[]) => number[] }[]} */
  const edges = [
    { inside: ([x]) => x >= minX, cross: (a, b) => atX(a, b, minX) },
    { inside: ([x]) => x <= maxX, cross: (a, b) => atX(a, b, maxX) },
    { inside: ([, y]) => y >= minY, cross: (a, b) => atY(a, b, minY) },
    { inside: ([, y]) => y <= maxY, cross: (a, b) => atY(a, b, maxY) },
  ]
  let points = ring.slice(0, -1)
  for (const { inside, cross } of edges) {
    const kept = []
    for (let i = 0; i < points.length; i++) {
      const current = points[i]
      const previous = points[(i + points.length - 1) % points.length]
      if (inside(current)) {
        if (!inside(previous)) {
          kept.push(cross(previous, current))
        }
        kept.push(current)
      } else if (inside(previous)) {
        kept.push(cross(previous, current))
      }
    }
    points = kept
    if (points.length === 0) {
      return []
    }
  }
  return points.length < 3 ? [] : [...points, points[0]]
}

/**
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} x
 * @returns {number[]} Where segment a-b crosses the vertical line at x
 */
function atX(a, b, x) {
  return [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])]
}

/**
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} y
 * @returns {number[]} Where segment a-b crosses the horizontal line at y
 */
function atY(a, b, y) {
  return [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y]
}

/**
 * A circle on the Moon's sphere, as a closed ring of positions.
 * @param {LatLon} center
 * @param {number} radiusMeters
 * @param {number} [vertices]
 * @returns {LatLon[]}
 */
export function circleRing(center, radiusMeters, vertices = RING_VERTICES) {
  const ring = []
  for (let i = 0; i < vertices; i++) {
    ring.push(destination(center, radiusMeters, (360 * i) / vertices))
  }
  ring.push(ring[0])
  return ring
}

/**
 * The position reached by going `distanceMeters` from `start` along the great circle of initial `bearing`.
 * @param {LatLon} start
 * @param {number} distanceMeters
 * @param {number} bearingDegrees - Clockwise from north
 * @returns {LatLon}
 */
export function destination(start, distanceMeters, bearingDegrees) {
  const toRadians = Math.PI / 180
  const angle = distanceMeters / MOON_RADIUS_METERS
  const bearing = bearingDegrees * toRadians
  const latitude = start.latitude * toRadians
  const longitude = start.longitude * toRadians
  const endLatitude = Math.asin(
    Math.sin(latitude) * Math.cos(angle) + Math.cos(latitude) * Math.sin(angle) * Math.cos(bearing)
  )
  const endLongitude =
    longitude +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angle) * Math.cos(latitude),
      Math.cos(angle) - Math.sin(latitude) * Math.sin(endLatitude)
    )
  return { latitude: endLatitude / toRadians, longitude: endLongitude / toRadians }
}

/**
 * Builds the GeoJSON to import, already in the project CRS: FieldTwin's importer then doesn't reproject it,
 * which it would otherwise do as if the file were on Earth (GeoJSON's default CRS).
 * @param {ProjectedShape[]} shapes
 * @param {string} projectCRS
 * @param {string} source - Credited in every feature
 * @returns {object} A GeoJSON FeatureCollection
 */
export function buildShapesGeoJSON(shapes, projectCRS, source) {
  return {
    type: 'FeatureCollection',
    crs: { type: 'name', properties: { name: projectCRS } },
    features: shapes.map((shape) => ({
      type: 'Feature',
      properties: {
        id: shape.id,
        name: shape.name,
        type: shape.type,
        description: shape.description || '',
        ...shape.attributes,
        source,
      },
      geometry: {
        type: 'Polygon',
        coordinates: shape.rings.map((ring) => ring.map(([x, y]) => [round(x), round(y)])),
      },
    })),
  }
}

/**
 * Builds the rules file for FieldTwin's "Data from files using rules" import (`futureon-rulesets`): one
 * polygon shape per feature, named after it, described by its `description` property, tagged with its type
 * and with `shapeImport.tag`. With `colorRules`, a child ruleset per value colours the shapes having it, so
 * the rules editor shows (and lets the user change) which colour goes with which value.
 * @param {ShapeImport} shapeImport
 * @param {ColorRules} [colorRules]
 * @returns {object}
 */
export function buildRulesFile({ configurationId, name, tag }, colorRules) {
  /** @type {Record<string, object>} */
  const colorEntries = {}
  /** @type {Record<string, string>} */
  const links = {}
  for (const { value, label, color } of colorRules?.colors || []) {
    const id = `color-${value}`
    colorEntries[id] = {
      id,
      enabled: true,
      name: label,
      rules: [{ attribute: colorRules.attribute, operator: 'eq', values: [value] }],
      // Needs FieldTwin's rules import to have the 'setColor' action
      actions: [{ type: 'setColor', params: { color } }],
    }
    links[id] = 'shapes'
  }
  return {
    version: '1.0.0',
    type: 'futureon-rulesets',
    fileType: 'futureon-rulesets',
    account: null,
    project: null,
    subProject: null,
    configuration: {
      id: configurationId,
      name,
      driver: 'File',
      removeRecords: false,
      restrictToViewbox: false,
      simplify: false,
      simplifyTolerance: 0.01,
      minimumConnectionLength: 1,
      importParams: {},
      rulesets: {
        links,
        entries: {
          shapes: {
            id: 'shapes',
            enabled: true,
            name,
            rules: [{ attribute: 'geometry', operator: 'eq', values: ['Polygon'] }],
            actions: [
              {
                type: 'createShape',
                params: { relateToType: 'shapes', shapeType: 'Polygon', idAttribute: 'id', nameAttribute: 'name' },
              },
              // Needs FieldTwin's rules import to accept descriptions on shapes (it used to take them only on
              // connections, staged assets and annotations)
              { type: 'setDescriptionAttribute', params: { descriptionAttribute: 'description' } },
              { type: 'setTagsFromAttribute', params: { tagAttribute: 'type', clearPreviousTags: false } },
              { type: 'setTags', params: { tags: [tag], clearPreviousTags: false } },
            ],
          },
          ...colorEntries,
        },
      },
    },
  }
}

/**
 * Centimetres are plenty, and keep the file small.
 * @param {number} meters
 * @returns {number}
 */
function round(meters) {
  return Math.round(meters * 100) / 100
}
