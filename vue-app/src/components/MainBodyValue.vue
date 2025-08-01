<template>
  <div 
    class="sensor-card"
    :class="{ selected: isSelected, [type]: true }"
    @click="$emit('click')"
    @dblclick="$emit('dblclick')"
  >
    <div class="sensor-header">
      <h3>{{ title }}</h3>
      <span v-if="roomTitle" class="room">{{ roomTitle }}</span>
    </div>
    
    <div class="sensor-value">
      {{ formattedValue }}
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
    title: { type: String, required: true }, 
    roomTitle: { type: String, required: true },
    value: { type: Number, required: true },
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
    
    formattedValue() {
      if (typeof this.value === 'number') {
        return this.value.toFixed(2)
      }
      return this.value
    },
    
    formattedTime() {
      if (!this.timeUpdated) return 'Нет данных'
      
      const date = new Date(this.timeUpdated)
      return isNaN(date) 
        ? this.timeUpdated 
        : date.toLocaleTimeString()
    }
  }
}
</script>

<style>
.selected { 
    border: 3px solid var(--light_font); /* Пример изменения обводки */ 
    }
</style>
