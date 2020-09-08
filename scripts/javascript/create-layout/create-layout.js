const axios  = require('axios')
const parseArgs =require('minimist')


const PORT = process.env.PORT
const LEGACY_API_HOST =  process.env.LEGACY_API_HOST 
const HOST_URL  = LEGACY_API_HOST ? `https://${LEGACY_API_HOST}${PORT ? `:${PORT}` : ''}` : "http://legacyapi.lvh.me:3002"
const API_VERSION = 'v1.7'

const TOKEN = process.env.TOKEN
const argv = parseArgs(process.argv.slice(2))
const PROJECT_ID = argv.project
const SUB_PROJECT_ID= argv['sub-project']

const main = async () => {
  console.log('#### Creating Layout')
  console.log(`## Project ${PROJECT_ID}`)
  console.log(`## sub Project ${SUB_PROJECT_ID}`)
  const fs = require("fs");
  console.log('## Reading Data')
  const stdinBuffer = fs.readFileSync(0); // STDIN_FILENO = 0
  const layout = JSON.parse(stdinBuffer.toString())

  const mapIds = {}

  const wellsIds = Object.keys(layout.wells || {})

  //we create the wells.
  console.log('## creating wells')
  for (let id of wellsIds) {
    const payload = JSON.parse(JSON.stringify(layout.wells[id]))
    console.log(`# well head: ${payload.name}`)
    //without the well bores
    payload.kind = payload.kind && payload.kind.id
    const wellBores = payload.wellBores || []
    delete payload.wellBores
    delete payload.activeWellBore

    // that's due to a bug in legacyapi fixed in 5.3
    delete payload.metaData
    
    const well = await axios({
      method: 'post',
      data: payload,
      url: `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}/well`,
      headers: {token: TOKEN}
    })
    const newWelId = well.data.id
    mapIds[id] = newWelId
    console.log(`# well Bore for ${payload.name}`)
    for (let i = 0; i < wellBores.length; i++) {
      const wellBorePayload = wellBores[i]
      console.log(wellBorePayload.name)
      wellBorePayload.targets = [{x:0, y:0, z:0}, {x:0, y:0, z:0}]
      //  there is a bug her  in legacy fixed in 5.3
      delete wellBorePayload.metaData
      
      const wellBore = await axios({
        method: 'post',
        data: wellBorePayload,
        url: `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}/well/${newWelId}/wellBore`,
        headers: {token: TOKEN}
      })
    }

  }

  const stagedAssetsIds = Object.keys(layout.stagedAssets || {})

  //we create first the staged Assets.
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
    delete payload.lastSelectedWell
    delete payload.well

    
    //connection do not exist yet
    delete payload.connectionsAsFrom
    delete payload.connectionsAsTo

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

    payload.from = mapIds[payload.from.id]
    payload.to = mapIds[payload.to.id]
    payload.designType = payload.designType != 'None' ? payload.designType : 'Standard'
    const connection = await axios({
      method: 'post',
      data: payload,
      url: `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}/connection`,
      headers: {token: TOKEN}
    })
    mapIds[id] = connection.data.id
  }
}


main().then(
  () => process.exit(0)
).catch(
  (e) => {
    console.log(e)
    return process.exit(1)
  }
)
