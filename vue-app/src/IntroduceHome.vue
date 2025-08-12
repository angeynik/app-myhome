<template>
  <div >
    <nav class="header-bottom">
      <router-link to="/login">Login</router-link> |
      <router-link to="/dashboard">Dashboard</router-link> |
      <router-link to="/smart-home">Smart Home</router-link> |
      <router-link to="/manufact-automatation">Automation</router-link> |
          <!-- Profile (доступна для level 2 и 3) -->
      <router-link v-if="userLevel >= 2" to="/profile">Profile</router-link>
          <!-- Users (доступна для level 3) -->
      <router-link v-if="userLevel >= 3" to="/users">Users</router-link>
    </nav>

    <p style="width: 100%; height: 1px; background-color: var(--orange);"> </p>
    <div style="align-items: center;">
    <h1>Добро пожаловать!</h1>
    <!-- <h2 style="width: 80%; align-content: flex-start;">
      Наша компания предлагает решения в сфере управления и автоматизации как для вашего дома, так и для вашего бизнеса.
    </h2>
    <h2 style="width: 80%; align-content: flex-end;">
      Вы можете выбрать один из разделов и узнать больше о типовых решениях или заказать индивидуальную разработку.
    </h2> -->

    <p>Выберите раздел:</p>
    <div class="introduce-place">
      <button @click="goToDashboard" class="introduce-button color_dark dash">
        <span class="button-text">Dashboard</span>
      </button>
      <button @click="goToSmartHome" class="introduce-button color-light home">
        <span class="button-text">Smart Home</span>
      </button>
      <button @click="goToManufactAutomation" class="introduce-button color-light manuft">
        <span class="button-text">Manufact Automation</span>
      </button>
    </div>
  </div>
</div>
</template>

<script>
import { mapGetters } from 'vuex'; // Импортируем mapGetters для доступа к уровню пользователя

export default {
  name: 'IntroduceHome',
  computed: {
    ...mapGetters(['level']), // Получаем уровень доступа из Vuex
    userLevel() {
      console.log('Уровень доступа пользователя:', this.level);
      return this.level || 0; // Если уровень не задан, считаем его равным 0
    },
  },
  methods: {
    goToDashboard() {
      this.$router.push('/dashboard');
    },
    goToSmartHome() {
      this.$router.push('/smart-home');
    },
    goToManufactAutomation() {
      this.$router.push('/manufact-automatation');
    },
    LogIn() {
      this.$router.push('/login');
    },
    Profile() {
      this.$router.push('/profile');
    },
    Users() {
      this.$router.push('/users');
    },
  },
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>