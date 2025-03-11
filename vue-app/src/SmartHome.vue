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
      <h1>Smart Home</h1>
      <p>Welcome to the Smart Home page!</p>
    </div>
  </template>

  <script>
  import { mapGetters } from 'vuex'; 
  export default {
    name: 'SmartHome',
    computed: {
    ...mapGetters(['level']), // Получаем уровень доступа из Vuex
    userLevel() {
      console.log('Уровень доступа пользователя:', this.level);
      return this.level || 0; // Если уровень не задан, считаем его равным 0
    },
  },
  };
  </script>
  
  <style scoped>
  /* Стили для SmartHome */
  </style>