import { shallowMount, flushPromises } from '@vue/test-utils';
import App from '@/App.vue';

// Мокаем store с геттерами для popup и dropdown
const mockStore = {
  dispatch: jest.fn(),
  getters: {
    // popup геттеры
    'popup/popupIsVisible': false,
    'popup/popupMessage': '',
    'popup/popupType': 'info',
    'popup/popupDuration': 3000,
    // dropdown геттеры
    'dropdown/isVisible': false,
    'dropdown/menuItems': [],
    'dropdown/anchorEl': null,
    // auth геттеры
    isAuthenticated: false,
    level: 0,
    dID: null,
    roomKey: null,
    paramKey: null
  },
  state: {
    auth: {
      user: null
    }
  }
};

// Мокаем маршрутизатор
const mockRouter = {
  push: jest.fn()
};

// Мокаем $route с meta
const mockRoute = {
  path: '/',
  meta: {
    requiresAuth: false
  }
};

describe('App.vue', () => {
  let wrapper;

  beforeEach(() => {
    jest.clearAllMocks();
    // Сбрасываем значения геттеров
    mockStore.getters.isAuthenticated = false;
    mockStore.getters['popup/popupIsVisible'] = false;
    mockStore.getters['popup/popupMessage'] = '';
    mockStore.getters['popup/popupType'] = 'info';
    mockStore.getters['popup/popupDuration'] = 3000;
    mockStore.getters['dropdown/isVisible'] = false;
    mockStore.getters['dropdown/menuItems'] = [];
    mockStore.getters['dropdown/anchorEl'] = null;
    mockStore.state.auth.user = null;
    mockRoute.meta.requiresAuth = false;
  });

  it('не вызывает инициализацию config если пользователь не аутентифицирован', async () => {
    mockStore.dispatch.mockImplementation((action) => {
      if (action === 'initializeStore') return Promise.resolve();
      if (action === 'websocket/connect') return Promise.resolve();
      return Promise.reject(new Error(`Unexpected action: ${action}`));
    });

    wrapper = shallowMount(App, {
      global: {
        mocks: {
          $store: mockStore,
          $route: mockRoute,
          $router: mockRouter
        }
      }
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(mockStore.dispatch).toHaveBeenCalledWith('initializeStore');
    expect(mockStore.dispatch).toHaveBeenCalledWith('websocket/connect');
    expect(mockStore.dispatch).not.toHaveBeenCalledWith('config/initialize');
  });

  it('поведение при isAuthenticated = false', async () => {
    mockStore.dispatch.mockImplementation((action) => {
      if (action === 'initializeStore') return Promise.resolve();
      if (action === 'websocket/connect') return Promise.resolve();
      return Promise.reject(new Error(`Unexpected action: ${action}`));
    });

    wrapper = shallowMount(App, {
      global: {
        mocks: {
          $store: mockStore,
          $route: mockRoute,
          $router: mockRouter
        }
      }
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(mockStore.dispatch).toHaveBeenCalledWith('initializeStore');
    expect(mockStore.dispatch).toHaveBeenCalledWith('websocket/connect');
    expect(mockStore.dispatch).not.toHaveBeenCalledWith('config/initialize');
  });
});