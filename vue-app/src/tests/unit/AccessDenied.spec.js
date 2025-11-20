import { mount } from '@vue/test-utils';
import AccessDenied from '@/components/AccessDenied.vue';
import { createStore } from 'vuex';

describe('AccessDenied.vue', () => {
  let store;
  
  beforeEach(() => {
    store = createStore({
      state: {},
      getters: {
        level: () => 2,
        isAuthenticated: () => true
      }
    });
  });

  it('matches the snapshot', () => {
    const wrapper = mount(AccessDenied, {
      global: {
        plugins: [store]
      }
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});