<!-- components/SetpointScreen.vue -->
<template>
  <Teleport to="body">
    <div v-if="visible" class="setpoint-screen">
      
      <!-- Шапка -->
      <div class="setpoint-header">
        <div class="setpoint-titles">
          <span class="setpoint-room">{{ roomTitle }}</span>
          <span class="setpoint-param">{{ paramTitle }}</span>
        </div>
        <button class="setpoint-close" @click="$emit('close')">✕</button>
      </div>

      <!-- Основной круг -->
      <div 
        class="setpoint-circle-wrapper"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- Кнопка минус -->
        <div class="setpoint-btn minus" @click="changeValue(-1)">
          <span>−</span>
        </div>

        <!-- Центральный круг с цифрами -->
        <div class="setpoint-inner-circle">
          <div class="setpoint-value-large">{{ displayValue }}</div>
          <div class="setpoint-actual-small" v-if="actualValue !== null">
            {{ actualValue }}<span v-if="unit" class="unit">{{ unit }}</span>
          </div>
          <div class="setpoint-unit-large" v-else-if="unit">{{ unit }}</div>
        </div>

        <!-- Кнопка плюс -->
        <div class="setpoint-btn plus" @click="changeValue(1)">
          <span>+</span>
        </div>
      </div>

    </div>
  </Teleport>
</template>

<script>
const ANGLE_THRESHOLD = 20; // Градусов для одного шага

export default {
  name: 'SetpointScreen',
  emits: ['close', 'update-value'],

  props: {
    visible: { type: Boolean, default: false },
    roomTitle: { type: String, default: '' },
    paramTitle: { type: String, default: '' },
    setPoint: { type: [Number, Boolean], default: 0 },
    actualValue: { type: [Number, String], default: null },
    unit: { type: String, default: '' },
    limHigh: { type: Number, default: 100 },
    limLow: { type: Number, default: 0 },
    limStep: { type: Number, default: 0.5 },
  },

  data() {
    return {
      currentValue: this.setPoint,
      isDragging: false,
      lastAngle: 0,
      accumulatedAngle: 0,
      centerX: 0,
      centerY: 0,
    };
  },

  computed: {
    isBoolean() {
      return typeof this.currentValue === 'boolean';
    },
    displayValue() {
      if (this.isBoolean) return this.currentValue ? 'ON' : 'OFF';
      // Округляем до точности шага
      const decimals = String(this.limStep).includes('.') ? String(this.limStep).split('.')[1].length : 0;
      return Number(this.currentValue).toFixed(decimals);
    },
  },

  watch: {
    setPoint(newVal) {
      this.currentValue = newVal;
    },
    visible(newVal) {
      if (newVal) {
        // При открытии даем компоненту отрисоваться, чтобы получить координаты центра
        this.$nextTick(() => {
          const el = this.$el.querySelector('.setpoint-circle-wrapper');
          if (el) {
            const rect = el.getBoundingClientRect();
            this.centerX = rect.left + rect.width / 2;
            this.centerY = rect.top + rect.height / 2;
          }
        });
      }
    },
  },

  methods: {
    changeValue(multiplier) {
      if (this.isBoolean) {
        this.currentValue = !this.currentValue;
        this.$emit('update-value', this.currentValue);
        return;
      }

      let val = Number(this.currentValue) + (this.limStep * multiplier);
      
      // Защита от выхода за границы
      if (val > this.limHigh) val = this.limHigh;
      if (val < this.limLow) val = this.limLow;

      // Округление от ошибок плавающей запятой
      const decimals = String(this.limStep).includes('.') ? String(this.limStep).split('.')[1].length : 0;
      val = Number(val.toFixed(decimals));

      this.currentValue = val;
      this.$emit('update-value', val);
    },

    // ── Логика свайпа по кругу ──────────────────────────────────────
    handleTouchStart(event) {
      if (this.isBoolean) return;
      this.isDragging = true;
      this.accumulatedAngle = 0;
      this.lastAngle = this.getAngle(event.touches[0]);
    },

    handleTouchMove(event) {
      if (!this.isDragging) return;
      
      const currentAngle = this.getAngle(event.touches[0]);
      let delta = currentAngle - this.lastAngle;

      // Обработка перехода через границу 180 / -180 градусов
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      this.accumulatedAngle += delta;
      this.lastAngle = currentAngle;

      // Если накопленный угол превысил порог — делаем шаг
      if (this.accumulatedAngle >= ANGLE_THRESHOLD) {
        this.changeValue(1);
        this.accumulatedAngle -= ANGLE_THRESHOLD;
      } else if (this.accumulatedAngle <= -ANGLE_THRESHOLD) {
        this.changeValue(-1);
        this.accumulatedAngle += ANGLE_THRESHOLD;
      }
    },

    handleTouchEnd() {
      this.isDragging = false;
    },

    getAngle(touch) {
      const dx = touch.clientX - this.centerX;
      const dy = touch.clientY - this.centerY;
      // atan2 возвращает от -PI до PI, переводим в градусы
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      return angle;
    },
  },
};
</script>