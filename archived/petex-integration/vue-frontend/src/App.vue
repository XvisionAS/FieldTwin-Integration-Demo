<template>
  <div id="app">
     <b-container fluid  class="overflow-hidden">
      <b-row>
        <b-col cols="8" class="pull-left">
          You can either:
          <ul>
          <li>
          Select a well on the stage.<br>
          If he is on the list on the left, we will display some of his data
          </li>
          <li>
            Select a staged asset on the stage,<br>
            If he is associate with a well of list on the left, we w
          </li>
          <li>
            Select a well on list on the left
          </li>
          </ul>

        </b-col>
        <b-col cols="4">
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text" id="inputGroup-sizing-default">Wells:</span>
            </div>
              <WellListSelector :options="wellListForSelect" :selected="selected.ObjectInstanceId" v-on:change-selected="selectedChange" />
          </div>
        </b-col>
      </b-row>
      <hr>
      <template v-if="selected.ObjectInstanceName">
          <h2>{{selected.ObjectInstanceName}} </h2>
        <b-row >
          <b-col cols="4">
            <div class="list-items wrapper"  >
              <div>
                <PetexListValues
                  :well="selected"
                  :dataList="dataListForWell"
                  v-on:selectDataSet="selectDataSet" />
              </div>
            </div>
          </b-col>
          <b-col cols="8" class="wrapper">
            <PetexGraph
              class="chart"
              :dataSet="dataSetSelected"
              :dataSetDescription="dataSetSelectedDescription"
              />
          </b-col>
        </b-row>
      </template>
      <template v-else >
        <h2> No well selected.</h2>
      </template>
    </b-container>
  </div>
</template>

<script lang="ts" Notification>
import axios from 'axios'
import { Component, Vue } from 'vue-property-decorator'
import { getstagedAssetWell, getWellName } from './get-from-jsonapi'
import { IhashPetexWellObject, IpetexDataPoint, IpetexValue, IpetexWellObject,   } from './interfaces'

// import HelloWorld from './components/HelloWorld.vue'
import PetexGraph from './components/PetexGraph.vue'
import PetexListValues from './components/PetexListValues.vue'
import WellListSelector from './components/WellListSelector.vue'

export default Vue.extend({
  components: {
    WellListSelector,
    PetexListValues,
    PetexGraph,
  },
  data() {
    return {
      dataListForWell: [] as IpetexValue[],
      wellList:  [] as IpetexWellObject[],
      dataSetSelected: [] as IpetexDataPoint[],
      ataSetSelectedDescription: undefined as IpetexValue | undefined,
      selected: {
        ObjectInstanceId: null as number | null,
        ObjectInstanceName: null as string | null
      },
      body: undefined as any
    }
  },
  async created() {
    window.addEventListener('message', this.handleMessage)
    await this.getWells()
  },
  methods: {
    getWells() {
      axios({
        method: 'get',
        url: '/API/1000000/objects',
      }).then(
        (r) => {
          this.wellList = r.data
        }
      ).catch(
        (e) => console.log('ERROR :', e)
      )
    },
    getDataListForWell(wellID: number) {
      axios({
        method: 'get',
        url: `/API/${wellID}/current`,
      }).then(
        (r) => {
          this.dataListForWell = r.data
        })
    },
    getDataSet(dataSetId: number) {
      axios({
        method: 'get',
        url: `/API/${dataSetId}/historical`,
      }).then(
        (r) => {
          this.dataSetSelected = r.data
        })
    },
    selectDataSet(value: IpetexValue) {
      this.dataSetSelectedDescription = value
      this.getDataSet(value.datasetId)
    },
    selectedChange(value: string) {
      this.selected = this.wellList.find(
        (w: IpetexWellObject) => w.ObjectInstanceId === parseInt(value, 10)
      )
      this.getDataListForWell(this.selected.ObjectInstanceId)
      this.dataSetSelectedDescription = undefined
      this.dataSetSelected = undefined
    },
    async handleMessage(event: any) {

      if (event.origin.includes('webapp')) {
          event.data.backendurl = event.origin.replace('webapp', 'jsonapi')
        } else if (event.origin.includes('fieldtwin.com')) {
        event.data.backendurl = event.origin.replace('fieldtwin.com', 'backend.fieldtwin.com')
      } else {
        event.data.backendurl = 'http://localhost:3000'
      }

      let wellName

      if (event.data.event === 'select' && event.data.type === 'stagedAsset') {
        const wellId = await getstagedAssetWell(event.data.id, event.data.backendurl)
        if (wellId) {
          wellName = await getWellName(wellId, event.data.backendurl)
        }
      } else if (event.data.event === 'select' && event.data.type === 'well') {
        wellName = await getWellName(event.data.id, event.data.backendurl)
      }
      if (wellName) {
        const newSelected = this.hashByNameWells[wellName]
        if (newSelected) {
          this.selectedChange(newSelected.ObjectInstanceId)
        }
      }
    }
  },
  computed: {
    hashByNameWells(): IhashPetexWellObject {
      const hash: IhashPetexWellObject = {}
      this.wellList.forEach(
        (w: IpetexWellObject) => {
          hash[w.ObjectInstanceName] = w
        }
      )
      return hash
    },
    wellListForSelect() {
      return [{value: null, text: 'Please select an well'}].concat(
        this.wellList.map((e: IpetexWellObject) => {
          return {
            value: e.ObjectInstanceId,
            text: e.ObjectInstanceName,
          }
        }
      ))
    }
  },

})
</script>

<style lang="scss">
#app {
  

  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding-top: 10px;
  max-height: 100vh;
  overflow: hidden ;

    .pull-left {
    text-align:left;
  }
  .list-items {
    padding-bottom:10px;
    overflow-y: scroll; 
  }
  .wrapper {
    max-height: 450px;

  }


.noModel{
  color: black;
  text-align: left;
  display: block;
  padding:40px;
  height: 100%;
  width: 100%;
  background-color: #f5f6f8;
  background-image: url("data:image/svg+xml,%3Csvg width='40' height='1' viewBox='0 0 40 1' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v1H0z' fill='%23b4b4b4' fill-opacity='0.09' fill-rule='evenodd'/%3E%3C/svg%3E");
}
}
</style>
