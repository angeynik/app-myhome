<!-- components/AppSettings.vue -->
<template>
  <div class="app-settings-page">
    <header class="header">
      <div class="header-top">
        <div class="icon" @click="goBack">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </div>
        <div class="header-center">
          <h2>Настройки</h2>
        </div>
        <div class="icon" style="visibility: hidden;"></div> <!-- Заглушка для центрирования -->
      </div>
      <p class="header-divider"></p>
    </header>

    <div class="body">
      <div class="settings-container">
        
        <!-- Блок: Тема оформления -->
        <div class="settings-group">
          <h3 class="settings-group-title">Тема оформления</h3>
          <div class="settings-options">
            <label 
              v-for="(label, key) in themes" 
              :key="key" 
              class="settings-radio-label"
            >
              <input 
                type="radio" 
                name="bgTheme" 
                :value="key" 
                :checked="bgTheme === key"
                @change="updateTheme(key)"
              />
              {{ label }}
            </label>
          </div>
        </div>

        <!-- Блок: Режим устройства -->
        <div class="settings-group">
          <h3 class="settings-group-title">Режим устройства</h3>
          <div class="settings-options">
            <label class="settings-radio-label">
              <input 
                type="radio" 
                name="deviceMode" 
                value="auto" 
                :checked="deviceMode === 'auto'"
                @change="updateDeviceMode('auto')"
              />
              Авто (сейчас: {{ isMobile ? 'Мобильный' : 'Десктоп' }})
            </label>
            <label class="settings-radio-label">
              <input 
                type="radio" 
                name="deviceMode" 
                value="desktop" 
                :checked="deviceMode === 'desktop'"
                @change="updateDeviceMode('desktop')"
              />
              Десктоп
            </label>
            <label class="settings-radio-label">
              <input 
                type="radio" 
                name="deviceMode" 
                value="mobile" 
                :checked="deviceMode === 'mobile'"
                @change="updateDeviceMode('mobile')"
              />
              Мобильный
            </label>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { BG_THEMES } from '@/store/modules/appearance';

export default {
  name: 'AppSettings',

  computed: {
    ...mapGetters('appearance', ['bgTheme']),
    ...mapGetters('config', ['deviceMode', 'isMobile']),

    // Получаем список тем из модуля appearance
    themes() {
      return BG_THEMES;
    },
  },

  methods: {
    ...mapActions('appearance', ['setTheme']),
    ...mapActions('config', ['setDeviceMode']),

    updateTheme(themeKey) {
      this.setTheme(themeKey);
    },

    updateDeviceMode(mode) {
      this.setDeviceMode(mode);
    },

    goBack() {
      this.$router.push('/');
    },
  },
};
</script>