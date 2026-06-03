import { NodeIO } from '@gltf-transform/core'
import { KHRDracoMeshCompression } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

/**
 * Create a NodeIO that can read (and re-encode) Draco-compressed GLBs.
 *
 * FieldTwin part GLBs are commonly `KHR_draco_mesh_compression`-encoded, so the
 * extension plus its WASM decoder/encoder must be registered or `io.read` throws
 * "Missing required extension". Building the decoder/encoder modules is async, so
 * this factory is async too.
 *
 * @returns {Promise<NodeIO>}
 */
export async function createIO() {
  const io = new NodeIO().registerExtensions([KHRDracoMeshCompression])
  io.registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  })
  return io
}
