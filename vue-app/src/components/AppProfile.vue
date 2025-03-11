<!-- src/components/Profile.vue -->
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
        </div>
        <p style="width: 100%; height: 1px; background-color: var(--orange);"> </p>
        <div>
      <h1>Profile</h1>
      <p>Welcome, {{ user.username }}!</p>
      <button @click="logout">Logout</button>
    </div>
  </template>
 
  <script>
  import { mapGetters, mapActions } from 'vuex';
  
  export default {
    computed: {
      ...mapGetters(['user', 'isAuthenticated']),
      ...mapGetters(['level']), // Получаем уровень доступа из Vuex
    userLevel() {
      console.log('Уровень доступа пользователя:', this.level);
      return this.level || 0; // Если уровень не задан, считаем его равным 0
    },
    },
    methods: {
      ...mapActions(['logout']),
      logout() {
        this.logout();
        this.$router.push('/login'); // Перенаправление после выхода
      }
    },
    created() {
      if (!this.isAuthenticated) {
        this.$router.push('/login'); // Перенаправление на страницу входа, если пользователь не авторизован
      }
    }
  };
  </script>
  