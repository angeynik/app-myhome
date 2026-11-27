<!-- components/DurationInput.vue -->
<!-- Длительность в секундах: число + единица (с, мин, ч). Пустое поле — null (значение по умолчанию). -->
<template>
  <span class="duration-input">
    <input
      type="number"
      min="0"
      step="1"
      inputmode="numeric"
      :value="amount"
      :aria-label="label"
      :placeholder="placeholder"
      @input="onAmount($event.target.value)"
    />
    <select :value="unit" aria-label="Единица времени" @change="onUnit($event.target.value)">
      <option v-for="u in units" :key="u.value" :value="u.value">{{ u.label }}</option>
    </select>
  </span>
</template>

<script>
const UNITS = [
  { value: 1, label: 'с' },
  { value: 60, label: 'мин' },
  { value: 3600, label: 'ч' },
];

// Крупнейшая единица, в которой значение целое
const unitFor = (sec) => (sec && sec % 3600 === 0 ? 3600 : sec && sec % 60 === 0 ? 60 : 1);

export default {
  name: 'DurationInput',
  props: {
    modelValue: { type: [Number, String], default: null },
    label: { type: String, default: 'Длительность' },
    placeholder: { type: String, default: '' },
    defaultUnit: { type: Number, default: 1 },
  },
  emits: ['update:modelValue'],

  data() {
    return { unit: this.pickUnit(this.modelValue), units: UNITS };
  },

  computed: {
    amount() {
      const v = this.modelValue;
      if (v === null || v === undefined || v === '') return '';
      return Number(v) / this.unit;
    },
  },

  watch: {
    // Значение сменили снаружи (другой сценарий, шаблон) — единица под него
    modelValue(v) {
      if (v !== null && v !== undefined && v !== '' && Number(v) % this.unit !== 0) this.unit = this.pickUnit(v);
    },
  },

  methods: {
    pickUnit(v) {
      return v === null || v === undefined || v === '' || Number(v) === 0 ? this.defaultUnit : unitFor(Number(v));
    },
    onAmount(raw) {
      if (raw === '') return this.$emit('update:modelValue', null);
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) return undefined;
      return this.$emit('update:modelValue', Math.round(n * this.unit));
    },
    onUnit(raw) {
      const unit = Number(raw);
      const amount = this.amount;
      this.unit = unit;
      if (amount !== '') this.$emit('update:modelValue', Math.round(Number(amount) * unit));
    },
  },
};
</script>
