import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../DashBoard.vue';
import SmartHome from '../SmartHome.vue';
import ManufactAutomatation from '../ManufactAutomatation.vue';
import IntroduceHome from '../IntroduceHome.vue';
import Login from '../components/AppLogin.vue';
import Profile from '../components/AppProfile.vue';
import UserConfig from '../components/UserConfig.vue';
import AccessDenied from '../components/AccessDenied.vue';
import store from '@/store';

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
        path: '', // Главное меню с AppPlace
        name: 'DashboardMain',
        component: null
      },
      {
        path: ':sortType', // Динамический параметр для типа сортировки
        name: 'DashboardSort',
        component: () => import('@/components/MainBody.vue'),
        props: true // Передаем параметры как props
      }
    ]
  },
  {
    path: '/smart-home',
    name: 'SmartHome',
    component: SmartHome,
    meta: { requiresAuth: true, requiredLevel: 1 },
  },
  {
    path: '/manufact-automatation',
    name: 'ManufactAutomatation',
    component: ManufactAutomatation,
    meta: { requiresAuth: true, requiredLevel: 1 },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/profile',
    name: 'AppProfile',
    component: Profile,
    meta: { requiresAuth: true, requiredLevel: 2 },
  },
  {
    path: '/users',
    name: 'Users',
    component: UserConfig,
    meta: { requiresAuth: true, requiredLevel: 3 },
  },
  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: AccessDenied,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export const routesArray = routes;

export const navigationGuard = (to, from, next) => {
  const isAuthenticated = !!store.getters.isAuthenticated;
  const userLevel = store.getters.level || 0;

  if (to.matched.some(record => record.meta.public)) {
    return next();
  }
  
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