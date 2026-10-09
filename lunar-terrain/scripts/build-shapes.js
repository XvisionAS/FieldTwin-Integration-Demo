// Rebuilds the bundled vector datasets in src/shapes/data/ from their official downloads. Run with
// `npm run build:shapes`. It needs Docker, to run GDAL. GDAL_IMAGE picks the image (default: the official GDAL
// image); SHAPES_CACHE the folder the large downloads are kept in between runs (default: under the OS temp folder).
import { execFile } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { access, mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { promisify } from 'node:util'

import {
  IAU_NOMENCLATURE_FIELDS,
  IAU_NOMENCLATURE_LAYER,
  IAU_NOMENCLATURE_URL,
  buildNamedFeatures,
} from '../src/shapes/sources/iauNomenclature.js'
import {
  LROC_ANTHROPOGENIC_FIELDS,
  LROC_ANTHROPOGENIC_LAYER,
  LROC_ANTHROPOGENIC_URL,
  buildLandingSites,
} from '../src/shapes/sources/lrocAnthropogenic.js'
import {
  CAP_LATITUDE,
  UNIFIED_GEOLOGY_COLORS,
  UNIFIED_GEOLOGY_DESCRIPTIONS,
  UNIFIED_GEOLOGY_FID,
  UNIFIED_GEOLOGY_UNITS,
  UNIFIED_GEOLOGY_URL,
  buildGeologicMap,
} from '../src/shapes/sources/unifiedGeology.js'

/** @typedef {import('../src/shapes/sources/iauNomenclature.js').GdalFeature} GdalFeature */

const GDAL_IMAGE = process.env.GDAL_IMAGE || 'ghcr.io/osgeo/gdal:ubuntu-small-latest'
const CACHE = process.env.SHAPES_CACHE || join(tmpdir(), 'lunar-data-guide-shapes')
const OUTPUT_FOLDER = new URL('../src/shapes/data/', import.meta.url)
const MAX_OUTPUT_BYTES = 256 * 1024 * 1024
// Moon 2000 latitude/longitude, the geographic CRS of all three sources
const MOON_2000 =
  'GEOGCS["GCS_Moon_2000",DATUM["D_Moon_2000",SPHEROID["Moon_2000_IAU_IAG",1737400.0,0.0]],PRIMEM["Reference_Meridian",0.0],UNIT["Degree",0.0174532925199433]]'
// The geologic map is in metres of its equidistant cylindrical projection, where -simplify works: 151.6 m is
// 0.005 degrees, well under its ~3 km vertex spacing
const GEOLOGY_SIMPLIFY_METERS = 151.6

/**
 * Runs GDAL in Docker, with the cache folder mounted at /cache.
 * @param {string[]} args - The GDAL command and its arguments
 * @returns {Promise<string>} stdout
 */
async function gdal(args) {
  const { stdout } = await promisify(execFile)(
    'docker',
    ['run', '--rm', '-v', `${CACHE}:/cache`, GDAL_IMAGE, ...args],
    { maxBuffer: MAX_OUTPUT_BYTES }
  )
  return stdout
}

/**
 * Reads a GDAL-readable vector source as GeoJSON features.
 * @param {string} source - e.g. '/vsizip//vsicurl/https://.../file.zip/layer.shp'
 * @param {string[]} [options] - More ogr2ogr options
 * @returns {Promise<GdalFeature[]>}
 */
async function readFeatures(source, options = []) {
  const output = await gdal(['ogr2ogr', '-f', 'GeoJSON', '/vsistdout/', source, ...options])
  return JSON.parse(output).features
}

/**
 * Downloads a file into the cache folder, unless it is already there.
 * @param {string} url
 * @param {string} fileName
 * @returns {Promise<string>} The file's path inside the container
 */
async function cached(url, fileName) {
  const path = join(CACHE, fileName)
  try {
    await access(path)
  } catch {
    console.log(`Downloading ${url}`)
    const response = await fetch(url)
    if (!response.ok || !response.body) {
      throw new Error(`GET ${url} failed with HTTP ${response.status}`)
    }
    await pipeline(Readable.fromWeb(response.body), createWriteStream(`${path}.part`))
    await rename(`${path}.part`, path)
  }
  return `/cache/${fileName}`
}

/**
 * Reads the geologic units poleward of a latitude as single, valid polygons in Moon 2000 degrees.
 * @param {string} zip - Path of the map's zip inside the container
 * @param {'south' | 'north'} pole
 * @returns {Promise<GdalFeature[]>}
 */
async function readGeologyCap(zip, pole) {
  const clip = pole === 'south' ? ['-180', '-90', '180', `-${CAP_LATITUDE}`] : ['-180', `${CAP_LATITUDE}`, '180', '90']
  const clippedName = `geology_${pole}.geojson`
  const clipped = `/cache/${clippedName}`
  // GeoJSON output can't be overwritten (ogr2ogr -overwrite fails on it), so a previous run's file goes first
  await rm(join(CACHE, clippedName), { force: true })
  // One polygon of the map is invalid, and clipping can leave multi-polygons even with -explodecollections,
  // hence -makevalid and a second pass to explode what remains
  await gdal([
    'ogr2ogr', '-f', 'GeoJSON', clipped, `/vsizip/${zip}/${UNIFIED_GEOLOGY_UNITS}`,
    '-sql', `SELECT FID AS ${UNIFIED_GEOLOGY_FID}, FIRST_Unit, FIRST_Un_1 FROM GeoUnits`,
    '-t_srs', MOON_2000, '-clipdst', ...clip,
    '-simplify', `${GEOLOGY_SIMPLIFY_METERS}`, '-makevalid', '-explodecollections', '-nlt', 'CONVERT_TO_LINEAR',
    '-lco', 'RFC7946=NO',
  ])
  return readFeatures(clipped, ['-explodecollections', '-lco', 'COORDINATE_PRECISION=5', '-lco', 'RFC7946=NO'])
}

/**
 * @param {string} fileName
 * @param {{ name: string, features?: unknown[] }} dataset
 * @param {string} summary
 */
async function writeDataset(fileName, dataset, summary) {
  const output = new URL(fileName, OUTPUT_FOLDER)
  await writeFile(output, JSON.stringify(dataset) + '\n')
  console.log(`Wrote ${summary} to ${output.pathname}`)
}

await mkdir(CACHE, { recursive: true })

const namedFeatures = buildNamedFeatures(
  await readFeatures(`/vsizip//vsicurl/${IAU_NOMENCLATURE_URL}/${IAU_NOMENCLATURE_LAYER}.shp`, [
    '-select',
    IAU_NOMENCLATURE_FIELDS.join(','),
  ])
)
await writeDataset('namedFeatures.json', namedFeatures, `${namedFeatures.features.length} IAU named features`)

const landingSites = buildLandingSites(
  await readFeatures(`/vsizip//vsicurl/${LROC_ANTHROPOGENIC_URL}/${LROC_ANTHROPOGENIC_LAYER}.SHP`, [
    '-select',
    LROC_ANTHROPOGENIC_FIELDS.join(','),
  ])
)
await writeDataset('landingSites.json', landingSites, `${landingSites.features.length} landing site objects`)

const geologyZip = await cached(UNIFIED_GEOLOGY_URL, 'Unified_Geologic_Map_of_the_Moon_GIS_v2.zip')
const geology = buildGeologicMap(
  { south: await readGeologyCap(geologyZip, 'south'), north: await readGeologyCap(geologyZip, 'north') },
  await readFeatures(`/vsizip/${geologyZip}/${UNIFIED_GEOLOGY_DESCRIPTIONS}`),
  await readFeatures(`/vsizip/${geologyZip}/${UNIFIED_GEOLOGY_COLORS}`)
)
await writeDataset(
  'geology.json',
  geology,
  `${geology.caps.south.units.length} south and ${geology.caps.north.units.length} north geologic unit polygons`
)
