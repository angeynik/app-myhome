// src/utils/timeUtils.js
// Утилиты для работы со временем. Все функции чистые и синхронные.
//
// Формат «московского» времени, которым обмениваются клиент и сервер:
//   "DD.MM.YYYY, HH:MM:SS"  (результат nowMoscow()).
// Москва — фиксированный UTC+3 (без перехода на летнее время с 2014 года).

const MSK = 'Europe/Moscow';
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;
const MSK_STRING_RE = /^(\d{1,2})\.(\d{1,2})\.(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/;

// ─────────────────────────────────────────────────────────────
// 1. ТЕКУЩЕЕ ВРЕМЯ / ПАРСИНГ
// ─────────────────────────────────────────────────────────────

/** Текущая дата/время в формате "DD.MM.YYYY, HH:MM:SS" (МСК). */
export function nowMoscow() {
  return new Date().toLocaleString('ru-RU', { timeZone: MSK });
}

/**
 * Парсит строку "DD.MM.YYYY, HH:MM:SS" (МСК) в timestamp (мс, UTC-эпоха).
 *
 * ВАЖНО: раньше строка интерпретировалась как ЛОКАЛЬНОЕ время устройства,
 * из-за чего разница «N мин назад» врала у всех, кто не в UTC+3.
 * @returns {number} timestamp или NaN
 */
export function parseMoscowDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return NaN;
  const m = MSK_STRING_RE.exec(dateStr.trim());
  if (!m) return NaN;
  const [, day, month, year, hours, minutes, seconds = '0'] = m;
  return Date.UTC(+year, +month - 1, +day, +hours, +minutes, +seconds) - MSK_OFFSET_MS;
}

// ─────────────────────────────────────────────────────────────
// 2. КОНВЕРТАЦИЯ "HH:MM" ↔ минуты
// ─────────────────────────────────────────────────────────────

/** "HH:MM" → минуты от начала суток. 0 при невалидном вводе. */
export function timeToMinutes(timeString) {
  if (!timeString || typeof timeString !== 'string') return 0;
  const parts = timeString.split(':');
  if (parts.length < 2) return 0;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (
    Number.isNaN(hours) || Number.isNaN(minutes)
    || hours < 0 || hours > 23
    || minutes < 0 || minutes > 59
  ) {
    return 0;
  }
  return hours * 60 + minutes;
}

/** Минуты от начала суток (0–1439) → "HH:MM". '00:00' при некорректном вводе. */
export function minutesToTime(totalMinutes) {
  if (typeof totalMinutes !== 'number' || totalMinutes < 0 || totalMinutes > 1439) {
    return '00:00';
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

// ─────────────────────────────────────────────────────────────
// 3. ГЕНЕРАЦИЯ ВРЕМЕННОГО ИНТЕРВАЛА
// ─────────────────────────────────────────────────────────────

/**
 * Пара startTime/endTime относительно текущего московского времени.
 * @param {number} offset   смещение начала от текущего момента, мин
 * @param {number} duration длительность, мин
 */
export function createTimePoint({ offset = 1, duration = 10 } = {}) {
  try {
    const start = new Date(Date.now() + offset * 60_000);
    const startTime = start
      .toLocaleTimeString('ru-RU', { timeZone: MSK, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .substring(0, 5);

    const endMinutes = Math.min(timeToMinutes(startTime) + duration, 1439);
    return { startTime, endTime: minutesToTime(endMinutes) };
  } catch {
    return { startTime: '00:00', endTime: '00:10' };
  }
}

// ─────────────────────────────────────────────────────────────
// 4. ФОРМАТИРОВАНИЕ ДЛЯ ОТОБРАЖЕНИЯ
// ─────────────────────────────────────────────────────────────

const mskFormatter = new Intl.DateTimeFormat('ru-RU', {
  timeZone: MSK,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
  hourCycle: 'h23',
});

function mskParts(ms) {
  const parts = {};
  for (const p of mskFormatter.formatToParts(new Date(ms))) parts[p.type] = p.value;
  return parts;
}

function toTimestamp(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (value.includes(',')) return parseMoscowDate(value);   // "15.05.2024, 14:30:00"
    return new Date(value).getTime();                          // ISO
  }
  return NaN;
}

/**
 * Для отображения в карточке:
 *  - сегодня (по МСК)  → "HH:MM"
 *  - другой день       → "DD:MM:YY"
 *  - невалидное        → исходная строка, '—' для пустого
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  const ts = toTimestamp(dateString);
  if (Number.isNaN(ts)) return String(dateString);

  const p = mskParts(ts);
  const n = mskParts(Date.now());
  const isToday = p.day === n.day && p.month === n.month && p.year === n.year;

  return isToday
    ? `${p.hour}:${p.minute}`
    : `${p.day}:${p.month}:${p.year.slice(-2)}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * "HH:MM" с HTML-подсветкой активной части (часы или минуты) — для v-html.
 * Значение валидируется и экранируется: строки времени приходят с сервера,
 * и произвольный текст в v-html — это XSS.
 */
export function formatTimeWithHighlight(timeString, editMode, isSelected) {
  const time = String(timeString ?? '').trim() || '00:00';
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) return escapeHtml(time);

  const [, hours, minutes] = m;
  if (!isSelected) return `${hours}:${minutes}`;

  if (editMode === 'minutes') {
    return `<span class="time-highlight-simple">${hours}</span> <span class="time-dimmed">:${minutes}</span>`;
  }
  return `<span class="time-dimmed">${hours}:</span> <span class="time-highlight-simple">${minutes}</span>`;
}
