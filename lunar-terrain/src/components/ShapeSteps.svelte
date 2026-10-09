<script>
  import { createEventDispatcher } from 'svelte'
  import Fa from 'svelte-fa'
  import { faObjectGroup } from '@fortawesome/free-solid-svg-icons'

  /** @typedef {import('../shapes/siteShapes.js').ShapeImport} ShapeImport */

  /** @type {ShapeImport} */
  export let shapeImport
  /** Whether the rules file colours the shapes by value */
  export let hasColorRules = false

  const dispatch = createEventDispatcher()
</script>

<ol class="steps">
  <li>
    Upload the terrain first
    (<button class="link" on:click={() => dispatch('openGuide', 'terrain')}>Terrain guide</button>), so the shapes
    have ground to sit on. Then download both files above.
  </li>
  <li>
    Open <strong>Import</strong> in the toolbar and choose <strong>Data from files using rules ...</strong>. On
    <em>Choose import type</em>, click <strong>Create a new import</strong>, then <strong>Next</strong>.
  </li>
  <li>
    On <em>Import options</em>, click <strong>Import rules from file…</strong> at the bottom and choose the rules file.
    Then <strong>Next</strong>.
    <p class="warning">
      <span>
        Load the rules on this step: going back to <em>Choose import type</em> and creating a new import clears them.
      </span>
    </p>
  </li>
  <li>
    On <em>Choose files</em>, click <strong>Add files</strong> and choose the shapes file. Keep
    <strong>Override source projection</strong> on <em>Use the CRS from the file</em>: the file is already in the
    project's CRS. Then <strong>Next</strong>.
  </li>
  <li>
    On <em>Create rules</em>, the <em>{shapeImport.name}</em> ruleset is ready and shows how many shapes it will create.
    {#if hasColorRules}
      Under it, one rule per unit symbol sets the map's colour for that unit: change a colour there if you like.
    {/if}
    Click <strong>Next</strong> to import.
  </li>
  <li>
    The shapes come in flat. To drape them on the terrain,
    <button class="ftw-button sm" on:click={() => dispatch('selectTag', shapeImport.tag)}>
      <Fa icon={faObjectGroup} /> Select the imported shapes
    </button>
    and tick <strong>Stick To Bathymetry</strong> (Shapes tab).
  </li>
</ol>
<p class="note">
  Each shape is named after its feature, carries its description, and is tagged with its type and with
  "{shapeImport.tag}". Importing a new file the same way updates the shapes made before. The descriptions and colours
  need a FieldTwin version whose rules import accepts them on shapes.
</p>

<style>
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
  }

  .note {
    opacity: 0.8;
  }
</style>
