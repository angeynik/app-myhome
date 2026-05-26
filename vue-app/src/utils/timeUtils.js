// src/utils/timeUtils.js
// Утилиты для работы со временем.
// Все функции — чистые (pure), синхронные, без зависимостей от Vuex.

// ─────────────────────────────────────────────────────────────
// 1. ТЕКУЩЕЕ ВРЕМЯ / МЕТКИ
// ─────────────────────────────────────────────────────────────

/**
 * Текущая дата/время в московском формате "DD.MM.YYYY, HH:MM:SS"
 *
 * Замена везде, где используется:
 *   new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
 *
 * Файлы: store/index.js, store/modules/config.js, components/MainBodySettings.vue
 */
export function nowMoscow() {
  return new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
}

/**
 * Текущая дата/время в формате ISO (UTC)
 *
 * Замена: action settingsConfig/getCurrentDateTime
 * Файлы: store/modules/settingsConfig.js (action getCurrentDateTime)
 */
export function getCurrentDateTime() {
  return new Date().toISOString();
}

/**
 * Текущее время в формате "HH:MM" (локальное время устройства)
 *
 * Замена: action settingsConfig/getCurrentTimeString
 * Файлы: store/modules/settingsConfig.js (action getCurrentTimeString)
 */
export function getCurrentTimeString() {
  const now = new Date();
  return (
    String(now.getHours()).padStart(2, '0') +
    ':' +
    String(now.getMinutes()).padStart(2, '0')
  );
}


// ─────────────────────────────────────────────────────────────
// 2. КОНВЕРТАЦИЯ ВРЕМЕНИ
// ─────────────────────────────────────────────────────────────

/**
 * Преобразует строку "HH:MM" в число минут от начала суток.
 * Возвращает 0 при невалидном вводе.
 *
 * Замена: action settingsConfig/timeToMinutes
 *   ДО:   const minutes = await dispatch('timeToMinutes', '14:30');
 *   ПОСЛЕ: import { timeToMinutes } from '@/utils/timeUtils';
 *          const minutes = timeToMinutes('14:30'); // 870
 *
 * Файлы: store/modules/settingsConfig.js (actions checkOverlap, validateScheduleTime)
 */
export function timeToMinutes(timeString) {
  if (!timeString || typeof timeString !== 'string') return 0;
  const parts = timeString.split(':');
  if (parts.length < 2) return 0;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (
    isNaN(hours) || isNaN(minutes) ||
    hours < 0 || hours > 23 ||
    minutes < 0 || minutes > 59
  ) {
    return 0;
  }
  return hours * 60 + minutes;
}

/**
 * Преобразует число минут от начала суток в строку "HH:MM".
 * Принимает значения 0–1439. Возвращает '00:00' при некорректном вводе.
 *
 * Замена: action settingsConfig/minutesToTime
 *   ДО:   const time = await dispatch('minutesToTime', 870);
 *   ПОСЛЕ: import { minutesToTime } from '@/utils/timeUtils';
 *          const time = minutesToTime(870); // '14:30'
 *
 * Файлы: store/modules/settingsConfig.js (actions checkOverlap)
 */
export function minutesToTime(totalMinutes) {
  if (
    typeof totalMinutes !== 'number' ||
    totalMinutes < 0 ||
    totalMinutes > 1439
  ) {
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
 * Создаёт пару startTime / endTime относительно текущего московского времени.
 *
 * @param {number} offset   - смещение начала от текущего момента, мин (по умолч. 1)
 * @param {number} duration - длительность интервала, мин (по умолч. 10)
 * @returns {{ startTime: string, endTime: string }}
 *
 * Замена: action settingsConfig/createTimePoint
 *   ДО:   const { startTime, endTime } = await dispatch('settingsConfig/createTimePoint');
 *   ПОСЛЕ: import { createTimePoint } from '@/utils/timeUtils';
 *          const { startTime, endTime } = createTimePoint();
 *
 * Файлы: store/modules/settingsConfig.js (action createTimePoint),
 *        components/MainBodySettings.vue (метод generationTime)
 *
 * ВАЖНО: Старый action createTimePoint вызывал dispatch('formatDate', { returnTimeOnly: true })
 *        — этого флага formatDate не поддерживала, поэтому парсинг через .split(', ')[1]
 *        был хрупким. Эта реализация получает московское время напрямую.
 */
export function createTimePoint({ offset = 1, duration = 10 } = {}) {
  try {
    const now = new Date();
    const offsetDate = new Date(now.getTime() + offset * 60_000);

    // Получаем время в московском часовом поясе напрямую
    const moscowTime = offsetDate.toLocaleTimeString('ru-RU', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    // toLocaleTimeString возвращает "HH:MM" или "HH:MM:SS" — берём первые 5 символов
    const startTime = moscowTime.substring(0, 5);

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = Math.min(startMinutes + duration, 1439);
    const endTime = minutesToTime(endMinutes);

    return { startTime, endTime };
  } catch {
    return { startTime: '00:00', endTime: '00:10' };
  }
}


// ─────────────────────────────────────────────────────────────
// 4. ФОРМАТИРОВАНИЕ ДЛЯ ОТОБРАЖЕНИЯ
// ─────────────────────────────────────────────────────────────

/**
 * Форматирует дату/время для отображения в карточке элемента:
 * - Сегодня         → "HH:MM"
 * - Другой день     → "DD:MM:YY"
 * - Невалидное      → исходная строка или '—'
 *
 * Принимает: ISO-строку, русский формат "DD.MM.YYYY, HH:MM:SS", объект Date.
 *
 * Замена:
 *   1) getter settingsConfig/dateTimeUtils.formatDate — используется в шаблонах:
 *      MainBodySchedule.vue     → {{ dateTimeUtils.formatDate(scheduleData.createdAt) }}
 *      MainBodyNotifications.vue → {{ dateTimeUtils.formatDate(notificationData.createdAt) }}
 *
 *   2) action settingsConfig/formatDate — используется в action createTimePoint
 *      (после замены createTimePoint на эту утилиту этот action больше не нужен)
 *
 *   ДО (шаблон через геттер):
 *     ...mapGetters('settingsConfig', ['dateTimeUtils'])
 *     {{ dateTimeUtils.formatDate(item.createdAt) }}
 *
 *   ПОСЛЕ (прямой импорт в компоненте):
 *     import { formatDate } from '@/utils/timeUtils';
 *     // в methods или computed:
 *     formatDate,                        // делаем доступным в шаблоне
 *     // или в шаблоне через метод-обёртку:
 *     formatDateDisplay(val) { return formatDate(val); }
 *
 * @param {string|Date} dateString
 * @param {string}      locale     - локаль (по умолч. 'ru-RU')
 */
export function formatDate(dateString, locale = 'ru-RU') {
  if (!dateString) return '—';

  let date = null;

  if (dateString instanceof Date) {
    date = dateString;
  } else if (typeof dateString === 'string') {
    if (dateString.includes('-') && !dateString.includes(',')) {
      // ISO-формат: "2024-05-15T14:30:00.000Z"
      date = new Date(dateString);
    } else if (dateString.includes(',')) {
      // Русский формат: "15.05.2024, 14:30:00"
      const [datePart, timePart] = dateString.split(', ');
      if (datePart && timePart) {
        const [d, mo, y] = datePart.split('.').map(Number);
        const [h, mi, s = 0] = timePart.split(':').map(Number);
        if (!isNaN(d) && !isNaN(mo) && !isNaN(y)) {
          date = new Date(y, mo - 1, d, h, mi, s);
        }
      }
    }
  }

  if (!date || isNaN(date.getTime())) return String(dateString);

  const now = new Date();
  const isToday =
    date.getDate()     === now.getDate()     &&
    date.getMonth()    === now.getMonth()    &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString(locale, {
      hour:   '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  const d  = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const y  = String(date.getFullYear()).slice(-2);
  return `${d}:${mo}:${y}`;
}

/**
 * Форматирует строку "HH:MM" с HTML-подсветкой активной части (часы или минуты).
 * Возвращает HTML-строку — используйте v-html.
 *
 * Замена: getter settingsConfig/dateTimeUtils.formatTimeWithHighlight
 *
 *   ДО (в компоненте через геттер):
 *     ...mapGetters('settingsConfig', ['dateTimeUtils'])
 *     this.dateTimeUtils.formatTimeWithHighlight(time, this.timeEditMode, isSelected)
 *
 *   ПОСЛЕ (прямой импорт):
 *     import { formatTimeWithHighlight } from '@/utils/timeUtils';
 *     // в methods компонента:
 *     formatTimeWithHighlight,
 *     // в computed:
 *     formattedStartDisplay() {
 *       return formatTimeWithHighlight(
 *         this.displayStartTime, this.timeEditMode, this.isFieldSelected('startTime')
 *       );
 *     }
 *
 * Файлы: components/MainBodySchedule.vue     (computed formattedStartDisplay, formattedEndDisplay)
 *        components/MainBodyNotifications.vue (computed formattedStartDisplay, formattedEndDisplay)
 *
 * @param {string}  timeString  - строка времени "HH:MM"
 * @param {string}  editMode    - 'hours' | 'minutes'
 * @param {boolean} isSelected  - выделено ли поле
 */
export function formatTimeWithHighlight(timeString, editMode, isSelected) {
  const time = timeString || '00:00';
  if (!time.includes(':')) return time;
  const [hours, minutes] = time.split(':');
  if (!isSelected) return `${hours}:${minutes}`;
  if (editMode === 'minutes') {
    return (
      `<span class="time-highlight-simple">${hours}</span>` +
      ` <span class="time-dimmed">:${minutes}</span>`
    );
  }
  return (
    `<span class="time-dimmed">${hours}:</span>` +
    ` <span class="time-highlight-simple">${minutes}</span>`
  );
}


// ─────────────────────────────────────────────────────────────
// 5. ВАЛИДАЦИЯ
// ─────────────────────────────────────────────────────────────

/**
 * Проверяет корректность временного интервала расписания.
 * endTime должен быть строго позже startTime.
 *
 * Замена: action settingsConfig/validateScheduleTime
 *         getter settingsConfig/validationUtils.validateScheduleTime
 *
 *   ДО:   await dispatch('validateScheduleTime', schedule)
 *   ПОСЛЕ: import { validateScheduleTime } from '@/utils/timeUtils';
 *          const result = validateScheduleTime(schedule);
 *
 * @param {{ startTime: string, endTime: string }} schedule
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateScheduleTime(schedule) {
  if (!schedule?.startTime || !schedule?.endTime) {
    return { valid: false, message: 'Отсутствует время начала или окончания' };
  }
  const start = timeToMinutes(schedule.startTime);
  const end   = timeToMinutes(schedule.endTime);
  if (end <= start) {
    return {
      valid: false,
      message: 'Время окончания должно быть позже времени начала',
    };
  }
  return { valid: true };
}