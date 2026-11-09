import { mount } from '@vue/test-utils';
import SmartHome from '@/SmartHome.vue';

describe('SmartHome.vue', () => {
  it('matches the snapshot', () => {
    const wrapper = mount(SmartHome);
    expect(wrapper.html()).toMatchSnapshot();
  });
});