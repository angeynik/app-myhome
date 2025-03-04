<template>
    <div>
      <nav>
        <router-link to="/dashboard">Dashboard</router-link> |
        <router-link to="/smart-home">Smart Home</router-link> |
        <router-link to="/manufact-automatation">Manufact Automation</router-link>
      </nav>
      
      <h1>Smart Home</h1>
      <p>Welcome to the Smart Home page!</p>
    </div>
  </template>
 
  <script>
  export default {
    name: 'SmartHome',
  };
  </script>
  
  <style scoped>
  /* Стили для SmartHome */
  </style>