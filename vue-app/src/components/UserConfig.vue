<template>
  <div>
    <header class="header">
      <nav>
        <router-link to="/login">Login</router-link> |
        <router-link to="/dashboard">Dashboard</router-link> |
        <router-link to="/smart-home">Smart Home</router-link> |
        <router-link to="/manufact-automatation">Automation</router-link> |
        <router-link v-if="userLevel >= 2" to="/profile">Profile</router-link> |
        <router-link v-if="userLevel >= 3" to="/users">Users</router-link>
      </nav>
      <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>
    </header>

    <!-- Форма для создания пользователя -->
    <div style="padding: 0 10px 0 10px;">
      <h2>Создать нового пользователя</h2>
      <form @submit.prevent="createUser">
        <div>
          <label for="username">Имя пользователя:</label>
          <input type="text" id="username" v-model="newUser.username" required autocomplete="username"/>
          <span v-if="errors.username" class="error">{{ errors.username }}</span>
        </div>
        <div>
          <label for="password">Пароль:</label>
          <input type="password" id="password" v-model="newUser.password" required autocomplete="password"/>
          <span v-if="errors.password" class="error">{{ errors.password }}</span>
        </div>
        <div>
          <label for="dataSource">Источник данных:</label>
          <input type="text" id="dataSource" v-model="newUser.dataSource" required autocomplete="dataSource"/>
          <span v-if="errors.dataSource" class="error">{{ errors.dataSource }}</span>
        </div>
        <div>
          <label for="permissionLevel">Уровень доступа:</label>
          <select id="permissionLevel" v-model="newUser.permissionLevel" required autocomplete="permissionLevel">
            <option value="1">Пользователь</option>
            <option value="2">Оператор</option>
            <option value="3">Администратор</option>
          </select>
        </div>
        <button type="submit">Создать пользователя</button>
      </form>
    </div>

    <!-- Форма для связывания пользователя с источником данных -->
    <div style="padding: 0 10px 0 10px; margin-top: 20px;">
      <h2>Связать пользователя с источником данных</h2>
      <form @submit.prevent="linkUserToDataSource">
        <div>
          <label for="existingUser">Пользователь:</label>
          <select id="existingUser" v-model="selectedUser" required>
            <option v-for="user in users" :key="user.id" :value="user.id">{{ user.username }}</option>
          </select>
        </div>
        <div>
          <label for="existingDataSource">Источник данных:</label>
          <select id="existingDataSource" v-model="selectedDataSource" required>
            <option v-for="dataSource in dataSources" :key="dataSource.id" :value="dataSource.id">{{ dataSource.name }}</option>
          </select>
        </div>
        <button type="submit">Связать</button>
      </form>
    </div>

    <!-- Сообщение об успешном создании пользователя -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <!-- Список существующих пользователей -->
    <div>
      <h2>Список пользователей</h2>
      <button @click="fetchUsers">Обновить список</button>
      <ul>
        <li v-for="user in users" :key="user.id">
          <strong>Имя:</strong> {{ user.username }} <br />
          <strong>Источник данных:</strong> {{ user.dataSource }} <br />
          <strong>Уровень доступа:</strong> {{ user.permissionLevel }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'UserConfig',
  setup() {
    const store = useStore();
    const userLevel = computed(() => store.getters.level || 0);

    const newUser = ref({
      username: '',
      password: '',
      dataSource: '',
      permissionLevel: '1',
    });

    const errors = ref({
      username: '',
      password: '',
      dataSource: '',
    });

    const successMessage = ref('');
    const users = ref([]);
    const dataSources = ref([]);
    const selectedUser = ref(null);
    const selectedDataSource = ref(null);
    let isUsersLoaded = false;
    let isDataSourcesLoaded = false;

    // const host = `'http://'${process.env.VUE_APP_HOST}` || 'http://localhost';
    // const port = process.env.VUE_APP_SERVER_PORT || '3010';
    // const url = `${host}:${port}/users`;
    // const dataSourcesUrl = `${host}:${port}/data-sources`;

    const clearErrors = () => {
      errors.value.username = '';
      errors.value.password = '';
      errors.value.dataSource = '';
    };

    const createUser = async () => {
      clearErrors();

      let isValid = true;
      newUser.value.username = await store.dispatch('toLowerCase', newUser.value.username);
      newUser.value.dataSource = await store.dispatch('toLowerCase', newUser.value.dataSource);

      // Проверка имени пользователя
      if (newUser.value.username.length < 3 || newUser.value.username.length > 16) {
        errors.value.username = 'Имя пользователя должно быть от 3 до 16 символов.';
        isValid = false;
      }

      // Проверка пароля
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{10,32}$/;
      if (!passwordRegex.test(newUser.value.password)) {
        errors.value.password = 'Пароль должен быть от 10 до 32 символов, содержать минимум одну заглавную букву, цифру и спецсимвол.';
        isValid = false;
      }

      // Проверка источника данных
      const dataSourceRegex = /^[a-zA-Z0-9_]{4,16}$/;
      if (!dataSourceRegex.test(newUser.value.dataSource)) {
        errors.value.dataSource = 'Источник данных должен быть от 4 до 16 символов и содержать символ нижнего подчеркивания _ ';
        isValid = false;
      }

      if (isValid) {
        try {
          await store.dispatch('sendWSMessage', {
            type: 'createUser',
            payload: newUser.value,
          });
          successMessage.value = 'Пользователь успешно создан';
          isUsersLoaded = false;
          fetchUsers();
        } catch (error) {
          console.error('Ошибка:', error);
          successMessage.value = 'Ошибка при создании пользователя';
        }
      }
    };

    const linkUserToDataSource = async () => {
      if (!selectedUser.value || !selectedDataSource.value) {
        successMessage.value = 'Пожалуйста, выберите пользователя и источник данных';
        return;
      }

      try {
        await store.dispatch('sendWSMessage', {
          type: 'linkUserToDataSource',
          payload: {
            userId: selectedUser.value,
            dataSourceId: selectedDataSource.value,
          },
        });
        successMessage.value = 'Пользователь успешно связан с источником данных';
        fetchUsers(); // Обновляем список пользователей
      } catch (error) {
        console.error('Ошибка:', error);
        successMessage.value = 'Ошибка при связывании пользователя с источником данных';
      }
    };

    const fetchUsers = async () => {
      if (isUsersLoaded) return;

      try {
        const response = await store.dispatch('sendWSMessage', {
          type: 'fetchUsers',
        });
        users.value = response.users; // Предполагаем, что сервер возвращает объект с ключом `users`
        isUsersLoaded = true;
      } catch (error) {
        console.error('Ошибка:', error);
        successMessage.value = 'Ошибка при загрузке списка пользователей';
      }
    };

    const fetchDataSources = async () => {
      if (isDataSourcesLoaded) return;

      try {
        const response = await store.dispatch('sendWSMessage', {
          type: 'fetchDataSources',
        });
        dataSources.value = response.dataSources; // Предполагаем, что сервер возвращает объект с ключом `dataSources`
        isDataSourcesLoaded = true;
      } catch (error) {
        console.error('Ошибка:', error);
        successMessage.value = 'Ошибка при загрузке списка источников данных';
      }
    };

    onMounted(() => {
      fetchUsers();
      fetchDataSources();
    });

    return {
      newUser,
      errors,
      successMessage,
      users,
      dataSources,
      selectedUser,
      selectedDataSource,
      createUser,
      linkUserToDataSource,
      fetchUsers,
      userLevel,
    };
  },
};
</script>

<style>
.error {
  color: var(--white);
  font-size: 0.8em;
}

.success-message {
  color: green;
  margin-top: 16px;
}
</style>