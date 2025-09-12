// src/tests/unit/router.spec.js
import router from '@/router/routes';

// Мокаем хранилище Vuex
jest.mock('@/store', () => {
  const storeMock = {
    getters: {
      isAuthenticated: jest.fn(),
      level: jest.fn()
    }
  };
  return storeMock;
});

// Мокаем localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

describe('Router Configuration', () => {
  beforeEach(() => {
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

describe('Navigation Guards', () => {
  let storeMock;

  beforeEach(() => {
    localStorageMock.setItem.mockClear();
    
    // Получаем мок хранилища
    storeMock = require('@/store');
    
    // Сбрасываем моки
    storeMock.getters.isAuthenticated.mockReset();
    storeMock.getters.level.mockReset();
  });

  describe('Публичные маршруты', () => {
    test('позволяет доступ к /login без аутентификации', async () => {
      storeMock.getters.isAuthenticated.mockReturnValue(false);
      storeMock.getters.level.mockReturnValue(0);
      
      const to = {
        path: '/login',
        matched: [{ meta: { public: true } }],
        fullPath: '/login'
      };
      const next = jest.fn();
      
      await router.beforeEach(to, {}, next);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Защищенные маршруты', () => {
    test('перенаправляет на /login при отсутствии аутентификации', async () => {
      storeMock.getters.isAuthenticated.mockReturnValue(false);
      storeMock.getters.level.mockReturnValue(0);
      
      const to = {
        path: '/dashboard',
        matched: [{ meta: { requiresAuth: true } }],
        fullPath: '/dashboard'
      };
      const next = jest.fn();
      
      await router.beforeEach(to, {}, next);
      expect(localStorage.setItem).toHaveBeenCalledWith('redirectPath', '/dashboard');
      expect(next).toHaveBeenCalledWith('/login');
    });

    test('перенаправляет на /access-denied при недостаточном уровне доступа', async () => {
      storeMock.getters.isAuthenticated.mockReturnValue(true);
      storeMock.getters.level.mockReturnValue(1);
      
      const to = {
        path: '/users',
        matched: [{ meta: { requiresAuth: true, requiredLevel: 3 } }],
        fullPath: '/users'
      };
      const next = jest.fn();
      
      await router.beforeEach(to, {}, next);
      expect(next).toHaveBeenCalledWith('/access-denied');
    });

    test('позволяет доступ при достаточном уровне доступа', async () => {
      storeMock.getters.isAuthenticated.mockReturnValue(true);
      storeMock.getters.level.mockReturnValue(3);
      
      const to = {
        path: '/users',
        matched: [{ meta: { requiresAuth: true, requiredLevel: 3 } }],
        fullPath: '/users'
      };
      const next = jest.fn();
      
      await router.beforeEach(to, {}, next);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Дочерние маршруты Dashboard', () => {
    test('имеет дочерние маршруты', () => {
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
});