// src/tests/unit/NotificationScreen.spec.js
// Экран уведомления: новое (переключатель → условия), существующее (видно и правится),
// сохранение при закрытии: create / edit / delete, проверка неполных данных.

jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

import { mount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import notifications from '@/store/modules/notifications';
import NotificationScreen from '@/components/NotificationScreen.vue';

const ID = 'room01:sensors:dTemp01';
const TARGET = {
  id: ID, room: 'room01', section: 'sensors', item: 'dTemp01', group: 'Гостиная',
  roomTitle: 'Гостиная', title: 'Температура', unit: '°C', value: 22.5,
};
const EXISTING = {
  id: ID, room: 'room01', section: 'sensors', item: 'dTemp01', condition: { op: 'lt', value: 10 },
  intervals: [{ from: '22:00', to: '06:00' }], periods: [{ type: 'weekDays', days: [6, 7] }], cameras: ['cam01'], channel: 'both',
};

async function setup({ target = TARGET, existing = null, cameras = [{ id: 'cam01', title: 'Ворота' }] } = {}) {
  const send = jest.fn().mockResolvedValue(null);
  const store = createStore({
    modules: {
      notifications,
      websocket: { namespaced: true, actions: { send: (_, m) => send(m) } },
      video: { namespaced: true, getters: { cameras: () => cameras, camerasLoaded: () => true }, actions: { requestCameras: jest.fn() } },
      popup: { namespaced: true, actions: { show: jest.fn() } },
    },
    getters: { dID: () => 'igumen' },
  });
  if (existing) store.commit('notifications/SET_ITEMS', { [ID]: existing });
  const wrapper = mount(NotificationScreen, {
    global: { plugins: [store], mocks: { $store: store }, stubs: { teleport: true } },
  });
  await store.dispatch('notifications/openEditor', target);
  await flushPromises();
  const posts = () => send.mock.calls.map(([m]) => m).filter((m) => m.request === 'notification').map((m) => m.payload);
  const close = async () => { await wrapper.find('.setpoint-close').trigger('click'); await flushPromises(); };
  return { wrapper, store, posts, close };
}

describe('NotificationScreen: новое уведомление', () => {
  test('по умолчанию OFF: условий не видно; закрытие — ничего не отправляется', async () => {
    const { wrapper, posts, close, store } = await setup();
    expect(wrapper.text()).toContain('Гостиная');
    expect(wrapper.find('[data-test="value"]').exists()).toBe(false);
    await close();
    expect(posts()).toEqual([]);
    expect(store.getters['notifications/editor'].open).toBe(false);
  });

  test('ON → по умолчанию: условие ≠, текущее значение, канал Веб, остальное не выбрано', async () => {
    const { wrapper, posts, close } = await setup();
    await wrapper.find('[data-test="enabled"]').setValue(true);
    expect(wrapper.find('[data-test="op-ne"]').classes()).toContain('active');
    expect(wrapper.find('[data-test="value"]').element.value).toBe('22.5');
    expect(wrapper.find('[data-test="channel-web"]').classes()).toContain('active');
    expect(wrapper.findAll('.notification-period')).toHaveLength(0);
    expect(wrapper.findAll('.notification-chip.active').map((c) => c.text())).toEqual(['≠', 'Веб']);
    await close();
    expect(posts()).toEqual([{
      action: 'create',
      configData: expect.objectContaining({
        condition: { op: 'ne', value: 22.5 }, intervals: [], periods: [], cameras: [], channel: 'web',
      }),
    }]);
  });

  test('значение стёрли — закрыть без него нельзя', async () => {
    const { wrapper, posts, close, store } = await setup();
    await wrapper.find('[data-test="enabled"]').setValue(true);
    await wrapper.find('[data-test="value"]').setValue('');
    await close();
    expect(wrapper.find('.notification-error').text()).toBe('Укажите значение условия');
    expect(store.getters['notifications/editor'].open).toBe(true);
    expect(posts()).toEqual([]);
  });

  test('ON → условия с текущим значением; закрытие — create со всеми данными и идентификаторами', async () => {
    const { wrapper, posts, close } = await setup();
    await wrapper.find('[data-test="enabled"]').setValue(true);
    expect(wrapper.find('[data-test="value"]').element.value).toBe('22.5');

    await wrapper.find('[data-test="op-gte"]').trigger('click');
    await wrapper.find('[data-test="value"]').setValue('25');
    await wrapper.find('[data-test="add-interval"]').trigger('click');
    await wrapper.find('[data-test="add-weekDays"]').trigger('click');
    await wrapper.findAll('.notification-period .notification-chip')[0].trigger('click'); // Пн
    await wrapper.findAll('.notification-chip').find((b) => b.text() === 'Ворота').trigger('click');
    await wrapper.find('[data-test="channel-both"]').trigger('click');
    await close();

    expect(posts()).toEqual([{
      action: 'create',
      configData: {
        group: 'Гостиная', room: 'room01', section: 'sensors', item: 'dTemp01',
        roomTitle: 'Гостиная', title: 'Температура', unit: '°C',
        condition: { op: 'gte', value: 25 },
        intervals: [{ from: '08:00', to: '20:00' }],
        periods: [{ type: 'weekDays', days: [1] }],
        cameras: ['cam01'],
        channel: 'both',
      },
    }]);
  });

  test('логический параметр (ON/OFF): условие ≠ по умолчанию, выбор ON/OFF', async () => {
    const { wrapper, posts, close } = await setup({ target: { ...TARGET, item: 'dLeak01', id: 'room01:sensors:dLeak01', value: 'OFF', unit: '' } });
    await wrapper.find('[data-test="enabled"]').setValue(true);
    expect(wrapper.find('[data-test="value"]').exists()).toBe(false);
    await wrapper.findAll('.notification-value .notification-chip').find((b) => b.text() === 'ON').trigger('click');
    await close();
    expect(posts()[0].configData.condition).toEqual({ op: 'ne', value: true });
  });

  test('неполные данные — сообщение, экран не закрывается, ничего не отправлено', async () => {
    const { wrapper, posts, close, store } = await setup();
    await wrapper.find('[data-test="enabled"]').setValue(true);
    await wrapper.find('[data-test="add-monthDays"]').trigger('click'); // без выбранных чисел
    await close();
    expect(wrapper.find('.notification-error').text()).toContain('выберите хотя бы один день');
    expect(store.getters['notifications/editor'].open).toBe(true);
    expect(posts()).toEqual([]);
  });
});

describe('NotificationScreen: существующее уведомление', () => {
  test('условия видны; без изменений — закрытие ничего не отправляет', async () => {
    const { wrapper, posts, close } = await setup({ existing: EXISTING });
    expect(wrapper.find('[data-test="enabled"]').element.checked).toBe(true);
    expect(wrapper.find('[data-test="value"]').element.value).toBe('10');
    expect(wrapper.find('[data-test="op-lt"]').classes()).toContain('active');
    expect(wrapper.find('[data-test="channel-both"]').classes()).toContain('active');
    await close();
    expect(posts()).toEqual([]);
  });

  test('изменили — edit', async () => {
    const { wrapper, posts, close } = await setup({ existing: EXISTING });
    await wrapper.find('[data-test="channel-web"]').trigger('click');
    await close();
    expect(posts()).toHaveLength(1);
    expect(posts()[0]).toMatchObject({ action: 'edit', configData: { channel: 'web', condition: { op: 'lt', value: 10 } } });
  });

  test('выключили — delete по комнате, разделу и параметру', async () => {
    const { wrapper, posts, close } = await setup({ existing: EXISTING });
    await wrapper.find('[data-test="enabled"]').setValue(false);
    expect(wrapper.text()).toContain('будет удалено на сервере');
    await close();
    expect(posts()).toEqual([{ action: 'delete', configData: { room: 'room01', section: 'sensors', item: 'dTemp01' } }]);
  });
});
