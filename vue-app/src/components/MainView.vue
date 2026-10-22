<!-- components/MainView.vue (бывший DashBoard.vue) -->
<template>
  <div class="app">
    <svg display="none">
      <symbol id="homeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </symbol>
      <symbol id="menuIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6"  x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </symbol>
    </svg>

    <!-- ── ШАПКА ────────────────────────────────────────────────────── -->
    <header class="header">
      <div class="header-top">
        <div class="icon" @click="goHome">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <use href="#homeIcon"></use>
          </svg>
        </div>
        <div style="display: flex; justify-content: center; flex: 1;">
          <h2>{{ headerTitle }}</h2>
        </div>
        <div class="icon" @click="openMenu">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <use href="#menuIcon"></use>
          </svg>
        </div>
      </div>
      <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>
    </header>

    <!-- ── ТЕЛО ─────────────────────────────────────────────────────── -->
    <div class="body">
      <router-view
        :key="routeKey"
        @getComponentData="getComponentData"
        @updateTypeValue="editValueMainSetpoint"
      />
    </div>
  </div>

  <!-- ── Плавающая панель уставки ─────────────────────────────────── -->
  <Teleport to="body">
    <div class="setpoint-overlay" v-if="showFooterSetpoint">
      <MainSetpoint
        ref="mainSetpoint"
        :setPoint="setpoint"
        :request="request"
        :roomKey="selectedItemData.roomKey"
        :setpointKey="selectedItemData.setpointKey"
        :valueTitle="selectedItemData.valueTitle"
        @eventsMainSetpoint="editValueMainSetpoint"
        @eventsSchedule="editValueMainSetpoint"
        @inactivity-timeout="handleSetpointInactivity"
      />
    </div>
  </Teleport>
</template>

<script>
import logger from '@/store/modules/logger.js';
import { mapGetters, mapActions } from 'vuex';
import MainSetpoint from '@/components/MainSetpoint.vue';
import { nowMoscow } from '@/utils/timeUtils';

export default {
  name: 'MainView',
  components: { MainSetpoint },

  provide() {
    return {
      // MainBodySettings использует это, чтобы не снимать выделение
      // при кликах по панели уставки (Teleport → вне DOM-дерева страницы).
      getMainSetpointEl: () => this.$refs.mainSetpoint?.$el ?? null,
    };
  },

  data() {
    return {
      request: null,
      setpoint: null,
      selectedItemData: {},
    };
  },

  computed: {
    ...mapGetters(['dID', 'showSetpoint']),
    ...mapGetters('config', ['getMobile']),

    headerTitle() {
      return this.$route.params.settingsType ? 'Настройки' : 'Панель управления';
    },

    showFooterSetpoint() {
      return this.showSetpoint
        && this.setpoint !== null
        && this.setpoint !== undefined;
    },

    routeKey() {
      return this.$route.fullPath;
    },
  },

  beforeUnmount() {
    // ✅ Flush pending-отправки, чтобы не потерять последнее изменение
    this.flushPendingUpdate();
  },

  methods: {
    ...mapActions(['updatePayloadData']),
    ...mapActions('dropdown', ['show']),

    // ── Навигация ────────────────────────────────────────────────────
    goHome() {
      this.$store.commit('SHOW_SETPOINT', false);
      this.$router.push('/');
    },

    openMenu(event) {
      event.stopPropagation();
      const isMobile = this.getMobile;
      this.show({
        items: [
          { label: 'Профиль',   action: 'profile'  },
          { label: 'Выйти',     action: 'logout'   },
          { divider: true },
          {
            label: isMobile ? '🖥️ Десктоп' : '📱 Мобильный',
            action: 'toggleMobile',
          },
        ],
        anchorElement: event.currentTarget,
      });
    },

    // ── Показ/скрытие MainSetpoint ──────────────────────────────────
    getComponentData(event) {
      logger.dev('[MainView] - getComponentData:', event);
      this.request = event.request;
      this.setpoint = event.updateState.value;

      if (event.action === 'show') {
        this.$store.commit('SHOW_SETPOINT', true);
        this.selectedItemData = {
          roomKey: this.$store.state.setpointsManager?.settingsData?.payload?.room,
          setpointKey:
            event.updateState.paramKey
            || this.$store.state.setpointsManager?.settingsData?.payload?.param,
          valueTitle: event.updateState.title,
        };
      } else if (event.action === 'hide') {
        this.$store.commit('SHOW_SETPOINT', false);
        this.sendChangedData({
          updateState: {
            request: event.request,
            title: event.updateState.title,
            value: event.updateState.value,
          },
        });
      }
    },

    // ── Изменение уставки ───────────────────────────────────────────
    async editValueMainSetpoint(eventData) {
      logger.dev('[MainView] - editValueMainSetpoint:', eventData);
      const settingsData = this.$store.state.setpointsManager?.settingsData;
      if (!settingsData) {
        logger.error('[MainView] - editValueMainSetpoint - settingsData не инициализировано');
        return;
      }

      const dID = this.dID;
      const roomKey = settingsData.payload?.room;
      const requestName = eventData.updateState.request || 'unknown';
      const valueTitle = eventData.updateState.title || '';
      const value_details =
        eventData.updateState.value_details
        || settingsData.payload.value_details
        || null;
      const value_type = settingsData.payload.value_type || 'absolute';

      if (!dID || !roomKey) {
        logger.error(
          '[MainView] - editValueMainSetpoint - не определены dID/roomKey:',
          dID, roomKey,
        );
        return;
      }

      const oldValue = this.setpoint;
      let value = eventData.updateState.value;
      let newValue;
      let payload;

      try {
        if (valueTitle === 'startTime' || valueTitle === 'endTime') {
          value = Math.round(parseFloat(value));
        } else if (value_type === 'deviation') {
          value = Math.round(parseFloat(value) * 100) / 100;
        } else if (valueTitle === 'frequency') {
          value = parseInt(value, 10);
        } else if (typeof value === 'boolean') {
          // boolean оставляем как есть
        } else {
          value = Math.round(parseFloat(value) * 10) / 10;
        }
        this.setpoint = value;

        switch (requestName) {
          case 'setpoints': {
            payload = {
              room: roomKey,
              param: settingsData.payload.param,
              value,
              time: nowMoscow(),
            };
            newValue = value;
            break;
          }

          case 'schedules':
          case 'notifications': {
            if (value_details === 'minutes' || value_details === 'hours') {
              const result = await this.$store.dispatch(
                'settingsConfig/settingsConfigUpdate',
                { newValue: value, value_details },
              );
              if (result.hasOverlap) {
                this.$store.dispatch('popup/show', {
                  message: 'Время скорректировано из-за пересечения с другими расписаниями',
                  type: 'warning',
                  duration: 1000,
                });
                this.setpoint = oldValue;
              }
              newValue = result.updatedValue;
              payload = {
                room: roomKey,
                param: settingsData.payload.param,
                value: newValue,
                time: nowMoscow(),
              };
            } else {
              newValue = value;
              payload = {
                room: roomKey,
                param: settingsData.payload.param,
                value,
                value_type,
                time: nowMoscow(),
              };
            }
            break;
          }

          case 'statistics': {
            newValue = value;
            payload = {
              room: roomKey,
              param: settingsData.payload.param,
              value: newValue,
              time: nowMoscow(),
            };
            break;
          }

          default: {
            logger.warn('[MainView] - editValueMainSetpoint - неизвестный request:', requestName);
            return;
          }
        }
      } catch (error) {
        logger.error('[MainView] - editValueMainSetpoint - ошибка формирования payload:', error);
        return;
      }

      logger.dev('[MainView] - editValueMainSetpoint - payload:', payload, 'newValue:', newValue);

      if (
        newValue !== undefined
        && !Number.isNaN(newValue)
        && valueTitle !== 'startTime'
        && valueTitle !== 'endTime'
      ) {
        this.updatePayloadData({ value: newValue });
      }

      await this.$store.dispatch('config/handleValueUpdate', {
        dID,
        payload,
        type: requestName,
      });

      const sendData = (valueTitle === 'startTime' || valueTitle === 'endTime')
        ? { ...eventData, updateState: { ...eventData.updateState, value: newValue } }
        : eventData;

      this.sendChangedData(sendData, oldValue);

      this.$store.commit('sortParams/SET_FORCE_UPDATE', Date.now());
    },

    // ── Отложенная отправка на сервер ───────────────────────────────
    sendChangedData(event, oldValue = null) {
      if (!event?.updateState) return;
      const value = event.updateState.value;
      logger.dev(
        '[MainView] - sendChangedData - value:', value,
        'request:', event.updateState.request,
      );
      this.updatePayloadData({ value });

      if (this.setpointUpdateTimer) clearTimeout(this.setpointUpdateTimer);
      this.setpointUpdateTimer = setTimeout(async () => {
        try {
          await this.$store.dispatch('config/updateSetpointServer');
          logger.info('[MainView] - sendChangedData - отправлено на сервер');
        } catch (error) {
          logger.error('[MainView] - sendChangedData - ошибка отправки:', error);
          if (oldValue !== null) this.setpoint = oldValue;
        }
      }, 300);
    },

    /**
     * Немедленная отправка накопленного значения, если таймер ещё активен.
     * Используется при размонтировании и автоскрытии — чтобы не потерять
     * последнее изменение при быстром уходе пользователя.
     */
    async flushPendingUpdate() {
      if (!this.setpointUpdateTimer) return;
      clearTimeout(this.setpointUpdateTimer);
      this.setpointUpdateTimer = null;
      try {
        await this.$store.dispatch('config/updateSetpointServer');
        logger.info('[MainView] - flushPendingUpdate - отправлено при закрытии');
      } catch (error) {
        logger.error('[MainView] - flushPendingUpdate - ошибка:', error);
      }
    },

    // ── Бездействие в MainSetpoint ──────────────────────────────────
    async handleSetpointInactivity() {
      logger.dev('[MainView] - handleSetpointInactivity - скрываем панель');
      await this.flushPendingUpdate();
      this.$store.commit('SHOW_SETPOINT', false);
      this.setpoint = null;
      this.selectedItemData = {};
      this.request = null;
    },
  },
};
</script>

