<template>
  <div 
    class="sensor-card"
    :class="{ selected: isSelected, [type]: true }"
    @click="$emit('click')"
    @dblclick="$emit('dblclick')"
  >
    <div v-if="sortType === 'rooms'" class="sensor-header">
    <span class="room">{{ paramTitle }}</span>
    </div>
        <div v-else class="sensor-header">
      <span class="room">{{ roomTitle }}</span>
    </div>

    <div class="sensor-value">
      {{ formattedValue(value) }}
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>
       <div v-if="setValue != null || undefined" class="sensor-SetValue">
      {{ formattedValue(setValue) }}
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>
    <div class="sensor-footer">
      <time>{{ formattedTime }}</time>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ParamPlace', 
  props: {
    paramTitle: { type: String, required: true }, 
    roomTitle: { type: String, required: true },
    value: { type: Number, required: true },
    setValue: { type: Number, required: true },
    sortType: { type: Number, required: true },
    unit: String,
    timeUpdated: { type: Number, required: true },
    isSelected: { type: Boolean, required: true, default: false },
  }, 
  computed: {
    type() {
      if (typeof this.value === 'number') {
        if (this.unit === '°C') return 'temperature'
        if (this.unit === '%') return 'humidity'
      }
      return 'default'
    },
    formattedTime() {
      if (!this.timeUpdated) return 'Нет данных'
      
      const date = new Date(this.timeUpdated)
      return isNaN(date) 
        ? this.timeUpdated 
        : date.toLocaleTimeString()
    }
  },
  methods: {
        formattedValue(value) {
      if (typeof value === 'number') {
        return value.toFixed(1)
      }
      return value
    },
  }
}
</script>

<style lang="css" src="../assets/mainStyle.css">
.selected { 
    border: 3px solid var(--light_font); /* Пример изменения обводки */ 
    }
</style>
