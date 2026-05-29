<!-- components/MainBodyStatistic.vue -->
<template>
  <div class="settings-block" v-if="statisticData">

    <!-- Информация о записи (без изменений) -->
    <div v-if="statisticData.id" class="settings-info">
      <div class="settings-info-item">
        <span class="settings-info-value">ID:</span>
        <span class="settings-info-value">{{ statisticData.id }}</span>
      </div>
      <div class="settings-info-item" v-if="statisticData.createdAt">
        <span class="settings-info-value">Создано:</span>
        <span class="settings-info-value">{{ formatDate(statisticData.createdAt) }}</span>
      </div>
      <div class="settings-info-item" v-if="statisticData.updatedAt">
        <span class="settings-info-value">Обновлено:</span>
        <span class="settings-info-value">{{ formatDate(statisticData.updatedAt) }}</span>
      </div>
      <button class="mainBodySettings-header-button" @click="deleteNotificationItem">
        <svg class="icon-settings close" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle class="hover-bg" cx="33" cy="33" r="31" fill="#CC0000" opacity="0"/>
          <circle cx="33" cy="33" r="31" fill="#FF4747"/>
          <circle cx="33" cy="33" r="31" stroke="#FF4747" stroke-width="3"/>
          <line x1="21" y1="21" x2="45" y2="45" stroke="#E0DFE7" stroke-width="6" stroke-linecap="round"/>
          <line x1="45" y1="21" x2="21" y2="45" stroke="#E0DFE7" stroke-width="6" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- Двухколоночная группировка -->
    <div class="settings-two-columns">
      <!-- Левая колонка -->
      <div class="settings-column">
        <div class="settings-row">
          <div class="settings-block-title">
            <p>Сохранение Значения параметра</p>
          </div>
          <div
            class="settings-block clickable statistic-checkbox-field"
            :class="{ 'selected': isFieldSelected('value') }"
            @click.stop="toggleValue($event, 'value')"
          >
            <div class="checkbox-custom" :class="{ 'checked': statisticData?.value }">
              <svg v-if="statisticData?.value" viewBox="0 0 32 32" fill="none" width="32" height="32">
                <polyline points="29 9 16 26 3 13" stroke="#4cd964" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="settings-row">
          <div class="settings-block-title">
            <p>Сохранение Уставки</p>
          </div>
          <div
            class="settings-block clickable statistic-checkbox-field"
            :class="{ 'selected': isFieldSelected('setpoint') }"
            @click.stop="toggleValue($event, 'setpoint')"
          >
            <div class="checkbox-custom" :class="{ 'checked': statisticData?.setpoint }">
              <svg v-if="statisticData?.setpoint" viewBox="0 0 32 32" fill="none" width="32" height="32">
                <polyline points="29 9 16 26 3 13" stroke="#4cd964" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="settings-row">
          <div class="settings-block-title">
            <p>Сохранение Уставки устройства</p>
          </div>
          <div
            class="settings-block clickable statistic-checkbox-field"
            :class="{ 'selected': isFieldSelected('devSetpoint') }"
            @click.stop="toggleValue($event, 'devSetpoint')"
          >
            <div class="checkbox-custom" :class="{ 'checked': statisticData?.devSetpoint }">
              <svg v-if="statisticData?.devSetpoint" viewBox="0 0 32 32" fill="none" width="32" height="32">
                <polyline points="29 9 16 26 3 13" stroke="#4cd964" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Правая колонка -->
      <div class="settings-column">
        <div class="settings-row">
          <div class="settings-block-title">
            <p>Сохранение смены сезона</p>
          </div>
          <div
            class="settings-block clickable statistic-checkbox-field"
            :class="{ 'selected': isFieldSelected('changeSeason') }"
            @click.stop="toggleValue($event, 'changeSeason')"
          >
            <div class="checkbox-custom" :class="{ 'checked': statisticData?.changeSeason }">
              <svg v-if="statisticData?.changeSeason" viewBox="0 0 32 32" fill="none" width="32" height="32">
                <polyline points="29 9 16 26 3 13" stroke="#4cd964" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>





      <div class="settings-row relative">
          <div class="settings-block-title">
            <p>Период сохранения</p>
          </div>
          <div
            class="settings-block-title clickable"
            :class="{ 'selected': isFieldSelected('savePeriod') }"
            @click.stop="cycleSavePeriod"
          >
        <div v-if="statisticData.savePeriod === 0" class="statistic-value">{{ savePeriodLabel }}</div>
        <div v-else class="settings-value">{{ savePeriodLabel }}</div>

          </div>
        </div>

        <div class="settings-row">
          <div class="settings-block-title">
            <p>Зона нечувствительности</p>
          </div>
          <div
            class="settings-block-title clickable"
            :class="{ 'selected': isFieldSelected('sensityRate') }"
            @click.stop="editSensityRate"
          >
            <div class="settings-value">{{ sensityRateDisplay }}</div>
          </div>
        </div>



      </div>
    </div>
  </div>
</template>

<script>
import logger from '../store/modules/logger.js';
import { mapGetters, mapActions } from 'vuex';
import { formatDate} from '@/utils/timeUtils';

const PERIODS = [0, 5, 15, 30, 60, 120, 180, 300, 720, 1440, 10080, 302400];

const TYPE_LABELS = {
  0: 'Web',
  1: 'Telegram',
  2: 'Web + Telegram'
};

export default {
  name: 'MainBodyStatistic',

  props: {
    statisticData: {
      type: Object,
      required: true,
    },
    statisticUnit: {
      type: String,
      default: null,
    },
    activeSelection: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      timeEditMode: 'hours',
    };
  },

  emits: ['delete-statistic', 'getDataStatisticItem', 'field-selected'],

  computed: {
    ...mapGetters(['level']),

    userLevel() {
      return this.level || 0;
    },

    unit() {
      return this.statisticUnit || '';
    },

    valueLabel() {
      return this.statisticData.value || '???';
    },

    savePeriodOptions() {
      return [0, 5, 15, 30, 60, 120, 180, 300, 720, 1440, 10080, 302400];
    },
    savePeriodLabel() {
      return this.formatPeriodLabel(this.statisticData.savePeriod);
    },
    sensityRateDisplay() {
      const v = this.statisticData.sensityRate;
      if (v === null || v === undefined) return '???';
      return typeof v === 'number' ? v.toFixed(1) : v;
    },


  },

  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },

  methods: {
    formatDate, 
    ...mapActions(['updateSettingsData', 'updatePayloadData']),
    ...mapActions('sortParams', ['setLimits']),

    isFieldSelected(fieldName) {
      return (
        this.activeSelection?.statisticId === this.statisticData.id &&
        this.activeSelection?.field === fieldName
      );
    },
    handleClickOutside(event) {
      if (this.$el && !this.$el.contains(event.target)) {
        // сброс выделения – управляется родителем
      }
    },

  selectValue (event, fieldName) {
    event.stopPropagation();
    console.log('[MainBodyStatistic] - selectValue - Определяем выбранный параметр', fieldName);

  }, 

  toggleValue (event, fieldName) {
    event.stopPropagation();
    console.log('[MainBodyStatistic] - selectValue - Определяем выбранный параметр', fieldName);
    this.$emit('field-selected', { statisticId: this.statisticData.id, field: fieldName });
    this.updateSettingsData({ field: 'request', value: 'updatestatistics' });

    const newValue = this.statisticData[fieldName] === false ? true : false;

      this.updatePayloadData({
        id: this.statisticData.id,
        value: newValue,
        value_name: fieldName,
        value_type: '',
      });
      // Отправляем событие родителю для немедленного обновления
      this.$emit('getDataStatisticItem', {
        title: fieldName,
        value_type: '',
        value: newValue,
      });



  },
  formatPeriodLabel(period) {
    if (period === 0) return 'При отклонении';
    if (period === 60) return '1 час';
    if (period === 120) return '2 часа';
    if (period === 180) return '3 часа';
    if (period === 300) return '5 часов';
    if (period === 720) return '12 часов';
    if (period === 1440) return '1 сутки';
    if (period === 10080) return '1 неделя';
    if (period === 302400) return '1 месяц';
    return `${period} мин`;
  },
  cycleSavePeriod(event) {
    event.stopPropagation();
    this.$emit('field-selected', { statisticId: this.statisticData.id, field: 'savePeriod' });
    this.updateSettingsData({ field: 'request', value: 'updatestatistics' });
    
    
    const current = this.statisticData.savePeriod;
    const currentIndex = PERIODS.indexOf(current);
    const nextIndex = (currentIndex + 1) % PERIODS.length;
    const nextPeriod = PERIODS[nextIndex];
    console.log('[MainBodyStatistic] - cycleSavePeriod - Изменяем Период срабатывания, текущий - ', current, ' слдующий - ', nextPeriod);
    
    this.updatePayloadData({
      id: this.statisticData.id,
      value: nextPeriod,
      value_name: 'savePeriod',
      value_type: '',
    });
    
    this.$emit('getDataStatisticItem', {
      title: 'savePeriod',
      value: nextPeriod,
    });
    
    
  },

  editSensityRate(event) {
      event.stopPropagation();
      console.log('[MainBodyStatistic] - editSensityRate - Изменяем Значение срабатывания');
      this.$emit('field-selected', { statisticId: this.statisticData.id, field: 'sensityRate' });
      this.updateSettingsData({ field: 'request', value: 'updatenotifications' });

      this.setLimits({
        param: 'value',
        valueType: 'absolute',
      });

      const currentValue =
        this.statisticData.sensityRate !== null && this.statisticData.sensityRate !== undefined
          ? this.statisticData.sensityRate
          : 0;

      this.updatePayloadData({
        id: this.statisticData.id,
        value: currentValue,
        value_type: 'value',
        value_name: 'sensityRate'
      });
      this.$emit('getDataStatisticItem', {
        title: 'sensityRate',
        value_type: 'value',
        value: currentValue,
      });


  },








































    editStartTime(event) {
      event.stopPropagation();
      this.$emit('field-selected', { statisticId: this.statisticData.id, field: 'startTime' });
      const timeString = this.statisticData.startTime || '00:00';
      //console.log('[MainBodyNotifications] - Редактирование startTime:', timeString);
      const [hours, minutes] = timeString.split(':').map(Number);
      this.editTimeFieldWithToggle('startTime', hours, minutes);
    },

    editEndTime(event) {
      event.stopPropagation();
      const timeString = this.statisticData.endTime || '00:05';
      const [hours, minutes] = timeString.split(':').map(Number);      
      this.editTimeFieldWithToggle('endTime', hours, minutes);

    },

    editTimeFieldWithToggle(selectedField, currentHours, currentMinutes) {
      this.updateSettingsData({ field: 'request', value: 'updatestatistics' });
        //console.log('[MainBodyNotifications] - Редактирование:', currentHours, currentMinutes, this.scheduleData[this.selectedField]);
        this.updatePayloadData({ 
              id: this.statisticData.id,
              value: this.statisticData[selectedField],
              value_name: selectedField,
              value_type: '',
              value_details: this.timeEditMode
            });
        const editMode = this.timeEditMode;
        // Устанавливаем лимиты
          const params = {
            param: editMode, 
            valueType: '', 
          }
          //console.log('[MainBodyNotifications] - editValue - params:', params);
          this.setLimits(params);

        if (editMode === 'minutes') {
            this.$emit('getDataStatisticItem', {
                value: currentMinutes,
                title: selectedField,
                value_details: 'minutes'
            });
        } else {
            this.$emit('getDataStatisticItem', {
                value: currentHours,
                title: selectedField,
                value_details: 'hours'
            });
        }
        
        // Переключаем режим
        this.timeEditMode = this.timeEditMode === 'minutes' ? 'hours' : 'minutes';
        //console.groupEnd();
    },


    editFrequency(event) {
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updatestatistics' });
      this.setLimits({
        param: 'frequency',
        valueType: 'absolute',
      });

      const currentValue = this.statisticData.frequency || 0;

      this.updatePayloadData({ 
        id: this.statisticData.id,
        value: currentValue,
        value_type: 'value',
        value_name: 'frequency',
      });

      // Отправляем событие родителю для немедленного обновления
      this.$emit('getDataStatisticItem', {
        title: 'frequency',
        value_type: 'value',
        value: currentValue,
      });

      // Визуально выделяем поле
      this.$emit('field-selected', { statisticId: this.statisticData.id, field: 'frequency' });

    },

    toggleNotificationСhannel(event) {
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updatestatistics' });
      if (!this.statisticData) return;
      console.log('[MainBodyNotifications] - toggleNotificationСhannel - Изменяем Канал уведомления');
      
      const typesCount = Object.keys(TYPE_LABELS).length; // 3
      const currentValue = this.statisticData.notificationСhannel;
      // Убедимся, что currentValue число
      const currentIndex = Number(currentValue);
      const nextIndex = (currentIndex + 1) % typesCount;
      const nextValue = nextIndex; // 0,1,2

      this.updatePayloadData({
        id: this.statisticData.id,
        value: nextValue,
        value_name: 'notificationСhannel',
        value_type: 'value',
      });

      this.$emit('getDataStatisticItem', {
        id: this.statisticData.id,
        title: 'notificationСhannel',
        value_type: 'value',
        value: nextValue,
      });

      this.$emit('field-selected', { statisticId: this.statisticData.id, field: 'notifСhannel' });
    },


    togglePermission(event) {
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updatestatistics' });
      const newEnabled = this.statisticData.permission === false ? true : false;

      this.updatePayloadData({
        id: this.statisticData.id,
        value: newEnabled,
        value_name: 'permission',
        value_type: '',
      });
      // Отправляем событие родителю для немедленного обновления
      this.$emit('getDataStatisticItem', {
        title: 'permission',
        value_type: '',
        value: newEnabled,
      });

      // Визуально выделяем поле
      this.$emit('field-selected', { statisticId: this.statisticData.id, field: 'permission' });
    },

    deleteNotificationItem() {
      if (!this.statisticData.id) {
        logger.error('[MainBodyNotifications] - deleteNotificationItem - нет ID');
        return;
      }
      console.log('[MainBodySchedule] - deleteNotificationItem - Список Уведомлений ', this.statisticData);
      const statisticTitle = this.statisticData.paramTitle || ` ID Уведомления : ${this.statisticData.id}`;
      
      // Запрос подтверждения
      if (!confirm(`Удалить расписание "${statisticTitle}"?\n\nУдаление будет применено после сохранения изменений.`)) {
        return;
      }

      this.$emit('delete-statistic', {
        id: this.statisticData.id,
        statisticData: this.statisticData,
      });

      this.$el.style.opacity = '0.35';
      this.$el.style.pointerEvents = 'none';

      logger.info('[MainBodyNotifications] - deleteNotificationItem - id:', this.statisticData.id);
    },

  },
};
</script>

<style lang="css" src="../assets/mainStyle.css"></style>
<!-- <style scoped>
/* Убираем рамку только у .settings-block внутри .settings-column */
  .settings-block.statistic-checkbox-field {
    border: none;
    border-radius: 0;
    margin: 0;
    background: transparent;
    /* padding: 4px 12px; */
  }
</style> -->