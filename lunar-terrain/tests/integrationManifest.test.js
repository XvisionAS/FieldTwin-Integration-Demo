import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildManifest, manifestResponse } from '../manifest/integrationManifest.js'

describe('buildManifest', () => {
  it('opens as a docked panel at the given URL and keeps the JWT out of URLs', () => {
    const manifest = buildManifest('https://tools.example.com/lunar-terrain')

    assert.equal(manifest.url, 'https://tools.example.com/lunar-terrain/')
    assert.equal(manifest.useGET, true)
    assert.equal(manifest.noURLParams, true)
    assert.equal(manifest.tabPosition, 'bottom')
  })
})

describe('manifestResponse', () => {
  it('answers the browser preflight with CORS headers only', () => {
    const response = manifestResponse('OPTIONS', { host: 'localhost:5173' }, false)

    assert.equal(response.status, 204)
    assert.equal(response.body, '')
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*')
    assert.match(response.headers['Access-Control-Allow-Headers'], /Content-Type/)
  })

  it('returns the manifest for the address it was requested at', () => {
    const response = manifestResponse('GET', { host: 'localhost:5173' }, false)

    assert.equal(response.status, 200)
    assert.equal(response.headers['Content-Type'], 'application/json')
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*')
    assert.equal(JSON.parse(response.body).url, 'http://localhost:5173/')
    assert.equal(JSON.parse(manifestResponse('GET', { host: 'tools.test' }, true).body).url, 'https://tools.test/')
  })

  it('prefers the address a reverse proxy forwarded', () => {
    const headers = {
      host: '10.0.0.5:4173',
      'x-forwarded-proto': 'https, http',
      'x-forwarded-host': 'tools.example.com',
    }
    assert.equal(JSON.parse(manifestResponse('GET', headers, false).body).url, 'https://tools.example.com/')
  })
})
