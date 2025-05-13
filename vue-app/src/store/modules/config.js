const generateRequestId = () => Date.now() + '-' + Math.random().toString(36).substr(2, 9);
export default {
    namespaced: true,
    state: () => ({
      commonConfig: {},
      manageConfig: {},
      directoryConfig: {},
      loading: false,
      error: null
    }),
    mutations: {
      SET_CONFIG(state, { name, config }) {
        console.log('сохраняем полученнную конфигурацию', name)
        state[name] = config
        localStorage.setItem(name, JSON.stringify(config))
      },
      SET_LOADING(state, value) {
        state.loading = value
      },
      SET_ERROR(state, error) {
        state.error = error
      }
    },
    actions: {
      async initialize({ dispatch }) {
        try {
          await dispatch('checkWebsocketConnection')
          await dispatch('checkLocalStorage')
        } catch (error) {
          console.log ('Ошибка отправки сообщения в initialize - config.js')
          //dispatch('log/addError', error, { root: true })
          throw error
        }
      },
  
      async checkWebsocketConnection({ dispatch, rootState }) {
        if (!rootState.websocket.socket || 
            rootState.websocket.socket.readyState !== WebSocket.OPEN) {
          await dispatch('websocket/connect', null, { root: true })
        }
      },
  
      // async checkLocalStorage({ commit, dispatch }) {
      //   commit('SET_LOADING', true)
        
      //   const configs = ['commonConfig', 'manageConfig', 'directoryConfig']
        
      //   for (const configName of configs) {
      //     if (!localStorage.getItem(configName)) {
      //       console.log('Конфигурации ', configName, ' нет в localStorage - готовим запрос на сервер')
      //       const response = await dispatch('sendRequest', {
      //         type: 'get',
      //         request: 'config',
      //         config: configName
      //       })
      //       commit('SET_CONFIG', {
      //         name: configName,
      //         config: response.payload[configName]
      //       });
      //     } else {
      //       console.log('Конфигурация ', configName, ' уже существует в localStorage')
      //       const storedConfig = JSON.parse(localStorage.getItem(configName))
      //       commit('SET_CONFIG', { name: configName, config: storedConfig })
      //       //commit('SET_CONFIG', { name, config: response.payload })
      //     }
      //   }
        
      //   commit('SET_LOADING', false)
      // },


      async checkLocalStorage({ commit, dispatch }) {
        commit('SET_LOADING', true);
        
        const configs = ['commonConfig', 'manageConfig', 'directoryConfig'];
        
        for (const configName of configs) {
          if (!localStorage.getItem(configName)) {
            console.log(`Конфигурация ${configName} отсутствует в localStorage - отправляем запрос на сервер`);
            try {
              const response = await dispatch('sendRequest', {
                type: 'get',
                request: 'config',
                config: configName
              });
              console.log ('response - - checkLocalStorage - sendRequest', response)
              if (response && response.payload) {
                console.log('ответ от сервера', response)
                commit('SET_CONFIG', {
                  name: configName,
                  config: response.payload[configName]
                });
              } else {
                console.warn(`Не удалось получить данные для ${configName}`);
              }
            } catch (error) {
              console.error(`Ошибка запроса конфигурации ${configName}:`, error);
            }
          } else {
            console.log(`Конфигурация ${configName} уже существует в localStorage`);
            const storedConfig = JSON.parse(localStorage.getItem(configName));
            commit('SET_CONFIG', { name: configName, config: storedConfig });
          }
        }
        
        commit('SET_LOADING', false);
      },
      
      async sendRequest({ commit, dispatch, rootGetters }, { type, request, config }) {
        try {
          //const generateId = generateRequestId();
          const requestId = generateRequestId();
          console.log(`Запрос sendRequest: requestId=${requestId}, config=${config}`);

          const payload = {
            type,
            request,
            name: rootGetters['dID'],
            payload: { 
              configName: config,
              requestId: requestId 
            }
          }
          console.log('сформировано сообщение', payload)
          const response = await dispatch(
            'websocket/send', 
            payload, 
            { root: true }
          )
          console.log(' sendRequest - - Получен ответ:', response);

          if (response.type === 'response') {
            commit('SET_CONFIG', { name, config: response.payload })
            return response
          }
  
          if (response.type === 'error') {
            throw new Error(response.payload?.message || 'Unknown error')
          }
 
          throw new Error('Invalid response format')
        } catch (error) {
          commit('SET_ERROR', error.message)
          console.log ('Ошибка отправки сообщения в sendRequest - config.js')
          //await dispatch('logError', error)
          throw error
        }
      },
  
      async logError({ rootGetters }, error) {
        const errorPayload = {
          type: 'error',
          message: `Config error: ${error.message}`
        }
        
        if (rootGetters['websocket/isConnected']) {
          await rootGetters['websocket/send'](errorPayload)
        }
        console.log ('Ошибка отправки сообщения в logError - config.js')
        //await dispatch('log/addError', errorPayload, { root: true });
      }
    },
    getters: {
      getCommonConfig: state => state.commonConfig,
      getManageConfig: state => state.manageConfig,
      getDirectoryConfig: state => state.directoryConfig,
      isLoading: state => state.loading,
      error: state => state.error,

      getRoomConfig: state => roomKey => state.commonConfig[roomKey] || {},
      getSensorConfig: (state) => (roomKey, sensorKey) => {
        return state.commonConfig[roomKey]?.sensors?.[sensorKey] || {}
      },
    }
  }