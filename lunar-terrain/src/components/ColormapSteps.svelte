<script>
  import { createEventDispatcher } from 'svelte'

  import { isEncoded, toSample } from '../guides/dataGuides.js'
  import DownloadButton from './DownloadButton.svelte'
  import FilePickerNote from './FilePickerNote.svelte'

  /**
   * @typedef {import('../catalog/catalog.js').CatalogProduct} CatalogProduct
   * @typedef {import('../catalog/catalog.js').SampleEncoding} SampleEncoding
   * @typedef {import('../guides/dataGuides.js').DataGuide} DataGuide
   */

  /** @type {DataGuide} */
  export let guide
  /** @type {CatalogProduct | undefined} The file picked in the list, if any */
  export let product
  /** @type {SampleEncoding} How the guide's files store their values */
  export let encoding
  /** @type {string} The Quality label to pick in the upload dialog */
  export let qualityLabel
  /** @type {string | undefined} A download of the guide's kind, picked or not, for its file type */
  export let downloadUrl

  const dispatch = createEventDispatcher()

  /** @param {number} value */
  const formatValue = (value) => `${value}${guide.unitSymbol || ''}`
</script>

<ol class="steps">
  <li>
    Upload the terrain first
    (<button class="link" on:click={() => dispatch('openGuide', 'terrain')}>Terrain guide</button>): this layer's
    colours are draped over it.
  </li>
  <li>
    <DownloadButton {product} />
    Keep the 3D view on the same area as the terrain.
  </li>
  <li>
    Open <strong>3D Surface ...</strong> in the toolbar and choose the file. Set <strong>Limit Import To</strong> to
    <em>Current view</em>, <strong>Quality</strong> to <em>{qualityLabel}</em> and <strong>Survey Type</strong> to
    <em>Colormap</em>.
    {#if encoding.missing !== undefined}
      Tick <strong>NODATA</strong> and enter <em>{encoding.missing}</em>, the file's marker for missing values.
    {/if}
    Keep <strong>Z Values</strong> <em>Elevation above the reference sphere</em>.
    <FilePickerNote {downloadUrl} />
  </li>
  <li>
    When the layer is ready, select it. On the Layers tab, tick <strong>Height Sample</strong> and choose the
    terrain layer as <strong>Sampling Layer</strong>: the colours now follow the ground.
  </li>
  <li>
    The colours run from blue (lowest) to red (highest value in the view). Use <strong>Edit Gradient</strong>
    (Layers tab) to pick your own stops, and <strong>Opacity</strong> (Common tab) to let the terrain's shading
    show through.
    {#if isEncoded(encoding)}
      FieldTwin shows the file's raw numbers, not {guide.title.toLowerCase()} values:
      value = raw × {encoding.scale}{encoding.offset ? ` + ${encoding.offset}` : ''}.
    {/if}
    {#if guide.marks}
      <table class="marks">
        <thead>
          <tr><th>{guide.title}</th><th>Meaning</th><th>Enter in Edit Gradient</th></tr>
        </thead>
        <tbody>
          {#each guide.marks as mark}
            <tr>
              <td>{formatValue(mark.value)}</td>
              <td>{mark.meaning}</td>
              <td><code>{toSample(mark.value, encoding)}</code></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </li>
</ol>
<p class="note">The cursor readout shows the terrain's height, not this layer's value.</p>

<style>
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
  }

  .marks {
    margin-top: 4px;
    border-collapse: collapse;
  }

  .marks th,
  .marks td {
    padding: 2px 8px 2px 0;
    text-align: left;
  }

  .note {
    opacity: 0.8;
  }
</style>
