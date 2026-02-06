// sortParams.js

import logger from './logger';
function getSensorTitle(key) {
  if (!key) return 'Неизвестный параметр';

  const baseKey = key.replace(/\d+$/, '');
  logger.dev(`[sortParams] - getSensorTitle - baseKey = ${baseKey}`);
  //console.log('[sortParams] - getSensorTitle - baseKey = ', baseKey);
  const mappings = {
    'dHum': 'Влажность',
    'dTemp': 'Температура',
    'dPress': 'Давление',
    'dPower': 'Потребление',
    'dMove': 'Движение',
    'dFire': 'Контроль возгорания',
    'dLeak': 'Контроль утечек',
    'aLamp': 'Освещение',
    'aFan': 'Вентиляция',
    'aPump': 'Насос',
    'aValve': 'Клапан',
    'aRelay': 'Реле',
    'dFrequency': 'Частота',
    'dVoltage': 'Напряжение',
    'dСurrent_a': 'Ток Фаза',
    'dСurrent_b': 'Ток Ноль',
    'dEnergy_a': 'Потребление Фаза',
    'dEnergy_b': 'Потребление Ноль',
    'dСurrent': 'Ток',
    'aActuator': 'Актуатор',
    'aSwitch': 'Переключатель',
    'aController': 'Контроллер',
    'dBat': 'Батарея',
    'sTemp': 'Уставка температуры',
    'sHum': 'Уставка влажности',
    'sActuator': 'Уставка актуатор',
    'dCurSetpoint': 'Уставка Термостата',
    };
  return mappings[baseKey] || key;
}
function getUnit(key) {
  if (!key) return '';

        if (key.includes('Temp')) return '°C';
        if (key.includes('Hum')) return '%';
        if (key.includes('Press')) return 'hPa';
        if (key.includes('Power')) return 'W';
        if (key.includes('Сurrent')) return 'A';
        if (key.includes('Bat')) return '%';
        if (key.includes('Voltage')) return 'V';
        if (key.includes('Frequency')) return 'Hz';
        if (key.includes('Energy')) return 'kWh';
        return '';
}


export default {
  namespaced: true,
    getters: {
    currentSortType: state => state.sortType,
    getDeviceKey: state => state.deviceKey,
    getDeviceTitle: state => state.deviceTitle,
    getRoomId: state => state.roomId,
    getRoomKey: state => state.roomKey,
    getRoomTitle: state => state.roomTitle,
    getParamKey: state => state.paramKey,
    getParamTitle: state => state.paramTitle,
    getSetpointKey: state => state.setpointKey,
    getSetpointTitle: state => state.setpointTitle,
    getSensorTitle: () => (key) => getSensorTitle(key),
    getUnit: () => (key) => getUnit(key),
    limHigh: state => state.limHigh,
    limLow: state => state.limLow,
    limStep: state => state.limStep,
  },
  state: () => ({
    sortType: 'rooms',
    roomId: 0,
    roomKey: localStorage.getItem('roomKey') ||  null, // ключ комнаты по которому выполняется сортировка
    paramKey: localStorage.getItem('paramKey') || null, // ключ параметра по которому выполняется сортировка
    roomTitle: '',
    paramTitle: '',
    deviceKey: localStorage.getItem('deviceKey') || null,
    deviceTitle: '',
    setpointKey: localStorage.getItem('setpointKey') || null,
    setpointTitle: '',
    limHigh: 32,
    limLow: 10,
    limStep: 1,
    forceUpdate: 0,
  }),

  mutations: {
    SET_SORT_TYPE(state, type) {
      if (['rooms', 'params', 'devices', 'setpoints'].includes(type)) {
        state.sortType = type;
        state.forceUpdate = Date.now();
      }
    },
    SET_ROOM_ID(state, id) {
      state.roomId = Number(id) || 0;
      state.forceUpdate = Date.now();
    },
    SET_PARAM_KEY(state, key) {
      if (typeof key === 'string' && state.paramKey !== key && key != null) {
        logger.dev(`[sortParams] MUTATION SET_PARAM_KEY: ${state.paramKey} -> ${key}`);
        //console.log(`[sortParams] MUTATION SET_PARAM_KEY: ${state.paramKey} -> ${key}`);
        state.paramKey = key;
        state.forceUpdate = Date.now();
      }
      logger.info(`[sortParams] - SET_PARAM_KEY - Ключ обновлен: ${key}`);
      //console.log('[sortParams] - SET_PARAM_KEY - Ключ обновлен', key);
    },
    SET_ROOM_KEY(state, key) {
      if (typeof key === 'string' && state.roomKey !== key && key != null) {
        logger.dev(`[sortParams] MUTATION SET_ROOM_KEY: ${state.roomKey} -> ${key}`);
        //console.log(`[sortParams] MUTATION SET_ROOM_KEY: ${state.roomKey} -> ${key}`);
        state.roomKey = key;
      }
      logger.info(`[sortParams] - SET_ROOM_KEY - Ключ обновлен: ${key}`);
      //console.log('[sortParams] - SET_ROOM_KEY - Ключ обновлен', key);
    },
    SET_DEVICE_KEY(state, key) {
      if (typeof key === 'string' && state.deviceKey !== key && key != null) {
        console.log(`[sortParams] MUTATION SET_DEVICE_KEY: ${state.deviceKey} -> ${key}`);
        state.deviceKey = key;
        state.forceUpdate = Date.now();
      }
    },
    SET_SETPOINT_KEY(state, key) {
      if (typeof key === 'string' && state.setpointKey !== key && key != null) {
        logger.dev(`[sortParams] MUTATION SET_SETPOINT_KEY: ${state.setpointKey} -> ${key}`);
        //console.log(`[sortParams] MUTATION SET_SETPOINT_KEY: ${state.setpointKey} -> ${key}`);
        state.setpointKey = key;
        state.forceUpdate = Date.now();
      }
    },
    SET_DEVICE_TITLE(state, title) {
      state.deviceTitle = title || '';
    },
    SET_SETPOINT_TITLE(state, title) {
      state.setpointTitle = title || '';
    },
    SET_ROOM_TITLE(state, title) {
      state.roomTitle = title || 'Главная комната';
    },
    SET_PARAM_TITLE(state, title) {
      state.paramTitle = title || 'Температура';
    },
    UPDATE_STATE(state, payload) {
      Object.keys(payload).forEach(key => {
        if (key in state) {
          state[key] = payload[key];
        }
      });
      console.log('[sortParams] - UPDATE_STATE Выполнено обновление состояния');
    },
    UPDATE_LIMITS(state, limits) {
      logger.info('[sortParams] - UPDATE_LIMITS ', limits);
      console.log('[sortParams] - UPDATE_LIMITS ', limits);
      if (limits.limHigh) state.limHigh = limits.limHigh;
      if (limits.limLow) state.limLow = limits.limLow;
      if (limits.limStep) state.limStep = limits.limStep;
      logger.dev('[sortParams] - UPDATE_LIMITS Обновлены лимиты', limits);
      //console.log('[sortParams] - UPDATE_LIMITS Выполнено обновление состояния лимитов');
    },
    SET_FORCE_UPDATE(state, timestamp) {
      logger.dev
      //console.log('[sortParams] - SET_FORCE_UPDATE Выполнено обновление состояния');
      state.forceUpdate = timestamp;
    },
  },
 
  actions: {
    updateSortKey({ commit, dispatch, state }, { type, newKey }) { //Обновленная функция для изменения ключа любого сортировки
      logger.dev(`[sortParams] - updateSortKey - Обновляем ключ для ${type}:`, newKey);
      //console.log(`[sortParams] - updateSortKey - Обновляем ключ для ${type}:`, newKey);
      
      // Проверка на валидность ключа
      if (!newKey) {
        logger.error(`[sortParams] - updateSortKey - Ключ для ${type} не определен:`, newKey);
        //console.warn(`[sortParams] - updateSortKey - Ключ для ${type} не определен:`, newKey);
        return;
      }

      // Проверка на изменение значения
      const currentKey = state[`${type}Key`];
      if (newKey === currentKey) {
        logger.dev(`[sortParams] - updateSortKey - Ключ ${type} не изменился:`, newKey);
        //console.log(`[sortParams] - updateSortKey - Ключ ${type} не изменился:`, newKey);
        return;
      }

      try {
        // Определяем мутации и действия для каждого типа
        const config = {
          rooms: {
            mutation: 'SET_ROOM_KEY',
            storageKey: 'roomKey',
            extraAction: 'updateRoomsTitle'
          },
          params: {
            mutation: 'SET_PARAM_KEY',
            storageKey: 'paramKey',
            extraMutation: 'SET_PARAM_TITLE',
            extraValue: this.getSensorTitle?.(newKey) // Используем опциональную цепочку
          },
          devices: {
            mutation: 'SET_DEVICE_KEY',
            storageKey: 'deviceKey'
          },
          setpoints: {
            mutation: 'SET_SETPOINT_KEY',
            storageKey: 'setpointKey'
          }
        };

        const typeConfig = config[type];
        if (!typeConfig) {
          logger.error(`[sortParams] - updateSortKey - Неизвестный тип: ${type}`);
          //console.error(`[sortParams] - updateSortKey - Неизвестный тип: ${type}`);
          return;
        }

        // Основная мутация
        commit(typeConfig.mutation, newKey);
        
        // Дополнительная мутация (для params)
        if (typeConfig.extraMutation && typeConfig.extraValue !== undefined) {
          commit(typeConfig.extraMutation, typeConfig.extraValue);
        }
        
        // Сохранение в localStorage
        localStorage.setItem(typeConfig.storageKey, newKey);
        
        // Дополнительное действие (для rooms)
        if (typeConfig.extraAction) {
          logger.dev(`[sortParams] - updateSortKey - Выполняем дополнительное действие: ${typeConfig.extraAction}`);
          //console.log(`[sortParams] - updateSortKey - Выполняем дополнительное действие: ${typeConfig.extraAction}`);
          dispatch(typeConfig.extraAction, newKey);
        }
        logger.info(`[sortParams] - updateSortKey - Ключ ${type} обновлен:`, newKey);
        //console.log(`[sortParams] - updateSortKey - Ключ ${type} обновлен:`, newKey);

      } catch (error) {
        logger.error(`[sortParams] - updateSortKey - Ошибка при обновлении ${type}:`, error);
        //console.error(`[sortParams] - updateSortKey - Ошибка при обновлении ${type}:`, error);
      }
    },
    updateRoomsTitle({ commit, rootGetters }, newRoomKey) {
      logger.dev(`[sortParams] - updateRoomsTitle`, newRoomKey);
      //console.log('[sortParams] - updateRoomsTitle', newRoomKey);
      if (!newRoomKey) {
        logger.error(`[sortParams] - updateRoomsTitle - Ключ не определен`, newRoomKey);  
        //console.log('[sortParams] - updateRoomsTitle - Ключ не определен - ', newRoomKey);
      }
      // Получаем данные комнаты из конфига
      const dID = rootGetters['dID'];
      const config = rootGetters['config/getConfig'](dID);
      const newRoom = config?.[newRoomKey] || {};

      commit('SET_ROOM_ID', newRoom?.id || 0);
      commit('SET_ROOM_TITLE', newRoom?.title || 'не определен');

      logger.dev(`[sortParams] - updateRoomsTitle - Ключ roomTitle обновлен`, newRoom?.title, 'новый roomID', newRoom?.id);
      //console.log('[sortParams] - updateRoomsTitle - Ключ roomTitle обновлен', newRoom?.title, 'новый roomID', newRoom?.id);
    },

    async setSortType({ commit, state }, type) {
      if (state.sortType === type) return;
      commit('SET_SORT_TYPE', type);
    },
    // setRoom({ commit }, room) {
    //   commit('UPDATE_STATE', {
    //     roomId: room.id,
    //     roomKey: room.key,
    //     roomTitle: room.title
    //   });
    // },
   
    // setParam({ commit }, param) {
    //   commit('UPDATE_STATE', {
    //     paramKey: param.key,
    //     paramTitle: param.title
    //   });
    // },

    setLimits({ rootGetters, commit, dispatch }, param) {
      logger.info(`[sortParams] - setLimits - Параметр -`, param);
      console.log('[sortParams] - setLimits - Параметр -', param);
      
      // Используем clearKey из модуля config для очистки параметра
      dispatch('config/clearKey', { key: param }, { root: true })
        .then(cleanedKey => {
          logger.dev(`[sortParams] - setLimits - Очищенный параметр -`, cleanedKey);
          //console.log('[sortParams] - setLimits - Очищенный параметр -', cleanedKey);
          
          // Получаем данные лимитов из конфига
          const dID = rootGetters['dID'];
          const config = rootGetters['config/getConfig'](dID);
          let limits = config?.init?.limits?.[cleanedKey] || config?.init?.limits?.Default;
          
          if (!limits) {
            logger.error(`[sortParams] - setLimits - Не удалось получить лимиты - Устанавливаем по умолчанию`);
            //console.log('[sortParams] - setLimits - Не удалось получить лимиты - Устанавливаем по умолчанию');
            limits = {
              low: 10,
              high: 32,
              step: 0.5
            };
          }
          logger.dev(`[sortParams] - setLimits Получены лимиты`, limits);
          //console.log('[sortParams] - setLimits Получены лимиты', limits);
          commit('UPDATE_LIMITS', {
            limHigh: limits.high,
            limLow: limits.low,
            limStep: limits.step
          });
        })
        .catch(error => {
          logger.error(`[sortParams] - setLimits - Ошибка при очистке параметра:`, error);
          //console.error('[sortParams] - setLimits - Ошибка при очистке параметра:', error);
          // В случае ошибки используем значения по умолчанию
          commit('UPDATE_LIMITS', {
            limHigh: 32,
            limLow: 10,
            limStep: 1
          });
        });
    },

    switchSortKey({ dispatch, state, rootGetters }, { sortingType, direction = 'prev' }) {
      logger.info(`[sortParams] - switchSortKey - Переключение ${direction} для [${sortingType}]`);
      //console.log(`[sortParams] - switchSortKey - Переключение ${direction} для [${sortingType}]`);

      const config = {
        rooms: {
          array: rootGetters['config/allRooms'] || [],
          currentKey: state.roomKey
        },
        params: {
          array: rootGetters['config/allParams'] || [],
          currentKey: state.paramKey
        },
        devices: {
          array: rootGetters['config/allDevices'] || [],
          currentKey: state.deviceKey
        },
        setpoints: {
          array: rootGetters['config/allSetpoints'] || [],
          currentKey: state.setpointKey
        }
      };

      const typeConfig = config[sortingType];
      if (!typeConfig) {
        logger.error(`[sortParams] - switchSortKey - Неизвестный тип сортировки: ${sortingType}`);
        //console.error(`[sortParams] - switchSortKey - Неизвестный тип сортировки: ${sortingType}`);
        return;
      }

      const { array, currentKey } = typeConfig;
      const key = currentKey || array[0];

      try {
        if (array.length === 0) {
          logger.error(`[sortParams] - switchSortKey - Массив для ${sortingType} пуст`);
          //console.warn(`[sortParams] - switchSortKey - Массив для ${sortingType} пуст`);
          return;
        }

        const currentIndex = array.indexOf(key);
        if (currentIndex === -1) {
          logger.error(`[sortParams] - switchSortKey - Ключ ${key} для типа ${sortingType} не найден`);
          //console.warn(`[sortParams] - switchSortKey - Ключ ${key} для типа ${sortingType} не найден`);
          return;
        }

        let newIndex;
        if (direction === 'next') {
          newIndex = (currentIndex + 1) % array.length;
        } else { // 'prev'
          newIndex = (currentIndex - 1 + array.length) % array.length;
        }

        const newKey = array[newIndex];
        dispatch('updateSortKey', { type: sortingType, newKey });
        logger.info(`[sortParams] - switchSortKey - Переключение (${direction}): ${key} -> ${newKey}`);
        //console.log(`[sortParams] - switchSortKey - Переключение (${direction}): ${key} -> ${newKey}`);

      } catch (error) {
        logger.error('[sortParams] - switchSortKey - Ошибка:', error);
        //console.error('[sortParams] - switchSortKey - Ошибка:', error);
      }
    },


  },
  

};