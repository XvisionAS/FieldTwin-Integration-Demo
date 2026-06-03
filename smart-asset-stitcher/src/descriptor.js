import { readFile } from 'node:fs/promises'

/**
 * @typedef {Object} Descriptor
 * @property {string} api Base URL of the FieldTwin API (e.g. https://host/).
 * @property {string} token API token / JWT sent in the `token` header.
 * @property {string} projectId FieldTwin project id.
 * @property {string} subProjectId FieldTwin sub-project id.
 * @property {string} streamId Stream id (branch) within the sub-project.
 * @property {string[]} stagedAssetIds Staged smart-asset ids to fetch and stitch.
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
  if (!Array.isArray(descriptor.stagedAssetIds) || descriptor.stagedAssetIds.length === 0) {
    throw new Error('Descriptor field "stagedAssetIds" is required and must be a non-empty array')
  }
  for (const id of descriptor.stagedAssetIds) {
    if (typeof id !== 'string' || id === '') {
      throw new Error('Each entry of "stagedAssetIds" must be a non-empty string')
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
