<template>
    <div>
      <nav>
        <router-link to="/dashboard">Dashboard</router-link> |
        <router-link to="/smart-home">Smart Home</router-link> |
        <router-link to="/manufact-automatation">Manufact Automation</router-link>
      </nav>
      <h1> Добро пожаловать!</h1>
      <p>Выберите раздел:</p>
      
    </div>

  </template>
  
  <script>
  export default {
    name: 'IntroduceHome',
  };
  </script>
  
  <style scoped>
  /* Стили для Home.vue */
  </style>