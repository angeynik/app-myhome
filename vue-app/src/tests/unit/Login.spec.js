// src/tests/unit/Login.spec.js
import { mount } from '@vue/test-utils';
import Login from '@/components/AppLogin.vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import PopupMenu from '@/components/PopupMenu.vue';

jest.mock('@/components/PopupMenu.vue', () => ({
  name: 'PopupMenu',
  template: '<div class="popup-mock"></div>',
  props: ['visible', 'message', 'type']
}));

describe('Login.vue', () => {
  let router;
  let mockStore;

  beforeEach(() => {
    mockStore = {
      getters: {
        level: 2,
        dID: 'dummy-device-id',
        'websocket/isConnected': true
      },
      dispatch: jest.fn().mockResolvedValue({ user: { username: 'test' } })
    };

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/login', component: Login }
      ]
    });
    router.push = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders login form correctly', async () => {
    const wrapper = mount(Login, {
      global: {
        mocks: {
          $store: mockStore,
          $router: router
        },
        stubs: {
          RouterLink: true
        }
      }
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.find('h1').text()).toBe('Авторизация');
    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(2);
    expect(inputs.at(0).attributes('type')).toBe('text');
    expect(inputs.at(0).attributes('placeholder')).toBe('Имя пользователя');
    expect(inputs.at(1).attributes('type')).toBe('password');
    expect(inputs.at(1).attributes('placeholder')).toBe('Пароль');
    expect(wrapper.find('button[type="submit"]').text()).toBe('Вход');
    expect(wrapper.find('.popup-mock').exists()).toBe(true);
  });

  it('shows error message on login failure', async () => {
    mockStore.dispatch.mockRejectedValue(new Error('USER_NOT_FOUND'));

    const wrapper = mount(Login, {
      global: {
        mocks: {
          $store: mockStore,
          $router: router
        },
        stubs: {
          RouterLink: true
        }
      }
    });

    const usernameInput = wrapper.find('input[type="text"]');
    const passwordInput = wrapper.find('input[type="password"]');
    await usernameInput.setValue('testuser');
    await passwordInput.setValue('wrongpass');

    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    // Ждём асинхронные операции
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(wrapper.vm.showPopup).toBe(true);
    // Проверяем сообщение об ошибке: в коде при USER_NOT_FOUND выводится "Неверное имя пользователя или пароль"
    expect(wrapper.vm.popupMessage).toContain('Неверное имя пользователя или пароль');
    expect(wrapper.vm.popupType).toBe('error');
  });

  it('successful login redirects after config load', async () => {
    jest.useFakeTimers();

    const pushMock = jest.fn();
    router.push = pushMock;

    // Настраиваем успешный ответ
    mockStore.dispatch.mockResolvedValue({ user: { username: 'test' } });

    const wrapper = mount(Login, {
      global: {
        mocks: {
          $store: mockStore,
          $router: router
        },
        stubs: {
          RouterLink: true
        }
      }
    });

    const usernameInput = wrapper.find('input[type="text"]');
    const passwordInput = wrapper.find('input[type="password"]');
    await usernameInput.setValue('testuser');
    await passwordInput.setValue('password');

    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    // Продвигаем таймер на 1500 мс
    jest.advanceTimersByTime(1500);
    await wrapper.vm.$nextTick();

    // Проверяем, что dispatch был вызван с правильными аргументами
    expect(mockStore.dispatch).toHaveBeenCalledWith('auth/login', {
      username: 'testuser',
      password: 'password'
    });
    // Проверяем, что конфигурация запрошена
    expect(mockStore.dispatch).toHaveBeenCalledWith('config/ensureConfig', expect.anything());
    // Проверяем редирект
    expect(pushMock).toHaveBeenCalledWith('/');
  });
});