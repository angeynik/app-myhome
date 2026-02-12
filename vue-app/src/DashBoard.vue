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
        @edit-value-MainSetpoint="editValueMainSetpoint"
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
        :editType="editType"
        :roomKey="selectedItemData.roomKey"
        :setpointKey="selectedItemData.setpointKey"
        @eventsMainSetpoint="updateConfigSetpoint"
        @eventsSchedule="updateScheduleValue"
      />
    </footer>
  </div>
</template>

<script>
import logger from './store/modules/logger.js';

import { mapGetters, mapActions, mapMutations } from 'vuex';
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
      editType: null,
      setpoint: null,
      selectedItemData: null
    }; 
  },
  async created() {
    console.log('[DashBoard] - created - roomKey:', this.getRoomKey, ' paramKey:', this.getParamKey);
    await this.initializeSetpointsManager();
    this.updateSettingsData({ room: this.getRoomKey});
    logger.info('[DashBoard] - created ManageSetpoints - Менеджер сетпоинтов инициализирован Актуальные данные:', 
    JSON.parse(JSON.stringify(this.$store.state.setpointsManager)));
    console.log('[DashBoard] - created ManageSetpoints - Менеджер сетпоинтов инициализирован Актуальные данные:', 
    JSON.parse(JSON.stringify(this.$store.state.setpointsManager)));
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
    ...mapGetters('config', ['getMobile', 'getDeviceType', 'clearKeySync']),
    
    headerTitle() {
      const sortType = this.currentSortType;
      logger.dev(`[DashBoard] - headerTitle - Выбор заголовка для: ${sortType}`);
      console.log('[DashBoard] - headerTitle - Выбор заголовка для sortType:', sortType);
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
    ...mapMutations({
      SET_ROOM_KEY: 'SET_ROOM_KEY',
      SET_PARAM_KEY: 'SET_PARAM_KEY', 
      SET_DEVICE_KEY: 'SET_DEVICE_KEY', 
      SET_SETPOINT_KEY: 'SET_SETPOINT_KEY' 
    }),
    ...mapActions('sortParams', [
      'switchSortKey',
      'UPDATE_LIMITS',
    ]),
    // ...mapActions('config', ['initialize']),
    ...mapActions('settingsConfig', ['settingsConfigUpdate']),
    ...mapActions(['initializeSetpointsManager', 'updateSettingsData']),
    
    handleSortTypeChange(sortType) {
      console.log('[DashBoard] - handleSortTypeChange - Обновляем информацию для sortType: ', sortType);
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
      console.log('[DashBoard] - selectComponent - Выбор компонента:', sortType);
      this.$router.push({ 
        name: 'DashboardSort', 
        params: { sortType } 
      });
      this.updateSettingsData({ room: this.getRoomKey });
      console.log('[DashBoard] - selectComponent - Комната в settingsData:',
      this.$store.state.setpointsManager?.settingsData?.payload?.room
      );
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

    // Работа с Setpoint
    // handleMainBodyEvent(event) {
    //   logger.dev('[DashBoard] - handleMainBodyEvent received:', event);
    //   console.log('[DashBoard] - handleMainBodyEvent received:', event);
      
    //   if (event.action === 'show') {
    //     this.selectedItemData = event.data;
    //     this.setpoint = event.data.setValue;
    //     this.showSetpoint = true;
    //     this.editType = 'setpoint';
    //     this.setLimits(event.data.paramKey);
    //   } else if (event.action === 'hide') {
    //     this.showSetpoint = false;
    //     this.selectedItemData = null;
    //     this.setpoint = null;
    //     this.editType = '';
    //   }
    // },

    // updateSetpointValue(eventData) {
    //   //console.groupCollapsed('[DashBoard] - updateSetpointValue -  ');
    //   //console.log('[DashBoard] - updateSetpointValue - Обработка данных от компонента MainSetpoint изменения Уставки :', eventData);
    //   if (eventData.updateState && eventData.updateState.type === 'newSetPoint') {
    //     console.log('[DashBoard] - updateSetpointValue - Обновляем значение уставки', eventData);
    //     this.setpoint = eventData.updateState.message;
    //     this.updateConfigSetpoint(eventData.updateState.message);
    //   } else if (eventData.error) {
    //     logger.error('[DashBoard] - updateSetpointValue - Ошибка:', eventData.error);
    //     //console.error('[DashBoard] - updateSetpointValue - Ошибка:', eventData.error);
    //   }
    //   //console.groupEnd();
    // },
   
    updateScheduleValue(eventData) {
      console.groupCollapsed('[DashBoard] - updateSetpointValue -  ');
      console.log('[DashBoard] - updateSetpointValue - Обработка данных от компонента MainSetpoint изменения элемента Расписания:', eventData);
      this.setpoint = eventData.updateState.message;

      console.groupEnd();
    },




  async updateConfigSetpoint(eventData) {
    let newValue = eventData.updateState.message;
    let oldValue = this.setpoint; // Сохраняем текущее значение для возможного отката

    logger.dev('[DashBoard] - updateConfigSetpoint - Обновляем значение уставки:', newValue, ' oldValue -', oldValue);
    //console.log('[DashBoard] - updateConfigSetpoint - Обновляем значение уставки:', newValue, ' oldValue -', oldValue);

    let dID = this.dID;
    let roomKey = this.selectedItemData.roomKey;
    let setpointKey = this.selectedItemData.setpointKey;
    let requestName = '';

    if (!dID || !roomKey || !setpointKey) {
          logger.error(`[DashBoard] - updateConfigSetpoint - Не удалось обновить значение уставки: dID - ${dID}, roomKey - ${roomKey}, setpointKey - ${setpointKey} - не определены`);
          console.error('Не удалось обновить значение уставки: dID, roomKey или setpointKey не определены');
          return;
    }
      
    
     
      try {
        const timestamp = new Date().toString();
        const payload = {
          room: roomKey, 
          item_name: setpointKey,
          item_value: eventData.updateState.message, 
          time: timestamp
        };
        this.setpoint = newValue;
        logger.dev('[DashBoard] - updateConfigSetpoint - Формируем сообщение для отпраку на сервер:', payload);
        console.log('[DashBoard] - updateConfigSetpoint - Формируем сообщение для отпраку на сервер:', payload); 

        if (eventData.updateState && eventData.updateState.type === 'newSetPoint') {

          requestName = 'setpoints';
          // Обновляем конфигурацию в store config
          await this.$store.dispatch('config/handleSensorUpdate', { dID, payload, type: requestName });
        }
        if (eventData.updateState && eventData.updateState.type === 'newScheduelSetPoint') {
          
          requestName = 'schedule_setpoints';
          // Обновляем конфигурацию в store settingsConfig.js
          console.log('[DashBoard] - updateConfigSetpoint - Обновляем конфигурацию в store settingsConfig.js');
          await this.$store.dispatch('settingsConfig/settingsConfigUpdate', { dID, payload, type: requestName });
        }
        console.log('[DashBoard] - updateConfigSetpoint - Отправлен запрос на обновление для request -', requestName, '  type -', eventData.updateState.type);
        
        
      } catch (error) {
        logger.error('[DashBoard] - updateConfigSetpoint - Ошибка обновления уставки:', error);
        //console.error('Ошибка обновления уставки:', error);
      }
      console.groupEnd();
    
      // Установка нового таймера для отправки на сервер
        this.setpointUpdateTimer = setTimeout(async () => {
          try {
            logger.dev('[DashBoard] - updateConfigSetpoint - Обновляем уставку -', newValue, ' roomKey -', roomKey, ' paramKey -', setpointKey);
            console.log('[DashBoard] - updateConfigSetpoint - Обновляем уставку -', newValue, ' roomKey -', roomKey, ' paramKey -', setpointKey);
            await this.$store.dispatch('config/updateSetpointServer', {
              roomKey: roomKey,
              paramKey: setpointKey,
              value: newValue,
              req: requestName, 
            });
            logger.info('[DashBoard] - updateConfigSetpoint - Уставка успешно отправлена на сервер после задержки');
            //console.log('Уставка успешно отправлена на сервер после задержки');
          } catch (error) {
            logger.error('[DashBoard] - updateConfigSetpoint - Ошибка при отправке уставки на сервер:', error);
            //console.error('Ошибка при отправке уставки на сервер:', error);
            // Откат значения при ошибке
            this.setpoint = oldValue;
          }
        }, 1500);

        // Запускаем повторную сортировку через изменение флага Обновления updateView
        this.$store.commit('sortParams/SET_FORCE_UPDATE', Date.now());
    },

    async _updateConfigSetpoint(eventData) {

      const oldValue = this.setpoint; // Сохраняем текущее значение для возможного отката
      const newValue = eventData.updateState.message;
      this.setpoint = newValue;
      try {
        const dID = this.dID; // Используем геттер из computed
        const sortType = this.currentSortType;
        const dKey = this.getDeviceKey; // Используем геттер
        const pKey = this.getParamKey;
        console.log('[DashBoard] - updateConfigSetpoint - Обновляем значение уставки:', newValue, ' sortType -', sortType, ' dKey -', dKey, ' pKey -', pKey);

        const deviceKey = 's' + this.clearKeySync(dKey);
        const paramKey = 's' +  this.clearKeySync(pKey);
        logger.info('[DashBoard] - updateConfigSetpoint - sortType -', sortType, paramKey, deviceKey);
        //console.log('[DashBoard] - updateConfigSetpoint - sortType -', sortType, paramKey, deviceKey);
        let Key = '';
        
        if (sortType === 'devices') {
          Key = deviceKey ; 
        } else {
          Key = paramKey;
        }
        
        const roomKey = this.getRoomKey;
        const timestamp = new Date().toString();
        const payload = {
          room: roomKey, 
          item_name: Key,
          item_value: newValue, 
          time: timestamp
        };
        logger.info('[DashBoard] - updateConfigSetpoint - Начинаем обновление Уставки -', newValue, ' roomKey -', roomKey, ' Key -', Key);
        console.log('[DashBoard] - updateConfigSetpoint - Начинаем обновление Уставки -', newValue, ' roomKey -', roomKey, ' Key -', Key);
        
        if (!dID || !roomKey || !paramKey) {
          logger.error('[DashBoard] - updateConfigSetpoint - Не выбрана комната или параметр для обновления уставки');
          //console.error('Не выбрана комната или параметр для обновления уставки');
          return;
        }

        // Обновляем конфигурацию в store
        await this.$store.dispatch('config/handleSensorUpdate', { dID, payload, type: 'setpoints' });

        // Очистка предыдущего таймера
        if (this.setpointUpdateTimer) {
          clearTimeout(this.setpointUpdateTimer);
        }
        
        // Установка нового таймера для отправки на сервер
        this.setpointUpdateTimer = setTimeout(async () => {
          try {
            logger.dev('[DashBoard] - updateConfigSetpoint - Обновляем уставку -', newValue, ' roomKey -', roomKey, ' paramKey -', paramKey);
            //console.log('[DashBoard] - updateConfigSetpoint - Обновляем уставку -', newValue, ' roomKey -', roomKey, ' paramKey -', paramKey);
            await this.$store.dispatch('config/updateSetpointServer', {
              roomKey: roomKey,
              paramKey: paramKey,
              value: newValue
            });
            logger.info('[DashBoard] - updateConfigSetpoint - Уставка успешно отправлена на сервер после задержки');
            //console.log('Уставка успешно отправлена на сервер после задержки');
          } catch (error) {
            logger.error('[DashBoard] - updateConfigSetpoint - Ошибка при отправке уставки на сервер:', error);
            //console.error('Ошибка при отправке уставки на сервер:', error);
            // Откат значения при ошибке
            this.setpoint = oldValue;
          }
        }, 1500);

        // Запускаем повторную сортировку через изменение флага Обновления updateView
        this.$store.commit('sortParams/SET_FORCE_UPDATE', Date.now());
      } catch (error) {
        logger.error('[DashBoard] - updateConfigSetpoint - Ошибка обновления уставки:', error);
        //console.error('Ошибка обновления уставки:', error);
      }
    },

    handleParamsChange(params) {
      if (params.sortType) {
        // Устанавливаем тип сортировки в store только для sortType
        this.$store.commit('sortParams/SET_SORT_TYPE', params.sortType);
        // Показываем стрелки для навигации (кроме уставок и на мобильных)
        this.showHeaderArrow = ['rooms', 'params', 'devices', 'setpoints'].includes(params.sortType) && !this.getMobile;
      } else if (params.settingsType) {
        // Для настроек скрываем стрелки или настраиваем иначе
        this.showHeaderArrow = false;
      } else {
        this.showHeaderArrow = false;
      }
    },





    // Работа с компонентом настройки Расписания, Уведомлений и Статистики
    editValueMainSetpoint(event) {
      console.groupCollapsed('[DashBoard] - editValueMainSetpoint received:');
      console.log('Полученные данные:', event);

      // Устанавливаем лимиты для MainSetpoint
      const editType = event.editType;
      if (event.action === 'show') {
        this.selectedItemData = event.data;
        this.setpoint = event.data.setValue;
        this.showSetpoint = true;
        this.editType = editType;
          if (event.limits) {
            this.$store.commit('sortParams/UPDATE_LIMITS', event.limits);
          }
          console.log('[DashBoard] - editValueMainSetpoint - Компонент MainSetpoint показан, лимиты устанавливает');
      } else if (event.action === 'hide') {
        this.showSetpoint = false;
        this.selectedItemData = null;
        this.setpoint = null;
        this.editType = '';
        console.log('[DashBoard] - editValueMainSetpoint - Компонент MainSetpoint скрыт');
      }

      // this.showSetpoint = true;
      // this.setpoint = event.currentValue;

      console.groupEnd();
    },






    
    // handleMainBodySettingsEvent(event) {
    //   console.groupCollapsed('[DashBoard] - handleMainBodySettingsEvent received:');
    //   console.log('Полученные данные:', event);

    //   // Проверяем, что это объект с данными расписания
    //   if (event && event.id && event.roomKey) {
    //     console.log(' --- [DashBoard] - Редактирование значения расписания');
        
    //     // Сохраняем данные редактирования в отдельную переменную
    //     this.editingSchedule = {
    //       id: event.id,
    //       roomKey: event.roomKey,
    //       paramKey: event.paramKey,
    //       currentValue: event.currentValue,
    //       limits: event.limits,
    //       type: event.type
    //     };
        
    //     // Устанавливаем лимиты для MainSetpoint
    //     if (event.limits) {
    //       this.$store.commit('sortParams/UPDATE_LIMITS', event.limits);
    //     }
        
    //     // Показываем MainSetpoint с начальным значением
    //     this.showSetpoint = true;
    //     this.setpoint = event.currentValue;
        
    //     console.log('[DashBoard] - Режим редактирования расписания активирован:', this.editingSchedule);
    //   } else {
    //     console.log('[DashBoard] - Неизвестное событие:', event);
    //   }
      
    //   console.groupEnd();
    // },


  }
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>