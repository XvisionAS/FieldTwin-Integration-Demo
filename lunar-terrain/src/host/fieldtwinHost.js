/** @typedef {import('../site/moonSite.js').ViewBox} ViewBox */

/**
 * @typedef {Object} LoadedContext - The fields of FieldTwin's `loaded` message this integration uses
 * @property {string} token - JWT, replaced on every `tokenRefresh`
 * @property {string} backendUrl
 * @property {string} projectorUrl
 * @property {string} project
 * @property {string} subProject
 * @property {boolean} canEdit
 * @property {string} [cssUrl]
 * @property {string} [cssThemeUrl]
 */

/**
 * @typedef {Object} FieldTwinHost
 * @property {(handler: (context: LoadedContext) => void) => void} onLoaded - Called for every `loaded`
 *   message (FieldTwin sends it again when the user switches sub project)
 * @property {() => Promise<string>} getProjectCRS
 * @property {() => Promise<ViewBox | null>} getViewBox - Null when there is no 3D view to read
 * @property {(tag: string) => void} selectShapesByTag - Selects the project's shapes carrying the tag
 * @property {() => void} disconnect
 */

/**
 * @typedef {Object} HostWindow - The parts of `window` used here, so tests can pass a fake
 * @property {HostWindow | null} parent
 * @property {HostWindow | null} [opener]
 * @property {boolean} [closed]
 * @property {(message: object, targetOrigin: string) => void} postMessage
 * @property {(type: 'message', listener: (event: MessageEvent) => void) => void} addEventListener
 * @property {(type: 'message', listener: (event: MessageEvent) => void) => void} removeEventListener
 */

/** @typedef {Record<string, unknown>} HostMessage */

const DEFAULT_REPLY_TIMEOUT_MS = 10000

/**
 * Connects to the FieldTwin window hosting this integration.
 *
 * Only the embedding window (the parent frame, or the opener once popped out) is trusted. Its origin is
 * taken from its first `loaded` message; later messages must come from that window and origin, and
 * messages to FieldTwin are posted to that exact origin, never `*` (AGENTS.md security rule 5).
 * @param {HostWindow} win
 * @param {{ replyTimeoutMs?: number }} [options]
 * @returns {FieldTwinHost}
 */
export function connectToFieldTwin(win, { replyTimeoutMs = DEFAULT_REPLY_TIMEOUT_MS } = {}) {
  /** @type {string | undefined} */
  let hostOrigin
  /** @type {LoadedContext | undefined} */
  let context
  /** @type {((context: LoadedContext) => void)[]} */
  const loadedHandlers = []
  /** @type {Map<string, ((message: HostMessage) => void)[]>} */
  const pendingReplies = new Map()

  /** @returns {HostWindow | null} */
  const hostWindow = () => {
    if (win.opener && !win.opener.closed) {
      return win.opener
    }
    return win.parent && win.parent !== win ? win.parent : null
  }

  /** @param {MessageEvent} event */
  const onMessage = (event) => {
    const message = event.data
    if (!message || typeof message.event !== 'string' || event.source !== hostWindow()) {
      return
    }
    if (hostOrigin === undefined) {
      if (message.event !== 'loaded') {
        return
      }
      hostOrigin = event.origin
    } else if (event.origin !== hostOrigin) {
      return
    }

    if (message.event === 'loaded') {
      context = message
      for (const handler of loadedHandlers) {
        handler(message)
      }
      return
    }
    if (message.event === 'tokenRefresh' && context) {
      context.token = message.token
      return
    }
    // FieldTwin also broadcasts events nobody here waits for (selection, resource updates, ...)
    const resolveReply = pendingReplies.get(message.event)?.shift()
    if (resolveReply) {
      resolveReply(message)
    }
  }
  win.addEventListener('message', onMessage)

  /**
   * Posts a message to FieldTwin that has no reply.
   * @param {HostMessage} message
   */
  const send = (message) => {
    const target = hostWindow()
    if (!target || hostOrigin === undefined) {
      throw new Error('Not connected to FieldTwin yet')
    }
    target.postMessage(message, hostOrigin)
  }

  /**
   * Sends a message to FieldTwin and resolves with its next reply of type `replyEvent`.
   * @param {string} event
   * @param {string} replyEvent
   * @returns {Promise<HostMessage>}
   */
  const request = (event, replyEvent) => {
    const target = hostWindow()
    if (!target || hostOrigin === undefined) {
      return Promise.reject(new Error('Not connected to FieldTwin yet'))
    }
    const origin = hostOrigin
    return new Promise((resolve, reject) => {
      const waiting = pendingReplies.get(replyEvent) || []
      /** @param {HostMessage} message */
      const settle = (message) => {
        clearTimeout(timer)
        resolve(message)
      }
      const timer = setTimeout(() => {
        waiting.splice(waiting.indexOf(settle), 1)
        reject(new Error(`FieldTwin did not answer ${event}`))
      }, replyTimeoutMs)
      waiting.push(settle)
      pendingReplies.set(replyEvent, waiting)
      target.postMessage({ event }, origin)
    })
  }

  return {
    onLoaded(handler) {
      loadedHandlers.push(handler)
      if (context) {
        handler(context)
      }
    },
    async getProjectCRS() {
      const reply = await request('getProjectData', 'projectData')
      const crs = readPath(reply, ['data', 'project', 'CRS'])
      return typeof crs === 'string' ? crs : ''
    },
    async getViewBox() {
      const reply = await request('getViewBox', 'viewBox')
      const viewBox = readPath(reply, ['data', 'viewBox'])
      return isViewBox(viewBox) ? viewBox : null
    },
    selectShapesByTag(tag) {
      send({ event: 'selectByTag', data: { tags: [tag], resourceTypes: ['shapes'] } })
    },
    disconnect() {
      win.removeEventListener('message', onMessage)
    },
  }
}

/**
 * @param {unknown} value
 * @param {string[]} path
 * @returns {unknown}
 */
function readPath(value, path) {
  let current = value
  for (const key of path) {
    if (typeof current !== 'object' || current === null) {
      return undefined
    }
    current = Reflect.get(current, key)
  }
  return current
}

/**
 * @param {unknown} value
 * @returns {value is ViewBox}
 */
function isViewBox(value) {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  return ['x1', 'y1', 'x2', 'y2'].every((key) => Number.isFinite(Reflect.get(value, key)))
}
