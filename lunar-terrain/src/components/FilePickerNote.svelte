<!-- FieldTwin's 3D surface file dialog used to list only .xyz, .tif, .dem, .dat and .txt files, although the
upload reads the .jp2 downloads fine -->
<script>
  /** @type {string | undefined} The download the user will pick */
  export let downloadUrl
</script>

{#if downloadUrl?.toLowerCase().endsWith('.jp2')}
<span class="note">If the file dialog doesn't show the <code>.jp2</code> file, switch its file type filter to
  <em>All files</em>.</span>
{/if}

<style>
  .note {
    display: block;
    opacity: 0.8;
  }
</style>
