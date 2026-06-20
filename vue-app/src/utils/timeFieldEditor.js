// src/utils/timeFieldEditor.js

/**
 * TimeFieldEditor — утилита для разбора, редактирования и сборки временного интервала ЧЧ:ММ.
 * Не зависит от Vuex. Используется в MainBodySchedule, settingsConfig и DashBoard.
 */

export const TIME_LIMITS = {
  hours:   { min: 0, max: 23, step: 1 },
  minutes: { min: 0, max: 59, step: 1 },
};

/**
 * Разбирает строку "HH:MM" в объект { hours, minutes }.
 * @param {string} timeStr
 * @returns {{ hours: number, minutes: number }}
 */
export function parseTimeString(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return { hours: 0, minutes: 0 };
  const [h, m] = timeStr.split(':').map(Number);
  return {
    hours:   Number.isFinite(h) ? Math.min(Math.max(h, 0), 23) : 0,
    minutes: Number.isFinite(m) ? Math.min(Math.max(m, 0), 59) : 0,
  };
}

/**
 * Собирает строку "HH:MM" из числовых часов и минут.
 * @param {number} hours
 * @param {number} minutes
 * @returns {string}
 */
export function buildTimeString(hours, minutes) {
  const h = String(Math.min(Math.max(Math.round(hours),   0), 23)).padStart(2, '0');
  const m = String(Math.min(Math.max(Math.round(minutes), 0), 59)).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Применяет изменение одного поля (hours или minutes) к существующей строке времени.
 * @param {string} currentTimeStr  — текущее значение "HH:MM"
 * @param {'hours'|'minutes'} field — какое поле меняем
 * @param {number} newPartValue     — новое значение поля (0-23 для hours, 0-59 для minutes)
 * @returns {string}               — новая строка "HH:MM"
 */
export function applyTimePart(currentTimeStr, field, newPartValue) {
  const { hours, minutes } = parseTimeString(currentTimeStr);
  if (field === 'hours') {
    return buildTimeString(newPartValue, minutes);
  } else if (field === 'minutes') {
    return buildTimeString(hours, newPartValue);
  }
  return currentTimeStr; // без изменений если field неизвестен
}

/**
 * Извлекает числовое значение нужного поля из строки времени.
 * @param {string} timeStr
 * @param {'hours'|'minutes'} field
 * @returns {number}
 */
export function extractTimePart(timeStr, field) {
  const { hours, minutes } = parseTimeString(timeStr);
  return field === 'hours' ? hours : minutes;
}

/**
 * Возвращает лимиты для MainSetpoint в зависимости от редактируемого поля.
 * @param {'hours'|'minutes'} field
 * @returns {{ limLow: number, limHigh: number, limStep: number }}
 */
export function getTimeLimits(field) {
  const lim = TIME_LIMITS[field] ?? TIME_LIMITS.hours;
  return { limLow: lim.min, limHigh: lim.max, limStep: lim.step };
}

/**
 * Применяет изменение одного поля (hours или minutes) с переносом через границу.
 * При minutes > 59 → прибавляет часы. При minutes < 0 → убавляет часы.
 * При hours > 23 → зажимается до 23:59. При hours < 0 → зажимается до 00:00.
 *
 * @param {string} currentTimeStr  — текущее значение "HH:MM"
 * @param {'hours'|'minutes'} field — какое поле меняем
 * @param {number} newPartValue     — новое значение (может выходить за лимиты)
 * @returns {string}               — новая строка "HH:MM"
 */
export function applyTimePartWithCarry(currentTimeStr, field, newPartValue) {
  const { hours, minutes } = parseTimeString(currentTimeStr);

  if (field === 'hours') {
    // Для часов просто зажимаем — перенос через сутки не нужен
    return buildTimeString(newPartValue, minutes);
  }

  if (field === 'minutes') {
    let totalMinutes = newPartValue;
    let newHours = hours;

    if (totalMinutes > 59) {
      newHours += Math.floor(totalMinutes / 60);
      totalMinutes = totalMinutes % 60;
    } else if (totalMinutes < 0) {
      const borrow = Math.ceil(Math.abs(totalMinutes) / 60);
      newHours -= borrow;
      totalMinutes = totalMinutes + borrow * 60;
    }

    // Зажимаем итоговые часы в пределах суток
    newHours = Math.min(Math.max(newHours, 0), 23);
    return buildTimeString(newHours, totalMinutes);
  }

  return currentTimeStr;
}