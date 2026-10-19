<!-- ConFiguration.vue — Страница создания конфигурации системы -->
<template>
  <div class="app">

    <!-- SVG-спрайт -->
    <svg display="none">
      <symbol id="cfg-homeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </symbol>
      <symbol id="cfg-menuIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6"  x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </symbol>
      <symbol id="cfg-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </symbol>
      <symbol id="cfg-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </symbol>
    </svg>

    <!-- ── ХИДЕР ── -->
    <header class="header">
      <div class="header-top">
        <div class="icon" @click="goHome">
          <svg width="24" height="24" viewBox="0 0 24 24"><use href="#cfg-homeIcon"/></svg>
        </div>
        <div style="display:flex; justify-content:center; flex:1;">
          <span class="cfg-header-title">Выбор конфигурации</span>
        </div>
        <div class="icon" @click="openMenu">
          <svg width="24" height="24" viewBox="0 0 24 24"><use href="#cfg-menuIcon"/></svg>
        </div>
      </div>
      <p style="width:100%; height:1px; background-color:var(--orange); margin:0;"></p>
    </header>

    <!-- ── ТЕЛО ── -->
    <div class="body">
      <div class="cfg-content">
        <!-- ═══ ШАГ 1: Настройка конфигурации ═══ -->
        <section class="cfg-section">
          <div class="cfg-section-header cfg-section-header--clickable" @click="toggleConfigSection">
            <span class="cfg-step-badge">{{ roomCount }}</span>
            <span class="cfg-section-title">Настройка конфигурации</span>
            <svg class="cfg-chevron-icon" :class="{ 'cfg-chevron-icon--open': configSectionExpanded }" width="20" height="20" viewBox="0 0 24 24">
              <use href="#cfg-chevron"/>
            </svg>
          </div>

          <div v-if="configSectionExpanded" class="cfg-section-body">
            <div class="settings-row">
              <span class="cfg-label">Имя конфигурации:</span>
              <input
                class="cfg-input"
                type="text"
                v-model="userConfigID"
                :placeholder="generatedConfigName"
                @input="saveToLocalStorage"
              />
            </div>

            <div class="settings-row">
              <span class="cfg-label">Количество комнат:</span>
              <select class="cfg-select" v-model="roomCount" @change="onRoomCountChange">
                <option v-for="n in roomsSetNum" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
            <button class="cfg-btn-next" @click="applyRoomCount">Выбрать →</button>
          </div>
        </section>

        <!-- ═══ ШАГ 2: Комнаты ═══ -->
        <template v-if="roomsVisible">
          <div class="cfg-collapse-all">
            <button class="cfg-btn-link" @click="toggleAllRooms">
              {{ allRoomsExpanded ? 'Свернуть все комнаты' : 'Развернуть все комнаты' }}
            </button>
          </div>

          <section
            v-for="(room, idx) in normalizedRooms"
            :key="idx"
            class="cfg-section cfg-room-section"
          >
            <div class="cfg-section-header cfg-section-header--clickable" @click="toggleRoom(idx)">
              <span class="cfg-step-badge cfg-step-badge--room">{{ idx + 1 }}</span>
              <span class="cfg-section-title">{{ room.name || 'Комната ' + (idx + 1) }}</span>
              <svg class="cfg-chevron-icon" :class="{ 'cfg-chevron-icon--open': room.expanded }" width="20" height="20" viewBox="0 0 24 24">
                <use href="#cfg-chevron"/>
              </svg>
            </div>

            <div v-if="room.expanded" class="cfg-section-body">
              <div class="settings-row">
                <span class="cfg-label">Название:</span>
                <input
                  class="cfg-input"
                  type="text"
                  v-model="room.name"
                  :placeholder="'Комната ' + (idx + 1)"
                  @input="saveToLocalStorage"
                />
                <span class="cfg-label">Группа:</span>
                <input
                  class="cfg-input"
                  type="text"
                  v-model="room.groop"
                  :placeholder="'общая'"
                  @click="cycleGroup(idx)"
                  @input="saveToLocalStorage"
                />
              </div>

              <p class="cfg-subtitle">Контроль (датчики)</p>

              <div class="settings-row" v-for="sensor in roomSensorDefs" :key="sensor.key">
                <label class="cfg-checkbox-label">
                  <span
                    class="checkbox-custom"
                    :class="{ checked: room.sensors[sensor.key].enabled }"
                    @click="toggleFeature(room.sensors[sensor.key])"
                  >
                    <svg v-if="room.sensors[sensor.key].enabled" width="16" height="16" viewBox="0 0 24 24"><use href="#cfg-check"/></svg>
                  </span>
                  <span>{{ sensor.label }}</span>
                </label>
                <select
                  v-if="room.sensors[sensor.key].enabled"
                  class="cfg-select cfg-select--sm"
                  v-model="room.sensors[sensor.key].count"
                  @change="saveToLocalStorage"
                >
                  <option v-for="n in sensor.max" :key="n" :value="n">{{ n }}</option>
                </select>
              </div>

              <p class="cfg-subtitle">Управление (устройства)</p>

              <div class="cfg-device-block">
                <div class="settings-row">
                  <label class="cfg-checkbox-label">
                    <span class="checkbox-custom" :class="{ checked: room.devices.tempControl.enabled }" @click="toggleFeature(room.devices.tempControl)">
                      <svg v-if="room.devices.tempControl.enabled" width="16" height="16" viewBox="0 0 24 24"><use href="#cfg-check"/></svg>
                    </span>
                    <span>Управление температурой</span>
                  </label>
                  <span v-if="room.devices.tempControl.enabled" class="cfg-device-count">
                    {{ tempControlCount(room) }} уст.
                  </span>
                </div>
                <div v-if="room.devices.tempControl.enabled" class="cfg-submenu">
                  <div v-for="sub in tempSubDefs" :key="sub.key" class="settings-row">
                    <label class="cfg-checkbox-label cfg-checkbox-label--sub">
                      <span class="checkbox-custom checkbox-custom--sub" :class="{ checked: room.devices.tempControl[sub.key] }" @click="room.devices.tempControl[sub.key] = !room.devices.tempControl[sub.key]; saveToLocalStorage()">
                        <svg v-if="room.devices.tempControl[sub.key]" width="16" height="16" viewBox="0 0 24 24"><use href="#cfg-check"/></svg>
                      </span>
                      <span>{{ sub.label }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="cfg-device-block">
                <div class="settings-row">
                  <label class="cfg-checkbox-label">
                    <span class="checkbox-custom" :class="{ checked: room.devices.humControl.enabled }" @click="toggleFeature(room.devices.humControl)">
                      <svg v-if="room.devices.humControl.enabled" width="16" height="16" viewBox="0 0 24 24"><use href="#cfg-check"/></svg>
                    </span>
                    <span>Управление влажностью</span>
                  </label>
                  <span v-if="room.devices.humControl.enabled" class="cfg-device-count">
                    {{ humControlCount(room) }} уст.
                  </span>
                </div>
                <div v-if="room.devices.humControl.enabled" class="cfg-submenu">
                  <div v-for="sub in humSubDefs" :key="sub.key" class="settings-row">
                    <label class="cfg-checkbox-label cfg-checkbox-label--sub">
                      <span class="checkbox-custom checkbox-custom--sub" :class="{ checked: room.devices.humControl[sub.key] }" @click="room.devices.humControl[sub.key] = !room.devices.humControl[sub.key]; saveToLocalStorage()">
                        <svg v-if="room.devices.humControl[sub.key]" width="16" height="16" viewBox="0 0 24 24"><use href="#cfg-check"/></svg>
                      </span>
                      <span>{{ sub.label }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <button class="cfg-btn-next" @click="nextRoom(idx)"> Далее  </button>
            </div>
          </section>
        </template>

        <!-- ═══ ОБЩАЯ КОНФИГУРАЦИЯ ═══ -->
        <section v-if="showGeneral" class="cfg-section cfg-section--general">
          <div class="cfg-section-header cfg-section-header--clickable" @click="generalExpanded = !generalExpanded">
            <span class="cfg-step-badge cfg-step-badge--star">★</span>
            <span class="cfg-section-title">Общая конфигурация</span>
            <svg class="cfg-chevron-icon" :class="{ 'cfg-chevron-icon--open': generalExpanded }" width="20" height="20" viewBox="0 0 24 24">
              <use href="#cfg-chevron"/>
            </svg>
          </div>

          <div v-if="generalExpanded" class="cfg-section-body">
            <div class="settings-row" v-for="item in generalDefs" :key="item.key">
              <label class="cfg-checkbox-label">
                <span class="checkbox-custom" :class="{ checked: general[item.key].enabled }" @click="toggleFeature(general[item.key])">
                  <svg v-if="general[item.key].enabled" width="16" height="16" viewBox="0 0 24 24"><use href="#cfg-check"/></svg>
                </span>
                <span>{{ item.label }}</span>
              </label>
              <select v-if="general[item.key].enabled" class="cfg-select cfg-select--sm" v-model="general[item.key].count" @change="saveToLocalStorage">
                <option v-for="n in item.max" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
          </div>
        </section>

        <!-- ═══ КНОПКА ЗАВЕРШИТЬ ═══ -->
        <button
          v-if="roomsVisible"
          class="cfg-btn-finish"
          :class="{ 'cfg-btn-finish--edit': configSent }"
          @click="finishConfiguration"
        >
          {{ configSent ? '✎ Сохранить изменения' : '✓ Завершить и сохранить' }}
        </button>
      </div>
    </div>

    <footer class="footer"></footer>
  </div>
</template>

<script>
import logger from '@/store/modules/logger.js';
import { mapActions } from 'vuex';
import { nowMoscow } from '@/utils/timeUtils';

const STORAGE_KEY = 'cfg_configuration';

// ── Определения полей ──────────────────────────────────────────────────────
const ROOM_SENSOR_DEFS = [
  { key: 'dTemp', label: 'Контроль температуры',                       max: 4 },
  { key: 'dHum',  label: 'Контроль влажности',                         max: 4 },
  { key: 'dMove', label: 'Контроль доступа (датчик движения)',         max: 5 },
  { key: 'dDoor', label: 'Контроль проникновения (датчик двери/окна)', max: 8 },
  { key: 'dCo',   label: 'Контроль CO (угарный газ)',                  max: 3 },
  { key: 'dLeak', label: 'Контроль протечек воды',                     max: 3 },
];

const TEMP_SUB_DEFS = [
  { key: 'aSwitch',     label: 'Реле (электронагреватель)' },
  { key: 'aThermostat', label: 'Термостат (радиатор отопления)' },
  { key: 'aIR',         label: 'ИК-порт (кондиционер)' },
];

const HUM_SUB_DEFS = [
  { key: 'aSwitch', label: 'Реле' },
  { key: 'aIR',     label: 'ИК-порт' },
];

const GENERAL_DEFS = [
  { key: 'heatingTemp', label: 'Контроль температуры системы отопления', max: 3 },
  { key: 'outsideTemp', label: 'Контроль наружней температуры',          max: 3 },
  { key: 'power',       label: 'Контроль электропитания',                max: 2 },
  { key: 'siren',       label: 'Звуковая сирена',                        max: 3 },
];

function makeRoom(idx) {
  return {
    name: `Комната ${idx + 1}`,
    expanded: true,
    init: {
      dID: '',
      limits: {
        Default:  { high: 30, low: 4, step: 1 },
        Bool:     { high: true, low: false, step: 1 },
        Actuator: { high: 100, low: 0, step: 0.1 },
        Temp:     { high: 36, low: 8, step: 0.25 },
        Hum:      { high: 60, low: 12, step: 0.5 },
        Switch:   { high: 1, low: 0, step: 1 },
        hours:    { high: 23, low: 0, step: 1 },
        minutes:  { high: 59, low: 0, step: 1 },
      },
      title: '',
    },
    sensors: {
      dTemp: { enabled: false, count: 1 },
      dHum:  { enabled: false, count: 1 },
      dMove: { enabled: false, count: 1 },
      dDoor: { enabled: false, count: 1 },
      dCo:   { enabled: false, count: 1 },
      dLeak: { enabled: false, count: 1 },
    },
    devices: {
      tempControl: { enabled: false, aSwitch: false, aThermostat: false, aIR: false },
      humControl:  { enabled: false, aSwitch: false, aIR: false },
    },
    setpoints: {},
    batteries: {},
  };
}

function makeGeneral() {
  return {
    heatingTemp: { enabled: false, count: 1 },
    outsideTemp: { enabled: false, count: 1 },
    power:       { enabled: false, count: 1 },
    siren:       { enabled: false, count: 1 },
  };
}

export default {
  name: 'ConFiguration',

  data() {
    return {
      roomsSetNum: parseInt(process.env.VUE_APP_NEW_CONFIG_ROOM_SET) || 20,
      roomCount: 1,
      roomsVisible: false,
      rooms: [],
      showGeneral: false,
      generalExpanded: true,
      general: makeGeneral(),
      configSent: false,
      userConfigID: '',
      configSectionExpanded: true,

      roomSensorDefs: ROOM_SENSOR_DEFS,
      tempSubDefs: TEMP_SUB_DEFS,
      humSubDefs: HUM_SUB_DEFS,
      generalDefs: GENERAL_DEFS,
    };
  },

  computed: {
    normalizedRooms() {
      return this.rooms.map((room, idx) => {
        if (!room || typeof room !== 'object') room = makeRoom(idx);
        const result = room;
        if (!result.name) result.name = `Комната ${idx + 1}`;
        if (result.expanded === undefined) result.expanded = (idx === 0);

        if (!result.sensors) result.sensors = {};
        ROOM_SENSOR_DEFS.forEach(def => {
          if (!result.sensors[def.key]) {
            result.sensors[def.key] = { enabled: false, count: 1 };
          } else {
            if (result.sensors[def.key].enabled === undefined) result.sensors[def.key].enabled = false;
            if (result.sensors[def.key].count === undefined) result.sensors[def.key].count = 1;
          }
        });

        if (!result.devices) {
          result.devices = {
            tempControl: { enabled: false, aSwitch: false, aThermostat: false, aIR: false },
            humControl:  { enabled: false, aSwitch: false, aIR: false },
          };
        } else {
          if (!result.devices.tempControl) {
            result.devices.tempControl = { enabled: false, aSwitch: false, aThermostat: false, aIR: false };
          } else {
            ['enabled', 'aSwitch', 'aThermostat', 'aIR'].forEach(key => {
              if (result.devices.tempControl[key] === undefined) result.devices.tempControl[key] = false;
            });
          }
          if (!result.devices.humControl) {
            result.devices.humControl = { enabled: false, aSwitch: false, aIR: false };
          } else {
            ['enabled', 'aSwitch', 'aIR'].forEach(key => {
              if (result.devices.humControl[key] === undefined) result.devices.humControl[key] = false;
            });
          }
        }

        if (!result.init) result.init = {};
        if (!result.setpoints) result.setpoints = {};
        if (!result.batteries) result.batteries = {};
        return result;
      });
    },

    allRoomsExpanded() {
      return this.normalizedRooms.length > 0 && this.normalizedRooms.every(r => r.expanded);
    },

    dateStr() {
      const now = new Date();
      return now.getFullYear()
        + String(now.getMonth() + 1).padStart(2, '0')
        + String(now.getDate()).padStart(2, '0')
        + '_'
        + String(now.getHours()).padStart(2, '0')
        + String(now.getMinutes()).padStart(2, '0')
        + String(now.getSeconds()).padStart(2, '0');
    },

    // ✅ Добавлено: используется в шаблоне как :placeholder
    generatedConfigName() {
      const base = (this.userConfigID || 'newConfig')
        .trim()
        .replace(/\s+/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '') || 'newConfig';
      return `${base}_${this.dateStr}`;
    },
  },

  mounted() {
    logger.info('[ConFiguration] - mounted - Загрузка компонента');
    this.loadFromLocalStorage();
  },

  methods: {
    ...mapActions('dropdown', ['show']),

    goHome() {
      logger.info('[ConFiguration] - goHome - Переход на главную');
      this.$router.push('/');
    },

    openMenu(event) {
      event.stopPropagation();
      this.show({
        items: [
          { label: 'Профиль', action: 'profile' },
          { label: 'Выйти',   action: 'logout'  },
        ],
        anchorElement: event.currentTarget,
      });
    },

    cycleGroup(idx) {
      const currentRoom = this.rooms[idx];
      if (!currentRoom) return;

      const groups = new Set();
      this.rooms.forEach(r => {
        if (r.groop && r.groop.trim() !== '') groups.add(r.groop.trim());
      });
      if (groups.size === 0) return;

      const groupsArray = Array.from(groups);
      const currentGroup = currentRoom.groop ? currentRoom.groop.trim() : '';
      const currentIndex = groupsArray.indexOf(currentGroup);

      const nextGroup = currentIndex === -1
        ? groupsArray[0]
        : groupsArray[(currentIndex + 1) % groupsArray.length];

      currentRoom.groop = nextGroup;
      this.saveToLocalStorage();
    },

    onRoomCountChange() {},

    applyRoomCount() {
      const n = this.roomCount;
      const current = this.rooms.length;
      if (n > current) {
        for (let i = current; i < n; i++) this.rooms.push(makeRoom(i));
      } else if (n < current) {
        this.rooms.splice(n);
      }
      this.roomsVisible = true;
      this.rooms.forEach((r, i) => { r.expanded = (i === 0); });
      this.saveToLocalStorage();
      logger.info('[ConFiguration] - applyRoomCount - Применено комнат:', n);
    },

    toggleConfigSection() {
      this.configSectionExpanded = !this.configSectionExpanded;
      this.saveToLocalStorage();
    },

    toggleRoom(idx) {
      this.rooms[idx].expanded = !this.rooms[idx].expanded;
      this.saveToLocalStorage();
    },

    toggleAllRooms() {
      const expand = !this.allRoomsExpanded;
      this.rooms.forEach(r => { r.expanded = expand; });
    },

    nextRoom(idx) {
      this.rooms[idx].expanded = false;
      if (idx + 1 < this.rooms.length) {
        this.rooms[idx + 1].expanded = true;
        this.saveToLocalStorage();
        this.$nextTick(() => {
          const sections = this.$el.querySelectorAll('.cfg-room-section');
          if (sections[idx + 1]) sections[idx + 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } else {
        this.showGeneral = true;
        this.saveToLocalStorage();
        this.$nextTick(() => {
          const general = this.$el.querySelector('.cfg-section--general');
          if (general) general.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    },

    toggleFeature(feature) {
      if (!feature) return;
      feature.enabled = !feature.enabled;
      this.saveToLocalStorage();
    },

    tempControlCount(room) {
      if (!room?.devices?.tempControl) return 0;
      const d = room.devices.tempControl;
      return (d.aSwitch ? 1 : 0) + (d.aThermostat ? 1 : 0) + (d.aIR ? 1 : 0);
    },

    humControlCount(room) {
      if (!room?.devices?.humControl) return 0;
      const d = room.devices.humControl;
      return (d.aSwitch ? 1 : 0) + (d.aIR ? 1 : 0);
    },

    async finishConfiguration() {
      const configData = this.buildConfigJson();
      this.saveToLocalStorage();

      logger.info('[ConFiguration] - finishConfiguration - configSent:', this.configSent);
      console.log('[ConFiguration] - finishConfiguration - config:', configData);

      try {
        // Fire-and-forget отправка на сервер (не блокирует создание локально)
        this.$store.dispatch('config/userConfigRequest', {
          configData,
          isEdit: this.configSent,
        }).catch(err => {
          logger.warn('[ConFiguration] - Ошибка отправки конфигурации на сервер:', err);
          this.$store.dispatch('popup/show', {
            message: 'Конфигурация сохранена локально, но не отправлена на сервер.',
            type: 'warning',
            duration: 4000,
          });
        });

        const currentDID = this.$store.getters.dID;
        const configName = configData.newConfigID;
        const isNew = !this.configSent || (currentDID !== configName);

        if (isNew) {
          const password = this.userConfigID || 'newConfig';

          localStorage.setItem(`${configName}_config`, JSON.stringify(configData));
          this.$store.commit('config/SET_CONFIG', { name: configName, config: configData });

          await this.$store.dispatch('config/handleRoomsSet', configData);
          await this.$store.dispatch('config/handleParamsSet', configData);
          await this.$store.dispatch('config/handleDevicesSet', configData);
          await this.$store.dispatch('config/handleSetpointsSet', configData);

          // ✅ Defensive: пробуем auth/localLogin, если action нет — ручной commit
          try {
            await this.$store.dispatch('auth/localLogin', {
              dID: configName,
              password,
              level: 1,
            });
          } catch (e) {
            logger.warn('[ConFiguration] - auth/localLogin недоступен, локальный fallback:', e?.message || e);
            const userData = { username: configName, userlevel: 1, dID: configName };
            const session = {
              token: 'local-token',
              user: userData,
              dID: configName,
              level: 1,
              mustChangePassword: false,
            };
            localStorage.setItem('authSession', JSON.stringify(session));
            this.$store.commit('auth/AUTH_SUCCESS', {
              token: 'local-token',
              user: userData,
              dID: configName,
              level: 1,
              mustChangePassword: false,
            });
          }

          this.configSent = true;
          this.saveToLocalStorage();

          this.$store.dispatch('popup/show', {
            message: `Конфигурация "${configName}" создана. Выполнен вход.`,
            type: 'success',
            duration: 3000,
          });
        } else {
          localStorage.setItem(`${currentDID}_config`, JSON.stringify(configData));
          this.$store.commit('config/SET_CONFIG', { name: currentDID, config: configData });
          await this.$store.dispatch('config/handleRoomsSet', configData);
          await this.$store.dispatch('config/handleParamsSet', configData);
          await this.$store.dispatch('config/handleDevicesSet', configData);
          await this.$store.dispatch('config/handleSetpointsSet', configData);

          this.$store.dispatch('popup/show', {
            message: 'Конфигурация обновлена',
            type: 'success',
            duration: 3000,
          });
        }

        // ✅ Исправлено: '/' вместо '/dashboard'
        this.$router.push('/');
      } catch (err) {
        logger.error('[ConFiguration] - finishConfiguration - Ошибка:', err);
        this.$store.dispatch('popup/show', {
          message: 'Ошибка сохранения конфигурации. Данные сохранены локально.',
          type: 'error',
          duration: 4000,
        });
      }
    },

    buildConfigJson() {
      const counters = {
        dTemp: 0, dHum: 0, dMove: 0, dDoor: 0, dCo: 0, dLeak: 0,
        aSwitch: 0, aThermostat: 0, aIR: 0,
        sTemp: 0, sHum: 0, sSwitchT: 0, sSwitchH: 0,
      };
      const normRooms = this.normalizedRooms;

      let baseName = this.userConfigID ? this.userConfigID.trim() : '';
      baseName = baseName.replace(/\s+/g, '');
      baseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!baseName) baseName = 'newConfig';
      const configName = baseName + '_' + this.dateStr;

      const result = {
        newConfigID: configName,
        password: this.userConfigID || 'newConfig',
        init: {
          dID: '',
          limits: {
            Default:  { high: 30, low: 4, step: 1 },
            Bool:     { high: true, low: false, step: 1 },
            Actuator: { high: 100, low: 0, step: 0.1 },
            Temp:     { high: 36, low: 8, step: 0.25 },
            Hum:      { high: 60, low: 12, step: 0.5 },
            Switch:   { high: 1, low: 0, step: 1 },
            hours:    { high: 23, low: 0, step: 1 },
            minutes:  { high: 59, low: 0, step: 1 },
          },
          title: '',
        },
      };

      result.room00 = {
        group: '', id: 0, title: 'Общие настройки',
        sensors: {}, powers: {}, manages: {}, setpoints: {}, batteries: {},
      };

      let roomTempCount = 0;
      let roomHumCount = 0;

      normRooms.forEach((room, idx) => {
        const roomKey = `room${String(idx + 1).padStart(2, '0')}`;
        roomTempCount = 0;
        roomHumCount = 0;

        const roomObj = {
          group: room.groop || '',
          id: idx + 1,
          title: room.name || `Комната ${idx + 1}`,
          sensors: {}, manages: {}, setpoints: {}, batteries: {},
        };

        // Датчики
        ROOM_SENSOR_DEFS.forEach(def => {
          const sensorData = room.sensors[def.key];
          if (sensorData?.enabled) {
            const count = sensorData.count || 1;
            for (let i = 0; i < count; i++) {
              counters[def.key] += 1;
              const sensorId = def.key + String(counters[def.key]).padStart(2, '0');
              let type = 'num';
              let value = 18;
              const lastUpdate = nowMoscow();
              if (['dMove', 'dDoor', 'dLeak'].includes(def.key)) { type = 'bool'; value = true; }
              if (def.key === 'dCo') { type = null; value = 30; }
              roomObj.sensors[sensorId] = {
                sensorID: null, value, type, lastUpdate,
              };
              if (def.key === 'dTemp') roomTempCount++;
              if (def.key === 'dHum') roomHumCount++;
            }
          }
        });

        // Управление температурой
        let hasTempManage = false;
        let hasTempSwitch = false;

        if (room.devices.tempControl?.enabled) {
          hasTempManage = true;
          roomObj.tempManage = {};
          const temp = room.devices.tempControl;

          if (!(temp.aSwitch || temp.aThermostat || temp.aIR)) temp.aSwitch = true;

          if (temp.aSwitch) {
            hasTempSwitch = true;
            counters.aSwitch += 1;
            roomObj.tempManage['aSwitch' + String(counters.aSwitch).padStart(2, '0')] = {
              sensorID: null, value: null, type: 'bool', lastUpdate: null,
            };
          }
          if (temp.aThermostat) {
            counters.aThermostat += 1;
            roomObj.tempManage['aThermostat' + String(counters.aThermostat).padStart(2, '0')] = {
              sensorID: null, value: null, type: null, lastUpdate: null,
            };
          }
          if (temp.aIR) {
            counters.aIR += 1;
            roomObj.tempManage['aIR' + String(counters.aIR).padStart(2, '0')] = {
              sensorID: null, value: null, type: null, lastUpdate: null,
            };
          }
        }

        // Уставки температуры
        if (hasTempManage && roomTempCount > 0) {
          counters.sTemp += 1;
          const setpointId = 'sTemp' + String(counters.sTemp).padStart(2, '0');
          roomObj.setpoints[setpointId] = {
            sensorID: null, value: 22, type: 'num', lastUpdate: null,
            limits: { high: 36, low: 8, step: 0.25 },
          };

          if (hasTempSwitch) {
            counters.sSwitchT += 1;
            const manageId = 'sSwitchT' + String(counters.sSwitchT).padStart(2, '0');
            roomObj.manages[manageId] = {
              sensorID: null, value: 0, type: 'bool', lastUpdate: null,
            };
          }
        }

        // Управление влажностью
        let hasHumManage = false;
        let hasHumSwitch = false;

        if (room.devices.humControl?.enabled) {
          hasHumManage = true;
          roomObj.humManage = {};
          const hum = room.devices.humControl;

          if (!(hum.aSwitch || hum.aIR)) hum.aSwitch = true;

          if (hum.aSwitch) {
            hasHumSwitch = true;
            counters.aSwitch += 1;
            roomObj.humManage['aSwitch' + String(counters.aSwitch).padStart(2, '0')] = {
              sensorID: null, value: null, type: 'bool', lastUpdate: null,
            };
          }
          if (hum.aIR) {
            counters.aIR += 1;
            roomObj.humManage['aIR' + String(counters.aIR).padStart(2, '0')] = {
              sensorID: null, value: null, type: null, lastUpdate: null,
            };
          }
        }

        // Уставки влажности
        if (hasHumManage && roomHumCount > 0) {
          counters.sHum += 1;
          const setpointId = 'sHum' + String(counters.sHum).padStart(2, '0');
          roomObj.setpoints[setpointId] = {
            sensorID: null, value: 45, type: 'num', lastUpdate: null,
            limits: { high: 60, low: 12, step: 0.5 },
          };

          if (hasHumSwitch) {
            counters.sSwitchH += 1;
            const manageId = 'sSwitchH' + String(counters.sSwitchH).padStart(2, '0');
            roomObj.manages[manageId] = {
              sensorID: null, value: 0, type: 'bool', lastUpdate: null,
            };
          }
        }

        result[roomKey] = roomObj;
      });

      return result;
    },

    saveToLocalStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          roomCount:    this.roomCount,
          roomsVisible: this.roomsVisible,
          rooms:        this.rooms,
          showGeneral:  this.showGeneral,
          general:      this.general,
          configSent:   this.configSent,
          userConfigID: this.userConfigID,
        }));
      } catch (e) {
        logger.error('[ConFiguration] - saveToLocalStorage - Ошибка:', e);
      }
    },

    loadFromLocalStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        this.roomCount    = data.roomCount    ?? 1;
        this.roomsVisible = data.roomsVisible ?? false;
        this.rooms        = data.rooms        ?? [];
        this.showGeneral  = data.showGeneral  ?? false;
        this.general      = data.general      ?? makeGeneral();
        this.configSent   = data.configSent   ?? false;
        this.userConfigID = data.userConfigID ?? 'newConfig';
        logger.info('[ConFiguration] - loadFromLocalStorage - configSent:', this.configSent);
      } catch (e) {
        logger.error('[ConFiguration] - loadFromLocalStorage - Ошибка:', e);
      }
    },
  },
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>