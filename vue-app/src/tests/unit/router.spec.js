// Мокаем localStorage до всех импортов
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

import { createRouter, createWebHistory } from 'vue-router';
import { routesArray, navigationGuard } from '@/router/routes';

jest.mock('@/store', () => ({
  getters: {
    isAuthenticated: false,
    level: 0
  }
}));

describe('Router Configuration', () => {
  let router;

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: routesArray,
    });
    localStorageMock.setItem.mockClear();
  });

  test('имеет корректные маршруты', () => {
    const routeNames = router.getRoutes().map(route => route.name).filter(Boolean);
    expect(routeNames).toEqual(expect.arrayContaining([
      'Intro',
      'DashBoard',
      'SmartHome',
      'ManufactAutomatation',
      'Login',
      'AppProfile',
      'Users',
      'AccessDenied'
    ]));
  });

  test('корневой маршрут ведет к Intro', () => {
    const route = router.resolve('/');
    expect(route.name).toBe('Intro');
  });
});

describe('Navigation Guard', () => {
  let storeMock;

  beforeEach(() => {
    storeMock = require('@/store');
    localStorageMock.setItem.mockClear();
  });

  test('позволяет доступ к /login без аутентификации', () => {
    storeMock.getters.isAuthenticated = false;
    storeMock.getters.level = 0;

    const to = {
      path: '/login',
      matched: [{ meta: { public: true } }],
      fullPath: '/login'
    };
    const next = jest.fn();

    navigationGuard(to, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  // test('перенаправляет на /login при отсутствии аутентификации', () => {
  //   storeMock.getters.isAuthenticated = false;
  //   storeMock.getters.level = 0;

  //   const to = {
  //     path: '/dashboard',
  //     matched: [{ meta: { requiresAuth: true } }],
  //     fullPath: '/dashboard'
  //   };
  //   const next = jest.fn();

  //   navigationGuard(to, {}, next);
  //   expect(localStorageMock.setItem).toHaveBeenCalledWith('redirectPath', '/dashboard');
  //   expect(next).toHaveBeenCalledWith('/login');
  // });

  test('перенаправляет на /access-denied при недостаточном уровне доступа', () => {
    storeMock.getters.isAuthenticated = true;
    storeMock.getters.level = 1;

    const to = {
      path: '/users',
      matched: [{ meta: { requiresAuth: true, requiredLevel: 3 } }],
      fullPath: '/users'
    };
    const next = jest.fn();

    navigationGuard(to, {}, next);
    expect(next).toHaveBeenCalledWith('/access-denied');
  });

  test('позволяет доступ при достаточном уровне доступа', () => {
    storeMock.getters.isAuthenticated = true;
    storeMock.getters.level = 3;

    const to = {
      path: '/users',
      matched: [{ meta: { requiresAuth: true, requiredLevel: 3 } }],
      fullPath: '/users'
    };
    const next = jest.fn();

    navigationGuard(to, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('Дочерние маршруты Dashboard', () => {
  test('имеет дочерние маршруты', () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: routesArray,
    });
    const dashboardRoute = router.getRoutes().find(r => r.name === 'DashBoard');
    expect(dashboardRoute.children).toHaveLength(5);
    expect(dashboardRoute.children.map(ch => ch.name)).toEqual(
      expect.arrayContaining([
        'Dashboad',
        'DashboardRooms',
        'DashboardParams',
        'DashboardCommon',
        'DashboardSettings'
      ])
    );
  });
});