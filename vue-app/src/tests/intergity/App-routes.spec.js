import { mount } from '@vue/test-utils';
import App from '@/App.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { routes } from '@/router';

describe('App Integration', () => {
  it('правильно взаимодействует с router', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes
    });
    
    const mockStore = {
      dispatch: jest.fn().mockResolvedValue(),
      getters: {
        isAuthenticated: true,
        level: 1,
        dID: 'test',
        roomKey: null,
        paramKey: null
      }
    };

    // Начинаем с маршрута /dashboard
    await router.replace('/dashboard');
    
    const wrapper = mount(App, {
      global: {
        mocks: {
          $store: mockStore
        },
        plugins: [router]
      }
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    // Проверяем, что произошло перенаправление
    expect(router.currentRoute.value.name).toBe('DashboardMain');
  });
});