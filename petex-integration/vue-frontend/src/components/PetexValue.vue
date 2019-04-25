<template>
  <div v-on:click="$emit('selectDataSet', data)" class="pull-left" >
    {{data.ObjectTypePropertyName}}: {{roundedValue}} {{data.AliasText}}
  </div>
</template>
<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: [
    'data',
  ],
  computed: {
    roundedValue() {
      return parseFloat(this.data.CurrentValue).toFixed(2)
    }
  }
})
</script>
<style lang="scss" scoped>
.pull-left {
  text-align: left;
  width: 100%;
}
</style>
