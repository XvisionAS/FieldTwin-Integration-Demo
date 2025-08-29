const THREE     = require('three')
const fs        = require('fs');
const path      = require('path');
const mkdirp    = require('mkdirp')
const fetch     = require('node-fetch')
const yargs     = require('yargs')

const getFileOutput = function (asset) {
  const name         = asset.name.replace('/', '_')
  const assetLibrary = asset.assetLibrary || "generic"
  return {
    path:`./export/${assetLibrary}`,
    name
  }
}

require('./three/ColladaExporter')
require('./three/LegacyJSONLoader')
require('./three/DRACOLoader')
require('./three/GLTFLoader')

const argv  = yargs.option('backend', {
  description:'Source backend address, e.g. https://backend.qa.fieldtwin.com'
}).option('token', {
  description:'Source API token'
}).demandOption(
  'backend'
).demandOption(
  'token'
).argv

const DracoLoader = new THREE.DRACOLoader()

// Get the account assets using the FieldTwin API
const getAssets = async (options) => {
  const { backend, token } = options
  const url = new URL('/API/v1.10/assets', backend)

  const data = await fetch(url.href, {
    headers:{
      token:token
    }
  })
  return await data.json()
}

// Load asset in Three JSON format 1.0
// this was use in version of fieldap < 5.0
// and in the process of being deprecated.
const loadLegacyJSONAsset = async (asset) => {
  const data   = await fetch(asset.model3dUrl)
  const json   = await data.json()

  const loader = new THREE.LegacyJSONLoader();
  
  const model = loader.parse(json)  
  const mesh  = new THREE.Mesh(
    model.geometry, model.materials
  )

  const scene = new THREE.Scene()

  if (Array.isArray(asset.sockets2d)) {
    for (const socket of asset.sockets2d) {
      var geometry = new THREE.SphereGeometry( 0.1, 4, 4 );
      var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
      var sphere = new THREE.Mesh( geometry, material );
      sphere.name = 'tag_' + socket.name
      if (socket.params && socket.params.types) {
        sphere.name = sphere.name + '_' + socket.params.types[0]
      }
      sphere.position.set(socket.x, socket.z, -socket.y)
      mesh.add(sphere)
    }
  }
  scene.add(mesh)
  asset.scene = scene
  return asset
}

const exportGLTFAsset = async (asset) => {
  const data        = await fetch(asset.model3dUrl)
  const buffer      = await data.buffer()
  const fileOutput  = getFileOutput(asset)

  try {
    await mkdirp(fileOutput.path)
  } catch (e) {
    console.error(`failed to create export directory: ${e}`)
    throw(e)
  }

  const outputFile = path.join(fileOutput.path, `${fileOutput.name}.glb`)
  console.log('Saving file', outputFile)
  fs.writeFileSync(outputFile, buffer);
}

const main = async function () {

  const options = {
    backend:argv.backend, 
    token:argv.token
  }

  const assets = await getAssets(options) 

  for (key in assets) {
    const asset = assets[key]
    if (asset.type !== 'virtual') {
      const isGLTF = asset.params && asset.params.isGLTF
      try {
        if (isGLTF) {
          console.log (`Exporting GLTF asset ${asset.name}`)
          await exportGLTFAsset(asset)
        } else {
          console.log('Skipping non GLTF legacy asset', asset.name)
          // TODO convert legacy assets to GLTF
          continue
        }
      } catch (e) {
        console.log('Failed to export asset:', asset.name)
      }
    }
  }
}

main()
