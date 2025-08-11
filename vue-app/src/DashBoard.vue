<template>
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
        <div class="icon" @click="resetSelection">back</div>
        <svg class="header_arrow" v-show="showHeaderArrow" @click="sortingBack">
          <use href="#arrowLeft"></use>
        </svg>
        <div style="display: flex; justify-content: center; width: 86%;">
          <MainHeader :title="headerTitle" :mobile="isMobile" />
        </div>
        
        <svg class="header_arrow" v-show="showHeaderArrow" @click="sortingForvard">
          <use href="#arrowRight"></use>
        </svg>
        <div class="icon">menu</div>
      </div>
      <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>
      <div class="header-bottom">

        <nav>
          <router-link to="/"> main  </router-link>
          <router-link :to="{ name: 'DashBoard' }"> dashboard</router-link>
          <router-link :to="{ name: 'DashboardRooms' }" @click.prevent="forceSortUpdate('rooms')"> rooms </router-link>
          <router-link :to="{ name: 'DashboardParams' }" @click.prevent="forceSortUpdate('params')"> params </router-link>
          <router-link :to="{ name: 'DashboardCommon' }" @click.prevent="forceSortUpdate('common')">common</router-link>
          <router-link :to="{ name: 'DashboardSettings' }">settings</router-link>
        </nav>

      <!-- <nav>
        <router-link to="/">main  </router-link>
        <router-link :to="{ name: 'DashBoard' }"> dashboard </router-link>
        <router-link :to="{ name: 'DashboardRooms' }">rooms</router-link>
        <router-link :to="{ name: 'DashboardParams' }">params</router-link>
        <router-link :to="{ name: 'DashboardCommon' }">common</router-link>
        <router-link :to="{ name: 'DashboardSettings' }">settings</router-link>
      </nav> -->
      </div>
    </header>

  <div class="body"
    @touchstart.passive="handleTouchStart" 
    @touchend.passive="handleTouchEnd">

    <div class="app-place_body" v-if="!selectedComponent" id="app_place">
      <AppPlace class="app-place_module" title="Комнаты" @select="selectComponent('rooms')" />
      <AppPlace class="app-place_module" title="Параметры" @select="selectComponent('params')" />
      <AppPlace class="app-place_module" title="Основные" @select="selectComponent('common')" />
      <AppPlace class="app-place_module" title="Настройки" @select="selectComponent('settings')" />
    </div>
    
    <div v-else id="app_component">
      <component
        :is="selectedComponent" 
        :propsTitle="propsTitle"
        :changeSorting="changeSorting" 
        @eventsComponent="handleComponentEvent" 
      />
    </div>
  </div>

    <footer class="footer"> 
      <MainFooter v-show="!showSetpoint"/>
      <MainSetpoint
        v-if="showSetpoint"
        :setPoint="setpoint" 
        :highLimit="limHigh" 
        :lowLimit="limLow"
        :step="limStep"
        @eventsComponent="handleComponentEvent"
      />
    </footer>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import AppPlace from './components/AppPlace.vue';
import MainHeader from './components/MainHeader.vue';
import MainFooter from './components/MainFooter.vue';
import MainBody from './components/MainBody.vue';

export default { 
  name: 'DashBoard',

  components: { 
    AppPlace,
    MainBody,
    MainHeader,
    MainFooter
  }, 

  data() { 
    return {
      isMobile: false,
      showHeaderArrow: false,
      selectedComponent: null,
    }; 
  },
  async created() {
    await this.initApp();
    await this.detectDevice();
  },
  computed: {
    ...mapGetters(['level', 'dID']),
    ...mapGetters('sortParams', [
      'currentSortType',
      'getRoomId',
      'getRoomKey',
      'getParamKey',
      'getRoomTitle',
      'getParamTitle',
      'getSensorTitle',
    ]),
    userLevel() {
      return this.level || 0;
    },
    // headerTitle() {
    //   if (!this.selectedComponent) {
    //     return "Главное меню";
    //   }
      
    //   if (this.selectedComponent === 'MainBody') {
    //     return this.currentSortType === 'rooms' 
    //       ? "Сортировка по комнатам - " + this.getRoomTitle
    //       : "Сортировка по параметрам - " + this.getSensorTitle(this.getParamKey);
    //   }
    //   return "Dashboard";
    // },
    headerTitle() {
      if (!this.selectedComponent) {
        return "Главное меню";
      }
      
      if (this.selectedComponent === 'MainBody') {
        if (this.currentSortType === 'rooms') {
          return this.getRoomKey 
            ? `Сортировка по комнатам - ${this.getRoomTitle}` 
            : "Сортировка по комнатам";
        } else {
          return this.getParamKey 
            ? `Сортировка по параметрам - ${this.getSensorTitle(this.getParamKey)}` 
            : "Сортировка по параметрам";
        }
      }
      return "Dashboard";
    },
  },

watch: {
    '$route.name': {
      immediate: true,
      async handler(newRoute) {
        await this.handleRouteChange(newRoute);
      }
    },
  // '$route.name'(newRoute) {
  //   if (newRoute === 'DashBoard') {
  //     this.selectedComponent = null;
  //     this.showHeaderArrow = false;
  //   } else if (newRoute === 'DashboardRooms') {
  //     this.$store.commit('sortParams/SET_SORT_TYPE', 'rooms');
  //     this.selectedComponent = 'MainBody';
  //   } else if (newRoute === 'DashboardParams') {
  //     this.$store.commit('sortParams/SET_SORT_TYPE', 'params');
  //     this.selectedComponent = 'MainBody';
  //   }
  //   this.showHeaderArrow = ['DashboardRooms', 'DashboardParams'].includes(newRoute) && !this.isMobile;
  // },
    getConfig: {
      handler(newConfig) {
        if (newConfig) {
          console.log('[DashBoard] Конфигурация изменена, обновляем навигацию');
          this.updateNavigationData();
        }
      },
      deep: true
    }
},
  methods: {
    ...mapActions('sortParams', [
      'updateNavigationData', 
      'switchToPrevRoom', 
      'switchToNextRoom', 
      'switchToPrevParam', 
      'switchToNextParam']),
    ...mapActions('config', ['initialize']),
    
    async initApp() {
      console.log('[DashBoard] - initApp - Инициализация приложения');
      try {
        // Сначала инициализируем конфиг
        await this.initialize();
        
        // Обновляем маршрут если нужно
        await this.handleRouteChange(this.$route.name);
      } catch (error) {
        console.error('Ошибка инициализации:', error);
      }
    },
     async handleRouteChange(routeName) {
      if (routeName === 'DashBoard') {
        this.resetSelection();
        return;
      }

      const routeToComponentMap = {
        'DashboardRooms': { component: 'MainBody', sortType: 'rooms' },
        'DashboardParams': { component: 'MainBody', sortType: 'params' },
        'DashboardCommon': { component: 'DashboardCommon', sortType: null },
        'DashboardSettings': { component: 'DashboardSettings', sortType: null }
      };

      const config = routeToComponentMap[routeName];
      if (!config) return;

      this.selectedComponent = config.component;
      this.showHeaderArrow = ['DashboardRooms', 'DashboardParams'].includes(routeName) && !this.isMobile;

      if (config.sortType) {
        this.$store.commit('sortParams/SET_SORT_TYPE', config.sortType);
        // Автоматически выбираем первую доступную комнату/параметр
        await this.$store.dispatch('sortParams/updateNavigationData');
      }
    },
    async forceSortUpdate(type) {
      await this.$store.dispatch('sortParams/setSortType', type);
      // Принудительное обновление если уже на этом маршруте
      if (this.$route.name === `Dashboard${type.charAt(0).toUpperCase() + type.slice(1)}`) {
        await this.$store.dispatch('sortParams/updateNavigationData');
      }
    },
    async selectComponent(component) {
      // const componentToRouteMap = {
      //   'rooms': 'DashboardRooms',
      //   'params': 'DashboardParams',
      //   'common': 'DashboardCommon',
      //   'settings': 'DashboardSettings'
      // };

      // if (componentToRouteMap[component]) {
      //   this.$router.push({ name: componentToRouteMap[component] });
      // }
      // Устанавливаем тип сортировки
    await this.$store.dispatch('sortParams/setSortType', component);
    
    // Навигация
    const routeName = `Dashboard${component.charAt(0).toUpperCase() + component.slice(1)}`;
    
    // Проверяем, не находимся ли мы уже на этом маршруте
    if (this.$route.name !== routeName) {
      await this.$router.push({ name: routeName });
    } else {
      // Принудительное обновление если уже на этом маршруте
      await this.$store.dispatch('sortParams/updateNavigationData');
    }
    },
    // selectComponent(component) {
    //   if (component === 'rooms') {
    //     this.$router.push({ name: 'DashboardRooms' });
    //   } else if (component === 'params') {
    //     this.$router.push({ name: 'DashboardParams' });
    //   } else if (component === 'common') {
    //     this.$router.push({ name: 'DashboardCommon' });
    //   } else if (component === 'settings') {
    //     this.$router.push({ name: 'DashboardSettings' });
    //   }
      
    //   // Для основного состояния (DashboardMain) ничего не делаем
    //   this.selectedComponent = ['rooms', 'params', 'common', 'settings'].includes(component) ? 'MainBody' : null;
    //   this.showHeaderArrow = ['rooms', 'params', 'common', 'settings'].includes(component) && !this.isMobile;
    // },
    resetSelection() {
      this.selectedComponent = null;
      this.showHeaderArrow = false;
    },

    detectDevice() {
      this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
      console.log('[DashBoard] - detectDevice - Работаем с мобильным устройством - ', this.isMobile);
    },
    sortingBack() {
      //console.groupCollapsed('[DashBoard] - sortingBack - Переключение на предыдущий элемент');
      if (this.currentSortType === 'rooms') {
        console.log('Тип: комнаты');
        this.switchToPrevRoom();
      } else if (this.currentSortType === 'params') {
        console.log('Тип: параметры');
        this.switchToPrevParam();
      }
      console.groupEnd();
    },
    
    sortingForvard() {
      //console.groupCollapsed('[DashBoard] - sortingForvard - Переключение на следующий элемент');
      if (this.currentSortType === 'rooms') {
        console.log('Тип: комнаты');
        this.switchToNextRoom();
      } else if (this.currentSortType === 'params') {
        console.log('Тип: параметры');
        this.switchToNextParam();
      }
      console.groupEnd();
    },
  }
};
</script>

<style lang="css" src="./assets/mainStyle.css"></style>