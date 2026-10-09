<script>
  import Fa from 'svelte-fa'
  import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'

  import DownloadButton from './DownloadButton.svelte'
  import FilePickerNote from './FilePickerNote.svelte'

  /** @typedef {import('../catalog/catalog.js').CatalogProduct} CatalogProduct */

  /** @type {CatalogProduct | undefined} The file picked in the list, if any */
  export let product
  /** @type {number} Height step of the files, e.g. 0.5 */
  export let zScale
  /** @type {string} The Quality label to pick in the upload dialog */
  export let qualityLabel
  /** @type {string | undefined} A download of the guide's kind, picked or not, for its file type */
  export let downloadUrl
</script>

<ol class="steps">
  <li>
    <DownloadButton {product} />
    Keep the 3D view on the same area.
  </li>
  <li>
    Open <strong>3D Surface ...</strong> in the toolbar and choose the file. Set <strong>Limit Import To</strong> to
    <em>Current view</em> and <strong>Quality</strong> to <em>{qualityLabel}</em>. Keep <strong>Survey Type</strong>
    <em>Topographic</em> and <strong>Z Values</strong> <em>Elevation above the reference sphere</em>.
    <FilePickerNote {downloadUrl} />
  </li>
  <li>
    When the layer is ready, select it and set <strong>Z Scale</strong> to <em>{zScale}</em> (Common tab).
    <p class="warning">
      <Fa icon={faTriangleExclamation} />
      <span>
        Don't skip this: the file stores heights in {zScale} m steps, and the upload reads each step as 1 m. The {zScale}
        factor comes in a separate file the upload never sees, so without Z Scale {zScale} the terrain is {1 / zScale}
        times too tall.
      </span>
    </p>
  </li>
</ol>
