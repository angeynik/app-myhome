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
        <option v-for="user in usersDB" :key="user.id" :value="user.id">
          {{ user.username }}
        </option>
      </select>
      <!-- Лог для проверки данных -->
      <!-- <p>Список пользователей: {{ users }}</p> -->
    </div>
    <div>
      <label for="existingDataSource">Источник данных:</label>
      <select id="existingDataSource" v-model="selectedDataSource" required>
        <option v-for="dataSource in dataSources" :key="dataSource.id" :value="dataSource.id">
          {{ dataSource.did }}
        </option>
      </select>
      <!-- Лог для проверки данных -->
      <!-- <p>Список источников данных: {{ dataSources }}</p> -->
    </div>
    <div style="display: flex; justify-content: space-between;">
    <button @click="fetchUsers">Обновить список</button>
    <button type="submit">Связать</button>
  </div>
  </form>
</div>

    <!-- Сообщение об успешном создании пользователя -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'UserConfig',
  setup() {
    const store = useStore();
    const userLevel = computed(() => store.getters.level || 0);
    const dID = computed(() => store.getters.dID);
    //console.log('dID - ', dID.value);

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
    const usersDB = ref([]);
    const dataSources = ref([]);
    
    // Флаги загрузки
    const isUsersLoading = ref(false);
    const isDataLoading = ref(false);
    
    // Выбранные значения (объявлены один раз)
    const selectedUser = ref(null);
    const selectedDataSource = ref(null);

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
      const dataSourceRegex = /^[a-zA-Z_][a-zA-Z0-9_$]{3,15}$/;
      const reservedWords = [
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'DATABASE', 'INDEX', 'VIEW'
      ];

      if (!dataSourceRegex.test(newUser.value.dataSource)) {
        errors.value.dataSource = 'Источник данных должен быть от 4 до 16 символов, начинаться с буквы или _ и содержать только буквы, цифры, _ и $';
        isValid = false;
      } else if (reservedWords.includes(newUser.value.dataSource.toUpperCase())) {
        errors.value.dataSource = 'Источник данных не может быть зарезервированным словом SQL';
        isValid = false;
      }

      if (isValid) {
        //console.log('Все проверки выполнены успешно - isValid:', isValid);
        try {
          await store.dispatch('websocket/send', {
            type: 'post',
            request: 'createUser',
            name: dID.value,
            payload: newUser.value,
          });
          alert('✅ Пользователь успешно создан');
          successMessage.value = 'Пользователь успешно создан';
          isUsersLoading.value = false;
          isDataLoading.value = false;
          //fetchUsers();
        } catch (error) {
          console.error('Ошибка:', error);
          successMessage.value = 'Ошибка при создании пользователя';
        }
      }
    };

    const linkUserToDataSource = async () => {
  if (!selectedUser.value || !selectedDataSource.value) {
    alert('❌ Пожалуйста, выберите пользователя и источник данных');
    successMessage.value = 'Пожалуйста, выберите пользователя и источник данных';
    return;
  }

  try {
    const response = await store.dispatch('websocket/send', {
      type: 'post',
      request: 'linkUserToDataSource',
      name: dID.value,
      payload: {
        userId: selectedUser.value, // id пользователя
        dataSourceId: selectedDataSource.value, // id источника данных
      },
    });

        // Обрабатываем успешный ответ от сервера
        if (response.exists) {
          //console.log('Server - linkUserToDataSource - response', response);
          successMessage.value = `Связь успешно создана. ID записи: ${response.payload.linkId}`;
          alert(`✅ Новая связь создана!\nID записи: ${response.payload.linkId}`);
        } else {
          successMessage.value = `Связь уже существовала. ID записи: ${response.payload.linkId}`;
          alert(`ℹ️ Связь создана!\nID записи: ${response.payload.linkId}`);
          //console.log('Server - linkUserToDataSource - response', response.payload);
        }
        console.log('Успешное выполнение:', successMessage.value);



  } catch (error) {
    console.error('Ошибка:', error);
    //successMessage.value = 'Ошибка при связывании пользователя с источником данных';
        // Извлекаем сообщение об ошибке из ответа сервера
        const serverMessage = error.response?.data?.message 
      || error.response?.data?.error 
      || error.message 
      || 'Неизвестная ошибка';

    successMessage.value = `Ошибка при связывании: ${serverMessage}`;
    alert(`🚨 Ошибка: ${serverMessage}`);
    console.error('Ошибка связывания:', error);
  }
};

  //   const fetchUsers = async () => {
  // if (isUsersLoaded) return;
  // console.log('Список пользователей не загружен - ', isUsersLoaded);
  // try {
  //   console.log ('Формируем запрос на сервер', {
  //     type: 'get',
  //     request: 'fetchUsers',
  //     name: dID.value,
  //   })
  //   const response = await store.dispatch('websocket/send', {
  //     type: 'get',
  //     request: 'fetchUsers',
  //     name: dID.value,
  //   });

  //   console.log('Ответ от сервера (fetchUsers):', response);

  //   // Преобразуем данные в нужный формат
  //   if (Array.isArray(response.payload.users)) {
  //     usersDB.value = response.payload.users.map(user => ({
  //       id: user.id,
  //       username: user.username,
  //     }));
  //     console.log('Обновленный usersDB.value:', usersDB.value);
  //       if (!isDataSourcesLoaded) {
  //         // console.log('fetchDataSources()');
  //         fetchDataSources();
  //       }
  //   } else {
  //     console.error('Ошибка: response.users не является массивом.', response.users);
  //   }
  //   isUsersLoaded = true;
  //   console.log('Список пользователей (usersDB):', usersDB.value); // Лог для проверки
  //   if (isUsersLoaded) return;
  // } catch (error) {
  //   console.error('Ошибка:', error);
  //   successMessage.value = 'Ошибка при загрузке списка пользователей';
  // }
  //   };

  const fetchUsers = async () => {
      try {
        const response = await store.dispatch('websocket/send', {
          type: 'get',
          request: 'fetchUsers',
          name: dID.value,
        });

        if (Array.isArray(response.payload.users)) {
          usersDB.value = response.payload.users.map(user => ({
            id: user.id,
            username: user.username,
          }));
          
          // Устанавливаем последнего пользователя по умолчанию
          if (usersDB.value.length > 0) {
            selectedUser.value = usersDB.value[usersDB.value.length - 1].id;
          }
          
          // Загружаем источники данных если еще не загружены
          if (!isDataLoading.value) {
            await fetchDataSources();
          }
        }
        isUsersLoading.value = true;
      } catch (error) {
        console.error('Ошибка:', error);
        successMessage.value = 'Ошибка при загрузке списка пользователей';
      }
    };
// const fetchDataSources = async () => {
//   console.log('isDataSourcesLoaded - ', isDataSourcesLoaded);
//   if (isDataSourcesLoaded) return;

//   try {
//     const response = await store.dispatch('websocket/send', {
//       type: 'get',
//       request: 'fetchDataSources',
//       name: dID.value,
//     });

//     console.log('Ответ от сервера (fetchDataSources):', response);

//     // Преобразуем данные в нужный формат
//     dataSources.value = response.payload.sources.map(dataSource => ({
//       id: dataSource.id,
//       did: dataSource.did, // Используем did вместо name
//     }));
//     isDataSourcesLoaded = true;
//   } catch (error) {
//     console.error('Ошибка:', error);
//     successMessage.value = 'Ошибка при загрузке списка источников данных';
//   }
// };

const fetchDataSources = async () => {
      try {
        const response = await store.dispatch('websocket/send', {
          type: 'get',
          request: 'fetchDataSources',
          name: dID.value,
        });

        dataSources.value = response.payload.sources.map(dataSource => ({
          id: dataSource.id,
          did: dataSource.did,
        }));
        
        // Устанавливаем последний источник данных по умолчанию
        if (dataSources.value.length > 0) {
          selectedDataSource.value = dataSources.value[dataSources.value.length - 1].id;
        }
        
        isDataLoading.value = true;
      } catch (error) {
        console.error('Ошибка:', error);
        successMessage.value = 'Ошибка при загрузке списка источников данных';
      }
    };

    onMounted(async () => {
      await Promise.all([fetchUsers(), fetchDataSources()]);
    });

    // Следим за изменениями usersDB и обновляем выбранного пользователя
    watch(usersDB, (newVal) => {
      if (newVal.length > 0 && !selectedUser.value) {
        selectedUser.value = newVal[newVal.length - 1].id;
      }
    });

    return {
      newUser,
      errors,
      successMessage,
      usersDB,
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