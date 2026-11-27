// utils/scenarioModel.js и utils/scenarioTemplates.js: точки, черновик, проверка, текст, шаблоны.
import {
  pointOptions, toEditor, fromEditor, validateDraft, describeScenario, describeCondition,
  formatDuration, kindOf, newPointCond, writable, emptyScenario,
} from '@/utils/scenarioModel';
import { TEMPLATES, fromTemplate } from '@/utils/scenarioTemplates';
import { CONFIG, POINTS, titleOf, unitOf } from './scenarioFixtures';

const P = (room, item) => ({ room, item });

describe('pointOptions', () => {
  test('только комнаты roomNN, разделы sensors/system/setpoints; названия из _meta и словаря, тип', () => {
    expect(POINTS.map((p) => p.key)).toEqual([
      'room01|aLamp01', 'room01|dHum01', 'room01|dTemp01', 'room01|sLamp01',
      'room02|dPower01', 'room02|dTemp02', 'room02|aPump01', 'room02|sTemp02',
    ]);
    const t = POINTS.find((p) => p.key === 'room01|dTemp01');
    expect(t).toMatchObject({ roomTitle: 'Гостиная', title: 'Температура в зале', unit: '°C', type: 'num', value: 21.5, section: 'sensors' });
    expect(POINTS.find((p) => p.item === 'aLamp01').type).toBe('bool'); // 'OFF'
    expect(POINTS.filter(writable).map((p) => p.item)).toEqual(['sLamp01', 'aPump01', 'sTemp02']);
    expect(pointOptions(null)).toEqual([]);
  });
});

describe('черновик ↔ сервер', () => {
  test('корень условия — всегда группа; служебные поля убраны; обратно — без пустых полей', () => {
    const sc = {
      id: 'a', title: ' Ночь ', when: { time: { from: '23:00', to: '06:00' } }, then: [{ set: P('room02', 'sTemp02'), value: 16, delaySec: 0 }],
      createdAt: 'x', updatedAt: 'y', updatedBy: 'z',
    };
    const d = toEditor(sc);
    expect(d.when).toEqual({ all: [{ time: { from: '23:00', to: '06:00' } }] });
    expect(d).not.toHaveProperty('createdAt');
    expect(d.else).toEqual([]);
    d.options = { minOnSec: null, repeatSec: 60 };
    d.when.all.push({ point: P('room01', 'dTemp01'), op: 'gt', value: 0, forSec: 0, hysteresis: undefined });
    expect(fromEditor(d)).toEqual({
      id: 'a', title: 'Ночь', description: '', enabled: true, mode: 'active', priority: NaN,
      when: { all: [{ time: { from: '23:00', to: '06:00' } }, { point: P('room01', 'dTemp01'), op: 'gt', value: 0 }] },
      then: [{ set: P('room02', 'sTemp02'), value: 16 }], else: [], options: { repeatSec: 60 },
    });
  });

  test('группа с forSec в корне оборачивается, чтобы forSec не потерять', () => {
    expect(toEditor({ when: { any: [{ days: [1] }], forSec: 60 } }).when).toEqual({ all: [{ any: [{ days: [1] }], forSec: 60 }] });
    expect(kindOf({ not: {} })).toBe('not');
  });
});

describe('validateDraft', () => {
  const base = () => ({
    ...emptyScenario(), title: 'Т', priority: 50,
    when: { all: [{ point: P('room01', 'dTemp01'), op: 'gt', value: 25 }] },
    then: [{ set: P('room01', 'sLamp01'), value: true }],
  });
  test('корректный — пустая строка', () => {
    expect(validateDraft(base())).toBe('');
  });
  test.each([
    ['нет названия', (d) => { d.title = ' '; }, 'Введите название сценария'],
    ['пустая группа', (d) => { d.when = { all: [] }; }, 'Пустая группа условий: добавьте условие или удалите группу'],
    ['не выбран параметр', (d) => { d.when.all[0].point = P('', ''); }, 'Условие: выберите параметр'],
    ['нет значения', (d) => { d.when.all[0].value = ''; }, 'Условие: укажите значение'],
    ['диапазон наоборот', (d) => { Object.assign(d.when.all[0], { op: 'between', value: 5, value2: 1 }); }, 'Диапазон: «от» не больше «до»'],
    ['stale без времени', (d) => { Object.assign(d.when.all[0], { op: 'stale', sec: null }); }, '«Нет данных»: укажите время'],
    ['время совпадает', (d) => { d.when.all.push({ time: { from: '01:00', to: '01:00' } }); }, 'Время: начало и окончание совпадают'],
    ['нет дней', (d) => { d.when.all.push({ days: [] }); }, 'Дни недели: выберите хотя бы один день'],
    ['даты наоборот', (d) => { d.when.all.push({ dates: { from: '2027-01-02', to: '2027-01-01' } }); }, 'Даты: начало позже окончания'],
    ['НЕ от пустой группы', (d) => { d.when.all.push({ not: { any: [] } }); }, 'Пустая группа условий: добавьте условие или удалите группу'],
    ['действие без цели', (d) => { d.then = [{ set: P('', ''), value: 1 }]; }, 'Действие: выберите, что изменить'],
    ['оповещение без текста', (d) => { d.then = [{ notify: ' ' }]; }, 'Оповещение: введите текст'],
    ['нет действий', (d) => { d.then = []; }, 'Добавьте хотя бы одно действие'],
    ['приоритет 101', (d) => { d.priority = 101; }, 'Приоритет — целое число от 0 до 100'],
    ['повтор 10 с', (d) => { d.options = { repeatSec: 10 }; }, 'Повтор — не чаще раза в 30 секунд'],
  ])('%s', (_, change, message) => {
    const d = base();
    change(d);
    expect(validateDraft(d)).toBe(message);
  });
});

describe('текст сценария', () => {
  test('И / ИЛИ / НЕ, сравнение с параметром, длительности, действия', () => {
    const sc = {
      when: { all: [
        { time: { from: '23:00', to: '06:00' } },
        { not: { days: [6, 7] } },
        { any: [
          { point: P('room02', 'dTemp02'), op: 'lt', valueFrom: { ...P('room02', 'sTemp02'), offset: -0.5 }, hysteresis: 1, forSec: 120 },
          { point: P('room02', 'dPower01'), op: 'between', value: 10, value2: 20 },
          { point: P('room01', 'dTemp01'), op: 'stale', sec: 3600 },
        ] },
        { dates: { from: '11-01', to: '03-31' } },
      ] },
      then: [{ set: P('room01', 'sLamp01'), value: true }, { notify: 'Готово', delaySec: 600 }],
      else: [{ set: P('room09', 'sX'), valueFrom: P('room02', 'dTemp02') }],
    };
    expect(describeScenario(sc, POINTS)).toEqual({
      when: '(время 23:00–06:00 И НЕ Сб, Вс И (Котельная · Температура < Котельная · Уставка − 0.5 (±1) не менее 2 мин'
        + ' ИЛИ Котельная · Мощность в диапазоне 10…20 ИЛИ Гостиная · Температура в зале: нет данных дольше 1 ч)'
        + ' И даты 01.11–31.03 (каждый год))',
      then: ['Гостиная · Свет (уставка) ← ВКЛ', 'через 10 мин: оповещение «Готово»'],
      else: ['room09/sX ← Котельная · Температура'],
    });
    expect(describeCondition({ dates: { from: '2026-12-30', to: '2027-01-08' } }, POINTS)).toBe('даты 30.12.2026–08.01.2027');
    expect(describeCondition({ days: [1, 2, 3, 4, 5, 6, 7] }, POINTS)).toBe('каждый день');
    expect(formatDuration(90)).toBe('90 с');
  });

  test('заготовка условия: число — текущее значение, логическое — «равно ВКЛ»', () => {
    expect(newPointCond(POINTS.find((p) => p.item === 'dTemp02'))).toEqual({ point: P('room02', 'dTemp02'), op: 'gt', value: 19 });
    expect(newPointCond(POINTS.find((p) => p.item === 'aPump01'))).toEqual({ point: P('room02', 'aPump01'), op: 'eq', value: true });
  });
});

describe('шаблоны', () => {
  test.each(TEMPLATES.filter((t) => t.key !== 'empty').map((t) => [t.key]))('%s: готов к сохранению, режим «Тест»', (key) => {
    const sc = fromTemplate(key, POINTS);
    expect(sc.mode).toBe('test');
    expect(validateDraft(toEditor(sc))).toBe('');
  });

  test('подбор точек: термостат — датчик температуры, его уставка, переключатель', () => {
    const sc = fromTemplate('thermostat', pointOptions(CONFIG, { titleOf, unitOf }));
    expect(sc.when.all[0]).toMatchObject({ point: P('room01', 'dTemp01'), valueFrom: { room: 'room02', item: 'sTemp02' } }); // пары sTemp01 нет → любая числовая уставка
    const sc2 = fromTemplate('thermostat', POINTS.filter((p) => p.room === 'room02'));
    expect(sc2.when.all[0]).toMatchObject({ point: P('room02', 'dTemp02'), valueFrom: { room: 'room02', item: 'sTemp02' } });
    expect(sc2.then[0].set).toEqual(P('room02', 'aPump01'));
  });

  test('без подходящих точек — пустые ссылки (редактор попросит выбрать); неизвестный ключ — «С нуля»', () => {
    const sc = fromTemplate('schedule', []);
    expect(validateDraft(toEditor(sc))).toBe('Действие: выберите, что изменить');
    expect(fromTemplate('nope', POINTS).title).toBe('');
  });
});
