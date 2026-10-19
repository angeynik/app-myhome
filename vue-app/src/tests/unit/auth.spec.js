// src/tests/unit/auth.spec.js
import { createStore } from 'vuex';
import authModule from '@/store/modules/auth';
import websocketModule from '@/store/modules/websocket';

// Мокаем WebSocket-модуль с namespace
jest.mock('@/store/modules/websocket', () => ({
  namespaced: true,
  actions: {
    connect: jest.fn(),
    send: jest.fn()
  }
}));

const createVuexStore = () => {
  return createStore({
    modules: {
      auth: authModule,
      websocket: require('@/store/modules/websocket') // 👈 важно использовать require, чтобы мок работал
    }
  });
};

describe('🛡️ Vuex Auth Module', () => {
  let store;

  beforeEach(() => {
    store = createVuexStore();
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('AUTH_SUCCESS mutation sets state correctly', () => {
    const token = 'test-token';
    const user = { username: 'testuser' };
    const dID = 'test-did';
    const level = 1;

    store.commit('auth/AUTH_SUCCESS', { token, user, dID, level });

    expect(store.state.auth.token).toBe(token);
    expect(store.state.auth.user).toEqual(user);
    expect(store.state.auth.dID).toBe(dID);
    expect(store.state.auth.level).toBe(level);
    expect(store.state.auth.status).toBe('success');
  });

  test('AUTH_ERROR mutation sets error status', () => {
    store.commit('auth/AUTH_ERROR');
    expect(store.state.auth.status).toBe('error');
  });

  test('RESTORE_AUTH mutation restores state from data', () => {
    const restoreData = {
      token: 'restored-token',
      user: { username: 'restoredUser' },
      dID: 'restored-did',
      level: 9
    };

    store.commit('auth/RESTORE_AUTH', restoreData);

    expect(store.state.auth.token).toBe(restoreData.token);
    expect(store.state.auth.user).toEqual(restoreData.user);
    expect(store.state.auth.dID).toBe(restoreData.dID);
    expect(store.state.auth.level).toBe(restoreData.level);
    expect(store.state.auth.status).toBe('success');
  });

  test('login action successful', async () => {
  const mockResponse = {
    request: 'loginSuccess',
    name: 'test-did',
    payload: {
      token: 'test-token',
      username: 'testuser',
      userlevel: 1
    }
  };

  // Получаем моковый модуль websocket
  const websocket = require('@/store/modules/websocket');
  // Настраиваем моки
  websocket.actions.connect.mockResolvedValue({ readyState: WebSocket.OPEN });
  websocket.actions.send.mockResolvedValue(mockResponse);

  // Создаем store после настройки моков
  const localStore = createVuexStore();

  const userCredentials = {
    username: 'testuser',
    password: 'testpass'
  };

  const result = await localStore.dispatch('auth/login', userCredentials);

  expect(result).toEqual({
    username: 'testuser',
    password: 'testpass',
    userlevel: 1,
    dID: 'test-did'
  });

  // Проверяем, что состояние обновилось
  expect(localStore.state.auth.status).toBe('success');
  expect(localStore.state.auth.token).toBe('test-token');
  expect(localStore.state.auth.user.username).toBe('testuser');
  expect(localStore.state.auth.dID).toBe('test-did');
  expect(localStore.state.auth.level).toBe(1);

  // Проверяем localStorage
  const authData = JSON.parse(localStorage.getItem('authData'));
  expect(authData).toEqual({
    token: 'test-token',
    user: {
      username: 'testuser',
      password: 'testpass',
      userlevel: 1,
      dID: 'test-did'
    },
    dID: 'test-did',
    level: 1
  });
});


  test('logout action clears state and storage', () => {
    store.commit('auth/AUTH_SUCCESS', {
      token: 'test-token',
      user: { username: 'testuser' },
      dID: 'test-did',
      level: 1
    });

    store.dispatch('auth/logout');

    expect(store.state.auth.token).toBe('');
    expect(store.state.auth.user).toEqual({});
    expect(store.state.auth.dID).toBeNull();
    expect(store.state.auth.level).toBe(0); // 👈 теперь сбрасывается
    expect(store.state.auth.status).toBe('');
    expect(localStorage.getItem('authData')).toBeNull();
  });
});
