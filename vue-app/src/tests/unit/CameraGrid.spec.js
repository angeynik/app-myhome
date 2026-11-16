// src/tests/unit/CameraGrid.spec.js
// Вкладка камер: запрос списка, подписка на видимые карточки, полный экран, отписка при уходе.
// В jsdom нет IntersectionObserver — компонент подписывается на все карточки.

jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import video from '@/store/modules/video';
import CameraGrid from '@/components/CameraGrid.vue';

function setup(cameras = [{ id: 'cam01', title: 'Ворота', previewIntervalMs: 5000 }, { id: 'cam02', title: 'Двор', previewIntervalMs: 5000 }]) {
  const send = jest.fn().mockResolvedValue(null);
  const store = createStore({
    modules: { video, websocket: { namespaced: true, actions: { send: (_, m) => send(m) } } },
    getters: { dID: () => 'igumen' },
  });
  store.commit('video/SET_CAMERAS', cameras);
  const wrapper = mount(CameraGrid, {
    global: { plugins: [store], mocks: { $store: store }, stubs: { teleport: true } },
  });
  const subscriptions = () => send.mock.calls.map(([m]) => m).filter((m) => m.request === 'videoSubscribe').map((m) => m.payload);
  return { store, send, wrapper, subscriptions };
}

describe('CameraGrid', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('при открытии запрашивает список камер и подписывается на миниатюры всех карточек', async () => {
    const { send, wrapper, subscriptions } = setup();
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ request: 'videoCameras' }));
    jest.advanceTimersByTime(300);
    await Promise.resolve();
    expect(subscriptions()).toEqual([{ cameras: ['cam01', 'cam02'], full: null }]);
    expect(wrapper.findAll('.camera-card')).toHaveLength(2);
  });

  test('карточка показывает кадр и время; без кадра — ожидание', async () => {
    const { store, wrapper } = setup();
    expect(wrapper.text()).toContain('Ожидание кадра');
    await store.dispatch('video/handleSnapshot', { cameraId: 'cam01', image: 'QUJD', mimeType: 'image/jpeg', size: 3, timestamp: Date.now() });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('img.camera-thumb').attributes('src')).toBe('data:image/jpeg;base64,QUJD');
  });

  test('клик по камере — полный экран (full), закрытие — обратно к миниатюрам', async () => {
    const { wrapper, subscriptions } = setup();
    jest.advanceTimersByTime(300);
    await wrapper.findAll('.camera-card')[1].trigger('click');
    await Promise.resolve();
    expect(subscriptions().at(-1)).toEqual({ cameras: ['cam01', 'cam02'], full: 'cam02' });
    wrapper.vm.closeFull();
    await Promise.resolve();
    expect(subscriptions().at(-1)).toEqual({ cameras: ['cam01', 'cam02'], full: null });
  });

  test('уход с вкладки — пустая подписка', async () => {
    const { wrapper, subscriptions } = setup();
    jest.advanceTimersByTime(300);
    wrapper.unmount();
    await Promise.resolve();
    expect(subscriptions().at(-1)).toEqual({ cameras: [], full: null });
  });

  test('устаревший кадр — карточка «нет сигнала»', async () => {
    const { store, wrapper } = setup();
    await store.dispatch('video/handleSnapshot', { cameraId: 'cam01', image: 'QUJD', mimeType: 'image/jpeg', size: 3, timestamp: Date.now() - 60000 });
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.camera-card')[0].classes()).toContain('camera-card--offline');
  });

  test('камер нет — текст пустого состояния', () => {
    const { wrapper } = setup([]);
    expect(wrapper.text()).toContain('Камеры не настроены');
  });
});
