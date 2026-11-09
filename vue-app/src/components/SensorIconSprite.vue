<!-- components/SensorIconSprite.vue -->
<!-- SVG-спрайт иконок датчиков / актуаторов / уставок. Монтируется ОДИН раз (App.vue).
     Иконки рисуются контуром (stroke) на сетке 24×24 в стиле homeIcon/menuIcon.
     Цвет задаётся снаружи через `color` (stroke="currentColor"), акцент — через --icon-accent.
     Отображение: <SensorIcon name="dTemp02" />  (см. SensorIcon.vue) -->
<template>
  <svg class="icon-sprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      <!-- ───────── ДАТЧИКИ ───────── -->
      <!-- dTemp: термометр -->
      <g id="si-thermometer">
        <path d="M14 14.4V5a2 2 0 0 0-4 0v9.4a4.2 4.2 0 1 0 4 0z" />
        <path d="M12 9.5v7" />
      </g>
      <!-- dHum: капля -->
      <g id="si-humidity">
        <path d="M12 2.8s6.5 6.4 6.5 11a6.5 6.5 0 0 1-13 0c0-4.6 6.5-11 6.5-11z" />
        <path d="M8.8 14.6a3.3 3.3 0 0 0 3.2 3.2" />
      </g>
      <!-- dPress: манометр -->
      <g id="si-gauge">
        <path d="M4.2 17.5a9 9 0 1 1 15.6 0" />
        <path d="M12 15l3.8-5.6" />
        <circle cx="12" cy="15" r="1.4" />
        <path d="M12 6.4v1.6M6.4 9l1.2 1M17.6 9l-1.2 1" />
      </g>
      <!-- dPower: молния -->
      <g id="si-bolt">
        <path d="M13.2 2.5L5 13.4h6.2L10.4 21.5 19 10.4h-6.2z" />
      </g>
      <!-- dEnergy: счётчик электроэнергии -->
      <g id="si-energy">
        <rect x="4" y="3.5" width="16" height="17" rx="3" />
        <path d="M12.9 7.4l-3.6 5h2.9l-.7 4.2 3.6-5h-2.9z" />
      </g>
      <!-- dMove: движение (человек + волны) -->
      <g id="si-motion">
        <circle cx="12" cy="5.6" r="2" />
        <path d="M12 8.8v5.4l-2.8 6M12 14.2l2.8 6M8.4 11.4l3.6-1.8 3.6 1.8" />
        <path d="M4.8 8.6a5.2 5.2 0 0 0 0 6.2M19.2 8.6a5.2 5.2 0 0 1 0 6.2" />
      </g>
      <!-- dFire: пламя -->
      <g id="si-flame">
        <path d="M12 21.5a6.6 6.6 0 0 0 6.6-6.6c0-3.6-2.3-5.4-3.8-8-.9 1.5-1.8 2.2-3 2.6.3-2.6-.8-5-2.7-7C9.4 6.4 5.4 8.4 5.4 14.9A6.6 6.6 0 0 0 12 21.5z" />
        <path class="si-accent" d="M12 21.5a2.9 2.9 0 0 1-2.9-2.9c0-1.9 1.5-2.8 2.9-4.8 1.4 2 2.9 2.9 2.9 4.8a2.9 2.9 0 0 1-2.9 2.9z" />
      </g>
      <!-- dLeak: капля + волны -->
      <g id="si-leak">
        <path d="M12 2.6s4.6 4.5 4.6 7.9a4.6 4.6 0 0 1-9.2 0C7.4 7.1 12 2.6 12 2.6z" />
        <path d="M3.5 17.2c1.4-1 2.7-1 4.1 0s2.7 1 4.1 0 2.7-1 4.1 0 2.7 1 4.1 0" />
        <path d="M3.5 21c1.4-1 2.7-1 4.1 0s2.7 1 4.1 0 2.7-1 4.1 0 2.7 1 4.1 0" />
      </g>
      <!-- dFrequency: синусоида -->
      <g id="si-wave">
        <path d="M2.5 12q2.4-8.5 4.8 0t4.8 0 4.8 0 4.8 0" />
      </g>
      <!-- dVoltage: вольтметр (V) -->
      <g id="si-voltage">
        <circle cx="12" cy="12" r="9.2" />
        <path d="M8 8.2l4 8 4-8" />
      </g>
      <!-- dCurrent / dСurrent: амперметр (A) -->
      <g id="si-current">
        <circle cx="12" cy="12" r="9.2" />
        <path d="M8 16.6l4-9.2 4 9.2M9.6 13.6h4.8" />
      </g>
      <!-- dBat: батарея -->
      <g id="si-battery">
        <rect x="2.5" y="6.8" width="17" height="10.4" rx="2.2" />
        <path d="M22 10.4v3.2M6.2 10.2v3.6M9.8 10.2v3.6M13.4 10.2v3.6" />
      </g>
      <!-- dStatus: пульс / состояние -->
      <g id="si-pulse">
        <path d="M2.5 12h4.2l2.5-6.5 5 13 2.5-6.5h4.8" />
      </g>
      <!-- dMode: режимы (ползунки) -->
      <g id="si-sliders">
        <path d="M3 7h9M16 7h5M3 17h3M10 17h11" />
        <circle cx="14" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </g>
      <!-- dConnect: связь -->
      <g id="si-wifi">
        <path d="M2 9.2a14.5 14.5 0 0 1 20 0M5.2 12.6a10 10 0 0 1 13.6 0M8.6 15.9a5.2 5.2 0 0 1 6.8 0" />
        <circle cx="12" cy="19.2" r=".6" />
      </g>
      <!-- dErrStat: предупреждение -->
      <g id="si-warning">
        <path d="M10.3 4.1L2.3 18a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-13.9a2 2 0 0 0-3.4 0z" />
        <path class="si-accent" d="M12 9.6v4.6M12 17.5h.01" />
      </g>
      <!-- dErrCode: код ошибки (восьмиугольник + #) -->
      <g id="si-error-code">
        <path d="M8.2 2.8h7.6l5.4 5.4v7.6l-5.4 5.4H8.2l-5.4-5.4V8.2z" />
        <path d="M10.2 8l-.8 8M14.6 8l-.8 8M8 10.4h8M7.6 13.6h8" />
      </g>

      <!-- ───────── АКТУАТОРЫ ───────── -->
      <!-- aLamp: лампа -->
      <g id="si-bulb">
        <path d="M12 2.8a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.2 1.1 2h5c0-.8.5-1.5 1.1-2A6 6 0 0 0 12 2.8z" />
        <path d="M9.5 18.8h5M10.5 21.5h3" />
      </g>
      <!-- aFan: вентилятор (три лопасти) -->
      <g id="si-fan">
        <circle cx="12" cy="12" r="1.6" />
        <ellipse cx="12" cy="6.2" rx="2.4" ry="4.2" transform="rotate(28 12 6.2)" />
        <ellipse cx="12" cy="6.2" rx="2.4" ry="4.2" transform="rotate(120 12 12) rotate(28 12 6.2)" />
        <ellipse cx="12" cy="6.2" rx="2.4" ry="4.2" transform="rotate(240 12 12) rotate(28 12 6.2)" />
      </g>
      <!-- aPump: насос -->
      <g id="si-pump">
        <circle cx="10" cy="13.5" r="6" />
        <path d="M8.4 11l4.4 2.5-4.4 2.5z" />
        <path d="M1.5 13.5H4M10 7.5V4.5h11.5M7 20.5l-1 1.5h8l-1-1.5" />
      </g>
      <!-- aValve: клапан -->
      <g id="si-valve">
        <path d="M5 8.5l7 4-7 4zM19 8.5l-7 4 7 4z" />
        <path d="M12 12.5V6.5M8.5 6.5h7M1.5 12.5H5M19 12.5h3.5" />
      </g>
      <!-- aRelay: реле -->
      <g id="si-relay">
        <rect x="5.5" y="3" width="13" height="5.5" rx="1.2" />
        <path d="M9 5.8h6M2 17h5.2M16.8 17H22M8.2 16.2l7-5.2" />
        <circle cx="8" cy="17" r="1" />
        <circle cx="16" cy="17" r="1" />
      </g>
      <!-- aActuator: линейный привод -->
      <g id="si-actuator">
        <rect x="2.5" y="8.6" width="10.5" height="6.8" rx="1.2" />
        <path d="M13 12h7.5M20.5 8.8v6.4M2.5 12H1M5.5 15.4v2.6M10 15.4v2.6" />
      </g>
      <!-- aSwitch: переключатель -->
      <g id="si-toggle">
        <rect x="2" y="7" width="20" height="10" rx="5" />
        <circle cx="16" cy="12" r="2.6" />
      </g>
      <!-- aController: контроллер (микросхема) -->
      <g id="si-chip">
        <rect x="6.5" y="6.5" width="11" height="11" rx="1.6" />
        <rect x="10" y="10" width="4" height="4" rx=".6" />
        <path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3" />
      </g>

      <!-- ───────── УСТАВКИ: базовая иконка (мельче) + «мишень» ───────── -->
      <g id="si-target-badge" class="si-accent" stroke-width="1.4">
        <circle cx="17.7" cy="17.7" r="4.3" />
        <path d="M17.7 17.7h.01" />
      </g>
      <!-- sTemp -->
      <g id="si-thermometer-sp">
        <use href="#si-thermometer" transform="translate(-.5 -.5) scale(.76)" />
        <use href="#si-target-badge" />
      </g>
      <!-- sHum -->
      <g id="si-humidity-sp">
        <use href="#si-humidity" transform="translate(-.5 -.5) scale(.76)" />
        <use href="#si-target-badge" />
      </g>
      <!-- sActuator -->
      <g id="si-actuator-sp">
        <use href="#si-actuator" transform="translate(-.2 -2.2) scale(.78)" />
        <use href="#si-target-badge" />
      </g>
      <!-- sSwitch -->
      <g id="si-toggle-sp">
        <use href="#si-toggle" transform="translate(-.2 -2.4) scale(.78)" />
        <use href="#si-target-badge" />
      </g>
      <!-- dCurSetpoint: уставка устройства (прицел) -->
      <g id="si-target">
        <circle cx="12" cy="12" r="7.8" />
        <circle cx="12" cy="12" r="3.4" />
        <path d="M12 1.8v3M12 19.2v3M1.8 12h3M19.2 12h3" />
      </g>

      <!-- ───────── ВЕНТИЛЯТОР: скорость / режим ───────── -->
      <!-- dFanSp: вентилятор + шкала скорости -->
      <g id="si-fan-speed">
        <use href="#si-fan" transform="translate(-.5 -.5) scale(.76)" />
        <path class="si-accent" d="M15 21.5v-2.2M18 21.5v-5M21 21.5v-8" />
      </g>
      <!-- dFanMode: вентилятор + «A» (авто) -->
      <g id="si-fan-mode">
        <use href="#si-fan" transform="translate(-.5 -.5) scale(.76)" />
        <path class="si-accent" d="M14.6 22l3-8 3 8M15.8 19.2h3.6" />
      </g>

      <!-- Запасная иконка для неизвестных ключей -->
      <g id="si-unknown">
        <circle cx="12" cy="12" r="9.2" />
        <path d="M9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1.1 1-1.1 1.8M12 17h.01" />
      </g>
    </defs>
  </svg>
</template>

<script>
export default {
  name: 'SensorIconSprite',
};
</script>
