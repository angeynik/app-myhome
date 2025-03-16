<template>
  <div class="header-bottom">
    <nav>
      <router-link to="/login">Login</router-link> |
      <router-link to="/dashboard">Dashboard</router-link> |
      <router-link to="/smart-home">Smart Home</router-link> |
      <router-link to="/manufact-automatation">Automation</router-link> |
      <!-- Profile (доступна для level 2 и 3) -->
      <router-link v-if="userLevel >= 2" to="/profile">Profile</router-link>
      <!-- Users (доступна для level 3) -->
      <router-link v-if="userLevel >= 3" to="/users">Users</router-link>
    </nav>
  
  <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>
  <div style="padding: 0 10px 0 10px;">
    <h1>Авторизация</h1>
    <form @submit.prevent="login">
      <input ref="usernameInput" type="text" placeholder="Имя пользователя" required autocomplete="username" />
      <input ref="passwordInput" type="password" placeholder="Пароль" required autocomplete="current-password" />
      <button type="submit">Вход</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'AppLogin',
  setup() {
    const store = useStore();
    const router = useRouter();

    // Реактивные ссылки для полей ввода
    const usernameInput = ref(null);
    const passwordInput = ref(null);
    const error = ref('');

    // Получаем уровень доступа пользователя из Vuex
    const userLevel = computed(() => {
      const level = store.getters.level;
      console.log('Уровень доступа пользователя:', level);
      return level || 0; // Если уровень не задан, считаем его равным 0
    });

    // Метод для авторизации
    const login = async () => {
      try {
        console.log('Введенное имя пользователя:', usernameInput.value.value);
        const username = await store.dispatch('toLowerCase', usernameInput.value.value);
        const password = passwordInput.value.value;
        console.log('Преобразованное имя пользователя:', username, 'и пароль:', password);

        if (!username || !password) {
          error.value = 'Имя пользователя и пароль обязательны';
          return;
        }

        const user = { username, password };
        await store.dispatch('login', user); // Авторизация через WebSocket

        // Удаляем redirectPath из localStorage после успешного входа
        localStorage.removeItem('redirectPath');

        // Перенаправляем на защищенный маршрут
        const redirectPath = localStorage.getItem('redirectPath') || '/';
        router.push(redirectPath);
      } catch (err) {
        error.value = 'Неверное имя пользователя или пароль';
      }
    };

    // При монтировании компонента фокусируемся на поле ввода имени пользователя
    onMounted(() => {
      if (usernameInput.value) {
        usernameInput.value.focus();
      }
    });

    return {
      usernameInput,
      passwordInput,
      error,
      userLevel,
      login,
    };
  },
};
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}
</style>