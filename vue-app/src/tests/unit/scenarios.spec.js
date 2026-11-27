// store/modules/scenarios.js: данные, ожидание ответа на правку, ошибки, сброс.
jest.mock('@/store/modules/logger', () => ({ info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn() }));

import { createStore } from 'vuex';
import { flushPromises } from '@vue/test-utils';

let scenarios;
function setup({ dID = 'igumen' } = {}) {
  scenarios = require('@/store/modules/scenarios').default;
  const send = jest.fn().mockResolvedValue(null);
  const popup = jest.fn();
  const store = createStore({
    modules: {
      scenarios,
      websocket: { namespaced: true, actions: { send: (_, m) => send(m) } },
      popup: { namespaced: true, actions: { show: (_, p) => popup(p) } },
    },
    getters: { dID: () => dID },
  });
  const respond = (request, payload) => store.dispatch('scenarios/handleResponse', { type: 'response', request, payload });
  return { store, send, popup, respond };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const DATA = {
  settings: { tzOffsetMin: 120 },
  scenarios: {
    b: { id: 'b', title: 'Бэ', priority: 50 },
    a: { id: 'a', title: 'А', priority: 50 },
    p: { id: 'p', title: 'Защита', priority: 90 },
  },
};

test('по умолчанию: настройки по умолчанию, не загружено; request отправляет get/scenarios', async () => {
  const { store, send } = setup();
  expect(store.getters['scenarios/loaded']).toBe(false);
  expect(store.getters['scenarios/settings']).toEqual({ tzOffsetMin: 180, manualOverrideSec: 3600, maxCommandsPerMin: 6 });
  await store.dispatch('scenarios/request');
  expect(send).toHaveBeenCalledWith({ type: 'get', request: 'scenarios', name: 'igumen', payload: {} });
});

test('response/scenarios: данные, список по приоритету и названию, настройки дополняются', async () => {
  const { store, respond } = setup();
  expect(await respond('scenarios', DATA)).toBe(true);
  expect(store.getters['scenarios/loaded']).toBe(true);
  expect(store.getters['scenarios/list'].map((s) => s.id)).toEqual(['p', 'a', 'b']);
  expect(store.getters['scenarios/settings']).toEqual({ tzOffsetMin: 120, manualOverrideSec: 3600, maxCommandsPerMin: 6 });
  expect(store.getters['scenarios/byId']('a').title).toBe('А');
  expect(store.getters['scenarios/byId']('toString')).toBeNull();
  expect(await respond('config', {})).toBe(false);
});

test('save: post/scenarios и ответ scenariosSuccess', async () => {
  const { store, send, respond } = setup();
  const p = store.dispatch('scenarios/save', { action: 'create', configData: { id: 'x' } });
  await flushPromises();
  expect(send).toHaveBeenCalledWith({ type: 'post', request: 'scenarios', name: 'igumen', payload: { action: 'create', configData: { id: 'x' } } });
  await respond('scenariosSuccess', { action: 'create', id: 'x', delivered: 1 });
  await expect(p).resolves.toEqual({ action: 'create', id: 'x', delivered: 1 });
});

test('save: scenariosError — отклонение с кодом, без всплывающего окна; перезапрос сценариев', async () => {
  const { store, send, popup } = setup();
  const p = store.dispatch('scenarios/save', { action: 'edit', configData: {} });
  await flushPromises();
  await store.dispatch('scenarios/handleError', { message: 'Неверный сценарий: …', code: 'BAD_SCENARIO' });
  await expect(p).rejects.toMatchObject({ message: 'Неверный сценарий: …', code: 'BAD_SCENARIO' });
  expect(popup).not.toHaveBeenCalled();
  expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'get', request: 'scenarios' }));
});

test('ошибка без ожидающей правки — во всплывающее окно', async () => {
  const { store, popup } = setup();
  await store.dispatch('scenarios/handleError', { message: 'Сценарий не найден', code: 'NOT_FOUND' });
  expect(popup).toHaveBeenCalledWith(expect.objectContaining({ message: 'Сценарий не найден', type: 'error' }));
});

test('правки по одной: вторая уходит после ответа на первую; сервер молчит — TIMEOUT', async () => {
  const { store, send, respond } = setup();
  const p1 = store.dispatch('scenarios/save', { action: 'enable', configData: { id: 'a', enabled: false } });
  const p2 = store.dispatch('scenarios/save', { action: 'enable', configData: { id: 'b', enabled: false } });
  await flushPromises();
  expect(send).toHaveBeenCalledTimes(1);
  await respond('scenariosSuccess', { id: 'a' });
  await expect(p1).resolves.toEqual({ id: 'a' });
  await flushPromises();
  expect(send).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(15000);
  await expect(p2).rejects.toMatchObject({ code: 'TIMEOUT' });
});

test('нет соединения при отправке — отклонение; RESET — данные очищены, ожидание отклонено', async () => {
  const { store, send, respond } = setup();
  send.mockRejectedValueOnce(Object.assign(new Error('Нет связи'), { code: 'NO_CONNECTION' }));
  await expect(store.dispatch('scenarios/save', { action: 'delete', configData: { id: 'a' } })).rejects.toMatchObject({ code: 'NO_CONNECTION' });
  await respond('scenarios', DATA);
  const p = store.dispatch('scenarios/save', { action: 'delete', configData: { id: 'a' } });
  await flushPromises();
  store.commit('scenarios/RESET');
  await expect(p).rejects.toMatchObject({ code: 'RESET' });
  expect(store.getters['scenarios/list']).toEqual([]);
  expect(store.getters['scenarios/loaded']).toBe(false);
});

test('без сессии — NO_SESSION', async () => {
  const { store } = setup({ dID: null });
  await expect(store.dispatch('scenarios/save', { action: 'create', configData: {} })).rejects.toMatchObject({ code: 'NO_SESSION' });
});
