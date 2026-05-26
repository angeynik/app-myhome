// store/modules/config.js
import logger from './logger';
import { nowMoscow } from '@/utils/timeUtils';

export default {
  namespaced: true,
  state: () => ({
    configs: {}, // Для хранения кофигурации по dID
    schedules: {}, // Для хранения расписаний по dID
    notifications: {}, // Для хранения уведомлений по dID
    statistics: {}, // Для хранения аналитики по dID
    allRooms: [],
    allParams: [],
    allDevices: [],
    allSetpoints:[],
    loading: false,
    error: null,
    mobile: false,
    deviceType: 'desktop', // 'desktop', 'tablet', 'phone'
    typeSettingsKey: localStorage.getItem('typeSettingsKey') || 'schedule',
  }),
 
  mutations: {
    SET_CONFIG(state, { name, config }) {
      state.configs[name] = config;
      logger.dev('[sortParams] - SET_CONFIG Обновлен конфиг[' + name + ']: ', config);
      //console.log('[sortParams] - SET_CONFIG Обновлен конфиг[' + name + ']: ', config);
    },
    SET_SCHEDULE(state, { name, config }) {
      //console.log('[config] - SET_SCHEDULE - name:', name, 'config keys:', Object.keys(config));
      state.schedules[name] = config;
      logger.dev('[sortParams] - SET_SCHEDULE Обновлен конфиг[' + name + ']: ', config);
      // Вернуть console.log
      //console.log('[sortParams] - SET_SCHEDULE Обновлен конфиг[' + name + ']: ', config);
    },
    REMOVE_SCHEDULES(state, { dID, roomKey, paramKey, scheduleIds }) {
      console.log('[config] - REMOVE_SCHEDULES - Удаляем расписания:', { dID, roomKey, paramKey, scheduleIds });
      
      if (!state.schedules[dID] || !state.schedules[dID][roomKey] || !state.schedules[dID][roomKey][paramKey]) {
        console.warn('[config] - REMOVE_SCHEDULES - Структура данных не найдена');
        return;
      }
      
      // Фильтруем расписания
      state.schedules[dID][roomKey][paramKey] = state.schedules[dID][roomKey][paramKey].filter(schedule => {
        const scheduleId = schedule.id || schedule._id || (schedule._tempId ? `temp_${schedule._tempId}` : null);
        return !scheduleIds.includes(scheduleId);
      });
      
      console.log('[config] - REMOVE_SCHEDULES - Расписания удалены');
      
      // Сохраняем в localStorage
      localStorage.setItem(`${dID}_schedules`, JSON.stringify(state.schedules[dID]));
    },



    SET_NOTIFICATION(state, { name, config }) {
      state.notifications[name] = config;
      logger.dev('[sortParams] - SET_NOTIFICATION Обновлен конфиг[' + name + ']: ', config);
      // Вернуть console.log
      //console.log('[sortParams] - SET_NOTIFICATION Обновлен конфиг[' + name + ']: ', config);
    },

    SET_STATISTIC(state, { name, config }) {
      state.statistics[name] = config;
      logger.dev('[sortParams] - SET_STATISTIC Обновлен конфиг[' + name + ']: ', config);
      // Вернуть console.log
      //console.log('[sortParams] - SET_STATISTIC Обновлен конфиг[' + name + ']: ', config);
    },



    SET_ALL_ROOMS(state, rooms) {
      state.allRooms = rooms;
      logger.dev('[sortParams] - SET_ALL_ROOMS Обновлен список доступных комнат: ', rooms);
      //console.log('[sortParams] - SET_ALL_ROOMS Обновлен список доступных комнат: ', rooms);
    },
    SET_ALL_PARAMS(state, params) {
      state.allParams = params;
      logger.dev('[sortParams] - SET_ALL_PARAMS Обновлен список доступных параметров: ', params);
      //console.log('[sortParams] - SET_ALL_PARAMS Обновлен список доступных параметров: ', params);
    },
    SET_ALL_DEVICES(state, devices) {
      state.allDevices = devices;
      logger.dev('[sortParams] - SET_ALL_DEVICES Обновлен список доступных устройств: ', devices);
      //console.log('[sortParams] - SET_ALL_DEVICES Обновлен список доступных устройств: ', devices);
    },
    SET_ALL_SETPOINTS(state, setpoints) {
      state.allSetpoints = setpoints;
      logger.dev('[sortParams] - SET_ALL_SETPOINTS Обновлен список уставок: ', setpoints);
      //console.log('[sortParams] - SET_ALL_SETPOINTS Обновлен список уставок: ', setpoints);
    },


    UPDATE_CONFIG_VALUE(state, { dID, room, type, name, value }) {
      const config = state.configs[dID];
      logger.dev('[config] - UPDATE_CONFIG_VALUE - Обновляем значение конфига:', { dID, room, type, name, value });
      //console.log('[config] - UPDATE_CONFIG_VALUE - Обновляем значение конфига:', { dID, room, type, name, value });
      //console.log('[config] - UPDATE_CONFIG_VALUE - Конфиг:', config);
      if (!config) {
        logger.error(`[Config] - dID ${dID} не найден в конфигурации`);
        console.warn(`[Config] - dID ${dID} не найден в конфигурации`);
        return;
      }

      const roomObj = config[room];
      //console.log('[config] - UPDATE_CONFIG_VALUE - Комната:', roomObj);
      if (!roomObj) {
        logger.error(`[Config] - Комната ${room} не найдена в конфигурации`);
        console.warn(`[Config] - Комната ${room} не найдена в конфигурации`);
        return;
      }

      // Автоматически создаём контейнер типа, если он отсутствует
      if (!roomObj[type]) {
        logger.error(`[Config] - Тип ${type} не найден в комнате ${room}, создаём...`);
        console.warn(`[Config] - Тип ${type} не найден в комнате ${room}, создаём...`);
        roomObj[type] = {};
      }

      // Автоматически создаём сенсор/уставку/элемент, если он отсутствует
      if (!roomObj[type][name]) {
        console.warn(`[Config] - "Элемент" ${name} не найден в комнате ${room}, создаём...`);
        roomObj[type][name] = {};
      }

      roomObj[type][name].value = value;
      roomObj[type][name].lastUpdate = nowMoscow();
      logger.dev(`[Config] - Обновлено значение ${type}.${name} в комнате ${room}:`, roomObj[type][name]);
      logger.dev(`[Config] - UPDATE_CONFIG_VALUE - state.configs[${dID}] ${JSON.stringify(config, null, 2)}`);
      console.log(`[Config] - Обновлено значение ${type}.${name} в комнате ${room}:`, roomObj[type][name]);
      // console.log(`[Config] - UPDATE_CONFIG_VALUE - state.configs[${dID}] ${JSON.stringify(config, null, 2)}`);
      // const updatedRoom = config[room];
      // console.log(`[Config] - UPDATE_CONFIG_VALUE - state.configs[${dID}] Обновляем комнату ${room} - ${JSON.stringify(updatedRoom, null, 2)}`);
    },
    UPDATE_SCHEDULE_VALUE(state, { dID, room, param, config, id, title, value }) {
      logger.dev('[config] - UPDATE_SCHEDULE_VALUE - Обновляем расписание:', { dID, room, param, config, id, title, value });
      //console.log('[config] - UPDATE_SCHEDULE_VALUE - Обновляем расписание:', { dID, room, param, config, id, title, value });
      
      if (!state.schedules[dID]) {
        logger.error(`[Config] - schedules для dID ${dID} не найден`);
        return;
      }
      //console.log('[config] - UPDATE_SCHEDULE_VALUE - Найдена конфигурация ',config,':', state.schedules[dID]);

      // Ищем расписание по id в массиве
      if (state.schedules[dID][room] && state.schedules[dID][room][param]) {
        const schedules = state.schedules[dID][room][param];
        const index = schedules.findIndex(s => (s.id || s._id) === id);
        //console.log('[config] - UPDATE_SCHEDULE_VALUE - Найдено расписание :', index);
        
        if (index !== -1) {
          // Обновляем существующее расписание
          state.schedules[dID][room][param][index] = {
            ...schedules[index],
            [title]: value,
            updatedAt: nowMoscow()
          };
          logger.dev('[config] - UPDATE_SCHEDULE_VALUE - Расписание обновлено');
          console.log('[config] - UPDATE_SCHEDULE_VALUE - Расписание обновлено', state.schedules[dID][room][param][index] );
        } 
      } 

    },
    UPDATE_NOTIFICATION_VALUE(state, { dID, room, param, id, title, value }) {
      console.log('[config] - UPDATE_NOTIFICATION_VALUE - Обновляем уведомление:', { dID, room, param, id, title, value });
      if (!state.notifications[dID]) return;
      if (state.notifications[dID][room] && state.notifications[dID][room][param]) {
        const notifications = state.notifications[dID][room][param];
        const index = notifications.findIndex(n => n.id === id);
        if (index !== -1) {
          state.notifications[dID][room][param][index] = {
            ...notifications[index],
            [title]: value,
            updatedAt: nowMoscow()
          };
        }
      }
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
    SET_TYPE_SETTINGS_ITEM(state, type) {
      //console.log(`[Config] - SET_TYPE_SETTINGS_ITEM - type: ${type}`);
      localStorage.setItem('typeSettingsKey', type);
      state.typeSettingsKey = type;
    },
    UPDATE_CONFIGDATA_LOCALLY(state, { dID, configName, configData }) {
      console.log('[config] - UPDATE_CONFIGDATA_LOCALLY - dID:', dID, configName,' keys:', Object.keys(configData));
      state[configName][dID] = configData;
    },
  },
  
  actions: {
    async initialize({ dispatch, rootGetters, state }) {
      dispatch('detectDevice'); 
      logger.dev('[config] - initialize - Начинаем Инициализацию конфига - state.configs: ', state.configs);
      //console.log('[config] - initialize - Начинаем Инициализацию конфига');

      const dID = rootGetters['dID'];
      logger.dev('[config] - initialize - dID: ', dID);
      //console.log('[config] - initialize - dID: ', dID);
      //console.log('[config] - initialize - state.configs[dID] до ensureConfig: ', state.configs[dID]);
      
      if (dID && !state.configs[dID]) {
        logger.dev('[config] - initialize - Конфиг для dID -', dID, ' не был загружен -',state.configs[dID], ' инициализируем');
        //console.log('[config] - initialize - Конфиг для dID -', dID, ' не был загружен -',state.configs[dID], ' инициализируем' );

        await dispatch('ensureConfig', dID);

        //После ensureConfig проверяем, что конфиг действительно загружен
        if (state.configs[dID]) {
          logger.dev('[config] - initialize - ensureConfig завершен', state.configs[dID]);
          //console.log('[config] - initialize - ensureConfig завершен', state.configs[dID]);
        } else {
          logger.error('[config] - initialize - Конфиг не был загружен');
          //console.error('[config] - initialize - Конфиг не был загружен');
        }
      }
      await dispatch('ensureSortingKeys');
      logger.dev('[config] - initialize - Завершена инициализация');
      //console.log('[config] - initialize - Завершена инициализация');
    },

    detectDevice({commit}) {
      const mobile = /Mobi|Android/i.test(navigator.userAgent);
      logger.info('[config] - detectDevice - Работаем с мобильным устройством - ', mobile);
      //console.log('[config] - detectDevice - Работаем с мобильным устройством - ', mobile);
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
      logger.info('[config] - initialize - Тип устройства - ', deviceType);
      //console.log('[config] - initialize - Тип устройства - ', deviceType);
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
          logger.dev('[config] - requestConfig - Запрос отправлен (then)');
          //console.log('[config] - requestConfig - Запрос отправлен (then)');
        }).catch(error => {
          logger.error('[config] - requestConfig - Ошибка отправки запроса:', error);
          //console.error('[config] - requestConfig - Ошибка отправки запроса:', error);
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
        logger.info('[config] - requestConfig - Конфиг появился в state:');
        //console.log('[config] - requestConfig - Конфиг появился в state:');
        return state.configs[dID];
        
      } catch (error) {
        logger.error(`[Config] Ошибка запроса конфигурации ${dID}:`, error);
        //console.error(`[Config] Ошибка запроса конфигурации ${dID}:`, error);
        throw error;
      }
    },

    async handleConfigResponse({ commit, dispatch }, response) {
      logger.dev('[Config] - handleConfigResponse - Обработка ответа от Server - Конфигурация', response.payload);
      //console.log('[Config] - handleConfigResponse - Обработка ответа от Server - Конфигурация', response.payload);
      try {
        const dID = response.name;
        const config = response.payload;
        const type = response.request;
        
        if (!dID || !config) {
          throw new Error('Невалидный ответ конфигурации');
        }

        if (type === 'config') {
          logger.info('[Config] - handleConfigResponse - Обновляем Конфигурацию - ', dID);
          //console.log('[Config] - handleConfigResponse - Обновляем Конфигурацию - ', dID);
          commit('SET_CONFIG', { name: dID, config });
          // Обновляем список комнат
          logger.info('[Config] - handleConfigResponse - Обновляем список комнат');
          //console.log('[Config] - handleConfigResponse - Обновляем список комнат');
          await dispatch('handleRoomsSet', config);
          // Обновляем список параметров
          logger.info('[Config] - handleConfigResponse - Обновляем список параметров');
          //console.log('[Config] - handleConfigResponse - Обновляем список параметров');
            await dispatch('handleParamsSet', config);
          // Обновляем список устройств
          logger.info('[Config] - handleConfigResponse - Обновляем список устройств');
          //console.log('[Config] - handleConfigResponse - Обновляем список устройств');
          await dispatch('handleDevicesSet', config);
          // Обновляем уставки
          logger.info('[Config] - handleConfigResponse - Обновляем уставки');
          //console.log('[Config] - handleConfigResponse - Обновляем уставки');
          await dispatch('handleSetpointsSet', config);
          logger.info('[Config] - handleConfigResponse - Конфиг обновлен, данные для сортировки готовы');
          //console.log('[Config] - handleConfigResponse - Конфиг обновлен, данные для сортировки готовы');
          return 'success';
        } else if (type === 'schedules') {
          //console.log('[WebSocket] Получаем Конфигурацию Расписания от сервера');
          commit('SET_SCHEDULE', { name: dID, config });
        } else if (type === 'statistics') {
          //console.log('[WebSocket] Получаем Конфигурацию Аналитики от сервера');
          commit('SET_STATISTIC', { name: dID, config });
        } else if (type === 'notifications') {
          //console.log('[WebSocket] Получаем Конфигурацию Уведомлений от сервера');
          commit('SET_NOTIFICATION', { name: dID, config });
        }



      } catch (error) {
        logger.error('[Config] - handleConfigResponse - Ошибка обработки ответа:', error);
        //console.error('[Config] - handleConfigResponse - Ошибка обработки ответа:', error);
        throw error;
      }
    },

    updateScheduleLocally({ commit }, { dID, configName, configData }) {
      console.log('[config] - updateScheduleLocally - dID:', dID, 'configName-', configName, 'configData: ', configData);
      commit('UPDATE_CONFIGDATA_LOCALLY', { dID, configName, configData });
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
        logger.dev('[Config] - handleRoomsSet Обновлен список доступных комнат: ', rooms);
        //console.log('[Config] - handleRoomsSet Обновлен список доступных комнат: ', rooms);
      } catch (error) {
        logger.error('[Config] - handleRoomsSet - Ошибка обновления списка комнат:', error);
        //console.error('[Config] - handleRoomsSet - Ошибка обновления списка комнат:', error);
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
      logger.dev('[Config] - handleParamsSet Обновлен список доступных комнат rooms: ', params);
      //console.log('[Config] - handleParamsSet Обновлен список доступных комнат rooms: ', params);
      } catch (error) {
        logger.error('[Config] - handleParamsSet - Ошибка обновления списка параметров:', error);
        //console.error('[Config] - handleParamsSet - Ошибка обновления списка параметров:', error);
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
      logger.dev('[Config] - handleSetpointsSet Обновлен список доступных параметров params: ', params);
      //console.log('[Config] - handleSetpointsSet Обновлен список доступных параметров params: ', params);
      } catch (error) {
        logger.error('[Config] - handleSetpointsSet - Ошибка обновления списка параметров:', error);
        //console.error('[Config] - handleSetpointsSet - Ошибка обновления списка параметров:', error);
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
        logger.dev('[Config] - handleDevicesSet Обновлен список доступных устройств: ', devices);
        //console.log('[Config] - handleDevicesSet Обновлен список доступных устройств: ', devices);
      } catch (error) {
        logger.error('[Config] - handleDevicesSet - Ошибка обновления списка устройств:', error);
        //console.error('[Config] - handleDevicesSet - Ошибка обновления списка устройств:', error);
        throw error;
      }
    },



    handleValueUpdate({ commit, rootGetters}, { dID, payload, type }) {
      logger.info('[Config] - handleValueUpdate - Параметры запроса:', { dID, payload, type });
      console.log('[Config] - handleValueUpdate - Параметры запроса:', { dID, payload, type });

      const settingsData = rootGetters.getSetpointsManager?.settingsData;
      //console.log('[Config] - handleValueUpdate - Текущие settingsData:', settingsData);
      if (!dID || !payload || !type || !settingsData) {
        logger.error('[Config] - handleValueUpdate - Невалидные параметры запроса:', { dID, payload, type, settingsData });
        console.error('[Config] - handleValueUpdate - Невалидные параметры запроса:', { dID, payload, type, settingsData });
        return;
      }

      // const { room, param, value, time } = payload;
      //console.log('[Config] - handleValueUpdate - Параметры запроса:', { dID, room, param, value, time });
      // if (!dID || !room || !param || value === undefined) return;
      

      
      if (type === 'setpoints') {
        try {
          commit('UPDATE_CONFIG_VALUE', {
            dID: dID || settingsData.name,
            room: payload?.room || settingsData.payload.room,
            type: type,
            name: payload?.param || settingsData.payload.setKey,
            value: payload?.value || settingsData.payload.value,
          });

        } catch (error) {
          logger.error('[Config] Ошибка обработки данных сенсора:', error);
          //console.error('[Config] Ошибка обработки данных сенсора:', error);
        }

      }
      if (type === 'schedules') {
        console.log('[Config] - handleSensorUpdate - выполняем ОБНОВЛЕНИЕ локальной конфигурации Расписания', payload);
        try {
          commit('UPDATE_SCHEDULE_VALUE', {
            dID: settingsData.name,
            room: settingsData.payload.room,
            param: settingsData.payload.param,
            config: settingsData.payload.config,
            id: settingsData.payload.id,
            title: settingsData.payload.value_name,
            value: settingsData.payload.value,
          });
        } catch (error) {
          logger.error('[Config] Ошибка обработки данных расписания:', error);
          console.error('[Config] Ошибка обработки данных расписания:', error);
        }
      }
      if (type === 'notifications') {
       console.log('[Config] - handleValueUpdate - обновление уведомления', payload);
        commit('UPDATE_NOTIFICATION_VALUE', {
          dID: settingsData.name,
          room: settingsData.payload.room,
          param: settingsData.payload.param,
          id: settingsData.payload.id,
          title: settingsData.payload.value_name,
          value: settingsData.payload.value,
        });
      }
      if (type === 'statistics') {
        console.log(' ~~~~~~~~~~~~~~~~~~~  [Config] - handleSensorUpdate - Необходимо написать логику ОБНОВЛЕНИЯ локальной конфигурации АНАЛИТИКИ');
      }


    },

    async ensureConfig({ dispatch }, dID) {
      if (!dID) throw new Error('dID не определен');
      
      try {
        logger.info('[config] - ensureConfig - Конфига нет, запрашиваем');
        //console.log('[config] - ensureConfig - Конфига нет, запрашиваем');
        const result = await dispatch('requestConfig', dID);
        logger.info('[config] - ensureConfig - Конфиг успешно загружен в state.configs');
        //console.log('[config] - ensureConfig - Конфиг успешно загружен в state.configs');
        return result;
      } catch (error) {
        logger.error('[config] - ensureConfig - Ошибка загрузки конфига:', error);
        //console.error('[config] - ensureConfig - Ошибка загрузки конфига:', error);
        throw error;
      }
    },
 
    async ensureSortingKeys({ state, dispatch, rootGetters }) {
      //console.groupCollapsed('[config] - ensureSortingKeys');
      logger.dev('Проверяем наличие ключей сортировки');
      //console.log('Проверяем наличие ключей сортировки');
      
      const processKey = async (type, stateArrayName, getterName, storageKey) => {
        const key = rootGetters[getterName] || localStorage.getItem(storageKey);
        const arrayItems = state[stateArrayName];
        
        // Проверка валидности ключа
        if (key && !arrayItems.includes(key)) {
          logger.error(`[config] - ensureSortingKeys - ${storageKey} невалиден, сбрасываем`, key, arrayItems);
          //console.warn(`[config] - ensureSortingKeys - ${storageKey} невалиден, сбрасываем`);
          localStorage.removeItem(storageKey);
          return null;
        }
        
        // Установка первого элемента если ключа нет
        if (!key && arrayItems.length > 0) {
          const newKey = arrayItems[0];
          localStorage.setItem(storageKey, newKey);
          logger.dev(`[config] - Установлен первый ${type}:`, newKey);
          //console.log(`[config] - Установлен первый ${type}:`, newKey);
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
    async updateSetpointServer( {rootGetters}) {
      const settingsData = rootGetters['getSetpointsManager']?.settingsData;
        logger.info('[config] - updateSetpointServer - Готовим уставку для отправки на сервер');
        console.log('[config] - updateSetpointServer - Готовим уставку для отправки на сервер', settingsData);
        const dID = rootGetters.dID;

        if (!dID) throw new Error('dID не определен');

        await this.dispatch('websocket/send', {
          type: 'post',
          request: settingsData.request,
          name: settingsData.name,
          payload: settingsData.payload
        }, { root: true });
        logger.info('[config] - updateSetpointServer - Уставка обновлена и отправлена на сервер');
        //console.log('[config] - updateSetpointServer - Уставка обновлена и отправлена на сервер');
    },
    clearKey(context, { key }) { // гетер clearKeySync используем для внешней очистки
      //console.log('[config] - clearKey - key: ', key);
      const withoutPrefix = key.slice(1);
      const clearKey = withoutPrefix.replace(/\d+$/, '');
      logger.dev(`[config] - clearKey - key: ${clearKey}`);
      //console.log(`[config] - clearKey - key: ${clearKey}`);
      return clearKey;
    },
  },
 
  getters: {
    clearKeySync: () => (key) => {
      //console.log(`[config] - clearKeySync - key: ${key}`);

      const withoutPrefix = key.slice(1);
      //console.log(`[config] - clearKeySync - withoutPrefix: ${withoutPrefix}`);

      const clearKey = withoutPrefix.replace(/\d+$/, '');
      logger.dev(`[config] - clearKeySync - key: ${clearKey}`);
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
    getTypeSettingsItem: (state) => state.typeSettingsKey

  }
};