import { config } from '@vue/test-utils';

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

process.env.VUE_APP_EXP = 'localhost';
process.env.VUE_APP_PORT = '1234';

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.send = jest.fn();
    this.close = jest.fn();
    this.onerror = null;
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;

    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (typeof this.onopen === 'function') {
        this.onopen();
      }
    }, 0);
  }

  mockError(err = new Error('MockWebSocket error')) {
    this.readyState = MockWebSocket.CLOSED;
    if (typeof this.onerror === 'function') {
      this.onerror(err);
    }
  }

  mockClose() {
    this.readyState = MockWebSocket.CLOSED;
    if (typeof this.onclose === 'function') {
      this.onclose();
    }
  }
}

MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;

global.WebSocket = MockWebSocket;
