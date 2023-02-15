const axios     = require('axios')
const parseArgs = require('minimist')

const TOKEN           = process.env.TOKEN
const PORT            = process.env.PORT || ''
const BACKEND_HOST    = process.env.BACKEND_HOST
const HOST_URL        = `https://${BACKEND_HOST}${PORT ? ':' : ''}${PORT}`
const API_VERSION     = 'v1.9'

const argv            = parseArgs(process.argv.slice(2))
const PROJECT_ID      = argv['project']
const SUB_PROJECT_ID  = argv['sub-project']

// This requires the create-layout project to be in the same account as the get-layout project
// (otherwise the metadata definition IDs may not match)
const RESTORE_METADATA = false

const main = async () => {
  const fs = require("fs")

  console.log('#### Creating Layout')
  console.log(`## Project ${PROJECT_ID}`)
  console.log(`## Sub Project ${SUB_PROJECT_ID}`)
  console.log('## Reading Data')
  const stdinBuffer = fs.readFileSync(0) // STDIN_FILENO = 0
  const layout = JSON.parse(stdinBuffer.toString())

  const mapIds = {}

  const wellsIds = Object.keys(layout.wells || {})

  console.log('## creating wells')
  for (let id of wellsIds) {
    const payload = JSON.parse(JSON.stringify(layout.wells[id]))
    console.log(`# well head: ${payload.name}`)
    // create well without the well bores
    payload.kind = payload.kind && payload.kind.id
    const wellBores = payload.wellBores || []
    delete payload.kind
    delete payload.subProject
    delete payload.clonedFroms
    delete payload.importParams
    delete payload.wellBores
    delete payload.activeWellBore
    if (!RESTORE_METADATA) {
      delete payload.metaData
    }

    const well = await axios({
      method: 'post',
      data: payload,
      url: `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}/well`,
      headers: {token: TOKEN}
    })
    const newWelId = well.data.id
    mapIds[id] = newWelId
    console.log(`# well bore for ${payload.name}`)
    for (let i = 0; i < wellBores.length; i++) {
      const wellBorePayload = wellBores[i]
      console.log(wellBorePayload.name)
      wellBorePayload.targets = [{x:0, y:0, z:0}, {x:0, y:0, z:0}]
      delete wellBorePayload.kind
      delete wellBorePayload.clonedFroms
      delete wellBorePayload.importParams
      if (!RESTORE_METADATA) {
        delete wellBorePayload.metaData
      }

      const wellBore = await axios({
        method: 'post',
        data: wellBorePayload,
        url: `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}/well/${newWelId}/wellBore`,
        headers: {token: TOKEN}
      })
    }
  }

  const stagedAssetsIds = Object.keys(layout.stagedAssets || {})

  console.log('## creating staged assets')
  for (let id of stagedAssetsIds) {

    const payload = JSON.parse(JSON.stringify(layout.stagedAssets[id]))
    console.log(`# creating ${payload.name}`) 
    // link the stagedAsset to this asset id
    payload.asset = payload.asset.id

    if (payload.asset.type !== 'submerged') {
      payload.initialState.z = undefined
    }

    payload.initialState.lastSelectedWell = payload.well?.id ? mapIds[payload.well?.id] : undefined
    delete payload.subProject
    delete payload.clonedFroms
    delete payload.importParams
    delete payload.lastSelectedWell
    delete payload.well

    // connections do not exist yet
    delete payload.connectionsAsFrom
    delete payload.connectionsAsTo

    if (!RESTORE_METADATA) {
      delete payload.metaData
    }

    const stagedAsset = await axios({
      method: 'post',
      data: payload,
      url: `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}/stagedAsset`,
      headers: {token: TOKEN}
    })
    mapIds[id] = stagedAsset.data.id
  }

  const connectionsIds = Object.keys(layout.connections || {})

  console.log('## creating connections')
  for (let id of connectionsIds) {

    const payload = JSON.parse(JSON.stringify(layout.connections[id]))
    console.log(`# creating ${payload.params.label}`) 
    delete payload.subProject
    delete payload.clonedFroms
    delete payload.importParams
    delete payload.length
    delete payload.connectionType // taken from params.type
    delete payload.definition     // taken from params.type
    delete payload.designName     // taken from designType
    payload.designType ||= 'None'

    payload.from = mapIds[payload.from.id]
    payload.to = mapIds[payload.to.id]

    if (!RESTORE_METADATA) {
      delete payload.metaData
    }

    // TODO FIXME API v1.9 validation needs updating for connection creation
    connectionFilter(payload)

    const connection = await axios({
      method: 'post',
      data: payload,
      url: `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}/connection`,
      headers: {token: TOKEN}
    })
    mapIds[id] = connection.data.id
  }
}

// TODO FIXME API v1.9 this can be deleted after connection validation has been updated
const connectionFilter = (conn) => {
  const remove = [
    'bendable', 'bendParams', 'shapes', 'visible', 'isValidForCost', 'tags',
    'noHeightSampling', 'isInactive', 'opacity', 'renderAs', 'fromSocketLabel',
    'toSocketLabel'
  ]
  remove.forEach(attr => delete conn[attr])
  if (conn.costObject) { delete conn.costObject.costPerDay }
  if (conn.params) {
    const typeId = conn.params.type
    for (const attr in conn.params) {
      delete conn.params[attr]
    }
    conn.params.type = typeId
  }
}

main().catch((e) => {
  if (e.response) {
    console.error(
      `\nError:\n${e.request.method} ${e.request.path}\n` +
      `${e.response.status} ${e.response.statusText}\n${JSON.stringify(e.response.data)}`
    )
  } else {
    console.error(e)
  }
  process.exit(1)
})
