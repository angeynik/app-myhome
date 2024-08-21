const WebSocket = require('ws');

const WSServer = new WebSocket.Server ({port:1011});

module.exports = WSServer;