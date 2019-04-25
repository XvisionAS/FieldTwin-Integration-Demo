<template>
  <div id="app">
      <div>
        <h2>FutureOn Move Boat-Lay Connection integration demo</h2>
        <h4>Move a staged asset and Lay connection connected <em>TO</em> him.</h4>
        <button type="button" @click="layConnection">
          Run
        </button>
        <div class="row config-row">
          <div>
            <ul>
              <li>
              Fill the form in the config Box
              </li>
              <li>
                Fill the "move" forms
              </li>
              <li>
                Press the <code>Run</code> button
              </li>
            </ul>
          </div>

          <div class="col config">
            <label>Back-end url:</label><input type="text" v-model="request.url" size="35">
            <label>API token:</label><input type="text" v-model="request.apiKey" size="35">
            <label>staged Asset Id:</label><input type="text" v-model="request.stagedAsset" size="35">
          </div>
        </div>
      </div>
      <hr>
      <h3>Moves</h3>
          <button type="button" @click="addMove">Add</button>

      <div class="row ">
          <div v-for="(move, index) in moveList" :key="index" v-bind:selected="index === moveIndex" class="col move">
            <h4>{{index +1 }}</h4>
            <div class="input-row">
              <label>X:</label>
              <input type="number" v-model="move.x" class="input-number">
            </div>
            <div class="input">
              <label>Y:</label>
              <input type="number" v-model="move.y" class="input-number">
            </div>
            <div class="input-row">
              <label>H:</label>
              <input type="number" v-model="move.r" class="input-number">
            </div>
            <button type="button" @click="removeMove(index)">Del</button>
          </div>
        </div>
  </div>
</template>

<script lang="ts">
import axios from 'axios'
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
      request: {
        url : '' as string,
        apiKey: '' as string,
        stagedAsset: '' as string,
      },
      moveList: [{ x: '0', y: '0', r: '0' }] as Array<{x: string, y: string, r: string}>,
      moveIndex : -1 as number,
      jwt : '' as string
    }
  },
  methods: {
    timer(ms: number) {
        return new Promise((res) => setTimeout(res, ms))
    },
    async layConnection() {
      for ( let i = 0; i < this.moveList.length; i++ ) {
        this.moveIndex = i
        console.log(i)
        this.oneMove(parseFloat(this.moveList[i].x), parseFloat(this.moveList[i].y), parseFloat(this.moveList[i].r))
        await this.timer(3000)
      }
      this.moveIndex = -1
    },
    async oneMove(x: number, y: number , r: number) {
      let sA
      try {
        console.log(`get staged Asset ${this.request.stagedAsset}`)
        sA = await axios({
          method: 'get',
          url: `${this.request.url}/jsonapi/stagedAssets/${this.request.stagedAsset}`,
          headers: {
            token: this.request.apiKey
          }
        })
      } catch (e) {
        console.log(`Error while retriving staged asset:`, e)
        return
      }
      const newInitialState = sA.data.data.attributes.initialState
      newInitialState.x = x
      newInitialState.y = y
      newInitialState.rotation = r
      console.log('initialState', newInitialState)
      let cAT
      try {
        console.log(`get connectionAsTo of stagedAsset`)
        cAT = await axios({
          method: 'get',
          url: `${this.request.url}/jsonapi/connections?filter[to]=${this.request.stagedAsset}`,
          headers: {
            token: this.request.apiKey
          }
        })
      } catch (e) {
        console.warn(`Error while retriving staged asset connectionAsTo:`, e)
      }

      const connectionsAsTo = cAT ? cAT.data.data : []
      for (const connection of connectionsAsTo) {

        const connectionId = connection.id
        const intermediaryPoints = connection.attributes.intermediaryPoints
        intermediaryPoints.push({
          x: newInitialState.x,
          y: newInitialState.y
        })
        try {
          await axios({
            method: 'patch',
            url: `${this.request.url}/jsonapi/connections/${connectionId}`,
            data: {
              data:  {
                attributes: {
                  id: connectionId,
                type: 'connections',
                intermediaryPoints
                }
              }
            },
            headers: {
              // authorization : `Bearer ${this.jwt}`
              token: this.request.apiKey
            }
          })
          console.log(`connection ${connectionId} patched`)
        } catch (e) {
          console.warn(`failed to patch connection ${connectionId}`, e)

        }
      }
      try {
        await axios({
          method: 'patch',
          url: `${this.request.url}/jsonapi/stagedAssets/${this.request.stagedAsset}`,
          data: {
            data:  {
              attributes: {
                id: this.request.stagedAsset,
                type: 'stagedAssets',
                initialState: newInitialState
              }
            }
          },
          headers: {
            // authorization : `Bearer ${this.jwt}`
            token: this.request.apiKey
          }
        })
        console.log(`staged asset ${this.request.stagedAsset} patched`)

      } catch (e) {
          console.warn(`failed to patch stagedAset ${this.request.stagedAsset}`, e)
      }
    },
    removeMove(index: number) {
      this.moveList.splice(index, 1)
      console.log(index)
    },
     addMove() {
      this.moveList.push({ x: '0', y: '0', r: '0' })
    }
  }
})
</script>

<style lang="scss">
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;

  .row {
    padding: 10px;
    display: flex;
    justify-content: start;
    align-content: space-around;
    flex-wrap: wrap;
  }
  .config-row {
    justify-content: space-between  
  }
  .config {
    margin:50x;
    padding:5px;
    width: 300px;
    border: 3px solid green;
  }
  .input-row {
    padding:5px;
  }
  .input-number {
      width: 6em;
    }
  
  .move {

    margin:5px;
    padding:5px;
    width: 150px;
    border: 3px solid green;
        background-color:rgba(52, 121, 31, 0.1);

  }
  div[selected] {
    background-color:rgba(52, 121, 31, 0.3);
  }
  .col {
    display: flex;
    flex-direction: column;
  }
}
</style>
