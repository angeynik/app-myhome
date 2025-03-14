import { mount } from '@vue/test-utils';
import UserConfig from '@/components/UserConfig.vue';

describe('UserConfig.vue', () => {
  it('matches the snapshot', () => {
    const wrapper = mount(UserConfig);
    expect(wrapper.html()).toMatchSnapshot();
  });
});