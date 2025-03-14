import { mount } from '@vue/test-utils';
import AccessDenied from '@/components/AccessDenied.vue';

describe('AccessDenied.vue', () => {
  it('matches the snapshot', () => {
    const wrapper = mount(AccessDenied);
    expect(wrapper.html()).toMatchSnapshot();
  });
});