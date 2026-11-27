// src/tests/unit/router.spec.js

// Мокаем localStorage до всех импортов
const localStorageMock = {
  getItem:  jest.fn(),
  setItem:  jest.fn(),
  clear:    jest.fn(),
  removeItem: jest.fn(),
};
// В jsdom window.localStorage нельзя заменить присваиванием — только через defineProperty
Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true, writable: true });

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
    expect(names.sort()).toEqual(
      ['AccessDenied', 'AppProfile', 'AppSettings', 'DashboardSettings', 'Home', 'Login', 'ScenarioEditor', 'ScenarioNew', 'Scenarios'].sort(),
    );
  });

  test('корневой маршрут / ведёт к главному экрану (Home)', () => {
    expect(router.resolve('/').name).toBe('Home');
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

  test('главный экран (/) требует вход и уровень 1', () => {
    const shell = routesArray.find(r => r.path === '/');
    expect(shell.meta).toMatchObject({ requiresAuth: true, requiredLevel: 1 });
    // и это действует на все дочерние страницы
    expect(router.resolve('/').matched[0].meta).toMatchObject({ requiresAuth: true, requiredLevel: 1 });
  });

  test.each([
    { name: 'AppProfile',        path: '/profile',               requiredLevel: 2 },
    { name: 'DashboardSettings', path: '/settings/schedules',    requiredLevel: 2 },
    { name: 'AppSettings',       path: '/preferences',           requiredLevel: 2 },
    { name: 'Scenarios',         path: '/scenarios',             requiredLevel: 2 },
    { name: 'ScenarioNew',       path: '/scenarios/new',         requiredLevel: 2 },
    { name: 'ScenarioEditor',    path: '/scenarios/sc_1',        requiredLevel: 2 },
  ])('маршрут $name ($path) требует вход и уровень $requiredLevel', ({ name, path, requiredLevel }) => {
    const resolved = router.resolve(path);
    expect(resolved.name).toBe(name);
    expect(resolved.meta.requiresAuth).toBe(true);
    expect(resolved.meta.requiredLevel).toBe(requiredLevel);
  });

  test('несуществующий путь перенаправляется на /', () => {
    const fallback = router.getRoutes().find(r => r.path === '/:pathMatch(.*)*');
    expect(fallback.redirect).toBe('/');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// ДОЧЕРНИЕ МАРШРУТЫ ГЛАВНОГО ЭКРАНА (MainView)
// ─────────────────────────────────────────────────────────────────────────────
describe('Главный экран — дочерние маршруты', () => {
  const shell = () => routesArray.find(r => r.path === '/');

  test('дочерние маршруты: Home, DashboardSettings, сценарии, AppSettings', () => {
    expect(shell().children.map(c => c.name)).toEqual(['Home', 'DashboardSettings', 'Scenarios', 'ScenarioNew', 'ScenarioEditor', 'AppSettings']);
  });

  test('DashboardSettings передаёт тип настроек из адреса в prop setting_Type', () => {
    const settings = shell().children.find(c => c.name === 'DashboardSettings');
    expect(settings.props({ params: { settingsType: 'schedules' } })).toEqual({ setting_Type: 'schedules' });
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

  test('сохраняет redirectPath в localStorage при редиректе на /login', () => {
    const guard = makeGuard({ isAuthenticated: false, level: 0 });
    const next  = jest.fn();
    guard(makeTo('/preferences', { requiresAuth: true }), {}, next);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('redirectPath', '/preferences');
  });

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

  test('вложенный маршрут: требуется максимальный уровень из всех matched', () => {
    // DashboardSettings: matched содержит родителя / (level 1) и дочерний settings (level 2).
    // Пользователь уровня 1 не должен попасть на страницу уровня 2 через вложенность.
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
    expect(next).toHaveBeenCalledWith('/access-denied');
  });

  test('вложенный маршрут: уровня 2 достаточно', () => {
    const guard = makeGuard({ isAuthenticated: true, level: 2 });
    const next  = jest.fn();
    guard({
      path: '/settings/schedules', fullPath: '/settings/schedules',
      matched: [{ meta: { requiresAuth: true, requiredLevel: 1 } }, { meta: { requiresAuth: true, requiredLevel: 2 } }],
    }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('вошедшего пользователя со страницы входа отправляет на /', () => {
    const guard = makeGuard({ isAuthenticated: true, level: 1 });
    const next  = jest.fn();
    guard({ name: 'Login', path: '/login', fullPath: '/login', matched: [{ meta: { public: true } }] }, {}, next);
    expect(next).toHaveBeenCalledWith('/');
  });
});

describe('маршруты сценариев', () => {
  const child = (name) => routesArray.find((r) => r.path === '/').children.find((c) => c.name === name);
  test('props: шаблон из query, id из пути; заголовок шапки — «Сценарии»', () => {
    expect(child('ScenarioNew').props({ query: { template: 'thermostat' } })).toEqual({ template: 'thermostat' });
    expect(child('ScenarioNew').props({ query: {} })).toEqual({ template: 'empty' });
    expect(child('ScenarioEditor').props({ params: { id: 'sc_1' } })).toEqual({ scenarioId: 'sc_1' });
    expect(child('Scenarios').meta.title).toBe('Сценарии');
  });
});
