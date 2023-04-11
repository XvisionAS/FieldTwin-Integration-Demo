import * as THREE from 'three';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { mkdirp } from 'mkdirp';
import fetch from 'node-fetch';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Worker } from 'node:worker_threads';
import { resolveObjectURL } from 'node:buffer';
import temp from 'temp';

globalThis.Worker = Worker;
const writeFile = util.promisify(fs.writeFile);

const getFileOutput = function (asset) {
  const name = asset.name.replace('/', '_');
  const assetLibrary = asset.assetLibrary || 'generic';
  return {
    path: `./export/${assetLibrary}`,
    name,
  };
};

import { ColladaExporter } from 'three/examples/jsm/exporters/ColladaExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

class DRACOFileLoader extends DRACOLoader {
  _loadLibrary(url, responseType) {
    return new Promise((resolve, reject) => {
      console.log('loading: ', url, ' with responseType: ', responseType);
      fs.readFile(
        this.decoderPath + url,
        responseType == 'text' ? 'utf8' : null,
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        }
      );
    });
  }
  _done = false;
  async _initDecoder() {
    if (this._done) {
      return this._done;
    }

    await super._initDecoder();
    const blob = await resolveObjectURL(this.workerSourceURL);
    var tempName = temp.path({ suffix: '.js' });
    await writeFile(tempName, await blob.text());
    this.workerSourceURL = tempName;
    this._done = true;
  }
}

import { LegacyJSONLoader } from './three/LegacyJSONLoader.js';

const argv = yargs(hideBin(process.argv))
  .option('backend', {
    description:
      'Source backend address, e.g. https://backend.qa.fieldtwin.com',
  })
  .option('token', {
    description: 'Source API token',
  })
  .demandOption('backend')
  .demandOption('token').argv;
///////////////////////////////////////////////////////////////////////////////
// global draco decompressor
///////////////////////////////////////////////////////////////////////////////
const dracoLoader = new DRACOFileLoader();
dracoLoader.setDecoderPath(
  './node_modules/three/examples/jsm/libs/draco/gltf/'
);
/////////////////////////////////////
// dracoLoader.setDecoderConfig({ type: 'js' }); //////////////////////////////////////////
// retrieve all asset definitions using LegacyAPI
// https://api.fieldtwin.com/#api-Assets-GetAssets
const getAssets = async (options) => {
  const { backend, token } = options;
  const url = new URL('/API/v1.9/assets', backend);
  const data = await fetch(url.href, {
    headers: {
      token: token,
    },
  });
  const json = await data.json();
  return json;
};

///////////////////////////////////////////////////////////////////////////////
// Load asset in Three JSON format 1.0
// this was use in version of fieldap < 5.0
// and in the process of being deprecated.
const loadLegacyJSONAsset = async (asset) => {
  const data = await fetch(asset.model3dUrl);
  const json = await data.json();

  const loader = new LegacyJSONLoader();

  const model = loader.parse(json);
  const mesh = new THREE.Mesh(model.geometry, model.materials);

  const scene = new THREE.Scene();

  if (Array.isArray(asset.sockets2d)) {
    for (const socket of asset.sockets2d) {
      var geometry = new THREE.SphereGeometry(0.1, 4, 4);
      var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      var sphere = new THREE.Mesh(geometry, material);
      sphere.name = 'tag_' + socket.name;
      if (socket.params && socket.params.types) {
        sphere.name = sphere.name + '_' + socket.params.types[0];
      }
      sphere.position.set(socket.x, socket.z, -socket.y);
      mesh.add(sphere);
    }
  }
  scene.add(mesh);
  asset.scene = scene;
  return asset;
};

globalThis.navigator = {
  userAgent: 'none',
};

///////////////////////////////////////////////////////////////////////////////
// Load asset in GLTF, binary blob, probably using Draco Compression
const loadGLTFAsset = async (asset) => {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const data = await fetch(asset.model3dUrl);
  const buffer = await data.arrayBuffer();
  const fileOutput = getFileOutput(asset);
  const texturePath = path.join(fileOutput.path, fileOutput.name);

  const gltf = await new Promise((accept, reject) => {
    loader.parse(buffer, texturePath, accept, reject);
  });
  asset.scene = gltf.scene;

  return asset;
};

const loadAsset = async (asset) => {
  const isGLTF = asset.params && asset.params.isGLTF;
  if (isGLTF) {
    return loadGLTFAsset(asset);
  }
  return loadLegacyJSONAsset(asset);
};

const main = async function () {
  const options = {
    backend: argv.backend,
    token: argv.token,
  };

  const assets = await getAssets(options);
  const promises = [];

  for (const key in assets) {
    const asset = assets[key];
    if (asset.type !== 'virtual') {
      console.log(`loading ${asset.name}`);
      const scene = await loadAsset(asset);
      promises.push(scene);
    }
  }
  await Promise.all(promises);

  for (const asset of promises) {
    if (asset && asset.scene) {
      const exporter = new ColladaExporter();
      const collada = exporter.parse(asset.scene);
      const fileOutput = getFileOutput(asset);

      try {
        await mkdirp(fileOutput.path);
      } catch (e) {
        console.error(`failed to create export directory: ${e}`);
        continue;
      }
      console.log(`exporting ${asset.name}`);
      const fileName = path.join(fileOutput.path, `${fileOutput.name}.dae`);
      await writeFile(fileName, collada.data);
      if (Array.isArray(collada.textures)) {
        for (let i = 0; i < collada.textures.length; ++i) {
          const texture = collada.textures[i];
          await writeFile(
            path.join(fileOutput.path, texture.directory, texture.name),
            texture.data,
            'binary'
          );
        }
      }
    }
  }
};

main();
