import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'

import { DATA_GUIDES, isEncoded, toSample } from '../src/guides/dataGuides.js'

/** @typedef {import('../src/catalog/catalog.js').Catalog} Catalog */

const SLOPE = { scale: 0.0015, offset: 45, unit: 'degree', missing: -32768 }

describe('toSample', () => {
  it('turns a value into the raw sample FieldTwin reads, undoing the scale and offset', () => {
    assert.equal(toSample(15, SLOPE), -20000)
    assert.equal(toSample(45, SLOPE), 0)
    assert.equal(toSample(2, { scale: 0.001, offset: 0, unit: 'meter' }), 2000)
  })

  it('leaves plain values unchanged, fractions included', () => {
    assert.equal(toSample(5, { scale: 1, offset: 0, unit: 'none' }), 5)
    assert.equal(toSample(0.2, { scale: 1, offset: 0, unit: 'fraction' }), 0.2)
  })
})

describe('isEncoded', () => {
  it('is true only when the raw samples differ from the values', () => {
    assert.equal(isEncoded(SLOPE), true)
    assert.equal(isEncoded({ scale: 1, offset: 0, unit: 'none' }), false)
  })
})

describe('DATA_GUIDES', () => {
  it('starts with the terrain, which every colour layer is draped over', () => {
    assert.equal(DATA_GUIDES[0].id, 'terrain')
    assert.equal(DATA_GUIDES[0].uploadAs, 'terrain')
  })

  it('offers files from the catalog for every guide', async () => {
    /** @type {Catalog} */
    const catalog = JSON.parse(await readFile(new URL('../src/catalog/catalog.json', import.meta.url), 'utf8'))
    for (const guide of DATA_GUIDES.filter((entry) => entry.productKind)) {
      assert.ok(
        catalog.products.some((product) => product.kind === guide.productKind),
        `no ${guide.productKind} product for the ${guide.id} guide`
      )
    }
  })
})

describe('DATA_SOURCES', () => {
  it('credits every guide’s data with a source page and a citation', async () => {
    const { DATA_SOURCES } = await import('../src/guides/dataSources.js')
    for (const guide of DATA_GUIDES) {
      assert.ok(guide.sources.length > 0, `${guide.id} names no source`)
      for (const id of guide.sources) {
        const source = DATA_SOURCES[id]
        assert.ok(source, `${guide.id} names the unknown source ${id}`)
        assert.match(source.url, /^https:\/\//)
        assert.ok(source.citation)
      }
    }
  })
})
