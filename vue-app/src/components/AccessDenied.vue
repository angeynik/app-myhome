<template>
    <div>
      <h1>403 - Доступ запрещен</h1>
      <p>У вас недостаточно прав для просмотра этой страницы.</p>
      <router-link to="/login">Авторизация</router-link>
      <router-link to="/">Вернуться на главную</router-link>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AccessDenied',
  };
  </script>
  
  <style scoped>
  /* Стили для страницы ошибки */
  </style>