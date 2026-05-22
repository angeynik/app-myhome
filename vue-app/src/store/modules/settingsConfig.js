// модуль работы с конфигурацией Расписания
// store/modules/settingsConfig.js
import logger from './logger';

const MUTATION_TYPES = {
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  SET_STATISTICS: 'SET_STATISTICS',
  ADD_SCHEDULE: 'ADD_SCHEDULE',
  DELETE_SCHEDULE: 'DELETE_SCHEDULE',
  SET_PERMIT_SCHEDULE: 'SET_PERMIT_SCHEDULE',
  SET_PERMIT_NOTIFICATIONS: 'SET_PERMIT_NOTIFICATIONS',
  SET_PERMIT_STATISTICS: 'SET_PERMIT_STATISTICS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

export default {
  namespaced: true,
  state: () => ({
    loading: false,
    error: null,
    permitSchedule: false,
    permitNotifications: false,
    permitStatistics: false,
  }),

  mutations: {

    [MUTATION_TYPES.SET_STATISTICS](state, { name, config }) {
      state.statistics[name] = config;
      logger.dev('[settingsConfig] - SET_STATISTICS - Конфигурация аналитики обновлена:', name);
    },
    [MUTATION_TYPES.ADD_SCHEDULE](state, { dID, schedule }) {
      const nameSchedules = dID + '_schedules';
      if (!state.schedules[nameSchedules]) {
        state.schedules[nameSchedules] = [];
      }
      state.schedules[nameSchedules].push(schedule);
      logger.dev('[settingsConfig] - ADD_SCHEDULE - Расписание добавлено:', schedule);
    },
    [MUTATION_TYPES.DELETE_SCHEDULE](state, { dID, scheduleId }) {
      const nameSchedules = dID + '_schedules';
      const schedules = state.schedules[nameSchedules];
      if (schedules) {
        state.schedules[nameSchedules] = schedules.filter(s => s.id !== scheduleId);
        logger.dev('[settingsConfig] - DELETE_SCHEDULE - Расписание удалено:', scheduleId);
      }
    },
    [MUTATION_TYPES.SET_PERMIT_SCHEDULE](state, value) {
      state.permitSchedule = value;
      logger.dev('[settingsConfig] - SET_PERMIT_SCHEDULE - установлено:', value);
    },






    
    [MUTATION_TYPES.SET_NOTIFICATIONS](state, { name, config }) {
      state.notifications[name] = config;
      logger.dev('[settingsConfig] - SET_NOTIFICATIONS - Конфигурация уведомлений обновлена:', name);
    },
    [MUTATION_TYPES.ADD_NOTIFICATIONS](state, { dID, notifications }) {
      const nameNotifications = dID + '_notifications';
      if (!state.notifications[nameNotifications]) {
        state.snotifications[nameNotifications] = [];
      }
      state.notifications[nameNotifications].push(notifications);
      logger.dev('[settingsConfig] - ADD_NOTIFICATIONS - Расписание добавлено:', notifications);
    },
    [MUTATION_TYPES.DELETE_NOTIFICATIONS](state, { dID, notificationsId }) {
      const nameNotifications = dID + 'notifications';
      const notifications = state.schedules[nameNotifications];
      if (notifications) {
        state.notifications[nameNotifications] = notifications.filter(s => s.id !== notificationsId);
        logger.dev('[settingsConfig] - DELETE_SCHEDULE - Расписание удалено:', notificationsId);
      }
    },
    [MUTATION_TYPES.SET_PERMIT_NOTIFICATIONS](state, value) {
      state.permitNotifications = value;
      logger.dev('[settingsConfig] - SET_PERMIT_NOTIFICATIONS - установлено:', value);
    },








    [MUTATION_TYPES.SET_PERMIT_STATISTICS](state, value) {
      state.permitStatistics = value;
      logger.dev('[settingsConfig] - SET_PERMIT_STATISTICS - установлено:', value);
    },
    [MUTATION_TYPES.SET_LOADING](state, value) {
      state.loading = value;
    },
    [MUTATION_TYPES.SET_ERROR](state, error) {
      state.error = error;
      if (error) {
        logger.error('[settingsConfig] - SET_ERROR - Error:', error);
      }
    },
  },

  actions: {
    async initialize({ commit, dispatch, rootGetters }) {
      logger.dev('[settingsConfig] - initialize - Starting configuration initialization');
      
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - initialize - dID not defined');
        return;
      }
      
      commit(MUTATION_TYPES.SET_LOADING, true);
      commit(MUTATION_TYPES.SET_ERROR, null);
      
      try {
        // Restore typeSettingsKey from localStorage
        const savedType = localStorage.getItem('typeSettingsKey');
        if (savedType) {
          commit('config/SET_TYPE_SETTINGS_ITEM', savedType, { root: true });
        } else {
          commit('config/SET_TYPE_SETTINGS_ITEM', 'schedule', { root: true });
          localStorage.setItem('typeSettingsKey', 'schedule');
        }
        
        logger.dev('[settingsConfig] - initialize - Schedule configuration initialization');
        
        // Request all configuration types
        await dispatch('requestToServer', { configType: 'schedules' });
        await dispatch('requestToServer', { configType: 'notifications' });
        await dispatch('requestToServer', { configType: 'statistics' });
        
        logger.dev('[settingsConfig] - initialize - All requests sent for dID:', dID);
        return {};
        
      } catch (error) {
        logger.error('[settingsConfig] - Error sending request:', error);
        commit(MUTATION_TYPES.SET_ERROR, error.message || error.toString());
        logger.error('[settingsConfig] - initialize - Error:', error);
        return {};
        
      } finally {
        commit(MUTATION_TYPES.SET_LOADING, false);
        logger.dev('[settingsConfig] - initialize - Initialization completed');
      }
      
    },
    // async getConfigSettings({ rootState, rootGetters }, { configType, roomKey, paramKey }) {
    //   const dID = rootGetters['dID'];
    //   logger.dev('[settingsConfig] - getConfigSettings - Получаем конфигурацию для:', {dID, roomKey, paramKey, configType});

    //   if (!dID) {
    //     logger.warn('[settingsConfig] - getConfigSettings - dID не определен');
    //     return [];
    //   }
     
    //   // Используем состояние из config.js
    //   let configData;
    //   switch(configType) {
    //     case 'schedules':
    //       configData = rootState.config.schedules[dID];
    //       break;
    //     case 'notifications':
    //       configData = rootState.config.notifications[dID];
    //       break;
    //     case 'statistics':
    //       configData = rootState.config.statistics[dID];
    //       break;
    //     default:
    //       return [];
    //   }
      
    //   if (configData && configData[roomKey] && configData[roomKey][paramKey]) {
    //     console.log('[settingsConfig] - getConfigSettings - Возвращает ', configData[roomKey][paramKey]);
    //     return configData[roomKey][paramKey];
    //   }
      
    //   // Если нет в state, проверяем localStorage
    //   const localKey = dID + '_' + configType;
    //   const localConfig = localStorage.getItem(localKey);
    //   if (localConfig) {
    //     try {
    //       const parsedConfig = JSON.parse(localConfig);
    //       if (parsedConfig[roomKey] && parsedConfig[roomKey][paramKey]) {
    //         return parsedConfig[roomKey][paramKey];
    //       }
    //     } catch (error) {
    //       logger.error('[settingsConfig] - getConfigSettings - Ошибка парсинга localStorage:', error);
    //     }
    //   }
      
    //   return [];
    // },
    
    async requestToServer({dispatch, rootGetters},{ configType}) {
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - requestToServer - dID не определен');
        return;
      }
      try {
        //logger.dev('[settingsConfig] - requestToServer - Загрузка расписаний для dID:', dID);
        //console.log('[settingsConfig] - requestToServer - Загрузка расписаний для dID, configType:', dID, configType);
        dispatch('websocket/send', {
          type: 'get',
          request: configType,
          name: dID
        }, { root: true });
      } catch (error) {
        logger.error('[settingsConfig] - requestToServer - Ошибка загрузки расписаний:', error);
        throw error;
      }
    },
  


    // Формируем время для создания интервала Расписания и Уведомления
    getCurrentDateTime() {
      try {
        const now = new Date();
        return now.toISOString();
      } catch (error) {
        logger.error('[settingsConfig] - getCurrentDateTime - Ошибка создания даты:', error);
        return new Date().toISOString(); // fallback
      }
    },
    getCurrentTimeString() {
      try {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      } catch (error) {
        console.error('[settingsConfig] - getCurrentTimeString - Ошибка:', error);
        return '00:00';
      }
    },
    formatDate(context, { dateString, locale = 'ru-RU', timeZone = 'Europe/Moscow'  }) {
      try {
        if (!dateString) return '—';
        
        // Если строка уже содержит запятую, значит уже отформатирована
        if (typeof dateString === 'string' && dateString.includes(',')) {
          return dateString;
        }
        
        const date = dateString instanceof Date ? dateString : new Date(dateString);
        
        // Проверка валидности даты
        if (isNaN(date.getTime())) {
          return dateString;
        }
        
        return date.toLocaleDateString(locale, {
          timeZone: timeZone,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        logger.error('[settingsConfig] - formatDate - Ошибка форматирования даты:', error);
        return dateString || '—';
      }
    },
    timeToMinutes(_, timeString) {
      //console.log('[settingsConfig] - timeToMinutes - Преобразование времени:', timeString);
        try {
          if (!timeString || typeof timeString !== 'string') {
            logger.warn('[settingsConfig] - timeToMinutes - Неверный формат времени:', timeString);
            return 0;
          }
          
          const [hours, minutes] = timeString.split(':').map(Number);
          
          // Проверяем валидность часов и минут
          if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            logger.warn('[settingsConfig] - timeToMinutes - Некорректное время:', timeString);
            return 0;
          }
          
          const totalMinutes = hours * 60 + minutes;
          logger.dev('[settingsConfig] - timeToMinutes - Преобразовано:', { timeString, totalMinutes });
          
          return totalMinutes;
        } catch (error) {
          logger.error('[settingsConfig] - timeToMinutes - Ошибка преобразования:', error);
          return 0;
        }
      },
    minutesToTime(_, minutes) {
      //console.log('[settingsConfig] - minutesToTime - Преобразование минут:', minutes);
        try {
          if (typeof minutes !== 'number' || minutes < 0 || minutes > 1439) {
            logger.warn('[settingsConfig] - minutesToTime - Некорректное количество минут:', minutes);
            return '00:00';
          }
          
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          
          const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
          logger.dev('[settingsConfig] - minutesToTime - Преобразовано:', { minutes, timeString });
          
          return timeString;
        } catch (error) {
          logger.error('[settingsConfig] - minutesToTime - Ошибка преобразования:', error);
          return '00:00';
        }
    },
    validateScheduleTime(context, schedule) {
        try {
          if (!schedule || !schedule.startTime || !schedule.endTime) {
            return {
              valid: false,
              message: 'Отсутствует время начала или окончания'
            };
          }
          
          // Используем нашу функцию timeToMinutes
          const startMinutes = context.dispatch('timeToMinutes', schedule.startTime);
          const endMinutes = context.dispatch('timeToMinutes', schedule.endTime);
          
          // Проверяем, что endTime > startTime
          if (endMinutes <= startMinutes) {
            return {
              valid: false,
              message: 'Время окончания должно быть позже времени начала'
            };
          }
          
          logger.dev('[settingsConfig] - validateScheduleTime - Валидация пройдена:', schedule);
          return { valid: true };
          
        } catch (error) {
          logger.error('[settingsConfig] - validateScheduleTime - Ошибка валидации:', error);
          return {
            valid: false,
            message: 'Ошибка при валидации времени'
          };
        }
    },
    async createTimePoint({ dispatch }, { offset = 1, duration = 10 } = {}) {
      console.groupCollapsed('[settingsConfig] - createTimePoint');
      logger.dev('[settingsConfig] - createTimePoint - Создание временной точки:', { offset, duration });
      
      try {
        // Шаг 1: Получаем текущее московское время с учетом смещения offset
        const now = new Date();
        
        // Применяем смещение offset (в минутах) к текущему времени
        const offsetDate = new Date(now.getTime() + offset * 60 * 1000);
        
        // Форматируем время начала в московском часовом поясе
        const formattedStartTime = await dispatch('formatDate', { 
          dateString: offsetDate, 
          timeZone: 'Europe/Moscow',
          returnTimeOnly: true // Предполагаем, что formatDate может возвращать только время
        });
        const startTime = formattedStartTime.split(', ')[1];
        logger.dev('[settingsConfig] - createTimePoint - Время начала (с учетом offset):', startTime);
        
        // Шаг 2: Создаем время окончания, добавляя duration минут к offsetDate
        const endDate = new Date(offsetDate.getTime() + duration * 60 * 1000);
        
        // Форматируем время окончания
        const formattedEndTime = await dispatch('formatDate', { 
          dateString: endDate, 
          timeZone: 'Europe/Moscow',
          returnTimeOnly: true
        });
        const endTime = formattedEndTime.split(', ')[1];
        console.log('[settingsConfig] - createTimePoint - Время окончания:', endTime);
      
        // Шаг 3: Возвращаем результат
        const result = {
          startTime,
          endTime,
        };
        
        console.log('[settingsConfig] - createTimePoint - Результат:', result);
        console.groupEnd();
        return result;
        
      } catch (error) {
        logger.error('[settingsConfig] - createTimePoint - Ошибка создания временной точки:', error);
        console.groupEnd();
        
        // Возвращаем значения по умолчанию в случае ошибки
        return {
          startTime: '00:00',
          endTime: '00:05'
        };
      }
    },







  getConfigDataFromStore({ rootState, rootGetters }, { configName }) {
    console.log('[settingsConfig] - getConfigDataFromStore - configName', configName);
    const settingsData = rootGetters['getSetpointsManager']?.settingsData;
    const dID = settingsData?.name;
    const room = settingsData?.payload?.room;
    const param = settingsData?.payload?.param;
    //console.log('[settingsConfig] - getConfigDataFromStore - Start', { dID, room, param });
    
    try {
      if (!dID || !room || !param) {
        console.groupEnd();
        return [];
      }
      
      // Получаем данные из rootState.config.schedules
      //const configData = rootState.config?.schedules?.[dID] || {};
      const configData = rootState.config?.[configName]?.[dID] || {};
      const roomData = configData[room] || {};
      const paramData = roomData[param];
      
      const findedConfig = Array.isArray(paramData) ? [...paramData] : [];
      
      console.log('[settingsConfig] - getConfigDataFromStore - Найдено в конфигурации', findedConfig.length);
      // console.groupEnd();
      
      return findedConfig;
      
    } catch (error) {
      console.error('[settingsConfig] - getConfigDataFromStore - Ошибка:', error);
      console.groupEnd();
      return [];
    }
  },
  getScheduleTimeByID(context, { id, title }) {
    // const dID = rootGetters['dID'];
    console.groupCollapsed('[settingsConfig] - getScheduleTimeByID');
    try {
      const schedules = this.getConfigDataFromStore('schedules');
      const schedule = schedules.find(s => s.id === id);
      const findedTime = schedule?.[title];
      console.log('[settingsConfig] - getScheduleTimeByID - Найдено расписание:', schedule, findedTime);
      console.groupEnd();
      return findedTime;
    } catch (error) {
      return error;
    }
  },

  async checkScheduleOverlap({rootGetters, dispatch}, { startTime, endTime, configName}) {
      // const dID = rootGetters['dID'];
        console.groupCollapsed('[settingsConfig] - checkScheduleOverlap - configName:', configName);
        try {
          // const config = await dispatch('getConfigDataFromStore', {configName});

          // let config;
          // if (configName == 'schedules') config = await dispatch('getConfigDataFromStore', configName);
          // if (configName == 'notifications') config = await dispatch('getConfigDataFromStore');
          // if (configName == 'statistics') config = await dispatch('getConfigDataFromStore');

          const configData = await dispatch('getConfigDataFromStore', {configName});
          console.log('[settingsConfig] - checkScheduleOverlap - Получаем конфигурацию для', configName, ' : ', configData);
          const settingsData = rootGetters['getSetpointsManager']?.settingsData;
          const room = settingsData?.payload?.room;
          const param = settingsData?.payload?.param;
          const existingConfigData = configData.filter(s => 
            s.room === room && 
            s.param === param
          );
          console.log('[settingsConfig] - checkScheduleOverlap - Существующие расписания:', existingConfigData);

          console.log('[settingsConfig] - checkScheduleOverlap - Начало проверки', {
            startTime,
            endTime,
            existingConfigData
          });

          // Валидация входных параметров
          if (!startTime || !endTime) {
            const message = 'Отсутствует startTime или endTime';
            console.warn('[settingsConfig] - checkScheduleOverlap - ', message);
            console.groupEnd();
            return { message, hasOverlap: false };
          }
          if (!existingConfigData || !Array.isArray(existingConfigData)) {
            console.groupEnd();
            return { hasOverlap: false };
          }

          // Используем общую функцию проверки
          const result = await dispatch('checkOverlap', {
            startTime,
            endTime,
            mode: 'new',
            configName
          });

          console.groupEnd();
          return result;
          
        } catch (error) {
          logger.error('[settingsConfig] - checkScheduleOverlap - Ошибка проверки пересечения:', error);
          console.groupEnd();
          return { 
            message: 'Ошибка при проверке пересечения',
            hasOverlap: true,
            error: error.message 
          };
        }
  },


  async addConfigLocally({ rootGetters, rootState, dispatch }, { room, param, configName, configData }) {
      console.log('[settingsConfig] - addConfigLocally - Начинаем локальное сохранение для ', configName);
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - addConfigLocally - dID не определен');
        return;
      }
      
      console.log('[settingsConfig] - addConfigLocally - Добавляем', configName, ' локально:', { dID, room, param, configData });
      
      try {
        // 1. Получаем текущие расписания из config.js
        const currentSchedules = { ...(rootState.config.schedules[dID] || {}) };
        console.log('[settingsConfig] - addConfigLocally - Текущие расписания из config.js:', currentSchedules);
        
        // 2. Инициализируем структуру если нужно
        if (!currentSchedules[room]) {
          currentSchedules[room] = {};
        }
        
        if (!currentSchedules[room][param]) {
          currentSchedules[room][param] = [];
        }
        
        // 3. Добавляем новое расписание
        currentSchedules[room][param] = [...currentSchedules[room][param], configData];
        
        // 4. Обновляем состояние в config.js через мутацию
        console.log('[settingsConfig] - addConfigLocally - Обновляем состояние в config.js через updateScheduleLocally');
        await dispatch('config/updateScheduleLocally', {
          dID: dID,
          schedules: currentSchedules
        }, { root: true });
        
        // 5. Также сохраняем в localStorage для резерва
        localStorage.setItem(`${dID}_schedules`, JSON.stringify(currentSchedules));
        
        logger.info('[settingsConfig] - addConfigLocally - Расписание добавлено локально');
        return { success: true, configData };
        
      } catch (error) {
        logger.error('[settingsConfig] - addConfigLocally - Ошибка:', error);
        throw error;
      }
  },
  async deleteConfigItems({ dispatch, rootGetters }, { room, param, configName, scheduleIds }) {
      console.groupCollapsed('[settingsConfig] - deleteConfigItems');
      console.log('[settingsConfig] - deleteConfigItems - Удаляем расписания:', { room, param, configName, scheduleIds });
      
      const dID = rootGetters['dID'];
      const request = 'del'+configName;
      console.log('[settingsConfig] - deleteConfigItems - request', request);
      if (!dID) {
        logger.warn('[settingsConfig] - deleteConfigItems - dID не определен');
        return;
      }
      console.groupEnd();
      try {
        // Отправляем на сервер
        await dispatch('websocket/send', {
          type: 'post',
          request: request,
          name: dID,
          payload: { 
            room, 
            param, 
            scheduleIds: Array.isArray(scheduleIds) ? scheduleIds : [scheduleIds] 
          }
        }, { root: true });
        
        logger.info('[settingsConfig] - deleteConfigItems - Запрос на удаление отправлен');

        return { success: true };
        
      } catch (error) {
        logger.error('[settingsConfig] - deleteConfigItems - Ошибка отправки:', error);
        throw error;
      }
  },







    checkOverlap: async ({ dispatch, rootGetters }, { startTime, endTime, configName, valueToCheck, id, value_name, mode }) => {
      try {
        console.log('[settingsConfig] - checkOverlap - Начинаем проверку для - ', configName, 'startTime-', startTime, 'endTime', endTime);

        const schedules = await dispatch('getConfigDataFromStore', {configName});
        const settingsData = rootGetters['getSetpointsManager']?.settingsData;
        const room = settingsData?.payload?.room;
        const param = settingsData?.payload?.param;

        const existingSchedules = schedules.filter(s => s.room === room && s.param === param);
        const currentSchedule = id ? existingSchedules.find(s => s.id === id) : null;

        let startMinutes, endMinutes;
        let message = '';
        let hasOverlap = false;
        let adjustedValue = valueToCheck || startTime;

        // Определяем интервал в зависимости от режима
        if (mode === 'new') {
          startMinutes = await dispatch('timeToMinutes', startTime);
          endMinutes = await dispatch('timeToMinutes', endTime);
        } else if (mode === 'edit') {
          if (value_name === 'startTime') {
            startMinutes = await dispatch('timeToMinutes', valueToCheck);
            endMinutes = currentSchedule ? await dispatch('timeToMinutes', currentSchedule.endTime) : startMinutes + 10;
          } else if (value_name === 'endTime') {
            endMinutes = await dispatch('timeToMinutes', valueToCheck);
            startMinutes = currentSchedule ? await dispatch('timeToMinutes', currentSchedule.startTime) : endMinutes - 10;
          }
        }

        // Проверяем валидность интервала
        if (endMinutes <= startMinutes) {
          if (mode === 'new') {
            message = 'Некорректное время нового расписания';
            return { message, hasOverlap: true };
          } else {
            if (value_name === 'startTime') {
              startMinutes = endMinutes - 1;
              adjustedValue = await dispatch('minutesToTime', startMinutes);
              message = 'Время начала не может быть больше или равно времени окончания';
            } else {
              endMinutes = startMinutes + 1;
              adjustedValue = await dispatch('minutesToTime', endMinutes);
              message = 'Время окончания не может быть меньше или равно времени начала';
            }
            hasOverlap = true;
            console.log('[settingsConfig] - checkOverlap - Интервал скорректирован:', startMinutes, endMinutes);
            return { message, hasOverlap, checkedTime: adjustedValue, value_name };
          }
        }

        console.log('[settingsConfig] - checkOverlap - Интервал корректен:', startMinutes, endMinutes);

        // Проверяем пересечения с другими расписаниями
        let allExistingEnds = [];
        for (const scheduleItem of existingSchedules) {
          if (id && scheduleItem.id === id) continue;

          const existingStart = await dispatch('timeToMinutes', scheduleItem.startTime);
          const existingEnd = await dispatch('timeToMinutes', scheduleItem.endTime);

          allExistingEnds.push(existingEnd);

          if (startMinutes < existingEnd && endMinutes > existingStart) {
            hasOverlap = true;
            if (mode === 'new') {
              console.log('[settingsConfig] - checkOverlap - Пересечение найдено для нового расписания');
            } else {
              // Корректируем время для edit
              if (value_name === 'startTime') {
                startMinutes = existingEnd;
                adjustedValue = await dispatch('minutesToTime', startMinutes);
                message = 'Обнаружено пересечение, время скорректировано';
                if (startMinutes >= endMinutes) {
                  startMinutes = endMinutes - 1;
                  adjustedValue = await dispatch('minutesToTime', startMinutes);
                  message = 'Время начала скорректировано из-за пересечения и ограничений интервала';
                }
              } else if (value_name === 'endTime') {
                endMinutes = existingStart;
                adjustedValue = await dispatch('minutesToTime', endMinutes);
                message = 'Обнаружено пересечение, время скорректировано';
                if (startMinutes >= endMinutes) {
                  endMinutes = startMinutes + 1;
                  adjustedValue = await dispatch('minutesToTime', endMinutes);
                  message = 'Время окончания скорректировано из-за пересечения и ограничений интервала';
                }
              }
              console.log('[settingsConfig] - checkOverlap - Скорректировано:', adjustedValue);
              break;
            }
          }
        }

        // Для нового режима, если пересечение, предложить новое время
        if (mode === 'new' && hasOverlap) {
          const latestEndTime = Math.max(...allExistingEnds);
          const newStartMinutes = latestEndTime + 1;
          const newEndMinutes = newStartMinutes + 10;

          if (newEndMinutes > 1440) {
            return { 
              hasOverlap: true,
              newStartTime: null,
              newEndTime: null,
              message: 'Невозможно найти свободный промежуток в течение суток'
            };
          }

          const newStartTimeStr = await dispatch('minutesToTime', newStartMinutes);
          const newEndTimeStr = await dispatch('minutesToTime', newEndMinutes);

          message = `Предложено новое время от ${newStartTimeStr} до ${newEndTimeStr}`;
          return {
            message,
            newStartTime: newStartTimeStr,
            newEndTime: newEndTimeStr,
            hasOverlap: true
          };
        }

        // Проверка границ суток для edit
        if (mode === 'edit') {
          const checkedTimeInMinutes = await dispatch('timeToMinutes', adjustedValue);
          if (checkedTimeInMinutes < 0) {
            adjustedValue = '00:00';
            message = 'Время не может быть меньше 00:00';
            hasOverlap = true;
          } else if (checkedTimeInMinutes > 1440) {
            adjustedValue = '24:00';
            message = 'Время не может быть больше 24:00';
            hasOverlap = true;
          }
        }

        if (mode === 'new') {
          return { hasOverlap };
        } else {
          return { 
            message, 
            hasOverlap, 
            checkedTime: adjustedValue,
            value_name
          };
        }
        
      } catch (error) {
        console.error('[settingsConfig] - checkOverlap - Ошибка:', error);
        return { message: 'Ошибка при проверке', hasOverlap: false };
      }
    },

    checkTimeOverlap: async ({ dispatch, rootGetters }, { valueToCheck, id }) => {
      try {
        const settingsData = rootGetters['getSetpointsManager']?.settingsData;
        const value_name = settingsData?.payload?.value_name;

        console.log('[settingsConfig] - checkTimeOverlap - Проверяем пересечение времени:', { valueToCheck, id, value_name });

        // Используем общую функцию проверки
        const result = await dispatch('checkOverlap', {
          valueToCheck,
          id,
          value_name,
          mode: 'edit'
        });

        return result;
        
      } catch (error) {
        console.error('[settingsConfig] - checkTimeOverlap - Ошибка:', error);
        return { message: 'Ошибка при проверке', hasOverlap: false, checkedTime: valueToCheck };
      }
    },
    checkStartTimeOverlap: async (_, { startTime, endTime }) => {
        if (startTime >= endTime) {
         console.log('[settingsConfig] - checkStartTimeOverlap - Значение:', startTime, ' больше чем:', endTime);
            return endTime - 1;
        }
        console.log('[settingsConfig] - checkStartTimeOverlap - Значение:', startTime, ' не превышает:', endTime);
        return startTime;
    },
    checkEndTimeOverlap: async (_, { startTime, endTime }) => {
        if (startTime >= endTime) {
         console.log('[settingsConfig] - checkStartTimeOverlap - Значение:', endTime, ' меньше чем:', startTime);
            return startTime + 1;
        }
        console.log('[settingsConfig] - checkStartTimeOverlap - Значение:', endTime , ' не снижается менее:', startTime);
        return endTime;
    },
    // Преобразуем в стрелочную функцию с async/await
    settingsConfigUpdate: async ({ dispatch, rootGetters }, { newValue, value_details }) => {
      console.log('[settingsConfig] - settingsConfigUpdate - Параметры запроса:', { newValue, value_details });
      
      try {
        const settingsData = rootGetters['getSetpointsManager']?.settingsData;
        const dID = settingsData?.name;
        const value = settingsData?.payload?.value;
        const value_name = settingsData?.payload?.value_name;
        const id = settingsData?.payload?.id;

        if (!dID || !newValue || !value || !value_details || !value_name) {
          logger.warn('[settingsConfig] - settingsConfigUpdate - Параметры обновления не определены');
          return { updateStatus: false, message: 'Параметры обновления не определены' };
        }

        // Формируем новое значение времени
        let updatedValue;
        const [hours, minutes] = value.split(':').map(Number);

        if (value_details === 'hours') {
          updatedValue = newValue < 10 ? `0${newValue}:${minutes < 10 ? '0' + minutes : minutes}` : `${newValue}:${minutes < 10 ? '0' + minutes : minutes}`;
        } else if (value_details === 'minutes') {
          updatedValue = hours < 10 ? `0${hours}:${newValue < 10 ? '0' + newValue : newValue}` : `${hours}:${newValue < 10 ? '0' + newValue : newValue}`;
        }

        // Ждем результат проверки пересечений
        const overlapResult = await dispatch('checkTimeOverlap', {
          valueToCheck: updatedValue,
          id: id
        });

        console.log('[settingsConfig] - settingsConfigUpdate - Результат проверки:', overlapResult);

        // Обновляем данные в store с проверенным/скорректированным значением
        await dispatch('updatePayloadData', { 
          value: overlapResult.checkedTime 
        }, { root: true });

        return { 
          updateStatus: true, 
          updatedValue: overlapResult.checkedTime,
          message: overlapResult.message,
          hasOverlap: overlapResult.hasOverlap
        };

      } catch (error) {
        console.error('[settingsConfig] - settingsConfigUpdate - Ошибка:', error);
        return { updateStatus: false, message: 'Ошибка при обновлении', error };
      }
    },







    async saveConfigItems({ rootGetters, dispatch }, { room, param, configName, schedules }) {
      console.log('[settingsConfig] - saveConfigItems - Сохраняем расписание:', { room, param, configName, schedules });

      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - saveConfigItems - dID не определен');
        return;
      }
      
      try {
        // Отправляем на сервер
        try {
          await dispatch('websocket/send', {
            type: 'post',
            request: 'addSchedule',
            name: dID,
            payload: { room, param, schedules }
          }, { root: true });
          
          // После успешной отправки на сервер, обновляем локальное состояние
          await dispatch('config/handleConfigResponse', {
            name: dID,
            request: 'schedules',
            payload: { [room]: { [param]: schedules } }
          }, { root: true });
          
        } catch (error) {
          logger.error('[settingsConfig] - saveConfigItems - Ошибка отправки на сервер:', error);
          throw error;
        }
        
        logger.info('[settingsConfig] - saveConfigItems - Расписания сохранены:', {
          room,
          param,
          count: schedules.length
        });
        
        return { success: true };
        
      } catch (error) {
        logger.error('[settingsConfig] - saveConfigItems - Общая ошибка сохранения:', error);
        throw error;
      }
    },

    // async saveNotifications({ commit, rootGetters, dispatch }, { roomKey, paramKey, notifications }) {
    //   const dID = rootGetters['dID'];
    //   if (!dID) {
    //     logger.warn('[settingsConfig] - saveNotifications - dID не определен');
    //     return;
    //   }
      
    //   try {
    //     // Обновляем в хранилище
    //     const key = `${dID}_notifications`;
    //     const allNotifications = { ...(this.state.notifications[key] || {}) };
        
    //     if (!allNotifications[roomKey]) {
    //       allNotifications[roomKey] = {};
    //     }
    //     allNotifications[roomKey][paramKey] = notifications;
        
    //     commit('SET_NOTIFICATIONS', { name: dID, config: allNotifications });
        
    //     // Отправляем на сервер
    //     await dispatch('websocket/send', {
    //       type: 'post',
    //       request: 'notifications',
    //       name: dID,
    //       payload: { roomKey, paramKey, notifications }
    //     }, { root: true });
        
    //     logger.info('[settingsConfig] - saveNotifications - Уведомления сохранены');
        
    //     return { success: true };
        
    //   } catch (error) {
    //     logger.error('[settingsConfig] - saveNotifications - Ошибка сохранения:', error);
    //     throw error;
    //   }
    // },
    async saveNotifications({ rootGetters, dispatch }, { room, param, notifications }) {
      const dID = rootGetters['dID'];
      if (!dID) throw new Error('[settingsConfig] saveNotifications: dID не определен');
      console.log('[settingsConfig] - saveNotifications - отправка на сервер:', { room, param, notifications });
      await dispatch('websocket/send', {
        type: 'post',
        request: 'notifications',
        name: dID,
        payload: { room, param, notifications }
      }, { root: true });
      // также обновляем локальное состояние через мутацию config
      dispatch('config/handleConfigResponse', {
        name: dID,
        request: 'notifications',
        payload: { [room]: { [param]: notifications } }
      }, { root: true });
    },

    async saveAnalytics({ commit, rootGetters, dispatch }, { roomKey, paramKey, analytics }) {
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - saveAnalytics - dID не определен');
        return;
      }
      
      try {
        // Обновляем в хранилище
        const key = `${dID}_statistics`;
        const allAnalytics = { ...(this.state.statistics[key] || {}) };
        
        if (!allAnalytics[roomKey]) {
          allAnalytics[roomKey] = {};
        }
        allAnalytics[roomKey][paramKey] = analytics;
        
        commit('SET_STATISTICS', { name: dID, config: allAnalytics });
        
        // Отправляем на сервер
        await dispatch('websocket/send', {
          type: 'post',
          request: 'statistics',
          name: dID,
          payload: { roomKey, paramKey, analytics }
        }, { root: true });
        
        logger.info('[settingsConfig] - saveAnalytics - Аналитика сохранена');
        
        return { success: true };
        
      } catch (error) {
        logger.error('[settingsConfig] - saveAnalytics - Ошибка сохранения:', error);
        throw error;
      }
    },


},
  
  getters: {
    getSchedules: (state, getters, rootState) => (dID) => {
      return rootState.config?.schedules?.[dID] || {};
    },
    getNotifications: (state, getters, rootState) => (dID) => {
      return rootState.config?.notifications?.[dID] || {};
    },
    getAnalytics: (state, getters, rootState) => (dID) => {
      return rootState.config?.statistics?.[dID] || {};
    },
    getPermitSchedule: state => state.permitSchedule,
    getPermitNotifications: state => state.permitNotifications,
    getPermitStatistics: state => state.permitStatistics,


    isLoading: state => state.loading,
    error: state => state.error,
    // getConfigSettings: (state) => (dID, roomKey, paramKey, configType) => {
    //   console.log('[settingsConfig] - getConfigSettings - roomKey:', roomKey, 'paramKey:', paramKey, 'configType:', configType);
    //   const nameConfig = dID + '_schedules';
    //   const schedules = state.schedules[nameConfig] || [];
    //   return schedules.filter(schedule => 
    //     schedule.roomKey === roomKey && schedule.paramKey === paramKey
    //   );
    // },

    dateTimeUtils: () => ({
    getCurrentDateTime: () => {
      return new Date().toISOString();
    },
    formatDate: (dateString, locale = 'ru-RU') => {
        try {
          if (!dateString) return '—';
          
          // Если строка уже содержит запятую, значит уже отформатирована
          if (typeof dateString === 'string' && dateString.includes(',')) {
            //console.log('[settingsConfig] - dateTimeUtils.formatDate - Уже отформатирована:', dateString);
            return dateString;
          }
          
          const date = new Date(dateString);
          if (isNaN(date.getTime())) {
            //console.log('[settingsConfig] - dateTimeUtils.formatDate - Invalid date:', dateString);
            return dateString;
          }
          
          return date.toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (error) {
          //console.log('[settingsConfig] - dateTimeUtils.formatDate - Error:', error, 'for dateString:', dateString);
          return dateString;
        }
    },

    


    }),
    validationUtils: ( getters) => ({
        validateScheduleTime: (schedule) => {
          // Синхронная версия валидации
          if (!schedule || !schedule.startTime || !schedule.endTime) {
            return {
              valid: false,
              message: 'Отсутствует время начала или окончания'
            };
          }
          
          const timeToMinutes = getters.dateTimeUtils.timeToMinutes;
          const startMinutes = timeToMinutes(schedule.startTime);
          const endMinutes = timeToMinutes(schedule.endTime);
          
          if (endMinutes <= startMinutes) {
            return {
              valid: false,
              message: 'Время окончания должно быть позже времени начала'
            };
          }
          
          return { valid: true };
        },
      //  checkScheduleOverlap: (startTime, endTime) => {
      //     try {
      //       console.log('[settingsConfig] - checkScheduleOverlap - Начало проверки', {
      //         startTime,
      //         endTime,
      //         schedulesCount: existingSchedules?.length || 0
      //       });
      //     } catch (error) {
      //       console.log('[settingsConfig] - checkScheduleOverlap - Ошибка валидации:', error);
      //     }
      //   }
    }),

  }
};