// src/tests/unit/NotificationPopup.spec.js
// Окно уведомлений: по одному, свежие первыми; закрытие — прочитано, затем следующее; кадры камер.

jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

import { mount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import notifications from '@/store/modules/notifications';
import NotificationPopup from '@/components/NotificationPopup.vue';

function setup() {
  const send = jest.fn().mockResolvedValue(null);
  const store = createStore({
    modules: { notifications, websocket: { namespaced: true, actions: { send: (_, m) => send(m) } } },
    getters: { dID: () => 'igumen' },
  });
  const wrapper = mount(NotificationPopup, { global: { plugins: [store], mocks: { $store: store } } });
  const fire = (id, time, extra = {}) => store.dispatch('notifications/handleEvent', {
    id, eventId: `ev-${id}`, status: 'ON', time, channel: 'web', text: `Событие ${id}`, attachments: [], ...extra,
  });
  return { wrapper, store, send, fire };
}

beforeEach(() => localStorage.clear());

describe('NotificationPopup', () => {
  test('нет непрочитанных — окна нет', () => {
    expect(setup().wrapper.find('.notification-popup').exists()).toBe(false);
  });

  test('несколько — самое свежее первым, счётчик; закрытие показывает следующее', async () => {
    const { wrapper, store, fire } = setup();
    await fire('a', '2026-06-15T07:00:00.000Z');
    await fire('b', '2026-06-15T09:00:00.000Z');
    await flushPromises();
    expect(wrapper.find('.notification-popup-text').text()).toBe('Событие b');
    expect(wrapper.find('.notification-popup-count').text()).toBe('1 из 2');
    expect(wrapper.find('.notification-popup-time').text()).toContain('15.06.2026');

    await wrapper.find('[data-test="close"]').trigger('click');
    expect(store.getters['notifications/statusOf']('b').read).toBe('ON');
    expect(wrapper.find('.notification-popup-text').text()).toBe('Событие a');

    await wrapper.find('[data-test="close"]').trigger('click');
    expect(wrapper.find('.notification-popup').exists()).toBe(false);
  });

  test('кадры камер запрашиваются при показе и выводятся', async () => {
    const { wrapper, store, send, fire } = setup();
    await fire('a', '2026-06-15T07:00:00.000Z', { attachments: [{ cameraId: 'cam01', title: 'Ворота' }] });
    await flushPromises();
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ request: 'notificationSnapshot', payload: { id: 'a', cameraId: 'cam01' } }));
    expect(wrapper.text()).toContain('Загрузка кадра');

    await store.dispatch('notifications/handleResponse', {
      request: 'notificationSnapshot', payload: { id: 'a', cameraId: 'cam01', image: 'QUJD', mimeType: 'image/jpeg' },
    });
    await flushPromises();
    expect(wrapper.find('img').attributes('src')).toBe('data:image/jpeg;base64,QUJD');
    expect(wrapper.find('figcaption').text()).toBe('Ворота');
  });
});
