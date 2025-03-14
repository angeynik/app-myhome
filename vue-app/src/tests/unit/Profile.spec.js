import { mount } from '@vue/test-utils';
import Profile from '@/components/Profile.vue';

describe('Profile.vue', () => {
  it('matches the snapshot', () => {
    const wrapper = mount(Profile);
    expect(wrapper.html()).toMatchSnapshot();
  });
});