#!/usr/bin/env node
import { loadDescriptor } from '../src/descriptor.js'
import { orchestrate } from '../src/run.js'

const USAGE = `smart-asset-stitcher — assemble FieldTwin smart assets into a single GLTF/GLB

Usage:
  smart-asset-stitcher <descriptor.json> [--optimize]

Arguments:
  <descriptor.json>   Path to a descriptor JSON file. It must contain:
                        api, token, projectId, subProjectId, streamId, output
                      and optionally:
                        stagedAssetIds[]  — stitch just these staged assets.
                                            Omit it to fetch the whole sub-project
                                            and stitch every smart asset in it.

Options:
  --optimize          Run dedup + prune on the stitched glb to reduce size.
  -h, --help          Show this help.

Part GLBs are downloaded once into a shared, deduped cache:
  <output>/assets/*.glb
For each stitched staged asset the tool writes:
  <output>/<stagedAssetId>/stitched.glb
  <output>/<stagedAssetId>/description.json
`

/**
 * Parse argv into a descriptor path and flags.
 *
 * @param {string[]} argv process.argv.slice(2)
 * @returns {{ descriptorPath?: string, optimize: boolean, help: boolean }}
 */
function parseArgs(argv) {
  let descriptorPath
  let optimize = false
  let help = false
  for (const arg of argv) {
    if (arg === '-h' || arg === '--help') {
      help = true
    } else if (arg === '--optimize') {
      optimize = true
    } else if (!descriptorPath) {
      descriptorPath = arg
    }
  }
  return { descriptorPath, optimize, help }
}

async function main() {
  const { descriptorPath, optimize, help } = parseArgs(process.argv.slice(2))
  if (help || !descriptorPath) {
    process.stdout.write(USAGE)
    process.exit(help ? 0 : 1)
  }

  const descriptor = await loadDescriptor(descriptorPath)
  if (optimize) {
    descriptor.optimize = true
  }

  const results = await orchestrate(descriptor, { log: (message) => process.stderr.write(`${message}\n`) })

  for (const result of results) {
    process.stdout.write(
      `✔ ${result.stagedAssetId}: ${result.partCount} part(s) -> ${result.glbPath} (${result.skippedNodes} skipped)\n`
    )
  }
  process.stdout.write(`Done: stitched ${results.length} staged asset(s).\n`)
}

main().catch((error) => {
  process.stderr.write(`✖ ${error.message}\n`)
  process.exit(1)
})
