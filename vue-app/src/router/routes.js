import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../DashBoard.vue';
import SmartHome from '../SmartHome.vue';
import ManufactAutomatation from '../ManufactAutomatation.vue';
import IntroduceHome from '../IntroduceHome.vue';
import Login from '../components/AppLogin.vue';
import Profile from '../components/AppProfile.vue';


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
    meta: { requiresAuth: true } // Указываем, что маршрут требует авторизации
  },
  {
    path: '/smart-home',
    name: 'SmartHome',
    component: SmartHome,
    meta: { requiresAuth: true },
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
    //meta: { requiresAuth: true } // Указываем, что маршрут требует авторизации
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Проверка авторизации перед переходом на защищенные маршруты
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token'); // Проверяем наличие токена
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      // Сохраняем запрашиваемый маршрут
      localStorage.setItem('redirectPath', to.fullPath);
      next('/login'); // Перенаправляем на страницу логина
    } else {
      next(); // Продолжаем навигацию
    }
  } else {
    next(); // Продолжаем навигацию
  }
});

export default router;