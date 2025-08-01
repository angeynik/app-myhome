export default {
  namespaced: true,
  state: () => ({
    sortType: 'rooms',
    roomId: 1,
    roomKey: 'room01',
    paramKey: 'Temp',
    roomTitle: 'Главная комната',
    paramTitle: 'Температура'
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
      console.log('[sortParams] SET_PARAM_TITLE:', title); // Добавим лог
      state.paramTitle = title || 'Температура';
    },
    
    UPDATE_STATE(state, payload) {
      Object.keys(payload).forEach(key => {
        if (key in state) {
          state[key] = payload[key];
        }
      });
    }
  },
  
  actions: {
    initSortParams({ commit }) {
      commit('UPDATE_STATE', {
        sortType: 'rooms',
        roomId: 0,
        roomKey: 'room01',
        paramKey: 'Temp',
        roomTitle: 'Главная комната',
        paramTitle: 'Температура'
      });
    },
    
    resetDefaults({ commit }) {
      commit('UPDATE_STATE', {
        sortType: 'rooms',
        roomId: 0,
        roomKey: 'room01',
        paramKey: 'Temp',
        roomTitle: 'Главная комната',
        paramTitle: 'Температура'
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
    
    toggleSortType({ commit, state }) {
      const newType = state.sortType === 'rooms' ? 'params' : 'rooms';
      commit('SET_SORT_TYPE', newType);
    }
  },
  
  getters: {
    currentSortType: state => state.sortType,
    getRoomId: state => state.roomId,
    getRoomKey: state => state.roomKey,
    getRoomTitle: state => state.roomTitle,
    getParamKey: state => state.paramKey,
    getParamTitle: state => state.paramTitle,
    
    // Комплексные геттеры
    currentRoom: state => ({
      id: state.roomId,
      key: state.roomKey,
      title: state.roomTitle
    }),
    
    currentParam: state => ({
      key: state.paramKey,
      title: state.paramTitle
    })
  }
};