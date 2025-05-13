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
          
          <div class="debug-info">
            Sort: {{ currentSortType }} | 
            Room: {{ getRoomId }} ({{ getRoomKey }}) | 
            Param: {{ getParamKey }}
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
        @touchstart="handleTouchStart" 
        @touchend="handleTouchEnd">
  
        <p v-if="currentSortType === 'rooms'">Сортировка по комнатам </p>
        <p v-else-if="currentSortType === 'params'">Сортировка по параметрам</p>
  
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
  import { mapGetters, mapActions, mapMutations } from 'vuex';
  import CheckConfigs from './utils/transformConfigs';
  import AppPlace from './components/AppPlace.vue';
  import MainHeader from './components/MainHeader.vue';
  import MainFooter from './components/MainFooter.vue';
  import MainBody from './components/MainBody.vue';
  
  export default { 
    name: 'DashBoard',
    provide() { 
      return { 
        checkConfigs: new CheckConfigs() 
      }; 
    },
  
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
        changeSorting: false,
        showSetpoint: false,
        propsTitle: '',
        selectedComponent: null,
        headerTitle: "Главное меню",
        setpoint: localStorage.getItem('setpoint') || null,
        limHigh: null,
        limLow: null,
        limStep: null,
        touchStartX: 0,
        touchStartTime: 0
      }; 
    },
  
    computed: {
      ...mapGetters('sortParams', ['level', 'dID', 'getSortParams', 'getRoomId', 'getParamKey', 'getRoomKey']),
      ...mapGetters('config', ['getCommonConfig', 'getManageConfig', 'getDirectoryConfig', 'getRoomConfig', 'getSensorConfig', 'isLoading', 'error']),
  
      userLevel() {
        return this.level || 0;
      },
      userdID() {
        return this.dID;
      },
      currentSortType() {
        return this.getSortParams
      },
    },
  
    mounted() {
      this.initializeConfig();
      this.initSortParams();
      //this.checkLocalStorage();
      this.initApp();
      this.detectDevice();
    },
  
    methods: {
      ...mapActions('websocket', ['send']),
      ...mapActions('log', ['sendLogToServer']),
      ...mapActions('sortParams', ['initSortParams', 'resetDefaults']),
      ...mapMutations('sortParams', [
        'SET_ROOM_ID',
        'SET_PARAM_KEY',
        'SET_ROOM_KEY'
      ]),
      ...mapActions('config', ['initialize']),
      async initializeConfig() {
        try {
          await this.initialize()
          // Дополнительные действия после инициализации
        } catch (error) {
          console.error('Ошибка инициализации:', error)
        }
      },
      initApp() {
        this.resetDefaults()
        this.selectedComponent = null
        this.headerTitle = 'Главное меню'
        
        // Установка значений через Vuex
        this.SET_ROOM_ID(1)
        this.SET_PARAM_KEY('Temp')
        this.SET_ROOM_KEY('room01')
        
        this.setpoint = this.getManageValues(
          this.getRoomId,
          this.getParamKey
        )
      },
  
      // async checkLocalStorage() {
      //   try {
      //     if (!this.$store.state.websocket.socket || 
      //         this.$store.state.websocket.socket.readyState !== WebSocket.OPEN) {
      //       await this.$store.dispatch('websocket/connect');
      //     }
  
      //     const configs = [
      //       { name: 'commonConfig', exists: !!localStorage.getItem('commonConfig') },
      //       { name: 'manageConfig', exists: !!localStorage.getItem('manageConfig') },
      //       { name: 'directoryConfig', exists: !!localStorage.getItem('directoryConfig') }
      //     ];
  
      //     for (const config of configs) {
      //       if (!config.exists) {
      //         await this.sendServerRequest('get', 'config', this.userdID, config.name);
      //       }
      //     }
      //   } catch (error) {
      //     console.error('Ошибка инициализации конфигураций:', error);
      //     await this.sendLogToServer({
      //       type: 'error',
      //       message: `Ошибка инициализации конфигураций: ${error.message}`
      //     });
      //   }
      // },
  
      // async sendServerRequest(type, request, dIDname, configName) {
      //   try {
      //     const payload = {
      //       type,
      //       request,
      //       name: dIDname,
      //       payload: { configName }
      //     };
          
      //     const response = await this.send(payload);
          
      //     if (response.type === 'response') {
      //       localStorage.setItem(configName, JSON.stringify(response.payload));
      //       return true;
      //     }
          
      //     if (response.type === 'error') {
      //       console.error('Ошибка запроса:', response.payload?.message);
      //       return false;
      //     }
          
      //     console.error('Неверный формат ответа от сервера', response);
      //     return false;
      //   } catch (error) {
      //     console.error('Ошибка запроса:', error);
      //     await this.sendLogToServer({
      //       type: 'error',
      //       message: `WebSocket ошибка: ${error.message}`
      //     });
      //     throw error;
      //   }
      // },
  
      selectComponent(component) {
        if (component === 'Rooms') {
          this.$store.commit('sortParams/SET_SORT_TYPE', 'rooms');
        } else if (component === 'Params') {
          this.$store.commit('sortParams/SET_SORT_TYPE', 'params');
        }
       
        this.selectedComponent = 'MainBody';
        this.showHeaderArrow = !this.isMobile;
        console.log('selectedComponent:', this.selectedComponent);
        
        this.sendLogToServer({
          type: 'info',
          message: `Выбран компонент: ${this.selectedComponent}, сортировка по ${component}`
        });
      },
  
      resetSelection() {
        this.selectedComponent = null;
        this.headerTitle = 'Главное меню';
        this.showHeaderArrow = false;
      },
  
      detectDevice() {
        this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
      },
  
      getManageValues(roomId, paramKey) {
        try {
          const config = this.getManageConfig;
          console.log('manageConfig:', config);
          if (!config) {
            console.error('Не удалось получить конфигурацию manageConfig');
            return;
          }
  
          const processedParamKey = this.$options.provides.checkConfigs.checkSymbol(paramKey, 0, 'd');
          
          this.limLow = config.common?.setpoint?.[`limDown${processedParamKey}`];
          this.limHigh = config.common?.setpoint?.[`limUp${processedParamKey}`];
          this.limStep = config.common?.setpoint?.[`limStep${processedParamKey}`];
  
          return config[`room${roomId}`]?.setpoint?.[`set${processedParamKey}`];
        } catch (error) {
          console.error('Ошибка получения значений:', error);
          this.sendLogToServer({
            type: 'error',
            message: `Ошибка получения значений: ${error}`
          });
        }
      },
  
      handleTouchStart(event) {
        if (!this.selectedComponent) return;
        
        this.touchStartX = event.changedTouches[0].clientX;
        this.touchStartTime = Date.now();
      },
  
      handleTouchEnd(event) {
        if (!this.selectedComponent || Date.now() - this.touchStartTime < 600) {
          return;
        }
  
        const deltaX = event.changedTouches[0].clientX - this.touchStartX;
        if (deltaX > 100) {
          this.sortingForvard();
        } else if (deltaX < -100) {
          this.sortingBack();
        }
      },
  
      handleComponentEvent(event) {
        if (event.sendServerRequest) {
          this.sendServerRequest(
            event.sendServerRequest.type, 
            event.sendServerRequest.request, 
            event.sendServerRequest.name, 
            event.sendServerRequest.setpoint
          );
        }
        
        if (event.sendLogToServer) {
          this.sendLogToServer(event.sendLogToServer);
        }
        
        if (event.changeTitle) {
          this.headerTitle = event.changeTitle.message;
          this.propsTitle = event.changeTitle.type;
        }
        
        if (event.showSetpoint) {
          this.showSetpoint = event.showSetpoint.message;
        }
        
        if (event.selectedItem) {
          const paramKey = this.$options.provides.checkConfigs.checkSymbol(
            event.selectedItem.message.paramKey, 
            0, 
            'd'
          );
          this.setpoint = this.getManageValues(
            event.selectedItem.message.id, 
            paramKey
          );
        }
        
        if (event.newSetPoint?.message) {
          this.setpoint = event.newSetPoint.message;
        }
        
        if (event.updatePermission) {
          this.updateSetpoint();
        }
        
        if (event.updatedSorting) {
          this.changeSorting = false;
        }
      },
  
      async updateSetpoint() {
        try {
          const roomKey = localStorage.getItem('room_key');
          const paramKey = this.$options.provides.checkConfigs.checkSymbol(
            localStorage.getItem('param_key'), 
            0, 
            'd'
          );
          
          const data = { [`set${paramKey}`]: this.setpoint };
          await this.sendServerRequest('post', 'setpoint', roomKey, data);
        } catch (error) {
          console.error('Ошибка обновления уставки:', error);
        }
      },
  
      sortingBack() {
        this.updateSorting(false);
      },
  
      sortingForvard() {
        this.updateSorting(true);
      },
  
      updateSorting(forward) {
        const commonConfig = this.getCommonConfig;
        
        if (this.propsTitle === 'params') {
          const currentKey = localStorage.getItem('param_key');
          const newKey = this.$options.provides.checkConfigs.updateParamKey(
            this.$options.provides.checkConfigs.getUniqueSensorKeys(commonConfig),
            currentKey,
            forward
          );
          
          const paramTitle = commonConfig.room00.info[`d${newKey}`];
          this.headerTitle = paramTitle;
          localStorage.setItem('param_key', newKey);
          localStorage.setItem('param_title', paramTitle);
        } 
        else if (this.propsTitle === 'rooms') {
          const updated = this.$options.provides.checkConfigs.updateRoomId(
            commonConfig,
            Number(localStorage.getItem('room_id')),
            forward
          );
          
          if (updated) {
            this.headerTitle = updated.roomTitle;
            localStorage.setItem('room_title', updated.roomTitle);
            localStorage.setItem('room_id', updated.roomId);
            localStorage.setItem('room_key', updated.roomKey);
          }
        }
        
        this.changeSorting = true;
      }
    }
  };
  </script>
  
  <style>
  /* Ваши стили */
  </style>