/**
 * @typedef {Object} IntegrationManifest - FieldTwin integration manifest (see FieldTwin's integrations README)
 * @property {string} name
 * @property {string} url
 * @property {string} tabPosition
 * @property {string} width
 * @property {string} height
 * @property {boolean} showInDesigner
 * @property {boolean} showInOperation
 * @property {boolean} useGET
 * @property {boolean} noURLParams
 * @property {boolean} allowPopout
 * @property {boolean} doNotUseSubprojectApiEndpoints
 */

/**
 * @typedef {Object} ManifestResponse
 * @property {number} status
 * @property {Record<string, string>} headers
 * @property {string} body
 */

export const MANIFEST_PATH = '/manifest.json'

// FieldTwin's admin app fetches the manifest from its own origin with a Content-Type header, so the browser
// sends a preflight first; the manifest holds nothing private, so any origin may read it
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * @param {string} integrationUrl - Absolute URL the app is served from
 * @returns {IntegrationManifest}
 */
export function buildManifest(integrationUrl) {
  return {
    name: 'Lunar Data Import Guide',
    url: integrationUrl.endsWith('/') ? integrationUrl : `${integrationUrl}/`,
    // A Module Panel docked next to the 3D view, so the guide stays open while the user follows its steps
    tabPosition: 'bottom',
    // Size of the popped-out window
    width: '900px',
    height: '700px',
    showInDesigner: true,
    showInOperation: false,
    // A static app can't read a POST body, and without URL parameters the JWT only travels by message
    useGET: true,
    noURLParams: true,
    allowPopout: true,
    doNotUseSubprojectApiEndpoints: true,
  }
}

/**
 * Answers a request for the manifest, with the integration URL taken from the address it was requested at.
 * @param {string} method
 * @param {Record<string, string | string[] | undefined>} headers - Request headers, lower-case names
 * @param {boolean} isTls - Whether the request itself came over HTTPS
 * @returns {ManifestResponse}
 */
export function manifestResponse(method, headers, isTls) {
  if (method === 'OPTIONS') {
    return { status: 204, headers: CORS_HEADERS, body: '' }
  }
  // Behind a reverse proxy, the address the admin used is in the X-Forwarded-* headers
  const protocol = firstValue(headers['x-forwarded-proto']) || (isTls ? 'https' : 'http')
  const host = firstValue(headers['x-forwarded-host']) || firstValue(headers.host)
  return {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildManifest(`${protocol}://${host}/`), null, 2),
  }
}

/**
 * @param {string | string[] | undefined} value
 * @returns {string | undefined} The first entry of a possibly repeated or comma-separated header
 */
function firstValue(value) {
  const text = Array.isArray(value) ? value[0] : value
  return text?.split(',')[0].trim() || undefined
}
