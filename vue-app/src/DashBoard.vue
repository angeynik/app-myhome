<template>
  <div class="app">
    <svg display="none">
      <!-- SVG стрелки для скрола -->
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
        
        <!-- <div class="debug-info">
          Sort: {{ currentSortType }} | 
          Room: {{ getRoomId }} ({{ getRoomKey }}) | 
          Param: {{ getParamKey }}
        </div> -->

        <svg class="header_arrow" v-show="showHeaderArrow" @click="sortingForvard">
          <use href="#arrowRight"></use>
        </svg>
        <div class="icon">menu</div>
      </div>
      <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>
      <div class="header-bottom">
        <nav>
          <router-link to="/login">Login</router-link>
          <router-link to="/dashboard">Dashboard</router-link>
          <router-link to="/smart-home">Smart Home</router-link>
          <router-link to="/manufact-automatation">Automation</router-link>
          <router-link v-if="userLevel >= 2" to="/profile">Profile</router-link>
          <router-link v-if="userLevel >= 3" to="/users">Users</router-link>
        </nav>
      </div>
    </header>

    <div class="body"
      @touchstart.passive="handleTouchStart" 
      @touchend.passive="handleTouchEnd">

      <p v-if="currentSortType === 'rooms'">Body - Сортировка по комнатам </p>
      <p v-else-if="currentSortType === 'params'">Body - Сортировка по параметрам</p>

      <div class="app-place_body" v-if="!selectedComponent" id="app_place">
        <AppPlace class="app-place_module" title="Комнаты" @select="selectComponent('Rooms')" />
        <AppPlace class="app-place_module" title="Параметры" @select="selectComponent('Params')" />
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

  computed: {
    ...mapGetters(['level', 'dID']),
    ...mapGetters('sortParams', [
      'currentSortType',
      'getRoomId',
      'getRoomKey',
      'getParamKey',
      'getRoomTitle',
      'getParamTitle'
    ]),
    userLevel() {
      return this.level || 0;
    },
    headerTitle() {
      if (!this.selectedComponent) {
        return "Главное меню";
      }
      console.log('[DashBoard] headerTitle called', {
        selectedComponent: this.selectedComponent,
        currentSortType: this.currentSortType,
        getRoomTitle: this.getRoomTitle,
        getParamTitle: this.getParamTitle,
        humanParamTitle: this.$options.computed.humanParamTitle.call(this),
      });

      if (this.selectedComponent === 'MainBody') {
        return this.currentSortType === 'rooms' 
          ? "Сортировка по комнатам - " + this.getRoomTitle
          : "Сортировка по параметрам - " + this.humanParamTitle;
      }
      return "Dashboard";
    },
  humanParamTitle() {
    const baseKey = this.getParamKey.replace(/\d+/g, '');
    const mappings = {
      'dHum': 'Влажность',
      'dTemp': 'Температура',
      'dPress': 'Давление',
      'dPower': 'Потребление',
    };
    return mappings[baseKey] || this.getParamKey;
  },
  },
  mounted() {
    this.detectDevice();
    this.initApp();
  },

  methods: {
    ...mapActions('sortParams', ['initSortParams', 'resetDefaults']),
    ...mapActions('config', ['initialize']),
    
    async initApp() {
      try {
        // Инициализируем параметры сортировки
        this.initSortParams();
        
        // Загружаем конфигурацию
        await this.initialize();
      } catch (error) {
        console.error('Ошибка инициализации:', error);
      }
    },

    selectComponent(component) {
      if (component === 'Rooms') {
        this.$store.commit('sortParams/SET_SORT_TYPE', 'rooms');
      } else if (component === 'Params') {
        this.$store.commit('sortParams/SET_SORT_TYPE', 'params');
      }
     
      this.selectedComponent = 'MainBody';
      this.showHeaderArrow = !this.isMobile;
    },

    resetSelection() {
      this.selectedComponent = null;
      this.headerTitle = 'Главное меню';
      this.showHeaderArrow = false;
    },

    detectDevice() {
      this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
    }
  }
};
</script>

<style>

</style>