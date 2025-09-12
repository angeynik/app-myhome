import { mount } from '@vue/test-utils';
import Login from '@/components/AppLogin.vue';
import { createStore } from 'vuex';
import { createRouter, createMemoryHistory } from 'vue-router';

// 1. Создаём минимальный mock store
const store = createStore({
  getters: {
    level: () => 2,
    dID: () => 'dummy-device-id'
  },
  actions: {
    'auth/login': jest.fn().mockResolvedValue(true),
    'config/ensureConfig': jest.fn().mockResolvedValue()
  }
});

// 2. Создаём mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: []
});
router.push = jest.fn();

// 3. Монтируем компонент с плагинами и заглушками
describe('Login.vue', () => {
  it('matches the snapshot', async () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [store, router],
        stubs: {
          RouterLink: true
        }
      }
    });

    // Дожидаемся выполнения onMounted и реактивных обновлений
    await wrapper.vm.$nextTick();
    
    expect(wrapper.html()).toMatchSnapshot();
  });
});
