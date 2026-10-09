import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { describeSite, greatCircleMeters, isMoonCRS, viewBoxSamplePoints } from '../src/site/moonSite.js'

describe('isMoonCRS', () => {
  it('accepts the IAU 2015 Moon CRSs only', () => {
    assert.equal(isMoonCRS('IAU_2015:30135'), true)
    assert.equal(isMoonCRS('iau_2015:30100'), true)
    assert.equal(isMoonCRS('IAU_2015:49935'), false, 'Mars')
    assert.equal(isMoonCRS('EPSG:32631'), false)
    assert.equal(isMoonCRS(''), false)
  })
})

describe('viewBoxSamplePoints', () => {
  it('returns the corners, the edge midpoints and the centre', () => {
    assert.deepEqual(viewBoxSamplePoints({ x1: 0, y1: 0, x2: 20, y2: 10 }), [
      [0, 0],
      [20, 0],
      [20, 10],
      [0, 10],
      [0, 5],
      [20, 5],
      [10, 0],
      [10, 10],
      [10, 5],
    ])
  })
})

describe('describeSite', () => {
  it('uses the longer side as the width and keeps the centre apart from the coverage points', () => {
    // A 1 degree wide, 0.5 degree tall box on the equator
    const samples = [
      [-0.25, 0],
      [-0.25, 1],
      [0.25, 1],
      [0.25, 0],
      [0, 0],
      [0, 1],
      [-0.25, 0.5],
      [0.25, 0.5],
      [0, 0.5],
    ].map(([latitude, longitude]) => ({ latitude, longitude }))

    const site = describeSite(samples)

    assert.deepEqual(site.center, { latitude: 0, longitude: 0.5 })
    assert.equal(site.points.length, 8)
    assert.equal(Math.round(site.widthMeters), 30323)
  })
})

describe('greatCircleMeters', () => {
  it('measures along the Moon sphere', () => {
    const quarterTurn = greatCircleMeters({ latitude: 0, longitude: 0 }, { latitude: 90, longitude: 0 })
    assert.equal(Math.round(quarterTurn), Math.round((Math.PI / 2) * 1737400))
  })
})
