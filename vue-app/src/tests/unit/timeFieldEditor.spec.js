// src/tests/unit/timeFieldEditor.spec.js
import {
  TIME_LIMITS,
  parseTimeString,
  buildTimeString,
  applyTimePart,
  extractTimePart,
  getTimeLimits,
  applyTimePartWithCarry,
} from '@/utils/timeFieldEditor';

describe('timeFieldEditor', () => {
  describe('TIME_LIMITS', () => {
    test('содержит корректные лимиты для hours', () => {
      expect(TIME_LIMITS.hours).toEqual({ min: 0, max: 23, step: 1 });
    });
    test('содержит корректные лимиты для minutes', () => {
      expect(TIME_LIMITS.minutes).toEqual({ min: 0, max: 59, step: 1 });
    });
  });

  describe('parseTimeString', () => {
    test.each([
      ['14:30', { hours: 14, minutes: 30 }],
      ['00:00', { hours: 0, minutes: 0 }],
      ['23:59', { hours: 23, minutes: 59 }],
      ['24:00', { hours: 23, minutes: 0 }],
      ['99:99', { hours: 23, minutes: 59 }],
      ['-1:10', { hours: 0, minutes: 10 }],
      ['10:-5', { hours: 10, minutes: 0 }],
      ['', { hours: 0, minutes: 0 }],
      [null, { hours: 0, minutes: 0 }],
      [undefined, { hours: 0, minutes: 0 }],
      ['invalid', { hours: 0, minutes: 0 }],
    ])('parseTimeString("%s") возвращает %j', (input, expected) => {
      expect(parseTimeString(input)).toEqual(expected);
    });
  });

  describe('buildTimeString', () => {
    test.each([
      [14, 30, '14:30'],
      [0, 0, '00:00'],
      [23, 59, '23:59'],
      [24, 0, '23:00'],
      [-1, 10, '00:10'],
      [10, 70, '10:59'],
      [10, -5, '10:00'],
    ])('buildTimeString(%i, %i) → "%s"', (hours, minutes, expected) => {
      expect(buildTimeString(hours, minutes)).toBe(expected);
    });
  });

  describe('applyTimePart', () => {
    const current = '10:30';

    test('изменяет часы', () => {
      expect(applyTimePart(current, 'hours', 14)).toBe('14:30');
      expect(applyTimePart(current, 'hours', 24)).toBe('23:30');
      expect(applyTimePart(current, 'hours', -1)).toBe('00:30');
    });

    test('изменяет минуты', () => {
      expect(applyTimePart(current, 'minutes', 45)).toBe('10:45');
      expect(applyTimePart(current, 'minutes', 70)).toBe('10:59');
      expect(applyTimePart(current, 'minutes', -5)).toBe('10:00');
    });

    test('возвращает исходную строку при неизвестном поле', () => {
      expect(applyTimePart(current, 'seconds', 30)).toBe(current);
    });
  });

  describe('extractTimePart', () => {
    const time = '14:30';

    test('извлекает часы', () => {
      expect(extractTimePart(time, 'hours')).toBe(14);
    });
    test('извлекает минуты', () => {
      expect(extractTimePart(time, 'minutes')).toBe(30);
    });
  });

  describe('getTimeLimits', () => {
    test('возвращает лимиты для hours', () => {
      expect(getTimeLimits('hours')).toEqual({ limLow: 0, limHigh: 23, limStep: 1 });
    });
    test('возвращает лимиты для minutes', () => {
      expect(getTimeLimits('minutes')).toEqual({ limLow: 0, limHigh: 59, limStep: 1 });
    });
    test('возвращает лимиты hours по умолчанию для неизвестного поля', () => {
      expect(getTimeLimits('seconds')).toEqual({ limLow: 0, limHigh: 23, limStep: 1 });
    });
  });

  describe('applyTimePartWithCarry', () => {
    const base = '10:30';

    test('изменяет часы без переноса (просто зажим)', () => {
      expect(applyTimePartWithCarry(base, 'hours', 14)).toBe('14:30');
      expect(applyTimePartWithCarry(base, 'hours', 24)).toBe('23:30');
      expect(applyTimePartWithCarry(base, 'hours', -1)).toBe('00:30');
    });

    test('изменяет минуты с переносом через 59 → +1 час', () => {
      expect(applyTimePartWithCarry(base, 'minutes', 45)).toBe('10:45');
      // 70 минут = 1 час 10 минут → часы 11, минуты 10
      expect(applyTimePartWithCarry(base, 'minutes', 70)).toBe('11:10');
      // 23:59, минуты = 1 → 23:01
      expect(applyTimePartWithCarry('23:59', 'minutes', 1)).toBe('23:01');
      // 23:59, минуты = 60 → 24:00 зажимается до 23:00
      expect(applyTimePartWithCarry('23:59', 'minutes', 60)).toBe('23:00');
    });

    test('изменяет минуты с переносом через 0 → -1 час', () => {
      // -30 минут → заём 1 час, часы 10-1=9, минуты 30 → 09:30
      expect(applyTimePartWithCarry(base, 'minutes', -30)).toBe('09:30');
      // -70 минут → заём ceil(70/60)=2, часы 10-2=8, минуты -70+120=50 → 08:50
      expect(applyTimePartWithCarry(base, 'minutes', -70)).toBe('08:50');
      // 00:00, минуты = -1 → заём 1, часы 0-1=-1→0 (зажим), минуты -1+60=59 → 00:59
      expect(applyTimePartWithCarry('00:00', 'minutes', -1)).toBe('00:59');
      // 00:00, минуты = -60 → заём 1, часы 0-1=-1→0, минуты 0 → 00:00
      expect(applyTimePartWithCarry('00:00', 'minutes', -60)).toBe('00:00');
    });

    test('зажимает часы после переноса в пределах суток', () => {
      // 23:59 + 100 минут → часы 23+1=24→23, минуты 40 → 23:40
      expect(applyTimePartWithCarry('23:59', 'minutes', 100)).toBe('23:40');
      // 00:00 - 100 минут → заём ceil(100/60)=2, часы 0-2=-2→0, минуты -100+120=20 → 00:20
      expect(applyTimePartWithCarry('00:00', 'minutes', -100)).toBe('00:20');
    });

    test('возвращает исходную строку при неизвестном поле', () => {
      expect(applyTimePartWithCarry(base, 'seconds', 30)).toBe(base);
    });
  });
});