// src/tests/unit/mainTabs.spec.js
// Доступные вкладки главного экрана и их переключение в MainView:
// «Видеонаблюдение» — только при наличии камер.

jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

import { availableTabKeys, DEFAULT_TAB } from '@/utils/mainTabs';
import MainView from '@/components/MainView.vue';

describe('availableTabKeys', () => {
  test('камер нет (список получен) — вкладки «Видеонаблюдение» нет', () => {
    expect(availableTabKeys({ hasCameras: false, camerasLoaded: true })).toEqual(['control', 'devices', 'general']);
  });

  test('есть хотя бы одна камера — вкладка есть', () => {
    expect(availableTabKeys({ hasCameras: true, camerasLoaded: true })).toContain('cameras');
  });

  test('список ещё не получен: выбранная вкладка камер не скрывается, остальным не показывается', () => {
    expect(availableTabKeys({ camerasLoaded: false, activeTab: 'cameras' })).toContain('cameras');
    expect(availableTabKeys({ camerasLoaded: false, activeTab: 'control' })).not.toContain('cameras');
  });
});

describe('MainView: вкладки', () => {
  // Вычисляемые свойства и методы MainView на подставном this
  function view({ activeTab = 'control', hasCameras = false, camerasLoaded = true } = {}) {
    const vm = {
      activeTab,
      $store: { getters: { 'video/hasCameras': hasCameras, 'video/camerasLoaded': camerasLoaded } },
      setActiveTab: jest.fn((k) => { vm.activeTab = k; }),
    };
    Object.defineProperty(vm, 'tabKeys', { get: () => MainView.computed.tabKeys.call(vm) });
    Object.defineProperty(vm, 'shownTab', { get: () => MainView.computed.shownTab.call(vm) });
    vm.cycleTab = () => MainView.methods.cycleTab.call(vm);
    return vm;
  }

  test('без камер переключение по кругу пропускает «Видеонаблюдение»', () => {
    const vm = view({ activeTab: 'general' });
    vm.cycleTab();
    expect(vm.activeTab).toBe('control');
  });

  test('с камерами — «Видеонаблюдение» в круге', () => {
    const vm = view({ activeTab: 'general', hasCameras: true });
    vm.cycleTab();
    expect(vm.activeTab).toBe('cameras');
  });

  test('камеры пропали на вкладке камер — показывается первая вкладка и запоминается', () => {
    const vm = view({ activeTab: 'cameras', hasCameras: false, camerasLoaded: true });
    expect(vm.shownTab).toBe(DEFAULT_TAB);
    MainView.watch.shownTab.call(vm, vm.shownTab);
    expect(vm.setActiveTab).toHaveBeenCalledWith(DEFAULT_TAB);
  });

  test('пока список камер не получен — вкладка камер остаётся', () => {
    const vm = view({ activeTab: 'cameras', camerasLoaded: false });
    expect(vm.shownTab).toBe('cameras');
  });
});
