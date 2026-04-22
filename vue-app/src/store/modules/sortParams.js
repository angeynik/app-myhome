// sortParams.js

import logger from './logger';
import store from '@/store';
import { mapActions } from 'vuex';
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
    getDeviceKey: (state, getters, rootState) => rootState.deviceKey,
    getRoomKey: (state, getters, rootState) => rootState.roomKey,
    getParamKey: (state, getters, rootState) => rootState.paramKey,
    getSetpointKey: (state, getters, rootState) => rootState.setpointKey,

    currentSortType: state => state.sortType,
    getDeviceTitle: state => state.deviceTitle,
    getRoomId: state => state.roomId,
    getRoomTitle: state => state.roomTitle,
    getParamTitle: state => state.paramTitle,
    getSetpointTitle: state => state.setpointTitle,
    getSensorTitle: () => (key) => getSensorTitle(key),
    getUnit: () => (key) => getUnit(key),
  },
  state: () => ({
    sortType: 'rooms',
    roomId: 0,
    roomTitle: '',
    paramTitle: '',
    deviceTitle: '',
    setpointTitle: '',
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
      //console.log('[sortParams] - UPDATE_LIMITS ', limits);
      if (limits.limHigh) state.limHigh = limits.limHigh;
      if (limits.limLow !== undefined) state.limLow = limits.limLow;
      if (limits.limStep) state.limStep = limits.limStep;
      logger.dev('[sortParams] - UPDATE_LIMITS Обновлены лимиты', limits);
      //console.log('[sortParams] - UPDATE_LIMITS Выполнено обновление состояния лимитов', state.limHigh, state.limLow, state.limStep);
    },
    SET_FORCE_UPDATE(state, timestamp) {
      logger.dev
      //console.log('[sortParams] - SET_FORCE_UPDATE Выполнено обновление состояния');
      state.forceUpdate = timestamp;
    },
  },
 
  actions: {
  ...mapActions(['updateSettingsData', 'updatePayloadData', 'updateLimitsData', 'updateViewData']),
  updateSortKey({ commit, dispatch}, { type, newKey }) {
    //console.groupCollapsed('[sortParams] - updateSortKey');
    logger.dev(`[sortParams] - updateSortKey - Обновляем ключ для ${type}:`, newKey);
    //console.log(`[sortParams] - updateSortKey - Обновляем ключ для ${type}:`, newKey);
    
    // Проверка на валидность ключа
    if (!newKey) {
      logger.error(`[sortParams] - updateSortKey - Ключ для ${type} не определен:`, newKey);
      return;
    }

    try {
      // Обработка в зависимости от типа
      switch (type) {
        case 'rooms': {
          // Обновляем ключ комнаты
          commit('SET_ROOM_KEY', newKey, { root: true });
          localStorage.setItem('roomKey', newKey);
          //console.log(`[sortParams] - updateSortKey - Сохраняем в localStorage: roomKey:${newKey}`);
          
          // Выполняем дополнительное действие для комнат
          logger.dev(`[sortParams] - updateSortKey - Выполняем дополнительное действие: updateRoomsTitle : ${newKey}`);
          //console.log(`[sortParams] - updateSortKey - Выполняем дополнительное действие: updateRoomsTitle : ${newKey}`);
          dispatch('updateRoomsTitle', newKey);
          break;
        }

        case 'params': {
          const cleanKey = newKey.replace(/\d+$/, '');
          //console.log(`[sortParams] - updateSortKey - cleanKey: ${cleanKey}`);
          // Обновляем ключ параметра
          commit('SET_PARAM_KEY', cleanKey, { root: true });
          
          // Обновляем заголовок параметра
          const paramTitle = getSensorTitle(cleanKey);
          if (paramTitle !== undefined) {
            commit('SET_PARAM_TITLE', paramTitle);
          }
          break;
        }

        case 'devices': {
          // Обновляем ключ устройства
          commit('SET_DEVICE_KEY', newKey, { root: true });
          localStorage.setItem('deviceKey', newKey);
          //console.log(`[sortParams] - updateSortKey - Сохраняем в localStorage: deviceKey:${newKey}`);
          break;
        }

        case 'setpoints': {
          // Обновляем ключ уставки
          commit('SET_SETPOINT_KEY', newKey, { root: true });
          localStorage.setItem('setpointKey', newKey);
          //console.log(`[sortParams] - updateSortKey - Сохраняем в localStorage: setpointKey:${newKey}`);
          break;
        }

        default:
          logger.error(`[sortParams] - updateSortKey - Неизвестный тип: ${type}`);
          console.error(`[sortParams] - updateSortKey - Неизвестный тип: ${type}`);
          return;
      }
      commit('SET_FORCE_UPDATE', Date.now());
      logger.info(`[sortParams] - updateSortKey - Ключ ${type} обновлен:`, newKey);
      //console.log(`[sortParams] - updateSortKey - Ключ ${type} обновлен:`, newKey);

    } catch (error) {
      logger.error(`[sortParams] - updateSortKey - Ошибка при обновлении ${type}:`, error);
    }
    //console.groupEnd();
  },
    updateRoomsTitle({ commit, rootGetters }, newRoomKey) {
      //console.groupCollapsed('[sortParams] - updateRoomsTitle');
      logger.dev(`[sortParams] - updateRoomsTitle`, newRoomKey);
      //console.log('[sortParams] - updateRoomsTitle', newRoomKey);
      if (!newRoomKey) {
        logger.error(`[sortParams] - updateRoomsTitle - Ключ не определен`, newRoomKey);  
        console.log('[sortParams] - updateRoomsTitle - Ключ не определен - ', newRoomKey);
      }
      // Получаем данные комнаты из конфига
      const dID = rootGetters['dID'];
      const config = rootGetters['config/getConfig'](dID);
      const newRoom = config?.[newRoomKey] || {};
      //console.log('[sortParams] - updateRoomsTitle - для комнаты', newRoomKey ,' Получен конфиг', JSON.stringify(config?.[newRoomKey], null, 2));

      commit('SET_ROOM_ID', newRoom?.id || 0);
      commit('SET_ROOM_TITLE', newRoom?.title || 'не определен');

      logger.dev(`[sortParams] - updateRoomsTitle - Ключ roomTitle обновлен`, newRoom?.title, 'новый roomID', newRoom?.id);
      //console.log('[sortParams] - updateRoomsTitle - Ключ roomTitle обновлен', newRoom?.title, 'новый roomID', newRoom?.id);
      //console.groupEnd('[sortParams] - updateRoomsTitle');
    },

    async setSortType({ commit, state }, type) {
      if (state.sortType === type) return;
      commit('SET_SORT_TYPE', type);
    },


    setLimits({ rootGetters, dispatch, commit }, params) {
      console.log('[sortParams] - setLimits - Начало, params:', params);
      logger.info(`[sortParams] - setLimits - Параметр -`, params);

      const { param, valueType } = params;
      console.log('[sortParams] - setLimits - param:', param, 'valueType:', valueType);

      let limits = null;
      try {
        const dID = rootGetters['dID'];
          const config = rootGetters['config/getConfig'](dID);
          //console.log('[sortParams] - setLimits - Получен конфиг', JSON.stringify(config?.init?.limits, null, 2));
          console.log('[sortParams] - setLimits - Получен конфиг для параметра - ', param, 'valueType:', valueType);
          limits = config?.init?.limits?.[param] || config?.init?.limits?.Default;
          console.log('[sortParams] - setLimits - Получены лимиты', limits);
          if (!limits) {
            logger.error(`[sortParams] - setLimits - Не удалось получить лимиты - Устанавливаем по умолчанию`);
            //console.log('[sortParams] - setLimits - Не удалось получить лимиты - Устанавливаем по умолчанию');
            limits = {
              low: 4,
              high: 40,
              step: 0.5
            };
          }
          
      } catch (error) {
          logger.error(`[sortParams] - setLimits - Ошибка при виборе лимитов:`, error);
          //console.error('[sortParams] - setLimits - Ошибка при виборе лимитов:', error);
      }
      if (valueType === 'deviation') { // Задаем лимиты для диапазона значений отклонения Уставки
        console.log('[sortParams] - setLimits - valueType deviation, пересчитываем лимиты для отклонения от уставки valueType:', valueType);
            const { high, step } = limits;
            limits = {
              low: -(Math.round(high/4)),
              high: Math.round(high/4),
              step: step/10,
            };
            console.log('[sortParams] - setLimits - valueType deviation, пересчитанные лимиты для отклонения от уставки:', limits);
      }

      logger.dev(`[sortParams] - setLimits Получены лимиты`, limits);
      //console.log('[sortParams] - setLimits Получены лимиты', limits);
      //console.log('[sortParams] - setLimits - Dispatch updateLimitsData:', { limHigh: limits.high, limLow: limits.low, limStep: limits.step });
      dispatch('updateLimitsData', {
        limHigh: limits.high,
        limLow: limits.low,
        limStep: limits.step
      }, { root: true });
      const settingsDataLimits = store.state.setpointsManager?.settingsData.limits;
        logger.info('[sortParams] - setLimits - Обновили Limits в settingsData:', settingsDataLimits);
        //console.log('[sortParams] - setLimits - Обновили Limits в settingsData:', settingsDataLimits);

      commit('UPDATE_LIMITS', {
            limHigh: limits.high,
            limLow: limits.low,
            limStep: limits.step
      });
      //console.groupEnd();

    },

    switchSortKey({ dispatch, rootGetters }, { sortingType, direction = 'prev' }) {
      console.groupCollapsed(`[sortParams] - switchSortKey`);
      logger.info(`[sortParams] - switchSortKey - Переключение ${direction} для [${sortingType}]`);
      console.log(`[sortParams] - switchSortKey - Переключение ${direction} для [${sortingType}]`);

       const keyMap = {
          rooms: 'roomKey',
          params: 'paramKey',
          devices: 'deviceKey',
          setpoints: 'setpointKey'
        };

        // Получаем правильное имя геттера
        const getterName = keyMap[sortingType];
        const currentKey = rootGetters[getterName];
       console.log(`[sortParams] - switchSortKey - Текущий ключ: ${currentKey}`);

      const config = {
        rooms: {
          array: rootGetters['config/allRooms'] || [],
          currentKey: currentKey
        },
        params: {
          array: rootGetters['config/allParams'] || [],
          currentKey: currentKey
        },
        devices: {
          array: rootGetters['config/allDevices'] || [],
          currentKey: currentKey
        },
        setpoints: {
          array: rootGetters['config/allSetpoints'] || [],
          currentKey: currentKey
        }
      };

      const typeConfig = config[sortingType];
      if (!typeConfig) {
        logger.error(`[sortParams] - switchSortKey - Неизвестный тип сортировки: ${sortingType}`);
        console.error(`[sortParams] - switchSortKey - Неизвестный тип сортировки: ${sortingType}`);
        return;
      }

      const { array, currentKey:key } = typeConfig;
      const effectiveKey = key || array[0];

      try {
        if (array.length === 0) {
          logger.error(`[sortParams] - switchSortKey - Массив для ${sortingType} пуст`);
          console.warn(`[sortParams] - switchSortKey - Массив для ${sortingType} пуст`);
          return;
        }

        const currentIndex = array.indexOf(effectiveKey);
        if (currentIndex === -1) {
          logger.error(`[sortParams] - switchSortKey - Ключ ${effectiveKey} для типа ${sortingType} не найден`);
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
        console.log(` --- 459 ---  [sortParams] - switchSortKey - Новый ключ: ${newKey} Тип сортировки: ${sortingType}`);
        dispatch('updateSortKey', { type: sortingType, newKey });
        logger.info(`[sortParams] - switchSortKey - Переключение (${direction}): ${key} -> ${newKey}`);
        console.log(`[sortParams] - switchSortKey - Переключение (${direction}): ${key} -> ${newKey}`);

        // this.updateSettingsData({ room: newKey });
        // console.log('[sortParams] - switchSortKey - Переключение Комната в settingsData:',
        // this.$store.state.setpointsManager?.settingsData?.payload?.room
        // );

      } catch (error) {
        logger.error('[sortParams] - switchSortKey - Ошибка:', error);
        //console.error('[sortParams] - switchSortKey - Ошибка:', error);
      }
      console.groupEnd();
    },


  },
  

};