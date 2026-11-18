// src/tests/unit/AppLogin.spec.js
// Форма входа: поля, предупреждение без связи, ошибки сервера, переход после входа
// (redirectPath из гарда — только внутренний путь).

jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

import { mount, flushPromises } from '@vue/test-utils';
import AppLogin from '@/components/AppLogin.vue';

function setup({ connected = true, login, mustChangePassword = false } = {}) {
  const dispatch = jest.fn((action) => {
    if (action === 'auth/login') return login ? login() : Promise.resolve({ username: 'testuser', userlevel: 2 });
    return Promise.resolve();
  });
  const $store = {
    dispatch,
    getters: { 'websocket/isConnected': connected, 'auth/mustChangePassword': mustChangePassword },
  };
  const $router = { push: jest.fn() };
  const wrapper = mount(AppLogin, {
    global: { mocks: { $store, $router }, stubs: { TopNav: true } },
  });
  const submit = async (username = 'TestUser ', password = 'secret') => {
    wrapper.find('input[type="text"]').element.value = username;
    wrapper.find('input[type="password"]').element.value = password;
    await wrapper.find('form').trigger('submit');
    await flushPromises();
  };
  return { wrapper, dispatch, $router, submit };
}

describe('AppLogin', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  test('форма: заголовок, логин, пароль, кнопка «Вход»', () => {
    const { wrapper } = setup();
    expect(wrapper.find('h1').text()).toBe('Авторизация');
    expect(wrapper.find('input[type="text"]').attributes('placeholder')).toBe('Имя пользователя');
    expect(wrapper.find('input[type="password"]').attributes('placeholder')).toBe('Пароль');
    expect(wrapper.find('button[type="submit"]').text()).toBe('Вход');
    expect(wrapper.find('.warning').exists()).toBe(false);
  });

  test('нет связи с сервером — предупреждение', () => {
    const { wrapper } = setup({ connected: false });
    expect(wrapper.find('.warning').text()).toContain('Нет соединения с сервером');
  });

  test('вход: логин приводится к нижнему регистру без пробелов, сообщение об успехе, переход на / через 400 мс', async () => {
    const { dispatch, $router, submit } = setup();
    await submit();
    expect(dispatch).toHaveBeenCalledWith('auth/login', { username: 'testuser', password: 'secret' });
    expect(dispatch).toHaveBeenCalledWith('popup/show', expect.objectContaining({ message: 'Вход выполнен: testuser', type: 'success' }));
    expect($router.push).not.toHaveBeenCalled();
    jest.advanceTimersByTime(400);
    expect($router.push).toHaveBeenCalledWith('/');
  });

  test('после входа — на страницу, с которой отправил гард (redirectPath), и он удаляется', async () => {
    localStorage.setItem('redirectPath', '/preferences');
    const { $router, submit } = setup();
    await submit();
    jest.advanceTimersByTime(400);
    expect($router.push).toHaveBeenCalledWith('/preferences');
    expect(localStorage.getItem('redirectPath')).toBeNull();
  });

  test.each(['//evil.example', 'https://evil.example', 'javascript:alert(1)'])(
    'внешний redirectPath %s игнорируется — переход на /',
    async (path) => {
      localStorage.setItem('redirectPath', path);
      const { $router, submit } = setup();
      await submit();
      jest.advanceTimersByTime(400);
      expect($router.push).toHaveBeenCalledWith('/');
    },
  );

  test('сервер требует сменить пароль — переход на /change-password', async () => {
    const { $router, submit } = setup({ mustChangePassword: true });
    await submit();
    jest.advanceTimersByTime(400);
    expect($router.push).toHaveBeenCalledWith('/change-password');
  });

  test.each([
    ['BAD_CREDENTIALS', 'неважно', 'Неверный логин или пароль'],
    ['LOCKED', 'Слишком много попыток. Повторите через 60 сек', 'Слишком много попыток. Повторите через 60 сек'],
    ['TIMEOUT', 'x', 'Сервер не отвечает. Проверьте соединение.'],
    ['NO_CONNECTION', 'x', 'Нет соединения с сервером'],
    [undefined, 'Что-то пошло не так', 'Что-то пошло не так'],
  ])('ошибка %s — текст под формой, перехода нет', async (code, message, text) => {
    const { wrapper, $router, submit } = setup({ login: () => Promise.reject(Object.assign(new Error(message), { code })) });
    await submit();
    jest.advanceTimersByTime(400);
    expect(wrapper.find('.error').text()).toBe(text);
    expect($router.push).not.toHaveBeenCalled();
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined();
  });

  test('пустой логин после обрезки пробелов — «Введите логин и пароль» без запроса', async () => {
    const { wrapper, dispatch, submit } = setup();
    await submit('   ', 'secret');
    expect(dispatch).not.toHaveBeenCalledWith('auth/login', expect.anything());
    expect(wrapper.find('.error').text()).toBe('Введите логин и пароль');
  });
});
