// src/utils/scenarioTemplates.js
// Шаблоны сценариев: готовый сценарий, в который подставлены подходящие точки конфигурации
// (pointOptions). Пользователь выбирает шаблон и в редакторе меняет только нужное.
// Новый сценарий из шаблона создаётся в режиме «Тест»: команд нет, пока его не включат.
import { emptyScenario, newSet, refOf, writable } from './scenarioModel';

const prefix = (p, re) => re.test(p.item);
const first = (options, ...preds) => {
  for (const pred of preds) {
    const p = options.find(pred);
    if (p) return p;
  }
  return null;
};

// Подбор точек: уставка, переключатель, датчик температуры, любой датчик
const pickSetpointNum = (o) => first(o, (p) => p.section === 'setpoints' && p.type === 'num', (p) => writable(p) && p.type === 'num');
const pickSwitch = (o) => first(o, (p) => writable(p) && p.type === 'bool');
const pickTemp = (o) => first(o, (p) => prefix(p, /^dTemp/), (p) => p.section === 'sensors' && p.type === 'num');
const pickSensor = (o) => first(o, (p) => p.section === 'sensors' && p.type === 'num', (p) => p.section === 'sensors');
const pickPower = (o) => first(o, (p) => prefix(p, /^d(Power|Current|Press)/), (p) => p.section === 'sensors' && p.type === 'num');
const pickHum = (o) => first(o, (p) => prefix(p, /^dHum/), (p) => p.section === 'sensors' && p.type === 'num');

// Пара «датчик ↔ уставка» по суффиксу (dTemp02 ↔ sTemp02), иначе любая числовая уставка
function pairSetpoint(options, sensor) {
  if (!sensor) return pickSetpointNum(options);
  const name = `s${sensor.item.slice(1)}`;
  return options.find((p) => p.room === sensor.room && p.item === name) || pickSetpointNum(options);
}

function make(title, fields) {
  return { ...emptyScenario(), title, ...fields };
}

const set = (p, value) => ({ ...newSet(p), ...(value !== undefined ? { value } : {}) });

export const TEMPLATES = [
  {
    key: 'schedule',
    title: 'Уставка по расписанию',
    hint: 'Ночью — одно значение, днём — другое (температура, влажность)',
    build(o) {
      const sp = pickSetpointNum(o);
      return make('Ночной режим', {
        when: { all: [{ time: { from: '23:00', to: '06:00' } }] },
        then: [set(sp, 18)],
        else: [set(sp, 21)],
      });
    },
  },
  {
    key: 'switchTime',
    title: 'Включение по времени',
    hint: 'Свет, полив, вентиляция по часам и дням недели',
    build(o) {
      const sw = pickSwitch(o);
      return make('Включение по времени', {
        when: { all: [{ time: { from: '18:00', to: '23:00' } }, { days: [1, 2, 3, 4, 5] }] },
        then: [set(sw, true)],
        else: [set(sw, false)],
      });
    },
  },
  {
    key: 'threshold',
    title: 'Порог датчика',
    hint: 'Влажность выше 70 % — включить вытяжку, ниже — выключить',
    build(o) {
      const s = pickHum(o);
      const sw = pickSwitch(o);
      return make('Вытяжка по влажности', {
        when: { all: [{ point: refOf(s), op: 'gt', value: 70, hysteresis: 5, forSec: 60 }] },
        then: [set(sw, true)],
        else: [set(sw, false)],
        options: { minOnSec: 300 },
      });
    },
  },
  {
    key: 'thermostat',
    title: 'Термостат',
    hint: 'Нагрев, пока температура ниже уставки; гистерезис и защита реле',
    build(o) {
      const t = pickTemp(o);
      const sp = pairSetpoint(o, t);
      const sw = pickSwitch(o);
      return make('Термостат', {
        when: { all: [{ point: refOf(t), op: 'lt', valueFrom: { ...refOf(sp), offset: 0 }, hysteresis: 0.5 }] },
        then: [set(sw, true)],
        else: [set(sw, false)],
        options: { minOnSec: 300, minOffSec: 300, onUnknown: 'else' },
      });
    },
  },
  {
    key: 'protect',
    title: 'Защита',
    hint: 'Перегрузка или авария — выключить и сообщить; ручное управление не мешает',
    build(o) {
      const s = pickPower(o);
      const sw = pickSwitch(o);
      return make('Защита от перегрузки', {
        priority: 90,
        when: { all: [{ point: refOf(s), op: 'gt', value: 1500, forSec: 30 }] },
        then: [set(sw, false), { notify: 'Сработала защита: оборудование выключено', severity: 'alarm' }],
        else: [{ notify: 'Параметры снова в норме', severity: 'ok' }],
        options: { minOnSec: 600, repeatSec: 60, manualOverrideSec: 0 },
      });
    },
  },
  {
    key: 'silent',
    title: 'Датчик молчит',
    hint: 'Нет данных дольше часа — оповещение',
    build(o) {
      const s = pickSensor(o);
      return make('Датчик молчит', {
        when: { all: [{ point: refOf(s), op: 'stale', sec: 3600 }] },
        then: [{ notify: 'Датчик не присылает данные больше часа', severity: 'warning' }],
        else: [{ notify: 'Датчик снова на связи', severity: 'ok' }],
      });
    },
  },
  {
    key: 'vacation',
    title: 'Отпуск',
    hint: 'На даты отъезда — экономичная уставка, важнее остальных сценариев',
    build(o) {
      const sp = pickSetpointNum(o);
      const today = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
      return make('Отпуск', {
        priority: 80,
        when: { all: [{ dates: { from: today, to: today } }] },
        then: [set(sp, 12)],
        else: [set(sp, 21)],
        options: { onStart: 'skip' },
      });
    },
  },
  {
    key: 'empty',
    title: 'С нуля',
    hint: 'Пустой сценарий: условия и действия добавить самому',
    build() {
      return make('', {});
    },
  },
];

export function fromTemplate(key, options) {
  const t = TEMPLATES.find((x) => x.key === key) || TEMPLATES[TEMPLATES.length - 1];
  return t.build(options || []);
}
