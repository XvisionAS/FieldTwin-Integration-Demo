/**
 * @typedef {import('./treeWalker.js').StagedAsset} StagedAsset
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
 * Build the v1.10 staged-asset endpoint URL.
 *
 * @param {{ api: string, projectId: string, subProjectId: string, streamId: string, id: string }} params
 * @returns {string}
 */
export function stagedAssetUrl({ api, projectId, subProjectId, streamId, id }) {
  // Tolerate a base that already includes the version path (e.g. ".../API/v1.10/")
  // so we never emit a doubled "/API/v1.10/API/v1.10/" segment.
  const base = api.replace(/\/API\/v\d+\.\d+\/?$/i, '')
  const path = `API/v1.10/${projectId}/subProject/${subProjectId}:${streamId}/stagedAssets/${id}`
  return joinUrl(base, path)
}

/**
 * Fetch a single staged asset (the matrix-enriched smart-asset form) from the API.
 *
 * @param {{ api: string, token: string, projectId: string, subProjectId: string, streamId: string, id: string, fetchImpl?: typeof fetch }} params
 * @returns {Promise<StagedAsset>} The parsed staged asset.
 */
export async function fetchStagedAsset({ api, token, projectId, subProjectId, streamId, id, fetchImpl = fetch }) {
  const url = stagedAssetUrl({ api, projectId, subProjectId, streamId, id })
  let response
  try {
    response = await fetchImpl(url, {
      headers: { token, Accept: 'application/json' },
    })
  } catch (error) {
    throw new Error(`Network error fetching staged asset "${id}": ${/** @type {Error} */ (error).message}`)
  }
  if (!response.ok) {
    const detail = await safeBodySnippet(response)
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Authorization failed (${response.status}) fetching "${id}": token invalid or expired. ${detail}`)
    }
    if (response.status === 404) {
      throw new Error(`Staged asset "${id}" not found (404). Check projectId/subProjectId/streamId. ${detail}`)
    }
    throw new Error(`Failed to fetch staged asset "${id}" (HTTP ${response.status}). ${detail}`)
  }
  return /** @type {Promise<StagedAsset>} */ (response.json())
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
