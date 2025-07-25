const generateRequestId = () => Date.now() + '-' + Math.random().toString(36).substr(2, 9);
export default {
    namespaced: true,
    state: () => ({
      configs: {},
      loading: false,
      error: null
    }),
    mutations: {
      // SET_CONFIG(state, { name, config }) {
      //   console.log('сохраняем полученнную конфигурацию', name)
      //   state[name] = config
      //   localStorage.setItem(name, JSON.stringify(config))
      // },
      SET_CONFIG(state, { name, config }) {
        console.log(`[Mutation] Сохранение конфигурации: ${name}`);
        
        // Для поддержки нескольких конфигураций
        state.configs[name] = config;
        
        // Сохраняем под ключом name (dID)
        localStorage.setItem(name, JSON.stringify(config));
        
        console.log(`[LocalStorage] Конфигурация ${name} сохранена`);
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


      async checkLocalStorage({ commit, dispatch, rootGetters }) {
        commit('SET_LOADING', true);
        // Получаем configName из геттера dID
        const configName = rootGetters['dID'];
        console.log(`[Config] Проверка конфигурации для dID: ${configName}`);

          if (!configName) {
            console.error('[Config] dID не определен! Пропуск загрузки конфигурации');
            commit('SET_LOADING', false);
            return;
          }

        try {
        const storageKey = `config_${configName}`;
        console.log(`[LocalStorage] Проверка ключа: ${storageKey}`);

         if (!localStorage.getItem(configName)) {
            console.log(`Конфигурация ${configName} отсутствует в localStorage - отправляем запрос на сервер`);
              const response = await dispatch('sendRequest', {
                type: 'get',
                request: 'config',
                config: configName
              });
              console.log('--67-- checkLocalStorage - [Config] Ответ сервера:', response);
              
            if (response?.payload) {
              console.log(`--70-- checkLocalStorage - [Config] Сохранение конфигурации ${configName} в localStorage`);

                commit('SET_CONFIG', {
                name: configName,
                config: response.payload
                });
            } else {
              console.warn(`Не удалось получить данные для ${configName}`);
            }
           
         } else {
            console.log(`Конфигурация ${configName} уже существует в localStorage`);
            const storedConfig = JSON.parse(localStorage.getItem(storageKey));
            commit('SET_CONFIG', { name: storageKey, config: storedConfig });
              }
        } catch (error) {
          console.error(`[Config] Ошибка загрузки конфигурации ${configName}:`, error);
          dispatch('logError', error);
        } finally {
          commit('SET_LOADING', false);
        }

      },
      
      // async sendRequest({ commit, dispatch, rootGetters }, { type, request, config }) {
      //   try {
      //     //const generateId = generateRequestId();
      //     const requestId = generateRequestId();
      //     console.log(`Запрос sendRequest: requestId=${requestId}, config=${config}`);

      //     const payload = {
      //       type,
      //       request,
      //       name: rootGetters['dID'],
      //       payload: { 
      //         requestId: requestId 
      //       }
      //     }
      //     console.log('сформировано сообщение', payload)
      //     const response = await dispatch(
      //       'websocket/send', 
      //       payload, 
      //       { root: true }
      //     )
      //     console.log(' sendRequest - - Получен ответ:', response);

      //     if (response.type === 'response') {
      //       commit('SET_CONFIG', { name, config: response.payload })
      //       return response;
      //     }
  
      //     if (response.type === 'error') {
      //       throw new Error(response.payload?.message || 'Unknown error')
      //     }
 
      //     throw new Error('Invalid response format')
      //   } catch (error) {
      //     commit('SET_ERROR', error.message)
      //     console.log ('Ошибка отправки сообщения в sendRequest - config.js')
      //     //await dispatch('logError', error)
      //     throw error
      //   }
      // },
  
      async sendRequest({ commit, dispatch, rootGetters }, { type, request, config }) {
            try {
                const dID = rootGetters['dID'];
                if (!dID) {
                    throw new Error('dID не доступен для отправки запроса');
                }
                
                const requestId = generateRequestId();
                console.log(`[Request] Отправка запроса: ${requestId}, config: ${config}`);
                
                const payload = {
                    type,
                    request,
                    name: dID, // Используем dID без префикса
                    payload: { 
                        configName: config,
                        requestId 
                    }
                };
                
                console.log('[Request] Параметры запроса:', JSON.stringify(payload));
                const response = await dispatch('websocket/send', payload, { root: true });
                console.log('[Request] Ответ получен:', response);
                
                return response;
            } catch (error) {
                console.error(`[Request] Ошибка: ${error.message}`);
                commit('SET_ERROR', error.message);
                dispatch('logError', error);
                throw error;
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
      getConfig: state => name => state.configs[name] || {},
      isLoading: state => state.loading,
      error: state => state.error,

      getRoomConfig: state => roomKey => state.commonConfig[roomKey] || {},
      getSensorConfig: (state) => (roomKey, sensorKey) => {
        return state.commonConfig[roomKey]?.sensors?.[sensorKey] || {}
      },
    }
  }