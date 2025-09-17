// src/tests/unit/router.spec.js

// Мокаем localStorage до всех импортов
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock

import { createRouter, createWebHistory } from 'vue-router'
import { routesArray } from '@/router/routes'

describe('Router Configuration', () => {
  let router

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: routesArray
    })
    localStorageMock.setItem.mockClear()
  })

  test('имеет корректные маршруты', () => {
    const names = router.getRoutes().map(r => r.name).filter(Boolean)
    expect(names).toEqual(expect.arrayContaining([
      'Intro', 'DashBoard', 'SmartHome', 'ManufactAutomatation',
      'Login', 'AppProfile', 'Users', 'AccessDenied'
    ]))
  })

  test('корневой маршрут ведет к Intro', () => {
    expect(router.resolve('/').name).toBe('Intro')
  })
})

describe('Navigation Guard', () => {
  // сбрасываем кеш модулей и очистим localStorage между тестами
  beforeEach(() => {
    jest.resetModules()
    localStorageMock.setItem.mockClear()
  })

  /**
   * 1) Подменяем store перед загрузкой navigationGuard
   * 2) Подгружаем свежую функцию из модуля
   */
  function makeGuard({ isAuthenticated, level }) {
    jest.doMock('@/store', () => ({
      getters: { isAuthenticated, level }
    }))
    // require внутри теста, после doMock
    const { navigationGuard } = require('@/router/routes')
    return navigationGuard
  }

  test('позволяет доступ к /login без аутентификации', () => {
    const guard = makeGuard({ isAuthenticated: false, level: 0 })
    const to = {
      path: '/login',
      matched: [{ meta: { public: true } }],
      fullPath: '/login'
    }
    const next = jest.fn()

    guard(to, {}, next)
    expect(next).toHaveBeenCalledWith()
  })

 test('перенаправляет на /login при отсутствии аутентификации', () => {
    const guard = makeGuard({ isAuthenticated: false, level: 0 })
   const to = {
      path: '/dashboard',
      matched: [{ meta: { requiresAuth: true } }],
      fullPath: '/dashboard'
   }
    const next = jest.fn()

    guard(to, {}, next)
    expect(next).toHaveBeenCalledWith('/login')
 })

  test('перенаправляет на /access-denied при недостаточном уровне доступа', () => {
    const guard = makeGuard({ isAuthenticated: true, level: 1 })
    const to = {
      path: '/users',
      matched: [{ meta: { requiresAuth: true, requiredLevel: 3 } }],
      fullPath: '/users'
    }
    const next = jest.fn()

    guard(to, {}, next)
    expect(next).toHaveBeenCalledWith('/access-denied')
  })

  test('позволяет доступ при достаточном уровне доступа', () => {
    const guard = makeGuard({ isAuthenticated: true, level: 3 })
    const to = {
      path: '/users',
      matched: [{ meta: { requiresAuth: true, requiredLevel: 3 } }],
      fullPath: '/users'
    }
    const next = jest.fn()

    guard(to, {}, next)
    expect(next).toHaveBeenCalledWith()
  })
})

describe('Дочерние маршруты Dashboard', () => {
  test('имеет дочерние маршруты', () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: routesArray
    })
    const dash = router.getRoutes().find(r => r.name === 'DashBoard')
    expect(dash.children).toHaveLength(5)
    expect(dash.children.map(c => c.name)).toEqual(
      expect.arrayContaining([
        'Dashboad', 'DashboardRooms',
        'DashboardParams', 'DashboardCommon', 'DashboardSettings'
      ])
    )
  })
})
