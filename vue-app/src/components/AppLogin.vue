t <template>
  <div>
    <div class="header-bottom">
      <nav>
        <router-link to="/login">Login</router-link> |
        <router-link to="/dashboard">Dashboard</router-link> |
        <router-link to="/smart-home">Smart Home</router-link> |
        <router-link to="/manufact-automatation">Automation</router-link> |
        <router-link v-if="userLevel >= 2" to="/profile">Profile</router-link>
        <router-link v-if="userLevel >= 3" to="/users">Users</router-link>
      </nav>
    </div>
    <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>
    <div style="padding: 0 10px 0 10px;">
      <h1>Авторизация</h1>
      <form @submit.prevent="login">
        <input ref="usernameInput" 
               type="text" 
               placeholder="Имя пользователя" 
               required 
               autocomplete="username" />
        <input ref="passwordInput" 
               type="password" 
               placeholder="Пароль" 
               required 
               autocomplete="current-password" />
        <button type="submit">Вход</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'AppLogin',
  setup() {
    const store = useStore();
    const router = useRouter();

    const usernameInput = ref(null);
    const passwordInput = ref(null);
    const error = ref('');

    // 1. Исправляем название переменных
    const userLevel = computed(() => store.getters.level);
    const dID = computed(() => store.getters.dID);

    // 2. Исправляем логирование
    //console.log('Уровень из геттера:', userLevel.value);
    //console.log('dID из геттера:', dID.value);

    const login = async () => {
      error.value = '';
      try {
        const username = usernameInput.value.value.toLowerCase();
        const password = passwordInput.value.value;

        if (!username || !password) {
          throw new Error('Имя пользователя и пароль обязательны');
        }

        // 3. Добавляем обработку успешного логина
        const userData = await store.dispatch('auth/login', { 
          username, 
          password 
        });

        // 4. Добавляем проверку состояния после логина
        console.log('Текущий уровень после логина:', store.getters.level);
        console.log('Текущий dID после логина:', store.getters.dID);
        // if (userData) {
        // alert(`✅ Вход для Пользователя ${username} прошел успешно!\n Уровень доступа ${store.getters.level}`);

        // const redirectPath = localStorage.getItem('redirectPath') || '/';
        // localStorage.removeItem('redirectPath');
        // router.push(redirectPath);


          if (userData) {
          // Добавляем проверку конфигурации
          try {
            await store.dispatch('config/ensureConfig', dID.value);
          } catch (err) {
            console.error('Ошибка при загрузке конфигурации:', err);
            alert('⚠️ Конфигурация не загружена! Некоторые функции могут работать некорректно');
          }

          alert(`✅ Вход для Пользователя ${username} прошел успешно!\n Уровень доступа ${store.getters.level}`);
          
          const redirectPath = localStorage.getItem('redirectPath') || '/';
          localStorage.removeItem('redirectPath');
          router.push(redirectPath);
        } else {
          console.log(`❌ Проблемы авторизации в AppLogin.vue -- 83 --`);
        }
      } catch (err) {
        error.value = err.message || 'Ошибка авторизации';
        alert(`✅ Ошибка авторизации Пользователя!`);
        console.error('Ошибка входа:', err.value );
      }
    };

      onMounted(() => {
        usernameInput.value?.focus();
      });

    return {
      usernameInput,
      passwordInput,
      error,
      userLevel,
      dID, // 6. Возвращаем dID в шаблон
      login,
    };
  },
};
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}
</style>