import { createApp } from 'vue';
import App from './App.vue';
import store from './store/index.js';
import router from './router/routes.js';

const app = createApp(App);
app.use(store);
app.use(router); // Подключаем маршрутизацию

app.mount('#app');