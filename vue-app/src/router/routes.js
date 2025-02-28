import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../DashBoard.vue';
import SmartHome from '../SmartHome.vue';
import ManufactAutomatation from '../ManufactAutomatation.vue';
import IntroduceHome from '../IntroduceHome.vue';

const routes = [
{
    path: '/',
    name: 'Intro',
    component: IntroduceHome, 
  },
  {
    path: '/dash-board',
    name: 'DashBoard',
    component: Dashboard,
  },
  {
    path: '/smart-home',
    name: 'SmartHome',
    component: SmartHome,
  },
  {
    path: '/manufact-automatation',
    name: 'ManufactAutomatation',
    component: ManufactAutomatation,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;