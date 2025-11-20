import { mount } from '@vue/test-utils';
import IntroduceHome from '@/IntroduceHome.vue';

describe('IntroduceHome.vue', () => {
  it('matches the snapshot', () => {
    const wrapper = mount(IntroduceHome);
    expect(wrapper.html()).toMatchSnapshot();
  });
});