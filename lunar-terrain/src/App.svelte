<script>
  import { onMount } from 'svelte'
  import Fa from 'svelte-fa'
  import {
    faCircleHalfStroke,
    faCircleInfo,
    faCrosshairs,
    faEarthAmericas,
    faFlag,
    faHillRockslide,
    faIcicles,
    faLayerGroup,
    faLocationDot,
    faMoon,
    faMountain,
    faSatelliteDish,
    faSnowflake,
    faSun,
    faTemperatureHalf,
    faWaveSquare,
  } from '@fortawesome/free-solid-svg-icons'

  import catalog from './catalog/catalog.json'
  import AboutData from './components/AboutData.svelte'
  import GuideView from './components/GuideView.svelte'
  import SetupHelp from './components/SetupHelp.svelte'
  import { formatDistance, formatLatLon } from './format.js'
  import { DATA_GUIDES } from './guides/dataGuides.js'
  import { connectToFieldTwin } from './host/fieldtwinHost.js'
  import { describeSite, isMoonCRS, viewBoxSamplePoints } from './site/moonSite.js'
  import { toMoonLatLon } from './site/projector.js'

  /**
   * @typedef {import('./host/fieldtwinHost.js').FieldTwinHost} FieldTwinHost
   * @typedef {import('./host/fieldtwinHost.js').LoadedContext} LoadedContext
   * @typedef {import('./site/moonSite.js').Site} Site
   * @typedef {import('./site/moonSite.js').ViewBox} ViewBox
   * @typedef {import('./catalog/catalog.js').CatalogProduct} CatalogProduct
   * @typedef {import('@fortawesome/fontawesome-common-types').IconDefinition} IconDefinition
   */

  // The Quality choices of FieldTwin's 3D surface upload: grid cells along the longer side ('Low' is left out,
  // it is too coarse to be worth a download)
  const QUALITIES = [
    { gridSize: 128, label: 'Normal' },
    { gridSize: 256, label: 'High' },
    { gridSize: 512, label: 'Extreme' },
  ]
  const NOT_IN_FIELDTWIN_AFTER_MS = 5000
  /** @type {Record<string, IconDefinition>} */
  const GUIDE_ICONS = {
    terrain: faMountain,
    slope: faWaveSquare,
    roughness: faHillRockslide,
    illumination: faSun,
    'earth-visibility': faEarthAmericas,
    shadow: faMoon,
    temperature: faTemperatureHalf,
    'ice-depth': faIcicles,
    'ice-favorability': faSnowflake,
    albedo: faCircleHalfStroke,
    'shot-count': faSatelliteDish,
    'named-features': faLocationDot,
    'landing-sites': faFlag,
    geology: faLayerGroup,
  }
  // The guide list is grouped by how the data comes into FieldTwin
  const GUIDE_GROUPS = [
    { title: 'Ground', uploadAs: 'terrain' },
    { title: 'Colour layers', uploadAs: 'colormap' },
    { title: 'Shapes', uploadAs: 'shapes' },
  ]

  /** @type {Record<string, string>} Why no files can be listed, by site status */
  const SITE_MESSAGES = {
    detecting: 'Reading the 3D view…',
    'no-view': 'No 3D view to read. Open the project’s 3D view on your site, then click "Use current view".',
  }

  /** @type {'connecting' | 'not-in-fieldtwin' | 'detecting' | 'not-moon' | 'no-view' | 'ready' | 'error'} */
  let status = 'connecting'
  let errorMessage = ''
  let projectCRS = ''
  let canEdit = false
  let gridSize = QUALITIES[0].gridSize
  let guideId = DATA_GUIDES[0].id
  /** @type {Site | undefined} */
  let site
  /** @type {ViewBox | undefined} */
  let viewBox
  /** @type {FieldTwinHost} */
  let host
  /** @type {LoadedContext} */
  let context

  // 'about' is the page about the data's sources, not a guide
  const ABOUT_ID = 'about'

  $: guide = DATA_GUIDES.find((entry) => entry.id === guideId) || DATA_GUIDES[0]
  $: siteMessage = status === 'error' ? `Couldn't find the site: ${errorMessage}` : SITE_MESSAGES[status] || ''

  onMount(() => {
    host = connectToFieldTwin(window)
    // Opened directly in a browser tab (not embedded, not popped out): show how to add it to an account
    const isEmbedded = window.parent !== window || Boolean(window.opener)
    const notInFieldTwin = setTimeout(
      () => {
        if (status === 'connecting') {
          status = 'not-in-fieldtwin'
        }
      },
      isEmbedded ? NOT_IN_FIELDTWIN_AFTER_MS : 0
    )
    host.onLoaded((loaded) => {
      clearTimeout(notInFieldTwin)
      context = loaded
      canEdit = loaded.canEdit
      useFieldTwinStyles(loaded)
      detectSite()
    })
    return () => {
      clearTimeout(notInFieldTwin)
      host.disconnect()
    }
  })

  async function detectSite() {
    status = 'detecting'
    site = undefined
    try {
      projectCRS = await host.getProjectCRS()
      if (!isMoonCRS(projectCRS)) {
        status = 'not-moon'
        return
      }
      const view = await host.getViewBox()
      if (!view) {
        status = 'no-view'
        return
      }
      const samples = await toMoonLatLon(context.projectorUrl, projectCRS, viewBoxSamplePoints(view))
      viewBox = view
      site = describeSite(samples)
      status = 'ready'
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error)
      status = 'error'
    }
  }

  /**
   * Loads FieldTwin's stylesheet and current theme, so the ftw-* classes and colours match the host.
   * @param {LoadedContext} loaded
   */
  function useFieldTwinStyles(loaded) {
    for (const [id, url] of [
      ['fieldtwin-css', loaded.cssUrl],
      ['fieldtwin-theme', loaded.cssThemeUrl],
    ]) {
      if (!url || !/^https?:\/\//.test(url)) {
        continue
      }
      const link = document.getElementById(id) || document.head.appendChild(document.createElement('link'))
      link.setAttribute('id', id)
      link.setAttribute('rel', 'stylesheet')
      link.setAttribute('href', url)
    }
  }
</script>

<main>
  <header>
    <div class="ftw-title">Lunar data import guide</div>
    {#if site}
      <span class="site">Site {formatLatLon(site.center)}, {formatDistance(site.widthMeters)} across ({projectCRS})</span>
    {/if}
    {#if status !== 'connecting' && status !== 'not-in-fieldtwin' && status !== 'not-moon'}
      <button class="ftw-button sm" on:click={detectSite} disabled={status === 'detecting'} title="Read the 3D view again">
        <Fa icon={faCrosshairs} /> Use current view
      </button>
    {/if}
  </header>

  {#if status === 'connecting'}
    <p>Reading the project…</p>
  {:else if status === 'not-in-fieldtwin'}
    <SetupHelp />
  {:else if status === 'not-moon'}
    <p>
      This project's CRS ({projectCRS || 'not set'}) isn't a Moon CRS. Moon data files only fit projects using an IAU
      2015 Moon CRS.
    </p>
  {:else}
    <div class="guide">
      <nav aria-label="Kinds of data">
        {#each GUIDE_GROUPS as group (group.uploadAs)}
          <div class="group-title">{group.title}</div>
          {#each DATA_GUIDES.filter((entry) => entry.uploadAs === group.uploadAs) as entry (entry.id)}
            <button class="guide-link" class:selected={entry.id === guideId} on:click={() => (guideId = entry.id)}>
              <Fa icon={GUIDE_ICONS[entry.id]} fw />
              {entry.title}
            </button>
          {/each}
        {/each}
        <button class="guide-link about" class:selected={guideId === ABOUT_ID} on:click={() => (guideId = ABOUT_ID)}>
          <Fa icon={faCircleInfo} fw />
          About the data
        </button>
      </nav>
      <article>
        {#if guideId === ABOUT_ID}
          <AboutData />
        {:else}
          <GuideView
            {guide}
            products={catalog.products}
            {site}
            {viewBox}
            {siteMessage}
            qualities={QUALITIES}
            bind:gridSize
            {canEdit}
            projectorUrl={context.projectorUrl}
            {projectCRS}
            on:openGuide={(event) => (guideId = event.detail)}
            on:selectTag={(event) => host.selectShapesByTag(event.detail)}
          />
        {/if}
      </article>
    </div>
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    box-sizing: border-box;
    padding: 8px 12px;
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin-bottom: 8px;
  }

  header .ftw-title {
    flex-basis: 100%;
  }

  header button {
    margin-left: auto;
  }

  .site {
    opacity: 0.8;
  }

  .guide {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 190px 1fr;
    gap: 12px;
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: auto;
  }

  .group-title {
    margin: 6px 0 2px;
    font-size: 0.8em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  article {
    overflow: auto;
    padding-right: 4px;
  }

  .guide-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    text-align: left;
    color: inherit;
    background: none;
    border: 1px solid transparent;
    border-radius: 3px;
    cursor: pointer;
  }

  .guide-link.about {
    margin-top: 10px;
  }

  .guide-link.selected {
    background: var(--ftw-input-background-color);
    border-color: var(--ftw-input-focus-border-color);
  }

  /* A narrow panel (or popped-out window) lists the kinds of data above the guide */
  @media (max-width: 560px) {
    .guide {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }

    nav {
      flex-direction: row;
      flex-wrap: wrap;
    }

    .group-title {
      width: 100%;
    }
  }
</style>
