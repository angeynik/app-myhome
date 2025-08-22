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
        @eventsMainBody="handleMainBodyEvent"
        ref="mainBody" 
      />
    </div>
  </div>

  <footer class="footer"> 
    
    <MainFooter v-show="!showFooterSetpoint"/>
    
    <MainSetpoint
      v-if="showFooterSetpoint"
      :setPoint="setpoint" 
      :highLimit="limHigh" 
      :lowLimit="limLow"
      :step="limStep"
      @eventsMainSetpoint="handleSetpointEvent"
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
import MainSetpoint from './components/MainSetpoint.vue';

export default { 
  name: 'DashBoard',

  components: { 
    AppPlace,
    MainBody,
    MainHeader,
    MainFooter,
    MainSetpoint
  }, 

  data() { 
    return {
      isMobile: false,
      showHeaderArrow: false,
      selectedComponent: null,
      showSetpoint: false,
      setpoint: 20,
      limHigh: 30,
      limLow: 10,
      limStep: 1,
      setpointUpdateTimer: null,
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
    headerTitle() {
      if (!this.selectedComponent) {
        return "Главное меню";
      }
      
      if (this.selectedComponent === 'MainBody') {
        if (this.currentSortType === 'rooms') {
          return this.getRoomKey 
            ? `${this.getRoomTitle}` 
            : "Сортировка по комнатам";
        } else {
          return this.getParamKey 
            ? `${this.getSensorTitle(this.getParamKey)}` 
            : "Сортировка по параметрам";
        }
      }
      return "Dashboard";
    },
    showFooterSetpoint() {
      return this.showSetpoint && this.setpoint !== null && this.setpoint !== undefined;
    }
  },
  beforeUnmount() {
  if (this.setpointUpdateTimer) {
    clearTimeout(this.setpointUpdateTimer);
  }
},

watch: {
    '$route.name': {
      immediate: true,
      async handler(newRoute) {
        await this.handleRouteChange(newRoute);
      }
    },
    getConfig: {
      handler(newConfig) {
        if (newConfig) {
          console.log('[DashBoard] Конфигурация изменена, обновляем навигацию');
          // this.updateNavigationData();
        }
      },
      deep: true
    }
},
  methods: {
    ...mapActions('sortParams', [
      // 'updateNavigationData', 
      'switchToPrevRoom', 
      'switchToNextRoom', 
      'switchToPrevParam', 
      'switchToNextParam']),
    ...mapActions('config', ['initialize']),
    
    async initApp() {
      //console.log('[DashBoard] - initApp - Инициализация приложения');
      try {
        // Сначала инициализируем конфиг
        //await this.initialize();
        
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
        'DashboardCommon': { component: 'MainBody', sortType: 'common' },
        'DashboardSettings': { component: 'DashboardSettings', sortType: 'settings' }
      };

      const config = routeToComponentMap[routeName];
      if (!config) return;

      this.selectedComponent = config.component;
      this.showHeaderArrow = ['DashboardRooms', 'DashboardParams'].includes(routeName) && !this.isMobile;

      if (config.sortType) {
        this.$store.commit('sortParams/SET_SORT_TYPE', config.sortType);
      }
    },
    async forceSortUpdate(type) {
      await this.$store.dispatch('sortParams/setSortType', type);
      // Принудительное обновление если уже на этом маршруте
      // if (this.$route.name === `Dashboard${type.charAt(0).toUpperCase() + type.slice(1)}`) {
      //   await this.$store.dispatch('sortParams/updateNavigationData');
      // }
    },
    async selectComponent(component) {
      // Устанавливаем тип сортировки
    await this.$store.dispatch('sortParams/setSortType', component);
    
    // Навигация
    const routeName = `Dashboard${component.charAt(0).toUpperCase() + component.slice(1)}`;
    
    // Проверяем, не находимся ли мы уже на этом маршруте
    if (this.$route.name !== routeName) {
      await this.$router.push({ name: routeName });
    } 
    // else {
    //   // Принудительное обновление если уже на этом маршруте
    //   await this.$store.dispatch('sortParams/updateNavigationData');
    // }
    },
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
        //console.log('Тип: комнаты');
        this.switchToPrevRoom();
      } else if (this.currentSortType === 'params') {
        //console.log('Тип: параметры');
        this.switchToPrevParam();
      }
      console.groupEnd();
    },
    
    sortingForvard() {
      //console.groupCollapsed('[DashBoard] - sortingForvard - Переключение на следующий элемент');
      if (this.currentSortType === 'rooms') {
        //console.log('Тип: комнаты');
        this.switchToNextRoom();
      } else if (this.currentSortType === 'params') {
        //console.log('Тип: параметры');
        this.switchToNextParam();
      }
      console.groupEnd();
    },

    // Работа с Setpoint
    handleMainBodyEvent(event) {
      //console.log('[DashBoard] handleMainBodyEvent received:', event.action);
      
      if (event.action === 'show') {
        this.selectedItemData = event.data;
        this.setpoint = event.data.setValue;
        this.showSetpoint = true;
      } 
      else if (event.action === 'hide') {

        this.showSetpoint = false;
        this.selectedItemData = null;
        this.setpoint = null;
      }
    },

    handleSetpointEvent(eventData) {
      //console.log('[DashBoard] - handleSetpointEvent - eventData:', eventData);

      if (eventData.updateState && eventData.updateState.type === 'newSetPoint') {//Обработка изменения уставки
        //console.log('[DashBoard] - handleSetpointEvent Обновление состояния - updateState', eventData.updateState.message);
        this.setpoint = eventData.updateState.message;
        // Обновляем конфигурацию
        this.updateConfigSetpoint(eventData.updateState.message);

      }  else if (eventData.error) {
        console.error('[DashBoard] - handleSetpointEvent - Ошибка из MainSetpoint:', eventData.error);
      }
    },
    async updateConfigSetpoint(newValue) {
      //console.log('[DashBoard] - updateConfigSetpoint - Начинаем обновление конфигурации');
      const oldValue = newValue; 
      try {
        const roomKey = this.getRoomKey;
        const paramKey = this.getParamKey;
        if (!roomKey || !paramKey) {
          console.error('Не выбрана комната или параметр для обновления уставки');
          return;
        }
        //console.log('[DashBoard] - updateConfigSetpoint - roomKey -', roomKey, ' paramKey -', paramKey, ' newValue -', newValue);

        // Обновляем значение в хранилище
          await this.$store.dispatch('config/updateSetpointLocal', {
            roomKey: roomKey,
            paramKey: paramKey,
            value: newValue
          });
          // Очистка предыдущего таймера
          if (this.setpointUpdateTimer) {
            clearTimeout(this.setpointUpdateTimer);
          }
          // Установка нового таймера для отправки на сервер
            this.setpointUpdateTimer = setTimeout(async () => {
              try {
                await this.$store.dispatch('config/updateSetpointServer', {
                  roomKey: roomKey,
                  paramKey: paramKey,
                  value: oldValue
                });
                //console.log('Уставка успешно отправлена на сервер после задержки');
              } catch (error) {
                console.error('Ошибка при отправке уставки на сервер:', error);
                // Откат значения при ошибке
                this.setpoint = oldValue;
              }
            }, 1500);

        // Запускаем повторную сортировку
        if (this.$refs.mainBody) {
          this.$refs.mainBody.updateView();
        }
      } catch (error) {
        console.error('Ошибка обновления уставки:', error);
      }
    },
    checkSetpointVisibility() {
      const setpointEl = document.querySelector('.setpointBlock');
      const tempEl = document.querySelector('.temp-setpoint');
      
      //console.log('showSetpoint value:', this.showSetpoint);
      //console.log('MainSetpoint element exists:', !!setpointEl);
      console.log('Temp element exists:', !!tempEl);
      
      if (setpointEl) {
        console.log('MainSetpoint visibility:', 
          window.getComputedStyle(setpointEl).display !== 'none');
      }
    }
  }
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>

