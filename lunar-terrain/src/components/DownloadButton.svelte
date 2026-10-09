<script>
  import Fa from 'svelte-fa'
  import { faDownload } from '@fortawesome/free-solid-svg-icons'

  import { formatBytes } from '../format.js'

  /** @typedef {import('../catalog/catalog.js').CatalogProduct} CatalogProduct */

  /** @type {CatalogProduct | undefined} */
  export let product
</script>

{#if product}
  <a class="ftw-button primary download" href={product.downloadUrl} target="_blank" rel="noopener noreferrer">
    <Fa icon={faDownload} />
    Download {product.name} ({formatBytes(product.bytes)})
  </a>
{:else}
  Download a file from the list above (it appears once the 3D view shows your site).
{/if}

<style>
  .download {
    display: flex;
    width: fit-content;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    text-decoration: none;
    /* FieldTwin's a:link colour would otherwise win over the button's text colour */
    color: var(--ftw-button-current-text-color);
  }
</style>
