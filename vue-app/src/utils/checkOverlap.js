// src/utils/checkOverlap.js
import { timeToMinutes, minutesToTime } from './timeUtils';

/**
 * Основная функция проверки пересечений.
 * @param {Object} params
 * @param {Array}  params.existingSchedules   - массив объектов { id, startTime, endTime }
 * @param {string|null} params.currentScheduleId - id редактируемого расписания (для режима edit)
 * @param {string} params.startTime            - время начала (для mode='new')
 * @param {string} params.endTime              - время окончания (для mode='new')
 * @param {string} params.mode                 - 'new' или 'edit'
 * @param {string} [params.valueToCheck]      - новое время для редактируемого поля (mode='edit')
 * @param {string} [params.value_name]        - 'startTime' или 'endTime' (mode='edit')
 * @param {string} [params.currentStartTime]  - текущее startTime (mode='edit')
 * @param {string} [params.currentEndTime]    - текущее endTime (mode='edit')
 * @returns {Object} результат проверки
 */
export function checkOverlap({
  existingSchedules,
  currentScheduleId = null,
  startTime,
  endTime,
  mode,
  valueToCheck = null,
  value_name = null,
  currentStartTime = null,
  currentEndTime = null,
}) {
  // Преобразуем существующие расписания в минуты, исключая текущее
  const schedulesInMinutes = existingSchedules
    .filter(s => s.id !== currentScheduleId)
    .map(s => ({
      id: s.id,
      start: timeToMinutes(s.startTime),
      end: timeToMinutes(s.endTime),
    }));

  let startMinutes, endMinutes;
  let message = '';
  let hasOverlap = false;
  let adjustedValue = null;

  if (mode === 'new') {
    startMinutes = timeToMinutes(startTime);
    endMinutes = timeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      return {
        hasOverlap: true,
        message: 'Некорректное время нового расписания',
        newStartTime: null,
        newEndTime: null,
      };
    }

    let allExistingEnds = [];
    for (const s of schedulesInMinutes) {
      allExistingEnds.push(s.end);
      if (startMinutes < s.end && endMinutes > s.start) {
        hasOverlap = true;
        break;
      }
    }

    if (hasOverlap) {
      const latestEndTime = Math.max(...allExistingEnds);
      const newStartMinutes = latestEndTime + 1;
      const newEndMinutes = newStartMinutes + 10;

      if (newEndMinutes > 1440) {
        return {
          hasOverlap: true,
          newStartTime: null,
          newEndTime: null,
          message: 'Невозможно найти свободный промежуток в течение суток',
        };
      }

      const newStartTimeStr = minutesToTime(newStartMinutes);
      const newEndTimeStr = minutesToTime(newEndMinutes);

      return {
        hasOverlap: true,
        newStartTime: newStartTimeStr,
        newEndTime: newEndTimeStr,
        message: `Предложено новое время от ${newStartTimeStr} до ${newEndTimeStr}`,
      };
    }

    return { hasOverlap: false };
  }

  // mode === 'edit'
  if (!valueToCheck || !value_name) {
    throw new Error('Для режима edit необходимо указать valueToCheck и value_name');
  }

  const currentStartMin = timeToMinutes(currentStartTime);
  const currentEndMin = timeToMinutes(currentEndTime);

  if (value_name === 'startTime') {
    startMinutes = timeToMinutes(valueToCheck);
    endMinutes = currentEndMin;
  } else if (value_name === 'endTime') {
    endMinutes = timeToMinutes(valueToCheck);
    startMinutes = currentStartMin;
  } else {
    throw new Error('value_name должен быть "startTime" или "endTime"');
  }

  // Корректировка при невалидном интервале
  if (endMinutes <= startMinutes) {
    hasOverlap = true;
    if (value_name === 'startTime') {
      startMinutes = endMinutes - 1;
      adjustedValue = minutesToTime(startMinutes);
      message = 'Время начала не может быть больше или равно времени окончания';
    } else {
      endMinutes = startMinutes + 1;
      adjustedValue = minutesToTime(endMinutes);
      message = 'Время окончания не может быть меньше или равно времени начала';
    }
    return {
      hasOverlap: true,
      message,
      checkedTime: adjustedValue,
      value_name,
    };
  }

  // Проверка пересечений с другими расписаниями
  for (const s of schedulesInMinutes) {
    if (startMinutes < s.end && endMinutes > s.start) {
      hasOverlap = true;
      if (value_name === 'startTime') {
        startMinutes = s.end;
        adjustedValue = minutesToTime(startMinutes);
        message = 'Обнаружено пересечение, время скорректировано';
        if (startMinutes >= endMinutes) {
          startMinutes = endMinutes - 1;
          adjustedValue = minutesToTime(startMinutes);
          message = 'Время начала скорректировано из-за пересечения и ограничений интервала';
        }
      } else if (value_name === 'endTime') {
        endMinutes = s.start;
        adjustedValue = minutesToTime(endMinutes);
        message = 'Обнаружено пересечение, время скорректировано';
        if (startMinutes >= endMinutes) {
          endMinutes = startMinutes + 1;
          adjustedValue = minutesToTime(endMinutes);
          message = 'Время окончания скорректировано из-за пересечения и ограничений интервала';
        }
      }
      break;
    }
  }

  // Проверка границ суток
  if (!adjustedValue) {
    adjustedValue = valueToCheck;
  }
  const checkedMinutes = timeToMinutes(adjustedValue);
  if (checkedMinutes < 0) {
    adjustedValue = '00:00';
    message = 'Время не может быть меньше 00:00';
    hasOverlap = true;
  } else if (checkedMinutes > 1440) {
    adjustedValue = '24:00';
    message = 'Время не может быть больше 24:00';
    hasOverlap = true;
  }

  return {
    hasOverlap,
    message,
    checkedTime: adjustedValue,
    value_name,
  };
}

/**
 * Упрощённая проверка для редактирования одного поля.
 */
export function checkTimeOverlap({
  existingSchedules,
  currentScheduleId,
  valueToCheck,
  value_name,
  currentStartTime,
  currentEndTime,
}) {
  return checkOverlap({
    existingSchedules,
    currentScheduleId,
    startTime: null,
    endTime: null,
    mode: 'edit',
    valueToCheck,
    value_name,
    currentStartTime,
    currentEndTime,
  });
}

/** Проверка и корректировка startTime (в минутах) */
export function checkStartTimeOverlap(startTime, endTime) {
  if (startTime >= endTime) return endTime - 1;
  return startTime;
}

/** Проверка и корректировка endTime (в минутах) */
export function checkEndTimeOverlap(startTime, endTime) {
  if (startTime >= endTime) return startTime + 1;
  return endTime;
}