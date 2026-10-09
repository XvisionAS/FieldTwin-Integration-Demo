/** @typedef {import('../src/catalog/pds3Label.js').Pds3Label} Pds3Label */

/**
 * Reads a keyword value from a parsed label by its object path, failing the test when it isn't there.
 * @param {Pds3Label} label
 * @param {...string} path - Object names, then the keyword, e.g. 'IMAGE_MAP_PROJECTION', 'MAP_SCALE'
 * @returns {string}
 */
export function keyword(label, ...path) {
  let node = label
  for (const name of path.slice(0, -1)) {
    const child = node[name]
    if (typeof child !== 'object') {
      throw new Error(`No OBJECT ${name} in label`)
    }
    node = child
  }
  const value = node[path[path.length - 1]]
  if (typeof value !== 'string') {
    throw new Error(`No keyword ${path.join('.')} in label`)
  }
  return value
}
