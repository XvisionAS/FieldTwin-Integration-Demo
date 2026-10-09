import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'

import { parsePds3Label, parseQuantity } from '../src/catalog/pds3Label.js'
import { keyword } from './labelKeyword.js'

describe('parsePds3Label', () => {
  it('reads a real LOLA JPEG 2000 label (CRLF, comments, multi-line values, nested objects)', async () => {
    const text = await readFile(new URL('./fixtures/ldem_875s_20m_jp2.lbl', import.meta.url), 'utf8')
    const label = parsePds3Label(text)

    assert.equal(keyword(label, 'PRODUCT_ID'), 'LDEM_875S_20M')
    assert.match(keyword(label, 'MISSION_PHASE_NAME'), /^\{"COMMISSIONING".*MISSION"\}$/s)
    assert.match(keyword(label, 'DESCRIPTION'), /relative to a radius of 1737.4 km/)
    assert.equal(keyword(label, 'UNCOMPRESSED_FILE', 'IMAGE', 'LINE_SAMPLES'), '7584')
    assert.equal(keyword(label, 'IMAGE_MAP_PROJECTION', 'MAP_PROJECTION_TYPE'), 'POLAR STEREOGRAPHIC')
    assert.equal(keyword(label, 'IMAGE_MAP_PROJECTION', 'MAP_SCALE'), '20 <m/pix>')
    assert.equal(keyword(label, 'AUX_FILE', 'FILE_NAME'), 'LDEM_875S_20M_AUX.XML')
  })

  it('ignores anything after END', () => {
    const label = parsePds3Label('A = 1\nEND\nB = 2\n')
    assert.deepEqual(label, { A: '1' })
  })

  it('rejects an END_OBJECT without a matching OBJECT', () => {
    assert.throws(() => parsePds3Label('A = 1\nEND_OBJECT = IMAGE\nEND\n'), /Unbalanced END_OBJECT/)
  })
})

describe('parseQuantity', () => {
  it('splits the value and its unit', () => {
    assert.deepEqual(parseQuantity('7.5808376060 <km/pix>'), { value: 7.580837606, unit: 'km/pix' })
    assert.deepEqual(parseQuantity('-87.5 <deg>'), { value: -87.5, unit: 'deg' })
  })

  it('accepts a bare number, including a trailing decimal point', () => {
    assert.deepEqual(parseQuantity('1737400.'), { value: 1737400, unit: undefined })
  })

  it('rejects values that are not numbers', () => {
    assert.throws(() => parseQuantity("'N/A'"), /Not a number/)
  })
})
