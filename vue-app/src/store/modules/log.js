// store/modules/log.js
const logModule = {
    actions: {
      async sendLogToServer({ state }, { type, message }) {
        if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
          console.error('Соединение с сервером не установлено.');
          return;
        }
        try {
          await state.socket.send('log', 'sendLog', { type, message });
        } catch (error) {
          console.error('Failed to send log to server', error);
        }
      },
    },
  };
  
  export default logModule;