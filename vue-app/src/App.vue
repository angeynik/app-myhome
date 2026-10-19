<!-- App.vue -->
<template>
  <div id="app">
    <router-view />

    <!-- Popup: управляется через popup/* геттеры -->
    <PopupMenu
      :visiblePopup="popupIsVisible"
      :message="popupMessage"
      :type="popupType"
      :duration="popupDuration"
      @close="onPopupClose"
      @auto-close="onPopupClose"
    />

    <!-- Dropdown: управляется через dropdown/* геттеры, рендерится поверх через Teleport -->
    <MenuDropdown
      :visibleDropdown="dropdownIsVisible"
      :items="dropdownMenuItems"
      :anchor-element="dropdownAnchorEl"
      @close="onDropdownClose"
      @select="onDropdownSelect"
    />
  </div>
</template>

<script>
import logger from './store/modules/logger.js';
import { mapGetters, mapMutations, mapActions } from 'vuex';
import PopupMenu from '@/components/PopupMenu.vue';
import MenuDropdown from '@/components/MenuDropdown.vue';

export default {
  name: 'App',
  components: { PopupMenu, MenuDropdown },

  computed: {
    ...mapGetters({
      // ── auth ──────────────────────────────────────────────────────
      isAuthenticated: 'isAuthenticated',
      // ── popup/ ────────────────────────────────────────────────────
      popupIsVisible: 'popup/popupIsVisible',
      popupMessage: 'popup/popupMessage',
      popupType: 'popup/popupType',
      popupDuration: 'popup/popupDuration',
      // ── dropdown/ ─────────────────────────────────────────────────
      dropdownIsVisible: 'dropdown/isVisible',
      dropdownMenuItems: 'dropdown/menuItems',
      dropdownAnchorEl: 'dropdown/anchorEl',
    }),
  },

  async mounted() {
    // WS-соединение и auth/resume уже сделаны в main.js до mount.
    // Здесь догружаем конфигурацию — это нужно при возврате на вкладку,
    // когда JWT ещё валиден, а config в памяти отсутствует.
    if (!this.isAuthenticated) return;

    try {
      await this.$store.dispatch('config/initialize');
    } catch (error) {
      logger.error('[App] mounted – ошибка инициализации config:', error);
    }
  },

  methods: {
    // ── popup ──────────────────────────────────────────────────────
    ...mapMutations({
      hidePopupMutation: 'popup/HIDE',
    }),

    onPopupClose() {
      this.hidePopupMutation();
    },

    // ── dropdown ───────────────────────────────────────────────────
    ...mapActions({
      hideDropdownAction: 'dropdown/hide',
    }),

    onDropdownClose() {
      this.hideDropdownAction();
    },

    async onDropdownSelect(item) {
      logger.info('[App] - onDropdownSelect - action:', item.action);
      this.hideDropdownAction();

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
          logger.warn('[App] - onDropdownSelect – неизвестный action:', item.action);
      }
    },
  },
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>