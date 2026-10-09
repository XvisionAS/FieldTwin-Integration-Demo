import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { coversSite, rankProducts, targetResolutionMeters } from '../src/ranking/rankProducts.js'

/** @typedef {import('../src/catalog/catalog.js').CatalogProduct} CatalogProduct */
/** @typedef {import('../src/catalog/catalog.js').Footprint} Footprint */

/**
 * @param {string} id
 * @param {number} resolutionMeters
 * @param {number} bytes
 * @param {Footprint} footprint
 * @returns {CatalogProduct}
 */
function product(id, resolutionMeters, bytes, footprint) {
  return {
    id,
    source: 'pds-lola',
    kind: 'elevation',
    name: id,
    downloadUrl: `https://example.test/${id}.jp2`,
    bytes,
    resolutionMeters,
    footprint,
    values: { scale: 0.5, offset: 1737400, unit: 'meter' },
  }
}

/** @type {Footprint} */
const GLOBAL = { kind: 'box', south: -90, north: 90, west: 0, east: 360 }
/** @param {number} latitudeLimit @param {number} halfWidthMeters @returns {Footprint} */
const southCap = (latitudeLimit, halfWidthMeters) => ({ kind: 'polar', pole: 'south', latitudeLimit, halfWidthMeters })

// About 20 km across, around Shackleton crater
const SHACKLETON = {
  center: { latitude: -89.67, longitude: 129.8 },
  points: [
    { latitude: -89.6, longitude: 100 },
    { latitude: -89.6, longitude: 160 },
    { latitude: -89.75, longitude: 160 },
    { latitude: -89.75, longitude: 100 },
  ],
  widthMeters: 20000,
}

describe('coversSite', () => {
  it('checks boxes in 0 to 360 degrees east, whatever sign the longitude comes with', () => {
    /** @type {Footprint} */
    const tile = { kind: 'box', south: 0, north: 15, west: 330, east: 360 }
    assert.equal(coversSite(tile, [{ latitude: 5, longitude: -10 }]), true)
    assert.equal(coversSite(tile, [{ latitude: 5, longitude: 10 }]), false)
    assert.equal(coversSite(tile, [{ latitude: 16, longitude: -10 }]), false)
  })

  it('checks polar products against their square grid, which reaches past the cap latitude in the corners', () => {
    const cap = southCap(-87.5, 75840)
    // 87 degrees south is outside the 87.5 degree cap, but inside the square along its diagonal
    assert.equal(coversSite(cap, [{ latitude: -87, longitude: 45 }]), true)
    assert.equal(coversSite(cap, [{ latitude: -87, longitude: 0 }]), false)
    assert.equal(coversSite(cap, [{ latitude: 89.9, longitude: 0 }]), false, 'north pole')
  })
})

describe('rankProducts', () => {
  const products = [
    product('global', 7580, 1_400_000, GLOBAL),
    product('south_5m', 5, 176_000_000, southCap(-87.5, 75840)),
    product('south_20m', 20, 21_000_000, southCap(-87.5, 75840)),
    product('south_240m', 240, 10_000_000, southCap(-75, 457440)),
    product('equator_tile', 30, 90_000_000, { kind: 'box', south: 0, north: 15, west: 0, east: 30 }),
  ]

  it('puts the files fine enough for the grid first, smallest download first, then too coarse ones', () => {
    // 20 km at 512 cells is 39 m: 20 m and 5 m are fine enough, 240 m and 7.6 km are not
    const ranked = rankProducts(products, SHACKLETON, 512)
    assert.deepEqual(
      ranked.map(({ product: entry, meetsTarget }) => [entry.id, meetsTarget]),
      [
        ['south_20m', true],
        ['south_5m', true],
        ['south_240m', false],
        ['global', false],
      ]
    )
  })

  it('accepts a file slightly coarser than the target', () => {
    const ranked = rankProducts([product('south_40m', 40, 1, southCap(-85, 438800))], SHACKLETON, 512)
    assert.equal(ranked[0].meetsTarget, true)
  })

  it('prefers a smaller download even when it is finer, since the grid decides the result', () => {
    // Normal quality: 20 km at 128 cells is 156 m, so both files are fine enough
    const ranked = rankProducts(
      [
        product('coarse_but_big', 120, 32_000_000, southCap(-75, 457440)),
        product('fine_and_small', 20, 21_000_000, southCap(-87.5, 75840)),
      ],
      SHACKLETON,
      128
    )
    assert.deepEqual(
      ranked.map(({ product: entry }) => entry.id),
      ['fine_and_small', 'coarse_but_big']
    )
  })

  it('among files too coarse for the grid, puts the finest first', () => {
    const ranked = rankProducts(
      [product('global_7km', 7580, 1_400_000, GLOBAL), product('global_2km', 1895, 17_000_000, GLOBAL)],
      SHACKLETON,
      512
    )
    assert.deepEqual(
      ranked.map(({ product: entry }) => entry.id),
      ['global_2km', 'global_7km']
    )
  })
})

describe('targetResolutionMeters', () => {
  it('is the site width divided by the grid size', () => {
    assert.equal(targetResolutionMeters(SHACKLETON, 128), 156.25)
  })
})
