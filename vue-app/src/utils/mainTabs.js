// src/utils/mainTabs.js
// Вкладки главного экрана — ЕДИНЫЙ источник для MainView.vue (заголовок, переключение)
// и MainBody.vue (какие секции конфигурации показывать).
//
//   sections      — секции комнаты, из которых строятся карточки
//   common        — true: данные берутся не из комнат roomNN, а из корневого объекта `common`
//   withSetpoint  — подбирать ли парную уставку (карточки можно открывать и править)

export const COMMON_KEY = 'common';
export const TAB_STORAGE_KEY = 'mainViewTab';

export const MAIN_TABS = [
  {
    key: 'control',
    label: 'Панель управления',
    sections: ['sensors'],
    common: false,
    withSetpoint: true,
    emptyText: 'Нет данных для отображения',
  },
  {
    key: 'devices',
    label: 'Состояние устройств',
    sections: ['system'],
    common: false,
    withSetpoint: false,
    emptyText: 'Нет данных о состоянии устройств',
  },
  {
    key: 'general',
    label: 'Общие настройки',
    sections: ['system'],
    common: true,
    withSetpoint: false,
    emptyText: 'Нет данных общих настроек',
  },
];

export const TAB_KEYS = MAIN_TABS.map((t) => t.key);
export const DEFAULT_TAB = TAB_KEYS[0];

export function getTab(key) {
  return MAIN_TABS.find((t) => t.key === key) || MAIN_TABS[0];
}

export function readSavedTab() {
  try {
    const saved = localStorage.getItem(TAB_STORAGE_KEY);
    return TAB_KEYS.includes(saved) ? saved : DEFAULT_TAB;
  } catch {
    return DEFAULT_TAB;
  }
}
