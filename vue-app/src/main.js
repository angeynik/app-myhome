import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')

const app = createApp(App);

import pino from 'pino';
const logDirectory = './pino_logs';

// Создайте транспорт для каждого уровня логирования
const transports = {
  debug: pino.transport({
    target: 'pino/file',
    options: { destination: `${logDirectory}/debug.log` },
  }),
  info: pino.transport({
    target: 'pino/file',
    options: { destination: `${logDirectory}/info.log` },
  }),
  warn: pino.transport({
    target: 'pino/file',
    options: { destination: `${logDirectory}/warn.log` },
  }),
  error: pino.transport({
    target: 'pino/file',
    options: { destination: `${logDirectory}/error.log` },
  }),
};

// Создайте логгер с указанными транспортами
const logger = pino({ level: 'debug' }, transports);

app.config.globalProperties.$logger = logger;

app.mount('#app');

import config from './myhome_config.js'; // Импортируйте конфигурацию
app.config.globalProperties.sPointRoom_all= config.sPointRoom_all;
app.config.globalProperties.sPointRoom_01 = config.sPointRoom_01;
app.config.globalProperties.sPointRoom_02 = config.sPointRoom_02;
app.config.globalProperties.sPointRoom_03 = config.sPointRoom_03;
app.config.globalProperties.sPointRoom_04 = config.sPointRoom_04;
app.config.globalProperties.sPointRoom_05 = config.sPointRoom_05;
app.config.globalProperties.sPointRoom_06 = config.sPointRoom_06;
app.config.globalProperties.sPointRoom_07 = config.sPointRoom_07;
app.config.globalProperties.sPointRoom_08 = config.sPointRoom_08;

app.config.globalProperties.sensorTemp_01 = config.sensorTemp_01;
app.config.globalProperties.sensorTemp_02 = config.sensorTemp_02;
app.config.globalProperties.sensorTemp_03 = config.sensorTemp_03;
app.config.globalProperties.sensorTemp_04 = config.sensorTemp_04;
app.config.globalProperties.sensorTemp_05 = config.sensorTemp_05;
app.config.globalProperties.sensorTemp_06 = config.sensorTemp_06;
app.config.globalProperties.sensorTemp_07 = config.sensorTemp_07;
app.config.globalProperties.sensorTemp_08 = config.sensorTemp_08;

app.config.globalProperties.relayRoom_01 = config.relayRoom_01;
app.config.globalProperties.relayRoom_02 = config.relayRoom_02;
app.config.globalProperties.relayRoom_03 = config.relayRoom_03;
app.config.globalProperties.relayRoom_04 = config.relayRoom_04;
app.config.globalProperties.relayRoom_05 = config.relayRoom_05;
app.config.globalProperties.relayRoom_06 = config.relayRoom_06;
app.config.globalProperties.relayRoom_07 = config.relayRoom_07;
app.config.globalProperties.relayRoom_08 = config.relayRoom_08;

app.config.globalProperties.sensorMove_01 = config.sensorMove_01;
app.config.globalProperties.sensorMove_02 = config.sensorMove_02;
app.config.globalProperties.sensorMove_03 = config.sensorMove_03;
app.config.globalProperties.sensorFire_01 = config.sensorFire_01;
app.config.globalProperties.sensorFire_02 = config.sensorFire_02;
app.config.globalProperties.sensorLeak_01 = config.sensorLeak_01;
app.config.globalProperties.sensorLeak_02 = config.sensorLeak_02;


