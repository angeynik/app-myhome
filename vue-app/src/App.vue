<!-- App.vue -->
<template>
  <div id="app">
    <router-view />

    <!-- Popup: состояние и таймер автозакрытия — в store/modules/popup.js -->
    <PopupMenu
      :visiblePopup="popupIsVisible"
      :message="popupMessage"
      :type="popupType"
      @close="hidePopup"
    />

    <!-- Dropdown: рендерится поверх через Teleport -->
    <MenuDropdown
      :visibleDropdown="dropdownIsVisible"
      :items="dropdownMenuItems"
      :anchor-element="dropdownAnchorEl"
      @close="hideDropdown"
      @select="onDropdownSelect"
    />
  </div>
</template>

<script>
import logger from './store/modules/logger.js';
import { mapGetters, mapActions } from 'vuex';
import PopupMenu from '@/components/PopupMenu.vue';
import MenuDropdown from '@/components/MenuDropdown.vue';

export default {
  name: 'App',
  components: { PopupMenu, MenuDropdown },

  computed: {
    ...mapGetters({
      isAuthenticated: 'isAuthenticated',
      popupIsVisible: 'popup/popupIsVisible',
      popupMessage: 'popup/popupMessage',
      popupType: 'popup/popupType',
      dropdownIsVisible: 'dropdown/isVisible',
      dropdownMenuItems: 'dropdown/menuItems',
      dropdownAnchorEl: 'dropdown/anchorEl',
    }),
  },

  watch: {
    // Срабатывает и при старте (сессия восстановлена в main.js), и при входе
    // без перезагрузки страницы. Раньше инициализация была только в mounted(),
    // а менеджер уставок (setpointsManager) не создавался нигде.
    isAuthenticated: {
      immediate: true,
      handler(value) {
        if (value) this.initSession();
      },
    },
  },

  methods: {
    ...mapActions('popup', { hidePopup: 'hide' }),
    ...mapActions('dropdown', { hideDropdown: 'hide' }),

    async initSession() {
      try {
        await this.$store.dispatch('initializeSetpointsManager');
        await this.$store.dispatch('config/initialize');
      } catch (error) {
        logger.error('[App] initSession – ошибка инициализации:', error);
        this.$store.dispatch('popup/show', {
          message: 'Не удалось загрузить конфигурацию. Часть функций недоступна.',
          type: 'warning',
          duration: 5000,
        });
      }
    },

    async onDropdownSelect(item) {
      logger.info('[App] onDropdownSelect:', item.action);
      this.hideDropdown();

      switch (item.action) {
        case 'profile':
          this.$router.push('/profile');
          break;
        case 'logout':
          await this.$store.dispatch('auth/logout');
          this.$router.push('/login');
          break;
        case 'toggleMobile':
          await this.$store.dispatch('config/toggleMobileMode');
          break;
        default:
          logger.warn('[App] неизвестный action меню:', item.action);
      }
    },
  },
};
</script>
