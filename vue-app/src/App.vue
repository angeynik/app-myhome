<!-- App.vue -->
<template>
  <div id="app">
    <router-view />

    <!-- Popup: управляется через геттер popup/popupState -->
    <PopupMenu
      :visiblePopup="popupIsVisible"
      :message="popupMessage"
      :type="popupType"
      :duration="popupDuration"
      @close="onPopupClose"
      @auto-close="onPopupClose"
    />

    <!-- Dropdown: управляется через геттеры dropdown/*, рендерится поверх всего через Teleport внутри компонента -->
    <MenuDropdown
      v-if="$route.meta.requiresAuth !== false"
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

  data() {
    return {
      msg: 'Welcome to Your SmartHome App',
      host: process.env.VUE_APP_HOST,
      port: 9202,
      serverPort: process.env.VUE_APP_SERVER_PORT,
    };
  },

  computed: {
    // Все геттеры с уникальными префиксами — конфликты между модулями исключены.
    ...mapGetters({
      // ── popup/  ──────────────────────────────────────────────────
      popupIsVisible:     'popup/popupIsVisible',   // Boolean
      popupMessage:       'popup/popupMessage',     // String
      popupType:          'popup/popupType',        // String
      popupDuration:      'popup/popupDuration',    // Number
      // ── dropdown/ ───────────────────────────────────────────────
      dropdownIsVisible:  'dropdown/isVisible',     // Boolean
      dropdownMenuItems:  'dropdown/menuItems',     // Array
      dropdownAnchorEl:   'dropdown/anchorEl',      // HTMLElement | null
    }),
  },

  async mounted() {
    try {
      // 1. Восстанавливаем сессию из localStorage
      await this.$store.dispatch('initializeStore');

      // 2. Устанавливаем WebSocket соединение
      await this.$store.dispatch('websocket/connect');

      // 3. Авто-логин по сохранённым данным
      const user = this.$store.state.auth.user;
      if (user && user.username && user.password) {
        logger.info('[APP] mounted – авто-логин:', user.username);
        await this.$store.dispatch('auth/login', {
          username: user.username,
          password: user.password,
        });
      } else {
        logger.error('[APP] mounted – недостаточно данных для авто-входа:', user);
        if (this.$route.meta.requiresAuth !== false) {
          this.$router.push('/login');
        }
      }

      // 4. После успешной аутентификации загружаем конфигурацию
      if (this.$store.getters.isAuthenticated) {
        await this.$store.dispatch('config/initialize');
      }

      if (this.$route.path === '/dashboard') {
        this.$router.push({ name: 'DashboardMain' });
      }
    } catch (error) {
      logger.error('[APP] mounted – ошибка инициализации:', error);
    }
  },

  methods: {
    // ── popup ────────────────────────────────────────────────────
    // Мутация модуля popup называется HIDE — импортируем с псевдонимом,
    // чтобы не конфликтовать с возможным HIDE из dropdown.
    ...mapMutations({
      hidePopupMutation: 'popup/HIDE',
    }),

    onPopupClose() {
      this.hidePopupMutation();
    },

    // ── dropdown ─────────────────────────────────────────────────
    // Action модуля dropdown называется hide — импортируем с псевдонимом.
    ...mapActions({
      hideDropdownAction: 'dropdown/hide',
    }),

    onDropdownClose() {
      this.hideDropdownAction();
    },

    async onDropdownSelect(item) {
      console.log('[App] Выбран пункт дропдауна:', item);
      this.hideDropdownAction(); // закрываем сразу после выбора

      switch (item.action) {
        case 'profile':
          this.$router.push('/profile');
          break;
        case 'logout':
          await this.$store.dispatch('auth/logout');
          this.$router.push('/login');
          break;
        case 'settings':
          this.$router.push('/users');
          break;
        case 'toggleMobile':
          await this.$store.dispatch('config/toggleMobileMode');
          break;
        default:
          logger.warn('[App] onDropdownSelect – неизвестный action:', item.action);
      }
    },
  },
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>