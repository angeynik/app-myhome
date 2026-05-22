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
    </div>

    <div class="settings-row">
      <!-- Первая колонка (80%) -->
      <div class="settings-col-first">

        <!-- Строка 1: Условие срабатывания + порог -->
        <div class="settings-row">
          <div
            class="settings-block-title clickable"
            :class="{ 'selected': isFieldSelected('condition') }"
            @click.stop="editCondition"
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

        <!-- Строка 2: Канал уведомления -->
        <!-- <div class="settings-row">
          <div class="settings-block-title">
            <p>Канал</p>
          </div>
          <div
            class="settings-block clickable time-input"
            :class="{ 'selected': isFieldSelected('notificationType') }"
            @click.stop="editNotificationType"
          >
            <div class="settings-value">{{ notificationTypeLabel }}</div>
          </div>
        </div> -->

        <!-- Строка 3: Период действия (даты) -->
        <div class="settings-row">
          <div class="settings-block-title">
            <p>Период</p>
          </div>
          <div
            class="settings-block clickable time-input"
            :class="{ 'selected': isFieldSelected('startDate') }"
            @click.stop="editStartDate"
          >
            <div class="settings-value">{{ formattedStartDate }}</div>
          </div>
          <div class="settings-separator"></div>
          <div
            class="settings-block clickable time-input"
            :class="{ 'selected': isFieldSelected('endDate') }"
            @click.stop="editEndDate"
          >
            <div class="settings-value">{{ formattedEndDate }}</div>
          </div>
        </div>

        <!-- Строка 4: Периодичность -->
        <div class="settings-row">
          <div class="settings-block-title">
            <p>Периодичность</p>
          </div>
          <div
            class="settings-block clickable time-input"
            :class="{ 'selected': isFieldSelected('frequency') }"
            @click.stop="editFrequency"
          >
            <div class="settings-value">{{ frequencyLabel }}</div>
          </div>
        </div>

        <!-- Строка 5: Активность -->
        <div class="settings-row">
          <div class="settings-block-title">
            <p>Статус</p>
          </div>
          <div
            class="settings-block clickable time-input"
            :class="{ 'selected': isFieldSelected('enabled') }"
            @click.stop="toggleEnabled"
          >
            <div class="settings-value">{{ enabledLabel }}</div>
          </div>
        </div>

      </div>

      <!-- Вторая колонка: кнопка удаления (20%) -->
      <div class="settings-col-second">
        <div class="icon-settings item">
          <button class="mainBodySettings-header-button" @click="deleteNotificationItem">
            <svg class="icon-settings close" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle class="hover-bg" cx="44" cy="44" r="42" fill="#CC0000" opacity="0"/>
              <circle cx="44" cy="44" r="42" fill="#FF4747"/>
              <circle cx="44" cy="44" r="42" stroke="#FF4747" stroke-width="4"/>
              <line x1="28" y1="28" x2="60" y2="60" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
              <line x1="60" y1="28" x2="28" y2="60" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import logger from '../store/modules/logger.js';
import { mapGetters, mapActions } from 'vuex';

const CONDITIONS = ['greater_than', 'less_than', 'equal', 'not_equal', 'greater_equal', 'less_equal'];
const NOTIFICATION_TYPES = ['email', 'sms', 'push', 'telegram'];
const FREQUENCY_MODES = ['once', 'every_5min', 'every_10min', 'every_15min', 'every_30min', 'every_60min'];

const CONDITION_LABELS = {
  greater_than:  'Больше',
  less_than:     'Меньше',
  equal:         'Равно',
  not_equal:     'Не равно',
  greater_equal: 'Больше или равно',
  less_equal:    'Меньше или равно',
};

const TYPE_LABELS = {
  email:    'E-mail',
  sms:      'SMS',
  push:     'Push',
  telegram: 'Telegram',
};

const FREQUENCY_LABELS = {
  once:         'Однократно',
  every_5min:   'Каждые 5 мин',
  every_10min:  'Каждые 10 мин',
  every_15min:  'Каждые 15 мин',
  every_30min:  'Каждые 30 мин',
  every_60min:  'Каждый час',
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

  emits: ['delete-notification', 'edit-notification', 'field-selected'],

  computed: {
    ...mapGetters(['level']),
    ...mapGetters('settingsConfig', ['dateTimeUtils']),

    userLevel() {
      return this.level || 0;
    },

    unit() {
      return this.notificationUnit || '';
    },

    conditionLabel() {
      return CONDITION_LABELS[this.notificationData.condition] ?? this.notificationData.condition ?? '—';
    },

    notificationTypeLabel() {
      return TYPE_LABELS[this.notificationData.notificationType] ?? this.notificationData.notificationType ?? '—';
    },

    thresholdDisplay() {
      const v = this.notificationData.threshold;
      if (v === null || v === undefined) return 'Не задано';
      return typeof v === 'number' ? v.toFixed(1) : v;
    },

    enabledLabel() {
      return this.notificationData.enabled === false ? 'Отключено' : 'Активно';
    },

    formattedStartDate() {
      return this.notificationData.startDate || '—';
    },

    formattedEndDate() {
      return this.notificationData.endDate || '—';
    },

    frequencyLabel() {
      return FREQUENCY_LABELS[this.notificationData.frequency] ?? this.notificationData.frequency ?? '—';
    },
  },

  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },

  methods: {
    ...mapActions(['updateSettingsData', 'updatePayloadData']),
    ...mapActions('sortParams', ['setLimits']),

    isFieldSelected(fieldName) {
      return (
        this.activeSelection?.scheduleId === this.notificationData.id &&
        this.activeSelection?.field === fieldName
      );
    },

    handleClickOutside(event) {
      if (this.$el && !this.$el.contains(event.target)) {
        // сброс выделения – управляется родителем
      }
    },

    editCondition(event) {
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updateNotifications' });

      const currentIndex = CONDITIONS.indexOf(this.notificationData.condition);
      const nextCondition = CONDITIONS[(currentIndex + 1) % CONDITIONS.length];

      this.updatePayloadData({
        id: this.notificationData.id,
        value: nextCondition,
        value_name: 'condition',
      });

      this.$emit('field-selected', { scheduleId: this.notificationData.id, field: 'condition' });
      this.$emit('edit-notification', { field: 'condition', value: nextCondition });
    },

    editThreshold(event) {
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updateNotifications' });

      this.setLimits({
        param: this.$store.state.setpointsManager?.settingsData?.payload?.param,
        valueType: 'absolute',
      });

      const currentValue =
        this.notificationData.threshold !== null && this.notificationData.threshold !== undefined
          ? this.notificationData.threshold
          : 0;

      this.updatePayloadData({
        id: this.notificationData.id,
        value: currentValue,
        value_name: 'threshold',
      });

      this.$emit('field-selected', { scheduleId: this.notificationData.id, field: 'threshold' });
      this.$emit('edit-notification', { field: 'threshold', value: currentValue });
    },

    editNotificationType(event) {
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updateNotifications' });

      const currentIndex = NOTIFICATION_TYPES.indexOf(this.notificationData.notificationType);
      const nextType = NOTIFICATION_TYPES[(currentIndex + 1) % NOTIFICATION_TYPES.length];

      this.updatePayloadData({
        id: this.notificationData.id,
        value: nextType,
        value_name: 'notificationType',
      });

      this.$emit('field-selected', { scheduleId: this.notificationData.id, field: 'notificationType' });
      this.$emit('edit-notification', { field: 'notificationType', value: nextType });
    },

    editStartDate(event) {
      event.stopPropagation();
      this.editDateField('startDate');
    },

    editEndDate(event) {
      event.stopPropagation();
      this.editDateField('endDate');
    },

    editDateField(fieldName) {
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
        this.$emit('field-selected', { scheduleId: this.notificationData.id, field: fieldName });
        this.$emit('edit-notification', { field: fieldName, value: newDate });
      } else if (newDate) {
        alert('Неверный формат даты. Используйте ГГГГ-ММ-ДД');
      }
    },

    editFrequency(event) {
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updateNotifications' });

      const currentIndex = FREQUENCY_MODES.indexOf(this.notificationData.frequency);
      const nextIndex = (currentIndex + 1) % FREQUENCY_MODES.length;
      const nextFrequency = FREQUENCY_MODES[nextIndex];

      this.updatePayloadData({
        id: this.notificationData.id,
        value: nextFrequency,
        value_name: 'frequency',
      });

      this.$emit('field-selected', { scheduleId: this.notificationData.id, field: 'frequency' });
      this.$emit('edit-notification', { field: 'frequency', value: nextFrequency });
    },

    toggleEnabled(event) {
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updateNotifications' });

      const newEnabled = this.notificationData.enabled === false ? true : false;

      this.updatePayloadData({
        id: this.notificationData.id,
        value: newEnabled,
        value_name: 'enabled',
      });

      this.$emit('field-selected', { scheduleId: this.notificationData.id, field: 'enabled' });
      this.$emit('edit-notification', { field: 'enabled', value: newEnabled });
    },

    deleteNotificationItem() {
      if (!this.notificationData.id) {
        logger.error('[MainBodyNotifications] - deleteNotificationItem - нет ID');
        return;
      }

      const label = `уведомление ID: ${this.notificationData.id}`;
      if (!confirm(`Удалить ${label}?\n\nУдаление будет применено после сохранения изменений.`)) return;

      this.$emit('delete-notification', {
        id: this.notificationData.id,
        notificationData: this.notificationData,
      });

      this.$el.style.opacity = '0.35';
      this.$el.style.pointerEvents = 'none';

      logger.info('[MainBodyNotifications] - deleteNotificationItem - id:', this.notificationData.id);
    },

    formatDate(dateString) {
      return this.dateTimeUtils.formatDate(dateString, 'ru-RU');
    },
  },
};
</script>

<style lang="css" src="../assets/mainStyle.css"></style>