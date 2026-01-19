// модуль работы с конфигурацией Расписания
// store/modules/scheduleConfig.js
import logger from './logger';

export default {
  namespaced: true,
  state: () => ({
    typePopupItem: 'Расписание',
    schedules: {}, // Для хранения расписаний по dID
    loading: false,
    error: null
  }),

  mutations: {
    SET_TYPE_POPUP_ITEM(state, type) {
      state.typePopupItem = type;
      logger.dev('[scheduleConfig] - SET_TYPE_POPUP_ITEM - Установлен тип попапа:', type);
    },
    SET_SCHEDULES(state, { dID, schedules }) {
      const nameSchedules = dID + '_schedules';
      state.schedules[nameSchedules] = schedules;
      logger.dev('[scheduleConfig] - SET_SCHEDULES - Установлены расписания для dID:', nameSchedules);
      console.log('[scheduleConfig] - SET_SCHEDULES - Установлены расписания для ', nameSchedules, ' : ', state.schedules[nameSchedules]);
    },
    SET_LOADING(state, value) {
      state.loading = value;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
    ADD_SCHEDULE(state, { dID, schedule }) {
      const nameSchedules = dID + '_schedules';
    if (!state.schedules[nameSchedules]) {
      state.schedules[nameSchedules] = [];
    }
    state.schedules[nameSchedules].push(schedule);
    logger.dev('[scheduleConfig] - ADD_SCHEDULE - Расписание добавлено:', schedule);
    },
    UPDATE_SCHEDULE(state, { dID, scheduleId, updates }) {
      const nameSchedules = dID + '_schedules';
      const schedules = state.schedules[nameSchedules];
      if (schedules) {
        const index = schedules.findIndex(s => s.id === scheduleId);
        if (index !== -1) {
          state.schedules[nameSchedules][index] = { ...schedules[index], ...updates };
          logger.dev('[scheduleConfig] - UPDATE_SCHEDULE - Расписание обновлено:', scheduleId);
        }
      }
    },
    UPDATE_SCHEDULE_VALUE(state, { dID, scheduleId, field, value }) {
      const nameSchedules = dID + '_schedules';
      const schedules = state.schedules[nameSchedules];
      if (schedules) {
        const index = schedules.findIndex(s => s.id === scheduleId);
        if (index !== -1) {
          state.schedules[nameSchedules][index][field] = value;
          logger.dev('[scheduleConfig] - UPDATE_SCHEDULE_VALUE - Значение обновлено:', { scheduleId, field, value });
        }
      }
    },
    
    UPDATE_SCHEDULE_LOCAL(state, { dID, scheduleId, updates }) {
      const nameSchedules = dID + '_schedules';
      const schedules = state.schedules[nameSchedules];
      if (schedules) {
        const index = schedules.findIndex(s => s.id === scheduleId);
        if (index !== -1) {
          state.schedules[nameSchedules][index] = { 
            ...state.schedules[nameSchedules][index], 
            ...updates 
          };
          logger.dev('[scheduleConfig] - UPDATE_SCHEDULE_LOCAL - Локальное расписание обновлено:', scheduleId);
        }
      }
    },
    
    SAVE_SCHEDULES_LOCAL(state, { dID, roomKey, paramKey, schedules }) {
      const nameSchedules = dID + '_schedules';
      
      // Инициализируем структуру если нужно
      if (!state.schedules[nameSchedules]) {
        state.schedules[nameSchedules] = {};
      }
      
      if (!state.schedules[nameSchedules][roomKey]) {
        state.schedules[nameSchedules][roomKey] = {};
      }
      
      if (!state.schedules[nameSchedules][roomKey][paramKey]) {
        state.schedules[nameSchedules][roomKey][paramKey] = [];
      }
      
      // Обновляем расписания
      state.schedules[nameSchedules][roomKey][paramKey] = schedules;
      
      // Сохраняем в localStorage
      localStorage.setItem(nameSchedules, JSON.stringify(state.schedules[nameSchedules]));
      
      logger.info('[scheduleConfig] - SAVE_SCHEDULES_LOCAL - Расписания сохранены локально:', {
        dID,
        roomKey,
        paramKey,
        count: schedules.length
      });
    },
    DELETE_SCHEDULE(state, { dID, scheduleId }) {
      const nameSchedules = dID + '_schedules';
      const schedules = state.schedules[nameSchedules];
      if (schedules) {
        state.schedules[nameSchedules] = schedules.filter(s => s.id !== scheduleId);
        logger.dev('[scheduleConfig] - DELETE_SCHEDULE - Расписание удалено:', scheduleId);
      }
    },

  },
 
  actions: {
    async initialize({ commit, dispatch, rootGetters }) {
      //console.log('[scheduleConfig] - initialize - Ничинаем Инициализацию конфигурации Расписания');
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[scheduleConfig] - initialize - dID не определен');
        return;
      }

      commit('SET_LOADING', true);
      try {
        // Восстанавливаем typePopupItem из localStorage
        const savedType = localStorage.getItem('typePopupItem');
        if (savedType) {
          commit('SET_TYPE_POPUP_ITEM', savedType);
        } else {
          commit('SET_TYPE_POPUP_ITEM', 'Расписание');
          localStorage.setItem('typePopupItem', 'Расписание');
        }
        
        logger.dev('[scheduleConfig] - initialize - Инициализация конфигурации расписания');
      } catch (error) {
        commit('SET_ERROR', error);
        logger.error('[scheduleConfig] - initialize - Ошибка инициализации:', error);
      } finally {
        commit('SET_LOADING', false);
      }

    try {

      //console.log('[scheduleConfig] - Initialize - Готовим запрос расписаний для dID:', dID);
      dispatch('requestSchedulesServer');

      // dispatch('websocket/send', {
      //   type: 'get',
      //   request: 'schedules',
      //   name: dID,
      //   payload: {}
      // }, { root: true });

      return {};

    } catch (error) {
      console.error('[scheduleConfig] - Ошибка при отправке запроса расписаний:', error);
      commit('SET_ERROR', error.message || error.toString());
      logger.error('[scheduleConfig] - requestSchedulesServer - Ошибка:', error);
      
      // Возвращаем пустой объект вместо выбрасывания ошибки
      return {};
    } finally {
      commit('SET_LOADING', false);
      //console.log('[scheduleConfig] - Загрузка расписаний завершена');
    }
    },
    
    async requestSchedulesServer({ rootGetters }) {
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[scheduleConfig] - requestSchedulesServer - dID не определен');
        return;
      }
      try {
        logger.dev('[scheduleConfig] - requestSchedulesServer - Загрузка расписаний для dID:', dID);
        this.dispatch('websocket/send', {
          type: 'get',
          request: 'schedules',
          name: dID
        }, { root: true });
      } catch (error) {
        logger.error('[scheduleConfig] - requestSchedulesServer - Ошибка загрузки расписаний:', error);
        throw error;
      }
    },
    updateTypePopupItem({ commit }, type) {
      commit('SET_TYPE_POPUP_ITEM', type);
      localStorage.setItem('typePopupItem', type);
      logger.info('[scheduleConfig] - updateTypePopupItem - Обновлен тип попапа:', type);
    },
    // async saveSchedules({ commit, rootGetters, dispatch }, { roomKey, paramKey, schedules }) {
    //     const dID = rootGetters['dID'];
    //     if (!dID) {
    //       logger.warn('[scheduleConfig] - saveSchedules - dID не определен');
    //       return;
    //     }
        
    //     try {
    //       // Разделяем новые и обновленные расписания
    //       const newSchedules = schedules.filter(s => !s.id);
    //       const updatedSchedules = schedules.filter(s => s.id);
          
    //       // Сохраняем новые расписания
    //       for (const schedule of newSchedules) {
    //         try {
    //           await dispatch('addSchedule', schedule);
    //           logger.info('[scheduleConfig] - saveSchedules - Новое расписание добавлено:', schedule);
    //         } catch (error) {
    //           logger.error('[scheduleConfig] - saveSchedules - Ошибка добавления нового расписания:', error);
    //           // Продолжаем обработку остальных
    //         }
    //       }
          
    //       // Обновляем существующие расписания
    //       for (const schedule of updatedSchedules) {
    //         try {
    //           const { id, ...updates } = schedule;
    //           await dispatch('updateSchedule', { scheduleId: id, updates });
    //           logger.info('[scheduleConfig] - saveSchedules - Расписание обновлено:', id);
    //         } catch (error) {
    //           logger.error('[scheduleConfig] - saveSchedules - Ошибка обновления расписания:', error);
    //           // Продолжаем обработку остальных
    //         }
    //       }
          
    //       // Сохраняем в локальное хранилище
    //       commit('SAVE_SCHEDULES_LOCAL', { dID, roomKey, paramKey, schedules });
          
    //       // Запрашиваем обновленные данные с сервера
    //       await dispatch('requestSchedulesServer');
          
    //       logger.info('[scheduleConfig] - saveSchedules - Все расписания сохранены:', {
    //         new: newSchedules.length,
    //         updated: updatedSchedules.length
    //       });
          
    //       return { success: true, newCount: newSchedules.length, updatedCount: updatedSchedules.length };
          
    //     } catch (error) {
    //       logger.error('[scheduleConfig] - saveSchedules - Общая ошибка сохранения:', error);
    //       throw error;
    //     }
    //   },
    async saveSchedules({ state, commit, rootGetters, dispatch }, { roomKey, paramKey, schedules }) {
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[scheduleConfig] - saveSchedules - dID не определен');
        return;
      }
      
      try {
        commit('SET_LOADING', true);
        
        // Сохраняем в локальное хранилище
        commit('SAVE_SCHEDULES_LOCAL', { dID, roomKey, paramKey, schedules });
        
        // Обновляем Vuex состояние для немедленного отображения
        const nameSchedules = dID + '_schedules';
        if (!state.schedules[nameSchedules]) {
          state.schedules[nameSchedules] = {};
        }
        if (!state.schedules[nameSchedules][roomKey]) {
          state.schedules[nameSchedules][roomKey] = {};
        }
        state.schedules[nameSchedules][roomKey][paramKey] = schedules;
        
        // Отправляем на сервер
        try {
          await dispatch('websocket/send', {
            type: 'post',
            request: 'schedules',
            name: dID,
            payload: { roomKey, paramKey, schedules }
          }, { root: true });
        } catch (error) {
          logger.error('[scheduleConfig] - saveSchedules - Ошибка отправки на сервер:', error);
        }
        
        logger.info('[scheduleConfig] - saveSchedules - Расписания сохранены:', {
          roomKey,
          paramKey,
          count: schedules.length
        });
        
        return { success: true };
        
      } catch (error) {
        logger.error('[scheduleConfig] - saveSchedules - Общая ошибка сохранения:', error);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
  // async getSchedulesForParam({ state, rootGetters, rootState }, { roomKey, paramKey }) {
  //   console.log('[scheduleConfig] - getSchedulesForParam - Получаем расписания для:', {
  //     roomKey, paramKey
  //   });
    
  //   const dID = rootGetters['dID'];
  //   if (!dID) {
  //     console.warn('[scheduleConfig] - getSchedulesForParam - dID не определен');
  //     return [];
  //   }
    
  //   console.log('[scheduleConfig] - Текущий dID:', dID);
    
  //   // 2. Если нет в scheduleConfig, проверяем config модуль
  //   const configName = `${dID}_schedules`;
  //   const configSchedules = rootState.config.configs[configName];
    
  //   if (configSchedules && configSchedules[roomKey]?.[paramKey]) {
  //     const schedules = configSchedules[roomKey][paramKey];
  //     console.log('[scheduleConfig] - Найдено расписаний в config модуле:', schedules.length);
  //     console.log(`[scheduleConfig] - Расписание для ${dID}_schedules_${roomKey}_${paramKey} в state.schedules: ${JSON.stringify(schedules)}`);
  //     // Сохраняем в scheduleConfig state для быстрого доступа
  //     if (!state.schedules[roomKey]) {
  //       state.schedules[roomKey] = {};
  //     }
  //     state.schedules[roomKey][paramKey] = [...schedules];
      
  //     return schedules.map(s => ({ ...s, roomKey, paramKey }));
  //   }
    
  //   console.log('[scheduleConfig] - Расписания не найдены');
  //   return [];
  // },
// В actions добавьте:
async getSchedulesForParam({ state, rootGetters }, { roomKey, paramKey }) {
  const dID = rootGetters['dID'];
  if (!dID) {
    logger.warn('[scheduleConfig] - getSchedulesForParam - dID не определен');
    return [];
  }
  
  const nameSchedules = dID + '_schedules';
  const schedulesData = state.schedules[nameSchedules];
  
  if (schedulesData && schedulesData[roomKey] && schedulesData[roomKey][paramKey]) {
    return schedulesData[roomKey][paramKey];
  }
  
  // Если нет в state, проверяем localStorage
  const savedSchedules = localStorage.getItem(nameSchedules);
  if (savedSchedules) {
    try {
      const parsedSchedules = JSON.parse(savedSchedules);
      if (parsedSchedules[roomKey] && parsedSchedules[roomKey][paramKey]) {
        // Сохраняем в state для будущих обращений
        if (!state.schedules[nameSchedules]) {
          state.schedules[nameSchedules] = {};
        }
        if (!state.schedules[nameSchedules][roomKey]) {
          state.schedules[nameSchedules][roomKey] = {};
        }
        state.schedules[nameSchedules][roomKey][paramKey] = parsedSchedules[roomKey][paramKey];
        
        return parsedSchedules[roomKey][paramKey];
      }
    } catch (error) {
      logger.error('[scheduleConfig] - getSchedulesForParam - Ошибка парсинга localStorage:', error);
    }
  }
  
  return [];
},

},
  
  getters: {
    typePopupItem: state => state.typePopupItem,
    getSchedules: state => dID => state.schedules[dID + '_schedules'] || {},
    isLoading: state => state.loading,
    error: state => state.error,
    getSchedulesForParam: (state) => (dID, roomKey, paramKey) => {
      console.log('[scheduleConfig] - getSchedulesForParam - roomKey:', roomKey, 'paramKey:', paramKey);
      const nameConfig = dID + '_schedules';
      const schedules = state.schedules[nameConfig] || [];
      return schedules.filter(schedule => 
        schedule.roomKey === roomKey && schedule.paramKey === paramKey
      );
    },
  }
};