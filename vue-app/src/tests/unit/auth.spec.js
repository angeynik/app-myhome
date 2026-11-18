// src/tests/unit/auth.spec.js
// Модуль auth: мутации, вход, выход, восстановление сессии. Сессия хранится в localStorage
// под ключом authSession — без пароля.

jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

import { createStore } from 'vuex';
import authModule from '@/store/modules/auth';

const LOGIN_OK = {
  type: 'response',
  request: 'loginSuccess',
  name: 'igumen',
  payload: { token: 'test-token', username: 'testuser', userlevel: 2, dID: 'igumen' },
};

function makeStore(send = jest.fn().mockResolvedValue(LOGIN_OK)) {
  const resets = { session: jest.fn(), config: jest.fn(), video: jest.fn(), dropdown: jest.fn() };
  const store = createStore({
    mutations: { RESET_SESSION_DATA: resets.session },
    modules: {
      auth: authModule,
      websocket: { namespaced: true, actions: { send: (_, msg) => send(msg) } },
      config: { namespaced: true, mutations: { RESET: resets.config } },
      video: { namespaced: true, mutations: { RESET: resets.video } },
      dropdown: { namespaced: true, actions: { hide: resets.dropdown } },
      popup: { namespaced: true, actions: { show: jest.fn() } },
    },
  });
  return { store, send, resets };
}

const savedSession = () => JSON.parse(localStorage.getItem('authSession'));

describe('auth: мутации', () => {
  test('AUTH_SUCCESS заполняет сессию', () => {
    const { store } = makeStore();
    store.commit('auth/AUTH_SUCCESS', { token: 't', user: { username: 'u' }, dID: 'd', level: 1 });
    expect(store.state.auth).toMatchObject({ token: 't', user: { username: 'u' }, dID: 'd', level: 1, status: 'success' });
  });

  test('AUTH_ERROR — статус error и текст ошибки', () => {
    const { store } = makeStore();
    store.commit('auth/AUTH_ERROR', new Error('Неверный логин'));
    expect(store.state.auth).toMatchObject({ status: 'error', error: 'Неверный логин' });
  });

  test('RESTORE_AUTH восстанавливает сессию; без токена — пустой статус', () => {
    const { store } = makeStore();
    store.commit('auth/RESTORE_AUTH', { token: 'r', user: { username: 'u' }, dID: 'd', level: 3 });
    expect(store.state.auth).toMatchObject({ token: 'r', dID: 'd', level: 3, status: 'success' });
    store.commit('auth/RESTORE_AUTH', {});
    expect(store.state.auth).toMatchObject({ token: '', dID: null, level: 0, status: '' });
  });
});

describe('auth: вход', () => {
  beforeEach(() => localStorage.clear());

  test('успешный вход: запрос auth/login, сессия в state и localStorage без пароля', async () => {
    const { store, send } = makeStore();

    const user = await store.dispatch('auth/login', { username: 'testuser', password: 'secret' });

    expect(send).toHaveBeenCalledWith({
      type: 'auth', request: 'login', name: '', payload: { username: 'testuser', password: 'secret' },
    });
    expect(user).toEqual({ username: 'testuser', userlevel: 2, dID: 'igumen' });
    expect(store.state.auth).toMatchObject({ status: 'success', token: 'test-token', dID: 'igumen', level: 2 });
    expect(savedSession()).toMatchObject({ token: 'test-token', dID: 'igumen', level: 2, user: { username: 'testuser' } });
    expect(localStorage.getItem('authSession')).not.toContain('secret');
  });

  test('ошибка сервера (BAD_CREDENTIALS) — статус error, ошибка передаётся дальше с кодом', async () => {
    const err = Object.assign(new Error('Неверный логин или пароль'), { code: 'BAD_CREDENTIALS' });
    const { store } = makeStore(jest.fn().mockRejectedValue(err));

    await expect(store.dispatch('auth/login', { username: 'u', password: 'p' })).rejects.toMatchObject({ code: 'BAD_CREDENTIALS' });
    expect(store.state.auth.status).toBe('error');
    expect(localStorage.getItem('authSession')).toBeNull();
  });

  test('неожиданный ответ сервера — ошибка входа', async () => {
    const { store } = makeStore(jest.fn().mockResolvedValue({ request: 'somethingElse', payload: {} }));
    await expect(store.dispatch('auth/login', { username: 'u', password: 'p' })).rejects.toThrow('Неверный ответ сервера');
    expect(store.state.auth.status).toBe('error');
  });

  test('mustChangePassword из ответа сервера сохраняется', async () => {
    const reply = { ...LOGIN_OK, payload: { ...LOGIN_OK.payload, mustChangePassword: true } };
    const { store } = makeStore(jest.fn().mockResolvedValue(reply));
    await store.dispatch('auth/login', { username: 'u', password: 'p' });
    expect(store.state.auth.mustChangePassword).toBe(true);
    expect(savedSession().mustChangePassword).toBe(true);
  });
});

describe('auth: выход', () => {
  beforeEach(() => localStorage.clear());

  test('logout: запрос auth/logout, очистка state, localStorage и данных других модулей', async () => {
    const { store, send, resets } = makeStore();
    await store.dispatch('auth/login', { username: 'testuser', password: 'p' });
    localStorage.setItem('roomKey', 'room01');
    send.mockClear();
    send.mockResolvedValue(null);

    await store.dispatch('auth/logout');

    expect(send).toHaveBeenCalledWith({ type: 'auth', request: 'logout', name: '', payload: {} });
    expect(store.state.auth).toMatchObject({ token: '', user: {}, dID: null, level: 0, status: '' });
    expect(localStorage.getItem('authSession')).toBeNull();
    expect(localStorage.getItem('roomKey')).toBeNull();
    expect(resets.session).toHaveBeenCalled();
    expect(resets.config).toHaveBeenCalled();
    expect(resets.video).toHaveBeenCalled();
    expect(resets.dropdown).toHaveBeenCalled();
  });

  test('logout не зависает, если сервер не отвечает (не дольше 2 с)', async () => {
    jest.useFakeTimers();
    try {
      const { store, send } = makeStore();
      store.commit('auth/AUTH_SUCCESS', { token: 't', user: {}, dID: 'd', level: 1 });
      send.mockReturnValue(new Promise(() => {})); // ответа нет

      const done = store.dispatch('auth/logout');
      await jest.advanceTimersByTimeAsync(2000);
      await done;
      expect(store.state.auth.token).toBe('');
    } finally {
      jest.useRealTimers();
    }
  });

  test('logout без токена — без запроса к серверу', async () => {
    const { store, send } = makeStore();
    await store.dispatch('auth/logout');
    expect(send).not.toHaveBeenCalled();
  });
});

describe('auth: восстановление сессии (resume)', () => {
  beforeEach(() => localStorage.clear());

  test('нет сохранённой сессии — null без запроса', async () => {
    const { store, send } = makeStore();
    await expect(store.dispatch('auth/resume')).resolves.toBeNull();
    expect(send).not.toHaveBeenCalled();
  });

  test('сохранённый токен — auth/resume и восстановленная сессия', async () => {
    localStorage.setItem('authSession', JSON.stringify({ token: 'saved-token' }));
    const { store, send } = makeStore();

    const user = await store.dispatch('auth/resume');

    expect(send).toHaveBeenCalledWith({ type: 'auth', request: 'resume', name: '', payload: { token: 'saved-token' } });
    expect(user).toMatchObject({ username: 'testuser', dID: 'igumen' });
    expect(store.state.auth.token).toBe('test-token');
  });
});
