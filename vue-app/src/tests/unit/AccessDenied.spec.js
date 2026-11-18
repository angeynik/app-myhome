// src/tests/unit/AccessDenied.spec.js
// Страница 403: сообщение, ссылка на главную; «Авторизация» — только для гостя.

import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import AccessDenied from '@/components/AccessDenied.vue';

function mountWith(isAuthenticated) {
  const store = createStore({ getters: { isAuthenticated: () => isAuthenticated } });
  return mount(AccessDenied, {
    global: {
      plugins: [store],
      mocks: { $store: store }, // перекрывает глобальную заглушку $store из setup.js
      stubs: { TopNav: true, RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } },
    },
  });
}

describe('AccessDenied', () => {
  test('сообщение 403 и ссылка на главную', () => {
    const wrapper = mountWith(true);
    expect(wrapper.find('h1').text()).toBe('403 — Доступ запрещён');
    expect(wrapper.text()).toContain('недостаточно прав');
    expect(wrapper.find('a[href="/"]').text()).toBe('Вернуться на главную');
  });

  test('вошедшему пользователю ссылка «Авторизация» не показывается', () => {
    expect(mountWith(true).find('a[href="/login"]').exists()).toBe(false);
  });

  test('гостю показывается ссылка «Авторизация»', () => {
    expect(mountWith(false).find('a[href="/login"]').text()).toBe('Авторизация');
  });
});
