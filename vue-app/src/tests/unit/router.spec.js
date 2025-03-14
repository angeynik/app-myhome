import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import App from '@/App.vue';
import routes from '@/router/routes';

const router = createRouter({
  history: createWebHistory(),
  routes,
});

describe('Router', () => {
  it('navigates to the home page', async () => {
    router.push('/');
    await router.isReady();
    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    });
    expect(wrapper.findComponent({ name: 'IntroduceHome' }).exists()).toBe(true);
  });

  it('navigates to the dashboard page', async () => {
    router.push('/dashboard');
    await router.isReady();
    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    });
    expect(wrapper.findComponent({ name: 'DashBoard' }).exists()).toBe(true);
  });

  it('navigates to the smart home page', async () => {
    router.push('/smart-home');
    await router.isReady();
    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    });
    expect(wrapper.findComponent({ name: 'SmartHome' }).exists()).toBe(true);
  });

  it('navigates to the manufact automation page', async () => {
    router.push('/manufact-automatation');
    await router.isReady();
    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    });
    expect(wrapper.findComponent({ name: 'ManufactAutomatation' }).exists()).toBe(true);
  });

  it('navigates to the login page', async () => {
    router.push('/login');
    await router.isReady();
    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    });
    expect(wrapper.findComponent({ name: 'Login' }).exists()).toBe(true);
  });

  it('navigates to the profile page', async () => {
    router.push('/profile');
    await router.isReady();
    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    });
    expect(wrapper.findComponent({ name: 'Profile' }).exists()).toBe(true);
  });

  it('navigates to the users page', async () => {
    router.push('/users');
    await router.isReady();
    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    });
    expect(wrapper.findComponent({ name: 'Users' }).exists()).toBe(true);
  });

  it('navigates to the access denied page', async () => {
    router.push('/access-denied');
    await router.isReady();
    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    });
    expect(wrapper.findComponent({ name: 'AccessDenied' }).exists()).toBe(true);
  });
});