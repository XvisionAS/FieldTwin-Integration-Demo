<script>
  import Fa from 'svelte-fa'
  import { faCopy } from '@fortawesome/free-solid-svg-icons'

  const manifestUrl = new URL('manifest.json', document.baseURI).href

  let copied = false
  let copyError = ''

  async function copyManifestUrl() {
    try {
      await navigator.clipboard.writeText(manifestUrl)
      copied = true
      copyError = ''
    } catch (error) {
      copyError = 'Copy failed: select the address and copy it by hand.'
    }
  }
</script>

<p>
  This page is a FieldTwin integration: a guide to the Moon data (terrain, slope, roughness, ...) you can bring into a
  lunar project, with the files covering the area in view.
</p>
<p>To add it to a FieldTwin account:</p>
<ol class="steps">
  <li>In FieldTwin's admin app, open the account's <strong>Integrations</strong>.</li>
  <li>
    Click <strong>Download Manifest from Url</strong>, paste this address and click <strong>Submit</strong>:
    <span class="manifest-url">
      <code>{manifestUrl}</code>
      <button class="ftw-button sm" on:click={copyManifestUrl} title="Copy the manifest address">
        <Fa icon={faCopy} />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </span>
    {#if copyError}<span class="error">{copyError}</span>{/if}
  </li>
  <li>
    Open a project that uses a Moon CRS (IAU 2015). "Lunar Data Import Guide" opens as a panel next to the 3D view.
  </li>
</ol>

<style>
  .steps {
    padding-left: 20px;
    line-height: 1.5;
  }

  .manifest-url {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
  }

  code {
    padding: 2px 4px;
    background: var(--ftw-input-background-color);
    border: 1px solid var(--ftw-input-border-color);
    border-radius: 3px;
    user-select: all;
    word-break: break-all;
  }

  .error {
    color: var(--ftw-button-danger-color);
  }
</style>
