<!-- components/MainBodySettings.vue -->
<template>
  <div>
    <div class="mainBodySettings">
      <div class="mainBodySettings-header">
        <button class="mainBodySettings-header-button" @click="addNewItem">
          <svg class="icon-settings add" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle id="add-bg" cx="44" cy="44" r="42" fill="#34B534"/>
            <circle cx="44" cy="44" r="42" stroke="#34B534" stroke-width="4"/>
            <line x1="44" y1="23" x2="44" y2="65" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
            <line x1="23" y1="44" x2="65" y2="44" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div class="mainBodySettings-title-container" @click="cycleTitle">
        <div class="mainBodySettings-header-title">{{ selectedTitle }}</div>
        <div class="mainBodySettings-header-title-others">
          {{ otherTitles.join(' • ') }}
        </div>
      </div>

      <div class="mainBodySettings-header">
        <button class="mainBodySettings-header-button" @click="closeMainBodySettings">
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

    <div class="mainBodySettings-content-body">
      <div v-if="selectedTitle === 'Расписание' && schedules.length > 0" class="schedules-list">
        <MainBodySchedule
          v-for="(schedule, index) in schedules"
          :key="schedule.id || `schedule-${index}`"
          :visible="true"
          :scheduleData="schedule"
          :scheduleUnit="unit"
          :activeSelection="activeSelection"
          class="schedule-item"
          @delete-schedule="handleDeleteConfigItem(schedule.id, 'schedules')"
          @getDataScheduleItem="checkDataScheduleItem"
          @field-selected="handleFieldSelected"
        />
      </div>
      <div v-if="selectedTitle === 'Расписание' && schedules.length === 0" class="schedule-item">
        <p>Расписания для этого параметра не настроены.</p>
      </div>

      <div v-if="selectedTitle === 'Уведомления'">
        <div v-if="notifications.length > 0" class="notifications-list">
          <MainBodyNotifications
            v-for="(notification, index) in notifications"
            :key="notification.id || `notification-${index}`"
            :notificationData="notification"
            :notificationUnit="unit"
            :activeSelection="activeSelection"
            class="schedule-item"
            @getDataNotificationItem="checkDataNotificationItem"
            @edit-notification="handleEditNotification(notification.id, $event)"
            @delete-notification="handleDeleteConfigItem(notification.id, 'notifications')"
            @field-selected="handleFieldSelected"
          />
        </div>
        <div v-if="notifications.length === 0" class="schedule-item">
          <p>Уведомления для выбранного параметра не настроены.</p>
        </div>
      </div>

      <div v-if="selectedTitle === 'Аналитика'">
        <div v-if="statistics.length > 0" class="statistics-list">
          <MainBodyStatistic
            v-for="(statistic, index) in statistics"
            :key="statistic.id || `statistic-${index}`"
            :statisticData="statistic"
            :statisticUnit="unit"
            :activeSelection="activeSelection"
            class="schedule-item"
            @getDataStatisticItem="checkDataStatisticItem"
            @edit-analytic="handleEditAnalytic(statistic.id, $event)"
            @delete-statistic="handleDeleteConfigItem(statistic.id, 'statistics')"
            @field-selected="handleFieldSelected"
          />
        </div>
        <div v-if="statistics.length === 0" class="schedule-item">
          <p>Отсутствует Аналитика для выбранного параметра.</p>
        </div>
      </div>

      <div>
        <button type="submit" @click="closeMainBodySettings">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
import logger from '../store/modules/logger.js';
import { mapMutations, mapGetters, mapActions } from 'vuex';
import MainBodySchedule from './MainBodySchedule.vue';
import MainBodyNotifications from './MainBodyNotifications.vue';
import MainBodyStatistic from './MainBodyStatistic.vue';
import { nowMoscow, createTimePoint } from '@/utils/timeUtils';

export default {
  name: 'MainBodySettings',

  inject: {
    getMainSetpointEl: {
      default: () => () => null, // fallback если provide не доступен
    },
  },

  components: { MainBodySchedule, MainBodyStatistic, MainBodyNotifications },

  props: {
    // Имя prop не совпадает с :settingsType в URL — в routes.js
    // используется mapper: props: (route) => ({ setting_Type: route.params.settingsType })
    setting_Type: {
      type: String,
      required: true,
    },
    keepActiveRefs: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return {
      activeSelection: null,
      availableTitles: ['schedules', 'notifications', 'statistics'],
      typeToTitleMap: {
        schedules: 'Расписание',
        notifications: 'Уведомления',
        statistics: 'Аналитика',
      },
      title: localStorage.getItem('typeSettingsKey') || this.typeSettingsKey || 'schedules',

      showAddDialog: false,
      currentItemType: '',
      defaultItemValues: {},

      schedules: [],
      notifications: [],
      statistics: [],

      unit: '',

      configDataToDelete: [],
      pendingDeletions: {},
      editedSchedules: {},

      isEditingSchedule: false,
      editScheduleValue: null,
    };
  },

  computed: {
    ...mapGetters('settingsConfig', ['typeSettings']),
    ...mapGetters([
      'getSetpointsManager',
      'roomKey',
      'paramKey',
      'deviceKey',
      'setpointKey',
      'typeSettingsKey',
    ]),
    ...mapGetters('sortParams', [
      'getRoomTitle',
      'getParamTitle',
      'getDeviceTitle',
      'getSetpointTitle',
    ]),
    ...mapGetters(['level', 'dID']),
    ...mapGetters('config', ['getConfig']),

    settingsData() {
      return this.getSetpointsManager?.settingsData || null;
    },

    selectedTitle() {
      return this.typeToTitleMap[this.title];
    },

    otherTitles() {
      return Object.values(this.typeToTitleMap)
        .filter(title => title !== this.selectedTitle);
    },

    userLevel() {
      return this.level || 0;
    },

    effectiveParamKey() {
      return this.$store.state.settingsData?.payload?.param || '';
    },

    isEditingMode() {
      return this.isEditingSchedule && this.editingSchedule !== null;
    },
  },

  created() {
    this.initialize();
    this.schedules = this.loadConfigDataFromStore('schedules');
    this.setComponentParam(this.selectedTitle);
  },

  watch: {
    title(newTitle, oldTitle) {
      if (newTitle !== oldTitle) {
        this.loadCurrentSettings();
        this.setComponentParam(this.selectedTitle);
      }
    },

    '$store.state.config': {
      handler() {
        this.loadConfigDataFromStore(this.title);
      },
      deep: true,
      immediate: false,
    },

    '$store.state.showSetpoint'(newVal) {
      if (newVal === false) this.activeSelection = null;
    },

    setting_Type: {
      handler(newVal) {
        if (newVal && newVal !== this.title) {
          this.title = newVal;
          this.SET_TYPE_SETTINGS_ITEM(newVal);
        }
      },
      immediate: true,
    },
  },

  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },

  methods: {
    ...mapMutations('config', ['SET_TYPE_SETTINGS_ITEM']),
    ...mapActions('settingsConfig', [
      'initialize',
      'updateTypePopupItem',
      'saveConfigItems',
      'checkScheduleOverlap',
      'updateSchedule',
      'deleteConfigItems',
      'getConfigDataFromStore',
    ]),
    ...mapActions([
      'updateSettingsData',
      'updatePayloadData',
      'updateLimitsData',
      'updateViewData',
    ]),

    checkDataScheduleItem(event) {
      logger.dev('[MainBodySettings] - checkDataScheduleItem:', event);
      let action = 'show';
      if (event.value_type === 'deviation' && event.title === 'value_type') action = 'hide';
      const arrayTitle = this.settingsData?.payload?.config;
      this.$emit('getComponentData', {
        action,
        updateState: event,
        request: arrayTitle,
      });
    },

    checkDataNotificationItem(event) {
      logger.dev('[MainBodySettings] - checkDataNotificationItem:', event);
      let action = 'show';
      if (
        event.title === 'condition'
        || event.title === 'notificationСhannel'
        || event.title === 'permission'
      ) {
        action = 'hide';
      }
      const arrayTitle = this.settingsData?.payload?.config;
      this.$emit('getComponentData', {
        action,
        updateState: event,
        request: arrayTitle,
      });
    },

    checkDataStatisticItem(event) {
      logger.dev('[MainBodySettings] - checkDataStatisticItem:', event);
      let action = 'hide';
      if (event.title === 'sensityRate') action = 'show';
      const arrayTitle = this.settingsData?.payload?.config;
      this.$emit('getComponentData', {
        action,
        updateState: event,
        request: arrayTitle,
      });
    },

    setComponentParam(selectTitle) {
      this.updateSettingsData({ field: 'type', value: 'post' });

      if (selectTitle === 'Расписание') {
        this.updatePayloadData({ config: 'schedules' });
        this.loadConfigDataFromStore('schedules');
      } else if (selectTitle === 'Уведомления') {
        this.updatePayloadData({ config: 'notifications' });
        this.loadConfigDataFromStore('notifications');
      } else if (selectTitle === 'Аналитика') {
        this.updatePayloadData({ config: 'statistics' });
        this.loadConfigDataFromStore('statistics');
      } else {
        logger.warn('[MainBodySettings] - setComponentParam - неизвестный selectTitle:', selectTitle);
      }
    },

    async loadConfigDataFromStore(configName) {
      try {
        const configData = await this.$store.dispatch(
          'settingsConfig/getConfigDataFromStore',
          { configName },
        );
        this[configName] = configData;
        return configData;
      } catch (error) {
        logger.error('[MainBodySettings] - loadConfigDataFromStore - Ошибка:', error);
        this[configName] = [];
      }
    },

    formattedValue(value) {
      if (typeof value === 'number') return value.toFixed(1);
      return value;
    },

    async loadCurrentSettings() {
      try {
        const type = this.title;
        switch (type) {
          case 'schedules':
          case 'notifications':
          case 'statistics':
            await this.loadData(type);
            break;
          default:
            logger.warn('[MainBodySettings] - loadCurrentSettings - неизвестный type:', type);
        }
      } catch (error) {
        logger.error('[MainBodySettings] - loadCurrentSettings:', error);
      }
    },

    cycleTitle() {
      const currentIndex = this.availableTitles.indexOf(this.title);
      const nextIndex = (currentIndex + 1) % this.availableTitles.length;
      const nextTitle = this.availableTitles[nextIndex];
      logger.info(`[MainBodySettings] Title changed: ${this.title} → ${nextTitle}`);
      this.title = nextTitle;
      this.SET_TYPE_SETTINGS_ITEM(nextTitle);
      this.$emit('title-changed', nextTitle);
    },

    addNewItem() {
      const type = this.title;
      this.currentItemType = type;
      switch (type) {
        case 'schedules':
          this.addNewSchedule();
          break;
        case 'notifications':
          this.defaultItemValues = {
            roomKey: this.settingsData.payload.room,
            paramKey: this.effectiveParamKey,
            threshold: this.effectiveSetpointValue || 0,
            condition: 'greater_than',
          };
          this.addNewNotification();
          break;
        case 'statistics':
          this.defaultItemValues = {
            roomKey: this.settingsData.payload.room,
            paramKey: this.effectiveParamKey,
            chartType: 'line',
            period: 'day',
          };
          this.addNewStatistic();
          break;
        default:
          logger.warn(`[MainBodySettings] - addNewItem - неизвестный type: ${type}`);
      }
    },

    async generationTime(configName) {
      let startTime, endTime;
      try {
        const { startTime: st, endTime: et } = createTimePoint();
        startTime = st;
        endTime = et;
        const hasOverlap = await this.$store.dispatch('settingsConfig/checkScheduleOverlap', {
          startTime,
          endTime,
          configName,
        });

        if (hasOverlap.massage) {
          alert(hasOverlap.massage);
          return;
        }
        if (hasOverlap.newStartTime || hasOverlap.newEndTime) {
          startTime = hasOverlap.newStartTime;
          endTime = hasOverlap.newEndTime;
        }
      } catch (error) {
        logger.error('[MainBodySettings] - generationTime - Ошибка:', error);
        if (!confirm('Ошибка проверки пересечения. Создать расписание вручную?')) {
          return;
        }
      }
      if (startTime != undefined && endTime != undefined) return { startTime, endTime };
      return undefined;
    },

    async addNewSchedule() {
      const limitCheck = await this.$store.dispatch('config/checkLimitBeforeAdd', 'schedules');
      if (!limitCheck.allowed) {
        this.$store.dispatch('popup/show', {
          message: `Достигнут предел количества элементов расписания (${limitCheck.limit}).`,
          type: 'warning',
          duration: 2000,
        });
        return;
      }

      const settingsData = this.$store.state.setpointsManager?.settingsData;
      const room = settingsData?.payload?.room;
      const param = settingsData?.payload?.param;
      const value = settingsData?.payload?.value || 0;

      await this.loadConfigDataFromStore('schedules');
      const existingSchedules = this.schedules.filter(s => s.room === room && s.param === param);

      const newTime = await this.generationTime('schedules');
      if (!newTime) return;
      const { startTime, endTime } = newTime;

      let newId = 1;
      if (existingSchedules.length > 0) {
        const existingIds = existingSchedules
          .map(s => s.id)
          .filter(id => id != null && typeof id === 'number');
        if (existingIds.length > 0) newId = Math.max(...existingIds) + 1;
      }

      const newSchedule = {
        id: newId,
        startTime,
        endTime,
        value,
        value_type: 'absolute',
        unit: this.unit || '',
        room,
        param,
        createdAt: nowMoscow(),
        updatedAt: nowMoscow(),
        days: [1, 2, 3, 4, 5],
      };

      this.schedules = [...this.schedules, newSchedule];

      try {
        await this.$store.dispatch('settingsConfig/addConfigLocally', {
          room, param, configName: 'schedules', configData: newSchedule,
        });
        await this.saveConfigItems({
          room: this.settingsData.payload.room,
          param: this.effectiveParamKey,
          configName: 'schedules',
          configData: newSchedule,
        });
        this.showSuccessNotification('Расписание успешно создано');
        await this.loadData('schedules');
        return newSchedule;
      } catch (error) {
        logger.error('[MainBodySettings] - addNewSchedule - Ошибка:', error);
        this.schedules = this.schedules.filter(s => s.id !== newId);
        alert('Не удалось сохранить расписание на сервере. Попробуйте еще раз.');
        throw error;
      }
    },

    handleDeleteConfigItem(id, configName) {
      this.pendingDeletions[id] = id;
      if (!this.configDataToDelete.includes(id)) this.configDataToDelete.push(id);
      this[configName] = this[configName].filter(s => s.id !== id);
      logger.info(`[MainBodySettings] - handleDeleteConfigItem - ${id} → удаление`);
    },

    async addNewNotification() {
      const limitCheck = await this.$store.dispatch('config/checkLimitBeforeAdd', 'notifications');
      if (!limitCheck.allowed) {
        this.$store.dispatch('popup/show', {
          message: `Достигнут предел количества элементов уведомлений (${limitCheck.limit}).`,
          type: 'warning',
          duration: 2000,
        });
        return;
      }

      const settingsData = this.$store.state.setpointsManager?.settingsData;
      const value = settingsData?.payload?.value || 0;
      const room = this.settingsData.payload.room;
      const param = this.effectiveParamKey;

      const existingNotifications = this.notifications.filter(n => n.room === room && n.param === param);

      let newId = 1;
      if (existingNotifications.length > 0) {
        const existingIds = existingNotifications
          .map(n => n.id)
          .filter(id => typeof id === 'number');
        if (existingIds.length > 0) newId = Math.max(...existingIds) + 1;
      }

      const newTime = await this.generationTime('notifications');
      if (!newTime) return;
      const { startTime, endTime } = newTime;

      const newNotification = {
        id: newId,
        condition: 'greater_than',
        value,
        notificationСhannel: 0,
        frequency: 0,
        permission: true,
        status: false,
        startTime,
        endTime,
        createdAt: nowMoscow(),
        updatedAt: nowMoscow(),
        room,
        param,
      };

      this.notifications = [...this.notifications, newNotification];

      try {
        await this.$store.dispatch('settingsConfig/addConfigLocally', {
          room, param, configName: 'notifications', configData: newNotification,
        });
        await this.saveConfigItems({
          room: this.settingsData.payload.room,
          param: this.effectiveParamKey,
          configName: 'notifications',
          configData: newNotification,
        });
        this.showSuccessNotification('Уведомление успешно создано');
        await this.loadData('notifications');
        return newNotification;
      } catch (error) {
        logger.error('[MainBodySettings] - addNewNotification - Ошибка:', error);
        this.notifications = this.notifications.filter(s => s.id !== newId);
        alert('Не удалось сохранить Уведомление на сервере. Попробуйте еще раз.');
        throw error;
      }
    },

    async addNewStatistic() {
      const limitCheck = await this.$store.dispatch('config/checkLimitBeforeAdd', 'statistics');
      if (!limitCheck.allowed) {
        this.$store.dispatch('popup/show', {
          message: `Достигнут предел количества элементов аналитики (${limitCheck.limit}).`,
          type: 'warning',
          duration: 2000,
        });
        return;
      }

      const room = this.settingsData.payload.room;
      const param = this.effectiveParamKey;

      const existingStatistics = this.statistics.filter(n => n.room === room && n.param === param);

      let newId = 1;
      if (existingStatistics.length > 0) {
        const existingIds = existingStatistics
          .map(n => n.id)
          .filter(id => typeof id === 'number');
        if (existingIds.length > 0) newId = Math.max(...existingIds) + 1;
      }

      const newStatistic = {
        id: newId,
        value: true,
        setpoint: false,
        devSetpoint: false,
        changeSeason: false,
        savePeriod: 0,
        sensityRate: 0.5,
        createdAt: nowMoscow(),
        updatedAt: nowMoscow(),
        room,
        param,
      };

      this.statistics = [...this.statistics, newStatistic];

      try {
        await this.$store.dispatch('settingsConfig/addConfigLocally', {
          room, param, configName: 'statistics', configData: newStatistic,
        });
        await this.saveConfigItems({
          room: this.settingsData.payload.room,
          param: this.effectiveParamKey,
          configName: 'statistics',
          configData: newStatistic,
        });
        this.showSuccessNotification('Аналитика успешно создана');
        await this.loadData('statistics');
        return newStatistic;
      } catch (error) {
        logger.error('[MainBodySettings] - addNewStatistic - Ошибка:', error);
        this.statistics = this.statistics.filter(s => s.id !== newId);
        alert('Не удалось сохранить Аналитику на сервере. Попробуйте еще раз.');
        throw error;
      }
    },

    async saveNewConfig({ configName, configData, room, param }) {
      try {
        await this.$store.dispatch('settingsConfig/addConfigLocally', {
          room, param, configName, configData,
        });
        await this.saveConfigItems({
          room: this.settingsData.payload.room,
          param: this.effectiveParamKey,
          configName,
          configData,
        });
        alert('Настройка успешно сохранена');
        return configData;
      } catch (error) {
        logger.error(`[MainBodySettings] saveNewConfig error for ${configName}:`, error);
        throw error;
      }
    },

    async closeMainBodySettings() {
      logger.dev('[MainBodySettings] - closeMainBodySettings:', this.title);

      if (this.configDataToDelete.length > 0) {
        this.$store.dispatch('settingsConfig/deleteConfigItems', {
          room: this.settingsData.payload.room,
          param: this.effectiveParamKey,
          configName: this.title,
          configsIds: [...this.configDataToDelete],
        });
        this.configDataToDelete = [];
        this.pendingDeletions = {};
      }

      // Возврат на главный экран. При прямом заходе по URL history.length может быть 1 —
      // тогда сразу push('/'), минуя go(-1).
      if (window.history.length > 1) {
        this.$router.go(-1);
      } else {
        this.$router.push('/');
      }

      this.$emit('close');
    },

    async loadData(dataType, room, param) {
      try {
        let result = [];
        const dID = this.dID;
        const configData = this.$store.state.config?.[dataType]?.[dID];

        if (configData && configData[room] && configData[room][param]) {
          result = configData[room][param];
        } else {
          const localKey = `${dID}_${dataType}`;
          const localConfig = localStorage.getItem(localKey);
          if (localConfig) {
            try {
              const parsedConfig = JSON.parse(localConfig);
              if (parsedConfig[room] && parsedConfig[room][param]) {
                result = parsedConfig[room][param];
              }
            } catch (error) {
              logger.error('[MainBodySettings] - loadData - ошибка парсинга localStorage:', error);
            }
          }
        }

        switch (dataType) {
          case 'schedules': this.schedules = [...result]; break;
          case 'notifications': this.notifications = [...result]; break;
          case 'statistics': this.statistics = [...result]; break;
        }
      } catch (error) {
        logger.error('[MainBodySettings] - loadData - Ошибка:', error);
        switch (dataType) {
          case 'schedules': this.schedules = []; break;
          case 'notifications': this.notifications = []; break;
          case 'statistics': this.statistics = []; break;
        }
      }
    },

    handleFieldSelected({ scheduleId, field }) {
      this.activeSelection = { scheduleId, field };
    },

    handleClickOutside(event) {
      if (this.$el && this.$el.contains(event.target)) return;
      const setpointEl = this.getMainSetpointEl();
      if (setpointEl && setpointEl.contains(event.target)) return;
      this.activeSelection = null;
    },

    handleEditNotification(id, event) {
      logger.dev('[MainBodySettings] - handleEditNotification', id, event);
    },

    handleEditAnalytic(id, event) {
      logger.dev('[MainBodySettings] - handleEditAnalytic', id, event);
    },

    showSuccessNotification(message) {
      this.$store.dispatch('popup/show', {
        message,
        type: 'success',
        duration: 2000,
      });
    },
  },
};
</script>

<style lang="css" src="../assets/mainStyle.css">
</style>