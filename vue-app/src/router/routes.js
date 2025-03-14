import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../DashBoard.vue';
import SmartHome from '../SmartHome.vue';
import ManufactAutomatation from '../ManufactAutomatation.vue';
import IntroduceHome from '../IntroduceHome.vue';
import Login from '../components/AppLogin.vue';
import Profile from '../components/AppProfile.vue';
import UserConfig from '@/components/UserConfig.vue';
import AccessDenied from '@/components/AccessDenied.vue'; // Компонент для ошибки доступа
import store from '@/store'; // Импортируем хранилище Vuex

const routes = [
  {
    path: '/',
    name: 'Intro',
    component: IntroduceHome,
  },
  {
    path: '/dashboard',
    name: 'DashBoard',
    component: Dashboard,
    meta: { requiresAuth: true, requiredLevel: 1 }, // Уровень доступа 1
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
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true, requiredLevel: 2, level: 2 }, // Уровень доступа 2
  },
  {
    path: '/users',
    name: 'Users',
    component: UserConfig,
    meta: { requiresAuth: true, requiredLevel: 3, level: 3 }, // Уровень доступа 3
  },
  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: AccessDenied,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token'); // Проверяем наличие токена
  //const redirectPath = localStorage.getItem('redirectPath') || '/';
  const userLevel = store.getters.level || 0; // Получаем уровень доступа пользователя из Vuex

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      // Сохраняем запрашиваемый маршрут
      localStorage.setItem('redirectPath', to.fullPath);
      next('/login'); // Перенаправляем на страницу логина
    } else if (to.meta.requiredLevel && userLevel < to.meta.requiredLevel) {
      // Если у пользователя недостаточно прав
      next('/access-denied'); // Перенаправляем на страницу с ошибкой доступа
    } else {
      next(); // Продолжаем навигацию
    }
  } else {
    next(); // Продолжаем навигацию
  }
});

export default router;