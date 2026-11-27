// Экраны сценариев: ScenarioEditor (новый из шаблона, правка, ошибки сервера, удаление, уход без
// сохранения) и ScenarioList (описание, включение, шаблоны, общие параметры) с настоящим модулем store.
jest.mock('@/store/modules/logger', () => ({ info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn() }));

import { mount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import scenariosModule from '@/store/modules/scenarios';
import ScenarioEditor from '@/components/ScenarioEditor.vue';
import ScenarioList from '@/components/ScenarioList.vue';
import { CONFIG, titleOf, unitOf } from './scenarioFixtures';

const P = (room, item) => ({ room, item });
const EXISTING = {
  id: 'night', title: 'Ночь', description: '', enabled: true, mode: 'active', priority: 50,
  when: { time: { from: '23:00', to: '06:00' } },
  then: [{ set: P('room02', 'sTemp02'), value: 16 }], else: [{ set: P('room02', 'sTemp02'), value: 21 }],
  options: { minOnSec: 300 }, createdAt: 'x', updatedAt: 'y', updatedBy: 'admin',
};
const PROTECT = {
  id: 'protect', title: 'Защита', enabled: false, mode: 'test', priority: 90,
  when: { all: [{ point: P('room02', 'dPower01'), op: 'gt', value: 1500 }] },
  then: [{ notify: 'Авария', severity: 'alarm' }], else: [], options: {},
};

function setup({ loaded = true, scenarios = { night: EXISTING, protect: PROTECT } } = {}) {
  const sent = [];
  const popup = jest.fn();
  const push = jest.fn();
  const store = createStore({
    modules: {
      scenarios: scenariosModule,
      websocket: { namespaced: true, actions: { send: (_, m) => { sent.push(m); return null; } } },
      popup: { namespaced: true, actions: { show: (_, p) => popup(p) } },
      config: { namespaced: true, getters: { getConfig: () => () => CONFIG } },
      sortParams: { namespaced: true, getters: { getSensorTitle: () => titleOf, getUnit: () => unitOf } },
    },
    getters: { dID: () => 'igumen' },
  });
  store.commit('scenarios/RESET'); // ожидание правки из прошлого теста (состояние модуля общее)
  if (loaded) store.commit('scenarios/SET_DATA', { settings: {}, scenarios });
  const posts = () => sent.filter((m) => m.type === 'post').map((m) => m.payload);
  const reply = (payload) => store.dispatch('scenarios/handleResponse', { type: 'response', request: 'scenariosSuccess', payload });
  const fail = (payload) => store.dispatch('scenarios/handleError', payload);
  const mountIt = (component, props = {}) => mount(component, {
    props,
    global: { plugins: [store], mocks: { $store: store, $router: { push } } },
  });
  return { store, sent, posts, reply, fail, popup, push, mountIt };
}

describe('ScenarioEditor', () => {
  const Editor = () => ScenarioEditor;

  test('новый из шаблона: точки подставлены, режим «Тест»; сохранение — create, затем к списку', async () => {
    const { mountIt, posts, reply, push, popup } = setup();
    const w = mountIt(Editor(), { template: 'thermostat' });
    await flushPromises();
    expect(w.find('[data-test="title"]').element.value).toBe('Термостат');
    expect(w.find('[data-test="mode-test"]').classes()).toContain('active');
    expect(w.find('[data-test="summary"]').text()).toContain('Если Гостиная · Температура в зале < Котельная · Уставка (±0.5)');
    await w.find('[data-test="save"]').trigger('click');
    await flushPromises();
    expect(posts()).toEqual([{ action: 'create', configData: expect.objectContaining({
      title: 'Термостат', mode: 'test', priority: 50,
      when: { all: [{ point: P('room01', 'dTemp01'), op: 'lt', valueFrom: { room: 'room02', item: 'sTemp02', offset: 0 }, hysteresis: 0.5 }] },
      then: [{ set: P('room01', 'sLamp01'), value: true }],
      options: { minOnSec: 300, minOffSec: 300, onUnknown: 'else' },
    }) }]);
    expect(posts()[0].configData.id).toMatch(/^sc_/);
    expect(w.find('[data-test="save"]').text()).toBe('Сохранение…');
    await reply({ action: 'create', id: 'x', delivered: 1 });
    await flushPromises();
    expect(push).toHaveBeenCalledWith('/scenarios');
    expect(popup).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });

  test('проверка до отправки: ошибка на экране, ничего не уходит', async () => {
    const { mountIt, posts } = setup();
    const w = mountIt(Editor(), { template: 'empty' });
    await flushPromises();
    await w.find('[data-test="save"]').trigger('click');
    expect(w.find('[data-test="error"]').text()).toBe('Введите название сценария');
    await w.find('[data-test="title"]').setValue('Мой');
    await w.find('[data-test="save"]').trigger('click');
    expect(w.find('[data-test="error"]').text()).toBe('Пустая группа условий: добавьте условие или удалите группу');
    expect(posts()).toEqual([]);
  });

  test('правка существующего: edit без служебных полей; ошибка сервера — на экране, экран не закрывается', async () => {
    const { mountIt, posts, fail, push } = setup();
    const w = mountIt(Editor(), { scenarioId: 'night' });
    await flushPromises();
    expect(w.find('[data-test="title"]').element.value).toBe('Ночь');
    await w.find('[data-test="title"]').setValue('Ночь эко');
    await w.find('[data-test="add-notify-else"]').trigger('click');
    await w.find('[data-test="branch-else"] [data-test="notify"]').setValue('Дневной режим');
    await w.find('[data-test="save"]').trigger('click');
    await flushPromises();
    expect(posts()[0]).toEqual({ action: 'edit', configData: {
      id: 'night', title: 'Ночь эко', description: '', enabled: true, mode: 'active', priority: 50,
      when: { all: [{ time: { from: '23:00', to: '06:00' } }] },
      then: [{ set: P('room02', 'sTemp02'), value: 16 }],
      else: [{ set: P('room02', 'sTemp02'), value: 21 }, { notify: 'Дневной режим', severity: 'info' }],
      options: { minOnSec: 300 },
    } });
    await fail({ message: 'Неверный сценарий: …', code: 'BAD_SCENARIO' });
    await flushPromises();
    expect(w.find('[data-test="error"]').text()).toBe('Неверный сценарий: …');
    expect(push).not.toHaveBeenCalled();
  });

  test('Node-RED не подключён (delivered: 0) — предупреждение', async () => {
    const { mountIt, reply, popup } = setup();
    const w = mountIt(Editor(), { scenarioId: 'night' });
    await flushPromises();
    await w.find('[data-test="save"]').trigger('click');
    await flushPromises();
    await reply({ action: 'edit', id: 'night', delivered: 0 });
    await flushPromises();
    expect(popup).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning', message: expect.stringContaining('Node-RED сейчас не подключён') }));
  });

  test('удаление в два нажатия', async () => {
    const { mountIt, posts } = setup();
    const w = mountIt(Editor(), { scenarioId: 'night' });
    await flushPromises();
    await w.find('[data-test="delete"]').trigger('click');
    expect(w.find('[data-test="delete"]').text()).toBe('Точно удалить?');
    expect(posts()).toEqual([]);
    await w.find('[data-test="delete"]').trigger('click');
    await flushPromises();
    expect(posts()).toEqual([{ action: 'delete', configData: { id: 'night' } }]);
  });

  test('уход с несохранёнными изменениями — предупреждение, второе нажатие уходит', async () => {
    const { mountIt, push } = setup();
    const w = mountIt(Editor(), { scenarioId: 'night' });
    await flushPromises();
    await w.find('[data-test="back"]').trigger('click');
    expect(push).toHaveBeenCalledWith('/scenarios'); // без изменений — сразу
    push.mockClear();
    await w.find('[data-test="title"]').setValue('Другое');
    await w.find('[data-test="back"]').trigger('click');
    expect(push).not.toHaveBeenCalled();
    expect(w.find('[data-test="leave-warning"]').exists()).toBe(true);
    await w.find('[data-test="back"]').trigger('click');
    expect(push).toHaveBeenCalledWith('/scenarios');
  });

  test('данные ещё не пришли — запрос и загрузка; нет сценария — сообщение', async () => {
    const { mountIt, sent, store } = setup({ loaded: false });
    const w = mountIt(Editor(), { scenarioId: 'gone' });
    expect(w.text()).toContain('Загрузка…');
    expect(sent).toContainEqual({ type: 'get', request: 'scenarios', name: 'igumen', payload: {} });
    store.commit('scenarios/SET_DATA', { scenarios: {} });
    await flushPromises();
    expect(w.find('[data-test="not-found"]').exists()).toBe(true);
  });

  test('надёжность: раскрыта, если опции заданы; «Нет данных → Иначе» попадает в options', async () => {
    const { mountIt, posts } = setup();
    const w = mountIt(Editor(), { scenarioId: 'night' });
    await flushPromises();
    await w.find('[data-test="unknown-else"]').trigger('click');
    await w.find('[data-test="save"]').trigger('click');
    await flushPromises();
    expect(posts()[0].configData.options).toEqual({ minOnSec: 300, onUnknown: 'else' });
  });
});

describe('ScenarioList', () => {
  const List = () => ScenarioList;

  test('список: старший приоритет выше, описание, метки «Тест» и «Защита», выключенный — бледный', async () => {
    const { mountIt, sent } = setup();
    const w = mountIt(List());
    await flushPromises();
    expect(sent).toContainEqual({ type: 'get', request: 'scenarios', name: 'igumen', payload: {} });
    const cards = w.findAll('.scenario-card');
    expect(cards.map((c) => c.find('.scenario-card-title').text())).toEqual(['Защита', 'Ночь']);
    expect(cards[0].text()).toContain('Тест');
    expect(cards[0].classes()).toContain('scenario-card--off');
    expect(cards[1].text()).toContain('Если время 23:00–06:00');
    expect(cards[1].text()).toContain('то: Котельная · Уставка ← 16');
  });

  test('карточка открывает редактор; переключатель — enable, без перехода', async () => {
    const { mountIt, posts, reply, push } = setup();
    const w = mountIt(List());
    await flushPromises();
    await w.find('[data-test="scenario-night"]').trigger('click');
    expect(push).toHaveBeenCalledWith('/scenarios/night');
    push.mockClear();
    await w.find('[data-test="scenario-protect"] [data-test="toggle"]').setValue(true);
    await flushPromises();
    expect(posts()).toEqual([{ action: 'enable', configData: { id: 'protect', enabled: true } }]);
    expect(push).not.toHaveBeenCalled();
    await reply({ action: 'enable', id: 'protect', delivered: 1 });
  });

  test('пусто — подсказка; «+ Новый» — шаблоны, выбор ведёт в редактор', async () => {
    const { mountIt, push } = setup({ scenarios: {} });
    const w = mountIt(List());
    await flushPromises();
    expect(w.find('[data-test="empty"]').exists()).toBe(true);
    await w.find('[data-test="new"]').trigger('click');
    await w.find('[data-test="template-protect"]').trigger('click');
    expect(push).toHaveBeenCalledWith({ path: '/scenarios/new', query: { template: 'protect' } });
  });

  test('общие параметры: проверка и сохранение', async () => {
    const { mountIt, posts } = setup();
    const w = mountIt(List());
    await flushPromises();
    await w.find('[data-test="settings"]').trigger('click');
    await w.find('[data-test="rate"]').setValue('0');
    await w.find('[data-test="save-settings"]').trigger('click');
    expect(w.text()).toContain('Команд в минуту — целое число от 1 до 60');
    await w.find('[data-test="rate"]').setValue('10');
    await w.find('[data-test="tz"]').setValue('240');
    await w.find('[data-test="save-settings"]').trigger('click');
    await flushPromises();
    expect(posts()).toEqual([{ action: 'settings', configData: { tzOffsetMin: 240, manualOverrideSec: 3600, maxCommandsPerMin: 10 } }]);
  });
});
