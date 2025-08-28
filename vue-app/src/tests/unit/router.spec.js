import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import App from '@/App.vue';

// Импортируем компоненты из корневой директории
import IntroduceHome from '@/IntroduceHome.vue';
import DashBoard from '@/DashBoard.vue';
import SmartHome from '@/SmartHome.vue';
import ManufactAutomatation from '@/ManufactAutomatation.vue';

// Моки для остальных компонентов
const Login = { template: '<div>Login</div>' };
const Profile = { template: '<div>Profile</div>' };
const Users = { template: '<div>Users</div>' };
const AccessDenied = { template: '<div>AccessDenied</div>' };

const routes = [
  { path: '/', component: IntroduceHome, name: 'IntroduceHome' },
  { path: '/dashboard', component: DashBoard, name: 'DashBoard' },
  { path: '/smart-home', component: SmartHome, name: 'SmartHome' },
  { path: '/manufact-automatation', component: ManufactAutomatation, name: 'ManufactAutomatation' },
  { path: '/login', component: Login, name: 'Login' },
  { path: '/profile', component: Profile, name: 'Profile' },
  { path: '/users', component: Users, name: 'Users' },
  { path: '/access-denied', component: AccessDenied, name: 'AccessDenied' }
];

describe('Router', () => {
  let router;
  
  beforeEach(async () => {
    router = createRouter({
      history: createWebHistory(),
      routes,
    });
  });

  it('navigates to the home page', async () => {
    router.push('/');
    await router.isReady();
    
    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    });
    
    expect(wrapper.text()).toContain('Home');
  });

  // Добавьте остальные тесты аналогичным образом
});

// import { mount } from '@vue/test-utils';
// import { createRouter, createWebHistory } from 'vue-router';
// import App from '@/App.vue';
// import routes from '@/router/routes';

// const router = createRouter({
//   history: createWebHistory(),
//   routes,
// });

// describe('Router', () => {
//   it('navigates to the home page', async () => {
//     router.push('/');
//     await router.isReady();
//     const wrapper = mount(App, {
//       global: {
//         plugins: [router],
//       },
//     });
//     expect(wrapper.findComponent({ name: 'IntroduceHome' }).exists()).toBe(true);
//   });

//   it('navigates to the dashboard page', async () => {
//     router.push('/dashboard');
//     await router.isReady();
//     const wrapper = mount(App, {
//       global: {
//         plugins: [router],
//       },
//     });
//     expect(wrapper.findComponent({ name: 'DashBoard' }).exists()).toBe(true);
//   });

//   it('navigates to the smart home page', async () => {
//     router.push('/smart-home');
//     await router.isReady();
//     const wrapper = mount(App, {
//       global: {
//         plugins: [router],
//       },
//     });
//     expect(wrapper.findComponent({ name: 'SmartHome' }).exists()).toBe(true);
//   });

//   it('navigates to the manufact automation page', async () => {
//     router.push('/manufact-automatation');
//     await router.isReady();
//     const wrapper = mount(App, {
//       global: {
//         plugins: [router],
//       },
//     });
//     expect(wrapper.findComponent({ name: 'ManufactAutomatation' }).exists()).toBe(true);
//   });

//   it('navigates to the login page', async () => {
//     router.push('/login');
//     await router.isReady();
//     const wrapper = mount(App, {
//       global: {
//         plugins: [router],
//       },
//     });
//     expect(wrapper.findComponent({ name: 'Login' }).exists()).toBe(true);
//   });

//   it('navigates to the profile page', async () => {
//     router.push('/profile');
//     await router.isReady();
//     const wrapper = mount(App, {
//       global: {
//         plugins: [router],
//       },
//     });
//     expect(wrapper.findComponent({ name: 'Profile' }).exists()).toBe(true);
//   });

//   it('navigates to the users page', async () => {
//     router.push('/users');
//     await router.isReady();
//     const wrapper = mount(App, {
//       global: {
//         plugins: [router],
//       },
//     });
//     expect(wrapper.findComponent({ name: 'Users' }).exists()).toBe(true);
//   });

//   it('navigates to the access denied page', async () => {
//     router.push('/access-denied');
//     await router.isReady();
//     const wrapper = mount(App, {
//       global: {
//         plugins: [router],
//       },
//     });
//     expect(wrapper.findComponent({ name: 'AccessDenied' }).exists()).toBe(true);
//   });
// });