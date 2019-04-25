<template>
  <div class="full-height">
    <h2 class="" v-if="dataSetDescription">
    </h2>
      <GChart 
        v-if="dataSetDescription"
        type="LineChart"
        :data="chartData"
        :options="chartOptions"
      />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { GChart } from 'vue-google-charts'
import { IdataPointTimeValue, IpetexDataPoint,  } from '../interfaces'
export default Vue.extend({
  data() {
    return {
      chartMin: Infinity,
      chartMax: - Infinity
    }
  },
  props: [
    'dataSetDescription',
    'dataSet'
  ],
  components: {
    GChart
  },
  computed: {
    chartData() {
        this.chartMax = - Infinity
        this.chartMin = Infinity
        return [['A', 'B']].concat((this.dataSet || []).map(
          (d: IpetexDataPoint) => {
            d.NumericValue = typeof d.NumericValue === 'number' ? d.NumericValue : parseFloat(d.NumericValue)
            this.chartMin = d.NumericValue < this.chartMin ? d.NumericValue : this.chartMin
            this.chartMax = d.NumericValue > this.chartMax ? d.NumericValue : this.chartMax
            return [
              new Date(Date.parse(d.TimeOfSample)),
              d.NumericValue
            ]
          }
          ).sort(
            (a: any[], b: any[]) => {
              return  Date.parse(a[0]) - Date.parse(b[0])
            }
          )
        )
    },
    chartOptions() {
      return {
        title: this.dataSetDescription.ObjectTypePropertyName,
        legend: 'none',
        backgroundColor: '#eaf1e8',
        height: '400',
        vAxes: {
          0: {
            title: this.dataSetDescription.AliasText
          }
        },
        vAxis: {
          minValue: this.chartMin - (this.chartMax - this.chartMin) * 2,
          maxValue: this.chartMax + (this.chartMax - this.chartMin) / 2
        },
        hAxis: {
            format: 'M/d - H:00',
            gridlines: {count: 5}
          },
      }
    }
  }

})
</script>

<style lang="scss" scoped>
.full-height {
  height: 100%
}

</style>
