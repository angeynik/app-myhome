<!-- components/AppProfile.vue -->
<template>
  <div>
    <div class="header-bottom">
      <TopNav />
    </div>
    <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>

    <div>
      <h1>Profile</h1>
      <p>Welcome, {{ user?.username }}!</p>
      <div>
        <button @click="confirmLogout" :disabled="isLoading">
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
import TopNav from '@/components/TopNav.vue';

export default {
  name: 'AppProfile',
  components: { TopNav },

  setup() {
    const store = useStore();
    const router = useRouter();

    const isLoading = ref(false);
    const errorMessage = ref('');
    const user = computed(() => store.state.auth.user);

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
        router.push('/login');
      } catch (error) {
        errorMessage.value = 'Ошибка выхода из системы';
        console.error('Ошибка:', error);
      } finally {
        isLoading.value = false;
      }
    };

    return {
      handleLogout,
      isLoading,
      errorMessage,
      confirmLogout,
      user,
    };
  },
};
</script>