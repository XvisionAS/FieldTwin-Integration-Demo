import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

import { integrationManifest } from './manifest/vitePlugin.js'

export default defineConfig({
  plugins: [svelte(), integrationManifest()],
  // Relative asset paths, so the built app works from any folder of a static host
  base: './',
  // The bundled shape datasets (src/shapes/data/) are large chunks by design, loaded only by their guide
  build: { chunkSizeWarningLimit: 2000 },
})
