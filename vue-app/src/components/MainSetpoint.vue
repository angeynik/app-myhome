<!-- components/MainSetpoint.vue -->
<template>
  
    <div class="setpointBlock" 
    >
    <!-- Символы для визуализации области скролла при изменении уставки -->
    <svg display="none">
        <symbol id="iconTelegram" viewBox="0 0 24 24">
          <path style="fill-rule:evenodd;clip-rule:evenodd;" d="M12,0C5.373,0,0,5.373,0,12s5.373,12,12,12s12-5.373,12-12S18.627,0,12,0z    M17.562,8.161c-0.18,1.897-0.962,6.502-1.359,8.627c-0.168,0.9-0.5,1.201-0.82,1.23c-0.697,0.064-1.226-0.461-1.901-0.903   c-1.056-0.692-1.653-1.123-2.678-1.799c-1.185-0.781-0.417-1.21,0.258-1.911c0.177-0.184,3.247-2.977,3.307-3.23   c0.007-0.032,0.015-0.15-0.056-0.212s-0.174-0.041-0.248-0.024c-0.106,0.024-1.793,1.139-5.062,3.345   c-0.479,0.329-0.913,0.489-1.302,0.481c-0.428-0.009-1.252-0.242-1.865-0.442c-0.751-0.244-1.349-0.374-1.297-0.788   c0.027-0.216,0.324-0.437,0.892-0.663c3.498-1.524,5.831-2.529,6.998-3.015c3.333-1.386,4.025-1.627,4.477-1.635   C17.472,7.214,17.608,7.681,17.562,8.161z"/>
        </symbol>
        <symbol id="setpointSelector" 
        viewBox="0 0 440 60"  
        xmlns="http://www.w3.org/2000/svg" 
        stroke="white" 
        width="100%" 
        height="100%" 
        preserveAspectRatio="xMidYMid meet"
        >         
      <line x1="261.5" y1="10" x2="261.5" y2="50" stroke="white"/>
      <line x1="204.5" y1="10" x2="204.5" y2="50" stroke="white"/>
      <line x1="147.5" y1="10" x2="147.5" y2="50" stroke="white"/>
      <line x1="90.5" y1="10" x2="90.5" y2="50" stroke="white"/>
      <line x1="33.5" y1="10" x2="33.5" y2="50" stroke="white"/>
      <line x1="250.5" y1="10" x2="250.5" y2="50" stroke="white"/>
      <line x1="193.5" y1="10" x2="193.5" y2="50" stroke="white"/>
      <line x1="136.5" y1="10" x2="136.5" y2="50" stroke="white"/>
      <line x1="79.5" y1="10" x2="79.5" y2="50" stroke="white"/>
      <line x1="22.5" y1="10" x2="22.5" y2="50" stroke="white"/>
      <line x1="239.5" y1="10" x2="239.5" y2="50" stroke="white"/>
      <line x1="182.5" y1="10" x2="182.5" y2="50" stroke="white"/>
      <line x1="125.5" y1="10" x2="125.5" y2="50" stroke="white"/>
      <line x1="68.5" y1="10" x2="68.5" y2="50" stroke="white"/>
      <line x1="11.5" y1="10" x2="11.5" y2="50" stroke="white"/>
      <line x1="228.5" y1="10" x2="228.5" y2="50" stroke="white"/>
      <line x1="171.5" y1="10" x2="171.5" y2="50" stroke="white"/>
      <line x1="114.5" y1="10" x2="114.5" y2="50" stroke="white"/>
      <line x1="57.5" y1="10" x2="57.5" y2="50" stroke="white"/>
      <line x1="0.5" y1="10" x2="0.499998" y2="50" stroke="white"/>
      <line x1="273.5" y1="6.55671e-08" x2="273.5" y2="60" stroke="white" stroke-width="3"/>
      <line x1="330.5" y1="6.55671e-08" x2="330.5" y2="60" stroke="white" stroke-width="3"/>
      <line x1="387.5" y1="6.55671e-08" x2="387.5" y2="60" stroke="white" stroke-width="3"/>
      <line x1="216.5" y1="6.55671e-08" x2="216.5" y2="60" stroke="white" stroke-width="3"/>
      <line x1="159.5" y1="6.55671e-08" x2="159.5" y2="60" stroke="white" stroke-width="3"/>
      <line x1="102.5" y1="6.55671e-08" x2="102.5" y2="60" stroke="white" stroke-width="3"/>
      <line x1="45.5" y1="6.55671e-08" x2="45.5" y2="60" stroke="white" stroke-width="3"/>
      <line x1="285.5" y1="10" x2="285.5" y2="50" stroke="white"/>
      <line x1="342.5" y1="10" x2="342.5" y2="50" stroke="white"/>
      <line x1="399.5" y1="10" x2="399.5" y2="50" stroke="white"/>
      <line x1="296.5" y1="10" x2="296.5" y2="50" stroke="white"/>
      <line x1="353.5" y1="10" x2="353.5" y2="50" stroke="white"/>
      <line x1="410.5" y1="10" x2="410.5" y2="50" stroke="white"/>
      <line x1="307.5" y1="10" x2="307.5" y2="50" stroke="white"/>
      <line x1="364.5" y1="10" x2="364.5" y2="50" stroke="white"/>
      <line x1="421.5" y1="10" x2="421.5" y2="50" stroke="white"/>
      <line x1="318.5" y1="10" x2="318.5" y2="50" stroke="white"/>
      <line x1="375.5" y1="10" x2="375.5" y2="50" stroke="white"/>
      <line x1="432.5" y1="10" x2="432.5" y2="50" stroke="white"/>

        </symbol>
  
        <symbol id="setpointBigSelector" viewBox="0 0 6 60" xmlns="http://www.w3.org/2000/svg">
          <line x1="1.5" y1="6.55671e-08" x2="1.5" y2="60" stroke="white" stroke-width="3"/>
        </symbol>
  
        <symbol id="setpointSmallSelector" viewBox="0 0 34 40"  xmlns="http://www.w3.org/2000/svg">
          <line x1="33.5" y1="2.18557e-08" x2="33.5" y2="40" stroke="white"/>
          <line x1="22.5" y1="2.18557e-08" x2="22.5" y2="40" stroke="white"/>
          <line x1="11.5" y1="2.18557e-08" x2="11.5" y2="40" stroke="white"/>
          <line x1="0.5" y1="2.18557e-08" x2="0.499998" y2="40" stroke="white"/>
        </symbol>
  
  
    </svg>
 
    <div class="setpointValue"
          @touchstart="handleTouchStart" 
          @touchend="handleTouchEnd('setpointBlock')"
          @touchmove="handleTouchMove"
          >
        <svg class="setpointValue_icon"
          @click="clickChangeSetpoint(-50)"
        >
          <use href="#setpointSelector"></use>
        </svg>

      <div class="setpointValue_number" @click="toggleBooleanValue">
        <h1>{{ displayValue }}</h1>
        <span v-if="!isBoolean && unit" class="unit">{{ unit }}</span>
      </div>

        <svg class="setpointValue_icon"
        @click="clickChangeSetpoint(50)"
        >
          <use href="#setpointSelector"></use>
        </svg>

    </div>
    <div class="setpointLimits">
      <h4> {{ limLow }} </h4>
      <h4> {{ limHigh }} </h4>
    </div>
  
  
    </div>
  </template>
 
  <script>
  import { mapActions } from 'vuex';
  import logger from '../store/modules/logger.js';

  const INACTIVITY_TIMEOUT = 8000; // мс без действий → панель скрывается
  const DEBOUNCE_MS = 16;

  // Количество знаков после запятой у шага: 0.25 → 2, 0.5 → 1, 1 → 0
  function decimalsOf(step) {
    const part = String(step).split('.')[1];
    return Math.min(part ? part.length : 0, 4);
  }

  export default {
    name: 'MainSetpoint',
    emits: ['eventsMainSetpoint', 'eventsSchedule', 'inactivity-timeout'],

    props: {
      setPoint: {
        required: true,
        // значение может быть числом, boolean, строкой 'ON'/'OFF' (MainBody) или отсутствовать
        validator: (value) => ['number', 'boolean', 'string'].includes(typeof value)
          || value === null || value === undefined,
      },
      request: String,
      roomKey: String,
      setpointKey: String,
      valueTitle: String,
    },

    data() {
      return {
        startX: 0,
        newSetPointValue: null,
        inactivityTimer: null,
      };
    },

    computed: {
      isBoolean() {
        return typeof this.newSetPointValue === 'boolean';
      },
      displayValue() {
        if (this.newSetPointValue === null || this.newSetPointValue === undefined) return '—';
        if (this.isBoolean) return this.newSetPointValue ? 'ON' : 'OFF';
        return this.newSetPointValue;
      },
      limHigh() {
        return this.$store.state.settingsData?.limits?.limHigh ?? 36;
      },
      limLow() {
        return this.$store.state.settingsData?.limits?.limLow ?? 5;
      },
      limStep() {
        return this.$store.state.settingsData?.limits?.limStep ?? 1;
      },
    },

    watch: {
      // Источник истины — родитель: при изменении (в том числе откате) синхронизируем локальное значение
      setPoint: {
        immediate: true,
        handler(newVal) {
          this.resetInactivityTimer();
          if (typeof newVal === 'boolean') {
            this.newSetPointValue = newVal;
          } else if (typeof newVal === 'number' && !Number.isNaN(newVal)) {
            this.newSetPointValue = newVal;
          } else if (typeof newVal === 'string') {
            if (newVal === 'ON') this.newSetPointValue = true;
            else if (newVal === 'OFF') this.newSetPointValue = false;
            else {
              const num = parseFloat(newVal);
              this.newSetPointValue = Number.isNaN(num) ? null : num;
            }
          } else {
            this.newSetPointValue = null;
          }
        },
      },
    },

    created() {
      this.debouncedCalculateSetpoint = this.debounce(this.calculateSetpoint, DEBOUNCE_MS);
    },

    mounted() {
      this.startInactivityTimer();
    },

    beforeUnmount() {
      this.clearInactivityTimer();
      this.debouncedCalculateSetpoint?.cancel();
    },

    methods: {
      ...mapActions(['updateSettingsData']),

      sendEmitMessage(event, value) {
        if (!event || value === undefined || value === null) {
          logger.error('[MainSetpoint] sendEmitMessage - параметры не переданы:', { event, value });
          return;
        }
        this.$emit('eventsMainSetpoint', {
          [event]: {
            request: this.request,
            value,
            title: this.valueTitle,
          },
        });
      },

      handleTouchStart(event) {
        this.resetInactivityTimer();
        this.startX = event.touches[0].clientX;
      },

      handleTouchEnd() {
        this.resetInactivityTimer();
      },

      handleTouchMove(event) {
        const deltaX = event.touches[0].clientX - this.startX;
        if (Math.abs(deltaX) < 8) return; // слишком маленькое смещение
        this.debouncedCalculateSetpoint(deltaX, this.limStep, this.limLow, this.limHigh);
      },

      calculateSetpoint(offset, step, min, max) {
        this.resetInactivityTimer();

        // Булево значение: любое действие переключает
        if (this.isBoolean) {
          this.newSetPointValue = !this.newSetPointValue;
          this.sendEmitMessage('updateState', this.newSetPointValue);
          return;
        }

        // Множитель шага: |offset| > 120 → «крупный» шаг (x10).
        // (раньше при offset ровно 120 не происходило ничего)
        let multiplier = 0;
        if (offset >= 120) multiplier = 10;
        else if (offset > 5) multiplier = 1;
        else if (offset <= -120) multiplier = -10;
        else if (offset < -5) multiplier = -1;
        if (multiplier === 0) return;

        const lo = Number(min);
        const hi = Number(max);
        const stepNum = Number(step) > 0 ? Number(step) : 1;

        // Базируемся на локальном значении, а не на пропе: проп обновляется родителем
        // асинхронно, и быстрые клики теряли часть шагов. (Раньше значение пропа ещё и
        // безусловно перезаписывало вычисленное currentSetPoint.)
        const current = typeof this.newSetPointValue === 'number' ? this.newSetPointValue : lo;

        let newValue = current + multiplier * stepNum;
        // Округление до точности шага — иначе копится ошибка float (20.1 + 0.1 = 20.200000000000003)
        newValue = Number(newValue.toFixed(decimalsOf(stepNum)));

        // Выход за границы — переход на противоположный край
        if (Number.isFinite(hi) && newValue > hi) newValue = lo;
        else if (Number.isFinite(lo) && newValue < lo) newValue = hi;

        if (!Number.isFinite(newValue)) return;
        this.newSetPointValue = newValue;
        this.sendEmitMessage('updateState', newValue);
      },

      clickChangeSetpoint(value) {
        this.calculateSetpoint(value, this.limStep, this.limLow, this.limHigh);
      },

      toggleBooleanValue() {
        if (this.isBoolean) this.calculateSetpoint(0, this.limStep, this.limLow, this.limHigh);
      },

      debounce(func, wait) {
        let timeout;
        const debounced = (...args) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(this, args), wait);
        };
        debounced.cancel = () => clearTimeout(timeout);
        return debounced;
      },

      // Идемпотентно: старый таймер всегда сбрасывается.
      // Раньше immediate-watcher и mounted() каждый запускали свой таймер,
      // первый «терялся» и закрывал панель через 8 с независимо от активности.
      startInactivityTimer() {
        this.clearInactivityTimer();
        this.inactivityTimer = setTimeout(() => {
          this.inactivityTimer = null;
          this.$emit('inactivity-timeout');
        }, INACTIVITY_TIMEOUT);
      },
      resetInactivityTimer() {
        this.startInactivityTimer();
      },
      clearInactivityTimer() {
        if (this.inactivityTimer) {
          clearTimeout(this.inactivityTimer);
          this.inactivityTimer = null;
        }
      },
    },
  };
  </script>
