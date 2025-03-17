import { mount } from '@vue/test-utils';
import UserConfig from '@/components/UserConfig.vue';
import { createStore } from 'vuex';
import router from '@/router/routes'; // Импортируем ваш файл routes.js
import store from '@/store'; // Импортируем хранилище Vuex

describe('UserConfig.vue', () => {
  let testStore;

  beforeEach(() => {
    // Создаем мок store перед каждым тестом
    testStore = createStore({
      state: {},
      getters: {
        level: () => 2, // По умолчанию userLevel = 2
        isAuthenticated: () => true, // Пользователь авторизован
      },
      actions: {
        sendWSMessage: jest.fn((_, payload) => {
          if (payload.request === 'fetchUsers') {
            return Promise.resolve({ users: [{ id: 1, username: 'testUser' }] });
          }
          if (payload.request === 'fetchDataSources') {
            return Promise.resolve({ sources: [{ id: 1, did: 'testDataSource' }] });
          }
          if (payload.request === 'createUser') {
            return Promise.resolve();
          }
          if (payload.request === 'linkUserToDataSource') {
            return Promise.resolve();
          }
          return Promise.reject(new Error('Unknown request'));
        }),
        toLowerCase: jest.fn((_, value) => value.toLowerCase()),
      },
    });
  });

  it('matches the snapshot', async () => {
    const wrapper = mount(UserConfig, {
      global: {
        plugins: [testStore, router],
      },
    });
    await router.isReady(); // Ожидаем загрузки роутера
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('displays Profile link when userLevel >= 2', async () => {
    const wrapper = mount(UserConfig, {
      global: {
        plugins: [testStore, router],
      },
    });
    await router.isReady();
    expect(wrapper.find('a[href="/profile"]').exists()).toBe(true);
  });

  it('does not display Users link when userLevel < 3', async () => {
    const wrapper = mount(UserConfig, {
      global: {
        plugins: [testStore, router],
      },
    });
    await router.isReady();
    expect(wrapper.find('a[href="/users"]').exists()).toBe(false);
  });

  it('shows error message when username is too short', async () => {
    const wrapper = mount(UserConfig, {
      global: {
        plugins: [testStore, router],
      },
    });
    await router.isReady();

    await wrapper.find('#username').setValue('ab');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('.error').text()).toContain('Имя пользователя должно быть от 3 до 16 символов.');
  });

  it('shows error message when password does not meet requirements', async () => {
    const wrapper = mount(UserConfig, {
      global: {
        plugins: [testStore, router],
      },
    });
    await router.isReady();

    await wrapper.find('#password').setValue('weakpassword');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('.error').text()).toContain('Пароль должен быть от 10 до 32 символов, содержать минимум одну заглавную букву, цифру и спецсимвол.');
  });

  it('displays success message when user is created successfully', async () => {
    const wrapper = mount(UserConfig, {
      global: {
        plugins: [testStore, router],
      },
    });
    await router.isReady();

    await wrapper.find('#username').setValue('validUsername');
    await wrapper.find('#password').setValue('ValidPassword1!');
    await wrapper.find('#dataSource').setValue('valid_data_source');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('.success-message').text()).toContain('Пользователь успешно создан');
  });

  it('displays success message when user is linked to data source successfully', async () => {
    const wrapper = mount(UserConfig, {
      global: {
        plugins: [testStore, router],
      },
    });
    await router.isReady();

    await wrapper.find('#existingUser').setValue('1');
    await wrapper.find('#existingDataSource').setValue('1');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('.success-message').text()).toContain('Пользователь успешно связан с источником данных');
  });

  it('loads users and data sources on mount', async () => {
    const wrapper = mount(UserConfig, {
      global: {
        plugins: [testStore, router],
      },
    });
    await router.isReady();

    await wrapper.vm.fetchUsers();
    await wrapper.vm.fetchDataSources();

    expect(wrapper.vm.usersDB.length).toBeGreaterThan(0);
    expect(wrapper.vm.dataSources.length).toBeGreaterThan(0);
  });

  it('updates user list when refresh button is clicked', async () => {
    const wrapper = mount(UserConfig, {
      global: {
        plugins: [testStore, router],
      },
    });
    await router.isReady();

    await wrapper.find('button').trigger('click');
    expect(wrapper.vm.usersDB.length).toBeGreaterThan(0);
  });

  it('displays error message when user creation fails', async () => {
    testStore.dispatch = jest.fn(() => Promise.reject(new Error('Ошибка при создании пользователя')));
    const wrapper = mount(UserConfig, {
      global: {
        plugins: [testStore, router],
      },
    });
    await router.isReady();

    await wrapper.find('#username').setValue('invalidUsername');
    await wrapper.find('#password').setValue('invalidPassword');
    await wrapper.find('#dataSource').setValue('invalid_data_source');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('.success-message').text()).toContain('Ошибка при создании пользователя');
  });

  it('displays error message when linking user to data source fails', async () => {
    testStore.dispatch = jest.fn(() => Promise.reject(new Error('Ошибка при связывании пользователя с источником данных')));
    const wrapper = mount(UserConfig, {
      global: {
        plugins: [testStore, router],
      },
    });
    await router.isReady();

    await wrapper.find('#existingUser').setValue('invalidUserId');
    await wrapper.find('#existingDataSource').setValue('invalidDataSourceId');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('.success-message').text()).toContain('Ошибка при связывании пользователя с источником данных');
  });
});