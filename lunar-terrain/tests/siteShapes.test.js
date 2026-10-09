import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { greatCircleMeters } from '../src/site/moonSite.js'
import {
  buildRulesFile,
  buildShapesGeoJSON,
  circleRing,
  clipRingToBox,
  destination,
  geologyShapes,
  pointFeatureShapes,
  projectShapes,
} from '../src/shapes/siteShapes.js'
import { buildNamedFeatures } from '../src/shapes/sources/iauNomenclature.js'
import { buildLandingSites } from '../src/shapes/sources/lrocAnthropogenic.js'
import { buildGeologicMap } from '../src/shapes/sources/unifiedGeology.js'

/**
 * @typedef {import('../src/site/moonSite.js').Site} Site
 * @typedef {import('../src/shapes/sources/iauNomenclature.js').PointFeature} PointFeature
 * @typedef {import('../src/shapes/sources/unifiedGeology.js').GeologyDataset} GeologyDataset
 */

// A 20 km view centred near Shackleton crater
const CENTER = { latitude: -89.67, longitude: 129.8 }
/** @type {Site} */
const SITE = {
  center: CENTER,
  points: [0, 90, 180, 270].map((bearing) => destination(CENTER, 10000, bearing)),
  widthMeters: 20000,
}

/**
 * @param {string} name
 * @param {number} diameterKm
 * @param {{ latitude: number, longitude: number }} position
 * @returns {PointFeature}
 */
const feature = (name, diameterKm, { latitude, longitude }) => ({
  id: `iau:${name}`,
  name,
  type: 'Crater',
  diameterKm,
  latitude,
  longitude,
})

/**
 * Stands in for the projector: a flat projection, 1 unit per degree, so tests can reason in degrees.
 * @param {{ latitude: number, longitude: number }[]} positions
 * @returns {Promise<number[][]>}
 */
const flatProject = async (positions) => positions.map(({ latitude, longitude }) => [longitude, latitude])

describe('destination and circleRing', () => {
  it('goes the asked distance, even across the pole', () => {
    const end = destination(CENTER, 5000, 45)
    assert.ok(Math.abs(greatCircleMeters(CENTER, end) - 5000) < 0.01)
  })

  it('makes a closed ring at the radius', () => {
    const ring = circleRing(CENTER, 1000, 8)
    assert.equal(ring.length, 9)
    assert.deepEqual(ring[8], ring[0])
    for (const position of ring) {
      assert.ok(Math.abs(greatCircleMeters(CENTER, position) - 1000) < 0.01)
    }
  })
})

describe('pointFeatureShapes', () => {
  it('keeps the features whose disc meets the site, with a stable id and their diameter', () => {
    const inside = feature('Inside', 2, destination(CENTER, 3000, 10))
    const overlapping = feature('Overlapping', 10, destination(CENTER, 14000, 200))
    const outside = feature('Outside', 2, destination(CENTER, 40000, 90))

    const shapes = pointFeatureShapes([inside, overlapping, outside], SITE)

    assert.deepEqual(
      shapes.map((shape) => [shape.id, shape.name, shape.attributes]),
      [
        ['iau:Inside', 'Inside', { diameter_km: 2 }],
        ['iau:Overlapping', 'Overlapping', { diameter_km: 10 }],
      ]
    )
    assert.ok(Math.abs(greatCircleMeters(inside, shapes[0].ring[0]) - 1000) < 0.01)
  })

  it('skips features so large that the whole view sits inside them', () => {
    assert.deepEqual(pointFeatureShapes([feature('Basin', 300, CENTER)], SITE), [])
  })

  it('gives features without a size a 100 m marker', () => {
    const [shape] = pointFeatureShapes([feature('Statio', 0, CENTER)], SITE)
    assert.ok(Math.abs(greatCircleMeters(CENTER, shape.ring[0]) - 50) < 0.01)
  })
})

describe('projectShapes', () => {
  it('reprojects every outline in one batch and puts each back on its shape', async () => {
    /** @type {{ latitude: number, longitude: number }[][]} */
    const batches = []
    /** @param {{ latitude: number, longitude: number }[]} positions */
    const project = async (positions) => {
      batches.push(positions)
      return flatProject(positions)
    }
    const shapes = [
      { id: 'a', name: 'A', type: 'Crater', ring: [{ latitude: 1, longitude: 2 }, { latitude: 1, longitude: 2 }] },
      { id: 'b', name: 'B', type: 'Mons', ring: [{ latitude: 3, longitude: 4 }] },
    ]

    const projected = await projectShapes(shapes, project)

    assert.equal(batches.length, 1)
    assert.deepEqual(projected, [
      { id: 'a', name: 'A', type: 'Crater', rings: [[[2, 1], [2, 1]]] },
      { id: 'b', name: 'B', type: 'Mons', rings: [[[4, 3]]] },
    ])
  })
})

describe('clipRingToBox', () => {
  const box = { x1: 0, y1: 0, x2: 10, y2: 10 }

  it('keeps a ring inside the box as it is', () => {
    const ring = [[1, 1], [2, 1], [2, 2], [1, 1]]
    assert.deepEqual(clipRingToBox(ring, box), ring)
  })

  it('cuts a ring crossing the box along the box edges', () => {
    const clipped = clipRingToBox([[-5, 2], [5, 2], [5, 8], [-5, 8], [-5, 2]], box)
    assert.deepEqual(clipped, [[0, 2], [5, 2], [5, 8], [0, 8], [0, 2]])
  })

  it('drops a ring outside the box', () => {
    assert.deepEqual(clipRingToBox([[20, 20], [30, 20], [30, 30], [20, 20]], box), [])
  })
})

describe('geologyShapes', () => {
  /** @type {GeologyDataset} */
  const dataset = {
    id: 'ugm',
    name: 'Geologic units',
    source: '',
    citation: '',
    generatedAt: '',
    legend: { Nc: { name: 'Nectarian Crater', period: 'Nectarian', color: '#A68CBE', description: 'Degraded craters.' } },
    caps: {
      south: {
        latitudeLimit: -75,
        units: [
          // Crosses the view's west edge, with a hole in the view
          {
            id: 'ugm:south:0',
            unit: 'Nc',
            rings: [
              [[-5, -82], [5, -82], [5, -78], [-5, -78], [-5, -82]],
              [[1, -81], [2, -81], [2, -80], [1, -81]],
            ],
          },
          { id: 'ugm:south:1', unit: 'Nc', rings: [[[40, -82], [50, -82], [50, -78], [40, -82]]] },
        ],
      },
      north: { latitudeLimit: 75, units: [] },
    },
  }
  const view = { x1: 0, y1: -85, x2: 10, y2: -75 }
  /** @param {number} latitude */
  const siteAt = (latitude) => ({ center: { latitude, longitude: 5 }, points: [], widthMeters: 1 })

  it('clips the units of the cap holding the site to the view, keeping their holes', async () => {
    const shapes = await geologyShapes(dataset, siteAt(-80), view, flatProject)

    assert.deepEqual(shapes, [
      {
        id: 'ugm:south:0',
        name: 'Nectarian Crater (Nc)',
        type: 'Nectarian Crater',
        description: 'Degraded craters.',
        rings: [
          [[0, -82], [5, -82], [5, -78], [0, -78], [0, -82]],
          [[1, -81], [2, -81], [2, -80], [1, -81]],
        ],
        attributes: { unit: 'Nc', period: 'Nectarian', color: '#A68CBE' },
      },
    ])
  })

  it('has nothing for a site outside the bundled polar caps', async () => {
    assert.deepEqual(await geologyShapes(dataset, siteAt(-40), view, flatProject), [])
  })
})

describe('buildShapesGeoJSON', () => {
  it('declares the project CRS so FieldTwin imports the coordinates as they are', () => {
    const shapes = [
      {
        id: 'iau:A',
        name: 'A',
        type: 'Crater',
        description: 'Named after A.',
        rings: [[[1.234, 5.678], [9.87654, 3.2]]],
        attributes: { diameter_km: 1 },
      },
    ]
    const geojson = buildShapesGeoJSON(shapes, 'IAU_2015:30135', 'IAU')

    assert.deepEqual(geojson, {
      type: 'FeatureCollection',
      crs: { type: 'name', properties: { name: 'IAU_2015:30135' } },
      features: [
        {
          type: 'Feature',
          properties: { id: 'iau:A', name: 'A', type: 'Crater', description: 'Named after A.', diameter_km: 1, source: 'IAU' },
          geometry: { type: 'Polygon', coordinates: [[[1.23, 5.68], [9.88, 3.2]]] },
        },
      ],
    })
  })
})

describe('buildRulesFile', () => {
  it('is a futureon-rulesets file creating named, tagged polygon shapes', () => {
    const rules = buildRulesFile({ configurationId: 'guide:names', name: 'Names', tag: 'IAU named features' })

    assert.equal(rules.version, '1.0.0')
    assert.equal(rules.type, 'futureon-rulesets')
    assert.equal(rules.configuration.id, 'guide:names')
    const [entry] = Object.values(rules.configuration.rulesets.entries)
    assert.deepEqual(entry.rules, [{ attribute: 'geometry', operator: 'eq', values: ['Polygon'] }])
    assert.deepEqual(
      entry.actions.map((action) => action.type),
      ['createShape', 'setDescriptionAttribute', 'setTagsFromAttribute', 'setTags']
    )
    assert.deepEqual(entry.actions[0].params, {
      relateToType: 'shapes',
      shapeType: 'Polygon',
      idAttribute: 'id',
      nameAttribute: 'name',
    })
    assert.deepEqual(entry.actions[1].params, { descriptionAttribute: 'description' })
    assert.deepEqual(entry.actions[3].params.tags, ['IAU named features'])
  })
})

describe('buildRulesFile with colour rules', () => {
  it('adds a child ruleset per value, colouring the shapes of the parent ruleset that have it', () => {
    const rules = buildRulesFile(
      { configurationId: 'guide:geology', name: 'Geologic units', tag: 'Geologic units' },
      {
        attribute: 'unit',
        colors: [
          { value: 'Nc', label: 'Nc: Nectarian Crater', color: '#A68CBE' },
          { value: 'pNbm', label: 'pNbm: pre-Nectarian Basin Massif', color: '#4E3A37' },
        ],
      }
    )

    const { entries, links } = rules.configuration.rulesets
    assert.deepEqual(links, { 'color-Nc': 'shapes', 'color-pNbm': 'shapes' })
    assert.deepEqual(entries['color-pNbm'], {
      id: 'color-pNbm',
      enabled: true,
      name: 'pNbm: pre-Nectarian Basin Massif',
      rules: [{ attribute: 'unit', operator: 'eq', values: ['pNbm'] }],
      actions: [{ type: 'setColor', params: { color: '#4E3A37' } }],
    })
  })
})

describe('buildNamedFeatures', () => {
  it('keeps the name, singular type, diameter and position of each IAU feature, sorted by name', () => {
    const dataset = buildNamedFeatures(
      [
        {
          properties: {
            clean_name: 'Shackleton',
            type: 'Crater, craters',
            diameter: 21.0,
            center_lat: -89.6553,
            center_lon: 129.7759,
            origin: 'Ernest Henry; British explorer (1874-1922).',
          },
        },
        { properties: { clean_name: 'Statio Tianhe', type: 'Statio', diameter: null, center_lat: -45.45, center_lon: 177.6 } },
        { properties: { clean_name: 'Malapert', type: 'Mons, montes', diameter: 69.1234567, center_lat: -85.992346, center_lon: 2.94 } },
      ],
      new Date('2026-09-28T00:00:00Z')
    )

    assert.equal(dataset.generatedAt, '2026-09-28T00:00:00.000Z')
    assert.deepEqual(dataset.features, [
      { id: 'iau:Malapert', name: 'Malapert', type: 'Mons', diameterKm: 69.123, latitude: -85.99235, longitude: 2.94 },
      {
        id: 'iau:Shackleton',
        name: 'Shackleton',
        type: 'Crater',
        diameterKm: 21,
        latitude: -89.6553,
        longitude: 129.7759,
        description: 'Ernest Henry; British explorer (1874-1922).',
      },
      { id: 'iau:Statio Tianhe', name: 'Statio Tianhe', type: 'Statio', diameterKm: 0, latitude: -45.45, longitude: 177.6 },
    ])
  })
})

describe('buildLandingSites', () => {
  /**
   * @param {string} id
   * @param {string} name
   * @param {string} object
   */
  const row = (id, name, object) => ({
    properties: {
      OBJECT_ID: id,
      SHORT_NAME: name,
      MISSION: 'M',
      OBJECT: object,
      LATITUDE: -80.127601,
      LONGITUDE: 1.4367,
      UNCERTAIN: 10,
      COORD_SRC: 'NAC DTM',
    },
  })

  it('groups the LROC objects into a few types, an impact of a lander stage being an impact site', () => {
    const dataset = buildLandingSites([
      row('IM1', 'IM-1 Odysseus Lander', 'Lander'),
      row('A11_LM', 'Apollo 11 Lunar Module', 'Descent stage of Lunar Module "Eagle"'),
      row('A12_LMI', 'Apollo 12 LM impact', 'Lunar module ascent stage impact site'),
      row('Lunokhod1', 'Lunokhod 1 Rover', 'Retroreflector: Lunokhod 1 rover'),
      row('A11_PSE', 'Apollo 11 Seismometer', 'Passive Seismic Experiment'),
    ])

    assert.deepEqual(
      dataset.features.map((entry) => [entry.id, entry.type]),
      [
        ['lroc:A11_LM', 'Lander'],
        ['lroc:A11_PSE', 'Surface experiment'],
        ['lroc:A12_LMI', 'Impact site'],
        ['lroc:IM1', 'Lander'],
        ['lroc:Lunokhod1', 'Rover'],
      ]
    )
    assert.deepEqual(dataset.features[3].attributes, { mission: 'M', object: 'Lander', uncertainty_m: 10 })
    assert.equal(dataset.features[3].latitude, -80.1276)
    assert.equal(dataset.features[3].description, 'Lander, M. Position from NAC DTM, within 10 m.')
  })
})

describe('buildGeologicMap', () => {
  it('keeps each cap polygon with its unit, numbered by map feature and part, and names and colours units from the map tables', () => {
    const polygon = { type: 'Polygon', coordinates: [[[0, -80], [1, -80], [1, -81], [0, -80]]] }
    const part = { type: 'Polygon', coordinates: [[[2, -80], [3, -80], [3, -81], [2, -80]]] }
    const dataset = buildGeologicMap(
      {
        south: [
          { properties: { source_fid: 7, FIRST_Unit: 'Iohs', FIRST_Un_1: 'Imbrian' }, geometry: polygon },
          { properties: { source_fid: 2, FIRST_Unit: 'Nc', FIRST_Un_1: 'Nectarian' }, geometry: { type: 'LineString', coordinates: [] } },
          // A second part of the same map feature, as GDAL explodes a clipped multi-polygon
          { properties: { source_fid: 7, FIRST_Unit: 'Iohs', FIRST_Un_1: 'Imbrian' }, geometry: part },
        ],
        north: [],
      },
      [
        {
          properties: {
            Unit: 'Ios',
            Name: 'Imbrian Orientale Hevelius Formation, Secondary Crater Facies',
            Description: 'Clusters of secondary craters.',
            Interpretation: 'Ejecta of the Orientale basin.',
          },
        },
      ],
      [{ properties: { unit: 'Iohs', color_hex: '#00ABB3' } }],
      new Date('2026-09-28T00:00:00Z')
    )

    assert.deepEqual(dataset.caps.south.units, [
      { id: 'ugm:south:7:0', unit: 'Iohs', rings: polygon.coordinates },
      { id: 'ugm:south:7:1', unit: 'Iohs', rings: part.coordinates },
    ])
    assert.equal(dataset.caps.south.latitudeLimit, -75)
    assert.deepEqual(dataset.legend, {
      Iohs: {
        name: 'Imbrian Orientale Hevelius Formation, Secondary Crater Facies',
        period: 'Imbrian',
        color: '#00ABB3',
        description: 'Clusters of secondary craters. Interpretation: Ejecta of the Orientale basin.',
      },
    })
  })

  it('refuses a polygon without the map feature number its id is made of', () => {
    const polygon = { type: 'Polygon', coordinates: [[[0, -80], [1, -80], [1, -81], [0, -80]]] }
    const south = [{ properties: { FIRST_Unit: 'Nc', FIRST_Un_1: 'Nectarian' }, geometry: polygon }]
    assert.throws(() => buildGeologicMap({ south, north: [] }, [], []), /source_fid.*south cap/)
  })
})
