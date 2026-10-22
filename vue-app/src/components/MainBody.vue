<!-- components/MainBody.vue -->
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
        <h2 class="room-group-header">{{ group.header }}</h2>
        <div class="room-group-items">
          <MainBodyValue
            v-for="(item, index) in group.items"
            :key="`${group.roomKey}-${index}-${item.paramKey}-${item.setpointKey}`"
            :value="item.value"
            :unit="item.unit"
            :paramTitle="item.paramTitle"
            :setValue="item.setValue"
            :timeUpdated="item.timeDiff"
            :roomTitle="''"
            :isSelected="isSelected(item)"
            @click="selectItem(item)"
          />
        </div>
      </section>
    </template>
    <p v-else class="mainBody-empty">Нет данных для отображения</p>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import MainBodyValue from './MainBodyValue.vue';
import logger from '../store/modules/logger.js';
import { parseMoscowDate } from '@/utils/timeUtils';

// Метаданные комнаты (не являются «секциями с данными»)
const ROOM_META_KEYS = new Set(['init', 'id', 'group', 'title', '_meta']);

// Секции, которые НЕ создают отдельных карточек.
// setpoints уже отображаются рядом с парным sensors на одной плашке.
const NON_CARD_SECTIONS = new Set(['setpoints']);

// Порядок секций внутри группы
const SECTION_ORDER = { sensors: 0, system: 1 };

const STRIP_DIGITS = /\d+$/;

// Только комнаты вида room01, room02, ... Отсекает init/common
const ROOM_KEY_RE = /^room\d+$/;

export default {
  name: 'MainBody',
  components: { MainBodyValue },

  data() {
    return {
      selectedItem: null,
      groupedView: [],       // [{ roomKey, header, roomId, items: [...] }]
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
          logger.dev('[MainBody] - watch forceUpdate');
          this.updateView();
        }, 250);
      },
      immediate: true,
    },
    '$store.state.showSetpoint'(newVal) {
      if (newVal === false && this.selectedItem) this.clearSelection();
    },
  },

  mounted() {
    if (!this.groupedView.length) this.updateView();
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
        roomGroup: null,
        roomId: null,
        roomKey: null,
        deviceKey: null,
        ...overrides,
      };
    },

    /**
     * Ищет парную уставку для sensor-ключа по СОВПАДЕНИЮ НОМЕРА.
     *   dTemp02 → sTemp02 (если есть в room.setpoints)
     *   dTemp05 → sTemp05 (не найдётся → карточка read-only)
     * Без startsWith: иначе dTemp05 приклеился бы к sTemp02.
     */
    _resolveSetpoint(room, sensorKey) {
      if (!room?.setpoints || !sensorKey) return { setValue: null, setpointKey: null };

      const num  = (sensorKey.match(/(\d+)$/) || [])[1] || '';
      const base = 's' + sensorKey.slice(1).replace(/\d+$/, '');   // dTemp02 → sTemp
      const candidate = `${base}${num}`;                            // sTemp02

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
        case 'dTemp':
        case 'dHum':
        case 'dPress':
        case 'dPower':
        case 'dVoltage':
        case 'dСurrent':
        case 'dFrequency':
        case 'dEnergy':
        case 'xStatus':
        case 'sTemp':
        case 'sHum':
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

    /**
     * Собирает группы [{ roomKey, header, roomId, items }].
     *  - Только roomNN
     *  - header = room.group (fallback: room.title, roomKey)
     *  - Итерируем sensors + system; setpoints НЕ создают карточек
     *  - Заголовок карточки: room._meta[section|item].title → getSensorTitle
     */
    getAllData(config) {
      const groups = [];

      for (const [roomKey, room] of Object.entries(config)) {
        if (!ROOM_KEY_RE.test(roomKey)) continue;
        if (!room || typeof room !== 'object') continue;

        const roomMeta = room._meta || {};
        const items = [];

        const sections = Object.entries(room)
          .filter(([k, v]) =>
            !ROOM_META_KEYS.has(k) &&
            !NON_CARD_SECTIONS.has(k) &&
            v && typeof v === 'object'
          )
          .sort(([a], [b]) => (SECTION_ORDER[a] ?? 99) - (SECTION_ORDER[b] ?? 99));

        for (const [sectionKey, sectionData] of sections) {
          for (const [itemKey, itemData] of Object.entries(sectionData)) {
            const { setValue, setpointKey } = this._resolveSetpoint(room, itemKey);

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
        }

        if (items.length === 0) continue;

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

    async updateView() {
      try {
        const config = this.getConfig(this.dID);
        if (!config || Object.keys(config).length === 0) {
          logger.error('[MainBody] - updateView - конфигурация недоступна');
          this.groupedView = [];
          return;
        }

        this.groupedView = this.getAllData(config);
        logger.dev('[MainBody] - updateView - групп:', this.groupedView.length,
          'карточек:', this.groupedView.reduce((s, g) => s + g.items.length, 0));
        localStorage.setItem('groupedView', JSON.stringify(this.groupedView));
      } catch (error) {
        logger.error('[MainBody] - updateView - Ошибка:', error);
        this.groupedView = [];
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
              setpointKey: item.setpointKey,
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

      const settingsType = this.typeSettingsKey || 'schedule';
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

<style lang="css" src="@/assets/mainStyle.css"></style>

<style scoped>
.room-group { margin-bottom: 1.5em; }
.room-group-header {
  margin: 0 0 0.5em 0;
  font-size: 1.2em;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  padding-bottom: 0.25em;
}
.room-group-items { display: flex; flex-wrap: wrap; gap: 0.5em; }
.mainBody-empty { padding: 1em; opacity: 0.6; text-align: center; }
</style>