<!-- components/MainBodySettings.vue -->
<template>
  <!-- <h3 class="schedules-list-title">Настроенные расписания:</h3> -->
  <div>

      <div class="mainBodySettings">
        <div class="mainBodySettings-header-button"> 
          <button class="button-header" @click="addNewItem">
            <svg class="icon" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="44" cy="44" r="42" fill="#E0DFE7"/>
              <circle cx="44" cy="44" r="42" fill="#808080"/>
              <circle cx="44" cy="44" r="42" stroke="#34B534" stroke-width="4"/>
              <line x1="44.0005" y1="23" x2="44.0005" y2="63" stroke="#E0DFE7" stroke-width="8"/>
              <line x1="24" y1="43.0002" x2="64" y2="43.0002" stroke="#E0DFE7" stroke-width="8"/>
            </svg>
          </button>
        </div>
        <div class="mainBodySettings-title-container" @click="cycleTitle">
          <div class="mainBodySettings-header-title">{{ selectedTitle }}</div>
          <div class="mainBodySettings-header-title-others">
            {{ otherTitles.join(' • ') }}
          </div>
        </div>
        
        <div class="mainBodySettings-header-button"> 
          <button class="button-header" @click="closeMainBodySettings">
            <svg class="icon-close" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="43.1334" y1="14.8492" x2="14.8492" y2="43.1335" stroke="#FF4747" stroke-width="8"/>
              <line x1="14.8493" y1="14.8492" x2="43.1335" y2="43.1335" stroke="#FF4747" stroke-width="8"/>
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

      <div class="mainBodySettings-footer">
        <button class="mainBodySettings-ok-button" @click="closeMainBodySettings">Закрыть</button>
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
      'saveSchedules'
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

      switch(type) {
        case 'schedule':
          this.defaultItemValues = {
            roomKey: this.itemData.roomKey,
            paramKey: this.effectiveSetpointKey,
            value: this.effectiveSetpointValue || 0,
            unit: this.unit || '°C',
            days: [1, 2, 3, 4, 5] // Пн-Пт по умолчанию
          };
          this.addNewSchedule();
          break;
        case 'notifications':
          this.defaultItemValues = {
            roomKey: this.itemData.roomKey,
            paramKey: this.effectiveSetpointKey,
            threshold: this.effectiveSetpointValue || 0,
            condition: 'greater_than'
          };
          this.addNewNotification();
          break;
        case 'statistics':
          this.defaultItemValues = {
            roomKey: this.itemData.roomKey,
            paramKey: this.effectiveSetpointKey,
            chartType: 'line',
            period: 'day'
          };
          this.addNewStatistic();
          break;
        default:
          console.warn(`Unknown settings type: ${type}`);
      }
    },
  
  async addNewSchedule(roomKey, paramKey) {
    // Получаем текущие расписания для этой комнаты и параметра
    const existingSchedules = this.schedules.filter(s => 
      s.roomKey === roomKey && 
      s.paramKey === paramKey
    );
    
    // Создаем временные метки
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const startTime = `${currentHours}:${currentMinutes}`;
    
    // Время окончания (+1 час от текущего времени)
    const endTimeDate = new Date(now.getTime() + 60 * 60 * 1000);
    const endHours = endTimeDate.getHours().toString().padStart(2, '0');
    const endMinutes = endTimeDate.getMinutes().toString().padStart(2, '0');
    const endTime = `${endHours}:${endMinutes}`;
    
    // Проверка пересечения с существующими расписаниями
    const hasOverlap = this.checkScheduleOverlap(startTime, endTime, existingSchedules);
    if (hasOverlap) {
      alert('Новое расписание пересекается с существующим. Пожалуйста, выберите другое время.');
      return;
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
    
    const defaultValue = this.effectiveSetpointValue || 0;
    
    const newSchedule = {
      id: newId,
      startTime: startTime,
      endTime: endTime,
      value: defaultValue,
      valueType: 'absolute',
      unit: this.unit || '',
      roomKey: roomKey,
      paramKey: paramKey,
      paramTitle: this.itemData.paramTitle || 'Новое расписание',
      createdAt: now.toISOString(),
      _modified: true,
      days: [1, 2, 3, 4, 5], // Пн-Пт по умолчанию
      enabled: true
    };
    
    // Добавляем расписание
    this.schedules = [...this.schedules, newSchedule];
    
    console.log('[MainBodySettings] - addNewSchedule - Новое расписание создано:', newSchedule);
    
    // Сохраняем изменения
    await this.saveScheduleBlock();
    console.log('[MainBodySettings] - addNewSchedule - Расписание успешно сохранено');
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
  
  // Проверка пересечения расписаний
  checkScheduleOverlap(startTime, endTime, existingSchedules) {
    const [newStartHour, newStartMinute] = startTime.split(':').map(Number);
    const [newEndHour, newEndMinute] = endTime.split(':').map(Number);
    
    const newStart = newStartHour * 60 + newStartMinute;
    const newEnd = newEndHour * 60 + newEndMinute;
    
    return existingSchedules.some(schedule => {
      const [existingStartHour, existingStartMinute] = schedule.startTime.split(':').map(Number);
      const [existingEndHour, existingEndMinute] = schedule.endTime.split(':').map(Number);
      
      const existingStart = existingStartHour * 60 + existingStartMinute;
      const existingEnd = existingEndHour * 60 + existingEndMinute;
      
      return (newStart < existingEnd && newEnd > existingStart);
    });
  },

  // Методы сохранения (добавляем если их нет)
  async saveScheduleBlock() {
    try {
      await this.saveSchedules({
        roomKey: this.itemData.roomKey,
        paramKey: this.effectiveSetpointKey,
        schedules: this.schedules
      });
    } catch (error) {
      console.error('[MainBodySettings] - saveScheduleBlock - Ошибка сохранения:', error);
      throw error;
    }
  },
  
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

<!-- 
<style scoped>

.mainBodySettings {
  width: 100vw;
  /* background-color: blueviolet; */
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mainBodySettings-header {
  height: 14vh;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Автоматическая подгонка элементов по ширине от 120px до доступного пространства */
  background-color: blueviolet;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}
.mainBodySettings-header-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--light_font);
  margin-bottom: 4px;
}
.mainBodySettings-header-title-others {
  font-size: 0.9rem;
  color: var(--light_font);
  opacity: 0.7;
  line-height: 1.2;
}
.mainBodySettings-header-button {
    width: 15%;
}
.button-header {
  background: none; 
  border: none; 
  width: 70%;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mainBodySettings-title-container {
  cursor: pointer;
  padding: 8px 12px;
  margin: 1vw;
  text-align: center;
  width: 100%;
  transition: all 0.3s ease;
}
/* Секция добавления расписания */
.add-schedule-section {
  margin: 1.5rem 0;
  padding: 1rem;
  text-align: center;
  border-top: 1px solid rgba(224, 223, 231, 0.2);
  border-bottom: 1px solid rgba(224, 223, 231, 0.2);
}

.add-schedule-button {
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, var(--green), #2a9e2a);
  color: var(--light_font);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(52, 181, 52, 0.3);
}

.add-schedule-button:hover {
  background: linear-gradient(135deg, #2a9e2a, #1e7c1e);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(52, 181, 52, 0.4);
}

.add-schedule-button:active {
  transform: translateY(0);
}

/* Список расписаний */
.schedules-list {
  margin-top: 2rem;
}

.schedules-list-title {
  color: var(--light_font);
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(224, 223, 231, 0.3);
  text-align: left;
}

/* Сообщение об отсутствии расписаний */
.no-schedules {
  margin: 2rem 0;
  padding: 2rem;
  text-align: center;
  color: rgba(224, 223, 231, 0.6);
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  border: 1px dashed rgba(224, 223, 231, 0.3);
}

.no-schedules p {
  font-size: 1rem;
  margin: 0;
}
</style> -->