import { createStore } from 'vuex';
import flushPromises from 'flush-promises';
import websocket from '@/store/modules/websocket';

function resetWebsocketState() {
  websocket.state.socket = null;
  websocket.state.reconnectAttempts = 0;
  websocket.state.explicitDisconnect = false;
  websocket.state.pendingResponse = null;
}

async function establishConnection(store) {
  const promise = store.dispatch('websocket/connect');
  jest.runAllTimers();
  await flushPromises();
  return promise;
}

describe('🧩 Vuex WebSocket Module — Интеграционные тесты', () => {
  let store;
  let configActions;
  let logActions;

  beforeEach(() => {
    resetWebsocketState();
    jest.useFakeTimers();
    jest.clearAllTimers();

    configActions = {
      handleConfigResponse: jest.fn(),
      handleSensorUpdate: jest.fn()
    };

    logActions = {
      addError: jest.fn()
    };

    store = createStore({
      modules: {
        websocket,
        config: {
          namespaced: true,
          actions: configActions
        },
        log: {
          namespaced: true,
          actions: logActions
        }
      },
      getters: {
        dID: () => 'USER123'
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('connect: устанавливает socket и сбрасывает reconnectAttempts', async () => {
    const result = await establishConnection(store);
    expect(result).toBeInstanceOf(WebSocket);
    expect(store.state.websocket.reconnectAttempts).toBe(0);
    expect(result.url).toMatch(/^ws:\/\/localhost:1234/);
  });

  test('send: ставит pendingResponse и резолвит loginSuccess', async () => {
    await establishConnection(store);

    const msg = { type: 'auth', request: 'login' };
    const promise = store.dispatch('websocket/send', msg);

    expect(store.state.websocket.pendingResponse.type).toBe('login');

    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify({ request: 'loginSuccess', name: '', payload: {} })
    });

    await expect(promise).resolves.toMatchObject({ request: 'loginSuccess' });
    expect(store.state.websocket.pendingResponse).toBeNull();
  });

  test('handleMessage: config вызывает config/handleConfigResponse', async () => {
    await establishConnection(store);

    const message = {
      request: 'config',
      payload: { foo: 'bar' }
    };

    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify(message)
    });

    const [context, payload] = configActions.handleConfigResponse.mock.calls[0];
    expect(payload).toEqual(message);
  });

  test('handleMessage: sensor обновляет только при совпадающем dID', async () => {
    await establishConnection(store);

    const sensorMessage = {
      type: 'post',
      request: 'sensor',
      name: 'USER123',
      payload: { val: 42 }
    };

    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify(sensorMessage)
    });

    const [context, payload] = configActions.handleSensorUpdate.mock.calls[0];
    expect(payload).toEqual({
      dID: 'USER123',
      payload: { val: 42 }
    });
  });

  test('disconnect: закрывает сокет и помечает explicitDisconnect', async () => {
    await establishConnection(store);
    const sock = store.state.websocket.socket;

    store.dispatch('websocket/disconnect');
    expect(sock.close).toHaveBeenCalled();
    expect(store.state.websocket.explicitDisconnect).toBe(true);
  });

  test('isConnected getter возвращает корректное состояние', async () => {
    expect(store.getters['websocket/isConnected']).toBe(false);
    await establishConnection(store);
    expect(store.getters['websocket/isConnected']).toBe(true);
  });

  test('handleMessage: невалидный JSON вызывает log/addError', async () => {
    await store.dispatch('websocket/handleMessage', { data: 'not-json' });

    const [context, error] = logActions.addError.mock.calls[0];
    expect(error).toBeInstanceOf(SyntaxError);
  });

  test('handleMessage: sensor с невалидным payload не вызывает update', async () => {
    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify({
        type: 'post',
        request: 'sensor',
        name: 'USER123',
        payload: null
      })
    });

    expect(configActions.handleSensorUpdate).not.toHaveBeenCalled();
  });

  test('handleMessage: actuators не логируется из-за раннего return в ветке sensor', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify({
        type: 'post',
        request: 'actuators',
        name: 'USER123',
        payload: { value: 42 }
      })
    });

    const calls = logSpy.mock.calls.map(args => args.join(' '));
    const hasActuatorsLog = calls.some(call =>
      call.includes('[WebSocket] Received request === actuators')
    );
    expect(hasActuatorsLog).toBe(false);

    const hasSensorBranchEarlyReturnLog = calls.some(call =>
      call.includes('[WebSocket] dID сообщения запроса') &&
      call.includes('не соответствует dID текущего пользователя')
    );
    expect(hasSensorBranchEarlyReturnLog).toBe(true);

    logSpy.mockRestore();
  });

  test('send: без сокета вызывает ошибку', async () => {
    store.state.websocket.socket = null;

    // Подменяем экшен connect в модуле до создания store
    const failingConnect = jest.fn(async () => {
      throw new Error('WebSocket connection not established');
    });

    const failingStore = createStore({
      modules: {
        websocket: {
          ...websocket,
          actions: {
            ...websocket.actions,
            connect: failingConnect
          }
        },
        config: {
          namespaced: true,
          actions: configActions
        },
        log: {
          namespaced: true,
          actions: logActions
        }
      },
      getters: {
        dID: () => 'USER123'
      }
    });

    await expect(failingStore.dispatch('websocket/send', { type: 'test' }))
      .rejects.toThrow('WebSocket connection not established');
  });

  test('connect: при открытом сокете возвращает его сразу', async () => {
    const mockSocket = new WebSocket('ws://localhost:1234');
    mockSocket.readyState = WebSocket.OPEN;
    store.commit('websocket/SET_SOCKET', mockSocket);

    const result = await store.dispatch('websocket/connect');
    expect(result).toStrictEqual(mockSocket);
  });

  test('connect: с reconnectAttempts > 0 вызывает задержку', async () => {
    store.commit('websocket/SET_RECONNECT_ATTEMPTS', 2);
    const spy = jest.spyOn(global, 'setTimeout');

    store.dispatch('websocket/connect');
    jest.runAllTimers();

    expect(spy).toHaveBeenCalledWith(expect.any(Function), 4000);
  });
});
