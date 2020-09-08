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
  const layout = {}
  //first get subProject Informations
  
  const subProject = await axios({
    method: 'get',
    url: `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}`,
    headers: {token: TOKEN}
  })
  const object = [
    'stagedAssets',
    'connections'
  ]
  
  const stagedAssetsId = Object.keys(subProject.data.stagedAssets || {})
  layout.stagedAssets = {}
  for (let i = 0; i < stagedAssetsId.length; i++) {
    const id = stagedAssetsId[i]
    const stagedAsset = await axios({
      method: 'get',
      url: `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}/stagedAsset/${id}`,
      headers: {token: TOKEN}
    })
    layout.stagedAssets[id] = stagedAsset.data
  }

  const connectionsId = Object.keys(subProject.data.connections || {})
  layout.connections = {}
  for (let i = 0; i < connectionsId.length; i++) {
    const id = connectionsId[i]
    const connection = await axios({
      method: 'get',
      url: `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}/connection/${id}`,
      headers: {token: TOKEN}
    })
    layout.connections[id] = connection.data
  }

  const wellsId = Object.keys(subProject.data.wells || {})
  layout.wells = {}
  for (let i = 0; i < wellsId.length; i++) {
    const id = wellsId[i]
    const well = await axios({
      method: 'get',
      url: `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}/well/${id}`,
      headers: {token: TOKEN}
    })
    layout.wells[id] = well.data
  }

  const wellBoresId = Object.keys(subProject.data.wellBores || {})
  layout.wellBores = {}
  for (let i = 0; i < wellBoresId.length; i++) {
    const id = wellBoresId[i]
    const wellBore = await axios({
      method: 'get',
      url: `${HOST_URL}/API/${API_VERSION}/${PROJECT_ID}/subProject/${SUB_PROJECT_ID}/wellBore/${id}`,
      headers: {token: TOKEN}
    })
    layout.wellBores[id] = wellBore.data
  }
  
  console.log(JSON.stringify(layout))
}

main().then(
  () => process.exit(0)
).catch(
  (e) => {
    console.log(e)
    return process.exit(1)
  }
)