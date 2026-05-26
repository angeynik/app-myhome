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
        @eventsMainBodySettings="handlePermitEvent"
        @getComponentData="getComponentData"
        @updateTypeValue="editValueMainSetpoint"
        @swipe-forward="handleSwipeForward"
        @swipe-back="handleSwipeBack"
        :ref="currentRef"
      />

    </div>

    <footer class="footer"> 
      <MainFooter v-show="!showFooterSetpoint"/>
      <MainSetpoint
        ref="mainSetpoint" 
        v-if="showFooterSetpoint"
        :setPoint="setpoint" 
        :request="request"
        :roomKey="selectedItemData.roomKey"
        :setpointKey="selectedItemData.setpointKey"
        :valueTitle="selectedItemData.valueTitle"
        @eventsMainSetpoint="editValueMainSetpoint"
        @eventsSchedule="editValueMainSetpoint"
      />
    </footer>
    <InputDialog
      :visible="manualInputDialog.visible"
      :title="manualInputDialog.title"
      :initial-value="manualInputDialog.initialValue"
      :type="manualInputDialog.type"
      @confirm="onManualInputConfirm"
      @cancel="closeManualInputDialog"
    />
  </div>
</template>

<script>
import logger from './store/modules/logger.js';

import { mapGetters, mapActions} from 'vuex';
import AppPlace from './components/AppPlace.vue';
import MainHeader from './components/MainHeader.vue';
import MainFooter from './components/MainFooter.vue';
import MainSetpoint from './components/MainSetpoint.vue';
import InputDialog from './components/InputDialog.vue';
import { nowMoscow, createTimePoint } from '@/utils/timeUtils';

export default { 
  name: 'DashBoard',
  components: { 
    AppPlace,
    MainHeader,
    MainFooter,
    MainSetpoint,
    InputDialog,
  }, 
  provide() {
    return {
      getMainSetpointEl: () => this.$refs.mainSetpoint?.$el ?? null
    };
  },
  data() { 
    return {
      showHeaderArrow: false,
      showSetpoint: false,
      request: null,
      setpoint: null,
      selectedItemData: {},
      handlePermit: false,
      manualInputDialog: {
        visible: false,
        title: '',
        initialValue: null,
        type: 'number',    // 'number' или 'time'
        callback: null,    // функция, которая будет вызвана с новым значением
      },
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
    createTimePoint,
    nowMoscow,
    ...mapActions('sortParams', [
      'switchSortKey',
      'UPDATE_LIMITS',
    ]),
    // ...mapActions('config', ['initialize']),
    ...mapActions('settingsConfig', ['settingsConfigUpdate', 'checkScheduleOverlap']),
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



    // Работа с компонентом настройки Расписания, Уведомлений и Статистики



  async editValueMainSetpoint(eventData) { // Формирует сообщение при изменении уставки и выполняет отправку этого сообщения на сервер с фиксированной задержкой
    console.groupCollapsed('[DashBoard] - editValueMainSetpoint');
    console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения Уставки :', eventData);
    const settingsData = this.$store.state.setpointsManager?.settingsData;
    //console.log('[DashBoard] - editValueMainSetpoint - Текущие settingsData:', settingsData);

    let dID = this.dID;
    let roomKey = this.getRoomKey;
    let setpointKey = this.getSetpointKey;
    let requestName = eventData.updateState.request || 'unknown';
    let valueTitle = eventData.updateState.title || '';
    let value = eventData.updateState.value || '';
    let value_details = settingsData.payload.value_details || null;
    const value_type = settingsData.payload.value_type || 'absolute';

    if (!dID || !roomKey || !setpointKey) {
          logger.error(`[DashBoard] - editValueMainSetpoint - Не удалось обновить значение уставки: dID - ${dID}, roomKey - ${roomKey}, setpointKey - ${setpointKey} - не определены`);
          console.error('Не удалось обновить значение уставки: dID, roomKey или setpointKey не определены');
          return;
    }
    console.log('[DashBoard] - editValueMainSetpoint - REQUEST:', requestName, 'valueTitle -', valueTitle, 'value_type -', value_type);

    let oldValue, newValue, payload;
    try {
      oldValue = this.setpoint;
      if (valueTitle === 'startTime' || valueTitle === 'endTime') {
        value = parseFloat(eventData.updateState.value).toFixed(0);
      } else if (value_type === 'deviation') {
        value = parseFloat(eventData.updateState.value).toFixed(2);
      }
      else {
        value = parseFloat(eventData.updateState.value).toFixed(1);
      }
    this.setpoint = value;
    console.log('[DashBoard] - editValueMainSetpoint - Обновляем значение уставки:', this.setpoint);
    logger.dev('[DashBoard] - editValueMainSetpoint - Обновляем значение уставки:', value, ' oldValue -', oldValue);
    //console.log('[DashBoard] - editValueMainSetpoint - Обновляем значение уставки:', value, ' oldValue -', oldValue);
    console.groupEnd();

    
    switch (requestName) {
      case 'setpoints':
        console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения конфигурации - Уставка');
        payload = {
          room: roomKey, 
          param: setpointKey,
          value: value, 
          time: nowMoscow()
        };
        newValue = value;
        
      break;
      case 'schedules':
        console.log('[DashBoard] - editValueMainSetpoint -- case schedules -- Обработка данных от компонента MainSetpoint изменения конфигурации - Расписание');
        if (value_details === 'minutes' || value_details === 'hours') {
          //console.log('[DashBoard] - editValueMainSetpoint - value_details -', value_details);
          const settingsConfigUpdate = await this.$store.dispatch('settingsConfig/settingsConfigUpdate', {newValue: value, value_details});
          console.log('[DashBoard] - editValueMainSetpoint -- case schedules -- Результат проверки:', settingsConfigUpdate);
          if (settingsConfigUpdate.hasOverlap) {
          
            // Отображаем Уведомление для пользователя - PopupMenu.vue 
          this.$store.dispatch('popup/show', {
            message: `-- case schedules -- Время скорректировано из-за пересечения с другими расписаниями `,
            type: 'warning',
            duration: 1000
          });

            this.setpoint = oldValue;
          }
          newValue = settingsConfigUpdate.updatedValue;
          payload = {
            room: roomKey, 
            param: setpointKey,
            value: newValue, 
            time: nowMoscow()
          };
         
        }
         else {
          //console.log('[DashBoard] - editValueMainSetpoint - ', value_details);
          newValue = value;
          payload = {
            room: roomKey, 
            param: setpointKey,
            value: value, 
            value_type: value_type,
            time: nowMoscow()
          };
        }
        
      break;
      case 'notifications':
        console.log('[DashBoard] - editValueMainSetpoint -- case notifications --  Обработка данных от компонента MainSetpoint изменения конфигурации - Уведомления');
                if (value_details === 'minutes' || value_details === 'hours') {
          console.log('[DashBoard] - editValueMainSetpoint -- case notifications -- value_details-', value_details);
          const settingsConfigUpdate = await this.$store.dispatch('settingsConfig/settingsConfigUpdate', {newValue: value, value_details});
          console.log('[DashBoard] - editValueMainSetpoint -- case notifications -- Результат проверки:', settingsConfigUpdate);
          if (settingsConfigUpdate.hasOverlap) {
          
            // Отображаем Уведомление для пользователя - PopupMenu.vue 
          this.$store.dispatch('popup/show', {
            message: `-- case notifications -- Время скорректировано из-за пересечения с другими расписаниями `,
            type: 'warning',
            duration: 1000
          });

            this.setpoint = oldValue;
          }
          newValue = settingsConfigUpdate.updatedValue;
          payload = {
            room: roomKey, 
            param: setpointKey,
            value: newValue, 
            time: nowMoscow()
          };
         
        }
         else {
          //console.log('[DashBoard] - editValueMainSetpoint - -- ДОПИСЫВАЕМ ОБРАБОТКУ ИЗМЕНЕНИЯ ВРЕМЕНИ -- ДЛЯ', value_details);
          newValue = value;
          payload = {
            room: roomKey, 
            param: setpointKey,
            value: value, 
            value_type: value_type,
            time: nowMoscow()
          };
        }
        break;
      case 'statistics':
        console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения конфигурации - Статистика');
      break;
    
      default:
        console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения конфигурации - ?????');
        break;
    }
    console.log('[DashBoard] - editValueMainSetpoint - Сформирован payload', payload);
      
    } catch (error) {
      return error;
    }

    logger.dev('[DashBoard] - editValueMainSetpoint - Формируем сообщение для отпраку на сервер:', payload);
    console.log('[DashBoard] - editValueMainSetpoint - Формируем сообщение для отпраку на сервер:', payload);
    console.groupEnd();

    this.updatePayloadData({ value: newValue });
    await this.$store.dispatch('config/handleValueUpdate', { dID, payload, type: requestName });

    console.log('[DashBoard] - editValueMainSetpoint - ', eventData);
      //this.sendChangedData(eventData);
      const sendTimer = this.sendChangedData(eventData);
      if (sendTimer) this.setpoint = oldValue;
    
      // Установка нового таймера для отправки на сервер
      if (this.setpointUpdateTimer) {
        clearTimeout(this.setpointUpdateTimer);
        console.log('[DashBoard] - editValueMainSetpoint - Предыдущий таймер очищен');
      }
        this.setpointUpdateTimer = setTimeout(async () => {
          try {
            logger.dev('[DashBoard] - editValueMainSetpoint - Обновляем уставку -', value, ' roomKey -', roomKey, ' setpointKey -', setpointKey, 'valueTitle -', valueTitle);
            console.log('[DashBoard] - editValueMainSetpoint - Обновляем уставку -', value, ' roomKey -', roomKey, ' setpointKey -', setpointKey, 'valueTitle -', valueTitle, 'request-', requestName);
            
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


  sendChangedData (event) {
    console.log('[DashBoard] - sendChangedData - Запускаем таймер задержки отправки на данных на сервер', event);
    //const oldValue = event.updateState.value;
      // Установка нового таймера для отправки на сервер
      if (this.setpointUpdateTimer) {
        clearTimeout(this.setpointUpdateTimer);
        console.log('[DashBoard] - sendChangedData - Предыдущий таймер очищен');
      }
        this.setpointUpdateTimer = setTimeout(async () => {
          try {
            const value = event.updateState.value;
            console.log('[DashBoard] - sendChangedData - event.updateState.value', value);
            this.updatePayloadData({ value: value });    
            await this.$store.dispatch('config/updateSetpointServer'); // Отправляем на данные из settingsData - index.js на сервер
             
            logger.info('[DashBoard] - sendChangedData - Уставка успешно отправлена на сервер после задержки');
            console.log('[DashBoard] - sendChangedData - Данные  успешно отправлены на сервер после задержки');
            return true;
          } catch (error) {
            logger.error('[DashBoard] - sendChangedData - Ошибка при отправке уставки на сервер:', error);
            console.error('Ошибка при отправке уставки на сервер:', error);
            return false;
          }
        }, 200);
  },

  getComponentData(event) {

      console.log('[DashBoard] - getComponentData - Данные от компонента:', event);
      this.request = event.request;

      if (event.action === 'show') {  
        //console.log('[DashBoard] - getComponentData - Показываем компонент MainSetpoint с данными:', this.selectedItemData);
        this.setpoint = event.updateState.value;
        this.showSetpoint = true;
        
        this.selectedItemData = {
          roomKey: this.$store.state.setpointsManager?.settingsData?.payload?.room,
          setpointKey: this.$store.state.setpointsManager?.settingsData?.payload?.param,
          valueTitle: event.updateState.title,
        };
        console.log('[DashBoard] - getComponentData - Компонент MainSetpoint показан', this.selectedItemData);
      } else if (event.action === 'hide') {
        this.showSetpoint = false;
        this.setpoint = event.updateState.value;
        //console.log('[DashBoard] - getComponentData - Компонент MainSetpoint скрыт');
          this.sendChangedData(
            {updateState : {
              request: event.request,
              title: event.updateState.title,
              value: event.updateState.value
            }});
      }

  },









  

// Блок для управления ручным редактированием значения
      changeeventHandlePermit (event) {
        if (!event.handlePermit) this.handlePermit = event.handlePermit;
        console.log('[DashBoard] - handlePermitEvent', event.handlePermit);
      },
      handlePermitEvent(event) {
        
        if (event.handlePermit === true) {
          this.openManualInputDialog({
            title: event.title,
            initialValue: event.currentValue,
            type: event.inputType,
            callback: (newValue) => {
              // После подтверждения вызываем метод, который обновит данные через store и дочерние компоненты
              this.processManualInputUpdate({
                id: event.id,
                field: event.field,
                newValue: newValue,
                scheduleData: event.scheduleData,
              });
            },
          });
        } else {
          // остальная логика обработки событий MainBodySettings
        }
      },
      processManualInputUpdate({ id, field, newValue, scheduleData }) {
        console.log('[DashBoard] - processManualInputUpdate - Получены данные с ручной формы ввода InputDialog', newValue, scheduleData);
        // Обновляем через существующие механизмы
        // this.updateSettingsData({ field: 'request', value: 'updateSchedules' });
        this.updatePayloadData({
          id: id,
          value: newValue,
          value_name: field,
          value_details: '',
        });
        // Эмитим событие вниз (через ref) для обновления UI
        // this.$refs.mainBodySettings?.$emit('getDataScheduleItem', {
        //   value: newValue,
        //   title: field,
        //   value_type: scheduleData?.value_type,
        // });
      },
    // Открыть диалог ручного ввода InputDialog.vue
      openManualInputDialog({ title, initialValue, type, callback }) {
        this.manualInputDialog = {
          visible: true,
          title,
          initialValue,
          type,
          callback,
        };
      },
      // Закрыть диалог InputDialog.vue
      closeManualInputDialog() {
        this.manualInputDialog.visible = false;
      },
      // Подтверждение ввода InputDialog.vue
      onManualInputConfirm(newValue) {
        if (this.manualInputDialog.callback) {
          this.manualInputDialog.callback(newValue);
        }
        this.closeManualInputDialog();
      },
// Окончание Блока для управления ручным редактированием значения

  }
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>