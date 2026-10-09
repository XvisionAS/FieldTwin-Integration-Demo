import { MANIFEST_PATH, buildManifest, manifestResponse } from './integrationManifest.js'

/**
 * @typedef {import('vite').Plugin} Plugin
 * @typedef {import('vite').Connect.Server} ConnectServer
 */

/**
 * Serves the integration manifest from the dev and preview servers, and writes it into the build when
 * INTEGRATION_URL says where the built app will be hosted.
 * @returns {Plugin}
 */
export function integrationManifest() {
  return {
    name: 'lunar-terrain-integration-manifest',
    configureServer(server) {
      serveManifest(server.middlewares)
    },
    configurePreviewServer(server) {
      serveManifest(server.middlewares)
    },
    generateBundle() {
      const integrationUrl = process.env.INTEGRATION_URL
      if (!integrationUrl) {
        this.warn('INTEGRATION_URL is not set, so the build has no manifest.json')
        return
      }
      this.emitFile({
        type: 'asset',
        fileName: MANIFEST_PATH.slice(1),
        source: JSON.stringify(buildManifest(integrationUrl), null, 2) + '\n',
      })
    },
  }
}

/**
 * @param {ConnectServer} middlewares
 */
function serveManifest(middlewares) {
  middlewares.use(MANIFEST_PATH, (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
      next()
      return
    }
    const isTls = 'encrypted' in req.socket && req.socket.encrypted === true
    const { status, headers, body } = manifestResponse(req.method, req.headers, isTls)
    res.writeHead(status, headers)
    res.end(body)
  })
}
