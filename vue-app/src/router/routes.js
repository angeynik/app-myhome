import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../DashBoard.vue';
import SmartHome from '../SmartHome.vue';
import ManufactAutomatation from '../ManufactAutomatation.vue';
import Login from '../components/AppLogin.vue';
import Profile from '../components/AppProfile.vue';
import UserConfig from '../components/UserConfig.vue';
import AccessDenied from '../components/AccessDenied.vue';
import store from '@/store';

// ─── Хелпер feature-флагов ────────────────────────────────────────────────
// VUE_APP_FEATURE_* подставляется webpack при сборке из .env-файла.
// Если переменная не задана — раздел считается включённым (безопасный дефолт).
function isFeatureEnabled(envKey) {
  return process.env[envKey] !== 'false';
}

// ─── Маршруты, управляемые feature-флагами сборки ─────────────────────────
const featureRoutes = [
  ...(isFeatureEnabled('VUE_APP_FEATURE_CONFIGURATION') ? [{
    path: '/configuration',
    name: 'Configuration',
    component: () => import('../ConFiguration.vue'),
    meta: { public: true },
  }] : []),

  ...(isFeatureEnabled('VUE_APP_FEATURE_ABOUT') ? [{
    path: '/about',
    name: 'About',
    component: () => import('../IntroduceHome.vue'),
    meta: { public: true },
  }] : []),
];

const routes = [
// ── Стартовая страница (навигация по разделам рендерится в App.vue) ──────
  {
    path: '/',
    name: 'AppHome',
    component: () => import('../IntroduceHome.vue'),
    meta: { public: true },
  },
  // Временно перенаправляем стартовый запрос на DashBoard
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
        path: 'sort/:sortType', // Динамический параметр для типа сортировки
        name: 'DashboardSort',
        component: () => import('@/components/MainBody.vue'),
        props: true // Передаем параметры как props
      },
      {
        path: 'settings/:settingsType', //динамический параметр для выбора компонента отображения настроек Расписания или Уведомдений
        name: 'DashboardSettings',
        component: () => import('@/components/MainBodySettings.vue'),
        meta: { requiresAuth: true, requiredLevel: 2 },
        props: true, 
      }
    ]
  },
    // ── Feature-управляемые разделы ───────────────────────────────────────────
  ...featureRoutes,

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

    // ── ВРЕМЕННЫЙ ЛОГ ─────────────────────────────────────────────
  console.log('[GUARD]', {
    to: to.path,
    isAuthenticated,
    userLevel,
    meta: to.meta,
    storeState: JSON.stringify(store.state.auth),
  });
  // ──────────────────────────────────────────────────────────────

  // Публичные маршруты — пропускаем без проверки
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