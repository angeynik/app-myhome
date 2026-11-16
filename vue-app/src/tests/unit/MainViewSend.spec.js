// src/tests/unit/MainViewSend.spec.js
// Отложенная отправка значения с экрана изменения (MainView.sendChangedData / flushPendingUpdate).

jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

import MainView from '@/components/MainView.vue';

const { sendChangedData, flushPendingUpdate } = MainView.methods;

function makeVm() {
  const vm = {
    setpointUpdateTimer: null,
    setpoint: null,
    updatePayloadData: jest.fn(),
    $store: { dispatch: jest.fn().mockResolvedValue(undefined) },
  };
  vm.sendChangedData = sendChangedData.bind(vm);
  vm.flushPendingUpdate = flushPendingUpdate.bind(vm);
  return vm;
}

const change = (value) => ({ updateState: { request: 'setpoints', title: 'value', value } });
const sends = (vm) => vm.$store.dispatch.mock.calls.filter(([a]) => a === 'config/updateSetpointServer').length;

describe('MainView: отложенная отправка значения', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('закрытие экрана после отправки по таймеру не отправляет значение второй раз', async () => {
    const vm = makeVm();
    vm.sendChangedData(change(23.5));
    jest.advanceTimersByTime(300);
    await Promise.resolve();
    expect(sends(vm)).toBe(1);

    await vm.flushPendingUpdate();
    expect(sends(vm)).toBe(1);
  });

  test('закрытие экрана до срабатывания таймера отправляет ровно один раз', async () => {
    const vm = makeVm();
    vm.sendChangedData(change(24));
    await vm.flushPendingUpdate();
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(sends(vm)).toBe(1);
  });

  test('серия изменений в пределах 300 мс даёт одну отправку', async () => {
    const vm = makeVm();
    [22, 22.5, 23].forEach((v) => {
      vm.sendChangedData(change(v));
      jest.advanceTimersByTime(100);
    });
    jest.advanceTimersByTime(300);
    await Promise.resolve();
    expect(sends(vm)).toBe(1);
    expect(vm.updatePayloadData).toHaveBeenLastCalledWith({ value: 23 });
  });
});
