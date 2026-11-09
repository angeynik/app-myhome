<!-- components/AccessDenied.vue -->
<template>
  <div>
    <div class="header-bottom">
      <TopNav />
    </div>
    <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>

    <div style="padding: 0 10px;">
      <h1>403 — Доступ запрещён</h1>
      <p>У вас недостаточно прав для просмотра этой страницы.</p>
      <router-link v-if="!isAuthenticated" to="/login">Авторизация</router-link>
      <router-link to="/">Вернуться на главную</router-link>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import TopNav from '@/components/TopNav.vue';

export default {
  name: 'AccessDenied',
  components: { TopNav },
  computed: {
    ...mapGetters(['isAuthenticated']),
  },
};
</script>
