import { mount } from '@vue/test-utils';
import Dashboard from '@/DashBoard.vue';

describe('Dashboard.vue', () => {
  it('matches the snapshot', () => {
    const wrapper = mount(Dashboard);
    expect(wrapper.html()).toMatchSnapshot();
  });
});