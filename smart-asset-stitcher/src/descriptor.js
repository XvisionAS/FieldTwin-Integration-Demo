import { readFile } from 'node:fs/promises'

/**
 * @typedef {Object} Descriptor
 * @property {string} api Base URL of the FieldTwin API (e.g. https://host/).
 * @property {string} token API token / JWT sent in the `token` header.
 * @property {string} projectId FieldTwin project id.
 * @property {string} subProjectId FieldTwin sub-project id.
 * @property {string} streamId Stream id (branch) within the sub-project.
 * @property {string[]} [stagedAssetIds] Staged smart-asset ids to fetch and stitch. When
 *   omitted (or an empty array) the whole sub-project is fetched and every multi-part smart
 *   asset in it is stitched.
 * @property {string} output Output directory for the downloaded parts, description.json and stitched glb.
 * @property {boolean} [optimize] When true, run prune/dedup on the stitched document.
 * @property {boolean} [keepHelpers] When true, keep FieldTwin editor-only helper geometry
 *   (docking-socket markers, tags). Default false — they are stripped to match the app's export.
 */

const REQUIRED_STRING_FIELDS = ['api', 'token', 'projectId', 'subProjectId', 'streamId', 'output']

/**
 * Validate a parsed descriptor object, throwing on the first problem found.
 *
 * @param {unknown} value Parsed JSON to validate.
 * @returns {Descriptor} The validated descriptor (same reference when valid).
 */
export function validateDescriptor(value) {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Descriptor must be a JSON object')
  }
  const descriptor = /** @type {Record<string, unknown>} */ (value)
  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof descriptor[field] !== 'string' || descriptor[field] === '') {
      throw new Error(`Descriptor field "${field}" is required and must be a non-empty string`)
    }
  }
  // stagedAssetIds is optional: omitting it (or passing []) selects whole-sub-project mode.
  // When present it must be an array of non-empty strings.
  if (descriptor.stagedAssetIds !== undefined) {
    if (!Array.isArray(descriptor.stagedAssetIds)) {
      throw new Error('Descriptor field "stagedAssetIds", when present, must be an array of strings')
    }
    for (const id of descriptor.stagedAssetIds) {
      if (typeof id !== 'string' || id === '') {
        throw new Error('Each entry of "stagedAssetIds" must be a non-empty string')
      }
    }
  }
  return /** @type {Descriptor} */ (value)
}

/**
 * Load and validate a descriptor JSON file from disk.
 *
 * @param {string} path Path to the descriptor JSON file.
 * @returns {Promise<Descriptor>} The validated descriptor.
 */
export async function loadDescriptor(path) {
  let raw
  try {
    raw = await readFile(path, 'utf8')
  } catch (error) {
    throw new Error(`Cannot read descriptor file at "${path}": ${/** @type {Error} */ (error).message}`)
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new Error(`Descriptor file is not valid JSON: ${/** @type {Error} */ (error).message}`)
  }
  return validateDescriptor(parsed)
}
