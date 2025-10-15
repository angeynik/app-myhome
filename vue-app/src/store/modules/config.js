// store/modules/config.js

export default {
  namespaced: true,
  state: () => ({
    configs: {},
    allRooms: [],
    allParams: [],
    allDevices: [],
    allSetpoints:[],
    loading: false,
    error: null,
    mobile: false,
    deviceType: 'desktop' // 'desktop', 'tablet', 'phone'
  }),
 
  mutations: {
    SET_CONFIG(state, { name, config }) {
      state.configs[name] = config;
      console.log('[sortParams] - SET_CONFIG Обновлен конфиг[' + name + ']: ', config);
    },
    SET_ALL_ROOMS(state, rooms) {
      state.allRooms = rooms;
      //console.log('[sortParams] - SET_ALL_ROOMS Обновлен список доступных комнат: ', rooms);
    },
    SET_ALL_PARAMS(state, params) {
      state.allParams = params;
      //console.log('[sortParams] - SET_ALL_PARAMS Обновлен список доступных параметров: ', params);
    },
    SET_ALL_DEVICES(state, devices) {
      state.allDevices = devices;
      //console.log('[sortParams] - SET_ALL_DEVICES Обновлен список доступных устройств: ', devices);
    },
    SET_ALL_SETPOINTS(state, setpoints) {
      state.allSetpoints = setpoints;
      //console.log('[sortParams] - SET_ALL_SETPOINTS Обновлен список уставок: ', setpoints);
    },
    UPDATE_CONFIG_VALUE(state, { dID, room, type, name, value, timestamp }) {
      const config = state.configs[dID];
      if (!config) {
        console.warn(`[Config] - dID ${dID} не найден в конфигурации`);
        return;
      }

      const roomObj = config[room];
      if (!roomObj) {
        console.warn(`[Config] - Комната ${room} не найдена в конфигурации`);
        return;
      }

      // Автоматически создаём контейнер типа, если он отсутствует
      if (!roomObj[type]) {
        console.warn(`[Config] - Тип ${type} не найден в комнате ${room}, создаём...`);
        roomObj[type] = {};
      }

      // Автоматически создаём сенсор/уставку/элемент, если он отсутствует
      if (!roomObj[type][name]) {
        roomObj[type][name] = {};
      }

      roomObj[type][name].value = value;
      roomObj[type][name].lastUpdate = timestamp || new Date().toString();

      //console.log(`[Config] - Обновлено значение ${type}.${name} в комнате ${room}:`, roomObj[type][name]);
      // console.log(`[Config] - UPDATE_CONFIG_VALUE - state.configs[${dID}] ${JSON.stringify(config, null, 2)}`);
      // const updatedRoom = config[room];
      // console.log(`[Config] - UPDATE_CONFIG_VALUE - state.configs[${dID}] Обновляем комнату ${room} - ${JSON.stringify(updatedRoom, null, 2)}`);
    },

    SET_LOADING(state, value) {
      state.loading = value;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
    SET_MOBILE(state, value) {
      state.mobile = value;
    },
     SET_DEVICE_TYPE(state, deviceType) {
      state.deviceType = deviceType;
    },
  },
  
  actions: {

    async initialize({ dispatch, rootGetters, state }) {
      //console.groupCollapsed('[config] - initialize');
      dispatch('detectDevice'); 
      console.log('[config] - initialize - Начинаем Инициализацию конфига');

      const dID = rootGetters['dID'];
      //console.log('[config] - initialize - dID: ', dID);
      //console.log('[config] - initialize - state.configs[dID] до ensureConfig: ', state.configs[dID]);
      
      if (dID && !state.configs[dID]) {
        console.log('[config] - initialize - Конфиг для dID -', dID, ' не был загружен -',state.configs[dID], ' инициализируем' );

        await dispatch('ensureConfig', dID);

        //После ensureConfig проверяем, что конфиг действительно загружен
        if (state.configs[dID]) {
          //console.log('[config] - initialize - ensureConfig завершен', state.configs[dID]);
        } else {
          console.error('[config] - initialize - Конфиг не был загружен');
        }
      }
      await dispatch('ensureSortingKeys');

      console.log('[config] - initialize - Завершена инициализация');
    },

    detectDevice({commit}) {
      const mobile = /Mobi|Android/i.test(navigator.userAgent);
      console.log('[config] - detectDevice - Работаем с мобильным устройством - ', mobile);
      commit('SET_MOBILE', mobile);

      let deviceType = 'desktop';
      if (mobile) {
        // Проверяем на планшет
        if (navigator.userAgent.match(/Tablet|iPad/i) || 
            (window.innerWidth >= 1024 && window.innerHeight >= 900)) {
          deviceType = 'tablet';
        } else {
          deviceType = 'phone';
        }
      }
      commit('SET_DEVICE_TYPE', deviceType);
      console.log('[config] - initialize - Тип устройства - ', deviceType);
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
  
    async requestConfig({ dispatch, state }, dID) {
      //console.log('[config] - requestConfig - Формируем Запрос на Сервер для получение конфигурации по dID - ', dID);
      
      try {
        // 1. Отправляем запрос (не ждем ответа через возврат)
         dispatch('websocket/send', {
          type: 'get',
          request: 'config',
          name: dID
        }, { root: true }).then(() => {
          console.log('[config] - requestConfig - Запрос отправлен (then)');
        }).catch(error => {
          console.error('[config] - requestConfig - Ошибка отправки запроса:', error);
        });
        
        //console.log('[config] - requestConfig - Запрос отправлен, ждем появления конфига в state...');
        
        // 2. Ждем пока конфиг появится в state (максимум 10 секунд)
        const timeout = 10000;
        const startTime = Date.now();
        
        while (!state.configs[dID]) {
          // Проверяем не превышен ли таймаут
          if (Date.now() - startTime > timeout) {
            throw new Error(`Timeout: Конфиг для ${dID} не был получен за ${timeout}мс`);
          }
          // Ждем 100мс перед следующей проверкой
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('[config] - requestConfig - Конфиг появился в state:');
        return state.configs[dID];
        
      } catch (error) {
        console.error(`[Config] Ошибка запроса конфигурации ${dID}:`, error);
        throw error;
      }
    },

    async handleConfigResponse({ commit, dispatch }, response) {
      //console.log('[Config] - handleConfigResponse - Обработка ответа от Server - Конфигурация', response.payload);
      try {
        const dID = response.name;
        const config = response.payload;
        
        if (!dID || !config) {
          throw new Error('Невалидный ответ конфигурации');
        }
        //console.log('[Config] - handleConfigResponse - Обновляем Конфигурацию - ', dID);
        commit('SET_CONFIG', { name: dID, config });
        // Обновляем список комнат
        //console.log('[Config] - handleConfigResponse - Обновляем список комнат');
        await dispatch('handleRoomsSet', config);
      // Обновляем список параметров
      //console.log('[Config] - handleConfigResponse - Обновляем список параметров');
        await dispatch('handleParamsSet', config);
      // Обновляем список устройств
      //console.log('[Config] - handleConfigResponse - Обновляем список устройств');
      await dispatch('handleDevicesSet', config);
      // Обновляем уставки
      //console.log('[Config] - handleConfigResponse - Обновляем уставки');
      await dispatch('handleSetpointsSet', config);

        //console.log('[Config] - handleConfigResponse - Конфиг обновлен, данные для сортировки готовы');
        return 'success';
      } catch (error) {
        console.error('[Config] - handleConfigResponse - Ошибка обработки ответа:', error);
        throw error;
      }
    },




    handleRoomsSet({ commit }, config) {
      //console.log('[Config] - handleRoomsSet - Обновляем список комнат');
      try {
        const rooms = Object.keys(config).filter(key => {

          if (key === 'init') return false;
          const room = config[key];
          // Проверяем, есть ли в комнате любые устройства (не только сенсоры)
          const hasDevices = Object.keys(room).some(sectionKey => {
            const excludedSections = ['init', 'id', 'group', 'title', 'setpoints'];
            if (excludedSections.includes(sectionKey)) return false;
            
            // Если раздел существует и содержит устройства
            return room[sectionKey] && 
                  typeof room[sectionKey] === 'object' && 
                  Object.keys(room[sectionKey]).length > 0;
          });
          return hasDevices;
        });
        commit('SET_ALL_ROOMS', rooms);
        //console.log('[Config] - handleRoomsSet Обновлен список доступных комнат: ', rooms);
      } catch (error) {
        console.error('[Config] - handleRoomsSet - Ошибка обновления списка комнат:', error);
        throw error;
      }
    },
    handleParamsSet ({ commit }, config) {
      //console.log('[Config] - handleParamsSet - Обновляем список параметров');
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
      //console.log('[Config] - handleParamsSet Обновлен список доступных комнат rooms: ', params);
      } catch (error) {
        console.error('[Config] - handleParamsSet - Ошибка обновления списка параметров:', error);
        throw error;
      }
    },
    handleSetpointsSet ({ commit }, config) {
      //console.groupCollapsed('[Config] - handleSetpointsSet');
      //console.log('[Config] - handleSetpointsSet - Обновляем список параметров');
      try {
      const paramsSet = new Set();
      Object.values(config).forEach(room => {
        if (room.setpoints) {
          Object.keys(room.setpoints).forEach(k => {
            // Извлекаем префикс (часть до цифр)
            const prefix = k.replace(/\d+$/, '');
            paramsSet.add(prefix);
          });
        }
      });
      const params = Array.from(paramsSet);
      commit('SET_ALL_SETPOINTS', params);
      //console.log('[Config] - handleSetpointsSet Обновлен список доступных параметров params: ', params);
      } catch (error) {
        console.error('[Config] - handleSetpointsSet - Ошибка обновления списка параметров:', error);
        throw error;
      }
    },
    handleDevicesSet({ commit }, config) {
      //console.log('[Config] - handleDevicesSet - Обновляем список устройств');
      try {
        const devicesSet = new Set();
        
        // Исключаемые разделы (включая sensors и служебные)
        const excludedSections = ['id', 'group', 'title', 'setpoints', 'sensors'];
        
        // Проходим по всем комнатам, исключая init
        Object.entries(config).forEach(([roomKey, room]) => {
          // Исключаем комнату init
          if (roomKey === 'init') return;
          
          // Проходим по всем свойствам комнаты
          Object.keys(room).forEach(sectionKey => {
            // Пропускаем исключаемые разделы
            if (excludedSections.includes(sectionKey)) return;
            
            // Если это объект с устройствами (actuators, switchs, etc.)
            if (typeof room[sectionKey] === 'object' && room[sectionKey] !== null) {
              // Получаем все ключи устройств в этом разделе
              Object.keys(room[sectionKey]).forEach(deviceKey => {
                // Извлекаем префикс (часть до цифр) - аналогично handleParamsSet
                const prefix = deviceKey.replace(/\d+$/, '');
                if (prefix) {
                  devicesSet.add(prefix);
                }
              });
            }
          });
        });
        
        const devices = Array.from(devicesSet);
        commit('SET_ALL_DEVICES', devices);
        //console.log('[Config] - handleDevicesSet Обновлен список доступных устройств: ', devices);
      } catch (error) {
        console.error('[Config] - handleDevicesSet - Ошибка обновления списка устройств:', error);
        throw error;
      }
    },



    handleSensorUpdate({ commit }, { dID, payload, type }) {
      //console.log('[Config] - handleSensorUpdate - Параметры запроса:', { dID, payload, type });
      if (type === 'setpoints') {
        console.log(' ++++++++++++++++++++ [Config] - handleSensorUpdate - Параметры запроса:', { dID, payload, type });
      }

      try {
        const { room, item_name, item_value, time } = payload;
        if (!dID || !room || !item_name || item_value === undefined) return;

        const timestamp = time ? new Date(time).toString() : new Date().toString();


        commit('UPDATE_CONFIG_VALUE', {
          dID,
          room,
          type: type,
          name: item_name,
          value: item_value,
          timestamp
        });

      } catch (error) {
        console.error('[Config] Ошибка обработки данных сенсора:', error);
      }
    },

    async ensureConfig({ dispatch }, dID) {
      if (!dID) throw new Error('dID не определен');
      
      try {
        console.log('[config] - ensureConfig - Конфига нет, запрашиваем');
        const result = await dispatch('requestConfig', dID);
        //console.log('[config] - ensureConfig - Конфиг успешно загружен в state.configs');
        return result;
      } catch (error) {
        console.error('[config] - ensureConfig - Ошибка загрузки конфига:', error);
        throw error;
      }
    },
   
    async ensureSortingKeys({ state, dispatch, rootGetters }) {
      //console.groupCollapsed('[config] - ensureSortingKeys');
      //console.log('Проверяем наличие ключей сортировки');
      
      const processKey = async (type, stateArrayName, getterName, storageKey) => {
        const key = rootGetters[getterName] || localStorage.getItem(storageKey);
        const arrayItems = state[stateArrayName];
        
        // Проверка валидности ключа
        if (key && !arrayItems.includes(key)) {
          console.warn(`[config] - ensureSortingKeys - ${storageKey} невалиден, сбрасываем`);
          localStorage.removeItem(storageKey);
          return null;
        }
        
        // Установка первого элемента если ключа нет
        if (!key && arrayItems.length > 0) {
          const newKey = arrayItems[0];
          localStorage.setItem(storageKey, newKey);
          console.log(`[config] - Установлен первый ${type}:`, newKey);
          return newKey;
        }
        
        return key;
      };

      // Обработка всех типов ключей
      const keyConfigs = [
        { type: 'rooms', stateArray: 'allRooms', getter: 'roomKey', storage: 'roomKey', specialAction: 'updateRoomsTitle' },
        { type: 'params', stateArray: 'allParams', getter: 'paramKey', storage: 'paramKey' },
        { type: 'devices', stateArray: 'allDevices', getter: 'deviceKey', storage: 'deviceKey' },
        { type: 'setpoints', stateArray: 'allSetpoints', getter: 'setpointKey', storage: 'setpointKey' }
      ];

      for (const config of keyConfigs) {
        const key = await processKey(config.type, config.stateArray, config.getter, config.storage);
        
        if (key) {
          await dispatch('sortParams/updateSortKey', { 
            type: config.type, 
            newKey: key 
          }, { root: true });
          
          // Специальное действие для комнат
          if (config.specialAction) {
            await dispatch(`sortParams/${config.specialAction}`, key, { root: true });
          }
        }
      }
    },
      async updateSetpointServer( {rootGetters}, { roomKey, paramKey, value }) {
        console.log('[config] - updateSetpointServer - Готовим уставку для отправки на сервер');
        console.log('[config] - updateSetpointServer - Готовим уставку для отправки на сервер', paramKey);
        const dID = rootGetters.dID;
        if (!dID) throw new Error('dID не определен');
        console.log('[config] - updateSetpointServer - Готовим уставку для dID:', dID, 'Key', paramKey, 'Value', value);

        await this.dispatch('websocket/send', {
          type: 'post',
          request: 'setpoints',
          name: dID,
          payload: { room: roomKey, param: paramKey, value }
        }, { root: true });

        console.log('[config] - updateSetpointServer - Уставка обновлена и отправлена на сервер');
      },
    clearKey(context, { key }) { // гетер clearKeySync используем для внешней очистки
      const withoutPrefix = key.slice(1);
      const clearKey = withoutPrefix.replace(/\d+$/, '');
      console.log(`[config] - clearKey - key: ${clearKey}`);
      return clearKey;
    },
  },
  
  getters: {
    clearKeySync: () => (key) => {
      const withoutPrefix = key.slice(1);
      const clearKey = withoutPrefix.replace(/\d+$/, '');
      //console.log(`[config] - clearKeySync - key: ${clearKey}`);
      return clearKey;
    },
    getConfig: state => name => state.configs[name] || {},
    isLoading: state => state.loading,
    error: state => state.error,
    getCommonConfig: (state) => (dID) => state.configs[dID] || null,
    allRooms: state => state.allRooms,
    allParams: state => state.allParams,
    allDevices: state => state.allDevices,
    allSetpoints: state => state.allSetpoints,
    getMobile: state => state.mobile,
    getDeviceType: state => state.deviceType,


  }
};