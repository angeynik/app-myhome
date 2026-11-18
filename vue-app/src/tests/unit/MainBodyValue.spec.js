// src/tests/unit/MainBodyValue.spec.js
// Плашка: иконка — экран уведомления, название/значения — уставка; красная обводка при активном
// уведомлении, метка — если уведомление настроено.

import { mount } from '@vue/test-utils';
import MainBodyValue from '@/components/MainBodyValue.vue';

const mountCard = (props = {}) => mount(MainBodyValue, {
  props: { paramTitle: 'Температура', paramKey: 'dTemp01', value: 22.5, ...props },
  global: { stubs: { SensorIcon: true } },
});

describe('MainBodyValue', () => {
  test('нажатие на иконку — icon-click (без content-click)', async () => {
    const w = mountCard();
    await w.find('.sensor-icon-wrapper').trigger('click');
    expect(w.emitted('icon-click')).toHaveLength(1);
    expect(w.emitted('content-click')).toBeUndefined();
  });

  test('нажатие на название и значения — content-click', async () => {
    const w = mountCard();
    await w.find('.sensor-content').trigger('click');
    expect(w.emitted('content-click')).toHaveLength(1);
    expect(w.emitted('icon-click')).toBeUndefined();
  });

  test('иконка доступна с клавиатуры (Enter)', async () => {
    const w = mountCard();
    await w.find('.sensor-icon-wrapper').trigger('keydown.enter');
    expect(w.emitted('icon-click')).toHaveLength(1);
  });

  test('активное уведомление — красная обводка; сброшено — исходный вид', async () => {
    const w = mountCard({ notificationActive: true });
    expect(w.find('.sensor-card').classes()).toContain('has-notification');
    await w.setProps({ notificationActive: false });
    expect(w.find('.sensor-card').classes()).not.toContain('has-notification');
  });

  test('настроенное уведомление — метка на иконке', async () => {
    const w = mountCard();
    expect(w.find('.sensor-notify-mark').exists()).toBe(false);
    await w.setProps({ notificationConfigured: true });
    expect(w.find('.sensor-notify-mark').exists()).toBe(true);
  });
});
