// модуль работы с конфигурацией Расписания
// store/modules/settingsConfig.js
import logger from './logger';

export default {
  namespaced: true,
  state: () => ({
    loading: false,
    error: null, 
    permitSchedule : false,
    permitNotifications : false,
    permitStatistics : false,
  }),

  mutations: {
    SET_NOTIFICATIONS(state, { name, config }) {
      state.notifications[name] = config;
      logger.dev('[settingsConfig] - SET_NOTIFICATIONS - Конфигурация уведомлений обновлена:', name);
    },
    SET_STATISTICS(state, { name, config }) {
      state.statistics[name] = config;
      logger.dev('[settingsConfig] - SET_STATISTICS - Конфигурация аналитики обновлена:', name);
    },
    ADD_SCHEDULE(state, { dID, schedule }) {
      const nameSchedules = dID + '_schedules';
    if (!state.schedules[nameSchedules]) {
      state.schedules[nameSchedules] = [];
    }
    state.schedules[nameSchedules].push(schedule);
    logger.dev('[settingsConfig] - ADD_SCHEDULE - Расписание добавлено:', schedule);
    },
    DELETE_SCHEDULE(state, { dID, scheduleId }) {
      const nameSchedules = dID + '_schedules';
      const schedules = state.schedules[nameSchedules];
      if (schedules) {
        state.schedules[nameSchedules] = schedules.filter(s => s.id !== scheduleId);
        logger.dev('[settingsConfig] - DELETE_SCHEDULE - Расписание удалено:', scheduleId);
      }
    },


    SET_PERMIT_SCHEDULE(state, value) {
      state.permitSchedule = value;
      logger.dev('[settingsConfig] - SET_PERMIT_SCHEDULE - установлено:', value);
    },
    SET_PERMIT_NOTIFICATIONS(state, value) {
      state.permitNotifications = value;
      logger.dev('[settingsConfig] - SET_PERMIT_NOTIFICATIONS - установлено:', value);
    },
    SET_PERMIT_STATISTICS(state, value) {
      state.permitStatistics = value;
      logger.dev('[settingsConfig] - SET_PERMIT_STATISTICS - установлено:', value);
    },

  },

  actions: {
    async initialize({ commit, dispatch, rootGetters }) {
      logger
      //console.groupCollapsed('[settingsConfig] - initialize ');
      //console.log('[settingsConfig] - initialize - Начинаем инициализацию конфигурации Расписания');
      
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - initialize - dID не определен');
        return;
      }
      
      try {
        // Восстанавливаем typeSettingsItem из localStorage
        const savedType = localStorage.getItem('typeSettingsItem');
        if (savedType) {
          commit('config/SET_TYPE_SETTINGS_ITEM', savedType, { root: true });
        } else {
          commit('config/SET_TYPE_SETTINGS_ITEM', 'schedule', { root: true });
          localStorage.setItem('typeSettingsItem', 'schedule');
        }
        
        logger.dev('[settingsConfig] - initialize - Инициализация конфигурации расписания');
        
        //console.log('[settingsConfig] - Initialize - Готовим запрос на получение конфигураций Настроек для dID:', dID);
        
        // Запрашиваем все типы конфигураций
        await dispatch('requestToServer', { configType: 'schedules' });
        await dispatch('requestToServer', { configType: 'notifications' });
        await dispatch('requestToServer', { configType: 'statistics' });
        
        logger.dev('[settingsConfig] - initialize - Все запросы для dID:', dID, 'отправлены');
        //console.log('[settingsConfig] - initialize - Все запросы отправлены');
        
        return {};
        
      } catch (error) {
        console.error('[settingsConfig] - Ошибка при отправке запроса:', error);
        commit('SET_ERROR', error.message || error.toString());
        logger.error('[settingsConfig] - initialize - Ошибка:', error);
        return {};
        
      } finally {
        logger.dev
        //console.log('[settingsConfig] - initialize - Инициализация завершена');
        //console.groupEnd();
      }
      
    },
    // async getConfigSettings({ state, rootGetters }, { configType, roomKey, paramKey }) {
    //   const dID = rootGetters['dID'];
    //   console.log('[settingsConfig] - getConfigSettings - Получаем расписания для:', {dID, roomKey, paramKey, configType});

    //   if (!dID) {
    //     logger.warn('[settingsConfig] - getConfigSettings - dID не определен');
    //     return [];
    //   }
     
    //   //const nameSchedules = dID + '_schedules';
    //   const nameSchedules = dID + '_' + configType;
    //   console.log('[settingsConfig] - getConfigSettings - nameSchedules:', nameSchedules);
    //   const schedulesData = state.schedules[nameSchedules];
      
    //   if (schedulesData && schedulesData[roomKey] && schedulesData[roomKey][paramKey]) {
    //     return schedulesData[roomKey][paramKey];
    //   }
    // // Если нет в state, проверяем localStorage
    //   const localSchedules = localStorage.getItem(nameSchedules);
    //   if (localSchedules) {
    //     try {
    //       const parsedSchedules = JSON.parse(localSchedules);
    //       if (parsedSchedules[roomKey] && parsedSchedules[roomKey][paramKey]) {
    //         // Сохраняем в state для будущих обращений
    //         if (!state.schedules[nameSchedules]) {
    //           state.schedules[nameSchedules] = {};
    //         }
    //         if (!state.schedules[nameSchedules][roomKey]) {
    //           state.schedules[nameSchedules][roomKey] = {};
    //         }
    //         state.schedules[nameSchedules][roomKey][paramKey] = parsedSchedules[roomKey][paramKey];
            
    //         return parsedSchedules[roomKey][paramKey];
    //       }
    //     } catch (error) {
    //       logger.error('[settingsConfig] - getConfigSettings - Ошибка парсинга localStorage:', error);
    //     }
    //   }
      
    //   return [];
    // },
    async getConfigSettings({ rootState, rootGetters }, { configType, roomKey, paramKey }) {
      const dID = rootGetters['dID'];
      console.log('[settingsConfig] - getConfigSettings - Получаем конфигурацию для:', {dID, roomKey, paramKey, configType});

      if (!dID) {
        logger.warn('[settingsConfig] - getConfigSettings - dID не определен');
        return [];
      }
     
      // Используем состояние из config.js
      let configData;
      switch(configType) {
        case 'schedules':
          configData = rootState.config.schedules[dID];
          break;
        case 'notifications':
          configData = rootState.config.notifications[dID];
          break;
        case 'statistics':
          configData = rootState.config.statistics[dID];
          break;
        default:
          return [];
      }
      
      if (configData && configData[roomKey] && configData[roomKey][paramKey]) {
        return configData[roomKey][paramKey];
      }
      
      // Если нет в state, проверяем localStorage
      const localKey = dID + '_' + configType;
      const localConfig = localStorage.getItem(localKey);
      if (localConfig) {
        try {
          const parsedConfig = JSON.parse(localConfig);
          if (parsedConfig[roomKey] && parsedConfig[roomKey][paramKey]) {
            return parsedConfig[roomKey][paramKey];
          }
        } catch (error) {
          logger.error('[settingsConfig] - getConfigSettings - Ошибка парсинга localStorage:', error);
        }
      }
      
      return [];
    },
    
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
    formatDate(context, { dateString, locale = 'ru-RU' }) {
      try {
        if (!dateString) return '—';
        
        const date = dateString instanceof Date ? dateString : new Date(dateString);
        
        // Проверка валидности даты
        if (isNaN(date.getTime())) {
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
        logger.error('[settingsConfig] - formatDate - Ошибка форматирования даты:', error);
        return dateString || '—';
      }
    },
    timeToMinutes(_, timeString) {
      console.log('[settingsConfig] - timeToMinutes - Преобразование времени:', timeString);
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
      console.log('[settingsConfig] - minutesToTime - Преобразование минут:', minutes);
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
    async checkScheduleOverlap(context, { startTime, endTime, existingSchedules }) {
      console.log('[settingsConfig] - checkScheduleOverlap - Начало проверки', {
        startTime,
        endTime,
        existingSchedules
      });
      try {
        // Валидация входных параметров
        if (!startTime || !endTime) {
          const message = 'Отсутствует startTime или endTime';
          console.warn('[settingsConfig] - checkScheduleOverlap - ', message);
          return message;
        }
        if (!existingSchedules || !Array.isArray(existingSchedules)) {
          return false;
        }

        const numStart = await context.dispatch('timeToMinutes', startTime);
        const numEnd = await context.dispatch('timeToMinutes', endTime);
        console.log('[settingsConfig] - checkScheduleOverlap - Новое время расписания:', {
          startTime,
          endTime,
          numStart,
          numEnd
        });
       
        // Проверяем валидность нового времени
        if (numEnd <= numStart) {
          const message = 'Некорректное время нового расписания'
          logger.dev('[settingsConfig] - checkScheduleOverlap - ', message);
          return message; // Считаем пересечением, т.к. время некорректно
        }
        
        let hasOverlap = false;
        let allExistingEnds = [];
        
        // 1. Сначала проверяем все существующие расписания на пересечение
        for (const scheduleItem of existingSchedules) {
          const existingStart = await context.dispatch('timeToMinutes', scheduleItem.startTime);
          const existingEnd = await context.dispatch('timeToMinutes', scheduleItem.endTime);
          
          console.log('[settingsConfig] - checkScheduleOverlap - Существующее время расписания:', {
            existingStart,
            existingEnd
          });
          // Добавляем в массив всех времен окончаний
          allExistingEnds.push(existingEnd);
          
          // Проверяем пересечение интервалов
          if (numStart < existingEnd && numEnd > existingStart) {
            hasOverlap = true;
            console.log('[settingsConfig] - checkScheduleOverlap - Пересечение найдено', existingStart, existingEnd, numStart, numEnd);
          }
        }

        // 2. Если есть пересечение, вычисляем новое время (этот блок должен быть ПОСЛЕ цикла)
        if (hasOverlap) {
          const latestEndTime = Math.max(...allExistingEnds);
          // Вычисляем новый startTime: самый поздний existingEnd + 1 минута
          const newStartMinutes = latestEndTime + 1;
          
          // Вычисляем новый endTime: newStart + 10 минут
          const newEndMinutes = newStartMinutes + 10;
          
          // Проверяем, что новое время не выходит за границы суток (1440 минут)
          if (newEndMinutes > 1440) {
            console.log('[settingsConfig] - checkScheduleOverlap - Новое время выходит за границы суток');
            return { 
              hasOverlap: true,
              newStartTime: null,
              newEndTime: null,
              message: 'Невозможно найти свободный промежуток в течение суток'
            };
          }
          
          // Преобразуем минуты обратно в строковое время
          const newStartTimeStr = await context.dispatch('minutesToTime', newStartMinutes);
          const newEndTimeStr = await context.dispatch('minutesToTime', newEndMinutes);

          console.log('[settingsConfig] - checkScheduleOverlap - Предложено новое время:', {
            newStartTime: newStartTimeStr,
            newEndTime: newEndTimeStr,
            newStartMinutes,
            newEndMinutes
          });
          
          // Возвращаем информацию о пересечении и новом времени
          const message = `Предложено новое время от ${newStartTimeStr} до ${newEndTimeStr}`;
          return {
            message,
            newStartTime: newStartTimeStr,
            newEndTime: newEndTimeStr
          };
        }
        
        // Если пересечения нет, возвращаем false
        return false;
        
      } catch (error) {
        logger.error('[settingsConfig] - checkScheduleOverlap - Ошибка проверки пересечения:', error);
        return error; // В случае ошибки считаем, что есть пересечение для безопасности
      }
    },

    // async addScheduleLocally({ state, dispatch, rootGetters }, { roomKey, paramKey, schedule }) {
    //   console.log('[settingsConfig] - addScheduleLocally - Начинаем локальное сохранение расписания');
    //   let configType = 'schedules';
    //   const dID = rootGetters['dID'];
    //   if (!dID) {
    //     logger.warn('[settingsConfig] - addScheduleLocally - dID не определен');
    //     return;
    //   }
      
    //   console.log('[settingsConfig] - addScheduleLocally - Добавляем расписание локально:', { dID, roomKey, paramKey, schedule });
      
    //   try {
    //     // 1. Получаем текущие расписания из config модуля
    //     const currentSchedules = await dispatch('getConfigSettings', {
    //       roomKey: roomKey,
    //       paramKey: paramKey,
    //       configType: configType
    //     });
    //     console.log('[settingsConfig] - addScheduleLocally - Текущие расписания:', currentSchedules);

        
    //     // 2. Инициализируем структуру если нужно
    //     if (!currentSchedules[roomKey]) {
    //       currentSchedules[roomKey] = {};
    //     }
        
    //     if (!currentSchedules[roomKey][paramKey]) {
    //       currentSchedules[roomKey][paramKey] = [];
    //     }
        
    //     // 3. Добавляем новое расписание
    //     const updatedSchedules = [...currentSchedules[roomKey][paramKey], schedule];
    //     currentSchedules[roomKey][paramKey] = updatedSchedules;
        
    //     // 4. Обновляем состояние
    //     state.schedules[configType] = { ...currentSchedules };
        
    //     // 5. Сохраняем в localStorage
    //     localStorage.setItem(configType, JSON.stringify(currentSchedules));
        
    //     logger.info('[settingsConfig] - addScheduleLocally - Расписание добавлено локально');
    //     return { success: true, schedule };
        
    //   } catch (error) {
    //     logger.error('[settingsConfig] - addScheduleLocally - Ошибка:', error);
    //     throw error;
    //   }
    // },













    
    // findAvailableTimeSlot(context, { currentTime, existingSchedules, minDuration = 60 }) {
    //   try {
    //     const timeToMinutes = context.dispatch('timeToMinutes');
    //     const minutesToTime = context.dispatch('minutesToTime');
        
    //     // Сортируем расписания по времени начала
    //     const sortedSchedules = [...existingSchedules].sort((a, b) => {
    //       return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    //     });
        
    //     const currentMinutes = timeToMinutes(currentTime);
    //     const endOfDay = 24 * 60; // 00:00 следующего дня
        
    //     // Если нет существующих расписаний
    //     if (sortedSchedules.length === 0) {
    //       const startTime = currentTime;
    //       const endTime = minutesToTime(Math.min(currentMinutes + minDuration, endOfDay));
    //       return { startTime, endTime, found: true };
    //     }
        
    //     // Проверяем возможность вставить до первого расписания
    //     const firstScheduleStart = timeToMinutes(sortedSchedules[0].startTime);
    //     if (currentMinutes + minDuration <= firstScheduleStart) {
    //       return {
    //         startTime: currentTime,
    //         endTime: minutesToTime(Math.min(currentMinutes + minDuration, firstScheduleStart - 1)),
    //         found: true
    //       };
    //     }
        
    //     // Ищем слот между существующими расписаниями
    //     for (let i = 0; i < sortedSchedules.length; i++) {
    //       const currentSchedule = sortedSchedules[i];
    //       const currentEnd = timeToMinutes(currentSchedule.endTime);
          
    //       // Время начала следующего расписания (или конец дня)
    //       const nextStart = i < sortedSchedules.length - 1 
    //         ? timeToMinutes(sortedSchedules[i + 1].startTime)
    //         : endOfDay;
          
    //       // Максимальное возможное время начала в этом слоте
    //       const maxPossibleStart = Math.max(currentMinutes, currentEnd + 1);
          
    //       // Проверяем, есть ли достаточно места
    //       if (maxPossibleStart + minDuration <= nextStart) {
    //         return {
    //           startTime: minutesToTime(maxPossibleStart),
    //           endTime: minutesToTime(maxPossibleStart + minDuration),
    //           found: true
    //         };
    //       }
    //     }
        
    //     // Пробуем вставить после последнего расписания в следующем дне
    //     const lastScheduleEnd = timeToMinutes(sortedSchedules[sortedSchedules.length - 1].endTime);
    //     const nextDayStart = Math.max(currentMinutes, lastScheduleEnd + 1);
        
    //     if (nextDayStart + minDuration <= endOfDay) {
    //       return {
    //         startTime: minutesToTime(nextDayStart),
    //         endTime: minutesToTime(nextDayStart + minDuration),
    //         found: true
    //       };
    //     }
        
    //     // Не нашли подходящего слота
    //     return { startTime: null, endTime: null, found: false };
        
    //   } catch (error) {
    //     console.error('[settingsConfig] - findAvailableTimeSlot - Ошибка:', error);
    //     return { startTime: null, endTime: null, found: false };
    //   }
    // },
 


    async addScheduleLocally({ dispatch, rootGetters, rootState }, { roomKey, paramKey, schedule }) {
      console.log('[settingsConfig] - addScheduleLocally - Начинаем локальное сохранение расписания');
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - addScheduleLocally - dID не определен');
        return;
      }
      
      console.log('[settingsConfig] - addScheduleLocally - Добавляем расписание локально:', { dID, roomKey, paramKey, schedule });
      
      try {
        // 1. Получаем текущие расписания из config.js
        const currentSchedules = { ...(rootState.config.schedules[dID] || {}) };
        console.log('[settingsConfig] - addScheduleLocally - Текущие расписания из config.js:', currentSchedules);
        
        // 2. Инициализируем структуру если нужно
        if (!currentSchedules[roomKey]) {
          currentSchedules[roomKey] = {};
        }
        
        if (!currentSchedules[roomKey][paramKey]) {
          currentSchedules[roomKey][paramKey] = [];
        }
        
        // 3. Добавляем новое расписание
        currentSchedules[roomKey][paramKey] = [...currentSchedules[roomKey][paramKey], schedule];
        
        // 4. Обновляем состояние в config.js через мутацию
        // Нам нужен commit, но у нас нет доступа к нему напрямую в action
        // Вместо этого используем dispatch
        await dispatch('config/updateScheduleLocally', {
          dID: dID,
          schedules: currentSchedules
        }, { root: true });
        
        // 5. Также сохраняем в localStorage для резерва
        localStorage.setItem(`${dID}_schedules`, JSON.stringify(currentSchedules));
        
        logger.info('[settingsConfig] - addScheduleLocally - Расписание добавлено локально');
        return { success: true, schedule };
        
      } catch (error) {
        logger.error('[settingsConfig] - addScheduleLocally - Ошибка:', error);
        throw error;
      }
    },
    async deleteSchedules({ dispatch, rootGetters }, { roomKey, paramKey, scheduleIds }) {
      console.groupCollapsed('[settingsConfig] - deleteSchedules');
      console.log('[settingsConfig] - deleteSchedules - Удаляем расписания:', { roomKey, paramKey, scheduleIds });
      
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - deleteSchedules - dID не определен');
        return;
      }
      console.groupEnd();
      try {
        // Отправляем на сервер
        await dispatch('websocket/send', {
          type: 'post',
          request: 'delSchedule',
          name: dID,
          payload: { 
            roomKey, 
            paramKey, 
            scheduleIds: Array.isArray(scheduleIds) ? scheduleIds : [scheduleIds] 
          }
        }, { root: true });
        
        logger.info('[settingsConfig] - deleteSchedules - Запрос на удаление отправлен');

        return { success: true };
        
      } catch (error) {
        logger.error('[settingsConfig] - deleteSchedules - Ошибка отправки:', error);
        throw error;
      }
    },







    settingsConfigUpdate({ dID, payload, type }) {
       console.log(' [settingConfig] - settingsConfigUpdate - Параметры запроса:', { dID, payload, type });

    },









    async saveSchedules({ rootGetters, dispatch }, { roomKey, paramKey, schedules }) {
      console.log('[settingsConfig] - saveSchedules - Сохраняем расписание:', { roomKey, paramKey, schedules });

      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - saveSchedules - dID не определен');
        return;
      }
      
      try {
        // Отправляем на сервер
        try {
          await dispatch('websocket/send', {
            type: 'post',
            request: 'addSchedule',
            name: dID,
            payload: { roomKey, paramKey, schedules }
          }, { root: true });
          
          // После успешной отправки на сервер, обновляем локальное состояние
          await dispatch('config/handleConfigResponse', {
            name: dID,
            request: 'schedules',
            payload: { [roomKey]: { [paramKey]: schedules } }
          }, { root: true });
          
        } catch (error) {
          logger.error('[settingsConfig] - saveSchedules - Ошибка отправки на сервер:', error);
          throw error;
        }
        
        logger.info('[settingsConfig] - saveSchedules - Расписания сохранены:', {
          roomKey,
          paramKey,
          count: schedules.length
        });
        
        return { success: true };
        
      } catch (error) {
        logger.error('[settingsConfig] - saveSchedules - Общая ошибка сохранения:', error);
        throw error;
      }
    },
    // async deleteSchedules (roomKey, paramKey, id ) {
    //   console.log('[settingsConfig] - deleteSchedules - Удаляем элемент расписания:', { roomKey, paramKey, id });

    //   // await dispatch('websocket/send', {
    //   //       type: 'post',
    //   //       request: 'delSchedule',
    //   //       name: dID,
    //   //       payload: { roomKey, paramKey, schedules }
    //   //     }, { root: true });

      
    // },

    async saveNotifications({ commit, rootGetters, dispatch }, { roomKey, paramKey, notifications }) {
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - saveNotifications - dID не определен');
        return;
      }
      
      try {
        // Обновляем в хранилище
        const key = `${dID}_notifications`;
        const allNotifications = { ...(this.state.notifications[key] || {}) };
        
        if (!allNotifications[roomKey]) {
          allNotifications[roomKey] = {};
        }
        allNotifications[roomKey][paramKey] = notifications;
        
        commit('SET_NOTIFICATIONS', { name: dID, config: allNotifications });
        
        // Отправляем на сервер
        await dispatch('websocket/send', {
          type: 'post',
          request: 'notifications',
          name: dID,
          payload: { roomKey, paramKey, notifications }
        }, { root: true });
        
        logger.info('[settingsConfig] - saveNotifications - Уведомления сохранены');
        
        return { success: true };
        
      } catch (error) {
        logger.error('[settingsConfig] - saveNotifications - Ошибка сохранения:', error);
        throw error;
      }
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
    getSchedules: state => dID => state.schedules[dID + '_schedules'] || {},
    getNotifications: (state) => (dID) => { return state.notifications[dID] || {}; },
    getAnalytics: (state) => (dID) => {return state.statistics[dID] || {}; },
    // getNotifications: state => dID => state.schedules[dID + 'notifications'] || {},
    // getAnalitics: state => dID => state.schedules[dID + 'statistics'] || {},
    getPermitSchedule: state => state.permitSchedule,
    getPermitNotifications: state => state.permitNotifications,
    getPermitStatistics: state => state.permitStatistics,


    isLoading: state => state.loading,
    error: state => state.error,
    getConfigSettings: (state) => (dID, roomKey, paramKey, configType) => {
      console.log('[settingsConfig] - getConfigSettings - roomKey:', roomKey, 'paramKey:', paramKey, 'configType:', configType);
      const nameConfig = dID + '_schedules';
      const schedules = state.schedules[nameConfig] || [];
      return schedules.filter(schedule => 
        schedule.roomKey === roomKey && schedule.paramKey === paramKey
      );
    },

    dateTimeUtils: () => ({
      getCurrentDateTime: () => {
        return new Date().toISOString();
      },
      formatDate: (dateString, locale = 'ru-RU') => {
        try {
          if (!dateString) return '—';
          const date = new Date(dateString);
          return date.toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (error) {
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
       checkScheduleOverlap: (startTime, endTime, existingSchedules) => {
          try {
            console.log('[settingsConfig] - checkScheduleOverlap - Начало проверки', {
              startTime,
              endTime,
              existingSchedules,
              schedulesCount: existingSchedules?.length || 0
            });
          } catch (error) {
            console.log('[settingsConfig] - checkScheduleOverlap - Ошибка валидации:', error);
          }

          // Синхронная версия для геттера
          // const timeToMinutes = getters.dateTimeUtils.timeToMinutes;
          // const newStart = timeToMinutes(startTime);
          // const newEnd = timeToMinutes(endTime);
          
          // if (newEnd <= newStart) return true;
          
          // return existingSchedules.some(schedule => {
          //   const existingStart = timeToMinutes(schedule.startTime);
          //   const existingEnd = timeToMinutes(schedule.endTime);
          //   return (newStart < existingEnd && newEnd > existingStart);
          // });
        }
    }),

  }
};