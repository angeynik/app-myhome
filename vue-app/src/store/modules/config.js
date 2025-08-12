// store/modules/config.js

export default {
  namespaced: true,
  state: () => ({
    configs: {},
    allRooms: [],
    allParams: [],
    loading: false,
    error: null
  }),
 
  mutations: {
    SET_CONFIG(state, { name, config }) {
      state.configs[name] = config;
      console.log('[sortParams] - SET_CONFIG Обновлен конфиг: ', config);
    },
    SET_ALL_ROOMS(state, rooms) {
      state.allRooms = rooms;
      console.log('[sortParams] - SET_ALL_ROOMS Обновлен список доступных комнат: ', rooms);
    },
    SET_ALL_PARAMS(state, params) {
      state.allParams = params;
      console.log('[sortParams] - SET_ALL_PARAMS Обновлен список доступных параметров: ', params);
    },
    UPDATE_SENSOR_VALUE(state, { dID, room, sensor, value, timestamp}) {
      const config = state.configs[dID];
      //console.log(`[Config] - UPDATE_SENSOR_VALUE - state.configs[${dID}] ${JSON.stringify(config, null, 2)}`);
      // const updatedRoom = config[room];
      // console.log(`[Config] - UPDATE_SENSOR_VALUE - state.configs[${dID}] Обновляем комнату ${room} - ${JSON.stringify(updatedRoom, null, 2)}`);
      if (!config) return;

      const roomObj = config[room];
      if (!roomObj || !roomObj.sensors) return;

      const sensorObj = roomObj.sensors[sensor];
      if (sensorObj) {
        sensorObj.value = value;
        sensorObj.lastUpdate = timestamp || new Date().toString();
      }
    },
    SET_LOADING(state, value) {
      state.loading = value;
    },
    SET_ERROR(state, error) {
      state.error = error;
    }
  },
  
  actions: {
    async initialize({ dispatch, rootGetters, state }) {
      //console.log('[config] - initialize - Начинаем Инициализацию конфига');
      const checkRoomKey = rootGetters['roomKey'];
      const checkParamsKey = rootGetters['paramKey'];
      console.log(`[config] - initialize - Исходные ключи сортировки  -  state.roomKey: ${checkRoomKey},  -  state.paramKey: ${checkParamsKey}`);
      if (checkRoomKey === null || checkRoomKey === undefined) {
        console.log('[config] - initialize - Ключи сортировки не найдены, инициализируем');
        await dispatch('ensureSortingKeys');
      }
      // console.log(`[config] - initialize - Исходные ключи из localStorage roomsKey: ${localStorage.getItem('roomKey')}, paramsKey: ${localStorage.getItem('paramKey')}`);

      const dID = rootGetters['dID'];
      if (dID && !state.configs[dID]) {
      await dispatch('ensureConfig', dID);
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (state.configs[dID]) {
            console.log('[config] - initialize - ensureConfig Promise завершён', state.configs[dID]);
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
      console.log('[config] - initialize - Завершена ensureConfig');
      //await dispatch('ensureSortingKeys'); 
      }
    },



    async checkConfigInState({ commit, dispatch, rootGetters, state }) {
      commit('SET_LOADING', true);
      try {
        const dID = rootGetters['dID'];
        if (!dID) return;
        
        if (!state.configs[dID]) {
          await dispatch('requestConfig', dID);
        }
      } catch (error) {
        commit('SET_ERROR', error);
      } finally {
        commit('SET_LOADING', false);
      }
    },
   
    async requestConfig({ dispatch }, dID) {
      //console.log('[config] - requestConfig - Запрос на получение конфигурации по dID - ', dID);
      try {
        const response = await dispatch('websocket/send', {
          type: 'get',
          request: 'config',
          name: dID
        }, { root: true });
        
        if (response?.payload) {
          //console.log('[config] - requestConfig - от Server Конфигурация получена - ', response.payload);
          await dispatch('handleConfigResponse', response);
        }
      } catch (error) {
        console.error(`[Config] Ошибка запроса конфигурации ${dID}:`, error);
        throw error;
      }
    },
   
    async handleConfigResponse({ commit, dispatch }, response) {
      console.log('[Config] - handleConfigResponse - Обработка ответа от Server - Конфигурация', response);
      try {
        const dID = response.name;
        const config = response.payload;
        
        if (!dID || !config) {
          throw new Error('Невалидный ответ конфигурации');
        }
        
        commit('SET_CONFIG', { name: dID, config });
        // Обновляем список комнат
        await dispatch('handleRoomsSet', config);
      // Обновляем список параметров
        await dispatch('handleParamsSet', config);
        // Обновляем ключи сортировки
        await dispatch('ensureSortingKeys');
        console.log('[Config] - handleConfigResponse - Конфиг обновлен, данные для сортировки готовы');
      } catch (error) {
        console.error('[Config] - handleConfigResponse - Ошибка обработки ответа:', error);
        throw error;
      }
    },
    handleRoomsSet ({ commit }, config ) {
      //console.log('[Config] - handleConfigResponse - Обновляем список комнат');
      try {
      // Обновляем список комнат
      const rooms = Object.keys(config).filter(key => 
        config[key]?.sensors && Object.keys(config[key].sensors).length > 0
      );
      commit('SET_ALL_ROOMS', rooms);
      //console.log('[Config] - handleConfigResponse Обновлен список доступных комнат rooms: ', rooms);
      } catch (error) {
        console.error('[Config] - handleConfigResponse - Ошибка обновления списка комнат:', error);
        throw error;
      }
    },
    handleParamsSet ({ commit }, config) {
      //console.log('[Config] - handleConfigResponse - Обновляем список параметров');
      try {
      const paramsSet = new Set();
      Object.values(config).forEach(room => {
        if (room.sensors) {
          Object.keys(room.sensors).forEach(k => {
            // Извлекаем префикс (часть до цифр)
            const prefix = k.replace(/\d+$/, '');
            paramsSet.add(prefix);
          });
        }
      });
      const params = Array.from(paramsSet);
      commit('SET_ALL_PARAMS', params);
      //console.log('[Config] - handleConfigResponse Обновлен список доступных комнат rooms: ', params);
      } catch (error) {
        console.error('[Config] - handleConfigResponse - Ошибка обновления списка параметров:', error);
        throw error;
      }
    },
    handleSensorUpdate({ commit }, { dID, payload }) {
      try {
        const { room, item_name, item_value, time } = payload;
        if (!dID || !room || !item_name || item_value === undefined) return;
        
        let timestamp;
        try {
          timestamp = time ? new Date(time).toString() : new Date().toString();
        } catch (e) {
          timestamp = new Date().toString();
        }

        commit('UPDATE_SENSOR_VALUE', {
          dID,
          room,
          sensor: item_name,
          value: item_value,
          timestamp
        });
        //console.log('[Config] Обновлено значение датчика Параметры запроса:', { dID, room, sensor: item_name, value: item_value, timestamp });
        //const updatedConfig = state.configs[dID];
        //console.log(`[Config] - UPDATE_SENSOR_VALUE - state.configs[${dID}] ${JSON.stringify(updatedConfig, null, 2)}`);
        // const updatedRoom = updatedConfig[room];
        // console.log(`[Config] - Результат обновления комнаты ${room} - ${JSON.stringify(updatedRoom, null, 2)}`);
     
      } catch (error) {
        console.error('[Config] Ошибка обработки данных сенсора:', error);
      }
    },

    async ensureConfig({ state, dispatch }, dID) {
      //console.log('[config] - ensureConfig - Проверяем наличие конфигурации по dID - ', dID);
      if (!dID) throw new Error('dID не определен');
      let config = state.configs[dID];
      // Если конфиг уже есть, просто возвращаем его
      if (config) {
        console.log('[config] - ensureConfig - Конфига найден по dID - ', dID);
        // Обновляем список комнат
        await dispatch('handleRoomsSet', config);
      // Обновляем список параметров
        await dispatch('handleParamsSet', config);
        return config;

      } 
      //console.log('[config] - ensureConfig - Конфига нет, запрашиваем');
      return await dispatch('requestConfig', dID);

    },
    // async ensureSortingKeys({ state, dispatch, rootGetters }) {
    //   console.log('[config] - ensureSortingKeys - Проверяем наличие ключей сортировки ');
    //   const room_Key = rootGetters['roomKey'] ?? localStorage.getItem('roomKey');
    //   if (!room_Key) {
    //     if (state.allRooms.length > 0) {
    //       const roomKey = state.allRooms[0];
    //       await dispatch('sortParams/updateRoomsKey', roomKey, { root: true });
    //     }
    //   }
    //   const param_Key = rootGetters['paramKey'] ?? localStorage.getItem('paramKey');
    //   if (!param_Key) {
    //     if (state.allRooms.length > 0) {
    //       const paramKey = state.allParams[0];
    //       await dispatch('sortParams/updateParamsKey', paramKey, { root: true });
    //     }
    //   }
    //   await dispatch('sortParams/updateRoomsKey', room_Key, { root: true });
    //   await dispatch('sortParams/updateParamsKey', param_Key, { root: true });

    //   //let roomKey = localStorage.getItem('roomKey');
    //   //Проверяем наличие roomKey и paramKey в localStorage

    //   // Обработка комнат
    //   //let roomKey = JSON.parse(localStorage.getItem('roomKey'));
    // //   let roomKey = localStorage.getItem('roomKey');
    // //   console.log('[config] - ensureSortingKeys - roomKey из localStorage: ', roomKey);

    // // if (roomKey === null || roomKey === 'null') {
    // //   if (state.allRooms.length > 0) {
    // //     roomKey = state.allRooms[0];
    // //     //localStorage.setItem('roomKey', JSON.stringify(roomKey));
    // //     localStorage.setItem('roomKey', roomKey);
    // //     console.log('[config] - ensureSortingKeys - Устанавливаем первую комнату:', roomKey);
    // //   } else {
    // //     console.warn('[config] - ensureSortingKeys - Нет доступных комнат');
    // //     roomKey = null;
    // //   }
    // // }
    // // if (roomKey !== null && roomKey !== 'null') {
    // //   await dispatch('sortParams/updateRoomsKey', roomKey, { root: true });
    // // }
      
    // // // Обработка параметров
    // // //let paramKey = JSON.parse(localStorage.getItem('paramKey'));
    // // let paramKey = localStorage.getItem('paramKey');
    // // console.log('[config] - ensureSortingKeys - paramKey из localStorage:', paramKey);
    
    // // if (paramKey === null || paramKey === 'null') {
    // //   if (state.allParams.length > 0) {
    // //     paramKey = state.allParams[0];
    // //     //localStorage.setItem('paramKey', JSON.stringify(paramKey));
    // //     localStorage.setItem('paramKey', paramKey);
    // //     console.log('[config] - ensureSortingKeys - Устанавливаем первый параметр:', paramKey);
    // //   } else {
    // //     console.warn('[config] - ensureSortingKeys - Нет доступных параметров');
    // //     paramKey = null;
    // //   }
    // // }
    
    // // if (paramKey !== null && paramKey !== 'null') {
    // //   await dispatch('sortParams/updateParamsKey', paramKey, { root: true });
    // // }
    // },
    async ensureSortingKeys({ state, dispatch, rootGetters }) {
      console.log('[config] - ensureSortingKeys - Проверяем наличие ключей сортировки');
      
      // Обработка комнат
      let roomKey = rootGetters['roomKey'] || localStorage.getItem('roomKey');
      console.log('[config] - ensureSortingKeys - roomKey ', roomKey);
      //if (!roomKey && state.allRooms.length > 0) {
      if (roomKey === null && state.allRooms.length > 0) {
        roomKey = state.allRooms[0];
      }
      
      if (roomKey) {
        await dispatch('sortParams/updateRoomsKey', roomKey, { root: true });
        console.log('[config] - Установлена первая комната:', roomKey);
      }

      // Обработка параметров
      let paramKey = rootGetters['paramKey'] || localStorage.getItem('paramKey');
      if (!paramKey && state.allParams.length > 0) {
        paramKey = state.allParams[0];
        localStorage.setItem('paramKey', paramKey);
        console.log('[config] - Установлен первый параметр:', paramKey);
      }
      
      if (paramKey) {
        await dispatch('sortParams/updateParamsKey', paramKey, { root: true });
      }
    }
  },
  
  getters: {
    getConfig: state => name => state.configs[name] || {},
    isLoading: state => state.loading,
    error: state => state.error,
    getCommonConfig: (state) => (dID) => state.configs[dID] || null,
    allRooms: state => state.allRooms,
    allParams: state => state.allParams,

  }
};