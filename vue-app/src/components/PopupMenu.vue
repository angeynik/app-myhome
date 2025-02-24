<template>
    <div class="popup-overlay" v-show="visible" @click.self="closePopup">
      <div class="popup-content">
        <div v-if="!isLoginVisible">
          <div @click="showLoginForm">Авторизация</div>
          <div @click="logout">Выход</div>
        </div>
        <div v-else>
          <form @submit.prevent="login">
            <div>
              <label for="username">Username:</label>
              <input v-model="username" id="username" type="text" required />
            </div>
            <div>
              <label for="password">Password:</label>
              <input v-model="password" id="password" type="password" required />
            </div>
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import store from '../store';
  
  export default {
    props: ['visible'],
    data() {
      return {
        isLoginVisible: false,
        username: '',
        password: '',
      };
    },
    methods: {
      closePopup() {
        this.$emit('close');
      },
      showLoginForm() {
        this.isLoginVisible = true;
      },
      async login() {
        try {
          // Здесь выполните авторизацию пользователя (например, отправку запроса на сервер)
          store.login({ username: this.username });
          this.closePopup();
        } catch (error) {
          console.error('Login failed:', error);
        }
      },
      logout() {
        store.logout();
        this.closePopup();
      },
    },
  };
  </script>
  
  <style>
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
  }
  
  .popup-content {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  </style>
  