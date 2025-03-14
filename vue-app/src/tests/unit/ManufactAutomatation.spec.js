import { mount } from '@vue/test-utils';
import ManufactAutomatation from '@/components/ManufactAutomatation.vue';

describe('ManufactAutomatation.vue', () => {
  it('matches the snapshot', () => {
    const wrapper = mount(ManufactAutomatation);
    expect(wrapper.html()).toMatchSnapshot();
  });
});