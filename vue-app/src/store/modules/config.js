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
    },
    UPDATE_SENSOR_VALUE(state, { dID, room, sensor, value, timestamp}) {
      const config = state.configs[dID];
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
    async initialize({ dispatch, rootGetters }) {
      const dID = rootGetters['dID'];
      if (dID) {
        await dispatch('ensureConfig', dID);
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
      } catch (error) {
        console.error('[Config] Ошибка обработки ответа:', error);
        throw error;
      }
    },
    handleSensorUpdate({ commit }, { dID, payload }) {
      try {
        const { room, item_name, item_value, time } = payload;
        if (!dID || !room || !item_name || item_value === undefined) return;
        
        let timestamp;
        try {
          timestamp = time ? new Date(time).toISOString() : new Date().toISOString();
        } catch (e) {
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

    async ensureConfig({ state, dispatch }, dID) {
      if (!dID) throw new Error('dID не определен');
      if (!state.configs[dID]) {
        await dispatch('requestConfig', dID);
      }
    },
  },
  
  getters: {
    getConfig: state => name => state.configs[name] || {},
    isLoading: state => state.loading,
    error: state => state.error,
    getCommonConfig: (state) => (dID) => state.configs[dID] || null,
  }
};