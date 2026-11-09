// src/tests/unit/IntroduceHome.spec.js
import { mount } from '@vue/test-utils';
import IntroduceHome from '@/IntroduceHome.vue';
import { createStore } from 'vuex';

describe('IntroduceHome.vue', () => {
  let mockRouter;
  const RouterLinkStub = {
    template: '<a :href="to"><slot /></a>',
    props: ['to']
  };

  beforeEach(() => {
    mockRouter = { push: jest.fn() };
  });

  it('renders all buttons', () => {
    const store = createStore({
      getters: { level: () => 0, user: () => null }
    });
    const wrapper = mount(IntroduceHome, {
      global: {
        mocks: { $store: store, $router: mockRouter },
        stubs: { RouterLink: RouterLinkStub }
      }
    });
    expect(wrapper.find('.dash').exists()).toBe(true);
    expect(wrapper.find('.home').exists()).toBe(true);
    expect(wrapper.find('.manuft').exists()).toBe(true);
  });

  it('navigates to dashboard on button click', async () => {
    const store = createStore({
      getters: { level: () => 0, user: () => null }
    });
    const wrapper = mount(IntroduceHome, {
      global: {
        mocks: { $store: store, $router: mockRouter },
        stubs: { RouterLink: RouterLinkStub }
      }
    });
    await wrapper.find('.dash').trigger('click');
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to smart-home on button click', async () => {
    const store = createStore({
      getters: { level: () => 0, user: () => null }
    });
    const wrapper = mount(IntroduceHome, {
      global: {
        mocks: { $store: store, $router: mockRouter },
        stubs: { RouterLink: RouterLinkStub }
      }
    });
    await wrapper.find('.home').trigger('click');
    expect(mockRouter.push).toHaveBeenCalledWith('/smart-home');
  });

  it('navigates to manufact-automatation on button click', async () => {
    const store = createStore({
      getters: { level: () => 0, user: () => null }
    });
    const wrapper = mount(IntroduceHome, {
      global: {
        mocks: { $store: store, $router: mockRouter },
        stubs: { RouterLink: RouterLinkStub }
      }
    });
    await wrapper.find('.manuft').trigger('click');
    expect(mockRouter.push).toHaveBeenCalledWith('/manufact-automatation');
  });

  // it('shows Profile link for level >= 2', () => {
  //   const store = createStore({
  //     getters: { level: () => 2, user: () => null }
  //   });
  //   const wrapper = mount(IntroduceHome, {
  //     global: {
  //       mocks: { $store: store, $router: mockRouter },
  //       stubs: { RouterLink: RouterLinkStub }
  //     }
  //   });
  //   expect(wrapper.find('a[href="/profile"]').exists()).toBe(true);
  // });

  it('hides Profile link for level < 2', () => {
    const store = createStore({
      getters: { level: () => 1, user: () => null }
    });
    const wrapper = mount(IntroduceHome, {
      global: {
        mocks: { $store: store, $router: mockRouter },
        stubs: { RouterLink: RouterLinkStub }
      }
    });
    expect(wrapper.find('a[href="/profile"]').exists()).toBe(false);
  });

  // it('shows Users link for level >= 3', () => {
  //   const store = createStore({
  //     getters: { level: () => 3, user: () => null }
  //   });
  //   const wrapper = mount(IntroduceHome, {
  //     global: {
  //       mocks: { $store: store, $router: mockRouter },
  //       stubs: { RouterLink: RouterLinkStub }
  //     }
  //   });
  //   expect(wrapper.find('a[href="/users"]').exists()).toBe(true);
  // });

  it('hides Users link for level < 3', () => {
    const store = createStore({
      getters: { level: () => 2, user: () => null }
    });
    const wrapper = mount(IntroduceHome, {
      global: {
        mocks: { $store: store, $router: mockRouter },
        stubs: { RouterLink: RouterLinkStub }
      }
    });
    expect(wrapper.find('a[href="/users"]').exists()).toBe(false);
  });
});