<!-- components/MainBodyNotifications.vue -->
<template>
  <div class="settings-block" v-if="notificationData">

    <!-- Информация о записи -->
    <div v-if="notificationData.id" class="settings-info">
      <div class="settings-info-item">
        <span class="settings-info-value">ID:</span>
        <span class="settings-info-value">{{ notificationData.id }}</span>
      </div>
      <div class="settings-info-item" v-if="notificationData.createdAt">
        <span class="settings-info-value">Создано:</span>
        <span class="settings-info-value">{{ formatDate(notificationData.createdAt) }}</span>
      </div>
      <div class="settings-info-item" v-if="notificationData.updatedAt">
        <span class="settings-info-value">Обновлено:</span>
        <span class="settings-info-value">{{ formatDate(notificationData.updatedAt) }}</span>
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

    <div class="settings-row">
      <!-- Первая колонка (80%) -->
      <div class="settings-col-first">

        <!-- Строка 1: Условие срабатывания + порог -->
        <div class="settings-row">
          <div
            class="settings-block-title clickable"
            :class="{ 'selected': isFieldSelected('value_type') }"
            @click.stop="toggleCondition"
          >
            <p>{{ conditionLabel }}</p>
          </div>
          <div
            class="settings-block clickable time-input"
            :class="{ 'selected': isFieldSelected('threshold') }"
            @click.stop="editThreshold"
          >
            <div class="settings-value">{{ thresholdDisplay }}</div>
            <span v-if="unit">{{ unit }}</span>
          </div>
        </div>


        <!-- Строка 3: Период действия (даты) -->
        <div class="settings-row">
          <div class="settings-block-title">
            <p>Интервал</p>
          </div>
          <div
            class="settings-block clickable time-input"
            :class="{ 'selected': isFieldSelected('startTime') }"
            @click.stop="editStartTime"
          >
            <div class="settings-value" v-html="formattedStartDisplay"></div>
          </div>
          <div class="settings-separator"></div>
          <div
            class="settings-block clickable time-input"
            :class="{ 'selected': isFieldSelected('endTime') }"
            @click.stop="editEndTime"
          >
            <div class="settings-value" v-html="formattedEndDisplay"></div>
          </div>
        </div>

        <!-- Строка 4: Периодичность -->
         <div class="settings-row">
          <div class="settings-block-title">
            <p>Периодичность</p>
          </div>
          <div
            v-if="notificationData.frequency === 0"
            class="settings-block-title"
            :class="{ 'selected': isFieldSelected('frequency') }"
            @click.stop="editFrequency"
          >
            <p>Однократно</p>
          </div>
          <div
            v-else
            class="settings-block clickable time-input"
            :class="{ 'selected': isFieldSelected('frequency') }"
            @click.stop="editFrequency"
          >
            <div class="settings-value">{{ frequencyLabel }}</div>
            <span>мин</span>
          </div>
        </div>

        <!-- Строка 2: Канал уведомления -->
        <div class="settings-row">
          <div class="settings-block-title">
            <p>Канал</p>
          </div>
          <div
            class="settings-block-title clickable"
            :class="{ 'selected': isFieldSelected('notifСhannel') }"
            @click.stop="toggleNotificationСhannel"
          >
            <p>{{ notificationСhannelLabel }}</p>
          </div>

        </div>
        
        <!-- Строка 5: Активность -->
        <div class="settings-row">
          <div class="settings-block-title">
            <p>Статус</p>
          </div>

          <div
            class="settings-block-title clickable"
            :class="{ 'selected': isFieldSelected('permission') }"
            @click.stop="togglePermission"
          >
            <p>{{ enabledLabel }}</p>
          </div>

        </div>

      </div>

    </div>
  </div>
</template>

<script>
import logger from '../store/modules/logger.js';
import { mapGetters, mapActions } from 'vuex';
import { formatDate, formatTimeWithHighlight } from '@/utils/timeUtils';

const CONDITIONS = ['greater_than', 'less_than', 'equal', 'not_equal', 'greater_equal', 'less_equal'];

const CONDITION_LABELS = {
  greater_than:  'Больше',
  less_than:     'Меньше',
  equal:         'Равно',
  not_equal:     'Не равно',
  greater_equal: 'Больше или равно',
  less_equal:    'Меньше или равно',
};

const TYPE_LABELS = {
  0: 'Web',
  1: 'Telegram',
  2: 'Web + Telegram'
};

export default {
  name: 'MainBodyNotifications',

  props: {
    notificationData: {
      type: Object,
      required: true,
    },
    notificationUnit: {
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

  emits: ['delete-notification', 'getDataNotificationItem', 'field-selected'],

  computed: {
    ...mapGetters(['level']),

    userLevel() {
      return this.level || 0;
    },

    unit() {
      return this.notificationUnit || '';
    },

    conditionLabel() {
      return CONDITION_LABELS[this.notificationData.value_type] ?? this.notificationData.value_type ?? '???';
    },

    notificationСhannelLabel() {
      return TYPE_LABELS[this.notificationData.notificationСhannel] ?? this.notificationData.notificationСhannel ?? '???';
    },

    thresholdDisplay() {
      const v = this.notificationData.value;
      if (v === null || v === undefined) return '???';
      return typeof v === 'number' ? v.toFixed(1) : v;
    },

    enabledLabel() {
      return this.notificationData.permission === false ? 'Отключено' : 'Активно';
    },

    frequencyLabel() {
      const freq = this.notificationData.frequency;
      if (freq && typeof freq === 'number') return freq;
      return '???';
      //return FREQUENCY_LABELS[this.notificationData.frequency] ?? this.notificationData.frequency ?? '???';
    },
    displayStartTime() {
      return this.notificationData?.startTime ?? '00:00';
    },
    displayEndTime() {
      return this.notificationData?.endTime ?? '23:59';
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
        this.activeSelection?.notificationId === this.notificationData.id &&
        this.activeSelection?.field === fieldName
      );
    },

    handleClickOutside(event) {
      if (this.$el && !this.$el.contains(event.target)) {
        // сброс выделения – управляется родителем
      }
    },








    toggleCondition(event) {
      if (!this.notificationData) return;
      console.log('[MainBodyNotifications] - toggleCondition - Изменяем Условие срабатывания');
      event.stopPropagation();
      const currentIndex = CONDITIONS.indexOf(this.notificationData.value_type);
      const nextCondition = CONDITIONS[(currentIndex + 1) % CONDITIONS.length];
      console.log('[MainBodyNotifications] - toggleCondition - Новое Условие-', nextCondition);

      this.updatePayloadData({ 
        id: this.notificationData.id,
        value: nextCondition,
        value_type: 'condition',
      });

      // Отправляем событие родителю для немедленного обновления
      this.$emit('getDataNotificationItem', {
        title: 'value_type',
        value_type: 'condition',
        value: nextCondition,
      });

      // Визуально выделяем поле
      this.$emit('field-selected', { notificationId: this.notificationData.id, field: 'value_type' });
    },

    editThreshold(event) {
      console.log('[MainBodyNotifications] - editThreshold - Изменяем Значение срабатывания');
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updateNotifications' });

      this.setLimits({
        param: 'threshold',
        valueType: 'absolute',
      });

      const currentValue =
        this.notificationData.value !== null && this.notificationData.value !== undefined
          ? this.notificationData.value
          : 0;

      this.updatePayloadData({
        id: this.notificationData.id,
        value: currentValue,
        value_type: 'value',
      });
      this.$emit('getDataNotificationItem', {
        title: 'value',
        value_type: 'threshold',
        value: currentValue,
      });
      this.$emit('field-selected', { notificationId: this.notificationData.id, field: 'threshold' });

    },










    editStartTime(event) {
      event.stopPropagation();
      this.$emit('field-selected', { notificationId: this.notificationData.id, field: 'startTime' });
      const timeString = this.notificationData.startTime || '00:00';
      //console.log('[MainBodyNotifications] - Редактирование startTime:', timeString);
      const [hours, minutes] = timeString.split(':').map(Number);
      this.editTimeFieldWithToggle('startTime', hours, minutes);
    },

    editEndTime(event) {
      event.stopPropagation();
      const timeString = this.notificationData.endTime || '00:05';
      const [hours, minutes] = timeString.split(':').map(Number);      
      this.editTimeFieldWithToggle('endTime', hours, minutes);

    },

    editTimeFieldWithToggle(selectedField, currentHours, currentMinutes) {
      this.updateSettingsData({ field: 'request', value: 'updateNotifications' });
        //console.log('[MainBodyNotifications] - Редактирование:', currentHours, currentMinutes, this.scheduleData[this.selectedField]);
        this.updatePayloadData({ 
              id: this.notificationData.id,
              value: this.notificationData[selectedField],
              value_name: selectedField,
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
            this.$emit('getDataNotificationItem', {
                value: currentMinutes,
                title: selectedField,
                value_details: 'minutes'
            });
        } else {
            this.$emit('getDataNotificationItem', {
                value: currentHours,
                title: selectedField,
                value_details: 'hours'
            });
        }
        
        // Переключаем режим
        this.timeEditMode = this.timeEditMode === 'minutes' ? 'hours' : 'minutes';
        //console.groupEnd();
    },

    _editDateField(fieldName) {
      this.updateSettingsData({ field: 'request', value: 'updateNotifications' });

      // Используем нативный date picker
      const currentDate = this.notificationData[fieldName] || new Date().toISOString().slice(0, 10);
      const newDate = prompt(`Введите дату в формате ГГГГ-ММ-ДД (текущее: ${currentDate})`, currentDate);
      if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
        this.updatePayloadData({
          id: this.notificationData.id,
          value: newDate,
          value_name: fieldName,
        });
        this.$emit('field-selected', { notificationId: this.notificationData.id, field: fieldName });
      } else if (newDate) {
        alert('Неверный формат даты. Используйте ГГГГ-ММ-ДД');
      }
    },

    editFrequency(event) {
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updateNotifications' });
      this.setLimits({
        param: 'frequency',
        valueType: 'absolute',
      });

      const currentValue = this.notificationData.frequency || 1;

      this.updatePayloadData({ 
        id: this.notificationData.id,
        value: currentValue,
        value_type: 'frequency',
      });

      // Отправляем событие родителю для немедленного обновления
      this.$emit('getDataNotificationItem', {
        title: 'frequency',
        value_type: 'value',
        value: currentValue,
      });

      // Визуально выделяем поле
      this.$emit('field-selected', { notificationId: this.notificationData.id, field: 'frequency' });

    },
    toggleNotificationСhannel(event) {
      event.stopPropagation();
      const types = ['web', 'telegram', 'web + telegram']; // порядок как в NOTIFICATION_TYPES
      const currentIndex = types.indexOf(this.notificationData.notificationСhannel);
      const nextType = types[(currentIndex + 1) % types.length];

      this.updatePayloadData({
        id: this.notificationData.id,
        value: nextType,
        value_type: 'notifСhannel',
      });

      this.$emit('getDataNotificationItem', {
        title: 'enabled',
        value_type: 'notifСhannel',
        value: nextType,
      });

      this.$emit('field-selected', { notificationId: this.notificationData.id, field: 'notifСhannel' });
    },

    togglePermission(event) {
      event.stopPropagation();
      const newEnabled = this.notificationData.permission === false ? true : false;

      this.updatePayloadData({
        id: this.notificationData.id,
        value: newEnabled,
        value_type: 'permission',
      });
      // Отправляем событие родителю для немедленного обновления
      this.$emit('getDataNotificationItem', {
        title: 'permission',
        value_type: 'permission',
        value: newEnabled,
      });

      // Визуально выделяем поле
      this.$emit('field-selected', { notificationId: this.notificationData.id, field: 'permission' });
    },

    deleteNotificationItem() {
      if (!this.notificationData.id) {
        logger.error('[MainBodyNotifications] - deleteNotificationItem - нет ID');
        return;
      }
      console.log('[MainBodySchedule] - deleteNotificationItem - Список Уведомлений ', this.notificationData);
      const notificationTitle = this.notificationData.paramTitle || ` ID Уведомления : ${this.notificationData.id}`;
      
      // Запрос подтверждения
      if (!confirm(`Удалить расписание "${notificationTitle}"?\n\nУдаление будет применено после сохранения изменений.`)) {
        return;
      }







      // const label = `уведомление ID: ${this.notificationData.id}`;
      // if (!confirm(`Удалить ${label}?\n\nУдаление будет применено после сохранения изменений.`)) return;

      this.$emit('delete-notification', {
        id: this.notificationData.id,
        notificationData: this.notificationData,
      });

      this.$el.style.opacity = '0.35';
      this.$el.style.pointerEvents = 'none';

      logger.info('[MainBodyNotifications] - deleteNotificationItem - id:', this.notificationData.id);
    },

  },
};
</script>

<style lang="css" src="../assets/mainStyle.css"></style>