// tests/unit/websocket.spec.js
import { createStore } from 'vuex'
import flushPromises from 'flush-promises'
import websocket from '@/store/modules/websocket'

/**
 * Утилита для «соединения»: берём Promise от dispatch('connect'),
 * прогоняем все таймеры, ждём завершения промисов и возвращаем promise.
 */
async function establishConnection(store) {
  const connectPromise = store.dispatch('websocket/connect')
  jest.runAllTimers()
  await flushPromises()
  return connectPromise
}

/**
 * Сбрасываем «глобальный» state модуля между тестами
 */
function resetWebsocketState() {
  websocket.state.socket             = null
  websocket.state.reconnectAttempts  = 0
  websocket.state.explicitDisconnect = false
  websocket.state.pendingResponse    = null
}


describe('Vuex module websocket – интеграционные тесты', () => {
  let store

  beforeEach(() => {
    resetWebsocketState()
    jest.useFakeTimers()
    jest.clearAllTimers()

    store = createStore({
      modules: {
        websocket,
        config: {
          namespaced: true,
          actions: {
            handleConfigResponse: jest.fn(),
            handleSensorUpdate:   jest.fn()
          }
        }
      },
      getters: { dID: () => 'USER123' }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })


  it('connect: устанавливает socket, сбрасывает reconnectAttempts и резолвит правильным объектом', async () => {
    const connectPromise = store.dispatch('websocket/connect')

    jest.runAllTimers()
    await flushPromises()

    const sock = store.state.websocket.socket
    expect(sock).toBeInstanceOf(WebSocket)
    expect(store.state.websocket.reconnectAttempts).toBe(0)
    expect(sock.url).toMatch(/^ws:\/\/localhost:1234/)

    await expect(connectPromise)
      .resolves
      .toMatchObject({ url: sock.url })
  })


  it('send/auth: ставит pendingResponse и резолвит по loginSuccess', async () => {
    await establishConnection(store)

    const msg         = { type: 'auth', request: 'login' }
    const sendPromise = store.dispatch('websocket/send', msg)

    const pending = store.state.websocket.pendingResponse
    expect(pending.type).toBe('login')
    expect(typeof pending.resolve).toBe('function')

    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify({ request: 'loginSuccess', name: '', payload: {} })
    })

    await expect(sendPromise)
      .resolves
      .toMatchObject({ request: 'loginSuccess' })
    expect(store.state.websocket.pendingResponse).toBeNull()
  })


  it('handleMessage/config: диспатчит config/handleConfigResponse', async () => {
    const spy = jest.spyOn(store, 'dispatch')
    await establishConnection(store)

    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify({
        request: 'config',
        name:    '',
        payload: { foo: 'bar' }
      })
    })

    expect(spy).toHaveBeenCalledWith(
      'config/handleConfigResponse',
      expect.objectContaining({ payload: { foo: 'bar' } })
    )
  })


  it('handleMessage/post.sensor: обновляет только для совпадающего dID', async () => {
    const spy = jest.spyOn(store, 'dispatch')
    await establishConnection(store)

    // чужой dID — не диспатчится
    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify({
        type:    'post',
        request: 'sensor',
        name:    'OTHER',
        payload: { val: 1 }
      })
    })
    expect(spy).not.toHaveBeenCalledWith(
      'config/handleSensorUpdate',
      expect.anything()
    )

    // правильный dID — диспатчим
    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify({
        type:    'post',
        request: 'sensor',
        name:    'USER123',
        payload: { val: 42 }
      })
    })
    expect(spy).toHaveBeenCalledWith(
      'config/handleSensorUpdate',
      { dID: 'USER123', payload: { val: 42 } }
    )
  })


  it('disconnect: закрывает socket и помечает explicitDisconnect', async () => {
    await establishConnection(store)

    const sock = store.state.websocket.socket
    expect(sock.close).not.toHaveBeenCalled()

    store.dispatch('websocket/disconnect')
    expect(store.state.websocket.explicitDisconnect).toBe(true)
    expect(sock.close).toHaveBeenCalled()
  })


  it('getter isConnected корректно отражает состояние', async () => {
    expect(store.getters['websocket/isConnected']).toBe(false)
    await establishConnection(store)
    expect(store.getters['websocket/isConnected']).toBe(true)
  })
})


describe('Mutations', () => {
  let store, mockSocket

  beforeEach(() => {
    resetWebsocketState()
    store = createStore({ modules: { websocket } })
    mockSocket = { send: () => {}, close: () => {} }
  })

  it('SET_SOCKET устанавливает сокет', () => {
    store.commit('websocket/SET_SOCKET', mockSocket)
    expect(store.state.websocket.socket).toEqual(mockSocket)
  })

  it('SET_RECONNECT_ATTEMPTS устанавливает количество попыток переподключения', () => {
    store.commit('websocket/SET_RECONNECT_ATTEMPTS', 5)
    expect(store.state.websocket.reconnectAttempts).toBe(5)
  })
})


describe('Actions (unit)', () => {
  let store, handleConfigResponse, handleSensorUpdate

  beforeEach(() => {
    resetWebsocketState()
    jest.useFakeTimers()
    jest.clearAllTimers()

    handleConfigResponse = jest.fn()
    handleSensorUpdate   = jest.fn()

    store = createStore({
      modules: {
        websocket,
        config: {
          namespaced: true,
          actions: { handleConfigResponse, handleSensorUpdate }
        }
      },
      getters: { dID: () => 'test-dID' }
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })


  it('connect создает WebSocket соединение и сохраняет socket', async () => {
    const promise = store.dispatch('websocket/connect')
    jest.runAllTimers()
    await flushPromises()

    const inst = store.state.websocket.socket

    // promise должен вернуть объект, глубоко равный inst
    await expect(promise).resolves.toEqual(inst)

    // url должен совпадать с настройками окружения
    expect(inst.url).toBe(`ws://${process.env.VUE_APP_EXP}:${process.env.VUE_APP_PORT}`)
  })


  it('send отправляет сообщение через WebSocket без зависания', async () => {
    await establishConnection(store)

    const message = { type: 'test', request: 'test' }
    store.dispatch('websocket/send', message)

    expect(store.state.websocket.socket.send)
      .toHaveBeenCalledWith(JSON.stringify(message))
  })


  it('handleMessage обрабатывает сообщение config', async () => {
    await establishConnection(store)

    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify({ request: 'config' })
    })
    expect(handleConfigResponse).toHaveBeenCalled()
  })


  it('handleMessage обрабатывает сообщение sensor', async () => {
    await establishConnection(store)

    await store.dispatch('websocket/handleMessage', {
      data: JSON.stringify({
        type:    'post',
        request: 'sensor',
        name:    'test-dID',
        payload: { temperature: 25 }
      })
    })
    expect(handleSensorUpdate).toHaveBeenCalled()
  })
})
