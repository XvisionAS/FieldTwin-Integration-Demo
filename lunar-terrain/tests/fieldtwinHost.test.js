import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { connectToFieldTwin } from '../src/host/fieldtwinHost.js'

const HOST_ORIGIN = 'https://designer.fieldtwin.test'
const LOADED = {
  event: 'loaded',
  token: 'jwt-1',
  backendUrl: 'https://backend.fieldtwin.test',
  projectorUrl: 'https://backend.fieldtwin.test/projector',
  project: 'p1',
  subProject: 's1',
  canEdit: true,
}

/**
 * A fake integration window embedded in a fake FieldTwin window.
 * @returns {{ win: any, parent: any, posted: { target: string, message: object, origin: string }[],
 *   deliver: (data: object, from?: { origin?: string, source?: object }) => void }}
 */
function fakeFrame() {
  /** @type {((event: object) => void)[]} */
  let listeners = []
  /** @type {{ target: string, message: object, origin: string }[]} */
  const posted = []
  /** @param {string} name */
  const fakeWindow = (name) => ({
    parent: null,
    opener: null,
    closed: false,
    postMessage: (/** @type {object} */ message, /** @type {string} */ origin) =>
      posted.push({ target: name, message, origin }),
    addEventListener: (/** @type {string} */ _type, /** @type {(event: object) => void} */ listener) =>
      listeners.push(listener),
    removeEventListener: (/** @type {string} */ _type, /** @type {(event: object) => void} */ listener) => {
      listeners = listeners.filter((entry) => entry !== listener)
    },
  })
  const parent = fakeWindow('parent')
  const win = { ...fakeWindow('integration'), parent }
  return {
    win,
    parent,
    posted,
    deliver(data, { origin = HOST_ORIGIN, source = parent } = {}) {
      for (const listener of listeners) {
        listener({ data, origin, source })
      }
    },
  }
}

describe('connectToFieldTwin', () => {
  it('trusts the first loaded message of the embedding window and ignores everything before it', () => {
    const frame = fakeFrame()
    const host = connectToFieldTwin(frame.win)
    /** @type {object[]} */
    const contexts = []
    host.onLoaded((context) => contexts.push(context))

    frame.deliver({ event: 'viewBox', data: {} })
    frame.deliver(LOADED, { source: {} })
    assert.equal(contexts.length, 0)

    frame.deliver(LOADED)
    assert.deepEqual(contexts, [LOADED])
  })

  it('ignores a later loaded message from another origin', () => {
    const frame = fakeFrame()
    const host = connectToFieldTwin(frame.win)
    frame.deliver(LOADED)
    /** @type {string[]} */
    const subProjects = []
    host.onLoaded((context) => subProjects.push(context.subProject))

    frame.deliver({ ...LOADED, subProject: 'evil' }, { origin: 'https://evil.test' })
    frame.deliver({ ...LOADED, subProject: 's2' })

    assert.deepEqual(subProjects, ['s1', 's2'])
  })

  it('asks for the project data at the host origin and returns the project CRS', async () => {
    const frame = fakeFrame()
    const host = connectToFieldTwin(frame.win)
    frame.deliver(LOADED)

    const crs = host.getProjectCRS()
    assert.deepEqual(frame.posted, [{ target: 'parent', message: { event: 'getProjectData' }, origin: HOST_ORIGIN }])
    frame.deliver({ event: 'projectData', data: { project: { CRS: 'EPSG:1' } } }, { origin: 'https://evil.test' })
    frame.deliver({ event: 'projectData', data: { project: { CRS: 'IAU_2015:30135' } } })

    assert.equal(await crs, 'IAU_2015:30135')
  })

  it('returns the view box, or null when the reply has none', async () => {
    const frame = fakeFrame()
    const host = connectToFieldTwin(frame.win)
    frame.deliver(LOADED)

    const first = host.getViewBox()
    frame.deliver({ event: 'viewBox', data: { viewBox: { x1: 1, y1: 2, x2: 3, y2: 4, z1: 0, z2: 0 } } })
    assert.deepEqual(await first, { x1: 1, y1: 2, x2: 3, y2: 4, z1: 0, z2: 0 })

    const second = host.getViewBox()
    frame.deliver({ event: 'viewBox', data: {} })
    assert.equal(await second, null)
  })

  it('keeps the latest token', () => {
    const frame = fakeFrame()
    const host = connectToFieldTwin(frame.win)
    frame.deliver({ ...LOADED })
    /** @type {string[]} */
    const tokens = []
    host.onLoaded((context) => tokens.push(context.token))

    frame.deliver({ event: 'tokenRefresh', token: 'jwt-2' })
    host.onLoaded((context) => tokens.push(context.token))

    assert.deepEqual(tokens, ['jwt-1', 'jwt-2'])
  })

  it('talks to the opener once popped out', () => {
    const frame = fakeFrame()
    const opener = {
      ...frame.parent,
      postMessage: (/** @type {object} */ message, /** @type {string} */ origin) =>
        frame.posted.push({ target: 'opener', message, origin }),
    }
    frame.win.opener = opener
    const host = connectToFieldTwin(frame.win)

    frame.deliver(LOADED)
    frame.deliver(LOADED, { source: opener })
    host.getProjectCRS().catch(() => {})

    assert.deepEqual(frame.posted.at(-1), {
      target: 'opener',
      message: { event: 'getProjectData' },
      origin: HOST_ORIGIN,
    })
  })

  it('rejects when FieldTwin does not answer, or before it has loaded the integration', async () => {
    const frame = fakeFrame()
    const host = connectToFieldTwin(frame.win, { replyTimeoutMs: 10 })
    await assert.rejects(host.getProjectCRS(), /Not connected/)

    frame.deliver(LOADED)
    await assert.rejects(host.getViewBox(), /did not answer getViewBox/)
  })
})
