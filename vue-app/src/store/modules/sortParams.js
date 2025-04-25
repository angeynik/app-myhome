export default {
  namespaced: true,
  state: {
    sortType: localStorage.getItem('sortType'),
    room_id: Number(localStorage.getItem('room_id')) || 1,
    param_key: localStorage.getItem('param_key') || 'Temp',
    room_key: localStorage.getItem('room_key') || 'room01',
    room_title: localStorage.getItem('room_title') || 'Главная комната',
    param_title: localStorage.getItem('param_title') || 'Температура'
  },
  mutations: {
    SET_SORT_TYPE(state, type) {
      if (['rooms', 'params'].includes(type)) {
        state.sortType = type
        localStorage.setItem('sortType', type)
      } else {
        console.error('Некорректный тип сортировки:', type)
        state.sortType = 'rooms'
        localStorage.setItem('sortType', 'rooms')
      }
    },
    SET_ROOM_ID(state, id) {
      const numericId = Number(id)
      if (!isNaN(numericId)) {
        state.room_id = numericId
        localStorage.setItem('room_id', numericId)
      } else {
        console.error('Некорректный ID комнаты:', id)
        state.room_id = 1
        localStorage.setItem('room_id', 1)
      }
    },
    SET_PARAM_KEY(state, key) {
      if (typeof key === 'string' && key.length) {
        state.param_key = key
        localStorage.setItem('param_key', key)
      } else {
        console.error('Некорректный ключ параметра:', key)
        state.param_key = 'Temp'
        localStorage.setItem('param_key', 'Temp')
      }
    },
    SET_ROOM_KEY(state, key) {
      if (typeof key === 'string' && key.startsWith('room')) {
        state.room_key = key
        localStorage.setItem('room_key', key)
      } else {
        console.error('Некорректный ключ комнаты:', key)
        state.room_key = 'room01'
        localStorage.setItem('room_key', 'room01')
      }
    },
    // Добавленные мутации
    SET_ROOM_TITLE(state, title) {
      state.room_title = title || 'Главная комната'
      localStorage.setItem('room_title', title)
    },
    SET_PARAM_TITLE(state, title) {
      state.param_title = title || 'Температура'
      localStorage.setItem('param_title', title)
    }
  },
  actions: {
    initSortParams({ commit }) {
      const safeParse = (key, defaultValue) => {
        try {
          const value = localStorage.getItem(key)
          return value || defaultValue
        } catch (e) {
          return defaultValue
        }
      }

      commit('SET_SORT_TYPE', safeParse('sortType', 'rooms'))
      commit('SET_ROOM_ID', safeParse('room_id', 1))
      commit('SET_ROOM_KEY', safeParse('room_key', 'room01'))
      commit('SET_ROOM_TITLE', safeParse('room_title', 'Главная комната'))
      commit('SET_PARAM_KEY', safeParse('param_key', 'Temp'))
      commit('SET_PARAM_TITLE', safeParse('param_title', 'Температура'))
    },
    resetDefaults({ commit }) {
      commit('SET_SORT_TYPE', 'rooms')
      commit('SET_ROOM_ID', 1)
      commit('SET_ROOM_KEY', 'room01')
      commit('SET_ROOM_TITLE', 'Главная комната')
      commit('SET_PARAM_KEY', 'Temp')
      commit('SET_PARAM_TITLE', 'Температура')
    }
  },
  getters: {
    getSortParams: state => state.sortType,
    getRoomId: state => state.room_id,
    getRoomKey: state => state.room_key,
    getRoomTitle: state => state.room_title,
    getParamKey: state => state.param_key,
    getParamTitle: state => state.param_title,
    // Комплексный геттер
    getAllParams: state => ({
      sortType: state.sortType,
      roomId: state.room_id,
      roomKey: state.room_key,
      paramKey: state.param_key,
      roomTitle: state.room_title,
      paramTitle: state.param_title
    })
  }
}