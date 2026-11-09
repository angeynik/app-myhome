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

const TYPES = ['schedules', 'notifications', 'statistics'];
const TYPE_TITLES = {
  schedules: 'Расписание',
  notifications: 'Уведомления',
  statistics: 'Аналитика',
};
const LIMIT_TEXT = {
  schedules: 'расписания',
  notifications: 'уведомлений',
  statistics: 'аналитики',
};
const CREATED_TEXT = {
  schedules: 'Расписание успешно создано',
  notifications: 'Уведомление успешно создано',
  statistics: 'Аналитика успешно создана',
};

export default {
  name: 'MainBodySettings',

  inject: {
    getMainSetpointEl: {
      default: () => () => null, // fallback, если provide недоступен
    },
  },

  components: { MainBodySchedule, MainBodyStatistic, MainBodyNotifications },

  props: {
    setting_Type: { type: String, required: true },
  },

  emits: ['getComponentData', 'close', 'title-changed'],

  data() {
    return {
      activeSelection: null,
      availableTitles: TYPES,
      typeToTitleMap: TYPE_TITLES,
      // Источник истины — параметр маршрута. Раньше значение бралось из localStorage
      // (и из this.typeSettingsKey, недоступного в data()).
      title: TYPES.includes(this.setting_Type) ? this.setting_Type : 'schedules',
      schedules: [],
      notifications: [],
      statistics: [],
      // Элементы, удаление которых отложено до закрытия экрана:
      // { configName, room, param, id }
      pendingDeletes: [],
      loadSeq: 0,
      closing: false,
    };
  },

  computed: {
    ...mapGetters(['getSetpointsManager', 'dID']),
    ...mapGetters('sortParams', ['getUnit']),

    settingsData() {
      return this.getSetpointsManager?.settingsData || null;
    },
    payloadRoom() {
      return this.settingsData?.payload?.room || '';
    },
    payloadParam() {
      return this.settingsData?.payload?.param || '';
    },
    unit() {
      return this.payloadParam ? this.getUnit(this.payloadParam) : '';
    },
    selectedTitle() {
      return this.typeToTitleMap[this.title];
    },
    otherTitles() {
      return Object.values(this.typeToTitleMap).filter((t) => t !== this.selectedTitle);
    },

    // Срез хранилища только для активного типа и текущего dID.
    // Раньше следили за ВСЕМ $store.state.config (deep) — это перезапускало
    // загрузку при каждом обновлении датчика, пришедшем по WebSocket.
    storeSlice() {
      return this.$store.state.config?.[this.title]?.[this.dID];
    },
  },

  watch: {
    title() {
      this.setComponentParam();
    },
    storeSlice: {
      deep: true,
      handler() {
        this.loadList(this.title);
      },
    },
    payloadRoom() { this.loadList(this.title); },
    payloadParam() { this.loadList(this.title); },
    '$store.state.showSetpoint'(newVal) {
      if (newVal === false) this.activeSelection = null;
    },
    setting_Type(newVal) {
      if (TYPES.includes(newVal) && newVal !== this.title) this.title = newVal;
    },
  },

  created() {
    this.initialize().catch((e) => logger.error('[MainBodySettings] initialize:', e));
    this.setComponentParam();
  },

  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    // Пользователь ушёл «назад» браузером, не нажав «Закрыть» — отложенные удаления не теряем
    if (this.pendingDeletes.length > 0) this.flushDeletions();
  },

  methods: {
    ...mapMutations('config', ['SET_TYPE_SETTINGS_ITEM']),
    ...mapActions('settingsConfig', ['initialize', 'saveConfigItems', 'deleteConfigItems']),
    ...mapActions(['updateSettingsData', 'updatePayloadData']),

    // ── Передача событий наверх (MainView.getComponentData) ──────────
    emitToParent(action, event) {
      this.$emit('getComponentData', {
        action,
        updateState: event,
        request: this.settingsData?.payload?.config,
      });
    },

    checkDataScheduleItem(event) {
      let action = 'show';
      if (event.value_type === 'deviation' && event.title === 'value_type') action = 'hide';
      this.emitToParent(action, event);
    },

    checkDataNotificationItem(event) {
      // ВНИМАНИЕ: в 'notificationСhannel' кириллическая «С» — ключ совпадает с серверным
      const hideTitles = ['condition', 'notificationСhannel', 'permission'];
      this.emitToParent(hideTitles.includes(event.title) ? 'hide' : 'show', event);
    },

    checkDataStatisticItem(event) {
      this.emitToParent(event.title === 'sensityRate' ? 'show' : 'hide', event);
    },

    // ── Тип настроек ────────────────────────────────────────────────
    setComponentParam() {
      this.SET_TYPE_SETTINGS_ITEM(this.title);
      this.updateSettingsData({ field: 'type', value: 'post' });
      this.updatePayloadData({ config: this.title });
      this.loadList(this.title);
    },

    cycleTitle() {
      const nextIndex = (this.availableTitles.indexOf(this.title) + 1) % this.availableTitles.length;
      const nextTitle = this.availableTitles[nextIndex];
      logger.info(`[MainBodySettings] Title changed: ${this.title} → ${nextTitle}`);
      this.title = nextTitle;
      this.$emit('title-changed', nextTitle);
    },

    // ── Загрузка списка из хранилища ────────────────────────────────
    isPendingDelete(configName, item) {
      return this.pendingDeletes.some(
        (p) => p.configName === configName
          && p.id === item.id
          && p.room === this.payloadRoom
          && p.param === this.payloadParam,
      );
    },

    async loadList(configName) {
      // Защита от гонки: ответы могут приходить не в порядке запросов
      const seq = ++this.loadSeq;
      try {
        const list = await this.$store.dispatch('settingsConfig/getConfigDataFromStore', { configName });
        if (seq !== this.loadSeq) return;
        this[configName] = list.filter((item) => !this.isPendingDelete(configName, item));
      } catch (error) {
        logger.error('[MainBodySettings] - loadList:', error);
        if (seq === this.loadSeq) this[configName] = [];
      }
    },

    // ── Добавление элементов ────────────────────────────────────────
    addNewItem() {
      if (!this.settingsData || !this.payloadRoom || !this.payloadParam) {
        this.showWarning('Сначала выберите комнату и параметр.');
        return;
      }
      this.createConfigItem(this.title).catch(() => { /* ошибка уже показана пользователю */ });
    },

    // Подбирает свободное время для нового элемента.
    // Возвращает { startTime, endTime } или null, если свободного интервала нет.
    async generationTime(configName) {
      try {
        const { startTime, endTime } = createTimePoint();
        const result = await this.$store.dispatch('settingsConfig/checkScheduleOverlap', {
          startTime, endTime, configName,
        });

        if (result?.hasOverlap) {
          if (result.newStartTime && result.newEndTime) {
            return { startTime: result.newStartTime, endTime: result.newEndTime };
          }
          // Раньше здесь была опечатка (result.massage) и сообщение не показывалось,
          // а элемент создавался с ПЕРЕСЕКАЮЩИМСЯ временем.
          this.showWarning(result.message || 'Не удалось найти свободное время.');
          return null;
        }
        return { startTime, endTime };
      } catch (error) {
        logger.error('[MainBodySettings] - generationTime:', error);
        this.showWarning('Ошибка проверки пересечения времени.');
        return null;
      }
    },

    // Следующий id: учитываем и существующие, и ожидающие удаления элементы —
    // иначе новый элемент получил бы id удаляемого и был бы удалён вместе с ним.
    nextId(configName, room, param) {
      const ids = [
        ...this[configName].filter((i) => i.room === room && i.param === param).map((i) => i.id),
        ...this.pendingDeletes
          .filter((p) => p.configName === configName && p.room === room && p.param === param)
          .map((p) => p.id),
      ].filter((id) => typeof id === 'number');
      return ids.length ? Math.max(...ids) + 1 : 1;
    },

    buildItem(configName, { id, room, param, value, time }) {
      const now = nowMoscow();
      const base = { id, room, param, createdAt: now, updatedAt: now };

      if (configName === 'schedules') {
        return {
          ...base,
          startTime: time.startTime,
          endTime: time.endTime,
          value,
          value_type: 'absolute',
          unit: this.unit || '',
          days: [1, 2, 3, 4, 5],
        };
      }
      if (configName === 'notifications') {
        return {
          ...base,
          condition: 'greater_than',
          value,
          notificationСhannel: 0, // кириллическая «С» — ключ сервера
          frequency: 0,
          permission: true,
          status: false,
          startTime: time.startTime,
          endTime: time.endTime,
        };
      }
      return {
        ...base,
        value: true,
        setpoint: false,
        devSetpoint: false,
        changeSeason: false,
        savePeriod: 0,
        sensityRate: 0.5,
      };
    },

    async createConfigItem(configName) {
      const limitCheck = await this.$store.dispatch('config/checkLimitBeforeAdd', configName);
      if (!limitCheck.allowed) {
        this.$store.dispatch('popup/show', {
          message: `Достигнут предел количества ${LIMIT_TEXT[configName]} (${limitCheck.limit}).`,
          type: 'warning',
          duration: 2000,
        });
        return null;
      }

      const room = this.payloadRoom;
      const param = this.payloadParam;
      const value = this.settingsData?.payload?.value ?? 0;

      let time = null;
      if (configName !== 'statistics') {
        time = await this.generationTime(configName);
        if (!time) return null;
      }

      const item = this.buildItem(configName, {
        id: this.nextId(configName, room, param),
        room, param, value, time,
      });

      try {
        // Оптимистично — в локальное хранилище; список обновится через storeSlice
        await this.$store.dispatch('settingsConfig/addConfigLocally', {
          room, param, configName, configData: item,
        });
        await this.saveConfigItems({ room, param, configName, configData: item });
        this.showSuccessNotification(CREATED_TEXT[configName]);
        return item;
      } catch (error) {
        logger.error(`[MainBodySettings] - createConfigItem(${configName}):`, error);
        // Откат оптимистичного добавления
        await this.$store.dispatch('config/removeConfigItemsLocally', {
          configName, room, param, ids: [item.id],
        });
        this.$store.dispatch('popup/show', {
          message: 'Не удалось сохранить на сервере. Попробуйте ещё раз.',
          type: 'error',
          duration: 3000,
        });
        throw error;
      }
    },

    // ── Удаление (отложенное до закрытия экрана) ────────────────────
    handleDeleteConfigItem(id, configName) {
      const room = this.payloadRoom;
      const param = this.payloadParam;
      if (id == null || !room || !param) return;

      const exists = this.pendingDeletes.some(
        (p) => p.configName === configName && p.id === id && p.room === room && p.param === param,
      );
      if (!exists) this.pendingDeletes.push({ configName, room, param, id });
      this[configName] = this[configName].filter((item) => item.id !== id);
      logger.info(`[MainBodySettings] - удаление ${configName}#${id} отложено до закрытия`);
    },

    // Отправляет накопленные удаления. Группируем по (тип, комната, параметр):
    // раньше id всех типов собирались в один список и уходили с текущим title.
    async flushDeletions() {
      if (this.pendingDeletes.length === 0) return true;

      const batch = this.pendingDeletes.splice(0);
      const groups = new Map();
      batch.forEach((p) => {
        const key = `${p.configName}|${p.room}|${p.param}`;
        if (!groups.has(key)) groups.set(key, { ...p, ids: [] });
        groups.get(key).ids.push(p.id);
      });

      let ok = true;
      for (const g of groups.values()) {
        try {
          await this.deleteConfigItems({
            room: g.room, param: g.param, configName: g.configName, configsIds: g.ids,
          });
        } catch (error) {
          ok = false;
          logger.error('[MainBodySettings] - flushDeletions:', error);
          this.$store.dispatch('popup/show', {
            message: 'Не удалось удалить элементы на сервере.',
            type: 'error',
            duration: 3000,
          });
        }
      }
      return ok;
    },

    async closeMainBodySettings() {
      if (this.closing) return;
      this.closing = true;
      try {
        await this.flushDeletions();
      } finally {
        // history.length учитывает и чужие сайты. vue-router кладёт в history.state.back
        // предыдущий маршрут ПРИЛОЖЕНИЯ — по нему и определяем, есть ли куда вернуться.
        if (window.history.state?.back) this.$router.back();
        else this.$router.push('/');
        this.$emit('close');
      }
    },

    // ── Выделение полей / клики ─────────────────────────────────────
    // Дочерние компоненты шлют разные ключи ({scheduleId, field}, {notificationId, field}…).
    // Раньше сохранялись только scheduleId и field — выделение в уведомлениях
    // и аналитике не работало. Теперь сохраняем объект целиком.
    handleFieldSelected(selection) {
      this.activeSelection = selection;
    },

    handleClickOutside(event) {
      if (this.$el && this.$el.contains(event.target)) return;
      const setpointEl = this.getMainSetpointEl();
      if (setpointEl && setpointEl.contains(event.target)) return;
      this.activeSelection = null;
    },

    showSuccessNotification(message) {
      this.$store.dispatch('popup/show', { message, type: 'success', duration: 2000 });
    },
    showWarning(message) {
      this.$store.dispatch('popup/show', { message, type: 'warning', duration: 3000 });
    },
  },
};
</script>
