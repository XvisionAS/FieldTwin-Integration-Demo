<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class='headline text-uppercase'>
        <span>FutureOn - Well</span>
        <span class='font-weight-light'> Integration POC</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-autocomplete
            :items="fields"
            label="Select a Field"
            @change="onChangeField"
            clearable
          />
      </v-toolbar-items>
    </v-app-bar>

    <v-content>
      <v-card style="margin-left:25px;margin-right:25px;">
        <v-card-title>
          {{field || 'No field Selected'}}
          <v-spacer></v-spacer>
          <v-text-field
              v-model="search"
              append-icon="search"
              label="Search for a well"
              single-line
              hide-details
              clearable
            ></v-text-field>
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="displayedWells"
          sort-by="UNIQUE_WELL_IDENTIFIER"
          :search="search"
          :loading="loading"
          loading-text="Loading data... Please wait"
        >
          <template v-slot:item.inEXT="{ item }">
            <v-icon v-if="item.inEXT" color="success">check_circle_outline</v-icon>
            <v-icon v-else color="warning">highlight_off</v-icon>
          </template>
          <template v-slot:item.inFT="{ item }">
            <v-icon v-if="item.inFT" color="success">check_circle_outline</v-icon>
            <v-icon v-else color="warning">highlight_off</v-icon>
          </template>
          <template v-slot:item.action="{ item }">
          <template v-if="item.inFT">
            <v-btn color="warning" fab dark small @click="deleteWellToFT(item)">
              <v-icon>
                delete
              </v-icon>
            </v-btn>&nbsp;
            <v-btn  v-if="item.inEXT" color="success" fab dark small @click="updateWellToFT(item)">
              <v-icon>
                update
              </v-icon>
            </v-btn>
          </template>
          <v-btn v-else color="primary" fab dark small @click="importWellToFT(item)">
            <v-icon>
              backup
            </v-icon>
          </v-btn>
          </template>
        </v-data-table>
      </v-card>
<!--       <v-card>
        Event Message: {{eventMessage}}
      </v-card> -->

    </v-content>
  </v-app>
</template>

<script lang='ts'>
import axios from "axios";
import Vue from "vue";
import HelloWorld from "./components/HelloWorld.vue";

declare global {
  interface Window {
    ext: any;
  }
}
const clone = (a: any): any => JSON.parse(JSON.stringify(a));

export default Vue.extend({
  name: "App",
  components: {
    HelloWorld
  },
  data: () => ({
    loading: true,
    search: '',
    headers: [
      {text: 'UNIQUE_WELL_IDENTIFIER', value: 'UNIQUE_WELL_IDENTIFIER', sortable: true},
      {text: 'EASTING', value: 'EASTING', sortable: true},
      {text: 'NORTHING', value: 'NORTHING', sortable: true},
      {text:'EXT', value:'inEXT', sortable: true},
      {text:'FieldTwin', value:'inFT', sortable: true},
      {text: 'Actions In Fieldap', value: 'action', sortable: false },
    ],
    fields: [],
    FTWells: [] as any[],
    EXTWells: [],
    field: "",
    ext: window.ext,
    eventMessage: {} as any,
    //
  }),
  async created() {
    window.addEventListener("message", this.handleMessage);
    while (!window.ext.subProject) {
      console.log('wait for "window.ext"')
    }
    await this.getFields();
    await this.getFTWellsForSubProject();
  },
  methods: {
    deleteWellToFT(item: any) {
      this.loading = true
      item.subProject = window.ext.subProject
      axios(
        {
          method: "delete",
          url: `/well/${item.FTid}`,
          headers: { authorization: `Bearer ${window.ext.JWT}` },
        }
      ).then(
        // remove when tabs emit event from network
        this.getFTWellsForSubProject
      ).catch(
        e => {
          console.error(e)
          alert("deletion of Ext well in FieldTwin failed")
          this.loading = false
        }
      )
    },
    updateWellToFT(item: any) {
      this.loading = true
      item.subProject = window.ext.subProject
      axios(
        {
          method: "patch",
          url: `/well`,
          headers: { authorization: `Bearer ${window.ext.JWT}` },
          data:item
        }
      ).then(
        // remove when tabs emit event from network
        this.getFTWellsForSubProject
      ).catch(
        e => {
          console.error(e)
          alert("update of Ext well in FieldTwin failed")
        this.loading = false

        }
      )
    },
    importWellToFT(item: any) {
      this.loading = true
      item.subProject = window.ext.subProject
      axios(
        {
          method: "post",
          url: `/well`,
          headers: { authorization: `Bearer ${window.ext.JWT}` },
          data:item
        }
      ).then(
        // remove when tabs emit event from network
        this.getFTWellsForSubProject
      ).catch(
        e => {
          console.error(e)
          alert("importation of Ext well in FieldTwin failed")
          this.loading = false
        }
      )
    },
    onChangeField(newField: string) {
      this.loading = true
      this.field = newField;
      if (!newField || newField.length == 0) {
        this.EXTWells = [];
        return
      }
      axios({
        method: "get",
        url: `/${newField}/wells`,
        headers: { authorization: `Bearer ${window.ext.JWT}` }
      })
        .then(r => (this.EXTWells = r.data))
        .catch(e => {
          console.error(e)
          alert(e)
          this.EXTWells = []
        })
    },
    getFTWellsForSubProject() {
      this.loading = true
      axios({
        method: "get",
        url: `/subProject/${window.ext.subProject}`,
        headers: { authorization: `Bearer ${window.ext.JWT}` }
      })
        .then(r => (this.FTWells = r.data))
        .catch(e => {
          console.error(e)
          alert(e)
          this.FTWells = []
        });
    },
    getFields() {
      axios({
        method: "get",
        url: "/fields"
      })
        .then(r => (this.fields = r.data))
        .catch(e => {
          console.error(e)
          alert(e)
          this.fields = []
        });
    },
    async handleMessage(event: any) {
      if (event.data.type === "well" && event.data.event !== "select") {
        this.getFTWellsForSubProject()
      }
    }
  },
  computed: {
    displayedWells() {
      const displayed: any[] = clone(this.EXTWells);
      displayed.forEach(
        (well:any) => {
          well.inEXT = true
          const FTWell = this.FTWells.find((w:any) => w.name === well.UNIQUE_WELL_IDENTIFIER)
          if (FTWell) {
            well.inFT = true
            well.FTid = FTWell.id 
          }
        }
      )
      const FTNotInExt: any[] = []
      this.FTWells.forEach(
        (well:any) => {
          const EXTWell = this.EXTWells.find((w: any) => {
            return well.name == w.UNIQUE_WELL_IDENTIFIER
          })
          if (!EXTWell) {
            FTNotInExt.push(
              {
                UNIQUE_WELL_IDENTIFIER: well.name,
                EASTING: well.x,
                NORTHING: well.y,
                inFT: true,
                FTid: well.id
              }
            )
          }
        }
      )
      this.loading = false
      return displayed.concat(FTNotInExt);
    }
  }
});
</script>
