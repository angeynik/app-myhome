<!-- App.vue -->
<template>
  <div id="app">

    <!-- ── Стартовая страница: выбор раздела (только на маршруте "/") ────── -->
    <div v-if="isHomePage && isAuthenticated" class="introduce-place">
      <button
        v-for="item in visibleNavItems"
        :key="item.name"
        class="introduce-button"
        :class="[item.colorClass || 'color_dark', item.cssClass]"
        @click="navigate(item)"
      >
        <span class="button-text">{{ item.label }}</span>
      </button>
    </div>

    <!-- ── Все остальные страницы ─────────────────────────────────────────── -->
    <router-view v-else />

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

// Полный реестр разделов навигации.
// cssClass — существующий класс из mainStyle.css с фоновым изображением кнопки.
// feature  — имя VUE_APP_FEATURE_* переменной; подставляется webpack при сборке.
const ALL_NAV_ITEMS = [
  {
    name: 'DashBoard',
    label: 'Панель Управления',
    path: '/dashboard',
    cssClass: 'dash',
    colorClass: 'color_dark',
    feature: 'VUE_APP_FEATURE_DASHBOARD',
  },
  {
    name: 'Configuration',
    label: 'Выбор Конфигурации',
    path: '/configuration',
    cssClass: 'home',
    colorClass: 'color-light',
    feature: 'VUE_APP_FEATURE_CONFIGURATION',
  },
  {
    name: 'About',
    label: 'О Продукте',
    path: '/about',
    cssClass: 'manuft',
    colorClass: 'color_dark',
    feature: 'VUE_APP_FEATURE_ABOUT',
  },
];

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
    ...mapGetters({
      // ── auth ──────────────────────────────────────────────────────
      isAuthenticated:    'isAuthenticated',
      // ── popup/ ────────────────────────────────────────────────────
      popupIsVisible:     'popup/popupIsVisible',
      popupMessage:       'popup/popupMessage',
      popupType:          'popup/popupType',
      popupDuration:      'popup/popupDuration',
      // ── dropdown/ ─────────────────────────────────────────────────
      dropdownIsVisible:  'dropdown/isVisible',
      dropdownMenuItems:  'dropdown/menuItems',
      dropdownAnchorEl:   'dropdown/anchorEl',
    }),

    // Показываем стартовую страницу только на маршруте "/"
    isHomePage() {
      return this.$route.name === 'AppHome';
    },

    // Фильтрация пунктов по feature-флагам — вычисляется один раз при сборке
    visibleNavItems() {
      return ALL_NAV_ITEMS.filter(item => {
        return process.env[item.feature] !== 'false';
      });
    },
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

    } catch (error) {
      logger.error('[APP] mounted – ошибка инициализации:', error);
    }
  },

  methods: {
    // ── Навигация со стартовой страницы ───────────────────────────
    navigate(item) {
      logger.info('[App] - navigate - Переход в раздел:', item.name, item.path);
      this.$router.push(item.path);
    },

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
      logger.info('[App] - onDropdownSelect - Выбран пункт дропдауна:', item.action);
      this.hideDropdownAction();

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
          logger.warn('[App] - onDropdownSelect – неизвестный action:', item.action);
      }
    },
  },
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>