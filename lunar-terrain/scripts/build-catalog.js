// Rebuilds src/catalog/catalog.json from the sources' live listings. Run with `npm run build:catalog`.
import { writeFile } from 'node:fs/promises'

import { buildCatalog } from '../src/catalog/catalog.js'
import { pdsLolaSource } from '../src/catalog/sources/pdsLola.js'
import { polarRastersSource } from '../src/catalog/sources/polarRasters.js'

const SOURCES = [pdsLolaSource, polarRastersSource]
const OUTPUT = new URL('../src/catalog/catalog.json', import.meta.url)

/**
 * @param {string} url
 * @returns {Promise<string>}
 */
async function fetchText(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status}`)
  }
  return response.text()
}

const catalog = await buildCatalog(SOURCES, fetchText)
await writeFile(OUTPUT, JSON.stringify(catalog, null, 2) + '\n')
console.log(`Wrote ${catalog.products.length} products to ${OUTPUT.pathname}`)
