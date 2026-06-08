/**
 * @typedef {import('./treeWalker.js').StagedAsset} StagedAsset
 * @typedef {import('./treeWalker.js').SubProject} SubProject
 */

/**
 * Join the API base URL and a path, tolerating a trailing slash on the base.
 *
 * @param {string} base
 * @param {string} path
 * @returns {string}
 */
function joinUrl(base, path) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

/**
 * Strip a trailing version segment (e.g. "/API/v1.10/") from a base URL so we never
 * emit a doubled "/API/v1.10/API/v1.10/" path when the descriptor already includes it.
 *
 * @param {string} api
 * @returns {string}
 */
function stripVersion(api) {
  return api.replace(/\/API\/v\d+\.\d+\/?$/i, '')
}

/**
 * Build the v1.10 sub-project endpoint URL (the parent of all staged assets).
 *
 * @param {{ api: string, projectId: string, subProjectId: string, streamId: string }} params
 * @returns {string}
 */
export function subProjectUrl({ api, projectId, subProjectId, streamId }) {
  const path = `API/v1.10/${projectId}/subProject/${subProjectId}:${streamId}`
  return joinUrl(stripVersion(api), path)
}

/**
 * Build the v1.10 staged-asset endpoint URL.
 *
 * @param {{ api: string, projectId: string, subProjectId: string, streamId: string, id: string }} params
 * @returns {string}
 */
export function stagedAssetUrl({ api, projectId, subProjectId, streamId, id }) {
  const path = `API/v1.10/${projectId}/subProject/${subProjectId}:${streamId}/stagedAssets/${id}`
  return joinUrl(stripVersion(api), path)
}

/**
 * GET a URL and parse JSON, throwing with actionable context on failure. `label`
 * names the resource being fetched (e.g. `staged asset "X"`) for error messages.
 *
 * @param {string} url
 * @param {string} token
 * @param {string} label
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<any>}
 */
async function getJson(url, token, label, fetchImpl) {
  let response
  try {
    response = await fetchImpl(url, { headers: { token, Accept: 'application/json' } })
  } catch (error) {
    throw new Error(`Network error fetching ${label}: ${/** @type {Error} */ (error).message}`)
  }
  if (!response.ok) {
    const detail = await safeBodySnippet(response)
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Authorization failed (${response.status}) fetching ${label}: token invalid or expired. ${detail}`)
    }
    if (response.status === 404) {
      throw new Error(`${label} not found (404). Check projectId/subProjectId/streamId. ${detail}`)
    }
    throw new Error(`Failed to fetch ${label} (HTTP ${response.status}). ${detail}`)
  }
  return response.json()
}

/**
 * Fetch a single staged asset (the matrix-enriched smart-asset form) from the API.
 *
 * @param {{ api: string, token: string, projectId: string, subProjectId: string, streamId: string, id: string, fetchImpl?: typeof fetch }} params
 * @returns {Promise<StagedAsset>} The parsed staged asset.
 */
export async function fetchStagedAsset({ api, token, projectId, subProjectId, streamId, id, fetchImpl = fetch }) {
  const url = stagedAssetUrl({ api, projectId, subProjectId, streamId, id })
  return getJson(url, token, `staged asset "${id}"`, fetchImpl)
}

/**
 * Fetch the whole sub-project in one request. Its `stagedAssets` map carries every
 * staged asset matrix-enriched through the same code path as fetchStagedAsset, so each
 * entry is ready for flattenParts — letting us fetch once and stitch many.
 *
 * @param {{ api: string, token: string, projectId: string, subProjectId: string, streamId: string, fetchImpl?: typeof fetch }} params
 * @returns {Promise<SubProject>} The parsed sub-project.
 */
export async function fetchSubProject({ api, token, projectId, subProjectId, streamId, fetchImpl = fetch }) {
  const url = subProjectUrl({ api, projectId, subProjectId, streamId })
  return getJson(url, token, `sub-project "${subProjectId}:${streamId}"`, fetchImpl)
}

/**
 * Read a short, safe snippet of a non-OK response body for error messages.
 *
 * @param {Response} response
 * @returns {Promise<string>}
 */
async function safeBodySnippet(response) {
  try {
    const text = await response.text()
    return text ? `Body: ${text.slice(0, 200)}` : ''
  } catch {
    return ''
  }
}
