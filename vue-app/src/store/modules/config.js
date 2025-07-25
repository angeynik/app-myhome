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
      localStorage.setItem(`config_${name}`, JSON.stringify(config));
      console.log(`[Config] Конфигурация ${name} сохранена`);
      console.log(`[Config] Конфигурация ${localStorage.getItem(`config_${name}`)}`);
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
    
    async checkLocalStorage({ commit, dispatch, rootGetters }) {
      commit('SET_LOADING', true);
      try {
        const dID = rootGetters['dID'];
        if (!dID) {
          console.warn('[Config] dID не определен');
          return;
        }
        
        const storageKey = `config_${dID}`;
        const storedConfig = localStorage.getItem(storageKey);
        
        if (storedConfig) {
          commit('SET_CONFIG', {
            name: dID,
            config: JSON.parse(storedConfig)
          });
        } else {
          console.log(`[Config] Конфигурация ${dID} отсутствует в localStorage`);
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
    }
  },
  
  getters: {
    getConfig: state => name => state.configs[name] || {},
    isLoading: state => state.loading,
    error: state => state.error
  }
};