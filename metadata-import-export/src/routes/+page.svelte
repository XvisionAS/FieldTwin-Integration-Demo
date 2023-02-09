<script lang="ts">
  import { onMount } from 'svelte';
	import { page } from '$app/stores'

  import { read, utils, writeFile, writeFileXLSX } from 'xlsx';

	import { Alert, Card, CardBody, Container, Progress, Input, Button } from 'sveltestrap';
  import 'bootstrap/dist/css/bootstrap.min.css';

  import Service from '../actions/Service';

  let service = new Service('https://backend.qa.fieldtwin.com')
  let projectId = ''
  let subProjectId = ''
  let loaded = false
  let error = ''

  onMount(async () => {
    if (!loaded) {
      try {
        service.token = String($page.url.searchParams.get('token'))
        projectId = String($page.url.searchParams.get('project'))
        subProjectId = String($page.url.searchParams.get('subProject'))
        if (service.token && projectId && subProjectId) {
          loaded = true
        }
      } catch (e) {
        error = `Failed to start: ${e}`
      }
    }
  });

  function exportFile(pres: any) {
    const ws = utils.json_to_sheet(pres);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Data");
    writeFileXLSX(wb, "SheetJSSvelteAoO.xlsx");
}

  let files:any = [];
  /**
	 * @param {{ data: import("../actions/Store").IEvent; }} msg
	 */
  async function onWindowMessage(msg: any) {
    service.event = msg.data
    if (!loaded && (msg.data?.event === 'loaded' || msg.data?.event === 'tokenRefresh')) {
      try {
        service.token = msg.data.token
        service.backendUrl = msg.data.backendUrl
        service.projectId = msg.data.project
        service.subProjectId = msg.data.subProject
        loaded = true
      } catch (e) {
        error = `Failed to start: ${e}`
      }
    }
    if (loaded && msg.data?.event === 'select' && msg.data?.type === 'stagedAsset') {
      try {
        console.log(service.event)
//        await service.calculateStagedAssetOutput({ id: msg.data.id })
      } catch (e) {
        error = `Failed to select asset: ${e}`
      }
    }
    if (loaded && msg.data?.event === 'unselect' || (msg.data?.event === 'select' && msg.data?.type !== 'stagedAsset')) {
//        service.stagedAsset = {} as IStagedAsset
    }
  }

  let metaData = {}
	const uploadMetaData = async () => {
    const f = await (files[0]).arrayBuffer();
    const wb = read(f); // parse the array buffer
    const ws = wb.Sheets[wb.SheetNames[0]]; // get the first worksheet
    let sheet = utils.sheet_to_json(ws); // generate objects and update state
    await service.uploadMetaData(projectId, subProjectId, service.event, sheet)
  }
	const downloadMetaData = async () => {
    metaData = await service.getMetaData(projectId, subProjectId, service.event)
    exportFile(metaData)
  }

	const getMetaData = async () => {
    metaData = await service.getMetaData(projectId, subProjectId, service.event)
	}
</script>

<svelte:window on:message={onWindowMessage} />

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<Container fluid>
  <Card class="mt-3">
    <CardBody>
      {#if !loaded}
        <Alert color={!!error ? 'danger' : 'primary'} class="mb-0" fade={false}>
          {#if !!error}
            {error}
          {:else if !service.token}
            <span id="initSpan">Initializing, please wait...</span>
          {:else}
						<Progress animated value={100} class="mt-1 mb-1">Loading, please wait...</Progress>
          {/if}
        </Alert>
      {:else}
      <Card>
        <CardBody>
          <Input type="file" name="sheet" bind:files />
          <Button color="primary" class="select-button" on:click={uploadMetaData}>uploadMetaData(object, files)</Button>
        </CardBody>
      </Card>
      <Card class="mt-3">
        <CardBody>
          <Button color="primary" class="select-button" on:click={downloadMetaData}>downloadMetaData(object, files)</Button>
        </CardBody>
      </Card>
      <Card class="mt-3">
        <CardBody>
          <Button color="primary" class="select-button" on:click={getMetaData}>getMetaData(object)</Button>
          {#if metaData }
            <pre>{ JSON.stringify(metaData) }</pre>
          {/if}
        </CardBody>
      </Card>
      {/if}
    </CardBody>
  </Card>
</Container>
