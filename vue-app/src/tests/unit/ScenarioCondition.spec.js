// ScenarioCondition / ScenarioAction / DurationInput: правка узлов без мутации props (событие update).
import { mount } from '@vue/test-utils';
import ScenarioCondition from '@/components/ScenarioCondition.vue';
import ScenarioAction from '@/components/ScenarioAction.vue';
import DurationInput from '@/components/DurationInput.vue';
import { POINTS } from './scenarioFixtures';

const P = (room, item) => ({ room, item });
const cond = (node, extra = {}) => mount(ScenarioCondition, { props: { node, options: POINTS, ...extra } });
const last = (w) => w.emitted('update').at(-1)[0];

describe('ScenarioCondition: группа', () => {
  test('корень: добавление условий, без «НЕ» и удаления', async () => {
    const w = cond({ all: [] }, { root: true });
    expect(w.text()).toContain('Добавьте первое условие.');
    expect(w.find('[data-test="not"]').exists()).toBe(false);
    await w.find('[data-test="add-point"]').trigger('click');
    expect(last(w)).toEqual({ all: [{ point: P('room01', 'aLamp01'), op: 'eq', value: true }] });
    await w.find('[data-test="add-time"]').trigger('click');
    expect(last(w)).toEqual({ all: [{ time: { from: '08:00', to: '20:00' } }] }); // props не менялись — от исходного
    await w.find('[data-test="add-group"]').trigger('click');
    expect(Object.keys(last(w).all[0])).toEqual(['any']);
  });

  test('И ↔ ИЛИ, вложенные узлы, правка и удаление вложенного', async () => {
    const node = { all: [{ days: [1] }, { time: { from: '01:00', to: '02:00' } }] };
    const w = cond(node, { root: true });
    expect(w.findAll('.scenario-join').map((x) => x.text())).toEqual(['И']);
    await w.find('[data-test="group-any"]').trigger('click');
    expect(last(w)).toEqual({ any: node.all });
    const children = w.findAllComponents(ScenarioCondition).filter((c) => c.props('depth') === 2);
    await children[0].find('[data-test="day-3"]').trigger('click');
    expect(last(w)).toEqual({ all: [{ days: [1, 3] }, node.all[1]] });
    await children[1].find('[data-test="remove"]').trigger('click');
    expect(last(w)).toEqual({ all: [{ days: [1] }] });
  });

  test('«НЕ»: оборачивает узел и снимает обёртку; отрицание показывается у самого узла', async () => {
    const leaf = { days: [6, 7] };
    const w = cond(leaf);
    await w.find('[data-test="not"]').trigger('click');
    expect(last(w)).toEqual({ not: leaf });
    const neg = cond({ not: leaf });
    expect(neg.find('[data-test="cond-days"]').classes()).toContain('scenario-node--not');
    expect(neg.find('[data-test="not"]').classes()).toContain('active');
    await neg.find('[data-test="day-1"]').trigger('click');
    expect(last(neg)).toEqual({ not: { days: [1, 6, 7] } });
    await neg.find('[data-test="not"]').trigger('click');
    expect(last(neg)).toEqual(leaf);
  });

  test('глубина: на предпоследнем уровне группу добавить нельзя', () => {
    expect(cond({ all: [] }, { depth: 5 }).find('[data-test="add-group"]').exists()).toBe(false);
    expect(cond({ all: [] }, { depth: 4 }).find('[data-test="add-group"]').exists()).toBe(true);
  });
});

describe('ScenarioCondition: параметр', () => {
  const temp = { point: P('room01', 'dTemp01'), op: 'gt', value: 25 };

  test('число: значение, гистерезис, «держится не менее»; единица параметра', async () => {
    const w = cond(temp);
    expect(w.text()).toContain('°C');
    await w.find('[data-test="value"]').setValue('26.5');
    expect(last(w)).toEqual({ ...temp, value: 26.5 });
    await w.find('[data-test="hysteresis"]').setValue('1');
    expect(last(w)).toEqual({ ...temp, hysteresis: 1 });
    await w.find('[data-test="hysteresis"]').setValue('');
    expect(last(w)).toEqual(temp);
    const dur = w.findAllComponents(DurationInput).at(-1);
    await dur.find('select').setValue('60');
    await dur.find('input').setValue('2');
    expect(last(w)).toEqual({ ...temp, forSec: 120 });
  });

  test('сравнение с параметром: подбирается пара-уставка, сдвиг', async () => {
    const node = { point: P('room02', 'dTemp02'), op: 'lt', value: 20 };
    const w = cond(node);
    await w.find('[data-test="cmp-source"]').setValue('point');
    expect(last(w)).toEqual({ point: node.point, op: 'lt', valueFrom: { room: 'room02', item: 'sTemp02', offset: 0 } });
    const w2 = cond(last(w));
    await w2.find('[data-test="offset"]').setValue('-0.5');
    expect(last(w2).valueFrom).toEqual({ room: 'room02', item: 'sTemp02', offset: -0.5 });
    await w2.find('[data-test="cmp-source"]').setValue('value');
    expect(last(w2)).toEqual({ point: node.point, op: 'lt', value: 0 });
  });

  test('сравнения: диапазон и «нет данных» убирают лишние поля', async () => {
    const w = cond({ ...temp, hysteresis: 1 });
    await w.find('[data-test="op"]').setValue('between');
    expect(last(w)).toEqual({ point: temp.point, op: 'between', value: 25, value2: 35 });
    await w.find('[data-test="op"]').setValue('stale');
    expect(last(w)).toEqual({ point: temp.point, op: 'stale', sec: 3600 });
    const s = cond({ point: temp.point, op: 'stale', sec: 600 });
    await s.find('[data-test="op"]').setValue('eq');
    expect(last(s)).toEqual({ point: temp.point, op: 'eq', value: 0 });
  });

  test('логический параметр: только = ≠ «нет данных», ВКЛ/ВЫКЛ; смена параметра меняет тип значения', async () => {
    const w = cond({ point: P('room02', 'aPump01'), op: 'eq', value: true });
    expect(w.findAll('[data-test="op"] option').map((o) => o.element.value)).toEqual(['eq', 'ne', 'stale']);
    await w.find('[data-test="bool-false"]').trigger('click');
    expect(last(w).value).toBe(false);
    const t = cond({ ...temp, hysteresis: 1 });
    await t.find('select.scenario-point').setValue('room02|aPump01');
    expect(last(t)).toEqual({ point: P('room02', 'aPump01'), op: 'eq', value: true });
    const b = cond({ point: P('room02', 'aPump01'), op: 'eq', value: true });
    await b.find('select.scenario-point').setValue('room02|dTemp02');
    expect(last(b)).toEqual({ point: P('room02', 'dTemp02'), op: 'eq', value: 19 });
  });

  test('точка не из конфигурации остаётся в списке с пометкой', () => {
    const w = cond({ point: P('room09', 'sNight'), op: 'eq', value: true });
    expect(w.find('select.scenario-point').text()).toContain('room09/sNight — нет в конфигурации');
  });
});

describe('ScenarioCondition: время и даты', () => {
  test('время через полночь — подсказка', async () => {
    const w = cond({ time: { from: '23:00', to: '06:00' } });
    expect(w.text()).toContain('через полночь');
    await w.find('[data-test="time-to"]').setValue('07:00');
    expect(last(w)).toEqual({ time: { from: '23:00', to: '07:00' } });
  });

  test('даты: каждый год ↔ конкретные даты', async () => {
    const w = cond({ dates: { from: '12-30', to: '01-08' } });
    expect(w.find('[data-test="yearly"]').element.checked).toBe(true);
    expect(w.find('[data-test="date-from"]').element.value).toBe('2000-12-30');
    await w.find('[data-test="date-to"]').setValue('2000-01-10');
    expect(last(w)).toEqual({ dates: { from: '12-30', to: '01-10' } });
    await w.find('[data-test="yearly"]').setValue(false);
    expect(last(w).dates.from).toMatch(/^\d{4}-12-30$/);
    const full = cond({ dates: { from: '2026-12-30', to: '2027-01-08' } });
    await full.find('[data-test="yearly"]').setValue(true);
    expect(last(full)).toEqual({ dates: { from: '12-30', to: '01-08' } });
  });
});

describe('ScenarioAction', () => {
  const act = (action) => mount(ScenarioAction, { props: { action, options: POINTS } });

  test('изменить: только уставки и переключатели; ВКЛ/ВЫКЛ; число; задержка', async () => {
    const w = act({ set: P('room01', 'sLamp01'), value: true });
    const opts = w.find('select.scenario-point').findAll('option').map((o) => o.element.value).filter(Boolean);
    expect(opts).toEqual(['room01|sLamp01', 'room02|aPump01', 'room02|sTemp02']);
    await w.find('[data-test="bool-false"]').trigger('click');
    expect(last(w)).toEqual({ set: P('room01', 'sLamp01'), value: false });
    await w.find('select.scenario-point').setValue('room02|sTemp02');
    expect(last(w)).toEqual({ set: P('room02', 'sTemp02'), value: 21 });
    const n = act({ set: P('room02', 'sTemp02'), value: 21 });
    await n.find('[data-test="value"]').setValue('16');
    expect(last(n)).toEqual({ set: P('room02', 'sTemp02'), value: 16 });
    await n.find('.duration-input input').setValue('10');
    expect(last(n)).toEqual({ set: P('room02', 'sTemp02'), value: 21, delaySec: 600 });
    await n.find('[data-test="set-source"]').setValue('point');
    expect(last(n).valueFrom).toMatchObject({ room: 'room01', item: 'dHum01', offset: 0 });
  });

  test('оповещение: текст и важность; удаление', async () => {
    const w = act({ notify: '', severity: 'info' });
    await w.find('[data-test="notify"]').setValue('Протечка');
    expect(last(w)).toEqual({ notify: 'Протечка', severity: 'info' });
    await w.find('[data-test="severity-alarm"]').trigger('click');
    expect(last(w).severity).toBe('alarm');
    await w.find('[data-test="remove"]').trigger('click');
    expect(w.emitted('remove')).toHaveLength(1);
  });
});

describe('DurationInput', () => {
  test('единица по значению, пусто — null, смена единицы пересчитывает', async () => {
    const w = mount(DurationInput, { props: { modelValue: 7200 } });
    expect(w.find('input').element.value).toBe('2');
    expect(w.find('select').element.value).toBe('3600');
    await w.find('select').setValue('60');
    expect(w.emitted('update:modelValue').at(-1)).toEqual([120]);
    await w.find('input').setValue('');
    expect(w.emitted('update:modelValue').at(-1)).toEqual([null]);
    const e = mount(DurationInput, { props: { modelValue: null, defaultUnit: 60 } });
    expect(e.find('select').element.value).toBe('60');
  });
});
