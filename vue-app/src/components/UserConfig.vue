<template>
    <div>
      <h1>Управление пользователями</h1>
  
      <!-- Форма для создания пользователя -->
      <div>
        <h2>Создать нового пользователя</h2>
        <form @submit.prevent="createUser">
          <div>
            <label for="username">Имя пользователя:</label>
            <input type="text" id="username" v-model="newUser.username" required />
          </div>
          <p></p>
          <div>
            <label for="password">Пароль:</label>
            <input type="password" id="password" v-model="newUser.password" required />
          </div>
          <p></p>
          <div>
            <label for="dataSource">Источник данных:</label>
            <input type="text" id="dataSource" v-model="newUser.dataSource" required />
          </div>
          <p></p>
          <div>
            <label for="permissionLevel">Уровень доступа:</label>
            <select id="permissionLevel" v-model="newUser.permissionLevel" required>
              <option value="1">Чтение</option>
              <option value="2">Запись</option>
              <option value="3">Администрирование</option>
            </select>
          </div>
          <p></p>
          <button type="submit">Создать пользователя</button>
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
  import { ref } from 'vue';
  
  export default {
    setup() {
      const newUser = ref({
        username: '',
        password: '',
        dataSource: '',
        permissionLevel: '1', // По умолчанию уровень доступа "Чтение"
      });
  
      const successMessage = ref('');
      const users = ref([]);
      let isUsersLoaded = false; // Флаг для кэширования списка пользователей
  
      const host = process.env.VUE_APP_HOST || 'http://localhost';
      const port = process.env.VUE_APP_SERVER_PORT || '3010';
      const url = `${host}:${port}/users`;
  
      console.log('Sending request to:', url); // Логирование URL
  
      // Функция для создания пользователя
      const createUser = async () => {
        if (!newUser.value.username || !newUser.value.password || !newUser.value.dataSource) {
          successMessage.value = 'Заполните все поля';
          return;
        }
  
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newUser.value),
          });
  
          if (!response.ok) {
            throw new Error('Ошибка при создании пользователя');
          }
  
          const data = await response.json();
          successMessage.value = `Пользователь "${data.username}" успешно создан с уровнем доступа "${data.permissionLevel}" и источником данных "${data.dataSource}"`;
          newUser.value = { username: '', password: '', dataSource: '', permissionLevel: '1' }; // Очистка формы
          fetchUsers(); // Обновляем список пользователей
        } catch (error) {
          console.error('Ошибка:', error);
          successMessage.value = 'Ошибка при создании пользователя';
        }
      };
  
      // Функция для получения списка пользователей
      const fetchUsers = async () => {
        if (isUsersLoaded) return; // Если список уже загружен, не делаем запрос
  
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Ошибка при получении списка пользователей');
          }
          users.value = await response.json();
          isUsersLoaded = true; // Устанавливаем флаг
        } catch (error) {
          console.error('Ошибка:', error);
          successMessage.value = 'Ошибка при загрузке списка пользователей';
        }
      };
  
      // Загружаем список пользователей при монтировании компонента
      fetchUsers();
  
      return {
        newUser,
        successMessage,
        users,
        createUser,
        fetchUsers,
      };
    },
  };
  </script>
  
  <style>
  .success-message {
    color: green;
    margin-top: 10px;
  }
  </style>