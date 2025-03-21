import WebSocketService from '../../services/_websocket'; // Исправленный путь

const socketModule = {
  state: () => ({
    socket: null,
  }),
  mutations: {
    SET_SOCKET(state, socket) {
      state.socket = socket;
    },
  },
  actions: {
    async connectWebSocket({ commit }) {
      const wsService = new WebSocketService(`ws://${process.env.VUE_APP_HOST}:${process.env.VUE_APP_PORT}`);
      try {
        await wsService.connect(); // Убрали неиспользуемую переменную `socket`
        commit('SET_SOCKET', wsService);
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    },
  },
};

export default socketModule;