// модуль работы с конфигурацией Расписания
// store/modules/settingsConfig.js
import logger from './logger';

export default {
  namespaced: true,
  state: () => ({
    loading: false,
    error: null
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

  },

  actions: {
    async initialize({ commit, dispatch, rootGetters }) {
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
        
        //console.log('[settingsConfig] - initialize - Все запросы отправлены');
        
        return {};
        
      } catch (error) {
        console.error('[settingsConfig] - Ошибка при отправке запроса:', error);
        commit('SET_ERROR', error.message || error.toString());
        logger.error('[settingsConfig] - initialize - Ошибка:', error);
        return {};
        
      } finally {
        console.log('[settingsConfig] - Инициализация завершена');
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
    
    



















async saveSchedules({ rootGetters, dispatch }, { roomKey, paramKey, schedules }) {
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
        request: 'schedules',
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
  }
};