<!-- components/MainBodySettings.vue -->
 <!-- $emit'getComponentData' - передает измененное значение параметра в экземпляре MainBodySchedule с добавлением флага action = show/hide -->
<template>
  <!-- <h3 class="schedules-list-title">Настроенные расписания:</h3> -->
  <div>

      <div class="mainBodySettings">
        <div class="mainBodySettings-header"> 
          <button class="mainBodySettings-header-button" @click="addNewItem">
            <svg class="icon-settings add" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle id="add-bg" cx="44" cy="44" r="42" fill="#34B534"/>
              <circle cx="44" cy="44" r="42" stroke="#34B534" stroke-width="4"/>
              <line x1="44" y1="23" x2="44" y2="65" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
              <line x1="23" y1="44" x2="65" y2="44" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
            </svg>
          </button>


          <button class="mainBodySettings-header-button" @click="handlePermit">
          <svg class="icon-settings hand" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="44" cy="44" r="42" 
              :fill="handleInputPermit ? '#FFA500' : '#E0E0E0'"
              :fill-opacity="handleInputPermit ? 1 : 0.35"
              />
              <path d="M52 38V28C52 26.9 51.1 26 50 26C48.9 26 48 26.9 48 28V38H46V24C46 22.9 45.1 22 44 22C42.9 22 42 22.9 42 24V38H40V26C40 24.9 39.1 24 38 24C36.9 24 36 24.9 36 26V42L30 36C29.1 35.1 27.7 35.1 26.8 36C25.9 36.9 25.9 38.3 26.8 39.2L38 50.4V56C38 61.6 42.4 66 48 66H56C61.6 66 66 61.6 66 56V46C66 44.9 65.1 44 64 44C62.9 44 62 44.9 62 46V52H60V38C60 36.9 59.1 36 58 36C56.9 36 56 36.9 56 38V44H54V36C54 34.9 53.1 34 52 34C50.9 34 50 34.9 50 36V44H48V38H52Z" 
              fill="#E0DFE7"
              :fill-opacity="handleInputPermit ? 1 : 0.5"/>
            </svg>
          </button>

        </div>


        <div class="mainBodySettings-title-container" @click="cycleTitle">
          <div class="mainBodySettings-header-title">{{ selectedTitle }}</div>
          <div class="mainBodySettings-header-title-others">
            {{ otherTitles.join(' • ') }}
          </div>
        </div>
        
        <div class="mainBodySettings-header"> 
          <button class="mainBodySettings-header-button" @click="closeMainBodySettings">
            <svg class="icon-settings close" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Темно-красный фон (появляется при наведении) -->
              <circle class="hover-bg" cx="44" cy="44" r="42" fill="#CC0000" opacity="0"/>
              <!-- Красный фон (по умолчанию) -->
              <circle cx="44" cy="44" r="42" fill="#FF4747"/>
              <!-- Красная обводка -->
              <circle cx="44" cy="44" r="42" stroke="#FF4747" stroke-width="4"/>
              <!-- Белый крестик -->
              <line x1="28" y1="28" x2="60" y2="60" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
              <line x1="60" y1="28" x2="28" y2="60" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

        <div class="mainBodySettings-content-body">

          <div v-if="selectedTitle === 'Расписание' && schedules.length > 0" class="schedules-list">
            
            <MainBodySchedule
              v-for="(schedule, index) in schedules"
              :key="schedule.id || `schedule-${index}`"
              :visible="true"
              :scheduleData="schedule"
              :scheduleUnit="unit"
              :activeSelection="activeSelection"
              :handleInputPermit="handleInputPermit"
              class="schedule-item"  
              @delete-schedule="handleDeleteConfigItem(schedule.id, 'schedules')"
              @getDataScheduleItem="checkDataScheduleItem"
              @field-selected="handleFieldSelected"
            />
          </div>
            <div v-if="selectedTitle === 'Расписание' && schedules.length === 0" class="schedule-item">
              <p>Расписания для этого параметра не настроены.</p>
            </div>
          </div>

          <div v-if="selectedTitle === 'Уведомления'">
            <div v-if="notifications.length > 0" class="notifications-list">
              <MainBodyNotifications
                v-for="(notification, index) in notifications"
                :key="notification.id || `notification-${index}`"
                :notificationData="notification"
                :activeSelection="activeSelection"
                :handleInputPermit="handleInputPermit"
                class="schedule-item"  
                @getDataNotificationItem="checkDataNotificationItem"
                @edit-notification="handleEditNotification(notification.id, $event)"
                @delete-notification="handleDeleteConfigItem(notification.id, 'notifications')"
                @field-selected="handleFieldSelected"
              />
            </div>
          
          <div v-if="notifications.length === 0" class="schedule-item">
            <p>Уведомления для выбранного параметра не настроены.</p>
          </div>
        </div>
          <div v-if="selectedTitle === 'Аналитика'">
            <div v-if="statistics.length > 0" class="statistics-list">
              <MainBodyStatistic
                v-for="(statistic, index) in statistics"
                :key="statistic.id || `statistic-${index}`"
                :analyticData="statistic"
                :activeSelection="activeSelection"
                :handleInputPermit="handleInputPermit"
                class="schedule-item"  
                @edit-analytic="handleEditAnalytic(statistic.id, $event)"
                @delete-analytic="handleDeleteConfigItem(statistic.id, 'statistics')"
                @field-selected="handleFieldSelected"
              />
            </div>
          
          <div v-if="statistics.length === 0" class="schedule-item">
            <p>Отсутствует Аналитика для выбранного параметра.</p>
          </div>
        </div>

      <div>
        <button type="submit" @click="closeMainBodySettings">Закрыть</button>
      </div>

  </div>
</template>

<script>
import logger from '../store/modules/logger.js';
import { mapMutations, mapGetters, mapActions } from 'vuex';
import MainBodySchedule from './MainBodySchedule.vue';
import MainBodyNotifications from './MainBodyNotifications.vue';
import MainBodyStatistic from './MainBodyStatistic.vue';
import { nowMoscow, createTimePoint } from '@/utils/timeUtils';

export default {
  name: 'MainBodySettings',
  inject: {
    getMainSetpointEl: { 
      default: () => () => null  // fallback если provide не доступен
    }
  },
  components: { MainBodySchedule, MainBodyStatistic, MainBodyNotifications },
  props: {
    setting_Type: {
      type: String,
      required: true
    },
    keepActiveRefs: {  // ← новый prop: массив внешних $el которые не сбрасывают выделение
      type: Array,
      default: () => []
    },
  },
  data() {
    return {
      activeSelection: null,
      availableTitles: ['schedules', 'notifications', 'statistics'],
      typeToTitleMap: {
        'schedules': 'Расписание',
        'notifications': 'Уведомления',
        'statistics': 'Аналитика'
      },
      title: localStorage.getItem('typeSettingsKey') || this.typeSettingsKey || 'schedules',

      showAddDialog: false, // Добавьте это
      currentItemType: '',
      defaultItemValues: {},

      schedules: [],
      notifications: [],
      statistics: [],

      unit: '', // единица измерения
      handleInputPermit: false, 

      configDataToDelete: [], // Массив ID расписаний для удаления
      pendingDeletions: {}, // Объект с данными для удаления {id: scheduleData}
      editedSchedules: {}, // Объект с данными для редактирования {id: scheduleData}

      //editingSchedule: null, // Объект для редактируемого расписания
      isEditingSchedule: false, // Флаг режима редактирования
      editScheduleValue: null, // Текущее редактируемое значение
    };
  },
  computed: {
    ...mapGetters('settingsConfig', ['typeSettings']),
    ...mapGetters([
      'getSetpointsManager',
      'roomKey',
      'paramKey', 
      'deviceKey',
      'setpointKey',
      'typeSettingsKey'
    ]),
    ...mapGetters('sortParams', [
      'getRoomTitle',
      'getParamTitle',
      'getDeviceTitle',
      'getSetpointTitle'
    ]),
    ...mapGetters(['level', 'dID']),
    ...mapGetters('config', ['getConfig']),
    settingsData() {
      return this.getSetpointsManager?.settingsData || null;
    },
    // itemData() {
    //   // Собираем данные текущего элемента из store
    //   return {
    //     roomKey: this.roomKey,
    //     paramKey: this.paramKey,
    //     deviceKey: this.deviceKey,
    //     setpointKey: this.setpointKey,
    //     roomTitle: this.getRoomTitle,
    //     deviceTitle: this.getDeviceTitle,
    //     setpointTitle: this.getSetpointTitle,
    //     setpoint: this.setpointKey
    //   };
    // },
   selectedTitle() {
      // Находим соответствующий заголовок в typeToTitleMap по ключу title
      return this.typeToTitleMap[this.title];
    },
    otherTitles() {
      // Получаем все значения из typeToTitleMap кроме текущего selectedTitle
      return Object.values(this.typeToTitleMap)
      .filter(title => title !== this.selectedTitle);
    },
    userLevel() {
      return this.level || 0;
    },
    effectiveParamKey() {
    // Определяем какой ключ использовать
    return this.paramKey || '';
    },
    isEditingMode() {
      return this.isEditingSchedule && this.editingSchedule !== null;
    },
    
  },
  created() {
    // console.log('[MainBodySettings] - created', {
    //   settingsData: this.settingsData,
    //   level: this.userLevel,
    //   currentType: this.title
    // });
    this.initialize();
    this.schedules = this.loadConfigDataFromStore('schedules');
    this.setComponentParam(this.selectedTitle);
  },
  watch: {
    title(newTitle, oldTitle) {
      if (newTitle !== oldTitle) {
        //console.log('[MainBodySettings] WATCH - this.title:', newTitle);
        this.loadCurrentSettings();
        this.setComponentParam(this.selectedTitle);
      }
    },
    // Отслеживаем изменения в store и обновляем локальные данные
    '$store.state.config': {
      handler() {
        //console.log('[MainBodySettings] - Watch - Расписания в store обновились');
        this.loadConfigDataFromStore(this.title);

        // if (this.title === 'schedules') {
        //   this.loadConfigDataFromStore('schedules');
        //   //console.log('[MainBodySettings] - Watch - Обновленные Расписания:', this.schedules);
        // }
        // if (this.title === 'notifications') {
        //   this.loadConfigDataFromStore('notifications');
        //   //console.log('[MainBodySettings] - Watch - Обновленные Уведомления:', this.notifications);
        // }
        // if (this.title === 'statistics') {
        //   this.loadConfigDataFromStore('statistics');
        //   //console.log('[MainBodySettings] - Watch - Обновленные Аналитика:', this.statistics);
        // }
      },
      deep: true,
      immediate: false
    },

  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    ...mapMutations('config', ['SET_TYPE_SETTINGS_ITEM']),
    ...mapMutations({
      SET_PARAM_KEY: 'SET_PARAM_KEY', 
    }),
    ...mapActions('settingsConfig', [
      'initialize',
      'updateTypePopupItem', 
      'saveConfigItems',
      'checkScheduleOverlap',
      'updateSchedule',
      'deleteConfigItems',
      'getConfigDataFromStore',
    ]),
    ...mapActions(['updateSettingsData', 'updatePayloadData', 'updateLimitsData', 'updateViewData']),
    
    checkDataScheduleItem(event) {
      // Функция получает измененный параметр от экземплара MainBodySchedule 
      // Проверяет event.value_type и устанвливает флаг action

      console.log('[MainBodySettings] -  checkDataScheduleItem - Данные от компонента MainBodySchedule:', event, null, 2);
      
      let action = "show";
      if (event.value_type === 'deviation' & event.title === 'value_type') action = "hide";
      const arrayTitle = this.settingsData?.payload?.config; // имя массива (например, "schedule")
      const message = {
        action: action,
        updateState: event,
        request: arrayTitle,
      };
      console.log('[MainBodySettings] -  checkDataScheduleItem - Формируем сообщение для DashBoard - emit getComponentData', message);
      this.$emit('getComponentData', message);
    },


    checkDataNotificationItem(event){
      // Функция получает измененный параметр от экземплара MainBodyNotifications 
      // Проверяет event.value_type и устанвливает флаг action
      console.log('[MainBodySettings] -  checkDataNotificationItem - Данные от компонента MainBodySchedule:', event, null, 2);
      let action = "show";
      if (event.title === 'condition' || event.title === 'notificationСhannel' || event.title === 'permission') action = "hide";
      const arrayTitle = this.settingsData?.payload?.config; // имя массива (например, "schedule")
      const message = {
        action: action,
        updateState: event,
        request: arrayTitle,
      };
      console.log('[MainBodySettings] -  checkDataNotificationItem - Формируем сообщение для DashBoard - emit getComponentData', message);
      this.$emit('getComponentData', message);
    },

    setComponentParam (selectedTitle) {
      this.updateSettingsData({ field: 'type', value: 'post' });
      if(selectedTitle === 'Расписание') {
        this.updatePayloadData({ config: 'schedules'});

        this.loadConfigDataFromStore('schedules');
      } else if (selectedTitle === 'Уведомления') {
        this.updatePayloadData({ config: 'notifications'});
        this.loadConfigDataFromStore('notifications');
        console.log('[MainBodySettings] - setComponentParam - Пишем код для загрузки конфигурации Уведомлений и устанавливаем соответствующие ключи в state settingsData');
      } else if (selectedTitle === 'Аналитика') {
        this.updatePayloadData({ config: 'statistics'});
        this.loadConfigDataFromStore('statistics');
        console.log('[MainBodySettings] - setComponentParam - Пишем код для загрузки конфигурации Аналитики и устанавливаем соответствующие ключи в state settingsData');
      } else {
        console.log('[MainBodySettings] - setComponentParam - Пишем обработку для неизвестного selectedTitle', selectedTitle);
      }
    },

    async loadConfigDataFromStore(configName) {
      //console.log('[MainBodySettings] - loadConfigDataFromStore - Вызов функции для конфигурации - ', configName);
      try {
        
        const configData = await this.$store.dispatch('settingsConfig/getConfigDataFromStore', { configName });    
        //console.log('[MainBodySettings] - loadConfigDataFromStore - Полученные расписания из store:', configData);
       
        // schedules.forEach((schedule, index) => {
        //   console.log(`[MainBodySettings] - loadConfigDataFromStore - schedule[${index}] createdAt:`, schedule.createdAt, 'typeof:', typeof schedule.createdAt);
        // });
        this[configName] = configData;
        return configData;
      } catch (error) {
        console.error('[MainBodySettings] - loadConfigDataFromStore - Ошибка:', error);
        this[configName] = [];
      }
    },
  
    formattedValue(value) {
      if (typeof value === 'number') {
        return value.toFixed(1);
      }
      return value;
    },
    async loadCurrentSettings() {
      try {
        const type = this.title;
        //console.log(`[MainBodySettings] Loading ${type} data`);
        
        switch(type) {
          case 'schedules':
            await this.loadData('schedules');
            break;
          case 'notifications':
            await this.loadData('notifications');
            break;
          case 'statistics':
            await this.loadData('statistics');
            break;
          default:
            console.warn(`Unknown settings type: ${type}`);
        }
      } catch (error) {
        console.error('[MainBodySettings] Failed to load settings:', error);
      }
    },
    
    cycleTitle() {
      // Находим текущий индекс
      const currentIndex = this.availableTitles.indexOf(this.title);
      const nextIndex = (currentIndex + 1) % this.availableTitles.length;
      const nextTitle = this.availableTitles[nextIndex];
      console.log(`[MainBodySettings] Title changed: ${this.title} → ${nextTitle}`);
      logger.info(`[MainBodySettings] Title changed: ${this.title} →  ${nextTitle}`);
      this.title = nextTitle;
      
      // Обновляем в store
      this.SET_TYPE_SETTINGS_ITEM(nextTitle);

      // Оповещаем родителя (если нужно)
      this.$emit('title-changed', nextTitle);
    },

    addNewItem() {
      //console.log('[MainBodySettings] - addNewItem');
      const type = this.title; // 'schedules', 'notifications', 'statistics'
      this.currentItemType = type;
      // let roomKey, paramKey;
      switch(type) {
        case 'schedules':
          this.addNewSchedule();
          break;
        case 'notifications':
          this.defaultItemValues = {
            roomKey: this.settingsData.payload.room,
            paramKey: this.effectiveParamKey,
            threshold: this.effectiveSetpointValue || 0,
            condition: 'greater_than'
          };
          console.log('case Notifications - [MainBodySettings] - addNewItem - ', this.defaultItemValues);
          this.addNewNotification();
          break;
        case 'statistics':
          this.defaultItemValues = {
            roomKey: this.settingsData.payload.room,
            paramKey: this.effectiveParamKey,
            chartType: 'line',
            period: 'day'
          };
          console.log('case Statistics - [MainBodySettings] - addNewItem - ', this.defaultItemValues);
          this.addNewStatistic();
          break;
        default:
          console.warn(`Unknown settings type: ${type}`);
      }
    },

    handlePermit() {
      this.handleInputPermit = !this.handleInputPermit;
      console.log('[MainBodySettings] - handlePermit - Ручное редактирование значения:', this.handleInputPermit);

      this.$emit('eventsMainBodySettings', {handlePermit: this.handleInputPermit});
    },

    async generationTime(configName) {
      console.log('[MainBodySettings] - generationTime - Создание временного интервала для нового элемента');
            let startTime, endTime;
      try {
        const { startTime: st, endTime: et } = createTimePoint();
        startTime = st;
        endTime   = et;
        const hasOverlap = await this.$store.dispatch('settingsConfig/checkScheduleOverlap', {
          startTime,
          endTime,
          configName: configName,
          // existingSchedules
        });

        //console.log('[MainBodySettings] - generationTime - Результат проверки пересечения:', hasOverlap);
        
          if (hasOverlap.massage) {
            alert(hasOverlap.massage);
            return;
          }
          if (hasOverlap.newStartTime || hasOverlap.newEndTime) {
            startTime = hasOverlap.newStartTime;
            endTime = hasOverlap.newEndTime;
            console.log('[MainBodySettings] - generationTime - Обновлено время расписания:', { startTime, endTime });
          }
        } catch (error) {
          console.error('[MainBodySettings] - generationTime - Ошибка проверки пересечения:', error);
          // Продолжаем создание с предупреждением
          if (!confirm('Ошибка проверки пересечения. Создать расписание вручную?')) {
            return;
          }
        }
        // console.log('[MainBodySettings] - generationTime - Обновлено время расписания:', { startTime, endTime });
        if (startTime != undefined && endTime != undefined ) return({ startTime, endTime });
        return;
    },


  
    async addNewSchedule() {
      //console.groupCollapsed('[MainBodySettings] - addNewSchedule');
      const settingsData = this.$store.state.setpointsManager?.settingsData;
      const room = settingsData?.payload?.room;
      const param = settingsData?.payload?.param;
      const value = settingsData?.payload?.value || 0;
      console.log('[MainBodySettings] - addNewSchedule - ', room, param); 

      // Получаем текущие расписания для этой комнаты и параметра
      await this.loadConfigDataFromStore('schedules');
      const existingSchedules = this.schedules.filter(s => 
        s.room === room && 
        s.param === param
      );
      
      console.log('[MainBodySettings] - addNewSchedule - Существующие расписания:', existingSchedules);
      
      const newTime = await this.generationTime('schedules');
      console.log('[MainBodySettings] - addNewSchedule - Получен временной интервал:', newTime);
      const startTime = newTime.startTime;
      const endTime = newTime.endTime;

      
      // Определяем ID нового расписания
      let newId = 1;
      if (existingSchedules.length > 0) {
        const existingIds = existingSchedules
          .map(s => s.id)
          .filter(id => id != null && typeof id === 'number');
        
        if (existingIds.length > 0) {
          newId = Math.max(...existingIds) + 1;
        }
      }
      
      // Создаем новое расписание
      const newSchedule = {
        id: newId,
        startTime: startTime,
        endTime: endTime,
        value: value,
        value_type: 'absolute', // или 'deviation' 
        unit: this.unit || '',
        room: room,
        param: param,
        createdAt: nowMoscow(),
        updatedAt: nowMoscow(),
        // _modified: true, // Флаг для отслеживания изменений
        days: [1, 2, 3, 4, 5], // Пн-Пт по умолчанию
        
      };
      
      console.log('[MainBodySettings] - addNewSchedule - createdAt:', newSchedule.createdAt, 'typeof:', typeof newSchedule.createdAt);
      
      // Добавляем расписание в массив
      this.schedules = [...this.schedules, newSchedule];
     
      console.log('[MainBodySettings] - addNewSchedule - Новое расписание создано:', newSchedule);
     
      // Сохраняем изменения на сервер
      try {
        console.log('[MainBodySettings] - addNewSchedule - Сохраняем расписание локально');
        await this.$store.dispatch('settingsConfig/addConfigLocally', {
          room: room,
          param: param,
          configName: 'schedules',
          configData: newSchedule
        });
        
        console.log('[MainBodySettings] - addNewSchedule - Расписание сохранено локально');


        // await this.saveScheduleBlock();
        await this.saveConfigItems({
          room: this.settingsData.payload.room,
          param: this.effectiveParamKey,
          configName: 'schedules',
          configData: newSchedule
        });
        console.log('[MainBodySettings] - addNewSchedule - Расписание успешно сохранено');
        
        // Опционально: показываем уведомление об успехе
        this.showSuccessNotification('Расписание успешно создано');
        
        // Если нужно, можно обновить список расписаний
        await this.loadData('schedules');
        console.groupEnd();
        return newSchedule;
      } catch (error) {
        console.error('[MainBodySettings] - addNewSchedule - Ошибка сохранения:', error);
        
        // Откатываем изменения в UI при ошибке сохранения
        this.schedules = this.schedules.filter(s => s.id !== newId);
        
        // Показываем сообщение об ошибке
        alert('Не удалось сохранить расписание на сервере. Попробуйте еще раз.');
        console.groupEnd();
        throw error;
      }
    },
    handleDeleteConfigItem(id, configName) {
      //console.log('[MainBodySettings] - handleDeleteConfigItem - Добавляем в список на удаление ID:', id, configName);
  
      // Сохраняем данные для удаления
      this.pendingDeletions[id] = id;
      //console.log('[MainBodySettings] - handleDeleteConfigItem - Массив на удаление:', this.pendingDeletions);
      
      // Добавляем ID в массив для отслеживания
      if (!this.configDataToDelete.includes(id)) {
        this.configDataToDelete.push(id);
      }
      console.log('[MainBodySettings] - handleDeleteConfigItem - Массив на удаление:', this.configDataToDelete);
      // Немедленно обновляем локальный список (скрываем удаленный элемент)
      this[configName] = this[configName].filter(s => s.id !== id);
      
      logger.info(`[MainBodySettings] - handleDeleteConfigItem - Расписание c ${id} добавлено в список на удаление`);

    },
  


    async addNewNotification() {
      console.groupCollapsed('[MainBodySettings] - addNewNotification');
      const settingsData = this.$store.state.setpointsManager?.settingsData;
      const value = settingsData?.payload?.value || 0;
      const room = this.settingsData.payload.room;
      const param = this.effectiveParamKey;

      console.log('[MainBodySettings] - addNewNotification - Текущая конфигурация Уведомлений - ', this.notifications);
      // Получаем текущие уведомления для этой комнаты и параметра
      const existingNotifications = this.notifications.filter(n => 
        n.room === room && 
        n.param === param
      );
      console.log('[MainBodySettings] - addNewNotification - Конфигурация Уведомлений для комнаты -', room, ' , параметра -', param, ' :', this.notifications);
      
      // Определяем ID нового уведомления
      let newId = 1;
      if (existingNotifications.length > 0) {
        const existingIds = existingNotifications
          .map(n => n.id)
          .filter(id => typeof id === 'number');
        if (existingIds.length > 0) {
          newId = Math.max(...existingIds) + 1;
        }
      }
      // if (existingNotifications.length > 0) {
      //   const existingIds = existingNotifications
      //     .map(n => n.id)
      //     .filter(id => id != null && typeof id === 'number');
        
      //   if (existingIds.length > 0) {
      //     newId = Math.max(...existingIds) + 1;
      //     console.log('[MainBodySettings] - addNewNotification - Номер новой записи-', newId);
      //   }
      // }
      
        const newTime = await this.generationTime('notifications');
        const startTime = newTime.startTime;
        const endTime = newTime.endTime;

      const newNotification = {
        id: newId,
        condition: 'greater_than', // 'greater_than', 'less_than', 'equals', 'changed'
        value: value,
        notificationСhannel: 0, //  0 - 'web', 1 - 'telegram', 2 'web' + 'telegram'
        frequency: 0, // 0 - 'once' ; число - интервал в минутах
        permission: true,
        status: false,
        startTime: startTime,
        endTime: endTime,
        createdAt: nowMoscow(),
        updatedAt: nowMoscow(),
        room: room,
        param: param,
      };
      
      // Добавляем уведомление
      this.notifications = [...this.notifications, newNotification];
      console.log('[MainBodySettings] - addNewNotification - Новое Уведомления создано:', newNotification);
      console.log('[MainBodySettings] - addNewNotification - Новое Уведомления добавлено в конфигурацию Уведомлений:', this.notifications);
    // Сохраняем изменения на сервер
      try {
        //console.log('[MainBodySettings] - addNewNotification - Сохраняем Уведомления локально');
        await this.$store.dispatch('settingsConfig/addConfigLocally', {
          room: room,
          param: param,
          configName: 'notifications',
          configData: newNotification
        });
        
        console.log('[MainBodySettings] - addNewNotification - Уведомления сохранено локально');
        console.groupEnd();

        // await this.saveScheduleBlock();
        await this.saveConfigItems({
          room: this.settingsData.payload.room,
          param: this.effectiveParamKey,
          configName: 'notifications',
          configData: newNotification
        });
        console.log('[MainBodySettings] - addNewNotification - Уведомления успешно сохранено');
        
        // Опционально: показываем уведомление об успехе
        this.showSuccessNotification('Уведомления успешно создано');
        
        // Если нужно, можно обновить список расписаний
        await this.loadData('notifications');
        console.groupEnd();
        return newNotification;
      } catch (error) {
        console.error('[MainBodySettings] - addNewNotification - Уведомления - Ошибка сохранения:', error);
        
        // Откатываем изменения в UI при ошибке сохранения
        this.notifications = this.notifications.filter(s => s.id !== newId);
        
        // Показываем сообщение об ошибке
        alert('Не удалось сохранить Уведомления на сервере. Попробуйте еще раз.');
        console.groupEnd();
        throw error;
      }

    },
  
    async addNewStatistic(roomKey, paramKey) {
      // Получаем текущую аналитику для этой комнаты и параметра
      const existingAnalytics = this.statistics.filter(a => 
        a.roomKey === roomKey && 
        a.paramKey === paramKey
      );
      
      // Определяем ID новой аналитики
      let newId = 1;
      if (existingAnalytics.length > 0) {
        const existingIds = existingAnalytics
          .map(a => a.id)
          .filter(id => id != null && typeof id === 'number');
        
        if (existingIds.length > 0) {
          newId = Math.max(...existingIds) + 1;
        }
      }
      
      const newStatistic = {
        id: newId,
        chartType: 'line', // 'line', 'bar', 'pie'
        period: 'day', // 'hour', 'day', 'week', 'month'
        aggregation: 'average', // 'average', 'sum', 'min', 'max'
        roomKey: roomKey,
        paramKey: paramKey,
      };
      
      // Добавляем аналитику
      this.statistics = [...this.statistics, newStatistic];
      
      console.log('[MainBodySettings] - addNewStatistic - Новая аналитика создана:', newStatistic);
      
      // Сохраняем изменения
      await this.saveAnalyticBlock();
      console.log('[MainBodySettings] - addNewStatistic - Аналитика успешно сохранена');
      console.groupEnd();
    },

    async saveNewConfig({ configName, configData, room, param }) {
      try {
        // Локальное сохранение (backup)
        await this.$store.dispatch('settingsConfig/addConfigLocally', {
          room, param, configName, configData
        });

        // Отправка на сервер в зависимости от типа
        await this.saveConfigItems({
            room: this.settingsData.payload.room,
            param: this.effectiveParamKey,
            configName: configName,
            configData: configData
          });
          const successMessage = 'Настройка успешно сохранена';
        alert(successMessage);
        // Обновляем список (перезагружаем данные из store)
        return configData;
      } catch (error) {
        console.error(`[MainBodySettings] saveNewConfig error for ${configName}:`, error);
        throw error;
      }
    },






    
    async saveNotificationBlock() {
      try {
        // Если нет соответствующего action в store, сохраняем в localStorage
        const key = `notifications_${this.dID}_${this.settingsData.payload.room}_${this.effectiveParamKey}`;
        localStorage.setItem(key, JSON.stringify(this.notifications));
        
        // Или вызываем action если он есть
        // await this.saveNotifications({...});
      } catch (error) {
        console.error('[MainBodySettings] - saveNotificationBlock - Ошибка сохранения:', error);
        throw error;
      }
    },
    
    async saveAnalyticBlock() {
      try {
        // Если нет соответствующего action в store, сохраняем в localStorage
        const key = `statistics_${this.dID}_${this.settingsData.payload.room}_${this.effectiveParamKey}`;
        localStorage.setItem(key, JSON.stringify(this.statistics));
        
        // Или вызываем action если он есть
        // await this.saveAnalytics({...});
      } catch (error) {
        console.error('[MainBodySettings] - saveAnalyticBlock - Ошибка сохранения:', error);
        throw error;
      }
    },

    async closeMainBodySettings() {
      console.groupCollapsed('[MainBodySettings] - closeMainBodySettings');
      console.log('[MainBodySettings] - closeMainBodySettings - Начинаем закрытие', this.title);

      
      // Если есть расписания для удаления, запрашиваем подтверждение
      if (this.configDataToDelete.length > 0) {
        this.$store.dispatch('settingsConfig/deleteConfigItems', {
              room: this.settingsData.payload.room,
              param: this.effectiveParamKey,
              configName: this.title,
              configsIds: [...this.configDataToDelete] // создаем копию массива
            });
            
            // Очищаем массивы после успешной отправки
            this.configDataToDelete = [];
            this.pendingDeletions = {};
      }




      
      // Продолжаем стандартное закрытие
      console.log('[MainBodySettings] - closeMainBodySettings - Закрываем настройки');
      console.groupEnd();

      if (window.history.length > 1) {
        this.$router.go(-1);
      } else {
        this.$router.push('/dashboard');
      }
      
      this.$emit('close');

    },

    async loadData(dataType, room, param) {
      // const roomKey = this.settingsData.payload.room;
      // const paramKey = this.settingsData.payload.param;
      console.log('[MainBodySettings] Loading ', dataType, ' data for ', room, param);
      
      try {
        let result = [];
        const dID = this.dID;
        
        // Прямой доступ к rootState.config
        const configData = this.$store.state.config?.[dataType]?.[dID];
        
        if (configData && configData[room] && configData[room][param]) {
          result = configData[room][param];
          console.log(`[MainBodySettings] - loadData - Данные из store для ${dataType}:`, result);
        } else {
          // Fallback на localStorage (как было в getConfigSettings)
          const localKey = `${dID}_${dataType}`;
          const localConfig = localStorage.getItem(localKey);
          if (localConfig) {
            try {
              const parsedConfig = JSON.parse(localConfig);
              if (parsedConfig[room] && parsedConfig[room][param]) {
                result = parsedConfig[room][param];
                console.log(`[MainBodySettings] - loadData - Данные из localStorage для ${dataType}:`, result);
              }
            } catch (error) {
              console.error('[MainBodySettings] - loadData - Ошибка парсинга localStorage:', error);
            }
          }
        }
        
        // Сохраняем в соответствующий массив
        switch(dataType) {
          case 'schedules':
            this.schedules = [...result];
            break;
          case 'notifications':
            this.notifications = [...result];
            break;
          case 'statistics':
            this.statistics = [...result];
            break;
        }
        
        console.log(`[MainBodySettings] - loadData - Загружено ${result.length} элементов для ${dataType}`);
        
      } catch (error) {
        console.error('[MainBodySettings] - loadData - Ошибка загрузки:', error);
        // Сбрасываем соответствующий массив при ошибке
        switch(dataType) {
          case 'schedules':
            this.schedules = [];
            break;
          case 'notifications':
            this.notifications = [];
            break;
          case 'statistics':
            this.statistics = [];
            break;
        }
      }
    },

    // Вызывается из MainBodySchedule через emit
    handleFieldSelected({ scheduleId, field }) {
      this.activeSelection = { scheduleId, field };
    },

    handleClickOutside(event) {
      // Клик внутри самого MainBodySettings — не сбрасываем
      if (this.$el && this.$el.contains(event.target)) return;
      
      // Клик по MainSetpoint (footer) — не сбрасываем
      const setpointEl = this.getMainSetpointEl();
      if (setpointEl && setpointEl.contains(event.target)) return;
      
      // Клик снаружи — сбрасываем
      this.activeSelection = null;
    },





    handleEditNotification(id, event) {
      console.log('[MainBodySettings] - handleEditNotification', id, event);
    },
    handleEditAnalytic(id, event) {
      console.log('[MainBodySettings] - handleEditAnalytic', id, event);
    },


  }
};
</script>

<style lang="css" src="../assets/mainStyle.css">
</style>
