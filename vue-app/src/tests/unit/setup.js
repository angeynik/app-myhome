import { config } from '@vue/test-utils';

// Мок для глобальных компонентов и плагинов
config.global.mocks = {
  $store: {
    state: {},
    getters: {
      level: () => 2,
      isAuthenticated: () => true
    },
    dispatch: jest.fn(),
    commit: jest.fn()
  },
  $route: {
    path: '/',
    params: {}
  },
  $router: {
    push: jest.fn(),
    replace: jest.fn()
  }
};

config.global.stubs = {
  'router-link': true,
  'router-view': true
};