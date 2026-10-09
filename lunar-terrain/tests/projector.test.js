import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { toMoonLatLon } from '../src/site/projector.js'

describe('toMoonLatLon', () => {
  it('posts the points to the projector and reads the answer latitude first', async () => {
    /** @type {{ url: string, body: unknown }[]} */
    const calls = []
    /** @type {typeof fetch} */
    const fakeFetch = async (url, init) => {
      calls.push({ url: String(url), body: JSON.parse(String(init?.body)) })
      return new Response(JSON.stringify([[-89.67, 129.8]]), { status: 200 })
    }

    const result = await toMoonLatLon('https://ft.test/projector/', 'IAU_2015:30135', [[7688, -6405]], fakeFetch)

    assert.deepEqual(result, [{ latitude: -89.67, longitude: 129.8 }])
    assert.deepEqual(calls, [
      {
        url: 'https://ft.test/projector/transform',
        body: { source: 'IAU_2015:30135', target: 'IAU_2015:30100', points: [[7688, -6405]] },
      },
    ])
  })

  it('names the project CRS when the projector refuses', async () => {
    /** @type {typeof fetch} */
    const fakeFetch = async () => new Response('{"error":"invalid transform"}', { status: 403 })
    await assert.rejects(
      toMoonLatLon('https://ft.test/projector', 'IAU_2015:30135', [[0, 0]], fakeFetch),
      /IAU_2015:30135.*HTTP 403/
    )
  })
})
