<!-- components/MainBodySchedule.vue -->
 <!-- $emit'getDataScheduleItem' - передает измененное значение параметра в экземпляре MainBodySchedule -->

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
      <button class="mainBodySettings-header-button" @click="deleteScheduleItem">
            <svg class="icon-settings close" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="44" cy="44" r="42" fill="#CC0000"/>
              <!-- Белый крестик -->
              <line x1="28" y1="28" x2="60" y2="60" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
              <line x1="60" y1="28" x2="28" y2="60" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
            </svg>
      </button>
      </div>

    
    <div class="settings-row">
     
    <!-- Первая колонка (80%) -->
    <div class="settings-col-first">


    <div class="settings-row">
        <!-- Первая строка -->
          <div  class="settings-block-title clickable" 
          :class="{ 'selected': isFieldSelected('valueType') }"
          @click.stop="toggleValueType" >
            <p> {{ valueTypeLabel }} </p>
          </div>

           <div class="settings-block clickable time-input"
           :class="{ 'selected': isFieldSelected('value') }"
            @click.stop="editValue" >
            <div class="settings-value">
              {{ value }}
            </div>
            <span v-if="scheduleUnit">{{ scheduleUnit }}</span>
          </div>


    </div>

    <div class="settings-row">
        <!-- Вторая строка -->
          
            <div class="settings-block-title">
              <p> Период </p>
            </div>
            <div class="settings-block clickable time-input" 
              :class="{ 'selected': isFieldSelected('startTime') }"
              @click.stop="editStartTime"
            >
            <div class="settings-value" v-html="formattedStartDisplay"></div>
              
            </div>
            <div class="settings-separator"></div>
            <div class="settings-block clickable time-input" 
              :class="{ 'selected': isFieldSelected('endTime') }"
              @click.stop="editEndTime"
            >
              <div class="settings-value" v-html="formattedEndDisplay"></div>
            </div>
    </div>

    </div>
      <!-- Вторая колонка (20%) -->
       <!-- <div class="settings-col-second">
        <div class="icon-settings item">
          <button class="mainBodySettings-header-button" @click="deleteScheduleItem">
            <svg class="icon-settings close" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">

              <circle class="hover-bg" cx="44" cy="44" r="42" fill="#CC0000" opacity="0"/>

              <circle cx="44" cy="44" r="42" fill="#FF4747"/>

              <circle cx="44" cy="44" r="42" stroke="#FF4747" stroke-width="4"/>

              <line x1="28" y1="28" x2="60" y2="60" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
              <line x1="60" y1="28" x2="28" y2="60" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
      </div>   -->

    </div>
  </div>
  
</template>

<script>
import logger from '../store/modules/logger.js';
import { mapGetters, mapActions} from 'vuex';
import { formatDate, formatTimeWithHighlight } from '@/utils/timeUtils';

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
    },
    activeSelection: {
      type: Object,
      default: null
    },
    handleInputPermit: {
      type: Boolean,
      default: false
    }
  },
 
  data() {
    return {
      timeEditMode: 'hours',
      localValueType: this.scheduleData.value_type || 'absolute',
      // selectedField: null,
    };
  },
  
  computed: {
    ...mapGetters(['level']),
    
    userLevel() {
      return this.level || 0;
    },
    
    valueTypeLabel() {
      return this.localValueType === 'absolute' ? 'Новое значение' : 'Отклонение от Уставки';
    },
   value() {
    // Если данные еще не созданы
    if (!this.scheduleData || this.scheduleData.value === null || this.scheduleData.value === undefined) {
      return 'Не задано';
    }
    
    // Получаем значение и преобразуем в число для форматирования
    const rawValue = this.scheduleData.value;
    
    // Функция для безопасного форматирования числа
    const safeToFixed = (val, digits = 1) => {
      if (typeof val === 'number') {
        return val.toFixed(digits);
      }
      if (typeof val === 'string' && !isNaN(parseFloat(val))) {
        return parseFloat(val).toFixed(digits);
      }
      return val; // Возвращаем как есть, если не число
    };
    
    // Форматирование в зависимости от типа значения
    if (this.localValueType === 'deviation') {
      const numericValue = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
      if (!isNaN(numericValue)) {
        const sign = numericValue >= 0 ? ' +' : '';
        return `${sign}${numericValue.toFixed(1)}`;
      }
      return rawValue; // Если не удалось преобразовать в число
    }
    
    // Для absolute типа
    return safeToFixed(rawValue, 1);
    },
    displayStartTime() {
      //console.log('[MainBodySchedule] - displayStartTime - startTime:', this.scheduleData.startTime);
      return String(this.scheduleData.startTime || '00:00');
    },
    
    // Единое свойство для отображения времени окончания
    displayEndTime() {
      return String(this.scheduleData.endTime || '00:05');
    },
    formattedStartDisplay() {
      return formatTimeWithHighlight(
        this.displayStartTime, this.timeEditMode, this.isFieldSelected('startTime')
      );
    },
    formattedEndDisplay() {
      return formatTimeWithHighlight(
        this.displayEndTime, this.timeEditMode, this.isFieldSelected('endTime')
      );
    },


    
  },
  
  watch: {
    scheduleData: {
      handler(newData) {
        logger.dev('[MainBodySchedule] - Данные расписания обновлены:', newData);
      },
      deep: true
    },
    // '$store.state.setpointsManager?.settingsData?.payload': {
    //   handler(newPayload) {
    //     // Если обновился value_type в store, обновляем локальные данные
    //     if (newPayload && newPayload.id === this.scheduleData.id) {
    //       // Можно обновить scheduleData если нужно
    //       this.$emit('update-schedule', {
    //         id: this.scheduleData.id,
    //         valueType: newPayload.value_type
    //       });
    //     }
    //   },
    //   deep: true
    // },
  },
  // created() {
  //   this.updateSettingsData({ field: 'type', value: 'post' });
  //   this.updateSettingsData({ field: 'request', value: 'updateschedules' });
  //   this.updatePayloadData({ config: 'schedules'});
  //   console.log('[MainBodySchedule] - created component - ', this.scheduleData, null, 2);
  // },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    formatDate,
    ...mapActions('settingsConfig', [
      'timeToMinutes',
      'minutesToTime',
      'validateScheduleTime',
      'checkScheduleOverlap'
    ]),
    ...mapActions('sortParams', [
      'setLimits',
    ]),
     ...mapActions(['updateSettingsData', 'updatePayloadData']),
    isFieldSelected(fieldName) {
      return this.activeSelection?.scheduleId === this.scheduleData.id 
          && this.activeSelection?.field === fieldName;
    },
    handleClickOutside(event) {
      if (this.$el && !this.$el.contains(event.target)) {
        this.selectedField = null;
      }
    },
    // formattedTime(timeProperty) {
    //   //console.log('[MainBodySchedule] - formattedTime - ', timeProperty);
    //   let timeString = this[timeProperty];
    //   //console.log('[MainBodySchedule] - formattedTime - timeString:', timeString);
      
    //   // Убедимся, что timeString - строка
    //   timeString = typeof timeString === 'string' ? timeString : String(timeString || '00:00');
      
    //   if (!timeString.includes(':')) {
    //     return timeString;
    //   }

    //   const [hours, minutes] = timeString.split(':');
    //   const fieldName = timeProperty === 'displayStartTime' ? 'startTime' : 'endTime';
    //   const isSelected = this.activeSelection?.scheduleId === this.scheduleData.id 
    //             && this.activeSelection?.field === fieldName;

    //   if (!isSelected) {
    //     return `${hours}:${minutes}`;
    //   }
    //   if (this.timeEditMode === 'minutes') {
    //     return `<span class="time-highlight-simple">${hours}</span> <span class="time-dimmed"> :${minutes}</span>`;
    //   } else {
    //     return `<span class="time-dimmed">${hours}:</span> <span class="time-highlight-simple">${minutes}</span>`;
    //   }

    // },




    // Переключение типа значения
    toggleValueType(event) {
      event.stopPropagation();
      
      this.updateSettingsData({ field: 'request', value: 'updateschedules' });
      // Определяем новый тип (переключаем)
      const currentType = this.localValueType;
      const newType = currentType === 'absolute' ? 'deviation' : 'absolute';
      this.localValueType = newType;
      let defaultValue;
      if (newType === 'absolute') {
        const rawValue = this.$store.state.setpointsManager?.settingsData?.payload?.value;
        const numValue = parseFloat(rawValue);
        defaultValue = isNaN(numValue) ? 20 : parseFloat(numValue.toFixed(1));
      } else {
        defaultValue = 0;
      }

      // Обновляем в store
      this.updatePayloadData({ 
        id: this.scheduleData.id,
        value: defaultValue,
        value_type: newType
      });
      this.$emit('getDataScheduleItem', {
              value: defaultValue,
              title: 'value_type',
              value_type: newType
                        
      });
      //this.$emit('field-selected', { scheduleId: this.scheduleData.id, field: 'valueType' });
      
    },
    // Редактирование значения расписания
    editValue() {
      if (!this.scheduleData) console.error('[MainBodySchedule] - editValue Значение scheduleData не определено', this.scheduleData);
      logger.dev('[MainBodySchedule] - editValue - Начало редактирования значения  - scheduleData', this.scheduleData);

      console.log('[MainBodySchedule] - editValue - Текущее значение value_type:', this.scheduleData);
      let currentValueType = this.localValueType;
      if ( currentValueType === undefined) {
        //console.error('[MainBodySchedule] - editValue - value_type не задан', currentValueType);
        currentValueType = 'absolute';
        this.updateSettingsData({ field: 'value_type', value: 'absolute' });
      }
      const field = 'value';
      this.updateSettingsData({ field: 'request', value: 'updateschedules' });
      this.setLimits({
        param: this.$store.state.setpointsManager?.settingsData?.payload?.param, 
        valueType: currentValueType, 
      });

      this.$emit('field-selected', { scheduleId: this.scheduleData.id, field: 'value' });

      const currentValue = this.scheduleData.value !== null && this.scheduleData.value !== undefined
        ? this.scheduleData.value
        : (this.localValueType === 'absolute' ? 20 : 0);
      //const currentValue = this.scheduleData.valueType === 'absolute' ? 20 : 0;

      logger.dev('[MainBodySchedule] - editValue - Начало редактирования значения');
      this.updatePayloadData({ 
        id: this.scheduleData.id,
        value: currentValue,
        value_type: currentValueType,
        value_name: field, 
        value_details: ''
      });    
      console.log ('[MainBodySchedule] - editValue - Начало редактирования значения');
      this.$emit('getDataScheduleItem', {
              value: currentValue,
              title: field,
              value_type: currentValueType           
      });
    },

    

    editStartTime() {
      this.$emit('field-selected', { scheduleId: this.scheduleData.id, field: 'startTime' });
        const timeString = this.scheduleData.startTime || '00:00';
        //console.log('[MainBodySchedule] - Редактирование startTime:', timeString);
        const [hours, minutes] = timeString.split(':').map(Number);
        
        this.editTimeFieldWithToggle('startTime', hours, minutes);
    },
    
    editEndTime() {
      this.$emit('field-selected', { scheduleId: this.scheduleData.id, field: 'endTime' });
        const timeString = this.scheduleData.endTime || '00:05';
        const [hours, minutes] = timeString.split(':').map(Number);      
        this.editTimeFieldWithToggle('endTime', hours, minutes);
    },
    
    editTimeFieldWithToggle(selectedField, currentHours, currentMinutes) {
      this.updateSettingsData({ field: 'request', value: 'updateschedules' });
      //console.groupCollapsed('[MainBodySchedule] - editTimeFieldWithToggle');
      // if (this.scheduleData[this.selectedField] === undefined) {
      //   this.scheduleData[this.selectedField] = `00:00`;
      // }
        //console.log('[MainBodySchedule] - Редактирование:', currentHours, currentMinutes, this.scheduleData[this.selectedField]);
        this.updatePayloadData({ 
              id: this.scheduleData.id,
              value: this.scheduleData[selectedField],
              value_name: selectedField,
              value_details: this.timeEditMode
            });
        const editMode = this.timeEditMode;
        // Устанавливаем лимиты
          const params = {
            param: editMode, 
            valueType: '', 
          }
          //console.log('[MainBodySettings] - editValue - params:', params);
          this.setLimits(params);

        if (editMode === 'minutes') {
            this.$emit('getDataScheduleItem', {
                value: currentMinutes,
                title: selectedField,
                value_details: 'minutes'
            });
        } else {
            this.$emit('getDataScheduleItem', {
                value: currentHours,
                title: selectedField,
                value_details: 'hours'
            });
        }
        
        // Переключаем режим
        this.timeEditMode = this.timeEditMode === 'minutes' ? 'hours' : 'minutes';
        //console.groupEnd();
    },
    
    // Удаление расписания
    deleteScheduleItem() {
      if (!this.scheduleData.id) {
        logger.error('[MainBodySchedule] - deleteScheduleItem - Невозможно удалить: нет ID расписания');
        return;
      }
      console.log('[MainBodySchedule] - deleteScheduleItem - Список Расписаний ', this.scheduleData);
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
    // async checkScheduleOverlap(startTime, endTime, existingSchedules) {
    //   try {
    //     const result = await this.checkScheduleOverlap({
    //       startTime,
    //       endTime,
    //       existingSchedules
    //     });
    //     return result;
    //   } catch (error) {
    //     logger.error('[MainBodySchedule] - checkScheduleOverlap - Ошибка проверки:', error);
    //     return true; // В случае ошибки считаем, что есть пересечение
    //   }
    // },
  
  }
};
</script>


<style lang="css" src="../assets/mainStyle.css"> 

</style>
