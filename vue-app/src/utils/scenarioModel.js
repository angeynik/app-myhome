// src/utils/scenarioModel.js
// Сценарии автоматизации (docs/scenarios.md): чистые функции для редактора и списка.
//   pointOptions    — точки конфигурации dID для выбора в условиях и действиях
//   new*            — заготовки узлов условия и действий
//   toEditor / fromEditor — сценарий сервера ↔ черновик редактора (корень условия — всегда группа)
//   validateDraft   — проверка перед отправкой (полная проверка — на сервере)
//   describe*       — текст сценария по-русски: «Если … → …; иначе …»
//
// Формат совпадает с сервером (services/scenarioStore.js) и движком Node-RED (functions/_scenario.js).

export const ROOM_KEY_RE = /^room\d+$/;
export const SECTIONS = ['sensors', 'system', 'setpoints'];

export const OPS = [
  { op: 'gt', sign: '>', label: 'больше' },
  { op: 'gte', sign: '≥', label: 'больше или равно' },
  { op: 'lt', sign: '<', label: 'меньше' },
  { op: 'lte', sign: '≤', label: 'меньше или равно' },
  { op: 'eq', sign: '=', label: 'равно' },
  { op: 'ne', sign: '≠', label: 'не равно' },
  { op: 'between', sign: '∈', label: 'в диапазоне' },
  { op: 'outside', sign: '∉', label: 'вне диапазона' },
  { op: 'stale', sign: '⌛', label: 'нет данных дольше' },
];
export const BOOL_OPS = ['eq', 'ne', 'stale'];
export const HYST_OPS = ['gt', 'gte', 'lt', 'lte'];
export const RANGE_OPS = ['between', 'outside'];

export const SEVERITIES = [
  { value: 'info', label: 'Инфо' },
  { value: 'ok', label: 'Норма' },
  { value: 'warning', label: 'Внимание' },
  { value: 'alarm', label: 'Авария' },
];

export const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const MAX_DEPTH = 6;
export const DEFAULT_SETTINGS = { tzOffsetMin: 180, manualOverrideSec: 3600, maxCommandsPerMin: 6 };

const clone = (x) => JSON.parse(JSON.stringify(x));
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const has = (o, k) => o && Object.prototype.hasOwnProperty.call(o, k);

// ── Точки ────────────────────────────────────────────────────────────────
const asBool = (v) => typeof v === 'boolean' || v === 'ON' || v === 'OFF';

// Точки комнат roomNN конфигурации dID: { key: 'room|item', room, item, section, roomTitle, title, unit, type, value }
export function pointOptions(config, { titleOf = (k) => k, unitOf = () => '' } = {}) {
  const list = [];
  for (const [room, data] of Object.entries(config || {})) {
    if (!ROOM_KEY_RE.test(room) || !data || typeof data !== 'object') continue;
    const meta = data._meta || {};
    for (const section of SECTIONS) {
      const items = data[section];
      if (!items || typeof items !== 'object') continue;
      for (const [item, v] of Object.entries(items)) {
        const value = v && typeof v === 'object' ? v.value : v;
        list.push({
          key: `${room}|${item}`,
          room,
          item,
          section,
          roomTitle: data.title || room,
          title: meta[`${section}|${item}`]?.title || titleOf(item) || item,
          unit: unitOf(item) || '',
          type: v?.type === 'bool' || asBool(value) ? 'bool' : 'num',
          value: value ?? null,
        });
      }
    }
  }
  return list.sort((a, b) => a.room.localeCompare(b.room) || SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section)
    || a.item.localeCompare(b.item));
}

export const refKey = (ref) => (ref && ref.room && ref.item ? `${ref.room}|${ref.item}` : '');
export const findPoint = (options, ref) => options.find((p) => p.key === refKey(ref)) || null;
export const refOf = (p) => (p ? { room: p.room, item: p.item } : { room: '', item: '' });

// Куда можно записать: уставки и system (актуаторы); есть ли у точки set — знает только devices.json
export const writable = (p) => p.section === 'setpoints' || p.section === 'system';

export function pointName(options, ref) {
  const p = findPoint(options, ref);
  if (p) return `${p.roomTitle} · ${p.title}`;
  return ref && ref.room ? `${ref.room}/${ref.item}` : '—';
}

// ── Заготовки ────────────────────────────────────────────────────────────
export function newPointCond(p) {
  if (!p) return { point: { room: '', item: '' }, op: 'gt', value: 0 };
  return p.type === 'bool'
    ? { point: refOf(p), op: 'eq', value: true }
    : { point: refOf(p), op: 'gt', value: isNum(Number(p.value)) && p.value !== null ? Number(p.value) : 0 };
}
export const newTime = () => ({ time: { from: '08:00', to: '20:00' } });
export const newDays = () => ({ days: [1, 2, 3, 4, 5] });
export const newDates = () => ({ dates: { from: '12-30', to: '01-08' } });
export const newGroup = (kind = 'any', items = []) => ({ [kind]: items });

export function newSet(p) {
  if (!p) return { set: { room: '', item: '' }, value: true };
  return { set: refOf(p), value: p.type === 'bool' ? true : (isNum(Number(p.value)) && p.value !== null ? Number(p.value) : 0) };
}
export const newNotify = () => ({ notify: '', severity: 'info' });

export function newId() {
  return `sc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyScenario() {
  return {
    id: newId(), title: '', description: '', enabled: true, mode: 'test', priority: 50,
    when: { all: [] }, then: [], else: [], options: {},
  };
}

// ── Вид узла ─────────────────────────────────────────────────────────────
const KINDS = ['all', 'any', 'not', 'time', 'days', 'dates', 'point'];
export const kindOf = (node) => KINDS.find((k) => has(node, k)) || null;
export const isGroup = (node) => has(node, 'all') || has(node, 'any');

// ── Сервер ↔ редактор ────────────────────────────────────────────────────
export function toEditor(sc) {
  const d = clone(sc);
  d.when = d.when && isGroup(d.when) && !d.when.forSec ? d.when : { all: d.when ? [d.when] : [] };
  d.then = d.then || [];
  d.else = d.else || [];
  d.options = d.options || {};
  for (const k of ['createdAt', 'updatedAt', 'updatedBy']) delete d[k];
  return d;
}

// Пустые необязательные поля не отправляем: сервер подставит значения по умолчанию
function cleanNode(n) {
  const out = {};
  for (const [k, v] of Object.entries(n)) {
    if (v === '' || v === null || v === undefined) continue;
    if ((k === 'forSec' || k === 'hysteresis' || k === 'delaySec') && !v) continue;
    if (k === 'all' || k === 'any') out[k] = v.map(cleanNode);
    else if (k === 'not') out[k] = cleanNode(v);
    else out[k] = v;
  }
  return out;
}

export function fromEditor(d) {
  const options = {};
  for (const [k, v] of Object.entries(d.options || {})) {
    if (v === '' || v === null || v === undefined) continue;
    options[k] = v;
  }
  return {
    id: d.id,
    title: String(d.title || '').trim(),
    description: String(d.description || '').trim(),
    enabled: d.enabled !== false,
    mode: d.mode === 'test' ? 'test' : 'active',
    priority: Number(d.priority),
    when: cleanNode(d.when),
    then: (d.then || []).map(cleanNode),
    else: (d.else || []).map(cleanNode),
    options,
  };
}

// ── Проверка ─────────────────────────────────────────────────────────────
function checkNode(n, depth, errs) {
  if (depth > MAX_DEPTH) return errs.push(`Вложенность групп больше ${MAX_DEPTH}`);
  if (isGroup(n)) {
    const items = n.all || n.any;
    if (!items.length) return errs.push('Пустая группа условий: добавьте условие или удалите группу');
    return items.forEach((x) => checkNode(x, depth + 1, errs));
  }
  if (has(n, 'not')) return checkNode(n.not, depth + 1, errs);
  if (has(n, 'time')) {
    if (!n.time.from || !n.time.to) return errs.push('Время: укажите начало и окончание');
    if (n.time.from === n.time.to) return errs.push('Время: начало и окончание совпадают');
    return null;
  }
  if (has(n, 'days')) return n.days.length ? null : errs.push('Дни недели: выберите хотя бы один день');
  if (has(n, 'dates')) {
    const { from, to } = n.dates;
    if (!from || !to) return errs.push('Даты: укажите начало и окончание');
    if (from.length === 10 && from > to) return errs.push('Даты: начало позже окончания');
    return null;
  }
  if (has(n, 'point')) {
    if (!refKey(n.point)) return errs.push('Условие: выберите параметр');
    if (n.op === 'stale') return n.sec > 0 ? null : errs.push('«Нет данных»: укажите время');
    if (n.valueFrom) return refKey(n.valueFrom) ? null : errs.push('Условие: выберите параметр для сравнения');
    if (n.value === '' || n.value === null || n.value === undefined) return errs.push('Условие: укажите значение');
    if (RANGE_OPS.includes(n.op) && !(isNum(n.value) && isNum(n.value2) && n.value <= n.value2)) {
      return errs.push('Диапазон: «от» не больше «до»');
    }
    return null;
  }
  return errs.push('Неизвестное условие');
}

function checkActions(list, errs) {
  for (const a of list) {
    if (has(a, 'set')) {
      if (!refKey(a.set)) errs.push('Действие: выберите, что изменить');
      else if (a.valueFrom ? !refKey(a.valueFrom) : (a.value === '' || a.value === null || a.value === undefined)) {
        errs.push('Действие: укажите значение');
      }
    } else if (has(a, 'notify') && !String(a.notify || '').trim()) {
      errs.push('Оповещение: введите текст');
    }
  }
}

// Текст первой ошибки или ''
export function validateDraft(d) {
  const errs = [];
  if (!String(d.title || '').trim()) errs.push('Введите название сценария');
  checkNode(d.when, 1, errs);
  checkActions(d.then || [], errs);
  checkActions(d.else || [], errs);
  if (!(d.then || []).length && !(d.else || []).length) errs.push('Добавьте хотя бы одно действие');
  const p = Number(d.priority);
  if (!Number.isInteger(p) || p < 0 || p > 100) errs.push('Приоритет — целое число от 0 до 100');
  const r = Number(d.options?.repeatSec || 0);
  if (r > 0 && r < 30) errs.push('Повтор — не чаще раза в 30 секунд');
  return errs[0] || '';
}

// ── Текст ────────────────────────────────────────────────────────────────
export function formatDuration(sec) {
  const s = Number(sec) || 0;
  if (s && s % 3600 === 0) return `${s / 3600} ч`;
  if (s && s % 60 === 0) return `${s / 60} мин`;
  return `${s} с`;
}

const valueText = (v) => (v === true ? 'ВКЛ' : v === false ? 'ВЫКЛ' : String(v));
const dateText = (s) => (s.length === 5 ? `${s.slice(3)}.${s.slice(0, 2)}` : `${s.slice(8)}.${s.slice(5, 7)}.${s.slice(0, 4)}`);

export function describeCondition(n, options) {
  if (!n) return '—';
  let text;
  if (isGroup(n)) {
    const items = (n.all || n.any).map((x) => describeCondition(x, options));
    text = items.length > 1 ? `(${items.join(n.all ? ' И ' : ' ИЛИ ')})` : (items[0] || '—');
  } else if (has(n, 'not')) {
    text = `НЕ ${describeCondition(n.not, options)}`;
  } else if (has(n, 'time')) {
    text = `время ${n.time.from}–${n.time.to}`;
  } else if (has(n, 'days')) {
    text = n.days.length === 7 ? 'каждый день' : n.days.map((d) => WEEK_DAYS[d - 1]).join(', ');
  } else if (has(n, 'dates')) {
    text = `даты ${dateText(n.dates.from)}–${dateText(n.dates.to)}${n.dates.from.length === 5 ? ' (каждый год)' : ''}`;
  } else if (has(n, 'point')) {
    const name = pointName(options, n.point);
    const op = OPS.find((o) => o.op === n.op);
    if (n.op === 'stale') text = `${name}: нет данных дольше ${formatDuration(n.sec)}`;
    else if (RANGE_OPS.includes(n.op)) text = `${name} ${op.label} ${n.value}…${n.value2}`;
    else {
      const target = n.valueFrom
        ? `${pointName(options, n.valueFrom)}${n.valueFrom.offset ? ` ${n.valueFrom.offset > 0 ? '+' : '−'} ${Math.abs(n.valueFrom.offset)}` : ''}`
        : valueText(n.value);
      text = `${name} ${op ? op.sign : n.op} ${target}${n.hysteresis ? ` (±${n.hysteresis})` : ''}`;
    }
  } else {
    text = '?';
  }
  return n.forSec ? `${text} не менее ${formatDuration(n.forSec)}` : text;
}

export function describeAction(a, options) {
  const delay = a.delaySec ? `через ${formatDuration(a.delaySec)}: ` : '';
  if (has(a, 'set')) {
    const v = a.valueFrom
      ? `${pointName(options, a.valueFrom)}${a.valueFrom.offset ? ` ${a.valueFrom.offset > 0 ? '+' : '−'} ${Math.abs(a.valueFrom.offset)}` : ''}`
      : valueText(a.value);
    return `${delay}${pointName(options, a.set)} ← ${v}`;
  }
  if (has(a, 'notify')) return `${delay}оповещение «${a.notify}»`;
  return '?';
}

export function describeScenario(sc, options) {
  return {
    when: describeCondition(sc.when, options),
    then: (sc.then || []).map((a) => describeAction(a, options)),
    else: (sc.else || []).map((a) => describeAction(a, options)),
  };
}
