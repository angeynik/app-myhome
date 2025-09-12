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
// ——————————————————————————————————————————————————————————
// Добавляем переменные окружения для WebSocket URL
// ——————————————————————————————————————————————————————————
process.env.VUE_APP_EXP  = 'localhost';
process.env.VUE_APP_PORT = '1234';

// ——————————————————————————————————————————————————————————
// Мокаем глобальный WebSocket
// ——————————————————————————————————————————————————————————
class MockWebSocket {
  constructor(url) {
    this.url         = url;
    this.readyState  = MockWebSocket.CONNECTING;
    this.send        = jest.fn();
    this.close       = jest.fn();
    this.onerror     = null;
    this.onopen      = null;
    this.onclose     = null;
    this.onmessage   = null;

    // Эмулируем открытие через 0ms
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen && this.onopen();
    }, 0);
  }

  // Тестовые методы
  mockError(err = new Error('MockWebSocket error')) {
    this.readyState = MockWebSocket.CLOSED;
    this.onerror && this.onerror(err);
  }

  mockClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose && this.onclose();
  }
}


MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN       = 1;
MockWebSocket.CLOSING    = 2;
MockWebSocket.CLOSED     = 3;

global.WebSocket = MockWebSocket;