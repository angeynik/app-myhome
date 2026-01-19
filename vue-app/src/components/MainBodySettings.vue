<!-- components/MainBodySettings.vue -->
<template>
  <!-- <h3 class="schedules-list-title">Настроенные расписания:</h3> -->
  <div @click.self="closeMainBodySettings">

      <div class="mainBodySettings">
        <div class="mainBodySettings-header-button"> 
          <button class="button-header" @click="addNewScheduleItem">
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

          <div v-if="selectedTitle === 'Расписание' && schedules.length === 0" class="no-schedules">
            <p>Расписания для этого параметра не настроены.</p>
            
          </div>
                    <div v-if="selectedTitle === 'Уведомления'" class="no-schedules">
            <p>Уведомления для выбранного параметра не настроены.</p>
          </div>
          <div v-if="selectedTitle === 'Аналитика' " class="no-schedules">
            <p>Отсутствует Аналитика для выбранного параметра.</p>
          </div>
        </div>

        <!-- <p> {{this.roomKey}}</p> -->

      </div>

      <div class="mainBodySettings-footer">
        <button class="mainBodySettings-ok-button" @click="closeMainBodySettings">Закрыть</button>
      </div>

  </div>
</template>

<script>
import logger from '../store/modules/logger.js';
import { mapMutations, mapGetters, mapActions } from 'vuex';
//import MainBodySchedule from './MainBodySchedule.vue';

export default {
  name: 'MainBodySettings',
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

      showAddSchedule: true,
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
      }
    };
  },
  computed: {
    ...mapGetters('scheduleConfig', ['typeSettings']),
    ...mapGetters('notificationsConfig', ['typeSettings']),
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
        setpointTitle: this.getSetpointTitle
      };
    },
    currentType() {
      return this.title;
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
    
  },
  created() {
    console.log('[MainBodySettings] - created', {
      itemData: this.itemData,
      level: this.userLevel,
      currentType: this.title
    });
    this.loadCurrentSettings();
  },
  watch: {
    currentType(newType) {
      console.log('[MainBodySettings] type changed to:', newType);
      this.loadCurrentSettings();
    }
  },
 
  methods: {
    ...mapMutations('config', ['SET_TYPE_SETTINGS_ITEM']),
    ...mapActions('scheduleConfig', [
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
        const type = this.currentType;
        console.log(`[MainBodySettings] Loading ${type} data`);
        
        switch(type) {
          case 'schedule':
            await this.loadSchedules();
            break;
          case 'notifications':
            await this.loadNotifications();
            break;
          case 'statistics':
            await this.loadAnalytics();
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

    addNewScheduleItem() {
      console.log('[MainBodySettings] - addNewScheduleItem');
      // TODO: Реализовать добавление нового расписания
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

    
    async loadSchedules() {
      console.log('[MainBodySettings] Loading schedules');
      this.schedules = []; // Заменить на реальную загрузку
    },
    
    // Загрузка уведомлений (заглушка)
    async loadNotifications() {
      console.log('[MainBodySettings] Loading notifications');
      this.notifications = []; // Заменить на реальную загрузку
    },
    
    // Загрузка аналитики (заглушка)
    async loadAnalytics() {
      console.log('[MainBodySettings] Loading analytics');
      this.analytics = []; // Заменить на реальную загрузку
    },



  }
};
</script>

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
</style>