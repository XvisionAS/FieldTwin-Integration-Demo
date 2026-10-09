<script>
  import { createEventDispatcher } from 'svelte'

  import { formatBytes, formatDistance } from '../format.js'

  /** @typedef {import('../ranking/rankProducts.js').RankedProduct} RankedProduct */

  /** @type {RankedProduct[]} */
  export let ranked
  /** @type {string | undefined} */
  export let selectedId
  /** @type {string} The chosen upload Quality, e.g. 'Extreme' */
  export let qualityLabel
  /** @type {number} Grid spacing that Quality gives for this site */
  export let gridMeters

  const SHORT_LIST_LENGTH = 6
  const dispatch = createEventDispatcher()

  let showAll = false

  $: visible = showAll ? ranked : ranked.slice(0, SHORT_LIST_LENGTH)
</script>

<ul class="products">
  {#each visible as { product, meetsTarget }, index (product.id)}
    <li>
      <button
        class="product"
        class:selected={product.id === selectedId}
        on:click={() => dispatch('select', product.id)}
        title={product.id}
      >
        <span class="name">
          {product.name}
          {#if index === 0}<span class="badge recommended">Recommended</span>{/if}
        </span>
        <span class="details">
          {formatDistance(product.resolutionMeters)}/px · {formatBytes(product.bytes)}
          {#if !meetsTarget}
            <span
              class="badge coarse"
              title="Its {formatDistance(product.resolutionMeters)} pixels are larger than the {formatDistance(
                gridMeters
              )} grid of {qualityLabel}, so the terrain will be smoother than {qualityLabel} allows."
            >
              Less detail than {qualityLabel}
            </span>
          {/if}
        </span>
      </button>
    </li>
  {/each}
</ul>
{#if ranked.length > SHORT_LIST_LENGTH}
  <button class="ftw-button sm" on:click={() => (showAll = !showAll)}>
    {showAll ? 'Show fewer' : `Show all ${ranked.length} files`}
  </button>
{/if}

<style>
  .products {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .product {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 6px 8px;
    text-align: left;
    color: inherit;
    background: var(--ftw-input-background-color);
    border: 1px solid var(--ftw-input-border-color);
    border-radius: 3px;
    cursor: pointer;
  }

  .product.selected {
    border-color: var(--ftw-input-focus-border-color);
  }

  .details {
    opacity: 0.75;
    font-size: 0.9em;
  }

  .badge {
    margin-left: 6px;
    padding: 0 4px;
    border-radius: 3px;
    font-size: 0.8em;
    border: 1px solid currentColor;
  }

  .recommended {
    color: var(--ftw-button-success-color);
  }

  .coarse {
    color: var(--ftw-button-warning-color);
  }
</style>
