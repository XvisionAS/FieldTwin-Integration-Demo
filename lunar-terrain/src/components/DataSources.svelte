<script>
  /** @typedef {import('../guides/dataSources.js').DataSource} DataSource */

  /** @type {DataSource[]} */
  export let sources
</script>

<ul class="sources">
  {#each sources as source (source.url + source.name)}
    <li>
      <a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a>, {source.provider}.
      <span class="citation">Cite as: {source.citation}</span>
      {#if source.terms}<span class="citation">Terms: {source.terms}</span>{/if}
    </li>
  {/each}
</ul>

<style>
  .sources {
    margin: 4px 0 6px;
    padding-left: 20px;
    line-height: 1.4;
  }

  .sources li {
    margin-bottom: 4px;
  }

  .citation {
    display: block;
    opacity: 0.8;
    font-size: 0.9em;
  }
</style>
