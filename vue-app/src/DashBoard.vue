<template>
    <div class="app">
    <svg display="none"> // Задаем код для визуализации области скрола для изменения уставки
        <symbol id="arrowRight" 
        viewBox="0 0 34 64"  
        xmlns="http://www.w3.org/2000/svg" 
        stroke="white" 
        width="100%" 
        height="100%" 
        preserveAspectRatio="xMidYMid meet"
        >         
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(-0.684508 0.729005 -0.684508 -0.729005 30.4863 28.9999)" stroke="#E0DFE7" stroke-width="4"/>
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(-0.684508 -0.729005 0.684508 -0.729005 33 31.4023)" stroke="#E0DFE7" stroke-width="4"/>
        </symbol>
        <symbol id="arrowLeft" 
        viewBox="0 0 34 64"  
        xmlns="http://www.w3.org/2000/svg" 
        stroke="white" 
        width="100%" 
        height="100%" 
        preserveAspectRatio="xMidYMid meet"
        >         
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(0.684508 -0.729005 0.684508 0.729005 3.51367 34.4023)" stroke="#E0DFE7" stroke-width="4"/>
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(0.684508 0.729005 -0.684508 0.729005 1 31.9999)" stroke="#E0DFE7" stroke-width="4"/>
      </symbol>
    </svg>
      <!-- <header class="header">
        <div style="flex-direction: column;">
          <div class="icon" @click=this.resetSelection> back </div>
        
          <svg 
          class="header_arrow"
          v-show="showHeaderArrow"
          @click="sortingBack"
          >
            <use href="#arrowLeft"></use>
          </svg>

          <div style="display: flex; justify-content: center; width: 86%;">
            <MainHeader 
            :title="headerTitle"
            :mobile="isMobile" 
          />
          </div>

          <svg 
          class="header_arrow"
          v-show="showHeaderArrow"
          @click="sortingForvard"
          >
            <use href="#arrowRight"></use>
          </svg>

          <div class="icon"> menu </div>
        </div>
          <div>
            <nav style="margin-bottom: 20px; flex-direction: column;">
              <router-link to="/login">Login</router-link> |
              <router-link to="/dashboard">Dashboard</router-link> |
              <router-link to="/smart-home">Smart Home</router-link> |
              <router-link to="/manufact-automatation">Manufact Automation</router-link> |

              <router-link v-if="userLevel >= 2" to="/profile">Profile</router-link>

              <router-link v-if="userLevel >= 3" to="/users">Users</router-link>
            </nav>
          </div>
      </header> -->
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
      @touchstart="appTouchStart($event, 'body')" 
      @touchend="appTouchEnd($event, 'body')"
      >
      <!-- <nav>
        <router-link to="/dashboard">Dashboard</router-link> |
        <router-link to="/smart-home">Smart Home</router-link> |
        <router-link to="/manufact-automatation">Manufact Automation</router-link>
      </nav> -->

        <div class="app-place_body" v-if="!selectedComponent" id="app_place" >
          <component :is="AppPlace" />
          <AppPlace class="app-place_module" title="Комнаты" @select="selectComponent('Rooms')" />
          <AppPlace class="app-place_module" title="Параметры" @select="selectComponent('Params')" />
          <AppPlace class="app-place_module"  title="Настройки" @select="selectComponent('MainSettings')" />
          <AppPlace class="app-place_module"  title="Уведомления" @select="selectComponent('MainAlarms')" />
          <AppPlace class="app-place_module"  title="Сценарии" @select="selectComponent('MainScenarios')" />
          <AppPlace class="app-place_module"  title="Видео" @select="selectComponent('MainVideo')" />
          <AppPlace class="app-place_module"  title="Статистика" @select="selectComponent('MainStatistic')" />
          <AppPlace class="app-place_module"  title="О продукте" @select="selectComponent('MainCompany')" />
        </div>
    
        <div v-else id="app_component">
          <component
          :is="selectedComponent" 
          :propsTitle="propsTitle"
          :changeSorting="changeSorting" 
          @eventsComponent="getEventsComponent" 
          />
        </div>
      </div>

      <footer class="footer"> 
        <MainFooter v-show="!showSetpoint"/>
        <MainSetpoint
          :setPoint="setpoint" 
          :highLimit="limHigh" 
          :lowLimit="limLow"
          :step="limStep"
          @eventsComponent="getEventsComponent"
          v-show="showSetpoint"/>
      </footer>
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex';
import CheckConfigs from './utils/transformConfigs';

import MainHeader from './components/MainHeader.vue';
import MainFooter from './components/MainFooter.vue';
import MainSetpoint from './components/MainSetpoint.vue';
import AppPlace from './components/AppPlace.vue'; 
import MainBody from './components/MainBody.vue';
import MainSettings from './components/MainSettings.vue';
import MainAlarms from './components/MainAlarms.vue';
import MainScenarios from './components/MainScenarios.vue';
import MainVideo from './components/MainVideo.vue';
import MainStatistic from './components/MainStatistic.vue';
import MainCompany from './components/MainCompany.vue';
export default {
    name: 'App', 
    components: { 
    AppPlace,
    MainBody,
    MainHeader,
    MainFooter,
    MainSettings,
    MainAlarms,
    MainScenarios,
    MainVideo,
    MainStatistic,
    MainCompany,
    MainSetpoint,
    }, 
    computed: {
    ...mapGetters(['level']), // Получаем уровень доступа из Vuex
    ...mapState(['user', 'status', 'socket']),
    ...mapGetters(['isAuthenticated', 'level']),
    userLevel() {
      console.log('Уровень доступа пользователя:', this.level);
      return this.level || 0; // Если уровень не задан, считаем его равным 0
    },
    methods: {
    ...mapActions(['connectWebSocket', 'sendWSMessage', 'logout']),
    async connect() {
      try {
        await this.connectWebSocket();
        console.log('WebSocket connected successfully');
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    },
    async sendMessage() {
      try {
        const response = await this.sendWSMessage({
          type: 'exampleType',
          request: 'exampleRequest',
          payload: { key: 'value' },
        });
        console.log('Message sent successfully:', response);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    },
    mounted() {

  },
    
  },

}
</script>

<style>

</style>