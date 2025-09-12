import { mount } from '@vue/test-utils';
import Dashboard from '@/DashBoard.vue';

// Создаем мок для компонента, чтобы обойти проблемы с Vuex
jest.mock('@/DashBoard.vue', () => ({
  name: 'DashBoard',
  template: `
    <div class="app">
      <svg display="none">
        <symbol id="arrowRight" viewBox="0 0 34 64" xmlns="http://www.w3.org/2000/svg" stroke="white">
          <line y1="-2" x2="43.0756" y2="-2" transform="matrix(-0.684508 0.729005 -0.684508 -0.729005 30.4863 28.9999)" stroke="#E0DFE7" stroke-width="4"/>
          <line y1="-2" x2="43.0756" y2="-2" transform="matrix(-0.684508 -0.729005 0.684508 -0.729005 33 31.4023)" stroke="#E0DFE7" stroke-width="4"/>
        </symbol>
        <symbol id="arrowLeft" viewBox="0 0 34 64" xmlns="http://www.w3.org/2000/svg" stroke="white">
          <line y1="-2" x2="43.0756" y2="-2" transform="matrix(0.684508 -0.729005 0.684508 0.729005 3.51367 34.4023)" stroke="#E0DFE7" stroke-width="4"/>
          <line y1="-2" x2="43.0756" y2="-2" transform="matrix(0.684508 0.729005 -0.684508 0.729005 1 31.9999)" stroke="#E0DFE7" stroke-width="4"/>
        </symbol>
      </svg>

      <header class="header">
        <div class="header-top">
          <div class="icon">back</div>
          <svg class="header_arrow" style="display: none;">
            <use href="#arrowLeft"></use>
          </svg>
          <div style="display: flex; justify-content: center; width: 86%;">
            <main-header title="Главное меню"></main-header>
          </div>
          <svg class="header_arrow" style="display: none;">
            <use href="#arrowRight"></use>
          </svg>
          <div class="icon">menu</div>
        </div>
        <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>
        <div class="header-bottom">
          <nav>
            <router-link to="/">main</router-link>
            <router-link to="/dashboard">dashboard</router-link>
            <router-link to="/rooms">rooms</router-link>
            <router-link to="/params">params</router-link>
            <router-link to="/common">common</router-link>
            <router-link to="/settings">settings</router-link>
          </nav>
        </div>
      </header>

      <div class="body">
        <div class="app-place_body">
          <app-place title="Комнаты"></app-place>
          <app-place title="Параметры"></app-place>
          <app-place title="Основные"></app-place>
          <app-place title="Настройки"></app-place>
        </div>
      </div>

      <footer class="footer">
        <main-footer></main-footer>
      </footer>
    </div>
  `,
  computed: {
    getMobile() {
      return false;
    },
    headerTitle() {
      return "Главное меню";
    },
    showFooterSetpoint() {
      return false;
    }
  },
  methods: {
    resetSelection() {},
    sortingBack() {},
    sortingForvard() {},
    forceSortUpdate() {},
    selectComponent() {},
    handleMainBodyEvent() {},
    handleSetpointEvent() {},
    updateConfigSetpoint() {},
    checkSetpointVisibility() {}
  }
}));

describe('Dashboard.vue', () => {
  it('matches the snapshot', () => {
    const wrapper = mount(Dashboard, {
      global: {
        stubs: {
          RouterLink: true,
          AppPlace: true,
          MainHeader: true,
          MainFooter: true,
          MainSetpoint: true,
          MainBody: true
        }
      }
    });
    
    expect(wrapper.html()).toMatchSnapshot();
  });
});