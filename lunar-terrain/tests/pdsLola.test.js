import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'

import { parsePds3Label } from '../src/catalog/pds3Label.js'
import { parseDirectoryListing, pdsLolaSource, toProduct } from '../src/catalog/sources/pdsLola.js'
import { keyword } from './labelKeyword.js'

/** @typedef {import('../src/catalog/catalog.js').FetchText} FetchText */

const BASE = 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/'
const PATH = '/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/'

/**
 * @param {string} name
 * @returns {Promise<string>}
 */
function readFixture(name) {
  return readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')
}

/**
 * Builds a directory listing page in the IIS format PDS Geosciences serves.
 * @param {string} folder
 * @param {[string, number][]} files - [name, bytes]
 * @returns {string}
 */
function listingPage(folder, files) {
  const rows = files.map(
    ([name, bytes]) => ` 6/15/2017 10:12 AM     ${bytes} <A HREF="${PATH}${folder}${name}">${name}</A><br>`
  )
  return (
    `<html><body><pre><A HREF="${PATH}">[To Parent Directory]</A><br><br>` +
    ` 2/22/2023  2:23 PM        &lt;dir&gt; <A HREF="${PATH}${folder}old/">old</A><br>` +
    rows.join('') +
    '</pre></body></html>'
  )
}

describe('parseDirectoryListing', () => {
  it('returns the listed files with sizes and absolute URLs, skipping folders and the parent link', () => {
    const html = listingPage('polar/jp2/', [
      ['ldem_875s_20m.jp2', 21462406],
      ['ldem_875s_20m_jp2.lbl', 5210],
    ])
    assert.deepEqual(parseDirectoryListing(html, `${BASE}polar/jp2/`), [
      { name: 'ldem_875s_20m.jp2', url: `${BASE}polar/jp2/ldem_875s_20m.jp2`, bytes: 21462406 },
      { name: 'ldem_875s_20m_jp2.lbl', url: `${BASE}polar/jp2/ldem_875s_20m_jp2.lbl`, bytes: 5210 },
    ])
  })
})

describe('toProduct', () => {
  it('describes a polar product as a square cap around the pole', async () => {
    const file = { name: 'ldem_875s_20m.jp2', url: `${BASE}polar/jp2/ldem_875s_20m.jp2`, bytes: 21462406 }
    const product = toProduct(file, parsePds3Label(await readFixture('ldem_875s_20m_jp2.lbl')))

    assert.deepEqual(product, {
      id: 'pds-lola:ldem_875s_20m',
      source: 'pds-lola',
      kind: 'elevation',
      name: 'South pole to 87.5°S, 20 m/px',
      downloadUrl: `${BASE}polar/jp2/ldem_875s_20m.jp2`,
      bytes: 21462406,
      resolutionMeters: 20,
      footprint: { kind: 'polar', pole: 'south', latitudeLimit: -87.5, halfWidthMeters: 75840 },
      values: { scale: 0.5, offset: 1737400, unit: 'meter' },
    })
  })

  it('reads how a value product encodes its samples, including the missing-value marker', async () => {
    const file = { name: 'ldsm_85s_40m.jp2', url: `${BASE}polar/jp2/ldsm_85s_40m.jp2`, bytes: 94292243 }
    const product = toProduct(file, parsePds3Label(await readFixture('ldsm_85s_40m_jp2.lbl')))

    assert.equal(product.kind, 'slope')
    assert.equal(product.name, 'South pole to 85°S, 40 m/px')
    assert.deepEqual(product.values, { scale: 0.0015, offset: 45, unit: 'degree', missing: -32768 })
  })

  it('treats samples without a scale or offset as plain values, as for the shot counts', async () => {
    const file = { name: 'ldec_4.jp2', url: `${BASE}cylindrical/jp2/ldec_4.jp2`, bytes: 1436447 }
    const product = toProduct(file, parsePds3Label(await readFixture('ldec_4_jp2.lbl')))

    assert.equal(product.kind, 'shot-count')
    assert.deepEqual(product.footprint, { kind: 'box', south: -90, north: 90, west: 0, east: 360 })
    assert.deepEqual(product.values, { scale: 1, offset: 0, unit: 'none' })
  })

  it('describes a global product as the whole Moon, converting km/pix to metres', async () => {
    const file = { name: 'ldem_4.jp2', url: `${BASE}cylindrical/jp2/ldem_4.jp2`, bytes: 1436447 }
    const product = toProduct(file, parsePds3Label(await readFixture('ldem_4_jp2.lbl')))

    assert.equal(product.name, 'Global, 7.6 km/px')
    assert.equal(product.resolutionMeters, 7580.837606)
    assert.deepEqual(product.footprint, { kind: 'box', south: -90, north: 90, west: 0, east: 360 })
  })

  it('takes tile longitudes from the file name, not from the label', async () => {
    const name = 'ldem_1024_00n_15n_000_030.jp2'
    const file = { name, url: `${BASE}cylindrical/jp2/${name}`, bytes: 196000000 }
    const label = parsePds3Label(await readFixture('ldem_1024_00n_15n_000_030_jp2.lbl'))
    // The label says -180 to -150, but the file itself is georeferenced 0 to 30 degrees east
    assert.equal(keyword(label, 'IMAGE_MAP_PROJECTION', 'WESTERNMOST_LONGITUDE'), '-180 <deg>')

    const product = toProduct(file, label)
    assert.equal(product.name, '0° to 15°N, 0°E to 30°E, 30 m/px')
    assert.deepEqual(product.footprint, { kind: 'box', south: 0, north: 15, west: 0, east: 30 })
    // Its COMPRESSED_FILE object gives no encoding, so it comes from the UNCOMPRESSED_FILE IMAGE object
    assert.deepEqual(product.values, { scale: 0.5, offset: 1737400, unit: 'meter' })
  })

  it('reports which product and keyword are missing when a label is incomplete', () => {
    const file = { name: 'ldem_4.jp2', url: `${BASE}cylindrical/jp2/ldem_4.jp2`, bytes: 1 }
    assert.throws(() => toProduct(file, parsePds3Label('PRODUCT_ID = X\nEND\n')), /IMAGE_MAP_PROJECTION.*ldem_4/)
  })
})

describe('pdsLolaSource.listProducts', () => {
  it('lists the JPEG 2000 products of both folders, reading each one label', async () => {
    /** @type {Record<string, string>} */
    const pages = {
      [`${BASE}cylindrical/jp2/`]: listingPage('cylindrical/jp2/', [
        ['ldac_4.jp2', 100],
        ['ldem_4.jp2', 1436447],
        ['ldem_4_jp2.lbl', 5000],
        ['ldem_4_aux.xml', 9000],
      ]),
      [`${BASE}polar/jp2/`]: listingPage('polar/jp2/', [
        ['ldem_875s_20m.jp2', 21462406],
        ['ldsm_85s_40m.jp2', 94292243],
        ['ldrm_40s_1000m_nn.jp2', 10507935],
      ]),
      [`${BASE}cylindrical/jp2/ldem_4_jp2.lbl`]: await readFixture('ldem_4_jp2.lbl'),
      [`${BASE}polar/jp2/ldem_875s_20m_jp2.lbl`]: await readFixture('ldem_875s_20m_jp2.lbl'),
      [`${BASE}polar/jp2/ldsm_85s_40m_jp2.lbl`]: await readFixture('ldsm_85s_40m_jp2.lbl'),
    }
    /** @type {string[]} */
    const requested = []
    /** @type {FetchText} */
    const fetchText = async (url) => {
      requested.push(url)
      if (!(url in pages)) {
        throw new Error(`Unexpected request ${url}`)
      }
      return pages[url]
    }

    const products = await pdsLolaSource.listProducts(fetchText)

    assert.deepEqual(
      products.map((product) => [product.id, product.bytes]),
      [
        ['pds-lola:ldem_4', 1436447],
        ['pds-lola:ldem_875s_20m', 21462406],
        ['pds-lola:ldsm_85s_40m', 94292243],
      ]
    )
    // The albedo count (ldac) and the suffixed roughness variant are skipped without reading their labels
    assert.equal(requested.length, 5)
  })
})
