<script src="ts">
  import { onMount } from 'svelte';
	import { page } from '$app/stores'

	import { Alert, Card, CardBody, Container, Progress, Collapse, Button } from 'sveltestrap';
  import 'bootstrap/dist/css/bootstrap.min.css';

  import Service from '../actions/Service';

  let service = new Service()
  let loaded = false
  let error = ''

  onMount(async () => {
    if (!loaded) {
      try {
        service.token = String($page.url.searchParams.get('token'))
        const project = String($page.url.searchParams.get('project'))
        const subProject = String($page.url.searchParams.get('subProject'))
        if (service.token && project && subProject) {
          loaded = true
        }
      } catch (e) {
        error = `Failed to start: ${e}`
      }
    }
  });	

	let sheet = {}

  /**
	 * @param {{ data: import("../actions/Store").IEvent; }} msg
	 */
  async function onWindowMessage(msg) {
    service.event = msg.data
    if (!loaded && msg.data?.event === 'loaded') {
      service.token = msg.data.token
      try {
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

	const uploadMetaData = () => {
    service.uploadMetaData(service.event, sheet)
	}
	const downloadMetaData = () => {		
    service.downloadMetaData(service.event, sheet)
  }
	const getMetaData = () => {
    service.getMetaData(service.event)
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
          <Button color="primary" class="select-button" on:click={uploadMetaData}>uploadMetaData(object, sheet)</Button>
        </CardBody>
      </Card>
      <Card class="mt-3">
        <CardBody>
          <Button color="primary" class="select-button" on:click={downloadMetaData}>downloadMetaData(object, sheet)</Button>
        </CardBody>
      </Card>
      <Card class="mt-3">
        <CardBody>
          <Button color="primary" class="select-button" on:click={getMetaData}>getMetaData(object)</Button>
        </CardBody>
      </Card>
      {/if}
    </CardBody>
  </Card>
</Container>
