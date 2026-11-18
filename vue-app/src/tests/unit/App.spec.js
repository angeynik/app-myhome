// src/tests/unit/App.spec.js
// Корневой компонент: инициализация сессии при входе (менеджер уставок, затем конфигурация),
// предупреждение при ошибке загрузки, действия меню пользователя.
// Подключение к серверу и восстановление сессии — в main.js / websocket, не здесь.

jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

import { shallowMount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import App from '@/App.vue';

function setup({ authenticated = false, failInit = false } = {}) {
  const calls = [];
  const track = (name, fail) => jest.fn(() => {
    calls.push(name);
    return fail ? Promise.reject(new Error('нет связи')) : Promise.resolve();
  });
  const actions = {
    initializeSetpointsManager: track('initializeSetpointsManager'),
    configInitialize: track('config/initialize', failInit),
    popupShow: jest.fn(),
    popupHide: jest.fn(),
    dropdownHide: jest.fn(),
    logout: track('auth/logout'),
  };
  const store = createStore({
    state: { token: authenticated ? 't' : '' },
    mutations: { SET_TOKEN(state, t) { state.token = t; } },
    getters: { isAuthenticated: (state) => !!state.token },
    actions: { initializeSetpointsManager: actions.initializeSetpointsManager },
    modules: {
      config: { namespaced: true, actions: { initialize: actions.configInitialize } },
      auth: { namespaced: true, actions: { logout: actions.logout } },
      popup: {
        namespaced: true,
        getters: { popupIsVisible: () => false, popupMessage: () => '', popupType: () => 'info' },
        actions: { show: actions.popupShow, hide: actions.popupHide },
      },
      dropdown: {
        namespaced: true,
        getters: { isVisible: () => false, menuItems: () => [], anchorEl: () => null },
        actions: { hide: actions.dropdownHide },
      },
    },
  });
  const $router = { push: jest.fn() };
  const wrapper = shallowMount(App, {
    global: { plugins: [store], mocks: { $store: store, $router } },
  });
  return { wrapper, store, actions, calls, $router };
}

describe('App: инициализация сессии', () => {
  test('гость — менеджер уставок и конфигурация не загружаются', async () => {
    const { calls } = setup({ authenticated: false });
    await flushPromises();
    expect(calls).toEqual([]);
  });

  test('сессия уже восстановлена при запуске — менеджер уставок, затем конфигурация', async () => {
    const { calls } = setup({ authenticated: true });
    await flushPromises();
    expect(calls).toEqual(['initializeSetpointsManager', 'config/initialize']);
  });

  test('вход без перезагрузки страницы — инициализация после входа', async () => {
    const { store, calls } = setup({ authenticated: false });
    store.commit('SET_TOKEN', 'new-token');
    await flushPromises();
    expect(calls).toEqual(['initializeSetpointsManager', 'config/initialize']);
  });

  test('ошибка загрузки конфигурации — предупреждение пользователю', async () => {
    const { actions } = setup({ authenticated: true, failInit: true });
    await flushPromises();
    expect(actions.popupShow).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'warning', message: expect.stringContaining('Не удалось загрузить конфигурацию') }),
    );
  });
});

describe('App: меню пользователя', () => {
  test.each([
    ['profile', '/profile'],
    ['settings', '/preferences'],
  ])('пункт %s — закрыть меню и перейти на %s', async (action, path) => {
    const { wrapper, actions, $router } = setup({ authenticated: true });
    await wrapper.vm.onDropdownSelect({ action });
    expect(actions.dropdownHide).toHaveBeenCalled();
    expect($router.push).toHaveBeenCalledWith(path);
  });

  test('выход — auth/logout, затем переход на /login', async () => {
    const { wrapper, calls, $router } = setup({ authenticated: true });
    await flushPromises();
    await wrapper.vm.onDropdownSelect({ action: 'logout' });
    expect(calls).toContain('auth/logout');
    expect($router.push).toHaveBeenCalledWith('/login');
  });

  test('неизвестный пункт — без перехода', async () => {
    const { wrapper, $router } = setup({ authenticated: true });
    await wrapper.vm.onDropdownSelect({ action: 'nope' });
    expect($router.push).not.toHaveBeenCalled();
  });
});
