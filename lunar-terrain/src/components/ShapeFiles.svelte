<script>
  import { onDestroy } from 'svelte'
  import Fa from 'svelte-fa'
  import { faDownload } from '@fortawesome/free-solid-svg-icons'

  import { buildRulesFile, buildShapesGeoJSON } from '../shapes/siteShapes.js'
  import { fromMoonLatLon } from '../site/projector.js'

  /**
   * @typedef {import('../shapes/shapeDatasets.js').ShapeDatasetEntry} ShapeDatasetEntry
   * @typedef {import('../site/moonSite.js').Site} Site
   * @typedef {import('../site/moonSite.js').ViewBox} ViewBox
   */

  /**
   * @typedef {Object} PreparedFile
   * @property {string} url - Object URL of the generated file
   * @property {string} fileName
   */

  /** @type {ShapeDatasetEntry} */
  export let dataset
  /** @type {Site} */
  export let site
  /** @type {ViewBox} The view the site was read from, in the project CRS */
  export let viewBox
  /** @type {string} */
  export let projectorUrl
  /** @type {string} */
  export let projectCRS

  /** @type {'preparing' | 'ready' | 'error'} */
  let status = 'preparing'
  let errorMessage = ''
  let shapeCount = 0
  /** @type {[string, number][]} Shape count by type, most common first */
  let typeCounts = []
  /** @type {PreparedFile | undefined} */
  let geojsonFile
  /** @type {PreparedFile | undefined} */
  let rulesFile
  let preparation = 0

  $: prepare(dataset, site, viewBox)

  onDestroy(releaseFiles)

  /**
   * Builds the site's GeoJSON and the rules file. A newer call (another site or dataset) wins over one still running.
   * @param {ShapeDatasetEntry} entry
   * @param {Site} forSite
   * @param {ViewBox} forViewBox
   */
  async function prepare(entry, forSite, forViewBox) {
    const thisPreparation = ++preparation
    status = 'preparing'
    try {
      const data = await entry.load()
      const shapes = await entry.toShapes(data, forSite, {
        viewBox: forViewBox,
        project: (positions) => fromMoonLatLon(projectorUrl, projectCRS, positions),
      })
      if (thisPreparation !== preparation) {
        return
      }
      const geojson = buildShapesGeoJSON(shapes, projectCRS, data.citation)
      releaseFiles()
      geojsonFile = toFile(geojson, `${entry.fileName}.geojson`, 'application/geo+json')
      const rules = buildRulesFile(entry.shapeImport, entry.colorRules?.(data, shapes))
      rulesFile = toFile(rules, `${entry.fileName}.rules.json`, 'application/json')
      shapeCount = shapes.length
      typeCounts = countTypes(shapes)
      status = 'ready'
    } catch (error) {
      if (thisPreparation !== preparation) {
        return
      }
      errorMessage = error instanceof Error ? error.message : String(error)
      status = 'error'
    }
  }

  /**
   * @param {object} content
   * @param {string} fileName
   * @param {string} type
   * @returns {PreparedFile}
   */
  function toFile(content, fileName, type) {
    return { url: URL.createObjectURL(new Blob([JSON.stringify(content)], { type })), fileName }
  }

  function releaseFiles() {
    for (const file of [geojsonFile, rulesFile]) {
      if (file) {
        URL.revokeObjectURL(file.url)
      }
    }
    geojsonFile = undefined
    rulesFile = undefined
  }

  /**
   * @param {{ type: string }[]} shapes
   * @returns {[string, number][]}
   */
  function countTypes(shapes) {
    /** @type {Map<string, number>} */
    const counts = new Map()
    for (const { type } of shapes) {
      counts.set(type, (counts.get(type) || 0) + 1)
    }
    return [...counts].sort((a, b) => b[1] - a[1])
  }
</script>

{#if status === 'preparing'}
  <p>Preparing the files for this view…</p>
{:else if status === 'error'}
  <p class="error">Couldn't prepare the files: {errorMessage}</p>
{:else if shapeCount === 0}
  <p>Nothing of this kind in the view. Zoom out, then click "Use current view".</p>
{:else if geojsonFile && rulesFile}
  <p>
    {shapeCount} shape{shapeCount === 1 ? '' : 's'} in the view:
    {typeCounts.map(([type, count]) => `${count} ${type}`).join(', ')}.
  </p>
  <div class="downloads">
    <a class="ftw-button primary download" href={geojsonFile.url} download={geojsonFile.fileName}>
      <Fa icon={faDownload} /> Shapes ({geojsonFile.fileName})
    </a>
    <a class="ftw-button download" href={rulesFile.url} download={rulesFile.fileName}>
      <Fa icon={faDownload} /> Rules ({rulesFile.fileName})
    </a>
  </div>
{/if}

<style>
  .downloads {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .download {
    display: flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    /* FieldTwin's a:link colour would otherwise win over the button's text colour */
    color: var(--ftw-button-current-text-color);
  }

  .error {
    color: var(--ftw-button-danger-color);
  }
</style>
