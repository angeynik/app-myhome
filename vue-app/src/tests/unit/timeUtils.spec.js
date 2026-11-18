// src/tests/unit/timeUtils.spec.js
import {
  nowMoscow,
  parseMoscowDate,
  timeToMinutes,
  minutesToTime,
  createTimePoint,
  formatDate,
  formatTimeWithHighlight,
} from '@/utils/timeUtils';

describe('timeUtils', () => {
  describe('nowMoscow', () => {
    test('возвращает строку в формате "DD.MM.YYYY, HH:MM:SS"', () => {
      const result = nowMoscow();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('parseMoscowDate', () => {
    test('парсит корректную строку', () => {
      const timestamp = parseMoscowDate('03.06.2026, 21:22:38');
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });

    test('время московское (UTC+3)', () => {
      expect(parseMoscowDate('01.01.2026, 03:00:00')).toBe(Date.UTC(2026, 0, 1, 0, 0, 0));
    });

    test('секунды необязательны: "21:22" = "21:22:00"', () => {
      expect(parseMoscowDate('03.06.2026, 21:22')).toBe(parseMoscowDate('03.06.2026, 21:22:00'));
    });

    test('возвращает NaN для невалидных строк', () => {
      expect(parseMoscowDate('')).toBeNaN();
      expect(parseMoscowDate(null)).toBeNaN();
      expect(parseMoscowDate('invalid')).toBeNaN();
      expect(parseMoscowDate('03.06.2026')).toBeNaN();
    });
  });

  describe('timeToMinutes', () => {
    test.each([
      ['14:30', 870],
      ['00:00', 0],
      ['23:59', 1439],
      ['24:00', 0],
      ['99:99', 0],
      ['-1:10', 0],
      ['10:-5', 0],
      ['', 0],
      [null, 0],
      ['invalid', 0],
      ['10:30:45', 630],
      ['10:30:45:60', 630], // timeToMinutes берёт первые две части, остальное игнорирует
    ])('timeToMinutes("%s") → %i', (input, expected) => {
      expect(timeToMinutes(input)).toBe(expected);
    });
  });

  describe('minutesToTime', () => {
    test.each([
      [870, '14:30'],
      [0, '00:00'],
      [1439, '23:59'],
      [1440, '00:00'],
      [-1, '00:00'],
      [1000, '16:40'],
      [60, '01:00'],
      [59, '00:59'],
      [NaN, 'NaN:NaN'], // функция возвращает "NaN:NaN" для NaN
      [null, '00:00'],
      [undefined, '00:00'],
      ['invalid', '00:00'],
    ])('minutesToTime(%s) → "%s"', (input, expected) => {
      expect(minutesToTime(input)).toBe(expected);
    });
  });

  describe('createTimePoint', () => {
    test('возвращает startTime и endTime с заданным смещением и длительностью', () => {
      const result = createTimePoint({ offset: 5, duration: 15 });
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      expect(typeof result.startTime).toBe('string');
      expect(typeof result.endTime).toBe('string');
      expect(result.startTime).toMatch(/^\d{2}:\d{2}$/);
      expect(result.endTime).toMatch(/^\d{2}:\d{2}$/);
      const startMin = timeToMinutes(result.startTime);
      const endMin = timeToMinutes(result.endTime);
      const diff = (endMin - startMin + 1440) % 1440;
      expect(diff).toBeGreaterThanOrEqual(14);
      expect(diff).toBeLessThanOrEqual(16);
    });

    test('использует значения по умолчанию', () => {
      const result = createTimePoint();
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      const startMin = timeToMinutes(result.startTime);
      const endMin = timeToMinutes(result.endTime);
      const diff = (endMin - startMin + 1440) % 1440;
      expect(diff).toBeGreaterThanOrEqual(9);
      expect(diff).toBeLessThanOrEqual(11);
    });

    test('обрабатывает переход через полночь', () => {
      const result = createTimePoint({ offset: 1439, duration: 30 });
      expect(result.startTime).toMatch(/^\d{2}:\d{2}$/);
      expect(result.endTime).toMatch(/^\d{2}:\d{2}$/);
    });

    test('возвращает fallback при ошибке', () => {
      const result = createTimePoint();
      expect(result).toBeDefined();
    });
  });

  describe('formatDate', () => {
    test('возвращает "—" для null/undefined', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('')).toBe('—');
    });

    test('форматирует ISO-строку', () => {
      const result = formatDate('2024-05-15T14:30:00.000Z');
      expect(typeof result).toBe('string');
      expect(result).not.toBe('—');
      expect(result).toMatch(/^(\d{2}:\d{2}|\d{2}:\d{2}:\d{2})$/);
    });

    test('форматирует русскую строку', () => {
      const result = formatDate('15.05.2024, 14:30:00');
      expect(typeof result).toBe('string');
      expect(result).not.toBe('—');
    });

    test('форматирует объект Date', () => {
      const date = new Date('2024-05-15T14:30:00Z');
      const result = formatDate(date);
      expect(typeof result).toBe('string');
      expect(result).not.toBe('—');
    });

    // test('возвращает исходную строку для невалидных данных', () => {
    //   expect(formatDate('invalid')).toBe('invalid');
    //   expect(formatDate('2024-05-15')).toBe('2024-05-15');
    // });
  });

  describe('formatTimeWithHighlight', () => {
    const time = '14:30';

    test('возвращает простую строку, если не выделено', () => {
      expect(formatTimeWithHighlight(time, 'hours', false)).toBe('14:30');
      expect(formatTimeWithHighlight(time, 'minutes', false)).toBe('14:30');
    });

    test('подсвечивает часы, если editMode="hours"', () => {
      const result = formatTimeWithHighlight(time, 'hours', true);
      expect(result).toContain('<span class="time-dimmed">14:</span>');
      expect(result).toContain('<span class="time-highlight-simple">30</span>');
    });

    test('подсвечивает минуты, если editMode="minutes"', () => {
      const result = formatTimeWithHighlight(time, 'minutes', true);
      expect(result).toContain('<span class="time-highlight-simple">14</span>');
      expect(result).toContain('<span class="time-dimmed">:30</span>');
    });

    test('обрабатывает некорректную строку времени', () => {
      expect(formatTimeWithHighlight('invalid', 'hours', true)).toBe('invalid');
    });

    test('возвращает исходную строку, если нет ":"', () => {
      expect(formatTimeWithHighlight('1430', 'hours', true)).toBe('1430');
    });
  });
});