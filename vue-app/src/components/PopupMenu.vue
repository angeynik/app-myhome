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
      visible: Boolean,
      message: String,
      type: {
        type: String,
        default: 'info',
        validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
      }
    },
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
    methods: {
      closePopup() {
        this.$emit('close');
      }
    }
  };
  </script>
 
 <style lang="css" src="@/assets/mainStyle.css"></style>
  <!-- <style scoped>
  .popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .popup-content {
    background: var(--header_color);
    padding: 0;
    border-radius: 16px;
    box-shadow: 0 8px 6px rgba(0, 0, 0, 0.15);
    min-width: 300px;
    max-width: 400px;
    border: 1px solid var(--light_font);
    color: var(--light_font);
  }

  .popup-success {
    border-top: 4px solid var(--green);
  }

  .popup-error {
    border-top: 4px solid var(--red);
  }

  .popup-warning {
    border-top: 4px solid var(--yellow);
  }

  .popup-info {
    border-top: 4px solid var(--violet);
  }
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--light_font);
  }
  
  .popup-title {
    font-weight: bold;
    font-size: 1.2rem;
    color: var(--light_font);
  }
  
  .popup-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--light_font);
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .popup-close:hover {
    color: var(--orange);
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
  
  .popup-message {
    padding: 30px 20px;
    white-space: pre-line;
    font-size: 1rem;
    line-height: 1.5;
    text-align: center;
  }
  
  .popup-footer {
    padding: 20px;
    text-align: center;
    border-top: 1px solid var(--light_font);
  }
  
  .popup-ok-button {
    background: var(--violet);
    color: var(--light_font);
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;
    transition: background-color 0.5s ease;
    min-width: 100px;
  }
  
  .popup-ok-button:hover {
    background: var(--orange);
  }

  .popup-ok-button:active {
    background: var(--yellow);
  }
  </style> -->