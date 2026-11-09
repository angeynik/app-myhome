<!-- src/components/Profile.vue -->
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
        <div>
      <h1>Profile</h1>
      <p>Welcome, {{ user?.username }}!</p>
      <div>
        <button 
          @click="confirmLogout"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Выход...</span>
          <span v-else>Выход</span>
        </button>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>
 
  <script>
  import { ref, computed } from 'vue';
  import { useStore } from 'vuex';
  import { useRouter } from 'vue-router';
  
  export default {
    name: 'AppProfile',
    setup() {
      const store = useStore();
      const router = useRouter();
      const isLoading = ref(false);
      const errorMessage = ref ('');
      const user = computed(() => store.state.auth.user);
      const userLevel = computed(() => store.getters.level);

      const confirmLogout = () => {
      if (window.confirm('Вы уверены, что хотите выйти?')) {
        handleLogout();
      }
    };

    const handleLogout = async () => {
      try {
        isLoading.value = true;
        errorMessage.value = '';
        await store.dispatch('auth/logout');
        router.push('/'); // Перенаправляем на страницу входа
      } catch (error) {
        errorMessage.value = 'Ошибка выхода из системы';
        console.error('Ошибка:', error);
      } finally {
        isLoading.value = false; // Обновляем состояние загрузки
      }
    };
      return {
        handleLogout,
        isLoading,
        errorMessage,
        confirmLogout,
        user,
        userLevel,
      };
    }
  };

  </script>
  