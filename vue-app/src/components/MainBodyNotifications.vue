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
            v-if="notificationData.frequency === 0"
            class="settings-block-title"
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
        <!-- <div class="settings-row">
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
        </div> -->

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

      <!-- Вторая колонка: кнопка удаления (20%) -->
      <!-- <div class="settings-col-second">
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
      </div> -->

    </div>
  </div>
</template>

<script>
import logger from '../store/modules/logger.js';
import { mapGetters, mapActions } from 'vuex';

const CONDITIONS = ['greater_than', 'less_than', 'equal', 'not_equal', 'greater_equal', 'less_equal'];
// const NOTIFICATION_TYPES = ['Web', 'telegram'];
//const FREQUENCY_MODES = ['once', 'every_5min', 'every_10min', 'every_15min', 'every_30min', 'every_60min'];

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

// const FREQUENCY_LABELS = {
//   once:         'Однократно',
//   every_5min:   'Каждые 5 мин',
//   every_10min:  'Каждые 10 мин',
//   every_15min:  'Каждые 15 мин',
//   every_30min:  'Каждые 30 мин',
//   every_60min:  'Каждый час',
// };

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

  emits: ['delete-notification', 'getDataNotificationItem', 'field-selected'],

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

    formattedStartDate() {
      return this.notificationData.startDate || '???';
    },

    formattedEndDate() {
      return this.notificationData.endDate || '???';
    },

    frequencyLabel() {
      const freq = this.notificationData.frequency;
      if (freq && typeof freq === 'number') return freq;
      return '???';
      //return FREQUENCY_LABELS[this.notificationData.frequency] ?? this.notificationData.frequency ?? '???';
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








    toggleCondition(event) {
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
      this.$emit('field-selected', { scheduleId: this.notificationData.id, field: 'value_type' });
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
      this.$emit('field-selected', { scheduleId: this.notificationData.id, field: 'threshold' });

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
      } else if (newDate) {
        alert('Неверный формат даты. Используйте ГГГГ-ММ-ДД');
      }
    },

    editFrequency(event) {
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updateNotifications' });
      this.setLimits({
        param: this.$store.state.setpointsManager?.settingsData?.payload?.param,
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
      this.$emit('field-selected', { scheduleId: this.notificationData.id, field: 'frequency' });

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

      this.$emit('field-selected', { scheduleId: this.notificationData.id, field: 'notifСhannel' });
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
      this.$emit('field-selected', { scheduleId: this.notificationData.id, field: 'permission' });
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