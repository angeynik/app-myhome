<!-- components/MainBodyValue.vue -->
<template>
  <div
    class="sensor-card"
    :class="{ selected: isSelected, [type]: true }"
  >
    <!-- Заголовок: параметр (главное) + комната (контекст) -->
    <div class="sensor-header">
      <span class="room">{{ paramTitle }}</span>
      <span class="room-context">{{ roomTitle }}</span>
    </div>

    <!-- Основное значение -->
    <div :class="getValueClass()">
      {{ formattedValue(value) }}
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>

    <!-- Уставка (если определена) -->
    <div
      v-if="setValue != null"
      :class="isSelected ? 'sensor-SetValue selected-setvalue' : 'sensor-SetValue'"
    >
      {{ formattedValue(setValue) }}
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>

    <!-- Время последнего обновления -->
    <div class="sensor-footer">
      <time>{{ timeUpdated || 'Нет данных' }}</time>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainBodyValue',

  props: {
    paramTitle: { type: String, required: true },
    roomTitle:  { type: String, required: true },
    // value может быть числом или строкой ('ON'/'OFF'); null допустим
    value:      { type: [Number, String], default: null },
    // setValue null → уставка не показывается
    setValue:   { type: [Number, String], default: null },
    unit:       { type: String, default: '' },
    // timeUpdated — уже готовая строка («сейчас», «5 мин назад», «2 ч назад»)
    timeUpdated: { type: String, default: '' },
    isSelected: { type: Boolean, default: false },
  },

  computed: {
    type() {
      if (typeof this.value === 'number') {
        if (this.unit === '°C') return 'temperature';
        if (this.unit === '%')  return 'humidity';
      }
      return 'default';
    },
  },

  methods: {
    getValueClass() {
      if (this.setValue == null) return 'sensor-value';
      return this.isSelected ? 'sensor-value selected-value' : 'sensor-value';
    },

    formattedValue(value) {
      if (typeof value === 'number') return value.toFixed(1);
      return value;
    },
  },
};
</script>

<style lang="css" src="../assets/mainStyle.css">
.selected {
  border: 10px solid var(--orange);
}
</style>

<style scoped>
/* Контекст комнаты — приглушённый, чтобы не конкурировать с параметром */
.room-context {
  font-size: 0.75em;
  opacity: 0.65;
  margin-left: 0.35em;
  font-weight: normal;
}
</style>