<!-- components/TopNav.vue -->
<template>
  <nav class="top-nav">
    <template v-for="(item, idx) in items" :key="item.to">
      <router-link :to="item.to">{{ item.label }}</router-link>
      <span v-if="idx < items.length - 1" class="top-nav-separator">|</span>
    </template>
  </nav>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'TopNav',

  computed: {
    ...mapGetters(['isAuthenticated', 'level']),

    userLevel() {
      return this.level || 0;
    },

    /**
     * Список ссылок по уровням доступа:
     *   - гость (не авторизован):    Главная, Войти
     *   - level 1 (Пользователь):    Главная
     *   - level 2 (Оператор):        Главная, Профиль
     *   - level 3 (Администратор):   Главная, Профиль, Пользователи
     */
    items() {
      const list = [{ to: '/', label: 'Главная' }];

      if (!this.isAuthenticated) {
        list.push({ to: '/login', label: 'Войти' });
        return list;
      }

      if (this.userLevel >= 2) {
        list.push({ to: '/profile', label: 'Профиль' });
      }
      return list;
    },
  },
};
</script>
