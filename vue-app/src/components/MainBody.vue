<!-- components/MainBody.vue -->
<template>
  <div v-if="isLoading" class="loading">Загрузка...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  <div v-else id="app_mainBody" class="mainBody">
    <MainBodyValue
      v-for="(item, index) in viewArray"
      :key="`${index}-${item.paramKey}-${item.roomKey}-${item.deviceKey}-${item.setpointKey}`"
      :value="item.value"
      :unit="item.unit"
      :roomTitle="item.roomTitle"
      :paramTitle="item.paramTitle"
      :setValue="item.setValue"
      :timeUpdated="item.timeDiff"
      :isSelected="isSelected(item)"
      @click="selectItem(item)"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import MainBodyValue from './MainBodyValue.vue';
import logger from '../store/modules/logger.js';
import { parseMoscowDate } from '@/utils/timeUtils';

const EXCLUDED_SECTIONS = new Set(['init', 'id', 'group', 'title', 'setpoints']);
const STRIP_DIGITS = /\d+$/;
const SERVICE_ROOM_KEYS = new Set(['init', 'newConfigID', 'password']);

export default {
  name: 'MainBody',
  components: { MainBodyValue },

  data() {
    return {
      selectedItem: null,
      viewArray: [],
      doubleClickTimer: null,
      pendingItem: null,
      updateViewTimeout: null,
    };
  },

  computed: {
    ...mapGetters('config', ['isLoading', 'error', 'getConfig', 'clearKeySync']),
    ...mapGetters('sortParams', ['getSensorTitle', 'getUnit']),
    ...mapGetters(['dID', 'typeSettingsKey']),
  },

  watch: {
    '$store.state.sortParams.forceUpdate': {
      handler(newTimestamp) {
        if (!newTimestamp) return;
        if (this.updateViewTimeout) clearTimeout(this.updateViewTimeout);
        this.updateViewTimeout = setTimeout(() => {
          logger.dev('[MainBody] - watch forceUpdate - принудительное обновление view');
          this.updateView();
        }, 250);
      },
      immediate: true,
    },
    '$store.state.showSetpoint'(newVal) {
      if (newVal === false && this.selectedItem) {
        this.clearSelection();
      }
    },
  },

  beforeUnmount() {
    if (this.updateViewTimeout) clearTimeout(this.updateViewTimeout);
    if (this.doubleClickTimer) clearTimeout(this.doubleClickTimer);
  },

  methods: {
    ...mapActions('sortParams', ['setLimits']),
    ...mapActions(['updateSettingsData', 'updatePayloadData']),

    _buildItem(overrides) {
      return {
        key: null,
        paramTitle: null,
        paramType: null,
        paramKey: null,
        value: null,
        setValue: null,
        setpointKey: null,
        unit: null,
        timeDiff: null,
        roomTitle: null,
        roomId: null,
        roomKey: null,
        deviceKey: null,
        ...overrides,
      };
    },

    _resolveSetpoint(room, cleanKey) {
      if (!room?.setpoints || !cleanKey) return { setValue: null, setpointKey: null };

      const sKey = 's' + cleanKey;
      let setpointKey = room.setpoints[sKey] ? sKey : null;
      if (!setpointKey) {
        setpointKey = Object.keys(room.setpoints).find(k => k.startsWith(sKey)) ?? null;
      }
      if (!setpointKey) return { setValue: null, setpointKey: null };

      const spData = room.setpoints[setpointKey];
      if (spData?.type === 'bool' && spData?.value === null) {
        return { setValue: null, setpointKey: null };
      }
      const spType = spData?.type ?? 'num';
      const setValue = this.getSensorValue(spType, { value: spData?.value });
      return { setValue, setpointKey };
    },

    getSensorValue(key, data) {
      switch (key) {
        case 'num': {
          return data?.value != null ? parseFloat(data.value) : 0;
        }
        case 'bool': {
          const boolValue = data?.value != null ? data.value : null;
          return boolValue === true ? 'ON' : 'OFF';
        }
        default:
          return null;
      }
    },

    getTimeDiff(timestamp) {
      if (!timestamp) return 'Неизвестно';
      let time;
      try {
        const now = Date.now();
        if (typeof timestamp === 'number') {
          time = timestamp;
        } else if (typeof timestamp === 'string') {
          time = parseMoscowDate(timestamp);
          if (isNaN(time)) time = new Date(timestamp).getTime();
        } else {
          return 'Неизвестно';
        }
        if (isNaN(time)) return 'Неизвестно';

        const diff = Math.floor((now - time) / 60000);
        if (diff < 1) return 'сейчас';
        if (diff < 60) return `${diff} мин назад`;
        if (diff < 1440) return `${Math.floor(diff / 60)} ч назад`;
        return `${Math.floor(diff / 1440)} дн назад`;
      } catch {
        return 'Неизвестно';
      }
    },

    getAllData(config) {
      const result = [];

      for (const [roomKey, room] of Object.entries(config)) {
        if (SERVICE_ROOM_KEYS.has(roomKey)) continue;
        if (!room || typeof room !== 'object') continue;

        for (const [sectionKey, sectionData] of Object.entries(room)) {
          if (EXCLUDED_SECTIONS.has(sectionKey)) continue;
          if (!sectionData || typeof sectionData !== 'object') continue;

          for (const [itemKey, itemData] of Object.entries(sectionData)) {
            const clearKey = this.clearKeySync(itemKey);
            const { setValue, setpointKey } = this._resolveSetpoint(room, clearKey);

            result.push(this._buildItem({
              key: itemKey.slice(1).replace(STRIP_DIGITS, ''),
              paramTitle: this.getSensorTitle(itemKey),
              paramType: itemData?.type,
              paramKey: itemKey,
              value: this.getSensorValue(itemData?.type, itemData),
              setValue,
              setpointKey,
              unit: this.getUnit(itemKey),
              timeDiff: this.getTimeDiff(itemData?.lastUpdate),
              roomTitle: room.title,
              roomId: room.id,
              roomKey,
            }));
          }
        }
      }

      return result;
    },

    async updateView() {
      try {
        logger.info('[MainBody] - updateView - started');
        const config = this.getConfig(this.dID);
        if (!config) {
          logger.error('[MainBody] - updateView - конфигурация недоступна');
          this.viewArray = [];
          return;
        }

        this.viewArray = this.getAllData(config);
        logger.dev('[MainBody] - updateView - отображаемых элементов:', this.viewArray.length);
        localStorage.setItem('viewArray', JSON.stringify(this.viewArray));
      } catch (error) {
        logger.error('[MainBody] - updateView - Ошибка:', error);
        this.viewArray = [];
      }
    },

    isSelected(item) {
      return this.selectedItem
        && this.selectedItem.roomId === item.roomId
        && this.selectedItem.paramKey === item.paramKey
        && this.selectedItem.deviceKey === item.deviceKey
        && this.selectedItem.setpointKey === item.setpointKey;
    },

    selectItem(item) {
      if (this.doubleClickTimer && this.pendingItem === item) {
        clearTimeout(this.doubleClickTimer);
        this.doubleClickTimer = null;
        this.pendingItem = null;
        this.DclickSelectItem(item);
        return;
      }

      this.pendingItem = item;
      if (this.doubleClickTimer) clearTimeout(this.doubleClickTimer);
      this.doubleClickTimer = setTimeout(() => {
        this.singleClickAction(item);
        this.doubleClickTimer = null;
        this.pendingItem = null;
      }, 300);
    },

    singleClickAction(item) {
      const clearParam = this.clearKeySync(item.paramKey);
      logger.dev('[MainBody] - singleClickAction - param:', item.paramKey, '→', clearParam);

      if (this.selectedItem === item) {
        this.selectedItem = null;
        this.$emit('getComponentData', {
          action: 'hide',
          updateState: {
            value: item.setValue,
            title: 'value',
            key: clearParam,
            roomKey: item.roomKey,
            paramKey: item.paramKey,
          },
        });
      } else {
        this.selectedItem = item;
        this.updatePayloadData({
          value: item.setValue,
          param: item.paramKey,
          key: clearParam,
          setKey: item.setpointKey,
          id: item.roomId,
          room: item.roomKey,
        });

        this.setLimits({ param: clearParam, valueType: 'absolute' });

        if (item.setValue !== undefined && item.setValue !== null && clearParam && item.setpointKey) {
          this.$emit('getComponentData', {
            action: 'show',
            request: 'setpoints',
            updateState: {
              value: item.setValue,
              title: 'value',
              key: clearParam,
              roomKey: item.roomKey,
              paramKey: item.paramKey,
            },
          });
        } else {
          logger.error(
            '[MainBody] - singleClickAction - уставка не определена:',
            item.setValue, clearParam, item.setpointKey,
          );
        }
      }

      this.$store.dispatch('updatePayloadData', { param: item.paramKey });
      this.updateSettingsData({ field: 'request', value: 'setpoints' });
    },

    DclickSelectItem(item) {
      const clearParam = this.clearKeySync(item.paramKey);
      logger.dev('[MainBody] - DclickSelectItem - key:', clearParam);

      if (this.doubleClickTimer) {
        clearTimeout(this.doubleClickTimer);
        this.doubleClickTimer = null;
      }

      const config = this.getConfig(this.dID);
      if (!config) {
        logger.error('[MainBody] - DclickSelectItem - конфигурация не загружена');
        return;
      }

      const roomConfig = config[item.roomKey];
      const spData = roomConfig?.setpoints?.[item.setpointKey];
      if (!roomConfig?.setpoints || !item.setpointKey || spData?.value == null) {
        this.$store.dispatch('popup/show', {
          message: `Уставка для параметра "${item.paramTitle}" в комнате "${item.roomTitle}" не настроена.`,
          type: 'warning',
          duration: 3000,
        });
        return;
      }

      if (!clearParam) {
        logger.error('[MainBody] - DclickSelectItem - отсутствует ключ параметра');
        return;
      }

      this.updatePayloadData({
        param: item.paramKey,
        key: clearParam,
        room: item.roomKey,
        config: this.typeSettingsKey,
        value: item.setValue,
      });

      const settingsType = this.typeSettingsKey || 'schedule';

      this.$emit('getComponentData', {
        action: 'hide',
        request: settingsType,
        updateState: {
          key: clearParam,
          value: item.setValue,
          title: 'value',
        },
      });

      this.$router.push({
        name: 'DashboardSettings',
        params: { settingsType },
      });
    },

    clearSelection() {
      if (!this.selectedItem) return;
      logger.dev('[MainBody] - clearSelection - сброс выделения');
      this.selectedItem = null;
      if (this.doubleClickTimer) {
        clearTimeout(this.doubleClickTimer);
        this.doubleClickTimer = null;
      }
      this.pendingItem = null;
    },
  },
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>