<template>
  <div>
    <div class="header-bottom">
      <nav>
        <router-link to="/login">Login</router-link> |
        <router-link to="/dashboard">Dashboard</router-link> |
        <router-link to="/smart-home">Smart Home</router-link> |
        <router-link to="/manufact-automatation">Automation</router-link> |
        <router-link v-if="userLevel >= 2" to="/profile">Profile</router-link>
        <router-link v-if="userLevel >= 3" to="/users">Users</router-link>
      </nav>
    </div>
    <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>
    <div style="padding: 0 10px 0 10px;">
      <h1>Авторизация</h1>
      <form @submit.prevent="login">
        <input ref="usernameInput" 
               type="text" 
               placeholder="Имя пользователя" 
               required 
               autocomplete="username" />
        <input ref="passwordInput" 
               type="password" 
               placeholder="Пароль" 
               required 
               autocomplete="current-password" />
        <button type="submit">Вход</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <!-- Компонент всплывающих сообщений -->
    <PopupMenu 
      :visible="showPopup" 
      :message="popupMessage"
      :type="popupType"
      @close="closePopup"
    />
  </div>
</template>

<script>
import PopupMenu from './PopupMenu.vue';

export default {
  name: 'AppLogin',
  components: {
    PopupMenu
  },
  data() {
    return {
      error: '',
      loading: false,
      // Данные для всплывающих сообщений
      showPopup: false,
      popupMessage: '',
      popupType: 'info', // 'success', 'error', 'warning', 'info'
      popupTimeout: null,
      autoCloseDelay: 6000 // 6 секунд
    };
  },
  computed: {
    userLevel() {
      return this.$store.getters.level;
    },
    dID() {
      return this.$store.getters.dID;
    },
    isConnected() {
      // Используем правильный геттер для проверки подключения WebSocket
      return this.$store.getters['websocket/isConnected'];
    }
  },
  mounted() {
    this.$refs.usernameInput?.focus();
  },
  beforeUnmount() {
    // Очищаем таймер при размонтировании компонента
    if (this.popupTimeout) {
      clearTimeout(this.popupTimeout);
    }
  },
  methods: {
    async login() {
      this.error = '';
      this.loading = true;
      
      try {
        const username = this.$refs.usernameInput.value.toLowerCase();
        const password = this.$refs.passwordInput.value;

        if (!username || !password) {
          throw new Error('Имя пользователя и пароль обязательны');
        }

        console.log('Попытка входа для пользователя:', username);
        
        // Проверяем состояние WebSocket через вычисляемое свойство
        console.log('WebSocket connected:', this.isConnected);
        
        if (!this.isConnected) {
          this.showPopupMessage('Нет подключения к серверу', 'error');
          throw new Error('WebSocket не подключен');
        }

        const userData = await this.$store.dispatch('auth/login', { 
          username, 
          password 
        });

        console.log('Текущий уровень после логина:', this.userLevel);
        console.log('Текущий dID после логина:', this.dID);

        if (userData) {
          // Показываем сообщение об успехе
          this.showPopupMessage(`✅ Вход для пользователя ${username} прошел успешно! Уровень доступа: ${this.userLevel}`, 'success');
          
          // Добавляем проверку конфигурации
          try {
            await this.$store.dispatch('config/ensureConfig', this.dID);
          } catch (err) {
            console.error('Ошибка при загрузке конфигурации:', err);
            this.showPopupMessage('⚠️ Конфигурация не загружена! Некоторые функции могут работать некорректно', 'warning');
          }

          // Ждем немного перед переходом, чтобы пользователь увидел сообщение
          setTimeout(() => {
            const redirectPath = localStorage.getItem('redirectPath') || '/';
            localStorage.removeItem('redirectPath');
            this.$router.push(redirectPath);
          }, 1500);
          
        } else {
          console.log('❌ Проблемы авторизации в AppLogin.vue');
          this.showPopupMessage('❌ Ошибка авторизации пользователя!', 'error');
        }
      } catch (err) {
        this.error = err.message || 'Ошибка авторизации';
        
        // Определяем тип сообщения в зависимости от ошибки
        let messageType = 'error';
        let message = err.message || 'Ошибка авторизации';
        
        if (err.message.includes('WebSocket') || err.message.includes('подключен')) {
          messageType = 'warning';
          message = 'Нет подключения к серверу. Проверьте соединение.';
        } else if (err.message.includes('USER_NOT_FOUND') || err.message.includes('INVALID_PASSWORD')) {
          message = 'Неверное имя пользователя или пароль';
        }
        
        this.showPopupMessage(`❌ ${message}`, messageType);
        console.error('Ошибка входа:', err);
      } finally {
        this.loading = false;
      }
    },

    // Метод для показа всплывающих сообщений
    showPopupMessage(message, type = 'info') {
      this.popupMessage = message;
      this.popupType = type;
      this.showPopup = true;
      
      // Автоматическое закрытие через указанное время
      if (this.popupTimeout) {
        clearTimeout(this.popupTimeout);
      }
      
      this.popupTimeout = setTimeout(() => {
        this.closePopup();
      }, this.autoCloseDelay);
    },

    // Метод для закрытия popup
    closePopup() {
      this.showPopup = false;
      if (this.popupTimeout) {
        clearTimeout(this.popupTimeout);
        this.popupTimeout = null;
      }
    }
  }
};
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}
</style>