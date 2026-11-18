import { createStore } from 'vuex'
import flushPromises from 'flush-promises'
import websocket from '@/store/modules/websocket'

function resetWebsocketState() {
  websocket.state.socket = null
  websocket.state.reconnectAttempts = 0
  websocket.state.explicitDisconnect = false
}

async function establishConnection(store) {
  const promise = store.dispatch('websocket/connect')
  jest.runAllTimers()
  await flushPromises()
  return promise
}

describe('🧩 Vuex WebSocket Module — Интеграционные тесты', () => {
  let store
  let configActions
  let logActions

  beforeEach(() => {
    resetWebsocketState()
    jest.useFakeTimers()
    jest.clearAllTimers()

    configActions = {
      handleConfigResponse: jest.fn(),
      handleValueUpdate: jest.fn()  // вместо handleSensorUpdate
    }

    logActions = {
      addError: jest.fn()
    }

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
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  test('connect: устанавливает socket и сбрасывает reconnectAttempts', async () => {
    const result = await establishConnection(store)
    expect(result).toBeInstanceOf(WebSocket)
    expect(store.state.websocket.reconnectAttempts).toBe(0)
    expect(result.url).toMatch(/^ws:\/\/localhost:1234/)
  })

  test('send: auth/login отправляется и ждёт loginSuccess', async () => {
    await establishConnection(store)
    const sock = store.state.websocket.socket

    const msg = { type: 'auth', request: 'login', payload: { username: 'u' } }
    const promise = store.dispatch('websocket/send', msg)
    await flushPromises()
    expect(sock.send).toHaveBeenCalledWith(JSON.stringify(msg))

    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify({ type: 'response', request: 'loginSuccess', name: '', payload: { dID: 'USER123' } })
    })

    await expect(promise).resolves.toMatchObject({ request: 'loginSuccess' })
  })

  test('send: loginError отклоняет ожидание с кодом и текстом сервера', async () => {
    await establishConnection(store)
    const promise = store.dispatch('websocket/send', { type: 'auth', request: 'login' })
    await flushPromises()

    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify({ type: 'error', request: 'loginError', payload: { code: 'BAD_CREDENTIALS', message: 'Неверный логин' } })
    })

    await expect(promise).rejects.toMatchObject({ code: 'BAD_CREDENTIALS', message: 'Неверный логин' })
  })

  test('send: нет ответа на auth-запрос — TIMEOUT через 15 с', async () => {
    await establishConnection(store)
    const promise = store.dispatch('websocket/send', { type: 'auth', request: 'login' })
    await flushPromises()
    jest.advanceTimersByTime(15000)
    await expect(promise).rejects.toMatchObject({ code: 'TIMEOUT' })
  })

  test('send: обычное сообщение — без ожидания ответа (null)', async () => {
    await establishConnection(store)
    const msg = { type: 'get', request: 'config', name: 'USER123' }
    await expect(store.dispatch('websocket/send', msg)).resolves.toBeNull()
    expect(store.state.websocket.socket.send).toHaveBeenCalledWith(JSON.stringify(msg))
  })

  test('handleMessage: config вызывает config/handleConfigResponse', async () => {
    await establishConnection(store)

    const message = {
      type: 'response',   // важно: type должен быть 'response'
      request: 'config',
      payload: { foo: 'bar' }
    }

    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify(message)
    })

    expect(configActions.handleConfigResponse).toHaveBeenCalledTimes(1)
    // Проверяем, что вызвано с правильным payload (второй аргумент - это response)
    const callArgs = configActions.handleConfigResponse.mock.calls[0]
    // Первый аргумент - контекст (не проверяем), второй - payload
    expect(callArgs[1]).toEqual(message)
  })

  test('handleMessage: sensor обновляет только при совпадающем dID', async () => {
    await establishConnection(store)

    const sensorMessage = {
      type: 'post',
      request: 'sensor',
      name: 'USER123',
      payload: { val: 42 }
    }

    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify(sensorMessage)
    })

    expect(configActions.handleValueUpdate).toHaveBeenCalledTimes(1)
    const callArgs = configActions.handleValueUpdate.mock.calls[0]
    // Второй аргумент - объект { dID, payload, type }
    expect(callArgs[1]).toEqual({
      dID: 'USER123',
      payload: { val: 42 },
      type: 'sensor'
    })
  })

  test('disconnect: закрывает сокет и помечает explicitDisconnect', async () => {
    await establishConnection(store)
    const sock = store.state.websocket.socket

    store.dispatch('websocket/disconnect')
    expect(sock.close).toHaveBeenCalled()
    expect(store.state.websocket.explicitDisconnect).toBe(true)
  })

  test('isConnected getter возвращает корректное состояние', async () => {
    expect(store.getters['websocket/isConnected']).toBe(false)
    await establishConnection(store)
    expect(store.getters['websocket/isConnected']).toBe(true)
  })

  test('handleMessage: невалидный JSON игнорируется без ошибки', async () => {
    await expect(store.dispatch('websocket/handleMessage', { data: 'not-json' })).resolves.toBeUndefined()
    expect(configActions.handleConfigResponse).not.toHaveBeenCalled()
    expect(configActions.handleValueUpdate).not.toHaveBeenCalled()
  })

  test('handleMessage: sensor с невалидным payload не вызывает update', async () => {
    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify({
        type: 'post',
        request: 'sensor',
        name: 'USER123',
        payload: null
      })
    })

    expect(configActions.handleValueUpdate).not.toHaveBeenCalled()
  })

  test('handleMessage: actuators обрабатывается как post-сообщение', async () => {
    await establishConnection(store)

    const msg = {
      type: 'post',
      request: 'actuators',
      name: 'USER123',
      payload: { value: 42 }
    }

    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify(msg)
    })

    expect(configActions.handleValueUpdate).toHaveBeenCalledTimes(1)
    const callArgs = configActions.handleValueUpdate.mock.calls[0]
    expect(callArgs[1]).toEqual({
      dID: 'USER123',
      payload: { value: 42 },
      type: 'actuators'
    })
  })

  test('send: без сокета вызывает ошибку', async () => {
    store.state.websocket.socket = null

    const failingConnect = jest.fn(async () => {
      throw new Error('WebSocket connection not established')
    })

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
    })

    await expect(
      failingStore.dispatch('websocket/send', { type: 'test' })
    ).rejects.toThrow('WebSocket connection not established')
  })

  test('connect: при открытом сокете возвращает его сразу', async () => {
    const mockSocket = new WebSocket('ws://localhost:1234')
    mockSocket.readyState = WebSocket.OPEN
    store.commit('websocket/SET_SOCKET', mockSocket)

    const result = await store.dispatch('websocket/connect')
    expect(result).toStrictEqual(mockSocket)
  })

  test('scheduleReconnect: задержка растёт вдвое с каждой попыткой (+ до 0,5 с случайно)', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0)
    const spy = jest.spyOn(global, 'setTimeout')
    store.commit('websocket/SET_RECONNECT_ATTEMPTS', 2)

    store.dispatch('websocket/scheduleReconnect')

    expect(spy).toHaveBeenCalledWith(expect.any(Function), 4000)
    expect(store.state.websocket.reconnectAttempts).toBe(3)
    jest.runOnlyPendingTimers()
  })

  test('scheduleReconnect: задержка не больше 30 с', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0)
    const spy = jest.spyOn(global, 'setTimeout')
    store.commit('websocket/SET_RECONNECT_ATTEMPTS', 10)

    store.dispatch('websocket/scheduleReconnect')

    expect(spy).toHaveBeenCalledWith(expect.any(Function), 30000)
    jest.runOnlyPendingTimers()
  })

  test('scheduleReconnect: после явного disconnect переподключения нет', async () => {
    const spy = jest.spyOn(global, 'setTimeout')
    store.state.websocket.explicitDisconnect = true
    store.dispatch('websocket/scheduleReconnect')
    expect(spy).not.toHaveBeenCalled()
  })
})