<!-- src/components/Profile.vue -->
<template>
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
  