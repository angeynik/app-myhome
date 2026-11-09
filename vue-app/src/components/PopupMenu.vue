<!-- components/PopupMenu.vue -->
<!-- Автозакрытие по таймеру выполняет store/modules/popup.js -->
<template>
  <div class="popup-overlay" v-show="visiblePopup" @click.self="closePopup">
    <div class="popup-content" :class="`popup-${type}`" role="alertdialog" aria-live="assertive">
      <div class="popup-header">
        <span class="popup-title">{{ typeTitle }}</span>
        <button class="popup-close" aria-label="Закрыть" @click="closePopup">×</button>
      </div>
      <div class="popup-message">{{ message }}</div>
      <div class="popup-footer">
        <button class="popup-ok-button" @click="closePopup">OK</button>
      </div>
    </div>
  </div>
</template>

<script>
const TITLES = {
  success: 'Успех',
  error: 'Ошибка',
  warning: 'Предупреждение',
  info: 'Информация',
};

export default {
  name: 'PopupMenu',
  props: {
    visiblePopup: { type: Boolean, default: false },
    message: { type: String, default: '' },
    type: {
      type: String,
      default: 'info',
      validator: (value) => Object.keys(TITLES).includes(value),
    },
  },
  emits: ['close'],
  computed: {
    typeTitle() {
      return TITLES[this.type] || TITLES.info;
    },
  },
  methods: {
    closePopup() {
      this.$emit('close');
    },
  },
};
</script>
