// router/routes.js
import { createRouter, createWebHistory } from 'vue-router';
import MainView from '../components/MainView.vue';
import Login from '../components/AppLogin.vue';
import Profile from '../components/AppProfile.vue';
import AccessDenied from '../components/AccessDenied.vue';
import store from '@/store';
import logger from '../store/modules/logger';

// ─── Feature-флаги сборки ─────────────────────────────────────────────────
function isFeatureEnabled(envKey) {
  return process.env[envKey] !== 'false';
}

const featureRoutes = [
  ...(isFeatureEnabled('VUE_APP_FEATURE_CONFIGURATION') ? [{
    path: '/configuration',
    name: 'Configuration',
    component: () => import('../ConFiguration.vue'),
    meta: { public: true },
  }] : []),
];

const routes = [
  // ── Главный экран: MainView (shell) + вложенные дочерние ───────────────
  {
    path: '/',
    component: MainView,
    meta: { requiresAuth: true, requiredLevel: 1 },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/components/MainBody.vue'),
      },
      {
        path: 'settings/:settingsType',
        name: 'DashboardSettings',
        component: () => import('@/components/MainBodySettings.vue'),
        meta: { requiresAuth: true, requiredLevel: 2 },
        props: (route) => ({ setting_Type: route.params.settingsType }),
      },
    ],
  },

  // ── Feature-управляемые разделы ────────────────────────────────────────
  ...featureRoutes,

  // ── Аутентификация ─────────────────────────────────────────────────────
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true },
  },
  {
    path: '/profile',
    name: 'AppProfile',
    component: Profile,
    meta: { requiresAuth: true, requiredLevel: 2 },
  },
  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: AccessDenied,
  },

  // ── Fallback ───────────────────────────────────────────────────────────
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const routesArray = routes;

// ─── Navigation guard ─────────────────────────────────────────────────────
export const navigationGuard = (to, from, next) => {
  const isAuthenticated = !!store.getters.isAuthenticated;
  const userLevel       = store.getters.level || 0;

  logger.dev('[GUARD]', { to: to.path, isAuthenticated, userLevel, meta: to.meta });

  // 1. Публичные маршруты.
  //    Уже авторизованному нет смысла показывать форму логина.
  const isPublic = to.matched.some(r => r.meta.public);
  if (isPublic) {
    if (to.name === 'Login' && isAuthenticated) {
      return next('/');
    }
    return next();
  }

  // 2. Требуется ли авторизация (по всем matched-записям).
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth);
  if (!requiresAuth) return next();

  if (!isAuthenticated) {
    localStorage.setItem('redirectPath', to.fullPath);
    return next('/login');
  }

  // 3. Уровень доступа — максимальное требование из всех matched.
  const requiredLevel = Math.max(
    0,
    ...to.matched.map(r => r.meta.requiredLevel || 0),
  );
  if (requiredLevel && userLevel < requiredLevel) {
    return next('/access-denied');
  }

  return next();
};

const router = createRouter({
  history: createWebHistory('/app/'),
  routes,
});

router.beforeEach(navigationGuard);

export default router;