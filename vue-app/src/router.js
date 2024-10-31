import { createRouter, createWebHistory } from 'vue-router';
import App from '@/App.vue';
import Info from '@/components/MainInfo.vue';
import Settings from '@/components/MainSettings.vue';
import Alarms from '@/components/MainAlarms.vue';
import Scenarios from '@/components/MainScenarios.vue';
import Statistic from '@/components/MainStatistic.vue';


const routes = [
  { path: '/', component: App},
  { path: '/info', component: Info },
  { path: '/settings', name: 'Settings', component: Settings },
  { path: '/alarms', component: Alarms },
  { path: '/scenarios', component: Scenarios },
  { path: '/statistic', component: Statistic },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
