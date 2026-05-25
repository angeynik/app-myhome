<!-- components/InputDialog.vue -->
<template>
  <div class="popup-overlay" v-if="visible" @click.self="onCancel">
    <div class="popup-content">
      <div class="popup-header">
        <span class="popup-title">{{ title }}</span>
        <button class="popup-close" @click="onCancel">×</button>
      </div>
      <div class="popup-message">
        <input
          ref="inputField"
          :type="inputType"
          :value="inputValue"
          @input="updateValue"
          @keyup.enter="onConfirm"
          class="input-dialog-field"
          :step="step"
          :placeholder="placeholder"
        />
      </div>
      <div class="popup-footer">
        <button class="popup-ok-button" @click="onConfirm">OK</button>
        <button class="popup-cancel-button" @click="onCancel">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InputDialog',
  props: {
    visible: Boolean,
    title: String,
    initialValue: [String, Number],
    type: {
      type: String,
      default: 'number',
    },
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      inputValue: this.initialValue,
    };
  },
  computed: {
    inputType() {
      return this.type === 'number' ? 'number' : 'text';
    },
    step() {
      return this.type === 'number' ? '0.1' : undefined;
    },
    placeholder() {
      return this.type === 'time' ? 'ЧЧ:ММ' : '';
    },
  },
  watch: {
    initialValue(val) {
      this.inputValue = val;
    },
    visible(vis) {
      if (vis) {
        this.$nextTick(() => {
          if (this.$refs.inputField) this.$refs.inputField.focus();
        });
      } else {
        this.inputValue = this.initialValue;
      }
    },
  },
  methods: {
    updateValue(e) {
      this.inputValue = e.target.value;
    },
    onConfirm() {
      let value = this.inputValue;
      if (this.type === 'number') {
        const num = parseFloat(value);
        if (isNaN(num)) {
          alert('Введите корректное число');
          return;
        }
        value = num;
      } else if (this.type === 'time') {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(value)) {
          alert('Введите время в формате ЧЧ:ММ (00:00 – 23:59)');
          return;
        }
      }
      this.$emit('confirm', value);
    },
    onCancel() {
      this.$emit('cancel');
    },
  },
};
</script>

<style scoped>
.input-dialog-field {
  width: 80%;
  padding: 12px;
  font-size: 1.2rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  text-align: center;
  background: #1e1e31;
  color: #e0dfe7;
}
.popup-cancel-button {
  background: #4d576c;
  color: #e0dfe7;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  margin-left: 12px;
}
.popup-cancel-button:hover {
  background: #ff4747;
}
</style>