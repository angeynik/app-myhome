<!-- components/MainView.vue -->
<template>
  <div class="app" :class="bgThemeClass" :style="bgCustomStyle">
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

        <!-- На главной — одна активная вкладка (клик = следующая) -->
        <nav v-if="showTabs" class="top-nav top-nav--center" role="tablist">
          <div
            class="settings-block-title clickable selected"
            role="tab"
            aria-selected="true"
            :aria-label="`Вкладка: ${currentTabLabel}. Нажмите, чтобы переключить на следующую.`"
            tabindex="0"
            @click="cycleTab"
            @keydown.enter.prevent="cycleTab"
            @keydown.space.prevent="cycleTab"
          >
            <p>{{ currentTabLabel }}</p>
            <span class="tab-chevron" aria-hidden="true">›</span>
          </div>
        </nav>

        <div v-else class="header-center">
          <h2>{{ headerTitle }}</h2>
        </div>

        <div class="icon" @click="openMenu">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <use href="#menuIcon"></use>
          </svg>
        </div>
      </div>
      <p class="header-divider"></p>
    </header>

    <!-- ── ТЕЛО ─────────────────────────────────────────────────────── -->
    <div class="body">
      <router-view
        :key="routeKey"
        :active-tab="showTabs ? activeTab : undefined"
        @getComponentData="getComponentData"
        @updateTypeValue="editValueMainSetpoint"
      />
    </div>
  </div>

  <!-- ── Экран изменения значения (сам рендерится в <body> через Teleport) ── -->
  <SetpointScreen
    v-if="showFooterSetpoint"
    :roomTitle="screenData.roomTitle"
    :paramTitle="screenData.paramTitle"
    :mobile="!isMobile"
    :setPoint="setpoint"
    :actualValue="screenData.actualValue"
    :unit="screenData.unit"
    :limHigh="screenLimits.limHigh"
    :limLow="screenLimits.limLow"
    :limStep="screenLimits.limStep"
    @update-value="onScreenUpdateValue"
    @close="onScreenClose"
  />
</template>

<script>
import logger from '@/store/modules/logger.js';
import { mapGetters, mapActions } from 'vuex';
import SetpointScreen from '@/components/SetpointScreen.vue';
import { nowMoscow } from '@/utils/timeUtils';
// Вкладки — единый источник с MainBody.vue
import { TAB_KEYS, TAB_STORAGE_KEY, getTab, readSavedTab } from '@/utils/mainTabs';

// Подписи редактируемого поля на экране изменения значения (когда правится не уставка)
const FIELD_LABELS = {
  startTime: 'Начало',
  endTime: 'Окончание',
  frequency: 'Частота',
  sensityRate: 'Чувствительность',
  value: 'Значение',
};

export default {
  name: 'MainView',
  components: { SetpointScreen },

  provide() {
    return {
      // Экран уставки рендерится в <body>; MainBodySettings не должен снимать выделение поля при кликах по нему
      getMainSetpointEl: () => document.querySelector('.setpoint-screen'),
    };
  },

  data() {
    return {
      request: null,          // 'setpoints' | 'schedules' | 'notifications' | 'statistics'
      valueTitle: 'value',    // какое поле правится: 'value' | 'startTime' | 'endTime' | 'frequency' | …
      setpoint: null,
      screenData: {},
      activeTab: readSavedTab(),
    };
  },

  computed: {
    ...mapGetters(['dID', 'showSetpoint']),
    ...mapGetters('config', ['isMobile']),
    ...mapGetters('appearance', ['bgThemeClass', 'customColor']), 
    
    bgCustomStyle() {
      // Если выбрана тема "Свой цвет", передаем цвет в CSS-переменную
      if (this.bgThemeClass === 'bg-theme--color') {
        return { '--custom-bg-color': this.customColor };
      }
      return {};
    },
    // Лимиты поля по умолчанию подставляются ПОЭЛЕМЕНТНО: null в limHigh/limLow раньше
    // превращался в 0 при сравнении и «схлопывал» диапазон
    screenLimits() {
      const l = this.$store.getters.settingsDataLimits || {};
      return {
        limHigh: l.limHigh ?? 36,
        limLow: l.limLow ?? 8,
        limStep: l.limStep ?? 0.5,
      };
    },

    headerTitle() {
      return this.$route.params.settingsType ? 'Настройки' : 'Панель управления';
    },

    showTabs() {
      return this.$route.name === 'Home';
    },

    currentTabLabel() {
      return getTab(this.activeTab).label;
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
    this.flushPendingUpdate();
  },

  methods: {
    ...mapActions(['updatePayloadData']),
    ...mapActions('dropdown', ['show']),

    // ── Показ/скрытие экрана изменения значения ─────────────────────
    getComponentData(event) {
      logger.dev('[MainView] - getComponentData:', event);
      const u = event.updateState;
      this.request = event.request;
      this.valueTitle = u.title || 'value';
      this.setpoint = u.value;

      if (event.action === 'show') {
        this.$store.commit('SHOW_SETPOINT', true);
        const isSetpoint = event.request === 'setpoints';
        this.screenData = {
          roomTitle: u.roomTitle || this.$store.getters['sortParams/getRoomTitle'] || 'Комната',
          // для настроек (расписание/уведомление/аналитика) — подпись редактируемого поля
          paramTitle: u.paramTitle
            || (isSetpoint ? null : FIELD_LABELS[this.valueTitle])
            || this.$store.getters['sortParams/getParamTitle']
            || 'Параметр',
          actualValue: u.actualValue,
          unit: u.unit,
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

    onScreenUpdateValue(newValue) {
      // request и title берём из того, что открыло экран. Раньше здесь было жёстко
      // 'setpoints'/'value': правка расписания, уведомления или аналитики уходила бы на
      // сервер как изменение УСТАВКИ.
      this.editValueMainSetpoint({
        updateState: {
          request: this.request || 'setpoints',
          title: this.valueTitle || 'value',
          value: newValue,
        },
      });
    },

    onScreenClose() {
      this.$store.commit('SHOW_SETPOINT', false);
      this.setpoint = null;
      this.screenData = {};
      this.request = null;
      this.valueTitle = 'value';
      this.flushPendingUpdate();
    },

    // ── Вкладки ─────────────────────────────────────────────────────
    cycleTab() {
      const idx = TAB_KEYS.indexOf(this.activeTab);
      this.setActiveTab(TAB_KEYS[(idx + 1) % TAB_KEYS.length]);
    },

    setActiveTab(tabKey) {
      if (!TAB_KEYS.includes(tabKey) || this.activeTab === tabKey) return;
      this.activeTab = tabKey;
      try {
        localStorage.setItem(TAB_STORAGE_KEY, tabKey);
      } catch (e) {
        logger.warn('[MainView] setActiveTab - localStorage:', e.message);
      }
    },

    // ── Навигация ────────────────────────────────────────────────────
    goHome() {
      this.$store.commit('SHOW_SETPOINT', false);
      this.$router.push('/');
    },

    // openMenu(event) {
    //   event.stopPropagation();
    //   // Режим устройства: «Авто» определяет по устройству, остальные — принудительно.
    //   // Галочка показывает выбранный режим.
    //   const modeItem = (mode, label) => ({
    //     label: `${this.deviceMode === mode ? '✓ ' : ''}${label}`,
    //     action: `deviceMode:${mode}`,
    //   });
    //   this.show({
    //     items: [
    //       { label: 'Профиль',   action: 'profile'  },
    //       { label: 'Выйти',     action: 'logout'   },
    //       { divider: true },
    //       modeItem('auto', '🔄 Авто'),
    //       modeItem('desktop', '🖥️ Десктоп'),
    //       modeItem('mobile', '📱 Мобильный'),
    //     ],
    //     anchorElement: event.currentTarget,
    //   });
    // },

    // ── Изменение уставки ───────────────────────────────────────────
    openMenu(event) {
      event.stopPropagation();
      this.show({
        items: [
          { label: 'Профиль',   action: 'profile'  },
          { label: 'Настройки', action: 'settings' }, // Новый пункт
          { label: 'Выйти',     action: 'logout'   },
        ],
        anchorElement: event.currentTarget,
      });
    },
    async editValueMainSetpoint(eventData) {
      logger.dev('[MainView] - editValueMainSetpoint:', eventData);
      const settingsData = this.$store.getters.getSetpointsManager?.settingsData;
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
          value = this.roundByStep(parseFloat(value));
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

    // Округление по точности шага (минимум 1 знак): при шаге 0.25 значение не «прыгает»
    roundByStep(value) {
      const part = String(this.screenLimits.limStep).split('.')[1] || '';
      const decimals = Math.max(1, Math.min(4, part.length));
      return Number(value.toFixed(decimals));
    },

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
  },
};
</script>