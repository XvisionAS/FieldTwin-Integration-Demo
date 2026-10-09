/**
 * @typedef {{ [keyword: string]: string | Pds3Label }} Pds3Label
 * A parsed PDS3 label: keyword values are raw strings (surrounding quotes removed), and each
 * OBJECT ... END_OBJECT block becomes a nested label keyed by the object's name.
 */

/**
 * @typedef {Object} Quantity
 * @property {number} value
 * @property {string} [unit] - The `<unit>` suffix, e.g. 'km/pix'
 */

/**
 * Parses a PDS3 label (the `.lbl` text that describes a PDS product).
 * @param {string} text
 * @returns {Pds3Label}
 */
export function parsePds3Label(text) {
  /** @type {Pds3Label} */
  const root = {}
  const stack = [root]
  const statements = splitStatements(text.replace(/\/\*[\s\S]*?\*\//g, ''))

  for (const { keyword, value } of statements) {
    const current = stack[stack.length - 1]
    if (keyword === 'END') {
      break
    }
    if (keyword === 'OBJECT') {
      /** @type {Pds3Label} */
      const child = {}
      current[value] = child
      stack.push(child)
      continue
    }
    if (keyword === 'END_OBJECT') {
      if (stack.length === 1) {
        throw new Error(`Unbalanced END_OBJECT = ${value} in PDS3 label`)
      }
      stack.pop()
      continue
    }
    current[keyword] = value
  }
  return root
}

/**
 * Splits label text into `KEYWORD = value` statements. Quoted strings and `{...}` lists may span lines.
 * @param {string} text
 * @returns {{ keyword: string, value: string }[]}
 */
function splitStatements(text) {
  const statements = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === 'END') {
      statements.push({ keyword: 'END', value: '' })
      break
    }
    const separator = line.indexOf('=')
    if (separator === -1) {
      continue
    }
    const keyword = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    while (isUnterminated(value) && i + 1 < lines.length) {
      i++
      value += '\n' + lines[i].trim()
    }
    statements.push({ keyword, value: unquote(value) })
  }
  return statements
}

/**
 * @param {string} value
 * @returns {boolean} Whether a quoted string or `{...}` list continues on the next line
 */
function isUnterminated(value) {
  if (value.startsWith('"')) {
    return (value.match(/"/g) || []).length % 2 === 1
  }
  if (value.startsWith('{')) {
    return !value.includes('}')
  }
  return false
}

/**
 * @param {string} value
 * @returns {string}
 */
function unquote(value) {
  const quoted = value.match(/^"([\s\S]*)"$/) || value.match(/^'([\s\S]*)'$/)
  return quoted ? quoted[1] : value
}

/**
 * Reads a numeric keyword value with an optional unit, e.g. `7.5808376060 <km/pix>`.
 * @param {string} raw
 * @returns {Quantity}
 */
export function parseQuantity(raw) {
  const match = raw.match(/^(-?[\d.]+(?:[eE][-+]?\d+)?)\s*(?:<([^>]+)>)?$/)
  if (!match) {
    throw new Error(`Not a number: ${raw}`)
  }
  return { value: Number(match[1]), unit: match[2] }
}
