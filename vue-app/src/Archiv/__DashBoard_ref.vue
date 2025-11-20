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
  //import { mapGetters } from 'vuex'; 
  //import CheckConfigs from './utils/transformConfigs';
  // import CalcTime from './utils/transformConfigs';
  
  import { ref, provide, computed, onMounted, onBeforeUnmount } from 'vue';
  import { useStorage } from '@vueuse/core';
  //import { useRouter } from 'vue-router';
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
    // provide() { 
    //   return { 
    //     checkConfigs: new CheckConfigs() 
    //   }; 
    // },
  
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
    setup() {
      //const router = useRouter();
      const checkConfigs = new CheckConfigs();
      
      // Реактивные переменные
      const isMobile = ref(/Mobi|Android/i.test(navigator.userAgent));
      const showHeaderArrow = ref(false);
      const changeSorting = ref(false);
      const showSetpoint = ref(false);
      const propsTitle = ref('');
      const selectedComponent = ref(null);
      const headerTitle = ref('Главное меню');
      
      // Переменные с использованием useStorage
      const setpoint = useStorage('setpoint', null);
      const room_id = useStorage('room_id', 1);
      const room_key = useStorage('room_key', 'room01');
      const room_title = useStorage('room_title', '');
      const param_id = useStorage('param_id', 0);
      const param_key = useStorage('param_key', 'Temp');
      const param_title = useStorage('param_title', '');
      
      // Состояние для WebSocket
      const socket = ref(null);
      const isSending = ref(false);
      const WSconnected = ref(false);
      const reconnectInterval = ref(2000);
      
      // Лимиты
      const limHigh = ref(null);
      const limLow = ref(null);
      const limStep = ref(null);
      
      // Данные конфигураций
      const commonConfig_val = useStorage('commonConfig', {});
      const manageConfig_val = useStorage('manageConfig', {});
      const directoryConfig = useStorage('directoryConfig', {});
      
      // Уровень пользователя
      const userLevel = useStorage('userLevel', 0);
      
      provide('checkConfigs', checkConfigs);
  
      // Вычисляемые свойства
      const isAuthenticated = computed(() => !!localStorage.getItem('token'));
  
  
          // Методы
          const initApp = () => {
        selectedComponent.value = null;
        headerTitle.value = 'Главное меню';
        room_id.value = 1;
        param_key.value = 'Temp';
        room_key.value = 'room01';
        setpoint.value = getManageValues(room_id.value, param_key.value);
      };
  
      const detectDevice = () => {
        isMobile.value = /Mobi|Android/i.test(navigator.userAgent);
      };
  
      const getManageValues = (id_room, paramKey) => {
        // Реализация метода
      };
  
      const sendLogToServer = async (type, message) => {
        try {
          await fetch(`http://${process.env.VUE_APP_HOST}:${process.env.VUE_APP_SERVER_PORT}/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, message })
          });
        } catch (error) {
          console.error('Failed to send log:', error);
        }
      };
  
      // Обработчики событий
      const selectComponent = (component) => {
        // Реализация метода
      };
  
      const resetSelection = () => {
        selectedComponent.value = null;
        headerTitle.value = 'Главное меню';
      };
  
      // Хуки жизненного цикла
      onMounted(() => {
        checkLocalStorage();
        initApp();
        detectDevice();
      });
  
      onBeforeUnmount(() => {
        if (socket.value) socket.value.close();
      });
  
      return {
        // Все реактивные переменные и методы
        isMobile,
        showHeaderArrow,
        changeSorting,
        showSetpoint,
        propsTitle,
        selectedComponent,
        headerTitle,
        setpoint,
        limHigh,
        limLow,
        limStep,
        userLevel,
        initApp,
        detectDevice,
        selectComponent,
        resetSelection,
        sendLogToServer,
        // Остальные методы и свойства
      };
    }
    };
  
  
  
  </script>
  
  <style>
  /* Ваши стили */
  </style>
  