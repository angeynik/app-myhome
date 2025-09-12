import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../DashBoard.vue';
import SmartHome from '../SmartHome.vue';
import ManufactAutomatation from '../ManufactAutomatation.vue';
import IntroduceHome from '../IntroduceHome.vue';
import Login from '../components/AppLogin.vue';
import Profile from '../components/AppProfile.vue';
import UserConfig from '../components/UserConfig.vue';
import AccessDenied from '../components/AccessDenied.vue'; // Компонент для ошибки доступа
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
  meta: { requiresAuth: true, requiredLevel: 1 },
  children: [
        {
      path: '', // Пустой путь для основного состояния
      name: 'Dashboad',
      component: null // Явно указываем, что компонент не нужен
    },
    {
      path: 'rooms',
      name: 'DashboardRooms',
      component: () => import('@/components/DashboardRooms.vue')
    },
    {
      path: 'params',
      name: 'DashboardParams',
      component: () => import('@/components/DashboardParams.vue')
    },
    {
      path: 'common',
      name: 'DashboardCommon',
      component: () => import('@/components/DashboardCommon.vue')
    },
    {
      path: 'settings',
      name: 'DashboardSettings',
      component: () => import('@/components/DashboardSettings.vue')
    }
  ]
},
  {
    path: '/smart-home',
    name: 'SmartHome',
    component: SmartHome,
    meta: { requiresAuth: true, requiredLevel: 1 }, // Добавляем проверку аутентификации
  },
  {
    path: '/manufact-automatation',
    name: 'ManufactAutomatation',
    component: ManufactAutomatation,
    meta: { requiresAuth: true, requiredLevel: 1 }, // Добавляем проверку аутентификации
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true } // Публичный маршрут
  },
  {
    path: '/profile',
    name: 'AppProfile',
    component: Profile,
    meta: { requiresAuth: true, requiredLevel: 2 }, // Уровень доступа 2
  },
  {
    path: '/users',
    name: 'Users',
    component: UserConfig,
    meta: { requiresAuth: true, requiredLevel: 3 }, // Уровень доступа 3
  },
  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: AccessDenied,
  },
  {
    path: '/:pathMatch(.*)*', // Ловим все несуществующие маршруты
    redirect: '/', // Перенаправляем на главную страницу
  },
];
export const routesArray = routes;

export const navigationGuard = (to, from, next) => {
  const isAuthenticated = !!store.getters.isAuthenticated;
  const userLevel = store.getters.level || 0;

  if (to.matched.some(record => record.meta.public)) {
    return next();
  }
  
  // Находим первую запись с requiresAuth
  const authRecord = to.matched.find(record => record.meta.requiresAuth);
  if (authRecord) {
    if (!isAuthenticated) {
      localStorage.setItem('redirectPath', to.fullPath);
      next('/login');
    } else if (authRecord.meta.requiredLevel && userLevel < authRecord.meta.requiredLevel) {
      next('/access-denied');
    } else {
      next();
    }
  } else {
    next();
  }
};

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(navigationGuard);

export default router;