function getSensorTitle(key) {
  const baseKey = key.replace(/\d+/g, '');
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
export default {
  namespaced: true,
  state: () => ({
    sortType: 'rooms',
    roomId: 1,
    roomKey: 'room01',
    paramKey: 'Temp',
    roomTitle: 'Главная комната',
    paramTitle: 'Температура',
    allRooms: [],
    allParams: []
  }),
  
  mutations: {
    SET_ALL_ROOMS(state, rooms) {
      state.allRooms = rooms;
      console.log('[sortParams] - SET_ALL_ROOMS Обновлен список доступных комнат: ', rooms);
    },
    SET_ALL_PARAMS(state, params) {
      state.allParams = params;
      console.log('[sortParams] - SET_ALL_PARAMS Обновлен список доступных параметров: ', params);
    },
    SET_SORT_TYPE(state, type) {
      if (['rooms', 'params'].includes(type)) {
        state.sortType = type;
      }
    },
    
    SET_ROOM_ID(state, id) {
      state.roomId = Number(id) || 0;
    },
    
    SET_PARAM_KEY(state, key) {
      if (typeof key === 'string') {
        state.paramKey = key;
      }
    },
    
    SET_ROOM_KEY(state, key) {
      if (typeof key === 'string') {
        state.roomKey = key;
      }
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
    initSortParams({ commit }) {
      commit('UPDATE_STATE', {
        sortType: 'rooms',
        roomTitle: 'Главная комната',
        roomId: 0,
        roomKey: 'room01',
        paramKey: 'Temp',
        paramTitle: 'Температура',
        paramType: 'num',
      });
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
    updateNavigationData({ commit, rootGetters, state }) {
      const dID = rootGetters['dID'];
      const config = rootGetters['config/getConfig'](dID);
      if (!config) {
        console.warn('[sortParams]- updateNavigationData Конфигурация не найдена при обновлении навигации');
        return;
      }
      console.log('[sortParams] - updateNavigationData Конфигурация получена успешно', config);
      // Обновляем список комнат
      const rooms = Object.keys(config).filter(key => 
        config[key]?.sensors && Object.keys(config[key].sensors).length > 0
      );
      commit('SET_ALL_ROOMS', rooms);

      // Обновляем список параметров
      const paramsSet = new Set();
      Object.values(config).forEach(room => {
        if (room.sensors) {
          Object.keys(room.sensors).forEach(k => paramsSet.add(k));
        }
      });
      const allParams = Array.from(paramsSet);
      commit('SET_ALL_PARAMS', allParams);

            // Автокоррекция текущей комнаты если она стала невалидной
      if (state.roomKey && !rooms.includes(state.roomKey)) {
        const newRoomKey = rooms.length > 0 ? rooms[0] : '';
        console.warn(`[sortParams] Текущая комната ${state.roomKey} недоступна, устанавливаем ${newRoomKey}`);
        
        if (newRoomKey) {
          const newRoom = config[newRoomKey];
          commit('SET_ROOM_KEY', newRoomKey);
          commit('SET_ROOM_ID', newRoom?.id || 0);
          commit('SET_ROOM_TITLE', newRoom?.title || newRoomKey);
        }
      }

      // Автокоррекция текущего параметра если он стал невалидным
      if (state.paramKey && !allParams.includes(state.paramKey)) {
        const newParamKey = allParams.length > 0 ? allParams[0] : '';
        console.warn(`[sortParams] Текущий параметр ${state.paramKey} недоступен, устанавливаем ${newParamKey}`);
        
        if (newParamKey) {
          commit('SET_PARAM_KEY', newParamKey);
          commit('SET_PARAM_TITLE', getSensorTitle(newParamKey));
        }
      }
    },
    
    switchToPrevRoom({ commit, state, rootGetters}) {
      if (state.allRooms.length === 0) {
        console.warn('[sortParams] - switchToPrevRoom - Нет доступных комнат для переключения');
        return;
      }
      
      const currentIndex = state.allRooms.indexOf(state.roomKey);
      const newIndex = (currentIndex - 1 + state.allRooms.length) % state.allRooms.length;
      const newRoomKey = state.allRooms[newIndex];
      const dID = rootGetters['dID'];
      const config = rootGetters['config/getConfig'](dID);
      const newRoom = config[newRoomKey];
      
      console.log(`[sortParams]  - switchToPrevRoom - Переключение комнаты: ${state.roomKey} -> ${newRoomKey}`);
      
      commit('SET_ROOM_KEY', newRoomKey);
      commit('SET_ROOM_ID', newRoom?.id || 0);
      commit('SET_ROOM_TITLE', newRoom?.title || newRoomKey);
    },
    
switchToNextRoom({ commit, state, rootGetters }) {
      if (state.allRooms.length === 0) {
        console.warn('[sortParams] Нет доступных комнат для переключения');
        return;
      }
      
      const currentIndex = state.allRooms.indexOf(state.roomKey);
      const newIndex = (currentIndex + 1) % state.allRooms.length;
      const newRoomKey = state.allRooms[newIndex];
      const dID = rootGetters['dID'];
      const config = rootGetters['config/getConfig'](dID);
      const newRoom = config[newRoomKey];
      
      console.log(`[sortParams] Переключение комнаты: ${state.roomKey} -> ${newRoomKey}`);
      
      commit('SET_ROOM_KEY', newRoomKey);
      commit('SET_ROOM_ID', newRoom?.id || 0);
      commit('SET_ROOM_TITLE', newRoom?.title || newRoomKey);
    },
    
    switchToPrevParam({ commit, state }) {
      if (state.allParams.length === 0) {
        console.warn('[sortParams] Нет доступных параметров для переключения');
        return;
      }
      
      const currentIndex = state.allParams.indexOf(state.paramKey);
      const newIndex = (currentIndex - 1 + state.allParams.length) % state.allParams.length;
      const newParamKey = state.allParams[newIndex];
      
      console.log(`[sortParams] Переключение параметра: ${state.paramKey} -> ${newParamKey}`);
      
      commit('SET_PARAM_KEY', newParamKey);
      commit('SET_PARAM_TITLE', getSensorTitle(newParamKey));
    },
    
    switchToNextParam({ commit, state }) {
      if (state.allParams.length === 0) {
        console.warn('[sortParams] Нет доступных параметров для переключения');
        return;
      }
      
      const currentIndex = state.allParams.indexOf(state.paramKey);
      const newIndex = (currentIndex + 1) % state.allParams.length;
      const newParamKey = state.allParams[newIndex];
      
      console.log(`[sortParams] Переключение параметра: ${state.paramKey} -> ${newParamKey}`);
      
      commit('SET_PARAM_KEY', newParamKey);
      commit('SET_PARAM_TITLE', getSensorTitle(newParamKey));
    },
  },
  
  getters: {
    currentSortType: state => state.sortType,
    getRoomId: state => state.roomId,
    getRoomKey: state => state.roomKey,
    getRoomTitle: state => state.roomTitle,
    getParamKey: state => state.paramKey,
    getParamTitle: state => state.paramTitle,
  }
};