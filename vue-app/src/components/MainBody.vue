<!-- components/MainBody.vue -->
<template>
  <div v-if="showLoading" class="loading">Загрузка...</div>
  <div v-else-if="error" class="error">
    {{ error }}
    <button type="button" @click="retryLoad">Повторить</button>
  </div>
  <div v-else id="app_mainBody" class="mainBody">
    <!-- СЕКЦИЯ КАМЕРЫ (появляется, если сервер прислал videoSnapshot) -->
    <section v-if="hasSnapshot" class="room-group">
      <div class="room-group-header">
        <span class="room-group-title">Видеонаблюдение</span>
      </div>
      <div class="room-group-items">
        <CameraCard
          title="Камера 1"
          :imageSrc="videoImageSrc"
          timeUpdated="Обновлено сейчас"
          @click="openCamera"
        />
      </div>
    </section>
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
            v-for="item in group.items"
            :key="itemId(item)"
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
    <p v-else class="mainBody-empty">{{ currentTab.emptyText }}</p>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import MainBodyValue from './MainBodyValue.vue';
import CameraCard from './CameraCard.vue';
import logger from '../store/modules/logger.js';
import { parseMoscowDate } from '@/utils/timeUtils';
import { COMMON_KEY, DEFAULT_TAB, TAB_KEYS, getTab } from '@/utils/mainTabs';

const STRIP_DIGITS = /\d+$/;
const ROOM_KEY_RE = /^room\d+$/;
const DOUBLE_CLICK_DELAY = 300;
const CLOCK_TICK = 30 * 1000; // обновление подписей «N мин назад»

export default {
  name: 'MainBody',
  components: { MainBodyValue, CameraCard },
  emits: ['getComponentData', 'openCamera'],

  props: {
    // Активная вкладка главного экрана (см. utils/mainTabs.js)
    activeTab: {
      type: String,
      default: DEFAULT_TAB,
      validator: (value) => TAB_KEYS.includes(value),
    },
  },

  data() {
    return {
      selectedItem: null,
      doubleClickTimer: null,
      pendingItem: null,   // id элемента, ожидающего второго клика
      now: Date.now(),
      clockTimer: null,
    };
  },

  computed: {
    ...mapGetters('config', ['isLoading', 'error', 'getConfig', 'clearKeySync']),
    ...mapGetters('sortParams', ['getSensorTitle', 'getUnit']),
    ...mapGetters(['dID', 'typeSettingsKey', 'showSetpoint']),
    ...mapGetters('video', ['hasSnapshot', 'getSnapshot']),

    videoImageSrc() {
      if (!this.getSnapshot) return null;
      return `data:${this.getSnapshot.mimeType};base64,${this.getSnapshot.image}`;
    },

    currentTab() {
      return getTab(this.activeTab);
    },

    config() {
      return this.getConfig(this.dID);
    },

    hasConfig() {
      return !!this.config && Object.keys(this.config).length > 0;
    },

    // Пока конфиг не пришёл — «Загрузка…», а не пустое состояние
    showLoading() {
      return !this.error && (this.isLoading || !this.hasConfig);
    },

    // Зависит от конфига (WS-обновления отражаются сразу) и от «часов» this.now
    groupedView() {
      if (!this.hasConfig) return [];
      return this.getAllData(this.config, this.currentTab, this.now);
    },
  },

  watch: {
    showSetpoint(visible) {
      if (!visible && this.selectedItem) this.clearSelection();
    },
    activeTab() {
      this.clearSelection();
    },
  },

  mounted() {
    this.clockTimer = setInterval(() => { this.now = Date.now(); }, CLOCK_TICK);
  },

  beforeUnmount() {
    clearInterval(this.clockTimer);
    clearTimeout(this.doubleClickTimer);
  },

  methods: {
    ...mapActions('sortParams', ['setLimits']),
    ...mapActions(['updateSettingsData', 'updatePayloadData']),

    async retryLoad() {
      try {
        await this.$store.dispatch('config/initialize');
      } catch (e) {
        logger.error('[MainBody] - retryLoad - Ошибка:', e.message);
      }
    },

    // Уникальный идентификатор карточки (для key и сравнения выбора)
    itemId(item) {
      return `${item.roomKey}|${item.paramKey}|${item.setpointKey}`;
    },

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
     * Парная уставка по совпадению номера: dTemp02 → sTemp02.
     * Нет такой — карточка read-only.
     */
    _resolveSetpoint(room, sensorKey) {
      if (!room?.setpoints || !sensorKey) return { setValue: null, setpointKey: null };
      const num = (sensorKey.match(/(\d+)$/) || [])[1] || '';
      const base = 's' + sensorKey.slice(1).replace(STRIP_DIGITS, '');
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

    // null — «нет данных» (в карточке «—»). Раньше отсутствующее число становилось 0.0:
    // для датчика это ложное показание.
    getSensorValue(key, data) {
      if (!data) return null;
      const raw = data.value;

      switch (key) {
        case 'num': {
          if (raw === null || raw === undefined) return null;
          const num = parseFloat(raw);
          return Number.isNaN(num) ? null : num;
        }
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

    getTimeDiff(timestamp, now) {
      if (!timestamp) return 'Неизвестно';
      let time;
      if (typeof timestamp === 'number') {
        time = timestamp;
      } else if (typeof timestamp === 'string') {
        time = parseMoscowDate(timestamp);
        if (Number.isNaN(time)) time = new Date(timestamp).getTime();
      } else {
        return 'Неизвестно';
      }
      if (Number.isNaN(time)) return 'Неизвестно';

      const diff = Math.floor((now - time) / 60000);
      if (diff < 1) return 'сейчас';
      if (diff < 60) return `${diff} мин назад`;
      if (diff < 1440) return `${Math.floor(diff / 60)} ч назад`;
      return `${Math.floor(diff / 1440)} дн назад`;
    },

    getAllData(config, tab, now) {
      return tab.common
        ? this._getCommonData(config, tab, now)
        : this._getRoomData(config, tab, now);
    },

    // Вкладка «Общие настройки»: корневой объект common, одна группа
    _getCommonData(config, tab, now) {
      const common = config[COMMON_KEY];
      if (!common || typeof common !== 'object') return [];

      const items = [];
      for (const sectionKey of tab.sections) {
        items.push(...this._collectItems(COMMON_KEY, common, sectionKey, false, now));
      }
      if (!items.length) return [];

      return [{
        roomKey: COMMON_KEY,
        header: common.group || common.title || 'Общие настройки',
        roomId: common.id,
        items,
      }];
    },

    // Вкладки по комнатам (roomNN)
    _getRoomData(config, tab, now) {
      const groups = [];

      for (const [roomKey, room] of Object.entries(config)) {
        if (!ROOM_KEY_RE.test(roomKey)) continue;
        if (!room || typeof room !== 'object') continue;

        const items = [];
        for (const sectionKey of tab.sections) {
          items.push(...this._collectItems(roomKey, room, sectionKey, tab.withSetpoint, now));
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

    _collectItems(roomKey, room, sectionKey, withSetpoint, now) {
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
          timeDiff: this.getTimeDiff(itemData?.lastUpdate, now),
          roomTitle: room.title,
          roomGroup: room.group,
          roomId: room.id,
          roomKey,
        }));
      }
      return items;
    },

    openCamera() {
      // Отправляем событие наверх в MainView для открытия полноэкранного режима
      this.$emit('openCamera', {
        title: 'Камера 1', // Название камеры (можно вынести в настройки)
        // Время последнего обновления (можно взять из getSnapshot.timestamp, но пока оставим статику или текущее время)
        timeUpdated: 'Только что', 
      });
    },


    // Сравнение по ключу, а не по ссылке: groupedView пересобирается при каждом обновлении
    isSelected(item) {
      return !!this.selectedItem && this.itemId(this.selectedItem) === this.itemId(item);
    },

    selectItem(item) {
      const id = this.itemId(item);

      if (this.doubleClickTimer && this.pendingItem === id) {
        clearTimeout(this.doubleClickTimer);
        this.doubleClickTimer = null;
        this.pendingItem = null;
        this.DclickSelectItem(item);
        return;
      }

      this.pendingItem = id;
      clearTimeout(this.doubleClickTimer);
      this.doubleClickTimer = setTimeout(() => {
        this.doubleClickTimer = null;
        this.pendingItem = null;
        this.singleClickAction(item);
      }, DOUBLE_CLICK_DELAY);
    },

    singleClickAction(item) {
      const clearParam = this.clearKeySync(item.paramKey);

      // Карточка без уставки (датчик, «Состояние устройств», «Общие настройки») — только для чтения:
      // не выбираем её и не трогаем payload (иначе в payload.room попадал бы ключ 'common').
      if (!item.setpointKey || item.setValue === undefined || item.setValue === null || !clearParam) {
        logger.dev('[MainBody] - singleClickAction - карточка без уставки:', item.paramKey);
        return;
      }

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
          // Данные для SetpointScreen
          roomTitle: item.roomGroup || item.roomTitle,
          paramTitle: item.paramTitle,
          actualValue: item.value,
          unit: item.unit,
        },
      });

      this.updateSettingsData({ field: 'request', value: 'setpoints' });
    },

    DclickSelectItem(item) {
      const clearParam = this.clearKeySync(item.paramKey);

      const roomConfig = this.config[item.roomKey];
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

      const settingsType = this.typeSettingsKey || 'schedules';

      this.updatePayloadData({
        param: item.paramKey,
        key: clearParam,
        room: item.roomKey,
        config: settingsType,
        value: item.setValue,
      });

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
      clearTimeout(this.doubleClickTimer);
      this.doubleClickTimer = null;
      this.pendingItem = null;
    },
  },
};
</script>
