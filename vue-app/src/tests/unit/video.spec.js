// src/tests/unit/video.spec.js
// Модуль video: список камер, кадры по камерам, подписка и её восстановление.

jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

import { createStore } from 'vuex';
import video from '@/store/modules/video';
import { MAIN_TABS } from '@/utils/mainTabs';

function makeStore() {
  const send = jest.fn().mockResolvedValue(null);
  const store = createStore({
    modules: {
      video,
      websocket: { namespaced: true, actions: { send: (_, msg) => send(msg) } },
    },
    getters: { dID: () => 'igumen' },
  });
  return { store, send };
}

const frame = (cameraId, extra = {}) => ({
  cameraId, title: `Камера ${cameraId}`, image: 'QUJD', mimeType: 'image/jpeg', size: 3, timestamp: 1000, ...extra,
});

describe('video: ответы сервера', () => {
  test('videoCameras сохраняет список, camerasLoaded = true', async () => {
    const { store } = makeStore();
    expect(store.getters['video/camerasLoaded']).toBe(false);
    const handled = await store.dispatch('video/handleResponse', {
      type: 'response', request: 'videoCameras', payload: { cameras: [{ id: 'cam01', title: 'Ворота' }] },
    });
    expect(handled).toBe(true);
    expect(store.getters['video/cameras']).toEqual([{ id: 'cam01', title: 'Ворота' }]);
    expect(store.getters['video/camerasLoaded']).toBe(true);
  });

  test('videoSubscribeSuccess запоминает принятую подписку', async () => {
    const { store } = makeStore();
    await store.dispatch('video/handleResponse', { request: 'videoSubscribeSuccess', payload: { cameras: ['cam01'], full: null } });
    expect(store.getters['video/subscription']).toEqual({ cameras: ['cam01'], full: null });
  });

  test('чужие ответы не обрабатываются (идут в config)', async () => {
    const { store } = makeStore();
    expect(await store.dispatch('video/handleResponse', { request: 'config', payload: {} })).toBe(false);
  });
});

describe('video: кадры', () => {
  test('кадры хранятся по камерам; getSnapshot — последний кадр (прежний интерфейс)', async () => {
    const { store } = makeStore();
    await store.dispatch('video/handleSnapshot', frame('cam01', { timestamp: 1 }));
    await store.dispatch('video/handleSnapshot', frame('cam02', { timestamp: 2 }));
    expect(store.getters['video/snapshotOf']('cam01').timestamp).toBe(1);
    expect(store.getters['video/snapshotOf']('cam02').timestamp).toBe(2);
    expect(store.getters['video/getSnapshot'].timestamp).toBe(2);
    expect(store.getters['video/hasSnapshot']).toBe(true);
  });

  test('кадр без изображения игнорируется', async () => {
    const { store } = makeStore();
    await store.dispatch('video/handleSnapshot', { cameraId: 'cam01' });
    expect(store.getters['video/snapshotOf']('cam01')).toBeNull();
  });

  test('RESET очищает всё', async () => {
    const { store } = makeStore();
    await store.dispatch('video/handleSnapshot', frame('cam01'));
    store.commit('video/RESET');
    expect(store.getters['video/hasSnapshot']).toBe(false);
    expect(store.getters['video/cameras']).toEqual([]);
  });
});

describe('video: подписка', () => {
  test('отправляет post/videoSubscribe с dID', async () => {
    const { store, send } = makeStore();
    await store.dispatch('video/subscribe', { cameras: ['cam01', 'cam02', 'cam01'], full: 'cam02' });
    expect(send).toHaveBeenCalledWith({
      type: 'post', request: 'videoSubscribe', name: 'igumen', payload: { cameras: ['cam01', 'cam02'], full: 'cam02' },
    });
  });

  test('одинаковая подписка повторно не отправляется (порядок не важен)', async () => {
    const { store, send } = makeStore();
    await store.dispatch('video/subscribe', { cameras: ['cam01', 'cam02'] });
    await store.dispatch('video/subscribe', { cameras: ['cam02', 'cam01'] });
    expect(send).toHaveBeenCalledTimes(1);
    await store.dispatch('video/subscribe', { cameras: ['cam02', 'cam01'], full: 'cam01' });
    expect(send).toHaveBeenCalledTimes(2);
  });

  test('resubscribe после переподключения отправляет последнюю подписку заново', async () => {
    const { store, send } = makeStore();
    await store.dispatch('video/subscribe', { cameras: ['cam03'], full: null });
    await store.dispatch('video/resubscribe');
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].payload).toEqual({ cameras: ['cam03'], full: null });
  });

  test('resubscribe без подписки ничего не отправляет', async () => {
    const { store, send } = makeStore();
    await store.dispatch('video/resubscribe');
    expect(send).not.toHaveBeenCalled();
  });

  test('requestCameras отправляет get/videoCameras', async () => {
    const { store, send } = makeStore();
    await store.dispatch('video/requestCameras');
    expect(send).toHaveBeenCalledWith({ type: 'get', request: 'videoCameras', name: 'igumen', payload: {} });
  });
});

describe('mainTabs: вкладка камер', () => {
  test('есть вкладка «Видеонаблюдение» с признаком cameras', () => {
    expect(MAIN_TABS.find((t) => t.key === 'cameras')).toMatchObject({ label: 'Видеонаблюдение', cameras: true });
  });
});
