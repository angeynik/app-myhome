<template>
  <div class="popup-overlay" v-show="visible" @click.self="closePopup">
    <div class="popup-content" :class="popupTypeClass">
      <div class="popup-header">
        <span class="popup-title">{{ typeTitle }}</span>
        <button class="popup-close" @click="closePopup">×</button>
      </div>
      <div class="popup-message">
        {{ message }}
      </div>
      <div class="popup-footer">
        <button class="popup-ok-button" @click="closePopup">OK</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
    },
    duration: {
      type: Number,
      default: 3000 // мс, 0 - не закрывать автоматически
    }
  },
  emits: ['close', 'auto-close'],
  computed: {
    typeTitle() {
      const titles = {
        success: 'Успех',
        error: 'Ошибка',
        warning: 'Предупреждение',
        info: 'Информация'
      };
      return titles[this.type] || 'Информация';
    },
    popupTypeClass() {
      return `popup-${this.type}`;
    }
  },
  watch: {
    visible(newVal) {
      if (newVal && this.duration > 0) {
        this.autoCloseTimer = setTimeout(() => {
          this.$emit('auto-close');
          this.closePopup();
        }, this.duration);
      } else if (!newVal && this.autoCloseTimer) {
        clearTimeout(this.autoCloseTimer);
        this.autoCloseTimer = null;
      }
    }
  },
  beforeUnmount() {
    if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
  },
  data() {
    return {
      autoCloseTimer: null
    };
  },
  methods: {
    closePopup() {
      if (this.autoCloseTimer) {
        clearTimeout(this.autoCloseTimer);
        this.autoCloseTimer = null;
      }
      this.$emit('close');
    }
  }
};
</script>
 
 <style lang="css" src="@/assets/mainStyle.css"></style>
 