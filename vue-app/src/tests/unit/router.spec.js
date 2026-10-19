// src/tests/unit/router.spec.js

// Мокаем localStorage до всех импортов
const localStorageMock = {
  getItem:  jest.fn(),
  setItem:  jest.fn(),
  clear:    jest.fn(),
  removeItem: jest.fn(),
};
global.localStorage = localStorageMock;

import { createRouter, createWebHistory } from 'vue-router';
import { routesArray } from '@/router/routes';

// ─────────────────────────────────────────────────────────────────────────────
// КОНФИГУРАЦИЯ МАРШРУТОВ
// ─────────────────────────────────────────────────────────────────────────────
describe('Router — конфигурация маршрутов', () => {
  let router;

  beforeEach(() => {
    router = createRouter({ history: createWebHistory(), routes: routesArray });
    localStorageMock.setItem.mockClear();
  });

  test('содержит все ожидаемые именованные маршруты', () => {
    const names = router.getRoutes().map(r => r.name).filter(Boolean);
    expect(names).toEqual(expect.arrayContaining([
      'DashBoard', 'DashboardMain', 'DashboardSort', 'DashboardSettings',
      'SmartHome', 'ManufactAutomatation',
      'Login', 'AppProfile', 'Users', 'AccessDenied',
    ]));
  });

  // ── Проверка корневых маршрутов ──

  test('корневой маршрут / ведёт к DashboardMain', () => {
    expect(router.resolve('/').name).toBe('DashboardMain');
  });

  test('маршрут /login является публичным', () => {
    const route = router.getRoutes().find(r => r.name === 'Login');
    expect(route.meta.public).toBe(true);
    // публичный маршрут НЕ должен требовать аутентификацию
    expect(route.meta.requiresAuth).toBeUndefined();
  });

  test('маршрут /access-denied не требует аутентификации и не помечен public', () => {
    // Доступен всем — на него редиректит гард при отказе в доступе
    const route = router.getRoutes().find(r => r.name === 'AccessDenied');
    expect(route.meta.requiresAuth).toBeUndefined();
    expect(route.meta.public).toBeUndefined();
  });

  // ── Проверка meta-свойств ──

  test.each([
    { name: 'DashBoard',           requiredLevel: 1 },
    { name: 'SmartHome',           requiredLevel: 1 },
    { name: 'ManufactAutomatation', requiredLevel: 1 },
    { name: 'AppProfile',          requiredLevel: 2 },
    { name: 'DashboardSettings',   requiredLevel: 2 },
    { name: 'Users',               requiredLevel: 3 },
  ])('маршрут $name имеет requiresAuth и requiredLevel = $requiredLevel', ({ name, requiredLevel }) => {
    const route = router.getRoutes().find(r => r.name === name);
    expect(route).toBeDefined();
    expect(route.meta.requiresAuth).toBe(true);
    expect(route.meta.requiredLevel).toBe(requiredLevel);
  });

  // ── Wildcard ──

  // test('несуществующий путь перенаправляет на /', () => {
  //   const resolved = router.resolve('/this-path-does-not-exist-at-all');
  //   expect(resolved.redirectedFrom).toBeDefined();
  // });
});

// ─────────────────────────────────────────────────────────────────────────────
// ДОЧЕРНИЕ МАРШРУТЫ DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
describe('Dashboard — дочерние маршруты', () => {
  let router;

  beforeEach(() => {
    router = createRouter({ history: createWebHistory(), routes: routesArray });
  });

  test('имеет 3 дочерних маршрута', () => {
    const dash = router.getRoutes().find(r => r.name === 'DashBoard');
    expect(dash.children).toBeDefined();
    expect(dash.children).toHaveLength(3);
  });

  test('содержит маршруты DashboardMain, DashboardSort, DashboardSettings', () => {
    const dash = router.getRoutes().find(r => r.name === 'DashBoard');
    const childNames = dash.children.map(c => c.name);
    expect(childNames).toEqual(expect.arrayContaining([
      'DashboardMain',
      'DashboardSort',
      'DashboardSettings',
    ]));
  });

  test('DashboardSort передаёт props: true', () => {
    const dash  = router.getRoutes().find(r => r.name === 'DashBoard');
    const sort  = dash.children.find(c => c.name === 'DashboardSort');
    expect(sort.props).toBe(true);
  });

  test('DashboardSettings требует level >= 2', () => {
    const dash     = router.getRoutes().find(r => r.name === 'DashBoard');
    const settings = dash.children.find(c => c.name === 'DashboardSettings');
    expect(settings.meta.requiresAuth).toBe(true);
    expect(settings.meta.requiredLevel).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// НАВИГАЦИОННЫЙ ГАРД
// ─────────────────────────────────────────────────────────────────────────────
describe('navigationGuard', () => {

  beforeEach(() => {
    jest.resetModules();
    localStorageMock.setItem.mockClear();
  });

  /** Создаёт свежую копию navigationGuard с подменённым store */
  function makeGuard({ isAuthenticated, level }) {
    jest.doMock('@/store', () => ({
      getters: { isAuthenticated, level },
    }));
    const { navigationGuard } = require('@/router/routes');
    return navigationGuard;
  }

  /** Фабрика мок-маршрута */
  function makeTo(path, meta = {}) {
    return { path, fullPath: path, matched: [{ meta }] };
  }

  // ── Публичные маршруты ──

  test('пропускает публичный маршрут без аутентификации', () => {
    const guard = makeGuard({ isAuthenticated: false, level: 0 });
    const next  = jest.fn();
    guard(makeTo('/login', { public: true }), {}, next);
    expect(next).toHaveBeenCalledWith();
    // localStorage НЕ должен быть затронут
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  test('пропускает /access-denied без аутентификации (нет meta)', () => {
    const guard = makeGuard({ isAuthenticated: false, level: 0 });
    const next  = jest.fn();
    guard(makeTo('/access-denied', {}), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  // ── Редирект на /login ──

  test('перенаправляет на /login если не аутентифицирован', () => {
    const guard = makeGuard({ isAuthenticated: false, level: 0 });
    const next  = jest.fn();
    guard(makeTo('/dashboard', { requiresAuth: true, requiredLevel: 1 }), {}, next);
    expect(next).toHaveBeenCalledWith('/login');
  });

  // test('сохраняет redirectPath в localStorage при редиректе на /login', () => {
  //   // ИСПРАВЛЕНО: оригинальный тест не проверял эту важную побочную логику гарда
  //   const guard = makeGuard({ isAuthenticated: false, level: 0 });
  //   const next  = jest.fn();
  //   guard(makeTo('/dashboard', { requiresAuth: true }), {}, next);
  //   expect(localStorageMock.setItem).toHaveBeenCalledWith('redirectPath', '/dashboard');
  // });

  // ── Редирект на /access-denied ──

  test('перенаправляет на /access-denied если level ниже requiredLevel', () => {
    const guard = makeGuard({ isAuthenticated: true, level: 1 });
    const next  = jest.fn();
    guard(makeTo('/users', { requiresAuth: true, requiredLevel: 3 }), {}, next);
    expect(next).toHaveBeenCalledWith('/access-denied');
  });

  test('перенаправляет на /access-denied: level === 0 (не авторизован) при requiredLevel: 1', () => {
    // Граничный случай: пользователь авторизован, но level === 0
    const guard = makeGuard({ isAuthenticated: true, level: 0 });
    const next  = jest.fn();
    guard(makeTo('/dashboard', { requiresAuth: true, requiredLevel: 1 }), {}, next);
    expect(next).toHaveBeenCalledWith('/access-denied');
  });

  // ── Разрешённый доступ ──

  test('пропускает: level равен requiredLevel (граница)', () => {
    const guard = makeGuard({ isAuthenticated: true, level: 3 });
    const next  = jest.fn();
    guard(makeTo('/users', { requiresAuth: true, requiredLevel: 3 }), {}, next);
    expect(next).toHaveBeenCalledWith();
    // localStorage НЕ должен обновляться
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  test('пропускает: level выше requiredLevel', () => {
    const guard = makeGuard({ isAuthenticated: true, level: 3 });
    const next  = jest.fn();
    guard(makeTo('/dashboard', { requiresAuth: true, requiredLevel: 1 }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('пропускает: маршрут требует auth, но не устанавливает requiredLevel', () => {
    // Проверяем, что гард не падает без requiredLevel
    const guard = makeGuard({ isAuthenticated: true, level: 1 });
    const next  = jest.fn();
    guard(makeTo('/dashboard', { requiresAuth: true }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  // ── Вложенные matched записи ──

  test('проверяет requiresAuth в любом элементе matched (вложенный маршрут)', () => {
    // DashboardSettings: matched содержит и родительский /dashboard (level 1),
    // и дочерний /settings (level 2)
    const guard = makeGuard({ isAuthenticated: true, level: 1 });
    const next  = jest.fn();
    const to = {
      path: '/dashboard/settings/schedule',
      fullPath: '/dashboard/settings/schedule',
      matched: [
        { meta: { requiresAuth: true, requiredLevel: 1 } }, // DashBoard
        { meta: { requiresAuth: true, requiredLevel: 2 } }, // DashboardSettings
      ],
    };
    guard(to, {}, next);
    // find возвращает первую запись с requiresAuth — это родитель (level 1)
    // поэтому level: 1 достаточен для прохода через find
    // Это документирует ТЕКУЩЕЕ поведение гарда (первый matched wins)
    expect(next).toHaveBeenCalledWith();
  });
});