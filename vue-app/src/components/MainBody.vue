<template>
  <div v-if="isLoading" class="loading">Загрузка...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  <div v-else id="app_mainBody" class="mainBody">
    <template v-if="groupedView.length">
      <section
        v-for="group in groupedView"
        :key="group.roomKey"
        class="room-group"
      >
        <div class="room-group-header">
          <span class="room-group-title">{{ group.header }}</span>
          <span class="room-group-arrow">›</span>
        </div>
        <div class="room-group-items">
          <MainBodyValue
            v-for="(item, index) in group.items"
            :key="`${group.roomKey}-${index}-${item.paramKey}-${item.setpointKey}`"
            :value="item.value"
            :unit="item.unit"
            :paramTitle="item.paramTitle"
            :paramKey="item.paramKey"
            :setValue="item.setValue"
            :timeUpdated="item.timeDiff"
            :roomTitle="''"
            :isSelected="isSelected(item)"
            @click="selectItem(item)"
          />
        </div>
      </section>
    </template>
    <p v-else class="mainBody-empty">{{ emptyText }}</p>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import MainBodyValue from './MainBodyValue.vue';
import logger from '../store/modules/logger.js';
import { parseMoscowDate } from '@/utils/timeUtils';

const STRIP_DIGITS = /\d+$/;
const ROOM_KEY_RE = /^room\d+$/;
const COMMON_KEY = 'common';

const TAB_SECTIONS = {
  control: ['sensors'],
  devices: ['system'],
};

export default {
  name: 'MainBody',
  components: { MainBodyValue },

  props: {
    activeTab: { type: String, default: 'control' },
  },

  data() {
    return {
      selectedItem: null,
      doubleClickTimer: null,
      pendingItem: null,
    };
  },

  computed: {
    ...mapGetters('config', ['isLoading', 'error', 'getConfig', 'clearKeySync']),
    ...mapGetters('sortParams', ['getSensorTitle', 'getUnit']),
    ...mapGetters(['dID', 'typeSettingsKey']),

    groupedView() {
      const config = this.getConfig(this.dID);
      if (!config || Object.keys(config).length === 0) return [];
      return this.getAllData(config, this.activeTab);
    },

    emptyText() {
      switch (this.activeTab) {
        case 'devices': return 'Нет данных о состоянии устройств';
        case 'general': return 'Нет данных общих настроек';
        default:        return 'Нет данных для отображения';
      }
    },
  },

  watch: {
    '$store.state.showSetpoint'(newVal) {
      if (newVal === false && this.selectedItem) this.clearSelection();
    },
    activeTab() {
      this.clearSelection();
    },
  },

  beforeUnmount() {
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
        roomGroup: null,
        roomId: null,
        roomKey: null,
        deviceKey: null,
        ...overrides,
      };
    },

    _resolveSetpoint(room, sensorKey) {
      if (!room?.setpoints || !sensorKey) return { setValue: null, setpointKey: null };
      const num  = (sensorKey.match(/(\d+)$/) || [])[1] || '';
      const base = 's' + sensorKey.slice(1).replace(/\d+$/, '');
      const candidate = `${base}${num}`;

      const spData = room.setpoints[candidate];
      if (!spData) return { setValue: null, setpointKey: null };
      if (spData.type === 'bool' && spData.value === null) {
        return { setValue: null, setpointKey: null };
      }

      const spType = spData.type ?? 'num';
      const setValue = this.getSensorValue(spType, { value: spData.value });
      return { setValue, setpointKey: candidate };
    },

    getSensorValue(key, data) {
      if (!data) return null;
      const raw = data.value;

      switch (key) {
        case 'num':
          return raw != null ? parseFloat(raw) : 0;
        case 'bool':
        case 'dBool': {
          if (raw == null) return null;
          if (raw === 'ON' || raw === true) return 'ON';
          if (raw === 'OFF' || raw === false) return 'OFF';
          return Number(raw) ? 'ON' : 'OFF';
        }
        default:
          return raw ?? null;
      }
    },

    getTimeDiff(timestamp) {
      if (!timestamp) return 'Неизвестно';
      let time;
      try {
        if (typeof timestamp === 'number') {
          time = timestamp;
        } else if (typeof timestamp === 'string') {
          time = parseMoscowDate(timestamp);
          if (isNaN(time)) time = new Date(timestamp).getTime();
        } else {
          return 'Неизвестно';
        }
        if (isNaN(time)) return 'Неизвестно';

        const diff = Math.floor((Date.now() - time) / 60000);
        if (diff < 1) return 'сейчас';
        if (diff < 60) return `${diff} мин назад`;
        if (diff < 1440) return `${Math.floor(diff / 60)} ч назад`;
        return `${Math.floor(diff / 1440)} дн назад`;
      } catch {
        return 'Неизвестно';
      }
    },

    getAllData(config, tab = 'control') {
      if (tab === 'general') return this._getGeneralData(config);
      return this._getRoomData(config, tab);
    },

    _getGeneralData(config) {
      const common = config[COMMON_KEY];
      if (!common?.system) return [];
      const items = this._collectItems(COMMON_KEY, common, 'system', false);
      if (!items.length) return [];
      return [{
        roomKey: COMMON_KEY,
        header: common.group || common.title || 'Общие настройки',
        roomId: common.id,
        items,
      }];
    },

    _getRoomData(config, tab) {
      const sections = TAB_SECTIONS[tab] || [];
      const withSetpoint = tab === 'control';
      const groups = [];

      for (const [roomKey, room] of Object.entries(config)) {
        if (!ROOM_KEY_RE.test(roomKey)) continue;
        if (!room || typeof room !== 'object') continue;

        const items = [];
        for (const sectionKey of sections) {
          items.push(...this._collectItems(roomKey, room, sectionKey, withSetpoint));
        }
        if (!items.length) continue;

        groups.push({
          roomKey,
          header: room.group || room.title || roomKey,
          roomId: room.id,
          items,
        });
      }

      groups.sort((a, b) => a.roomKey.localeCompare(b.roomKey));
      return groups;
    },

    _collectItems(roomKey, room, sectionKey, withSetpoint) {
      const sectionData = room[sectionKey];
      if (!sectionData || typeof sectionData !== 'object') return [];

      const roomMeta = room._meta || {};
      const items = [];

      for (const [itemKey, itemData] of Object.entries(sectionData)) {
        const { setValue, setpointKey } = withSetpoint
          ? this._resolveSetpoint(room, itemKey)
          : { setValue: null, setpointKey: null };

        const meta = roomMeta[`${sectionKey}|${itemKey}`] || {};
        const title = meta.title || this.getSensorTitle(itemKey);

        items.push(this._buildItem({
          key: itemKey.slice(1).replace(STRIP_DIGITS, ''),
          paramTitle: title,
          paramType: itemData?.type,
          paramKey: itemKey,
          value: this.getSensorValue(itemData?.type, itemData),
          setValue,
          setpointKey,
          unit: this.getUnit(itemKey),
          timeDiff: this.getTimeDiff(itemData?.lastUpdate),
          roomTitle: room.title,
          roomGroup: room.group,
          roomId: room.id,
          roomKey,
        }));
      }
      return items;
    },

    isSelected(item) {
      return this.selectedItem
        && this.selectedItem.roomId === item.roomId
        && this.selectedItem.paramKey === item.paramKey
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

      if (this.isSelected(item)) {
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
        return;
      }

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

      if (item.setpointKey && item.setValue !== undefined && item.setValue !== null && clearParam) {
        this.$emit('getComponentData', {
          action: 'show',
          request: 'setpoints',
          updateState: {
            value: item.setValue,
            title: 'value',
            key: clearParam,
            roomKey: item.roomKey,
            paramKey: item.paramKey,
            setpointKey: item.setpointKey,
          },
        });
      } else {
        logger.dev('[MainBody] - singleClickAction - карточка без уставки:', item.paramKey);
      }

      this.updateSettingsData({ field: 'request', value: 'setpoints' });
    },

    DclickSelectItem(item) {
      const clearParam = this.clearKeySync(item.paramKey);
      if (this.doubleClickTimer) {
        clearTimeout(this.doubleClickTimer);
        this.doubleClickTimer = null;
      }

      const config = this.getConfig(this.dID);
      if (!config) return;

      const roomConfig = config[item.roomKey];
      const spData = roomConfig?.setpoints?.[item.setpointKey];
      if (!roomConfig?.setpoints || !item.setpointKey || spData?.value == null) {
        this.$store.dispatch('popup/show', {
          message: `Уставка для параметра "${item.paramTitle}" в комнате "${item.roomGroup || item.roomTitle}" не настроена.`,
          type: 'warning',
          duration: 3000,
        });
        return;
      }
      if (!clearParam) return;

      this.updatePayloadData({
        param: item.paramKey,
        key: clearParam,
        room: item.roomKey,
        config: this.typeSettingsKey,
        value: item.setValue,
      });

      const settingsType = this.typeSettingsKey || 'schedules';
      this.$emit('getComponentData', {
        action: 'hide',
        request: settingsType,
        updateState: { key: clearParam, value: item.setValue, title: 'value' },
      });
      this.$router.push({ name: 'DashboardSettings', params: { settingsType } });
    },

    clearSelection() {
      if (!this.selectedItem) return;
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