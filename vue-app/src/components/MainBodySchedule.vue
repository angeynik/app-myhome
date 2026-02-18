<!-- components/MainBodySchedule.vue -->
<template>
  <div class="settings-block" v-if="visible">

        <!-- Информация о расписании -->
    <div v-if="scheduleData.id" class="settings-info">
      <div class="settings-info-item">
        <span class="settings-info-value">ID:</span>
        <span class="settings-info-value">{{ scheduleData.id }}</span>
      </div>
      <div class="settings-info-item" v-if="scheduleData.createdAt">
        <span class="settings-info-value">Создано:</span>
        <span class="settings-info-value">{{ formatDate(scheduleData.createdAt) }}</span>
      </div>
      <div class="settings-info-item" v-if="scheduleData.updatedAt">
        <span class="settings-info-value">Обновлено:</span>
        <span class="settings-info-value">{{ formatDate(scheduleData.updatedAt) }}</span>
      </div>
    </div>
    <div class="settings-row">
     
    <!-- Первая колонка (80%) -->
    <div class="settings-col-first">


    <div class="settings-row">
        <!-- Первый столбец -->
        <!-- <p> Первый столбец </p> -->
          <div  class="settings-block-title clickable" @click.stop="toggleValueType" >
            <p> {{ valueTypeLabel }} </p>
          </div>

           <div style="width: 25vw;" class="settings-block clickable"
            @click.stop="editValue" >
            <div class="settings-value">
              {{ value }}
            </div>
            <span v-if="scheduleUnit">{{ scheduleUnit }}</span>
          </div>


        </div>

        <div class="settings-row">
        <!-- Второй столбец -->
        <!-- <p> Второй столбец </p> -->
          
            <div class="settings-block-title">
              <p> Период </p>
            </div>
            <div style="width: 25vw;"
              class="settings-block clickable"
              @click.stop="editStartTime"
            >
            <div class="settings-value">
              {{ displayStartTime }}
            </div>
              
            </div>
            <div class="settings_item-separator">—</div>
            <div style="width: 25vw;"
              class="settings-block clickable"
              @click.stop="editEndTime"
            >
            <div class="settings-value">
              {{ displayEndTime }}
              </div>
            </div>
          </div>

      </div>
      <!-- Вторая колонка (20%) -->
       <div class="settings-col-second">
        <div class="icon-settings item">
          <button class="mainBodySettings-header-button" @click="deleteScheduleItem">
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
        <!-- <button 
          class="settings-delete-button"
          @click="handleDelete"
          :title="`Удалить расписание для ${scheduleData.paramTitle}`"
        >
          Удалить
        </button> -->
        
      </div>  

    </div>
  </div>
</template>

<script>
import logger from '../store/modules/logger.js';
import { mapGetters, mapActions} from 'vuex';

export default {
  name: 'MainBodySchedule',
  
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    scheduleData: {
      type: Object,
      required: true
    },
    scheduleUnit: {
      type: String,
      default: null
    }
  },
 
  data() {
    return {
      timeEditMode: 'hours',
    };
  },
  
  computed: {
    ...mapGetters(['level']),
    ...mapGetters('settingsConfig', ['dateTimeUtils', 'validationUtils']),
    
    userLevel() {
      return this.level || 0;
    },
    
    valueTypeLabel() {
      return this.scheduleData.valueType === 'absolute' ? 'Новое значение' : 'Отклонение от Уставки';
    },
    
    value() {
      // Если данные еще не созданы
      if (!this.scheduleData || this.scheduleData.value === null || this.scheduleData.value === undefined) {
        return 'Не задано';
      }
      
      // Форматирование в зависимости от типа значения
      if (this.scheduleData.valueType === 'deviation') {
        const sign = this.scheduleData.value >= 0 ? '+' : '';
        return `${sign}${this.scheduleData.value.toFixed(1)}`;
      }
      
      return typeof this.scheduleData.value === 'number' 
        ? this.scheduleData.value.toFixed(1)
        : this.scheduleData.value;
    },
    displayStartTime() {
      return this.scheduleData.startTime || '00:00';
    },
    
    // Единое свойство для отображения времени окончания
    displayEndTime() {
      return this.scheduleData.endTime || '00:05';
    },

    
  },
  
  watch: {
    scheduleData: {
      handler(newData) {
        logger.dev('[MainBodySchedule] - Данные расписания обновлены:', newData);
      },
      deep: true
    }
  },
  
  methods: {
    ...mapActions('settingsConfig', [
      'timeToMinutes',
      'minutesToTime',
      'validateScheduleTime',
      'checkScheduleOverlap'
    ]),
    // Переключение типа значения
    toggleValueType(event) {
      event.stopPropagation(); // Добавьте эту строку
      
      
      //console.log('[MainBodySchedule] - toggleValueType - scheduleData:', this.scheduleData);
      this.$store.commit('UPDATE_SETTINGS_DATA', { 
        field: 'id', 
        value: this.scheduleData.id,
      });
      // console.log('[DashBoard] - selectComponent - ID комнаты в settingsData.payload:',
      //   this.$store.state.setpointsManager?.settingsData?.payload?.id
      // );

      const newType = this.scheduleData.valueType === 'absolute' ? 'deviation' : 'absolute';
      
      //console.log('[MainBodySchedule] - toggleValueType - Отправляем событие с ID:', scheduleId, 'новый тип:', newType);

      // Отправляем событие с данными в MainBodySettings
          this.$emit('getComponentData', {
            data: {
              'valueType': newType,
            }
          });
      
    },
    
    // Редактирование значения расписания
    editValue() {
      logger.dev('[MainBodySchedule] - editValue - Начало редактирования значения');
      this.$store.commit('UPDATE_SETTINGS_DATA', { 
        field: 'id', 
        value: this.scheduleData.id,
      });
      // Устанавливаем текущее значение или 0 по умолчанию
      const currentValue = this.scheduleData.value !== null && this.scheduleData.value !== undefined
        ? this.scheduleData.value
        : (this.scheduleData.valueType === 'absolute' ? 20 : 0);
      
      this.$emit('getComponentData', {
        data: {
              'value': currentValue,
            }
      });
    },
    

    editStartTime() {
        const timeString = this.scheduleData.startTime || '00:00';
        console.log('[MainBodySchedule] - Редактирование startTime:', timeString);
        const [hours, minutes] = timeString.split(':').map(Number);
        
        this.editTimeFieldWithToggle(hours, minutes);
    },
    
    editEndTime() {
        const timeString = this.scheduleData.endTime || '01:59';
        const [hours, minutes] = timeString.split(':').map(Number);
        
        this.editTimeFieldWithToggle( hours, minutes);
    },
    
    editTimeFieldWithToggle(currentHours, currentMinutes) {
        console.log('[MainBodySchedule] - Редактирование:', currentHours, currentMinutes);
        const editMode = this.timeEditMode;
        if (editMode === 'minutes') {
            this.$emit('getComponentData', {
                [editMode]: currentMinutes
            });
        } else {
            this.$emit('getComponentData', {
                [editMode]: currentHours
            });
        }
        
        // Переключаем режим
        this.timeEditMode = this.timeEditMode === 'minutes' ? 'hours' : 'minutes';
    },













    
    // Удаление расписания
    deleteScheduleItem() {
      if (!this.scheduleData.id) {
        logger.error('[MainBodySchedule] - deleteScheduleItem - Невозможно удалить: нет ID расписания');
        return;
      }
      
      const scheduleTitle = this.scheduleData.paramTitle || `расписание ID: ${this.scheduleData.id}`;
      
      // Запрос подтверждения
      if (!confirm(`Удалить расписание "${scheduleTitle}"?\n\nУдаление будет применено после сохранения изменений.`)) {
        return;
      }
      
      // Добавляем ID в список для отложенного удаления
      this.$emit('delete-schedule', {
        id: this.scheduleData.id,
        scheduleData: this.scheduleData
      });
      
      // Сразу скрываем элемент визуально (опционально)
      this.$el.style.opacity = '0.35';
      this.$el.style.pointerEvents = 'none';
      
      logger.info('[MainBodySchedule] - deleteScheduleItem - Расписание добавлено в список для удаления:', this.scheduleData.id);
      console.log('[MainBodySchedule] - deleteScheduleItem - Расписание добавлено в список для удаления:', this.scheduleData.id);
    },
   
    // Форматирование даты
    formatDate(dateString) {
      return this.dateTimeUtils.formatDate(dateString, 'ru-RU');
    },
    
    // validateScheduleTime(schedule) {
    //   const timeToMinutes = (time) => {
    //     const [hours, minutes] = time.split(':').map(Number);
    //     return hours * 60 + minutes;
    //   };
      
    //   const startMinutes = timeToMinutes(schedule.startTime);
    //   const endMinutes = timeToMinutes(schedule.endTime);
      
    //   // Проверяем, что endTime > startTime
    //   if (endMinutes <= startMinutes) {
    //     return {
    //       valid: false,
    //       message: 'Время окончания должно быть позже времени начала'
    //     };
    //   }
      
    //   return { valid: true };
    // },
    validateScheduleTimeSync(schedule) {
      // Используем синхронную логику через геттер
      const timeToMinutes = this.dateUtils.timeToMinutes;
      
      if (!schedule || !schedule.startTime || !schedule.endTime) {
        return {
          valid: false,
          message: 'Отсутствует время начала или окончания'
        };
      }
      
      const startMinutes = timeToMinutes(schedule.startTime);
      const endMinutes = timeToMinutes(schedule.endTime);
      
      if (endMinutes <= startMinutes) {
        return {
          valid: false,
          message: 'Время окончания должно быть позже времени начала'
        };
      }
      
      return { valid: true };
    },
    async checkScheduleOverlap(startTime, endTime, existingSchedules) {
      try {
        const result = await this.checkScheduleOverlap({
          startTime,
          endTime,
          existingSchedules
        });
        return result;
      } catch (error) {
        logger.error('[MainBodySchedule] - checkScheduleOverlap - Ошибка проверки:', error);
        return true; // В случае ошибки считаем, что есть пересечение
      }
    },
  
  }
};
</script>


<style lang="css" src="../assets/mainStyle.css"> 

</style>
