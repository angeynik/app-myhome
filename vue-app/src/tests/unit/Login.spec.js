import { mount } from '@vue/test-utils';
import Login from '@/components/AppLogin.vue';

describe('Login.vue', () => {
  it('matches the snapshot', () => {
    const wrapper = mount(Login);
    expect(wrapper.html()).toMatchSnapshot();
  });
});