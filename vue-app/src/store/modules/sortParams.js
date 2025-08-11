// sortParams.js
function getSensorTitle(key) {
  if (!key) return 'Неизвестный параметр';

  const baseKey = key.replace(/\d+$/, '');
  //console.log('[sortParams] - getSensorTitle - baseKey = ', baseKey);
  const mappings = {
    'dHum': 'Влажность',
    'dTemp': 'Температура',
    'dPress': 'Давление',
    'dPower': 'Потребление',
    'dMove': 'Движение',
    'dFire': 'Контроль возгорания',
    'dLeak': 'Контроль утечек',
  };
  return mappings[baseKey] || key;
}
function getUnit(key) {
  if (!key) return '';

        if (key.includes('Temp')) return '°C';
        if (key.includes('Hum')) return '%';
        if (key.includes('Press')) return 'hPa';
        if (key.includes('Power')) return 'W';
        return '';
}


export default {
  namespaced: true,
    getters: {
    currentSortType: state => state.sortType,
    getRoomId: state => state.roomId,
    getRoomKey: state => state.roomKey,
    getRoomTitle: state => state.roomTitle,
    getParamKey: state => state.paramKey,
    getParamTitle: state => state.paramTitle,
    getSensorTitle: () => (key) => getSensorTitle(key),
    getUnit: () => (key) => getUnit(key),
  },
  state: () => ({
    sortType: 'rooms',
    roomId: 0,
    roomKey: localStorage.getItem('roomKey') ||  null, // ключ комнаты по которому выполняется сортировка
    paramKey: localStorage.getItem('paramKey') || null, // ключ параметра по которому выполняется сортировка
    roomTitle: 'Не выбрано',
    paramTitle: 'Не выбрано',
  }),

  mutations: {
    SET_SORT_TYPE(state, type) {
      if (['rooms', 'params'].includes(type)) {
        state.sortType = type;
      }
    },
    
    SET_ROOM_ID(state, id) {
      state.roomId = Number(id) || 0;
    },
    
    SET_PARAM_KEY(state, key) {
      if (typeof key === 'string' && state.paramKey !== key && key != null) {
        console.log(`[sortParams] MUTATION SET_PARAM_KEY: ${state.paramKey} -> ${key}`);
        state.paramKey = key;
      }
      //console.log('[sortParams] - SET_PARAM_KEY - Ключ обновлен', key);
    },
    
    SET_ROOM_KEY(state, key) {
      if (typeof key === 'string' && state.roomKey !== key && key != null) {
        console.log(`[sortParams] MUTATION SET_ROOM_KEY: ${state.roomKey} -> ${key}`);
        state.roomKey = key;
      }
      //console.log('[sortParams] - SET_ROOM_KEY - Ключ обновлен', key);
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
    }
  },
  
  actions: {
    updateRoomsKey({ commit, dispatch }, newRoomKey) {
      //console.log('[sortParams] - updateRoomsKey - Обновляем ключ для сортировки комнат');
      if (!newRoomKey || newRoomKey === this.state.roomKey) {
        console.log('[sortParams] - updateRoomsKey - Ключ не определен', newRoomKey)
      }
        commit('SET_ROOM_KEY', newRoomKey);
        localStorage.setItem('roomKey', newRoomKey);
        dispatch ('updateRoomsTitle', newRoomKey);
        //console.log('[sortParams] - updateRoomsKey - Ключ обновлен', newRoomKey);
    },
    updateRoomsTitle({ commit, rootGetters }, newRoomKey) {
      console.log('[sortParams] - updateRoomsTitle', newRoomKey);
      if (!newRoomKey) {
        console.log('[sortParams] - updateRoomsTitle - Ключ не определен - ', newRoomKey);
      }
      // Получаем данные комнаты из конфига
      const dID = rootGetters['dID'];
      const config = rootGetters['config/getConfig'](dID);
      const newRoom = config?.[newRoomKey] || {};

      commit('SET_ROOM_ID', newRoom?.id || 0);
      commit('SET_ROOM_TITLE', newRoom?.title || 'не определен');
      console.log('[sortParams] - updateRoomsTitle - Ключ roomTitle обновлен', newRoom?.title, 'новый roomID', newRoom?.id);
    },
    updateParamsKey({ commit }, newParamKey) {
      //console.log('[sortParams] - updateParamsKey - Обновляем ключ для сортировки параметров', newParamKey);
      if (!newParamKey) {
        console.log('[sortParams] - updateParamsKey - Ключ не определен', newParamKey);
      }
      commit('SET_PARAM_KEY', newParamKey);
      commit('SET_PARAM_TITLE', getSensorTitle(newParamKey));
      //localStorage.setItem('paramKey', JSON.stringify(newParamKey));
      localStorage.setItem('paramKey', newParamKey);
        //console.log('[sortParams] - updateParamsKey - Ключ обновлен', newParamKey);
    },
    async setSortType({ commit, state }, type) {
      if (state.sortType === type) return;
      commit('SET_SORT_TYPE', type);
    },
    setRoom({ commit }, room) {
      commit('UPDATE_STATE', {
        roomId: room.id,
        roomKey: room.key,
        roomTitle: room.title
      });
    },
    
    setParam({ commit }, param) {
      commit('UPDATE_STATE', {
        paramKey: param.key,
        paramTitle: param.title
      });
    },
  switchToPrevRoom({ dispatch, state, rootGetters }) {
    console.log('[sortParams] - switchToPrevRoom - Предыдущая комната');
  try {
      const allRooms = rootGetters['config/allRooms'] || [];
      console.log('[sortParams] - switchToPrevRoom - allRooms - ', allRooms);
      if (allRooms.length === 0) {
        console.warn('[sortParams] - switchToPrevRoom - Нет доступных комнат');
        return;
      }

      const currentRoomKey = state.roomKey || allRooms[0];
      const currentIndex = allRooms.indexOf(currentRoomKey);
      //console.log('[sortParams] - switchToPrevRoom - Актуальные RoomKey', currentRoomKey, ' currentIndex-', currentIndex);
      if (currentIndex === -1) {
        console.warn(`[sortParams] - switchToPrevRoom - Комната ${currentRoomKey} не найдена`);
        return;
      }

      const newIndex = (currentIndex - 1 + allRooms.length) % allRooms.length;
      const newRoomKey = allRooms[newIndex];
      dispatch ('updateRoomsKey', newRoomKey);
      //console.log('[sortParams] - switchToPrevRoom - Обновленные RoomKey', newRoomKey, ' currentIndex-', newIndex);

      console.log(`[sortParams] - switchToPrevRoom - Переключение: ${currentRoomKey} -> ${newRoomKey}`);
    } catch (error) {
      console.error('[sortParams] - switchToPrevRoom - Ошибка:', error);
    }
  },
  switchToNextRoom({ dispatch, state, rootGetters }) {
    console.log('[sortParams] - switchToNextRoom - Следующая комната');
    try {
      const allRooms = rootGetters['config/allRooms'] || [];
      if (allRooms.length === 0) {
        console.warn('[sortParams] - switchToNextRoom - Нет доступных комнат');
        return;
      }

      const currentRoomKey = state.roomKey || allRooms[0];
      const currentIndex = allRooms.indexOf(currentRoomKey);
      if (currentIndex === -1) {
        console.warn(`[sortParams] - switchToNextRoom - Комната ${currentRoomKey} не найдена`);
        return;
      }

      const newIndex = (currentIndex + 1) % allRooms.length;
      const newRoomKey = allRooms[newIndex];
      dispatch ('updateRoomsKey', newRoomKey);

      console.log(`[sortParams] - switchToNextRoom - Переключение: ${currentRoomKey} -> ${newRoomKey}`);
    } catch (error) {
      console.error('[sortParams] - switchToNextRoom - Ошибка:', error);
    }
  },
  switchToPrevParam({ dispatch, state, rootGetters }) {
    console.log('[sortParams] - switchToPrevParam - Предыдущий параметр');
    try {
      const allParams = rootGetters['config/allParams'] || [];
      if (allParams.length === 0) {
        console.warn('[sortParams] - switchToPrevParam - Нет доступных параметров');
        return;
      }

      const currentParamKey = state.paramKey || allParams[0];
      const currentIndex = allParams.indexOf(currentParamKey);
      console.log(`[sortParams] - switchToPrevParam - Переключение: ${currentParamKey} -> ${currentIndex}`);
      if (currentIndex === -1) {
        console.warn(`[sortParams] - switchToPrevParam - Параметр ${currentParamKey} не найден`);
        return;
      }

      const newIndex = (currentIndex - 1 + allParams.length) % allParams.length;
      const newParamKey = allParams[newIndex];
      dispatch ('updateParamsKey', newParamKey);

      console.log(`[sortParams] - switchToPrevParam - Переключение: ${currentParamKey} -> ${newParamKey}`);
    } catch (error) {
      console.error('[sortParams] - switchToPrevParam - Ошибка:', error);
    }
  },
  switchToNextParam({ dispatch, state, rootGetters }) {
    console.log('[sortParams] - switchToNextParam - Следующий параметр');
    try {
      const allParams = rootGetters['config/allParams'] || [];
      if (allParams.length === 0) {
        console.warn('[sortParams] - switchToNextParam - Нет доступных параметров');
        return;
      }

      const currentParamKey = state.paramKey || allParams[0];
      const currentIndex = allParams.indexOf(currentParamKey);
      if (currentIndex === -1) {
        console.warn(`[sortParams] - switchToNextParam - Параметр ${currentParamKey} не найден`);
        return;
      }
      const newIndex = (currentIndex + 1) % allParams.length;
      const newParamKey = allParams[newIndex];
      dispatch ('updateParamsKey', newParamKey);
      console.log(`[sortParams] - switchToNextParam - Переключение: ${currentParamKey} -> ${newParamKey}`);
    } catch (error) {
      console.error('[sortParams] - switchToNextParam - Ошибка:', error);
    }
  },

  },
  

};