const THREE     = require('three')
const fs        = require('fs');
const util      = require('util');
const mkdirp    = require('mkdirp')
const fetch     = require('node-fetch')
const yargs     = require('yargs')
const path      = require('path')

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

require('./three/ColladaExporter')
require('./three/LegacyJSONLoader')
require('./three/DRACOLoader')
require('./three/GLTFLoader')


const argv  = yargs.option('backend', {
  description:'Source Backend address https://backend.qa.fieldap.com'
}).option('token', {
  description:'Source API token'
}).demandOption(
  'backend'
).demandOption(
  'token'
).argv

///////////////////////////////////////////////////////////////////////////////
// global draco decompressor
///////////////////////////////////////////////////////////////////////////////
const DracoLoader = new THREE.DRACOLoader();
DracoLoader.setDecoderPath( './draco/' );

// bit of a hack, but DracoLoad is only able to load draco library 
// using HTTP request, so we replace the loading function by ours
DracoLoader._initDecoder = async function ( url, responseType ) {
  this.workerSourceURL = './draco/draco_decoder.wasm'
}

DracoLoader.preload()
///////////////////////////////////////////////////////////////////////////////
// retrieve all assets using LegacyAPI
// https://apidocs.fieldap.com/#api-Assets-GetAssets
const getAssets = async (options) => {
  const { backend, token } = options
  const url = new URL('/API/v1.4/assets', backend)
    
  const data = await fetch(url.href, {
    headers:{
      token:token
    }
  })
  return await data.json()
}


///////////////////////////////////////////////////////////////////////////////
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


///////////////////////////////////////////////////////////////////////////////
// Load asset in GLTF, binary blob, probably using Draco Compression
const loadGLTFAsset = async (asset) => {
  const loader = new THREE.GLTFLoader()
  loader.setDRACOLoader( DracoLoader );
  
  const data   = await fetch(asset.model3dUrl)
  const buffer = await data.buffer()
  const gltf   = await new Promise( 
    (accept, reject) => {
      loader.parse(buffer, '', accept, reject)
    }
  )
  asset.scene = gltf.scene

  return asset
}

const loadAsset = async (asset) => {
  const isGLTF = asset.params && asset.params.isGLTF
  if (isGLTF) {
    return loadGLTFAsset(asset)
  } 
  return loadLegacyJSONAsset(asset)
}

const main = async function () {

  const options = {
    backend:argv.backend, 
    token:argv.token
  }
  
  const assets    = await getAssets(options) 
  const promises  = []


  for (key in assets) {
    const asset = assets[key]
    if (asset.type !== 'virtual') {
      promises.push(
        loadAsset(asset).catch( e => console.log(`[eee] cannot load model for asset ${asset.name}`, e, asset) )
      )  
    }
  }
  await Promise.all(promises)

  for (const asset of promises) {
    if (asset && asset.scene) {
      const exporter     = new THREE.ColladaExporter();
      const collada      = exporter.parse(asset.scene)
      const name         = asset.name.replace('/', '_')
      const assetLibrary = asset.assetLibrary || "generic"

      try {
        await mkdirp(`./export/${assetLibrary}`)
      } catch (e) {
    
      }        
      await writeFile(`./export/${assetLibrary}/${name}.dae`, collada.data)    
  
    }
  }

}

main()