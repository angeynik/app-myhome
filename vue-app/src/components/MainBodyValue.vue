<!-- components/MainBodyValue.vue -->
<template>
  <div
    class="sensor-card"
    :class="[tone, { selected: isSelected }]"
    :title="timeUpdated"
  >
    <!-- Слева: иконка параметра (цвет — по тону плашки или тревоге) -->
    <div class="sensor-icon-wrapper">
      <div class="sensor-icon">
        <SensorIcon :name="paramKey" :state="iconState" size="100%" />
      </div>
    </div>

    <!-- Справа: название и значения -->
    <div class="sensor-content">
      <div class="sensor-title">
        {{ paramTitle }}
      </div>

      <div class="sensor-values" :class="{ 'no-setpoint': setValue === null }">
        <!-- Уставка (если есть) -->
        <div v-if="setValue !== null" class="sensor-set-value">
          {{ formattedValue(setValue) }}<span v-if="unit" class="unit">{{ unit }}</span>
        </div>

        <!-- Фактическое значение -->
        <div class="sensor-actual-value">
          {{ formattedValue(value) }}<span v-if="unit && value !== null" class="unit">{{ unit }}</span>
        </div>
      </div>
      <!-- Время последнего обновления -->
      <div class="sensor-time">
        {{ timeUpdated }}
      </div>
    </div>
  </div>
</template>

<script>
import SensorIcon from '@/components/SensorIcon.vue';
import { normalizeSensorKey } from '@/utils/sensorIcons';
import { getTone } from '@/utils/tone';

// Параметры, срабатывание которых (ON) — тревога: иконка красная
const ALARM_KEYS = ['dFire', 'dLeak'];

export default {
  name: 'MainBodyValue',
  components: { SensorIcon },

  props: {
    paramTitle: { type: String, required: true },
    paramKey: { type: String, default: '' },
    roomTitle: { type: String, default: '' },   // не отображается (заголовок группы показывает комнату)
    value: { type: [Number, String], default: null },
    setValue: { type: [Number, String], default: null },
    unit: { type: String, default: '' },
    timeUpdated: { type: String, default: '' },
    isSelected: { type: Boolean, default: false },
  },

  computed: {
    // Тон плашки: is-warm — уставка выше факта (нагрев), is-cool — ниже (охлаждение).
    // Без уставки или при равенстве — нейтральный.
    tone() {
      return getTone(this.setValue, this.value);
    },

    // Тревога имеет приоритет над тоном: красная иконка при ON у пожара/протечки
    iconState() {
      return ALARM_KEYS.includes(normalizeSensorKey(this.paramKey)) && this.value === 'ON'
        ? 'alarm'
        : '';
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
