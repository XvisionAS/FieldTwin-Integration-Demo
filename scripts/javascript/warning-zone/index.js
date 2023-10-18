const axios = require('axios')
const parseArgs = require('minimist')

const TOKEN = process.env.TOKEN
const PORT = process.env.PORT || ''
const BACKEND_HOST = `${
  process.env.BACKEND_HOST
    ? 'https://' + process.env.BACKEND_HOST
    : 'http://futureon-backend.lvh.me'
}`
const HOST_URL = `${BACKEND_HOST}${PORT ? ':' : ''}${PORT}`
const API_VERSION = 'v1.9'

const argv = parseArgs(process.argv.slice(''))
const PROJECT_ID = argv['project']
const SUB_PROJECT_ID = argv['sub-project']
const STREAM_ID = argv['stream']

const stagedAssetsUrl = `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}:${STREAM_ID}/stagedassets`
const shapesUrl = `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}:${STREAM_ID}/shapes`

const main = async () => {
  const stagedAssetsReq = await axios.get(stagedAssetsUrl, {
    headers: { token: TOKEN },
  })
  // get list of staged assets
  const stagedAssets = stagedAssetsReq.data

  const shapesReq = await axios.get(shapesUrl, { headers: { token: TOKEN } })
  // get list of shapes
  const shapes = shapesReq.data.shapes

  if (stagedAssets && shapes) {
    for (const shape of shapes) {
      // for each circle shape find out the list of staged assets with origin inside the circle
      if (shape.shapeType === 'Circle') {
        const stagedAssetsInOverlappedZone = isInside(shape, stagedAssets)
        // add warning as tag for staged assets.
        if (stagedAssetsInOverlappedZone.length > 0) {
          const patchedShapes = await addWarningTag(
            shape, stagedAssetsInOverlappedZone
          )
          console.log(patchedShapes)
        }
      }
    }
  }
}

const isInside = (shape, stagedAssets) => {
  const inDangerZoneAssts = []
  for (const key in stagedAssets) {
    if (
      (stagedAssets[key].initialState.x - shape.x) *
        (stagedAssets[key].initialState.x - shape.x) +
        (stagedAssets[key].initialState.y - shape.y) *
          (stagedAssets[key].initialState.y - shape.y) <=
      shape.circleRadius * shape.circleRadius
    )
      inDangerZoneAssts.push(stagedAssets[key])
  }
  return inDangerZoneAssts
}

const addWarningTag = async (shape, stagedAssetsInOverlappedZone) => {
  const payload = {
    globals: {
      tags: [`Falls inside ${shape.name}`],
    },
  }
  for (const stagedAsset of stagedAssetsInOverlappedZone) {
    payload[stagedAsset.id] = {}
  }

  const patchAssetsReq = await axios.patch(stagedAssetsUrl, payload, {
    headers: { 'Content-Type': 'application/json', token: TOKEN },
  })
  const patchedStagedAssets = patchAssetsReq.data

  return patchedStagedAssets
}

main().catch((e) => {
  if (e.response) {
    console.error(
      `\nError:\n${e.request.method} ${e.request.path}\n` +
        `${e.response.status} ${e.response.statusText}\n${JSON.stringify(
          e.response.data
        )}`
    )
  } else {
    console.error(e)
  }
  process.exit(1)
})
