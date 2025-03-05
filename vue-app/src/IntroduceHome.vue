<template>
  <div>
    <nav style="margin-bottom: 20px;">
      <router-link to="/dashboard">Dashboard</router-link> |
      <router-link to="/smart-home">Smart Home</router-link> |
      <router-link to="/manufact-automatation">Manufact Automation</router-link>
    </nav>
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
</template>

<script>
export default {
  name: 'IntroduceHome',
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
  },
};
</script>

<style scoped>

</style>