<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>FutureOn - Oliasoft</span>
        <span class="font-weight-light">Trajectory Generation</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
        <span class="mr-2">POC</span>
    </v-app-bar>

    <v-content>
      <v-container fluid>
      <v-row
          align="center"
          justify="center"
      >
      <v-card :loading="loading" :disabled="well ? false: false" class="centerd">
        <v-card-title>Generate Trajectory for {{well && well.name}}
          <v-spacer/>
          <v-spacer/>
        </v-card-title>
        <v-card-text>
          <ul>
            <li>Select or Create a Well (this POC will not work with multiselection</li>
            <li> Edit the first and last point of his path</li>
            <li>
              <p>By CLicking the <strong>Generate Trajectory</strong> an new well
                  trajectory will be generated by Oliasoft <br> using the API end point
                  <code>POST https://app.oliasoft.com/api/traj_gen</code>.<br>
                  the following parameters will be passed to the request:<br>
                  <pre> <code>
{
    "method": "optalign_dls1_dls2",
    "param1": 3,
    "param2": 3,
    "resolution": 30,
    "src_azi": 0,
    "src_ew": the selected well path first point "x" value,
    "src_inc": 0,
    "src_md": 0,
    "src_ns": the selected well path first point "y" value,
    "src_tvd": the selected well path first point "z" value,
    "tgt_azi": 60,
    "tgt_ew": the selected well path last point "x" value,
    "tgt_inc": 30,
    "tgt_ns": the selected well path last point "y" value,
    "tgt_tvd": the selected well path last point "z" value,
  }
                    </code></pre>
                </p>
              </li>
          </ul>
        </v-card-text>
        <v-card-text color="error" >
          <p v-if="error">
            {error}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="generateTrajectory">Generate Trajectory</v-btn>
        </v-card-actions>
      </v-card>
      </v-row>
      </v-container>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue'
import axios from 'axios'

declare global {
  interface Window {
    docs: any
  }
}
export default Vue.extend({
  name: 'App',
  components: {

  },
  data: () => ({
    well: {} as any,
    search: '',
    loading: false,
    error: null as any,
  }),
  async created() {
    window.addEventListener('message', this.handleMessage);
    while (!window.docs.subProject) {
      console.log('wait for "window.smda"')
    }
  },
  methods: {
    generateTrajectory(id:string) {
      this.error = null
      this.loading = true
      axios({
        method: "patch",
        // tslint:disable-next-line:max-line-length
        url: `/API/v1.5/${window.docs.project}/subProject/${window.docs.subProject}/well/${this.well.id}`,
        headers: { authorization: `Bearer ${window.docs.JWT}` },
        data:{
          first: this.well.path[0],
          last: this.well.path[this.well.path.length -1]
          }
      }).then((r) => {
        this.loading = false
      }).catch(e => {
        console.error(e)
        this.error = e
        this.loading = false
        this.well = undefined
      })
    },
    getWell(id: any) {
      console.log('get well')
      this.loading = true
      axios({
        method: "get",
        // tslint:disable-next-line:max-line-length
        url: `/API/v1.5/${window.docs.project}/subProject/${window.docs.subProject}/well/${id}`,
        headers: { authorization: `Bearer ${window.docs.JWT}` }
      }).then((r) => {
        this.well = r.data
        this.well.id = id
        this.loading = false
      }).catch(e => {
        console.error(e)
        alert(e)
        this.loading = false
        this.well = undefined
      })
    },
    async handleMessage(event: any) {
      if (event.data.event === 'select' && event.data.data.length > 1) {
        // multiselection not supported
        this.well = undefined
        console.log(event.data)
      } else if (event.data.type === 'well' && event.data.event === 'select') {
        this.loading = true
        const id = event.data.id
        console.log(event.data)
        console.log(event.data.id)
        this.getWell(id)
      } else if (event.data.event === 'select' || event.data.event === 'unselect') {
        this.well = undefined
        console.log(event.data)
      }
    }
  }
})
</script>
<style scoped>

  .centered {
    margin: auto
  }
</style>
