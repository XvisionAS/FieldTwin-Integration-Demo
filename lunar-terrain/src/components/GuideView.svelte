<script>
  import { rankProducts, targetResolutionMeters } from '../ranking/rankProducts.js'
  import { createEventDispatcher } from 'svelte'

  import { DATA_SOURCES } from '../guides/dataSources.js'
  import ColormapSteps from './ColormapSteps.svelte'
  import DataSources from './DataSources.svelte'
  import ProductList from './ProductList.svelte'
  import ShapeFiles from './ShapeFiles.svelte'
  import ShapeSteps from './ShapeSteps.svelte'
  import TerrainSteps from './TerrainSteps.svelte'
  import { formatDistance } from '../format.js'
  import { SHAPE_DATASETS } from '../shapes/shapeDatasets.js'

  /**
   * @typedef {import('../catalog/catalog.js').CatalogProduct} CatalogProduct
   * @typedef {import('../guides/dataGuides.js').DataGuide} DataGuide
   * @typedef {import('../site/moonSite.js').Site} Site
   * @typedef {import('../site/moonSite.js').ViewBox} ViewBox
   */

  /**
   * @typedef {Object} Quality - A Quality choice of FieldTwin's 3D surface upload
   * @property {number} gridSize - Grid cells along the longer side
   * @property {string} label
   */

  /** @type {DataGuide} */
  export let guide
  /** @type {CatalogProduct[]} Every catalog product, of any kind */
  export let products
  /** @type {Site | undefined} */
  export let site
  /** @type {ViewBox | undefined} The view the site was read from */
  export let viewBox
  /** @type {string} Why there is no site to list files for, when `site` is undefined */
  export let siteMessage = ''
  /** @type {Quality[]} */
  export let qualities
  /** @type {number} */
  export let gridSize
  export let canEdit = false
  /** @type {string} */
  export let projectorUrl
  /** @type {string} */
  export let projectCRS

  /** @type {string | undefined} */
  let selectedId

  const dispatch = createEventDispatcher()

  $: shapeDataset = guide.shapeDataset ? SHAPE_DATASETS[guide.shapeDataset] : undefined
  $: guideProducts = products.filter((product) => product.kind === guide.productKind)
  $: ranked = site && !shapeDataset ? rankProducts(guideProducts, site, gridSize) : []
  $: selectedId = ranked.some(({ product }) => product.id === selectedId) ? selectedId : ranked[0]?.product.id
  $: selected = ranked.find(({ product }) => product.id === selectedId)?.product
  // Every file of a kind stores its values the same way, so the steps can explain them before a file is picked
  $: typical = selected || guideProducts[0]
  $: encoding = typical?.values
  $: quality = qualities.find((entry) => entry.gridSize === gridSize) || qualities[0]
  $: gridMeters = site ? targetResolutionMeters(site, gridSize) : 0
</script>

<h2 class="ftw-title">{guide.title}</h2>
<p><strong>What it is:</strong> {guide.what}</p>
<p><strong>Use it for:</strong> {guide.useFor}</p>
{#if guide.coverageNote}
  <p class="coverage">{guide.coverageNote}</p>
{/if}

<h3>Files for your site</h3>
{#if !site}
  <p>{siteMessage}</p>
{:else if shapeDataset && viewBox}
  <ShapeFiles dataset={shapeDataset} {site} {viewBox} {projectorUrl} {projectCRS} />
{:else}
  <div class="qualities" role="group" aria-label="Upload quality">
    {#each qualities as entry}
      <button class="ftw-button sm" class:primary={entry.gridSize === gridSize} on:click={() => (gridSize = entry.gridSize)}>
        {entry.label}
      </button>
    {/each}
    <span class="hint">grid of {formatDistance(gridMeters)}</span>
  </div>
  {#if ranked.length === 0}
    <p>No {guide.title.toLowerCase()} file covers this whole view. Zoom in, then click "Use current view".</p>
  {:else}
    <ProductList
      {ranked}
      {selectedId}
      qualityLabel={quality.label}
      {gridMeters}
      on:select={(event) => (selectedId = event.detail)}
    />
  {/if}
{/if}

<h3>How to bring it into FieldTwin</h3>
{#if shapeDataset}
  <ShapeSteps
    shapeImport={shapeDataset.shapeImport}
    hasColorRules={Boolean(shapeDataset.colorRules)}
    on:openGuide
    on:selectTag
  />
{:else if guide.uploadAs === 'terrain' && encoding}
  <TerrainSteps
    product={selected}
    zScale={encoding.scale}
    qualityLabel={quality.label}
    downloadUrl={typical?.downloadUrl}
  />
{:else if encoding}
  <ColormapSteps
    {guide}
    product={selected}
    {encoding}
    qualityLabel={quality.label}
    downloadUrl={typical?.downloadUrl}
    on:openGuide
  />
{/if}
{#if !canEdit}
  <p class="read-only">Your role can't edit this project: ask an editor to upload the files.</p>
{/if}

<h3>Where the data comes from</h3>
<DataSources sources={guide.sources.map((id) => DATA_SOURCES[id])} />
<p class="disclaimer">
  Published by its authors, not by FutureOn, and provided as published, without warranty: check the source before relying
  on it for engineering or mission decisions.
  <button class="link" on:click={() => dispatch('openGuide', 'about')}>About the data</button>
</p>

<style>
  h2 {
    margin: 0 0 6px;
  }

  h3 {
    margin: 12px 0 4px;
    font-size: 1em;
  }

  p {
    margin: 0 0 6px;
  }

  .coverage,
  .read-only {
    color: var(--ftw-button-warning-color);
  }

  .disclaimer {
    opacity: 0.8;
    font-size: 0.9em;
  }

  .link {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }

  .qualities {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 8px;
  }

  .hint {
    margin-left: 6px;
    opacity: 0.75;
  }
</style>
