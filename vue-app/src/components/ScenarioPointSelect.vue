<!-- components/ScenarioPointSelect.vue -->
<!-- Выбор точки (комната + параметр) для сценария: список по комнатам из конфигурации dID.
     Точка, которой нет в конфигурации (сценарий из файла, удалённое устройство), остаётся в списке
     с пометкой — выбор не теряется. -->
<template>
  <select class="scenario-point" :value="current" :aria-label="label" @change="onChange($event.target.value)">
    <option value="" disabled>{{ placeholder }}</option>
    <option v-if="missing" :value="current">{{ modelValue.room }}/{{ modelValue.item }} — нет в конфигурации</option>
    <optgroup v-for="g in groups" :key="g.room" :label="g.title">
      <option v-for="p in g.points" :key="p.key" :value="p.key">
        {{ p.title }}{{ p.unit ? `, ${p.unit}` : '' }}{{ valueText(p) }}
      </option>
    </optgroup>
  </select>
</template>

<script>
import { refKey } from '@/utils/scenarioModel';

export default {
  name: 'ScenarioPointSelect',
  props: {
    modelValue: { type: Object, default: () => ({ room: '', item: '' }) },
    options: { type: Array, required: true },
    // Фильтр точек: например, только те, в которые можно записать
    filter: { type: Function, default: null },
    label: { type: String, default: 'Параметр' },
    placeholder: { type: String, default: 'Выберите параметр' },
  },
  emits: ['update:modelValue', 'select'],

  computed: {
    current() {
      return refKey(this.modelValue);
    },
    shown() {
      return this.filter ? this.options.filter(this.filter) : this.options;
    },
    missing() {
      return !!this.current && !this.shown.some((p) => p.key === this.current);
    },
    groups() {
      const map = new Map();
      for (const p of this.shown) {
        if (!map.has(p.room)) map.set(p.room, { room: p.room, title: p.roomTitle, points: [] });
        map.get(p.room).points.push(p);
      }
      return [...map.values()];
    },
  },

  methods: {
    valueText(p) {
      if (p.value === null || p.value === undefined || p.value === '') return '';
      if (p.type === 'bool') return p.value === true || p.value === 'ON' ? ' (ВКЛ)' : ' (ВЫКЛ)';
      return ` (${p.value})`;
    },
    onChange(key) {
      const p = this.options.find((x) => x.key === key);
      if (!p) return;
      // Ссылка сохраняет свои дополнительные поля (offset у valueFrom)
      this.$emit('update:modelValue', { ...this.modelValue, room: p.room, item: p.item });
      this.$emit('select', p);
    },
  },
};
</script>
