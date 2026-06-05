<!-- App.vue -->
<template>
  <div id="app">
    <router-view />
    <PopupMenu
      :visible="popup.visible"
      :message="popup.message"
      :type="popup.type"
      :duration="popup.duration"
      @close="closePopup"
      @auto-close="closePopup"
    />
    <MenuDropdown
      :visible="dropdownVisible"
      :items="dropdownItems"
      :anchor-element="anchorElement"
      @close="closeDropdown"
      @select="onDropdownSelect"
    />
  </div>
</template>

<script>
import logger from './store/modules/logger.js';
import { mapState, mapMutations, mapActions } from 'vuex';
import PopupMenu from '@/components/PopupMenu.vue';
import MenuDropdown from '@/components/MenuDropdown.vue';

export default {
  name: 'App',
  data() {
    return {
      msg: 'Welcome to Your SmartHome App',
      host: process.env.VUE_APP_HOST,
      port: 9202,
      serverPort: process.env.VUE_APP_SERVER_PORT,
    };
  },
 components: { PopupMenu, MenuDropdown },
  computed: {
    ...mapState('popup', ['visible', 'message', 'type', 'duration']),
    popup() {
      return this;
    },
    ...mapState('dropdown', ['visible', 'items', 'anchorElement']),
    dropdownVisible() {
      console.log('[App] dropdownVisible computed, visible =', this.visible);
      return this.visible;
    },
    dropdownItems() {
      console.log('[App] dropdownItems computed, items =', this.items);
      return this.items;
    },
  },
  // watch: {
  //   'dropdownVisible'(newVal) {
  //     console.log('[App] watch dropdownVisible changed to', newVal);
  //   },
  async mounted() {
    try {
      // 1. Восстанавливаем сессию из localStorage
      await this.$store.dispatch('initializeStore');
      
      // 2. Устанавливаем WebSocket соединение
      await this.$store.dispatch('websocket/connect');
     
      // // 3. Если пользователь был восстановлен из localStorage, автоматически отправляем логин/пароль
      // if (this.$store.state.auth.user && this.$store.state.auth.user.username) {
      //   const { username, password } = this.$store.state.auth.user;
      //   console.log('Автоматическая отправка учетных данных из localStorage для пользователя:', username, password);
        
      //   // Используем существующий метод login из auth модуля
      //   await this.$store.dispatch('auth/login', { username, password });
      // }

      // 3. Если пользователь был восстановлен из localStorage, автоматически отправляем логин/пароль
      const user = this.$store.state.auth.user;
      if (user && user.username && user.password) {
        logger.info('[APP] - mounted - Автоматическая отправка учетных данных из localStorage для пользователя:', user.username);
        //console.log('Автоматическая отправка учетных данных из localStorage для пользователя:', user.username);
        
        // Используем существующий метод login из auth модуля
        await this.$store.dispatch('auth/login', { 
          username: user.username, 
          password: user.password 
        });
      } else {
        logger.error('[APP] - mounted - Недостаточно данных для автоматического входа:', user);
        //console.log('Недостаточно данных для автоматического входа:', user);
      }

      // 4. После успешного подключения загружаем конфигурацию
      if (this.$store.getters.isAuthenticated) {
        await this.$store.dispatch('config/initialize');
      }
      if (this.$route.path === '/dashboard') {
        this.$router.push({ name: 'DashboardMain' });
      }
    } catch (error) {
      logger.error('[APP] - mounted - Ошибка инициализации приложения:', error);
      //console.error('Ошибка инициализации приложения:', error);
    }
  },
  
  // methods: {
  //   async sendLogToServer(type, message) {
  //     await this.$store.dispatch('sendLogToServer', { type, message });
  //   },
  //   ...mapMutations('popup', ['HIDE']),
  //   closePopup() {
  //     this.HIDE();
  //   },
  // ...mapActions('dropdown', ['hide']),
  //   closeDropdown() {
  //     this.hide();
  //   },
  //   onDropdownSelect(item) {
  //     // Обработка выбора пункта меню
  //     console.log('[App] Выбран пункт:', item);
  //     if (item.action === 'profile') {
  //       this.$router.push('/profile');
  //     } else if (item.action === 'logout') {
  //       this.$store.dispatch('auth/logout');
  //       this.$router.push('/login');
  //     } else if (item.action === 'settings') {
  //       this.$router.push({ name: 'DashboardSettings', params: { settingsType: 'general' } });
  //     }
  //     this.hide(); // закрываем после выбора
  //   }
  // },
  methods: {
    async sendLogToServer(type, message) {
      await this.$store.dispatch('sendLogToServer', { type, message });
    },
    ...mapMutations('popup', ['HIDE']),
    closePopup() {
      this.HIDE();
    },
    ...mapActions('dropdown', ['hide']),
    closeDropdown() {
      this.hide();
    },
    onDropdownSelect(item) {
      console.log('[App] Выбран пункт:', item);
      if (item.action === 'profile') {
        this.$router.push('/profile');
      } else if (item.action === 'logout') {
        this.$store.dispatch('auth/logout');
        this.$router.push('/login');
      } else if (item.action === 'settings') {
        this.$router.push({ name: 'DashboardSettings', params: { settingsType: 'general' } });
      }
      this.hide();
    }
  },
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>