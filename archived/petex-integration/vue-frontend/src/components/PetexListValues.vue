<template>
  <div class="container greenFive">
    <div>
      <div class="list-header">
        Curent Values
      </div>
      <div
        v-for="data in dataList"
        :key="data.datasetId"
        v-bind:selected="data.datasetId === (selected && selected.datasetId) ? true :false"
        class="list-item">
          <PetexValue :data="data" v-on:selectDataSet="selectDataSet" />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue'
import PetexValue from './PetexValue.vue'

import { IpetexValue } from '../interfaces'

export default Vue.extend({
  data() {
    return {
      selected: undefined as IpetexValue | undefined
    }
  },
  components: {
    PetexValue,
  },
  props: [
    'well',
    'dataList'
  ],
  methods: {
    selectDataSet(value: IpetexValue) {
      this.selected = value
      this.$emit('selectDataSet', value)
    }
  }
})
</script>
<style lang="scss" scoped>
  .pull-left {
    text-align: left;
  }
  .list-header {
    color: white;
    background-color:rgba(52, 121, 31, 0.9);
  }
	.list-item {
		cursor: pointer;
		display: inline-table;
		border: 1px solid rgba(0, 0, 0, 0);
		width:100%;
	}
	.list-item[selected] {
		background: rgba(0, 0, 0, 0.05);
		border-radius: 0px;
		border: 1px solid rgba(0, 0, 0, 0.2);
    background-color:rgba(52, 121, 31, 0.3);
	}
    .greenFive{
    padding-left: 4px;
    padding-top: 4px;
    padding-bottom: 4px;
    background-color:rgba(52, 121, 31, 0.1);
  }
   .container {
    margin-top: 0px;
    padding-top: 4px;
    display: block;
    overflow: auto;
    color: #222;
    width: 100%;
    height: 100%;
  }

 
</style>
