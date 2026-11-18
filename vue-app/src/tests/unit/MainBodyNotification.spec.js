// src/tests/unit/MainBodyNotification.spec.js
// MainBody.openNotification: экран уведомления только с уровня 2; цель — комната, раздел, параметр.

jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

import MainBody from '@/components/MainBody.vue';

const ITEM = {
  roomKey: 'room01', section: 'sensors', paramKey: 'dTemp01', roomGroup: 'Гостиная', roomTitle: 'Комната-room01',
  paramTitle: 'Температура', unit: '°C', value: 22.5,
};

function call(level, item = ITEM) {
  const dispatch = jest.fn();
  const ctx = {
    level,
    $store: { dispatch },
    clearSelection: jest.fn(),
    notificationIdOf: MainBody.methods.notificationIdOf,
  };
  MainBody.methods.openNotification.call(ctx, item);
  return dispatch;
}

describe('MainBody: открытие уведомления', () => {
  test('уровень 1 — только сообщение, экран не открывается', () => {
    const dispatch = call(1);
    expect(dispatch).toHaveBeenCalledWith('popup/show', expect.objectContaining({ type: 'info' }));
    expect(dispatch).not.toHaveBeenCalledWith('notifications/openEditor', expect.anything());
  });

  test.each([null, undefined, ''])('нет значения параметра (%p) — сообщение «Отсутствует значение параметра», экран не открывается', (value) => {
    const dispatch = call(2, { ...ITEM, value });
    expect(dispatch).toHaveBeenCalledWith('popup/show', expect.objectContaining({ message: 'Отсутствует значение параметра' }));
    expect(dispatch).not.toHaveBeenCalledWith('notifications/openEditor', expect.anything());
  });

  test('значение 0 и OFF — экран открывается', () => {
    expect(call(2, { ...ITEM, value: 0 })).toHaveBeenCalledWith('notifications/openEditor', expect.objectContaining({ value: 0 }));
    expect(call(2, { ...ITEM, value: 'OFF' })).toHaveBeenCalledWith('notifications/openEditor', expect.objectContaining({ value: 'OFF' }));
  });

  test('уровень 2 — экран с идентификаторами группы, комнаты и параметра и текущим значением', () => {
    expect(call(2)).toHaveBeenCalledWith('notifications/openEditor', {
      id: 'room01:sensors:dTemp01', room: 'room01', section: 'sensors', item: 'dTemp01',
      group: 'Гостиная', roomTitle: 'Гостиная', title: 'Температура', unit: '°C', value: 22.5,
    });
  });
});
