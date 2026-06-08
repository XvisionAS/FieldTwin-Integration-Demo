import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { downloadAll, cacheFileName } from '../src/downloader.js'

/**
 * A fetch stub that records the URLs it was asked for and returns small GLB-ish bytes.
 *
 * @returns {{ fetchImpl: typeof fetch, calls: string[] }}
 */
function makeFetch() {
  const calls = []
  /** @type {any} */
  const fetchImpl = async (url) => {
    calls.push(url)
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => new TextEncoder().encode(`glb:${url}`).buffer,
    }
  }
  return { fetchImpl, calls }
}

/** @param {string} url */
function part(url, partId) {
  return { assetName: 'x', partId, docking: undefined, model3dUrl: url, transformMatrix: [], localPath: null }
}

test('cacheFileName is stable per URL and differs across URLs', () => {
  assert.equal(cacheFileName('https://a/x.glb'), cacheFileName('https://a/x.glb'))
  assert.notEqual(cacheFileName('https://a/x.glb'), cacheFileName('https://a/y.glb'))
  assert.match(cacheFileName('https://a/x.glb'), /^[0-9a-f]{16}\.glb$/)
})

test('downloadAll fetches each unique URL once and points shared parts at one file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sas-dl-'))
  try {
    const { fetchImpl, calls } = makeFetch()
    // Three placements but only two distinct URLs — the shared one must download once.
    const shared = 'https://cdn/shared.glb'
    const parts = [part(shared, 'a/base'), part(shared, 'b/base'), part('https://cdn/other.glb', 'b/001')]

    await downloadAll(parts, dir, { fetchImpl })

    assert.equal(calls.length, 2, 'one fetch per unique URL')
    assert.equal(parts[0].localPath, parts[1].localPath, 'same URL → same cached file')
    assert.equal(parts[0].localPath, join(dir, cacheFileName(shared)))
    assert.notEqual(parts[2].localPath, parts[0].localPath)
    assert.equal(await readFile(parts[0].localPath, 'utf8'), `glb:${shared}`)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('downloadAll reuses an already-cached file without re-fetching', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sas-dl-'))
  try {
    const url = 'https://cdn/reuse.glb'
    const first = makeFetch()
    await downloadAll([part(url, 'a')], dir, { fetchImpl: first.fetchImpl })
    assert.equal(first.calls.length, 1)

    // Second run with the same cache dir must hit the cached file, not the network.
    const second = makeFetch()
    const parts = [part(url, 'b')]
    await downloadAll(parts, dir, { fetchImpl: second.fetchImpl })
    assert.equal(second.calls.length, 0, 'cached file reused, no fetch')
    assert.equal(parts[0].localPath, join(dir, cacheFileName(url)))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
