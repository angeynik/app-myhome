// src/tests/unit/notifications.spec.js
// Модуль notifications: конфигурация и статусы с сервера, события ON/OFF, флаг «прочитано»
// (только на клиенте, переживает перезагрузку), очередь окна, отправка create/edit/delete.

jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

import { createStore } from 'vuex';
import notifications, { notificationId } from '@/store/modules/notifications';

const ID = 'room01:sensors:dTemp01';
const ID2 = 'room02:sensors:dHum01';

function makeStore() {
  const send = jest.fn().mockResolvedValue(null);
  const store = createStore({
    modules: { notifications, websocket: { namespaced: true, actions: { send: (_, m) => send(m) } } },
    getters: { dID: () => 'igumen' },
  });
  return { store, send };
}

const event = (extra = {}) => ({
  id: ID, eventId: 'ev-1', status: 'ON', time: '2026-06-15T07:00:00.000Z', channel: 'web', value: 26,
  text: 'Гостиная · Температура: 26 °C (условие > 25 °C)', attachments: [], ...extra,
});

beforeEach(() => localStorage.clear());

describe('notifications: ответы сервера', () => {
  test('notification — конфигурация; без ответа конфигурации «нет»', async () => {
    const { store } = makeStore();
    expect(store.state.notifications.itemsLoaded).toBe(false);
    expect(await store.dispatch('notifications/handleResponse', { request: 'notification', payload: { [ID]: { id: ID, channel: 'web' } } })).toBe(true);
    expect(store.getters['notifications/itemOf'](ID)).toMatchObject({ id: ID });
    expect(store.state.notifications.itemsLoaded).toBe(true);
  });

  test('notificationStatus: read с сервера (всегда OFF) заменяется локальным для того же события', async () => {
    localStorage.setItem('notificationsRead:igumen', JSON.stringify({ [ID]: 'ev-1', [ID2]: 'old-event' }));
    const { store } = makeStore();
    await store.dispatch('notifications/handleResponse', {
      request: 'notificationStatus',
      payload: {
        [ID]: { status: 'ON', read: 'OFF', eventId: 'ev-1' },
        [ID2]: { status: 'ON', read: 'OFF', eventId: 'ev-9' }, // новое событие — снова непрочитано
      },
    });
    expect(store.getters['notifications/statusOf'](ID).read).toBe('ON');
    expect(store.getters['notifications/statusOf'](ID2).read).toBe('OFF');
  });

  test('чужие ответы не обрабатываются', async () => {
    const { store } = makeStore();
    expect(await store.dispatch('notifications/handleResponse', { request: 'config', payload: {} })).toBe(false);
  });
});

describe('notifications: события и очередь окна', () => {
  test('событие ON — активный статус, непрочитано, в очереди', async () => {
    const { store } = makeStore();
    await store.dispatch('notifications/handleEvent', event());
    expect(store.getters['notifications/isActive'](ID)).toBe(true);
    expect(store.getters['notifications/unread'].map((u) => u.id)).toEqual([ID]);
  });

  test('очередь: сначала самые свежие; канал telegram в окно не попадает (но обводка есть)', async () => {
    const { store } = makeStore();
    await store.dispatch('notifications/handleEvent', event({ time: '2026-06-15T07:00:00.000Z' }));
    await store.dispatch('notifications/handleEvent', event({ id: ID2, eventId: 'ev-2', time: '2026-06-15T08:00:00.000Z' }));
    await store.dispatch('notifications/handleEvent', event({ id: 'room03:sensors:dTemp01', eventId: 'ev-3', channel: 'telegram' }));
    expect(store.getters['notifications/unread'].map((u) => u.id)).toEqual([ID2, ID]);
    expect(store.getters['notifications/isActive']('room03:sensors:dTemp01')).toBe(true);
  });

  test('закрыли окно — прочитано ON (статус остаётся ON), запомнено в localStorage', async () => {
    const { store } = makeStore();
    await store.dispatch('notifications/handleEvent', event());
    await store.dispatch('notifications/markRead', ID);
    expect(store.getters['notifications/statusOf'](ID)).toMatchObject({ status: 'ON', read: 'ON' });
    expect(store.getters['notifications/unread']).toEqual([]);
    expect(JSON.parse(localStorage.getItem('notificationsRead:igumen'))).toEqual({ [ID]: 'ev-1' });
  });

  test('сброс OFF — статус и прочитано OFF, локальная отметка и кадры удаляются', async () => {
    const { store } = makeStore();
    await store.dispatch('notifications/handleEvent', event({ attachments: [{ cameraId: 'cam01' }] }));
    await store.dispatch('notifications/markRead', ID);
    store.commit('notifications/SET_SNAPSHOT', { id: ID, cameraId: 'cam01', image: 'AAA', mimeType: 'image/jpeg' });

    await store.dispatch('notifications/handleEvent', event({ status: 'OFF', reason: 'condition' }));

    expect(store.getters['notifications/statusOf'](ID)).toMatchObject({ status: 'OFF', read: 'OFF' });
    expect(store.getters['notifications/isActive'](ID)).toBe(false);
    expect(JSON.parse(localStorage.getItem('notificationsRead:igumen'))).toEqual({});
    expect(store.getters['notifications/snapshotOf'](ID, 'cam01')).toBeNull();
  });

  test('условие удалено (delete): статус ON держится до сброса от сервера; сброс removed — OFF', async () => {
    const { store } = makeStore();
    await store.dispatch('notifications/handleEvent', event());
    await store.dispatch('notifications/markRead', ID);
    await store.dispatch('notifications/save', { action: 'delete', configData: { room: 'room01', section: 'sensors', item: 'dTemp01' } });
    await store.dispatch('notifications/handleResponse', { request: 'notification', payload: {} }); // конфигурация без условия
    expect(store.getters['notifications/statusOf'](ID)).toMatchObject({ status: 'ON', read: 'ON' });

    await store.dispatch('notifications/handleEvent', event({ status: 'OFF', reason: 'removed' }));
    expect(store.getters['notifications/statusOf'](ID)).toMatchObject({ status: 'OFF', read: 'OFF' });
    expect(store.getters['notifications/isActive'](ID)).toBe(false);
  });

  test('событие без id или с неизвестным статусом игнорируется', async () => {
    const { store } = makeStore();
    await store.dispatch('notifications/handleEvent', { status: 'ON' });
    await store.dispatch('notifications/handleEvent', { id: ID, status: 'MAYBE' });
    expect(store.state.notifications.statuses).toEqual({});
  });
});

describe('notifications: запросы к серверу', () => {
  test('save — post/notification с action и configData', async () => {
    const { store, send } = makeStore();
    const configData = { room: 'room01', section: 'sensors', item: 'dTemp01', condition: { op: 'gt', value: 25 } };
    await store.dispatch('notifications/save', { action: 'create', configData });
    expect(send).toHaveBeenCalledWith({ type: 'post', request: 'notification', name: 'igumen', payload: { action: 'create', configData } });
  });

  test('requestSnapshot — get/notificationSnapshot, повторно не запрашивается', async () => {
    const { store, send } = makeStore();
    await store.dispatch('notifications/requestSnapshot', { id: ID, cameraId: 'cam01' });
    expect(send).toHaveBeenCalledWith({ type: 'get', request: 'notificationSnapshot', name: 'igumen', payload: { id: ID, cameraId: 'cam01' } });
    await store.dispatch('notifications/handleResponse', { request: 'notificationSnapshot', payload: { id: ID, cameraId: 'cam01', image: 'AAA', mimeType: 'image/jpeg' } });
    await store.dispatch('notifications/requestSnapshot', { id: ID, cameraId: 'cam01' });
    expect(send).toHaveBeenCalledTimes(1);
  });

  test('редактор: открыть с целью, закрыть; RESET очищает всё', async () => {
    const { store } = makeStore();
    await store.dispatch('notifications/openEditor', { id: ID });
    expect(store.getters['notifications/editor']).toEqual({ open: true, target: { id: ID } });
    await store.dispatch('notifications/handleEvent', event());
    store.commit('notifications/RESET');
    expect(store.getters['notifications/editor'].open).toBe(false);
    expect(store.state.notifications.statuses).toEqual({});
  });

  test('notificationId — как на сервере', () => {
    expect(notificationId('room01', 'sensors', 'dTemp01')).toBe(ID);
  });
});
