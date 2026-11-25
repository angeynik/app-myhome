// src/tests/unit/AppSettings.spec.js
// Экран «Настройки»: плашка версии сборки — первой, перед «Темой оформления».

process.env.VUE_APP_VERSION = '0.0.3.3';
process.env.VUE_APP_COMMIT = 'abc1234';

import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import AppSettings from '@/components/AppSettings.vue';

function mountSettings() {
  const store = createStore({
    modules: {
      appearance: { namespaced: true, getters: { bgTheme: () => 'default', customColor: () => '#000000' }, actions: { setTheme: jest.fn(), setColor: jest.fn() } },
      config: { namespaced: true, getters: { deviceMode: () => 'auto', isMobile: () => false }, actions: { setDeviceMode: jest.fn() } },
    },
  });
  return mount(AppSettings, { global: { plugins: [store], mocks: { $store: store, $router: { back: jest.fn(), push: jest.fn() } } } });
}

describe('AppSettings: версия', () => {
  test('версия и сборка — первая плашка, перед «Темой оформления»', () => {
    const w = mountSettings();
    const titles = w.findAll('.settings-group-title').map((t) => t.text());
    expect(titles.slice(0, 2)).toEqual(['Версия', 'Тема оформления']);
    expect(w.find('[data-test="version"]').text()).toContain('0.0.3.3');
    expect(w.find('[data-test="version"]').text()).toContain('сборка abc1234');
  });
});
