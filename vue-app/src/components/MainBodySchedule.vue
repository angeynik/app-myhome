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

    </div>
  </div>
  
</template>

<script>
import logger from '../store/modules/logger.js';
import { mapGetters, mapActions} from 'vuex';
import { formatDate, formatTimeWithHighlight } from '@/utils/timeUtils';
import { extractTimePart, getTimeLimits } from '@/utils/timeFieldEditor';

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
    if (!this.scheduleData || this.scheduleData.value === null || this.scheduleData.value === undefined) {
      return 'Не задано';
    }
    
    const rawValue = this.scheduleData.value;
    
    const safeToFixed = (val, digits = 1) => {
      if (typeof val === 'number') {
        return val.toFixed(digits);
      }
      if (typeof val === 'string' && !isNaN(parseFloat(val))) {
        return parseFloat(val).toFixed(digits);
      }
      return val; // Возвращаем как есть, если не число
    };
    
    if (this.localValueType === 'deviation') {
      const numericValue = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
      if (!isNaN(numericValue)) {
        const sign = numericValue >= 0 ? ' +' : '';
        return `${sign}${numericValue.toFixed(1)}`;
      }
      return rawValue; // Если не удалось преобразовать в число
    }
    
    return safeToFixed(rawValue, 1);
    },
    displayStartTime() {
      return String(this.scheduleData.startTime || '00:00');
    },
    
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
    // Локальный тип значения синхронизируется с данными (например, после ответа сервера)
    'scheduleData.value_type'(newType) {
      this.localValueType = newType || 'absolute';
    },
  },
  methods: {
    formatDate,
    ...mapActions('sortParams', [
      'setLimits',
    ]),
     ...mapActions(['updateSettingsData', 'updatePayloadData']),
    isFieldSelected(fieldName) {
      return this.activeSelection?.scheduleId === this.scheduleData.id 
          && this.activeSelection?.field === fieldName;
    },

    toggleValueType(event) {
      event.stopPropagation();
      
      this.updateSettingsData({ field: 'request', value: 'updateschedules' });
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
      
    },
    editValue() {
      if (!this.scheduleData) console.error('[MainBodySchedule] - editValue Значение scheduleData не определено', this.scheduleData);
      logger.dev('[MainBodySchedule] - editValue - Начало редактирования значения  - scheduleData', this.scheduleData);

      let currentValueType = this.localValueType;
      if ( currentValueType === undefined) {
        currentValueType = 'absolute';
        this.updateSettingsData({ field: 'value_type', value: 'absolute' });
      }
      const field = 'value';
      this.updateSettingsData({ field: 'request', value: 'updateschedules' });
      this.setLimits({
        param: this.$store.state.setpointsManager?.settingsData?.payload?.key, 
        valueType: currentValueType, 
      });

      this.$emit('field-selected', { scheduleId: this.scheduleData.id, field: 'value' });

      const currentValue = this.scheduleData.value !== null && this.scheduleData.value !== undefined
        ? this.scheduleData.value
        : (this.localValueType === 'absolute' ? 20 : 0);

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
      this.editTimeFieldWithToggle('startTime', timeString);
    },
    
    editEndTime() {
      this.$emit('field-selected', { scheduleId: this.scheduleData.id, field: 'endTime' });
      const timeString = this.scheduleData.endTime || '00:05';
      this.editTimeFieldWithToggle('endTime', timeString);
    },
    

        
    
  editTimeFieldWithToggle(selectedField, timeString) {
    this.updateSettingsData({ field: 'request', value: 'updateschedules' });

    const editMode = this.timeEditMode; // 'hours' или 'minutes'
    const currentPartValue = extractTimePart(timeString, editMode);
    const limits = getTimeLimits(editMode);

    this.updatePayloadData({ 
      id: this.scheduleData.id,
      value: timeString,          // ← всегда строка "HH:MM"
      value_name: selectedField,  // 'startTime' или 'endTime'
      value_details: editMode,    // 'hours' или 'minutes'
    });

    this.$store.dispatch('updateLimitsData', limits);

    this.$emit('getDataScheduleItem', {
      value: currentPartValue,      // число: часы ИЛИ минуты
      title: selectedField,         // 'startTime' | 'endTime'
      value_details: editMode,      // 'hours' | 'minutes'
    });

    this.timeEditMode = editMode === 'minutes' ? 'hours' : 'minutes';
  },

    deleteScheduleItem() {
      if (!this.scheduleData.id) {
        logger.error('[MainBodySchedule] - deleteScheduleItem - Невозможно удалить: нет ID расписания');
        return;
      }
      const scheduleTitle = this.scheduleData.paramTitle || `расписание ID: ${this.scheduleData.id}`;
      
      if (!confirm(`Удалить расписание "${scheduleTitle}"?\n\nУдаление будет применено после сохранения изменений.`)) {
        return;
      }
      
      this.$emit('delete-schedule', {
        id: this.scheduleData.id,
        scheduleData: this.scheduleData
      });
      
      this.$el.style.opacity = '0.35';
      this.$el.style.pointerEvents = 'none';
      
      logger.info('[MainBodySchedule] - deleteScheduleItem - Расписание добавлено в список для удаления:', this.scheduleData.id);
    },
   
    
  
  }
};
</script>

