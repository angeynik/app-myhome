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
    roomKey: null, // ключ комнаты по которому выполняется сортировка
    paramKey: null, // ключ параметра по которому выполняется сортировка
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
        state.paramKey = key;
      }
      console.log('[sortParams] - SET_PARAM_KEY - Ключ обновлен', key);
    },
    
    SET_ROOM_KEY(state, key) {
      if (typeof key === 'string' && state.roomKey !== key && key != null) {
        state.roomKey = key;
      }
      console.log('[sortParams] - SET_ROOM_KEY - Ключ обновлен', key);
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
    updateRoomsKey({ commit }, newRoomKey) {
      console.log('[sortParams] - updateRoomsKey - Обновляем ключ для сортировки комнат');
      if (newRoomKey != null) {
        commit('SET_ROOM_KEY', newRoomKey);
        console.log('[sortParams] - updateParamsKey - Ключ обновлен', newRoomKey);
      }
      console.log('[sortParams] - updateParamsKey - Ключ не определен', newRoomKey);
    },
    updateParamsKey({ commit }, newParamKey) {
      console.log('[sortParams] - updateParamsKey - Обновляем ключ для сортировки параметров', newParamKey);
      if (newParamKey != null) {
        commit('SET_PARAM_KEY', newParamKey);
        console.log('[sortParams] - updateParamsKey - Ключ обновлен', newParamKey);
      }
      console.log('[sortParams] - updateParamsKey - Ключ не определен', newParamKey);
    },
    async setSortType({ commit, state }, type) {
      if (state.sortType === type) return;
      
      commit('SET_SORT_TYPE', type);
      // await dispatch('updateNavigationData');
      
      // // Автовыбор первого элемента
      // if (type === 'rooms' && state.allRooms.length > 0 && !state.roomKey) {
      //   const firstRoom = state.allRooms[0];
      //   commit('SET_ROOM_KEY', firstRoom);
      //   // Дополнительно обновляем title и id если нужно
      // }
      
      // if (type === 'params' && state.allParams.length > 0 && !state.paramKey) {
      //   const firstParam = state.allParams[0];
      //   commit('SET_PARAM_KEY', firstParam);
      //   commit('SET_PARAM_TITLE', getSensorTitle(firstParam));
      // }
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
    // async updateNavigationData({ commit, rootState, rootGetters, state, dispatch }) {
    //   console.warn('[sortParams]- updateNavigationData Начинаем обновление');
    //   try {
    //     const dID = rootGetters['dID'];
    //     const config = rootGetters['config/getConfig'](dID);
    //     if (!config) {
    //       console.warn('[sortParams]- updateNavigationData Конфигурация не найдена при обновлении навигации');
    //       console.log('[sortParams]- updateNavigationData Выполняем запрос в config - requestConfig для получения конфигурации, dID - ',dID);
    //       await dispatch('config/requestConfig', dID, { root: true });
    //       return;
    //     }
    //     console.log('[sortParams] - updateNavigationData Конфигурация получена успешно', config);
      
    //   // Автокоррекция текущего параметра
    //   const allParams = rootState.config.allParams || [];
    //   if (state.paramKey && !allParams.some(prefix => state.paramKey.startsWith(prefix))) {
    //     console.warn(`[sortParams] Параметр ${state.paramKey} не найден, ищем замену`);
        
    //     const newParam = allParams.length > 0 ? allParams[0] : '';
    //     let fullKey = '';
        
    //     if (newParam) {
    //       Object.values(config).some(room => {
    //         if (room.sensors) {
    //           const key = Object.keys(room.sensors).find(k => k.startsWith(newParam));
    //           if (key) {
    //             fullKey = key;
    //             return true;
    //           }
    //         }
    //         return false;
    //       });
    //     }
        
    //     if (fullKey) {
    //       console.log(`[sortParams] Заменяем параметр на ${fullKey}`);
    //       commit('SET_PARAM_KEY', fullKey);
    //       commit('SET_PARAM_TITLE', getSensorTitle(newParam));
    //       localStorage.setItem('paramKey', fullKey);
    //     }
    //   }






    //   // if (state.paramKey && !config.some(prefix => state.paramKey.startsWith(prefix))) {
    //   //   const newParam = config.length > 0 ? config[0] : '';
    //   //   if (newParam) {
    //   //     // Находим первый сенсор с таким префиксом для установки полного ключа
    //   //     let fullKey = '';
    //   //     Object.values(config).some(room => {
    //   //       if (room.sensors) {
    //   //         const key = Object.keys(room.sensors).find(k => k.startsWith(newParam));
    //   //         if (key) {
    //   //           fullKey = key;
    //   //           return true;
    //   //         }
    //   //       }
    //   //       return false;
    //   //     });
          
    //   //     if (fullKey) {
    //   //       commit('SET_PARAM_KEY', fullKey);
    //   //       commit('SET_PARAM_TITLE', getSensorTitle(newParam));
    //   //     }
    //   //   }
    //   // }
    //   // Автокоррекция текущей комнаты
    //   } catch (error) {
    //     console.error('[sortParams] Ошибка обновления навигации:', error);
    //     throw error;
    //   }

    // },



  switchToPrevRoom({ commit, state, rootGetters }) {
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
      console.log('[sortParams] - switchToPrevRoom - ПcurrentRoomKey', currentRoomKey, ' currentIndex-', currentIndex);
      if (currentIndex === -1) {
        console.warn(`[sortParams] - switchToPrevRoom - Комната ${currentRoomKey} не найдена`);
        return;
      }

      const newIndex = (currentIndex - 1 + allRooms.length) % allRooms.length;
      const newRoomKey = allRooms[newIndex];

      // Получаем данные комнаты из конфига
      const dID = rootGetters['dID'];
      const config = rootGetters['config/getConfig'](dID);
      const newRoom = config?.[newRoomKey] || {};

      console.log(`[sortParams] - switchToPrevRoom - Переключение: ${currentRoomKey} -> ${newRoomKey}`);

      commit('SET_ROOM_KEY', newRoomKey);
      commit('SET_ROOM_ID', newRoom?.id || 0);
      commit('SET_ROOM_TITLE', newRoom?.title || newRoomKey);
      localStorage.setItem('roomKey', newRoomKey);
    } catch (error) {
      console.error('[sortParams] - switchToPrevRoom - Ошибка:', error);
    }
  },

  switchToNextRoom({ commit, state, rootGetters }) {
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

      // Получаем данные комнаты из конфига
      const dID = rootGetters['dID'];
      const config = rootGetters['config/getConfig'](dID);
      const newRoom = config?.[newRoomKey] || {};

      console.log(`[sortParams] - switchToNextRoom - Переключение: ${currentRoomKey} -> ${newRoomKey}`);

      commit('SET_ROOM_KEY', newRoomKey);
      commit('SET_ROOM_ID', newRoom?.id || 0);
      commit('SET_ROOM_TITLE', newRoom?.title || newRoomKey);
      localStorage.setItem('roomKey', newRoomKey);
    } catch (error) {
      console.error('[sortParams] - switchToNextRoom - Ошибка:', error);
    }
  },

  switchToPrevParam({ commit, state, rootGetters }) {
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

      console.log(`[sortParams] - switchToPrevParam - Переключение: ${currentParamKey} -> ${newParamKey}`);

      commit('SET_PARAM_KEY', newParamKey);
      commit('SET_PARAM_TITLE', getSensorTitle(newParamKey));
      localStorage.setItem('paramKey', newParamKey);
    } catch (error) {
      console.error('[sortParams] - switchToPrevParam - Ошибка:', error);
    }
  },

  switchToNextParam({ commit, state, rootGetters }) {
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

      console.log(`[sortParams] - switchToNextParam - Переключение: ${currentParamKey} -> ${newParamKey}`);

      commit('SET_PARAM_KEY', newParamKey);
      commit('SET_PARAM_TITLE', getSensorTitle(newParamKey));
      localStorage.setItem('paramKey', newParamKey);
    } catch (error) {
      console.error('[sortParams] - switchToNextParam - Ошибка:', error);
    }
  },



    

    // switchToPrevRoom({ commit, state, rootGetters}) {
    //   if (state.allRooms.length === 0) {
    //     console.warn('[sortParams] - switchToPrevRoom - Массив комнат пуст');
    //     return;
    //   }
    //  // roomKey - ключ комнаты по которому выполняется сортировка
    //   //const currentIndex = state.allRooms.indexOf(state.roomKey);
    //   const currentIndex = state.roomKey;
    //   const allRooms = rootGetters['config/allRooms'] || [];
    //   console.log('[sortParams] - switchToPrevRoom - currentIndex - ', currentIndex);
    //   console.log('[sortParams] - switchToPrevRoom - allRooms - ', allRooms);
    //   if (allRooms.length === 0) {
    //     console.warn('[sortParams] - switchToPrevRoom - Массив комнат пуст');
    //     return;
    //   }
    //   const newRoomKey = (currentIndex - 1 + allRooms.length) % allRooms.length;
    //   console.log('[sortParams] - switchToPrevRoom - newIndex - ', newRoomKey);

    //   // const newRoomKey = state.allRooms[newIndex];
    //   // const dID = rootGetters['dID'];
    //   // const config = rootGetters['config/getConfig'](dID);
    //   // const newRoom = config[newRoomKey];
      
    //   console.log(`[sortParams]  - switchToPrevRoom - Переключение комнаты: ${currentIndex} -> ${newRoomKey}`);
      
    //   commit('SET_ROOM_KEY', newRoomKey);
    //   commit('SET_ROOM_ID', newRoomKey?.id || 0);
    //   commit('SET_ROOM_TITLE', newRoomKey?.title || newRoomKey);
    //   localStorage.setItem('roomKey', newRoomKey);
    // },
    
    
    // switchToNextRoom({ commit, state, rootGetters }) {
    //   if (state.allRooms.length === 0) {
    //     console.warn('[sortParams] Нет доступных комнат для переключения');
    //     return;
    //   }
      
    //   const currentIndex = state.allRooms.indexOf(state.roomKey);
    //   const newIndex = (currentIndex + 1) % state.allRooms.length;
    //   const newRoomKey = state.allRooms[newIndex];
    //   const dID = rootGetters['dID'];
    //   const config = rootGetters['config/getConfig'](dID);
    //   const newRoom = config[newRoomKey];
      
    //   console.log(`[sortParams] Переключение комнаты: ${state.roomKey} -> ${newRoomKey}`);
      
    //   commit('SET_ROOM_KEY', newRoomKey);
    //   commit('SET_ROOM_ID', newRoom?.id || 0);
    //   commit('SET_ROOM_TITLE', newRoom?.title || newRoomKey);
    //   localStorage.setItem('roomKey', newRoomKey);
    // },
    
    // switchToPrevParam({ commit, state }) {
    //   if (state.allParams.length === 0) {
    //     console.warn('[sortParams] Нет доступных параметров для переключения');
    //     return;
    //   }
      
    //   const currentIndex = state.allParams.indexOf(state.paramKey);
    //   const newIndex = (currentIndex - 1 + state.allParams.length) % state.allParams.length;
    //   const newParamKey = state.allParams[newIndex];
      
    //   console.log(`[sortParams] Переключение параметра: ${state.paramKey} -> ${newParamKey}`);
      
    //   commit('SET_PARAM_KEY', newParamKey);
    //   commit('SET_PARAM_TITLE', getSensorTitle(newParamKey));
    //   localStorage.setItem('paramKey', newParamKey);
    // },
    
    // switchToNextParam({ commit, state }) {
    //   if (state.allParams.length === 0) {
    //     console.warn('[sortParams] Нет доступных параметров для переключения');
    //     return;
    //   }
      
    //   const currentIndex = state.allParams.indexOf(state.paramKey);
    //   const newIndex = (currentIndex + 1) % state.allParams.length;
    //   const newParamKey = state.allParams[newIndex];
      
    //   console.log(`[sortParams] Переключение параметра: ${state.paramKey} -> ${newParamKey}`);
      
    //   commit('SET_PARAM_KEY', newParamKey);
    //   commit('SET_PARAM_TITLE', getSensorTitle(newParamKey));
    //   localStorage.setItem('paramKey', newParamKey);
    // },
  },
  

};