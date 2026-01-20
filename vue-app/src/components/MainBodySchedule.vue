<!-- components/MainBodySchedule.vue -->
<template>
  <div class="schedule-block" v-if="visible">
    <div class="schedule-row">
      <!-- Первая колонка (40%) -->
      <div class="schedule-col schedule-col-40">
        <div class="schedule-field">
          <div 
            class="schedule-field-header clickable"
            @click.stop="toggleValueType"
          >
            {{ valueTypeLabel }}
          </div>
          <div 
            class="schedule-field-value clickable"
            @click.stop="editScheduleValue"
          >
            {{ formattedScheduleValue }}
            <span v-if="scheduleUnit">{{ scheduleUnit }}</span>
          </div>
        </div>
      </div>
      
      <!-- Вторая колонка (50%) -->
      <div class="schedule-col schedule-col-50">
        <div class="schedule-field">
          <div class="schedule-field-header">
            Период
          </div>
          <div class="schedule-time-fields">
            <div 
              class="schedule-time-field clickable"
              @click.stop="editStartTime"
            >
              {{ scheduleData.startTime || '00:00' }}
            </div>
            <div class="schedule-time-separator">—</div>
            <div 
              class="schedule-time-field clickable"
              @click.stop="editEndTime"
            >
              {{ scheduleData.endTime || '23:59' }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Третья колонка (10%) -->
      <div class="schedule-col schedule-col-10" v-if="userLevel >= 0 && scheduleData.id">
        <button 
          class="schedule-delete-button"
          @click="handleDelete"
          :title="`Удалить расписание для ${scheduleData.paramTitle}`"
        >
          Удалить
        </button>
      </div>
    </div>
    
    <!-- Информация о расписании -->
    <div v-if="scheduleData.id" class="schedule-info">
      <div class="schedule-info-item">
        <span class="schedule-info-label">ID:</span>
        <span class="schedule-info-value">{{ scheduleData.id }}</span>
      </div>
      <div class="schedule-info-item" v-if="scheduleData.createdAt">
        <span class="schedule-info-label">Создано:</span>
        <span class="schedule-info-value">{{ formatDate(scheduleData.createdAt) }}</span>
      </div>
      <div class="schedule-info-item" v-if="scheduleData.updatedAt">
        <span class="schedule-info-label">Обновлено:</span>
        <span class="schedule-info-value">{{ formatDate(scheduleData.updatedAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import logger from '../store/modules/logger.js';
import { mapGetters } from 'vuex';

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
    };
  },
  
  computed: {
    ...mapGetters(['level']),
    
    userLevel() {
      return this.level || 0;
    },
    
    valueTypeLabel() {
      return this.scheduleData.valueType === 'absolute' ? 'Новое значение' : 'Отклонение от Уставки';
    },
    
    formattedScheduleValue() {
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
    // Переключение типа значения
toggleValueType(event) {
  event.stopPropagation(); // Добавьте эту строку
  
  console.log('[MainBodySchedule] - toggleValueType - scheduleData:', this.scheduleData);
  
  // Используем ID или временный ID
  const scheduleId = this.scheduleData.id || this.scheduleData._tempId;
  const newType = this.scheduleData.valueType === 'absolute' ? 'deviation' : 'absolute';
  
  console.log('[MainBodySchedule] - toggleValueType - Отправляем событие с ID:', scheduleId, 'новый тип:', newType);
  
  this.$emit('value-type-changed', {
    scheduleId: scheduleId,
    newValueType: newType
  });
},
    
    // Редактирование значения расписания
    editScheduleValue() {
      logger.dev('[MainBodySchedule] - editScheduleValue - Начало редактирования значения');
      
      // Определяем лимиты в зависимости от типа значения
      let limits;
      let label = 'Значение расписания';
      if (this.scheduleData.valueType === 'absolute') {
        // Абсолютное значение - используем стандартные лимиты
        limits = {
          min: -50,
          max: 50,
          step: 0.25
        };
      } else {
        // Отклонение - ограничиваем диапазон
        limits = {
          min: -20,
          max: 20,
          step: 0.1
        };
        label = 'Отклонение от уставки';
      }
      
      // Устанавливаем текущее значение или 0 по умолчанию
      const currentValue = this.scheduleData.value !== null && this.scheduleData.value !== undefined
        ? this.scheduleData.value
        : (this.scheduleData.valueType === 'absolute' ? 20 : 0);
      
      this.$emit('edit-value', {
        field: 'value',
        value: currentValue,
        limits: limits,
        type: 'number',
        label: label
      });
    },
    
    // Редактирование времени начала
    editStartTime() {
      this.editTimeField('startTime', 'Время начала');
    },
    
    // Редактирование времени окончания
    editEndTime() {
      this.editTimeField('endTime', 'Время окончания');
    },
    
    // Общий метод для редактирования времени
    editTimeField(field, label) {
      logger.dev(`[MainBodySchedule] - editTimeField - Редактирование ${label}`);
      
      const timeString = this.scheduleData[field] || '00:00';
      const [hours, minutes] = timeString.split(':').map(Number);
      const valueInMinutes = hours * 60 + minutes;
      
      this.$emit('edit-value', {
        field: field,
        value: valueInMinutes,
        limits: {
          min: 0,
          max: 1439, // 23:59
          step: 5 // 5 минут
        },
        type: 'time',
        label: label
      });
    },
    
    // Удаление расписания
    handleDelete() {
      if (!this.scheduleData.id) {
        logger.error('[MainBodySchedule] - handleDelete - Невозможно удалить: нет ID расписания');
        return;
      }
      
      if (!confirm(`Удалить расписание "${this.scheduleData.paramTitle}"?`)) {
        return;
      }
      
      this.$emit('delete-schedule', this.scheduleData.id);
    },
    
    // Форматирование даты
    formatDate(dateString) {
      if (!dateString) return '—';
      
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return dateString;
      }
    },
    
    validateScheduleTime(schedule) {
      const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const startMinutes = timeToMinutes(schedule.startTime);
      const endMinutes = timeToMinutes(schedule.endTime);
      
      // Проверяем, что endTime > startTime
      if (endMinutes <= startMinutes) {
        return {
          valid: false,
          message: 'Время окончания должно быть позже времени начала'
        };
      }
      
      return { valid: true };
    },
  }
};
</script>

<style scoped>
/* Стили для блока расписания */
.schedule-block {
  width: 100%;
  margin: 1.5rem 0;
  padding: 1.2rem;
  background: linear-gradient(135deg, rgba(77, 87, 108, 0.8), rgba(30, 30, 49, 0.9));
  border-radius: 12px;
  border: 1px solid rgba(224, 223, 231, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.schedule-block:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  border-color: rgba(224, 223, 231, 0.3);
}

.schedule-row {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.schedule-col {
  display: flex;
  flex-direction: column;
}

.schedule-col-40 {
  flex: 0 0 40%;
  min-width: 40%;
}

.schedule-col-50 {
  flex: 0 0 50%;
  min-width: 50%;
}

.schedule-col-10 {
  flex: 0 0 10%;
  min-width: 10%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.schedule-field {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 120px;
}

.schedule-field-header {
  height: 25%;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--light_font);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.3rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
}

.schedule-field-header.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.schedule-field-header.clickable:hover {
  color: var(--orange);
  background: rgba(249, 123, 0, 0.1);
  transform: translateY(-2px);
}

.schedule-field-value {
  height: 75%;
  font-size: 1.8rem;
  color: var(--light_font);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 1px solid rgba(224, 223, 231, 0.3);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  transition: all 0.3s ease;
}

.schedule-field-value.clickable {
  cursor: pointer;
}

.schedule-field-value.clickable:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--orange);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(249, 123, 0, 0.2);
}

.schedule-field-value .unit {
  font-size: 1rem;
  margin-left: 0.5rem;
  opacity: 0.8;
}

.schedule-time-fields {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 75%;
  gap: 0.8rem;
  padding: 1rem 0;
}

.schedule-time-field {
  flex: 1;
  height: 100%;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(224, 223, 231, 0.3);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
  font-size: 1.6rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0.5rem;
}

.schedule-time-field:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--orange);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(249, 123, 0, 0.2);
}

.schedule-time-separator {
  color: var(--light_font);
  font-size: 1.4rem;
  font-weight: bold;
  padding: 0 0.3rem;
  opacity: 0.7;
}

.schedule-delete-button {
  width: 100%;
  padding: 0.8rem 1rem;
  background: linear-gradient(135deg, var(--red), #d93636);
  color: var(--light_font);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(249, 30, 0, 0.3);
}

.schedule-delete-button:hover {
  background: linear-gradient(135deg, #d93636, #c12a2a);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(249, 30, 0, 0.4);
}

.schedule-delete-button:active {
  transform: translateY(0);
}

.schedule-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(224, 223, 231, 0.2);
}

.schedule-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}

.schedule-info-label {
  color: rgba(224, 223, 231, 0.7);
  font-weight: 500;
}

.schedule-info-value {
  color: var(--light_font);
  font-weight: 600;
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .schedule-row {
    flex-direction: column;
    gap: 1.2rem;
  }
  
  .schedule-col-40,
  .schedule-col-50,
  .schedule-col-10 {
    flex: 0 0 100%;
    min-width: 100%;
  }
  
  .schedule-field {
    min-height: 100px;
  }
  
  .schedule-field-header {
    height: 30%;
    font-size: 0.8rem;
  }
  
  .schedule-field-value {
    height: 70%;
    font-size: 1.5rem;
  }
  
  .schedule-time-fields {
    flex-direction: row;
    gap: 0.5rem;
  }
  
  .schedule-time-field {
    min-height: 70px;
    font-size: 1.3rem;
  }
  
  .schedule-delete-button {
    padding: 1rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .schedule-block {
    padding: 1rem;
  }
  
  .schedule-field-value {
    font-size: 1.3rem;
  }
  
  .schedule-time-field {
    font-size: 1.1rem;
    min-height: 60px;
  }
  
  .schedule-time-separator {
    font-size: 1.2rem;
  }
}

/* Темная тема для улучшения контраста */
.schedule-block.dark {
  background: linear-gradient(135deg, rgba(30, 30, 49, 0.95), rgba(20, 20, 35, 0.95));
  border-color: rgba(224, 223, 231, 0.15);
}

.schedule-field-value.dark {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(224, 223, 231, 0.2);
}

.schedule-time-field.dark {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(224, 223, 231, 0.2);
}
</style>