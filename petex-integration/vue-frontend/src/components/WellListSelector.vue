	<template>
  <span>
    <b-form-select
      :select-size="1"
      v-model="selectedWells"
      :options="options"
      v-on:change="$emit('change-selected', $event)"
    />
  </span>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    data() {
      return {
        selectedWells: this.selected,
      }
    },
    props: [
      'selected',
      'options',
    ],
    computed: {

    },
    methods: {
    },
})
</script>
<style lang="scss" scoped>
</style>

