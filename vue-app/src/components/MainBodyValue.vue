<!-- components/MainBodyValue.vue -->
<template>
  <div
    class="sensor-card"
    :class="{ selected: isSelected }"
    :title="timeUpdated"
  >
    <!-- Левая часть: Иконка (30%) -->
    <div class="sensor-icon-wrapper">
      <div class="sensor-icon">
        <!-- Заглушка для иконки. Позже можно заменить на <img src="..."> -->
        <span v-html="iconSvg"></span>
      </div>
    </div>

    <!-- Правая часть (70%) -->
    <div class="sensor-content">
      
      <!-- Верхняя половина: Название параметра -->
      <div class="sensor-title">
        {{ paramTitle }}
      </div>

      <!-- Нижняя половина: Уставка и Значение -->
      <div class="sensor-values" :class="{ 'no-setpoint': setValue === null }">
        
        <!-- Уставка (если есть) -->
        <div v-if="setValue !== null" class="sensor-set-value">
          {{ formattedValue(setValue) }}<span v-if="unit" class="unit">{{ unit }}</span>
        </div>
        
        <!-- Фактическое значение -->
        <div class="sensor-actual-value">
          {{ formattedValue(value) }}<span v-if="unit" class="unit">{{ unit }}</span>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainBodyValue',

  props: {
    paramTitle: { type: String, required: true },
    paramKey: { type: String, default: '' },
    roomTitle:  { type: String, required: true },
    value:      { type: [Number, String], default: null },
    setValue:   { type: [Number, String], default: null },
    unit:       { type: String, default: '' },
    timeUpdated: { type: String, default: '' },
    isSelected: { type: Boolean, default: false },
  },

  computed: {
    // Простая логика подбора иконки (SVG или emoji заглушка).
    // В будущем можно заменить на загрузку картинок из assets.
    iconSvg() {
      const key = (this.paramKey || this.paramTitle || '').toLowerCase();
      
      // Используем SVG-код (для стиля) или emoji (для скорости).
      // Сейчас emoji, чтобы не раздувать код.
      if (key.includes('temp') || key.includes('темп')) return '🌡️';
      if (key.includes('hum') || key.includes('влаж')) return '💧';
      if (key.includes('press') || key.includes('давл')) return '⏱️';
      if (key.includes('power') || key.includes('потреб')) return '⚡';
      if (key.includes('move') || key.includes('движ')) return '🏃';
      if (key.includes('leak') || key.includes('протеч')) return '💦';
      if (key.includes('door') || key.includes('дверь')) return '🚪';
      if (key.includes('stat') || key.includes('состояние')) return '⚙️';
      return '📊'; // Default
    },
  },

  methods: {
    formattedValue(val) {
      if (val === null || val === undefined) return '—';
      if (typeof val === 'number') return val.toFixed(1);
      return val;
    },
  },
};
</script>