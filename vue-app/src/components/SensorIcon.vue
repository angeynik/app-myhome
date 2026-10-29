<!-- components/SensorIcon.vue -->
<!-- Иконка датчика/актуатора/уставки из спрайта SensorIconSprite (он должен быть смонтирован в App.vue).

     <SensorIcon name="dTemp02" />                            — по ключу конфигурации
     <SensorIcon name="aFan" color="var(--green)" />          — произвольный цвет
     <SensorIcon name="dFire" :state="isAlarm ? 'alarm' : 'ok'" />   — цвет по состоянию
     <SensorIcon name="sTemp" color="#fff" accent="#F8B01E" :size="32" title="Уставка" />

     Цвет: prop `color` → inline color (самый приоритетный); иначе класс состояния; иначе наследуется (currentColor).
     Акцентные детали (мишень у уставок, пламя, «!», шкала вентилятора) красятся через `accent`
     (по умолчанию --orange; accent="currentColor" делает иконку одноцветной). -->
<template>
  <svg
    class="sensor-svg"
    :class="state ? `sensor-svg--${state}` : null"
    :style="iconStyle"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    focusable="false"
    :role="title ? 'img' : null"
    :aria-label="title || null"
    :aria-hidden="title ? null : 'true'"
  >
    <title v-if="title">{{ title }}</title>
    <use :href="`#si-${iconName}`" />
  </svg>
</template>

<script>
import { resolveSensorIcon } from '@/utils/sensorIcons';

export default {
  name: 'SensorIcon',

  props: {
    // Ключ конфигурации ('dTemp02', 'aFan01', 'dСurrent') или имя иконки ('fan', 'wifi')
    name: { type: String, default: '' },
    // Любой CSS-цвет: '#F97B00', 'var(--green)', 'currentColor'
    color: { type: String, default: '' },
    // Цвет акцентных деталей
    accent: { type: String, default: '' },
    // Размер: число (px) или строка с единицами ('1.5em')
    size: { type: [Number, String], default: 24 },
    // Цвет по состоянию (классы в mainStyle.css): ok | warn | alarm | off
    state: {
      type: String,
      default: '',
      validator: (value) => ['', 'ok', 'warn', 'alarm', 'off'].includes(value),
    },
    // Подпись для скринридеров; без неё иконка считается декоративной
    title: { type: String, default: '' },
  },

  computed: {
    iconName() {
      return resolveSensorIcon(this.name);
    },
    iconStyle() {
      const style = {};
      if (this.color) style.color = this.color;
      if (this.accent) style['--icon-accent'] = this.accent;
      return style;
    },
  },
};
</script>
