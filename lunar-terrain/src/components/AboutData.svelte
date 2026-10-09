<script>
  import { DATA_SOURCES } from '../guides/dataSources.js'
  import DataSources from './DataSources.svelte'
</script>

<h2 class="ftw-title">About the data</h2>
<p>
  The data in this guide is published by NASA, the USGS, UCLA, the International Astronomical Union and the scientists
  who produced it, not by FutureOn. FieldTwin doesn't host it: the download links go to the publishers' own servers, and
  the shape files are built from their data inside this page.
</p>
<p>
  The values are the publishers' own. FieldTwin only changes their format and projection when importing them. The shape
  files are derived: named features and landing sites become circles of their published diameter (or a small marker),
  and geologic units are simplified by about 150 m and cut to the view.
</p>
<p>
  The data is provided as published, without any warranty of accuracy, completeness or fitness for a purpose. Resolution
  and accuracy vary from one product to the next: check the publisher's documentation before relying on it for
  engineering or mission decisions. The publishers' servers, files and terms can change without notice.
</p>
<p>When you use the data, credit its publisher and cite it as below.</p>

<h3>Sources</h3>
<DataSources sources={Object.values(DATA_SOURCES)} />

<style>
  h2 {
    margin: 0 0 6px;
  }

  h3 {
    margin: 12px 0 4px;
    font-size: 1em;
  }

  p {
    margin: 0 0 6px;
  }
</style>
