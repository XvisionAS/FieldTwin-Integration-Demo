import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildCatalog } from '../src/catalog/catalog.js'
import { mapWithConcurrency } from '../src/catalog/mapWithConcurrency.js'

/**
 * @param {string} id
 * @returns {import('../src/catalog/catalog.js').CatalogProduct}
 */
function product(id) {
  return {
    id,
    source: id.split(':')[0],
    kind: 'elevation',
    name: id,
    downloadUrl: `https://example.test/${id}`,
    bytes: 1,
    resolutionMeters: 1,
    footprint: { kind: 'box', south: -90, north: 90, west: 0, east: 360 },
    values: { scale: 1, offset: 1737400, unit: 'meter' },
  }
}

describe('buildCatalog', () => {
  it('merges every source, sorts products by id and records when and from where', async () => {
    const fetchText = async () => ''
    const sources = [
      { id: 'b', name: 'B', homepage: 'https://b.test/', listProducts: async () => [product('b:2'), product('b:1')] },
      { id: 'a', name: 'A', homepage: 'https://a.test/', listProducts: async () => [product('a:1')] },
    ]

    const catalog = await buildCatalog(sources, fetchText, new Date('2026-09-25T12:00:00Z'))

    assert.equal(catalog.generatedAt, '2026-09-25T12:00:00.000Z')
    assert.deepEqual(catalog.sources, [
      { id: 'b', name: 'B', homepage: 'https://b.test/' },
      { id: 'a', name: 'A', homepage: 'https://a.test/' },
    ])
    assert.deepEqual(
      catalog.products.map((entry) => entry.id),
      ['a:1', 'b:1', 'b:2']
    )
  })
})

describe('mapWithConcurrency', () => {
  it('keeps the input order and never runs more than the limit at once', async () => {
    let running = 0
    let maxRunning = 0
    const results = await mapWithConcurrency([30, 10, 20, 5, 15], 2, async (delay) => {
      running++
      maxRunning = Math.max(maxRunning, running)
      await new Promise((resolve) => setTimeout(resolve, delay))
      running--
      return delay * 2
    })

    assert.deepEqual(results, [60, 20, 40, 10, 30])
    assert.equal(maxRunning, 2)
  })
})
