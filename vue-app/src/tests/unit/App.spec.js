import { shallowMount, flushPromises } from '@vue/test-utils';
import App from '@/App.vue';

// Моки
const mockStore = {
  dispatch: jest.fn(),
  getters: {
    isAuthenticated: false,
    level: 0,
    dID: null,
    roomKey: null,
    paramKey: null
  }
};

const mockRouter = {
  push: jest.fn()
};

describe('App.vue', () => {
  let wrapper;

  beforeEach(() => {
    jest.clearAllMocks();
    // Сбрасываем значения геттеров
    mockStore.getters.isAuthenticated = false;
    mockStore.getters.level = 0;
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
          $route: { path: '/' },
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
          $route: { path: '/' },
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