<!-- DashBoard.vue -->
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
          <MainHeader :title="headerTitle" :mobile="getMobile" />
        </div>
        
        <svg class="header_arrow" v-show="showHeaderArrow" @click="sortingForvard">
          <use href="#arrowRight"></use>
        </svg>
        <div class="icon">menu</div>
      </div>
      <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>
      <div class="header-bottom">
        <nav>
          <router-link to="/">Главная</router-link>
          <router-link :to="{ name: 'DashboardSort', params: { sortType: 'rooms' } }">Комнаты</router-link>
          <router-link :to="{ name: 'DashboardSort', params: { sortType: 'params' } }">Датчики</router-link>
          <router-link :to="{ name: 'DashboardSort', params: { sortType: 'devices' } }">Устройства</router-link>
          <router-link :to="{ name: 'DashboardSort', params: { sortType: 'setpoints' } }">Уставки</router-link>
        </nav>
      </div>
    </header>

    <div class="body">
      <!-- Главное меню -->
      <div class="app-place_body" v-if="!$route.params.sortType && !$route.params.settingsType" id="app_place">
        <AppPlace class="app-place_module" title="Комнаты" @select="selectComponent('rooms')" />
        <AppPlace class="app-place_module" title="Датчики" @select="selectComponent('params')" />
        <AppPlace class="app-place_module" title="Устройства" @select="selectComponent('devices')" />
        <AppPlace class="app-place_module" title="Уставки" @select="selectComponent('setpoints')" />
      </div>

      <!-- Динамический компонент для всех типов сортировки -->
      <!-- <router-view 
        v-else :key="$route.params.sortType"
        @eventsMainBody="handleMainBodyEvent"
        @swipe-forward="sortingForvard"
        @swipe-back="sortingBack"
        ref="mainBody"
      /> -->
       <router-view 
        v-else 
        :key="componentKey"
        @eventsMainBody="handleMainBodyEvent"
        @eventsMainBodySettings="handleMainBodySettingsEvent"
        @getComponentData="getComponentData"
        @swipe-forward="handleSwipeForward"
        @swipe-back="handleSwipeBack"
        :ref="currentRef"
      />

    </div>

    <footer class="footer"> 
      <MainFooter v-show="!showFooterSetpoint"/>
      <MainSetpoint
        v-if="showFooterSetpoint"
        :setPoint="setpoint" 
        :request="request"
        :roomKey="selectedItemData.roomKey"
        :setpointKey="selectedItemData.setpointKey"
        :valueTitle="selectedItemData.title"
        @eventsMainSetpoint="editValueMainSetpoint"
        @eventsSchedule="editValueMainSetpoint"
      />
    </footer>
  </div>
</template>

<script>
import logger from './store/modules/logger.js';

import { mapGetters, mapActions} from 'vuex';
import AppPlace from './components/AppPlace.vue';
import MainHeader from './components/MainHeader.vue';
import MainFooter from './components/MainFooter.vue';
import MainSetpoint from './components/MainSetpoint.vue';

export default { 
  name: 'DashBoard',
  components: { 
    AppPlace,
    MainHeader,
    MainFooter,
    MainSetpoint
  }, 
  data() { 
    return {
      showHeaderArrow: false,
      showSetpoint: false,
      request: null,
      setpoint: null,
      selectedItemData: null
    }; 
  },
  async created() {
    const param = localStorage.getItem('paramKey');
    //console.log(' ^^^^^^^^^^^^^  -- [DashBoard] - created - roomKey:', this.getRoomKey, ' paramKey:', this.getParamKey, ' localStorageparam:', param);
    
    await this.initializeSetpointsManager();
    this.$store.commit('UPDATE_SETTINGS_DATA', { 
      field: 'room', 
      value: this.getRoomKey 
    });
    this.$store.commit('UPDATE_SETTINGS_DATA', { 
      field: 'param', 
      value: param 
    });

    // Проверка
    // console.log('[DashBoard] - created - Комната в settingsData.payload:',
    //   this.$store.state.setpointsManager?.settingsData?.payload?.room
    // );
    logger.info('[DashBoard] - created ManageSetpoints - Менеджер сетпоинтов инициализирован Актуальные данные:', 
    JSON.parse(JSON.stringify(this.$store.state.setpointsManager)));
    // console.log('[DashBoard] - created ManageSetpoints - Менеджер сетпоинтов инициализирован Актуальные данные:', 
    // JSON.parse(JSON.stringify(this.$store.state.setpointsManager)));
  },
 
  computed: {
    ...mapGetters({ // Используем корневые геттеры
      getRoomKey: 'roomKey',
      getParamKey: 'paramKey',
      getDeviceKey: 'deviceKey',
      getSetpointKey: 'setpointKey',
    }),
    ...mapGetters(['level', 'dID']),
    ...mapGetters('sortParams', [
      'updateSortKey',
      'currentSortType',
      'getRoomId',
      'getRoomTitle',
      'getParamTitle',
      'getSensorTitle',
    ]),
    ...mapGetters('config', ['getMobile', 'getDeviceType']),
    
    headerTitle() {
      const sortType = this.currentSortType;
      logger.dev(`[DashBoard] - headerTitle - Выбор заголовка для: ${sortType}`);
      //console.log('[DashBoard] - headerTitle - Выбор заголовка для sortType:', sortType);
      if (!sortType) {
        // Если это настройки
        if (this.$route.params.settingsType) {
          return "Настройки";
        }
        return "Главное меню";
      }
      
      if (sortType === 'rooms') {
        return this.getRoomKey ? `${this.getRoomTitle}` : "Сортировка по комнатам";
      } else if (sortType === 'params') {
        return this.getParamKey ? `${this.getSensorTitle(this.getParamKey)}` : "Сортировка по параметрам";
      } else if (sortType === 'devices') {
        return this.getDeviceKey ? `${this.getSensorTitle(this.getDeviceKey)}` : "Сортировка по устройствам";
      } else if (sortType === 'setpoints') {
        return this.getSetpointKey ? `${this.getSensorTitle(this.getSetpointKey)}` : "Сортировка по Уставкам";
      }
      return "Dashboard";
    },
    showFooterSetpoint() {
      return this.showSetpoint && this.setpoint !== null && this.setpoint !== undefined;
    },

    // Добавляем вычисляемые свойства для навигации
    hasParams() {
      return this.$route.params.sortType || this.$route.params.settingsType;
    },
    
    componentKey() {
      // Уникальный ключ для пересоздания компонента
      return this.$route.params.sortType || this.$route.params.settingsType || 'main';
    },
    
    currentRef() {
      // Динамическое имя ref в зависимости от типа компонента
      return this.$route.params.settingsType ? 'mainBodySettings' : 'mainBody';
    },


  },
  beforeUnmount() {
    if (this.setpointUpdateTimer) {
      clearTimeout(this.setpointUpdateTimer);
    }
  },
  watch: {
    '$route.params.sortType': {
      immediate: true,
      handler(newSortType) {
        this.handleSortTypeChange(newSortType);
      }
    },
    '$route.params.settingsType': {
      immediate: true,
      handler(newSettingsType) {
        this.handleSettingsTypeChange(newSettingsType);
      }
    },
    getConfig: {
      handler(newConfig) {
        if (newConfig) {
          logger.dev('[DashBoard] - Watch - handler - Конфигурация изменена, обновляем навигацию');
          console.log('[DashBoard] - Watch - handler - Конфигурация изменена, обновляем навигацию');
        }
      },
      deep: true
    }
  },
  methods: {
    ...mapActions('sortParams', [
      'switchSortKey',
      'UPDATE_LIMITS',
    ]),
    // ...mapActions('config', ['initialize']),
    ...mapActions('settingsConfig', ['settingsConfigUpdate']),
    ...mapActions(['initializeSetpointsManager', 'updateSettingsData','updatePayloadData', 'updateLimitsData', 'updateViewData']),
    
    handleSortTypeChange(sortType) {
      //console.log('[DashBoard] - handleSortTypeChange - Обновляем информацию для sortType: ', sortType);
      if (sortType) {
        // Устанавливаем тип сортировки в store
        this.$store.commit('sortParams/SET_SORT_TYPE', sortType);
        // Показываем стрелки для навигации (кроме уставок и на мобильных)
        this.showHeaderArrow = ['rooms', 'params', 'devices', 'setpoints'].includes(sortType) && !this.getMobile;
      } else {
        this.showHeaderArrow = false;
      }
    },
    handleSettingsTypeChange(settingsType) {
      console.log('[DashBoard] - handleSettingsTypeChange - Обновляем информацию для settingsType: ', settingsType);  
    },
    
    selectComponent(sortType) {
      //logger.info(`[DashBoard] - selectComponent - Выбор компонента: ${sortType}`);
      //console.log('[DashBoard] - selectComponent - Выбор компонента:', sortType);
      this.$router.push({ 
        name: 'DashboardSort', 
        params: { sortType } 
      });
      this.$store.commit('UPDATE_SETTINGS_DATA', { 
        field: 'room', 
        value: this.getRoomKey 
      });
      //console.log('[DashBoard] - selectComponent - Обновили комнату - ', this.getRoomKey);
      // Проверка
      // console.log('[DashBoard] - selectComponent - Комната в settingsData.payload:',
      //   this.$store.state.setpointsManager?.settingsData?.payload?.room
      // );
    },
    
    resetSelection() {
      this.$router.push({ name: 'DashboardMain' });
    },
      sortingBack() {
      const sortType = this.$route.params.sortType;
      logger.info('[DashBoard] - sortingBack - Сортировка назад', sortType);
      //console.log('[DashBoard] - sortingBack - Сортировка назад', sortType);
      this.switchSortKey({ sortingType: sortType, direction: 'prev' });
    },    
    sortingForvard() {
      const sortType = this.$route.params.sortType;
      this.switchSortKey({ sortingType: sortType, direction: 'next' });
    },

   
    // updateScheduleValue(eventData) {
    //   console.groupCollapsed('[DashBoard] - updateSetpointValue -  ');
    //   console.log('[DashBoard] - updateSetpointValue - Обработка данных от компонента MainSetpoint изменения элемента Расписания:', eventData);
    //   this.setpoint = eventData.updateState.message;

    //   console.groupEnd();
    // },







    // handleParamsChange(params) {
    //   if (params.sortType) {
    //     // Устанавливаем тип сортировки в store только для sortType
    //     this.$store.commit('sortParams/SET_SORT_TYPE', params.sortType);
    //     // Показываем стрелки для навигации (кроме уставок и на мобильных)
    //     this.showHeaderArrow = ['rooms', 'params', 'devices', 'setpoints'].includes(params.sortType) && !this.getMobile;
    //   } else if (params.settingsType) {
    //     // Для настроек скрываем стрелки или настраиваем иначе
    //     this.showHeaderArrow = false;
    //   } else {
    //     this.showHeaderArrow = false;
    //   }
    // },











    // Работа с компонентом настройки Расписания, Уведомлений и Статистики



  async editValueMainSetpoint(eventData) { // Формирует сообщение при изменении уставки и выполняет отправку этого сообщения на сервер с фиксированной задержкой
    console.groupCollapsed('[DashBoard] - editValueMainSetpoint');
    console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения Уставки :', eventData);

    let newValue = eventData.updateState.value;
    let oldValue = this.setpoint; // Сохраняем текущее значение для возможного отката

    logger.dev('[DashBoard] - editValueMainSetpoint - Обновляем значение уставки:', newValue, ' oldValue -', oldValue);
    console.log('[DashBoard] - editValueMainSetpoint - Обновляем значение уставки:', newValue, ' oldValue -', oldValue);

    const settingsData = this.$store.state.setpointsManager?.settingsData;
    let dID = this.dID;
    let roomKey = this.getRoomKey;
    let setpointKey = this.getSetpointKey;
    let requestName = eventData.updateState.request || 'unknown';
    let valueTitle = eventData.updateState.title || '';
    let value = eventData.updateState.value || '';
    let value_details = settingsData.payload.value_details || null;

    //console.log('[DashBoard] - editValueMainSetpoint - Обновляем значение уставки: requestName -', requestName, ' value_details-', value_details);

    if (!dID || !roomKey || !setpointKey) {
          logger.error(`[DashBoard] - editValueMainSetpoint - Не удалось обновить значение уставки: dID - ${dID}, roomKey - ${roomKey}, setpointKey - ${setpointKey} - не определены`);
          console.error('Не удалось обновить значение уставки: dID, roomKey или setpointKey не определены');
          return;
    }
    console.log('[DashBoard] - editValueMainSetpoint - REQUEST:', requestName);
    this.setpoint = newValue;
    let payload = null;
    switch (requestName) {
      case 'setpoints':
        console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения конфигурации - Уставка');

        // this.updatePayloadData({ value: eventData.updateState.value });
        payload = {
          room: roomKey, 
          param: setpointKey,
          value: eventData.updateState.value, 
          time: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
        };
        

        // await this.$store.dispatch('config/handleValueUpdate', { dID, payload, type: requestName });
  
      break;
      case 'schedules':
        console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения конфигурации - Расписание');
        if (value_details) {
          console.log('[DashBoard] - editValueMainSetpoint - value_details-', value_details, '--ДОПИСЫВАЕМ ОБРАБОТКУ ИЗМЕНЕНИЯ ВРЕМЕНИ --');
        }
        payload = {
          room: roomKey, 
          param: setpointKey,
          value: eventData.updateState.value, 
          time: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
        };

      break;
      case 'notifications':
        console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения конфигурации - Уведомления');
      break;
      case 'statistics':
        console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения конфигурации - Статистика');
      break;
    
      default:
        console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения конфигурации - ?????');
        break;
    }
     this.updatePayloadData({ value: value });
    logger.dev('[DashBoard] - editValueMainSetpoint - Формируем сообщение для отпраку на сервер:', payload);
    console.log('[DashBoard] - editValueMainSetpoint - Формируем сообщение для отпраку на сервер:', payload);
    console.groupEnd();
    await this.$store.dispatch('config/handleValueUpdate', { dID, payload, type: requestName });

  //  try {
  //     await this.$store.dispatch('config/handleValueUpdate', { dID, payload, type: requestName });
  //     console.log('[DashBoard] - editValueMainSetpoint - Отправлен запрос на обновление для request -', requestName, '  type -', eventData.updateState.type); 
  //   } catch (error) {
  //     logger.error('[DashBoard] - editValueMainSetpoint - Ошибка обновления уставки:', error);
  //     console.error('Ошибка обновления уставки:', error);
  //   }
     
      
    
      // Установка нового таймера для отправки на сервер
      if (this.setpointUpdateTimer) {
        clearTimeout(this.setpointUpdateTimer);
        console.log('[DashBoard] - editValueMainSetpoint - Предыдущий таймер очищен');
      }
        this.setpointUpdateTimer = setTimeout(async () => {
          try {
            logger.dev('[DashBoard] - editValueMainSetpoint - Обновляем уставку -', newValue, ' roomKey -', roomKey, ' setpointKey -', setpointKey, 'valueTitle -', valueTitle);
            console.log('[DashBoard] - editValueMainSetpoint - Обновляем уставку -', newValue, ' roomKey -', roomKey, ' setpointKey -', setpointKey, 'valueTitle -', valueTitle, 'request-', requestName);
            
        await this.$store.dispatch('config/updateSetpointServer'); // Отправляем на данные из settingsData - index.js на сервер
             
            logger.info('[DashBoard] - editValueMainSetpoint - Уставка успешно отправлена на сервер после задержки');
            //console.log('Уставка успешно отправлена на сервер после задержки');
          } catch (error) {
            logger.error('[DashBoard] - editValueMainSetpoint - Ошибка при отправке уставки на сервер:', error);
            //console.error('Ошибка при отправке уставки на сервер:', error);
            // Откат значения при ошибке
            this.setpoint = oldValue;
          }
        }, 2500);

        // Запускаем повторную сортировку через изменение флага Обновления updateView
        this.$store.commit('sortParams/SET_FORCE_UPDATE', Date.now());
        console.groupEnd();
  },









    getComponentData(event) {
      console.groupCollapsed('[DashBoard] - getComponentData - Данные от компонента:');
      console.log('Полученные данные:', event);
      // let request = event.request;
      const settingsData = this.$store.state.setpointsManager?.settingsData;
      this.selectedItemData = event.data;
      this.selectedItemData.roomKey = settingsData?.payload?.room;
      this.selectedItemData.setpointKey = settingsData?.payload?.param;
      console.log('[DashBoard] - getComponentData - Данные в settingsData ', settingsData, ' request:', settingsData.request);
      // console.log('[DashBoard] - getComponentData - Данные в settingsData ', 
      //   JSON.parse(JSON.stringify(settingsData)), 
      //   ' request:', settingsData?.request
      // );
      // console.log('[DashBoard] - getComponentData - Данные в event.request ', event.request);
      if (event.request !== null && event.request !== undefined) {
        if (event.request !== settingsData?.request) {
          console.log('[DashBoard] - getComponentData - Обновляем request в settingsData. Текущее значение -  ', settingsData?.request, ' Новое значение - ', event.request);
          this.updateSettingsData({ 
              field: 'request', 
              value: event.request
          });
        }
        
      } else console.error ('[DashBoard] - getComponentData - request не определен:', event.request);

      
      // Устанавливаем лимиты для MainSetpoint
      const request = event.request;
      if (event.action === 'show') {
        
        console.log('[DashBoard] - getComponentData - Показываем компонент MainSetpoint с данными:', this.selectedItemData);
        this.setpoint = event.data.value;
        this.showSetpoint = true;
        this.request = request;
      console.log('[DashBoard] - getComponentData - Компонент MainSetpoint показан');
      } else if (event.action === 'hide') {
        this.showSetpoint = false;
        this.selectedItemData = null;
        this.setpoint = null;
        this.request = '';
        console.log('[DashBoard] - getComponentData - Компонент MainSetpoint скрыт');
      }

      // this.showSetpoint = true;
      // this.setpoint = event.currentValue;

      console.groupEnd();
    },


  }
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>