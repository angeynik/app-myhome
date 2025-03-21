// services/websocket.js
class WebSocketService {
    constructor(url) {
      this.url = url;
      this.socket = null;
      this.listeners = {};
    }
  
    connect() {
      return new Promise((resolve, reject) => {
        this.socket = new WebSocket(this.url);
        this.socket.onopen = () => {
          resolve(this.socket);
        };
        this.socket.onerror = (error) => {
          reject(error);
        };
        this.socket.onmessage = (event) => {
          const response = JSON.parse(event.data);
          if (this.listeners[response.request]) {
            this.listeners[response.request](response);
          }
        };
      });
    }
  
    send(type, request, payload) {
      return new Promise((resolve, reject) => {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
          reject(new Error('Websocket.js - Соединение с сервером не установлено.'));
          return;
        }
        const requestId = Date.now().toString();
        this.listeners[requestId] = (response) => {
          if (response.type === 'error') {
            reject(new Error(response.message));
          } else {
            resolve(response);
          }
        };
        this.socket.send(JSON.stringify({ type, request, requestId, ...payload }));
      });
    }
  
    close() {
      if (this.socket) {
        this.socket.close();
      }
    }
  }
  
  export default WebSocketService;