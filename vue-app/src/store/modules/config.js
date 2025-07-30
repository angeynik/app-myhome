export default {
  namespaced: true,
  state: () => ({
    configs: {},
    loading: false,
    error: null
  }),
  
  mutations: {
    SET_CONFIG(state, { name, config }) {
      state.configs[name] = config;
      //localStorage.setItem(`config_${name}`, JSON.stringify(config));
      console.log(`[Config] Конфигурация ${name} сохранена`);
      //console.log(`[Config] Конфигурация ${localStorage.getItem(`config_${name}`)}`);
    },
    UPDATE_SENSOR_VALUE(state, { dID, room, sensor, value, timestamp}) {
          console.log(`[Config] Шаг 1 - Запрос на обновление значение сенсора ${sensor} в комнате ${room} для конфигурации ${dID}`);
          const configCopy = JSON.parse(JSON.stringify(state.configs[dID]));
          if (!configCopy) {
            console.warn(`[Config] Конфигурация ${dID} не найдена для обновления`);
            return;
          }
        try {
        // Создаем глубокую копию конфигурации
          //const configCopy = JSON.parse(JSON.stringify(state.configs[dID]));
          console.log('[Config] Шаг 2 - [UpdateSensorValue] Конфигурация: для', sensor, ' - ', configCopy[room].sensors[sensor]);
        // Находим и обновляем значение сенсора
          if (configCopy[room].sensors[sensor]) {
            configCopy[room].sensors[sensor].value = value;
            configCopy[room].sensors[sensor].lastUpdate = new Date().toString() || timestamp;

            
        // Обновляем состояние и localStorage
            state.configs[dID] = configCopy;
            localStorage.setItem(`config_${dID}`, JSON.stringify(configCopy));
            console.log(`[Config] Сенсор ${sensor} в комнате ${room} обновлен для stateConfig Vuex:`);
            console.log(configCopy);

            // const checkLocalStorage = localStorage.getItem(`config_${dID}`);
            // const checkState = JSON.parse(checkLocalStorage);
            // console.log(`[Config] Конфигурация ${dID}:`);
            // console.log(checkState); 

          } else {
            console.warn(`[Config] Сенсор ${sensor} в комнате ${room} не найден`);
          }
        } catch (error) {
          console.log(error);
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
    async initialize({ dispatch }) {
      try {
        await dispatch('checkWebsocketConnection');
        await dispatch('checkLocalStorage');
      } catch (error) {
        console.error('[Config] Ошибка инициализации:', error);
        throw error;
      }
    },
    
    async checkWebsocketConnection({ dispatch, rootState }) {
      if (!rootState.websocket.socket || 
          rootState.websocket.socket.readyState !== WebSocket.OPEN) {
        await dispatch('websocket/connect', null, { root: true });
      }
    },
    
    async checkLocalStorage({state, commit, dispatch, rootGetters }) {
      commit('SET_LOADING', true);
      try {
        const dID = rootGetters['dID'];
        if (!dID) {
          console.warn('[Config] dID не определен');
          return;
        }
        const storedConfig = state.configs[dID];
        if (!storedConfig) {
          console.log(`[Config] Конфигурация ${dID} отсутствует в Vuex state`);
          await dispatch('requestConfig', dID);
        }
      } catch (error) {
        commit('SET_ERROR', error);
        console.error('[Config] Ошибка проверки хранилища:', error);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async requestConfig({ dispatch }, dID) {
      try {
        const response = await dispatch('websocket/send', {
          type: 'get',
          request: 'config',
          name: dID
        }, { root: true });
        
        if (response?.payload) {
          await dispatch('handleConfigResponse', response);
        }
      } catch (error) {
        console.error(`[Config] Ошибка запроса конфигурации ${dID}:`, error);
        throw error;
      }
    },
    
    async handleConfigResponse({ commit }, response) {
      try {
        const dID = response.name;
        const config = response.payload;
        
        if (!dID || !config) {
          throw new Error('Невалидный ответ конфигурации');
        }
        
        commit('SET_CONFIG', { name: dID, config });
        console.log(`[Config] Конфигурация ${dID} обновлена`);
      } catch (error) {
        console.error('[Config] Ошибка обработки ответа:', error);
        throw error;
      }
    },
    handleSensorUpdate({ commit }, { dID, payload }) {
          console.log(`[handleSensorUpdate] dID - ${dID} data - ${payload}`);
          try {
            const { room, item_name, item_value, time } = payload;
            
            if (!dID || !room || !item_name || item_value === undefined) {
              throw new Error('Невалидные данные сенсора');
            }
            
            let timestamp;
            try {
              timestamp = time ? new Date(time).toISOString() : new Date().toISOString();
            } catch (e) {
              console.warn('[Config] Ошибка преобразования времени, используется текущее время');
              timestamp = new Date().toISOString();
            }

            commit('UPDATE_SENSOR_VALUE', {
              dID,
              room,
              sensor: item_name,
              value: item_value,
              timestamp
            });
            
          } catch (error) {
            console.error('[Config] Ошибка обработки данных сенсора:', error);
          }
    },

  },
  
  getters: {
    getConfig: state => name => state.configs[name] || {},
    isLoading: state => state.loading,
    error: state => state.error,
    getSensorValue: (state) => (roomKey, sensorKey) => {
      const dID = state.auth?.dID; // Используем dID из состояния auth
      if (!dID || !state.configs[dID]) return null;
      
      return state.configs[dID]?.commonConfig?.rooms?.[roomKey]?.sensors?.[sensorKey]?.value;
    }
  }
};