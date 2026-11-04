<!-- components/SetpointScreen.vue -->
<!-- Полноэкранная панель изменения значения (уставка, часы/минуты расписания, порог и т.п.).
     Подключается в MainView.vue; сам рендерится в <body> через Teleport.
     Значение меняется кнопками −/+ или круговым свайпом по внешнему кольцу. -->
<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="setpoint-screen"
      role="dialog"
      aria-modal="true"
      :aria-label="`${roomTitle} — ${paramTitle}`"
    >
      <!-- Шапка -->
      <div class="setpoint-header">
        <div class="setpoint-titles">
          <span class="setpoint-room">{{ roomTitle }}</span>
          <span class="setpoint-param">{{ paramTitle }}</span>
        </div>
        <button
          type="button"
          class="setpoint-close"
          aria-label="Закрыть"
          @click="$emit('close')"
        >✕</button>
      </div>

      <!-- Центральный блок -->
      <div class="setpoint-center-area">
        <!-- Внешняя окружность: круговой свайп -->
        <div
          ref="ring"
          class="setpoint-outer-ring"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchEnd"
        >
          <button
            type="button"
            class="setpoint-btn minus"
            aria-label="Уменьшить"
            @touchstart.stop
            @click="changeValue(-1)"
          >
            <span>−</span>
          </button>

          <!-- Внутренняя окружность: значение -->
          <div class="setpoint-inner-circle">
            <div class="setpoint-value-row">
              <span class="setpoint-value-large">{{ displayValue }}</span>
              <span v-if="unit && !isBoolean" class="setpoint-unit-large">{{ unit }}</span>
            </div>

            <div v-if="hasActual" class="setpoint-actual-small">
              {{ actualValue }}<span v-if="unit" class="unit">{{ unit }}</span>
            </div>
          </div>

          <button
            type="button"
            class="setpoint-btn plus"
            aria-label="Увеличить"
            @touchstart.stop
            @click="changeValue(1)"
          >
            <span>+</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
const ANGLE_THRESHOLD = 20; // градусов поворота на один шаг

// Значение приходит из store/сервера в разном виде: число, boolean, 'ON'/'OFF', числовая строка
function normalizeValue(raw) {
  if (typeof raw === 'boolean' || typeof raw === 'number') return raw;
  if (raw === 'ON') return true;
  if (raw === 'OFF') return false;
  if (typeof raw === 'string' && raw.trim() !== '' && !Number.isNaN(Number(raw))) return Number(raw);
  return null;
}

function decimalsOf(step) {
  const part = String(step).split('.')[1];
  return part ? Math.min(part.length, 4) : 0;
}

export default {
  name: 'SetpointScreen',
  emits: ['close', 'update-value'],

  props: {
    visible: { type: Boolean, default: true },
    roomTitle: { type: String, default: '' },
    paramTitle: { type: String, default: '' },
    setPoint: { type: [Number, Boolean, String], default: null },
    actualValue: { type: [Number, String], default: null },
    unit: { type: String, default: '' },
    // null/undefined (лимиты ещё не рассчитаны) → значения по умолчанию, см. computed
    limHigh: { type: Number, default: 36 },
    limLow: { type: Number, default: 8 },
    limStep: { type: Number, default: 0.5 },
  },

  data() {
    return {
      currentValue: normalizeValue(this.setPoint),
      isDragging: false,
      lastAngle: 0,
      accumulatedAngle: 0,
      centerX: 0,
      centerY: 0,
    };
  },

  computed: {
    // Лимиты с защитой: null раньше превращался в 0 и «схлопывал» диапазон
    high() { return Number.isFinite(this.limHigh) ? this.limHigh : 100; },
    low()  { return Number.isFinite(this.limLow) ? this.limLow : 0; },
    step() { return this.limStep > 0 ? this.limStep : 1; },

    isBoolean() {
      return typeof this.currentValue === 'boolean';
    },
    hasActual() {
      return this.actualValue !== null && this.actualValue !== undefined && this.actualValue !== '';
    },
    displayValue() {
      if (this.currentValue === null) return '—';
      if (this.isBoolean) return this.currentValue ? 'ON' : 'OFF';
      return Number(this.currentValue).toFixed(decimalsOf(this.step));
    },
  },

  watch: {
    // Родитель — источник истины (в том числе при откате неудачной отправки)
    setPoint(newVal) {
      this.currentValue = normalizeValue(newVal);
    },
  },

  mounted() {
    window.addEventListener('keydown', this.onKeydown);
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown);
  },

  methods: {
    onKeydown(event) {
      if (event.key === 'Escape') this.$emit('close');
    },

    changeValue(direction) {
      if (this.isBoolean) {
        this.currentValue = !this.currentValue;
        this.$emit('update-value', this.currentValue);
        return;
      }
      if (this.currentValue === null) return;

      let val = Number(this.currentValue) + this.step * direction;
      if (val > this.high) val = this.high;
      if (val < this.low) val = this.low;
      val = Number(val.toFixed(decimalsOf(this.step)));

      if (val === this.currentValue) return; // упёрлись в границу — не шлём лишнее
      this.currentValue = val;
      this.$emit('update-value', val);
    },

    // ── Круговой свайп ──────────────────────────────────────────────
    // Центр кольца считается при КАЖДОМ касании. Раньше он вычислялся только в watcher
    // на `visible`, но компонент создаётся уже с visible=true — watcher не срабатывал,
    // центр оставался (0, 0), и угол считался относительно угла экрана.
    updateCenter() {
      const el = this.$refs.ring;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      this.centerX = rect.left + rect.width / 2;
      this.centerY = rect.top + rect.height / 2;
    },

    handleTouchStart(event) {
      if (this.isBoolean) return;
      this.updateCenter();
      this.isDragging = true;
      this.accumulatedAngle = 0;
      this.lastAngle = this.getAngle(event.touches[0]);
    },

    handleTouchMove(event) {
      if (!this.isDragging) return;

      const currentAngle = this.getAngle(event.touches[0]);
      let delta = currentAngle - this.lastAngle;

      // переход через границу 180 / −180
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      this.accumulatedAngle += delta;
      this.lastAngle = currentAngle;

      while (this.accumulatedAngle >= ANGLE_THRESHOLD) {
        this.changeValue(1);
        this.accumulatedAngle -= ANGLE_THRESHOLD;
      }
      while (this.accumulatedAngle <= -ANGLE_THRESHOLD) {
        this.changeValue(-1);
        this.accumulatedAngle += ANGLE_THRESHOLD;
      }
    },

    handleTouchEnd() {
      this.isDragging = false;
    },

    getAngle(touch) {
      return Math.atan2(touch.clientY - this.centerY, touch.clientX - this.centerX) * (180 / Math.PI);
    },
  },
};
</script>
