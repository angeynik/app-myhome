<!-- components/MainBodySettings.vue -->
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

      <div class="mainBodySettings-message">
        <div class="mainBodySettings-content-body">

          <div v-if="selectedTitle === 'Расписание' && schedules.length > 0" class="schedules-list">
            
            <MainBodySchedule
              v-for="(schedule, index) in schedules"
              :key="schedule.id || `schedule-${index}`"
              :visible="true"
              :scheduleData="schedule"
              :scheduleUnit="unit"
              @value-type-changed="handleValueTypeChanged($event)"
              @edit-value="handleEditValue(schedule.id, $event)"
              @delete-schedule="handleDeleteSchedule(schedule.id)"
            />
          </div>
            <div v-if="selectedTitle === 'Расписание' && schedules.length === 0" class="settings-block">
              <p>Расписания для этого параметра не настроены.</p>
            </div>
          </div>



          <div v-if="selectedTitle === 'Уведомления'">
            <div v-if="notifications.length > 0" class="notifications-list">
              <MainBodyNotifications
                v-for="(notification, index) in notifications"
                :key="notification.id || `notification-${index}`"
                :notificationData="notification"
                @edit-notification="handleEditNotification(notification.id, $event)"
                @delete-notification="handleDeleteNotification(notification.id)"
              />
            </div>
          
          <div v-if="notifications.length === 0" class="settings-block">
            <p>Уведомления для выбранного параметра не настроены.</p>
          </div>
        </div>



          <div v-if="selectedTitle === 'Аналитика'">
            <div v-if="analytics.length > 0" class="analytics-list">
              <MainBodyStatistic
                v-for="(analytic, index) in analytics"
                :key="analytic.id || `analytic-${index}`"
                :analyticData="analytic"
                @edit-analytic="handleEditAnalytic(analytic.id, $event)"
                @delete-analytic="handleDeleteAnalytic(analytic.id)"
              />
            </div>
          
          <div v-if="analytics.length === 0" class="settings-block">
            <p>Отсутствует Аналитика для выбранного параметра.</p>
          </div>
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


export default {
  name: 'MainBodySettings',
  components: { MainBodySchedule, MainBodyStatistic, MainBodyNotifications },
  props: {
    setting_Type: {
      type: String,
      required: true
    },
  },
  data() {
    return {
      availableTitles: ['schedule', 'notifications', 'statistics'],
      typeToTitleMap: {
        'schedule': 'Расписание',
        'notifications': 'Уведомления',
        'statistics': 'Аналитика'
      },
      title: localStorage.getItem('typeSettingsItem') || this.typeSettingsItem || 'schedule',

      showAddDialog: false, // Добавьте это
      currentItemType: '',
      defaultItemValues: {},

      schedules: [],
      notifications: [],
      analytics: [],
      editMode: {
        active: false,
        scheduleId: null,
        field: null,
        value: null,
        limits: {},
        type: null, // 'number' или 'time'
        label: ''
      },

      unit: '', // единица измерения


    };
  },
  computed: {
    ...mapGetters('settingsConfig', ['typeSettings']),
    ...mapGetters([
      'roomKey',
      'paramKey', 
      'deviceKey',
      'setpointKey',
      'typeSettingsItem'
    ]),
    ...mapGetters('sortParams', [
      'getRoomTitle',
      'getParamTitle',
      'getDeviceTitle',
      'getSetpointTitle'
    ]),
    ...mapGetters(['level', 'dID']),
    ...mapGetters('config', ['getConfig']),
    
    itemData() {
      // Собираем данные текущего элемента из store
      return {
        roomKey: this.roomKey,
        paramKey: this.paramKey,
        deviceKey: this.deviceKey,
        setpointKey: this.setpointKey,
        roomTitle: this.getRoomTitle,
        paramTitle: this.getParamTitle,
        deviceTitle: this.getDeviceTitle,
        setpointTitle: this.getSetpointTitle,
        setpoint: this.setpointKey
      };
    },

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

    effectiveSetpointKey() {
    // Определяем какой ключ использовать
    return this.setpointKey || this.paramKey || '';
  },
  
    
  },
  created() {
    console.log('[MainBodySettings] - created', {
      itemData: this.itemData,
      level: this.userLevel,
      currentType: this.title
    });
    this.initialize();
    // this.loadCurrentSettings();
  },
  watch: {
    title(newTitle, oldTitle) {
      if (newTitle !== oldTitle) {
        console.log('[MainBodySettings] WATCH - this.title:', newTitle);
        this.loadCurrentSettings();
      }
    }
  },

  methods: {
    ...mapMutations('config', ['SET_TYPE_SETTINGS_ITEM']),
    ...mapActions('settingsConfig', [
      'initialize',
      'updateTypePopupItem', 
      'saveSchedules',
      'getCurrentDateTime',
      'formatDate',
      'checkScheduleOverlap',
    ]),
    
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
          case 'schedule':
            await this.loadData('schedule');
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
      
      this.title = nextTitle;
      
      // Обновляем в store
      this.SET_TYPE_SETTINGS_ITEM(nextTitle);
      
      console.log(`[MainBodySettings] Title changed: ${this.title} → ${nextTitle}`);
      logger.info(`[MainBodySettings] Title changed to: ${nextTitle}`);
      
      // Оповещаем родителя (если нужно)
      this.$emit('title-changed', nextTitle);
    },


    addNewItem() {
      console.log('[MainBodySettings] - addNewItem');
      const type = this.title; // 'schedule', 'notifications', 'statistics'
      this.currentItemType = type;
      let roomKey, paramKey;
      switch(type) {
        case 'schedule':
            roomKey = this.itemData.roomKey;
            paramKey = this.effectiveSetpointKey;
          this.defaultItemValues = {
            roomKey: roomKey,
            paramKey: paramKey,
            value: this.effectiveSetpointValue || 0,
            unit: this.unit || '°C',
            days: [1, 2, 3, 4, 5] // Пн-Пт по умолчанию
          };
          console.log('case Schedule - [MainBodySettings] - addNewItem - ', this.defaultItemValues);
          this.addNewSchedule(roomKey, paramKey);
          break;
        case 'notifications':
          this.defaultItemValues = {
            roomKey: this.itemData.roomKey,
            paramKey: this.effectiveSetpointKey,
            threshold: this.effectiveSetpointValue || 0,
            condition: 'greater_than'
          };
          console.log('case Notifications - [MainBodySettings] - addNewItem - ', this.defaultItemValues);
          this.addNewNotification();
          break;
        case 'statistics':
          this.defaultItemValues = {
            roomKey: this.itemData.roomKey,
            paramKey: this.effectiveSetpointKey,
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
  
    async addNewSchedule(roomKey, paramKey) {
      console.log('[MainBodySettings] - addNewSchedule - ', roomKey, paramKey); 

      // Получаем текущие расписания для этой комнаты и параметра
      const existingSchedules = this.schedules.filter(s => 
        s.roomKey === roomKey && 
        s.paramKey === paramKey
      );
      
      console.log('[MainBodySettings] - addNewSchedule - Существующие расписания:', existingSchedules);
      
      // Создаем временные метки
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      let startTime = `${currentHours}:${currentMinutes}`;
      
      // Время окончания (+1 час от текущего времени)
      const endTimeDate = new Date(now.getTime() + 60 * 60 * 1000);
      const endHours = endTimeDate.getHours().toString().padStart(2, '0');
      const endMinutes = endTimeDate.getMinutes().toString().padStart(2, '0');
      let endTime = `${endHours}:${endMinutes}`;
      
      console.log('[MainBodySettings] - Проверяемое время:', { startTime, endTime });
      
      // Проверка пересечения с существующими расписаниями
      try {
        const hasOverlap = await this.$store.dispatch('settingsConfig/checkScheduleOverlap', {
          startTime,
          endTime,
          existingSchedules
        });
        
        console.log('[MainBodySettings] - Результат проверки пересечения:', hasOverlap);
        
        if (hasOverlap.massage) {
          alert(hasOverlap.massage);
          return;
        }
        if (hasOverlap.newStartTime || hasOverlap.newEndTime) {
          startTime = hasOverlap.newStartTime;
          endTime = hasOverlap.newEndTime;
          console.log('[MainBodySettings] - Обновлено время расписания:', { startTime, endTime });
        }
      } catch (error) {
        console.error('[MainBodySettings] - Ошибка проверки пересечения:', error);
        // Продолжаем создание с предупреждением
        if (!confirm('Ошибка проверки пересечения. Создать расписание вручную?')) {
          return;
        }
      }
      
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
      
      // Получаем текущее значение уставки или используем значение по умолчанию
      const defaultValue = this.effectiveSetpointValue || 0;
      
      // Создаем новое расписание
      const newSchedule = {
        id: newId,
        startTime: startTime,
        endTime: endTime,
        value: defaultValue,
        valueType: 'absolute', // или 'deviation' - зависит от требований
        unit: this.unit || '',
        roomKey: roomKey,
        paramKey: paramKey,
        // paramTitle: this.itemData.paramTitle || 'Новое расписание',
        // roomTitle: this.itemData.roomTitle || 'Неизвестная комната',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        // _modified: true, // Флаг для отслеживания изменений
        days: [1, 2, 3, 4, 5], // Пн-Пт по умолчанию
        // enabled: true,
        // description: `Расписание для ${this.itemData.paramTitle || 'параметра'} в ${startTime}-${endTime}`,
        
      };
      
      // Добавляем расписание в массив
      this.schedules = [...this.schedules, newSchedule];
     
      console.log('[MainBodySettings] - addNewSchedule - Новое расписание создано:', newSchedule);
      
      // Сохраняем изменения на сервер
      try {
        // await this.saveScheduleBlock();
        await this.saveSchedules({
          roomKey: this.itemData.roomKey,
          paramKey: this.effectiveSetpointKey,
          schedules: newSchedule
        });
        console.log('[MainBodySettings] - addNewSchedule - Расписание успешно сохранено');
        
        // Опционально: показываем уведомление об успехе
        this.showSuccessNotification('Расписание успешно создано');
        
        // Если нужно, можно обновить список расписаний
        await this.loadData('schedule');
        
        return newSchedule;
      } catch (error) {
        console.error('[MainBodySettings] - addNewSchedule - Ошибка сохранения:', error);
        
        // Откатываем изменения в UI при ошибке сохранения
        this.schedules = this.schedules.filter(s => s.id !== newId);
        
        // Показываем сообщение об ошибке
        alert('Не удалось сохранить расписание на сервере. Попробуйте еще раз.');
        throw error;
      }
    },
  

  async addNewNotification(roomKey, paramKey) {
    // Получаем текущие уведомления для этой комнаты и параметра
    const existingNotifications = this.notifications.filter(n => 
      n.roomKey === roomKey && 
      n.paramKey === paramKey
    );
    
    // Определяем ID нового уведомления
    let newId = 1;
    if (existingNotifications.length > 0) {
      const existingIds = existingNotifications
        .map(n => n.id)
        .filter(id => id != null && typeof id === 'number');
      
      if (existingIds.length > 0) {
        newId = Math.max(...existingIds) + 1;
      }
    }
    
    const threshold = this.effectiveSetpointValue || 0;
    
    const newNotification = {
      id: newId,
      condition: 'greater_than', // 'greater_than', 'less_than', 'equals', 'changed'
      threshold: threshold,
      notificationType: 'email', // 'email', 'push', 'sms'
      roomKey: roomKey,
      paramKey: paramKey,
      paramTitle: this.itemData.paramTitle || 'Новое уведомление',
      createdAt: new Date().toISOString(),
      _modified: true,
      enabled: true,
      repeat: true,
      repeatInterval: 60, // минут
      messageTemplate: 'Значение параметра {param} достигло {threshold}'
    };
    
    // Добавляем уведомление
    this.notifications = [...this.notifications, newNotification];
    
    console.log('[MainBodySettings] - addNewNotification - Новое уведомление создано:', newNotification);
    
    // Сохраняем изменения
    await this.saveNotificationBlock();
    console.log('[MainBodySettings] - addNewNotification - Уведомление успешно сохранено');
  },
  
  async addNewStatistic(roomKey, paramKey) {
    // Получаем текущую аналитику для этой комнаты и параметра
    const existingAnalytics = this.analytics.filter(a => 
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
      paramTitle: this.itemData.paramTitle || 'Новая аналитика',
      createdAt: new Date().toISOString(),
      _modified: true,
      enabled: true,
      showTrend: true,
      showAverage: true
    };
    
    // Добавляем аналитику
    this.analytics = [...this.analytics, newStatistic];
    
    console.log('[MainBodySettings] - addNewStatistic - Новая аналитика создана:', newStatistic);
    
    // Сохраняем изменения
    await this.saveAnalyticBlock();
    console.log('[MainBodySettings] - addNewStatistic - Аналитика успешно сохранена');
  },
  

  // Методы сохранения (добавляем если их нет)
  // async saveScheduleBlock() {
  //   console.log('[MainBodySettings] - saveScheduleBlock - Сохраняем расписание');
  //   try {
  //     await this.saveSchedules({
  //       roomKey: this.itemData.roomKey,
  //       paramKey: this.effectiveSetpointKey,
  //       schedules: this.schedules
  //     });
  //   } catch (error) {
  //     console.error('[MainBodySettings] - saveScheduleBlock - Ошибка сохранения:', error);
  //     throw error;
  //   }
  // },
  
  async saveNotificationBlock() {
    try {
      // Если нет соответствующего action в store, сохраняем в localStorage
      const key = `notifications_${this.dID}_${this.itemData.roomKey}_${this.effectiveSetpointKey}`;
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
      const key = `analytics_${this.dID}_${this.itemData.roomKey}_${this.effectiveSetpointKey}`;
      localStorage.setItem(key, JSON.stringify(this.analytics));
      
      // Или вызываем action если он есть
      // await this.saveAnalytics({...});
    } catch (error) {
      console.error('[MainBodySettings] - saveAnalyticBlock - Ошибка сохранения:', error);
      throw error;
    }
  },


    
    
    closeMainBodySettings() {
      console.log('[MainBodySettings] Closing settings');
      
      // Простой возврат назад
      if (window.history.length > 1) {
        this.$router.go(-1);
      } else {
        this.$router.push('/dashboard');
      }
      
      this.$emit('close');
    },

    handleValueTypeChanged(event) {
      console.log('[MainBodySettings] - handleValueTypeChanged', event);
      // TODO: Обработка изменения типа значения
    },
    
    handleEditValue(scheduleId, event) {
      console.log('[MainBodySettings] - handleEditValue', scheduleId, event);
      // TODO: Обработка редактирования значения
    },
    
    handleDeleteSchedule(scheduleId) {
      console.log('[MainBodySettings] - handleDeleteSchedule', scheduleId);
      // TODO: Обработка удаления расписания
    },

    
    async loadData(dataType) {
      const roomKey = this.itemData.roomKey;
      const paramKey = this.itemData.paramKey;
      console.log('[MainBodySettings] Loading ', dataType, ' data for ', roomKey, paramKey);
      
      try {
        let result;
        result = await this.$store.dispatch('settingsConfig/getConfigSettings', {
            roomKey: roomKey,
            paramKey: paramKey,
            configType: dataType
          });

        // switch(dataType) {
        //   case 'schedule':
        //   result = await this.$store.dispatch('scheduleConfig/getConfigSettings', {
        //     roomKey: roomKey,
        //     paramKey: paramKey,
        //     configType: 'schedule'
        //   });
        //     break;
        //   case 'notifications':
        //     result = await this.$store.dispatch('scheduleConfig/getConfigSettings', {
        //     roomKey: roomKey,
        //     paramKey: paramKey,
        //     configType: 'notification'
        //   });
        //     break;
        //   case 'statistics':
        //     result = await this.$store.dispatch('scheduleConfig/getConfigSettings', {
        //     roomKey: roomKey,
        //     paramKey: paramKey,
        //     configType: 'statistics'
        //   });
        //     break;
        //   default:
        //     console.warn(`Unknown settings type: ${dataType}`);
        // }


        
        
        this.schedules = [...result];
        console.log(' -- $$$$$$$$$ -- [MainBodySettings] - loadSchedules - для - ', dataType, ' Получена конфигурация: ', this.schedules, ' количество элементов:', this.schedules.length);
        
      } catch (error) {
        console.error('[MainBodySettings] - loadSchedules - Ошибка загрузки:', error);
        this.schedules = [];
      }

    },
    



  }
};
</script>

<style lang="css" src="../assets/mainStyle.css">
</style>
