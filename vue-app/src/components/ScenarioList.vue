<!-- components/ScenarioList.vue -->
<!-- Экран «Сценарии» (/scenarios, уровень 2): список сценариев dID с кратким описанием,
     включение/выключение (action 'enable'), новый сценарий из шаблона (→ /scenarios/new?template=…),
     общие параметры (action 'settings'). Данные — scenarios/request при открытии; после любой
     правки сервер сам присылает весь набор всем вкладкам dID. Выполняет сценарии Node-RED. -->
<template>
  <div class="scenario-page">
    <div class="scenario-toolbar">
      <h3>Сценарии</h3>
      <button type="button" class="notification-chip" :class="{ active: showTemplates }" data-test="new" @click="showTemplates = !showTemplates">
        + Новый
      </button>
    </div>

    <!-- Шаблоны -->
    <section v-if="showTemplates" class="settings-group scenario-section" data-test="templates">
      <h3 class="settings-group-title">С чего начать</h3>
      <div class="scenario-templates">
        <button
          v-for="t in templates"
          :key="t.key"
          type="button"
          class="scenario-template"
          :data-test="`template-${t.key}`"
          @click="create(t.key)"
        >
          <span class="scenario-template-title">{{ t.title }}</span>
          <span class="notification-hint">{{ t.hint }}</span>
        </button>
      </div>
    </section>

    <p v-if="!loaded" class="notification-hint">Загрузка…</p>
    <p v-else-if="!list.length" class="notification-hint" data-test="empty">
      Сценариев пока нет. Нажмите «+ Новый» и выберите шаблон.
    </p>

    <!-- Список -->
    <div
      v-for="sc in list"
      :key="sc.id"
      class="settings-group scenario-card"
      :class="{ 'scenario-card--off': sc.enabled === false }"
      role="button"
      tabindex="0"
      :data-test="`scenario-${sc.id}`"
      @click="open(sc.id)"
      @keydown.enter="open(sc.id)"
    >
      <div class="scenario-card-head">
        <span class="scenario-card-title">{{ sc.title }}</span>
        <span v-if="sc.mode === 'test'" class="scenario-badge scenario-badge--test">Тест</span>
        <span v-if="(sc.priority ?? 50) >= 90" class="scenario-badge scenario-badge--protect">Защита</span>
        <label class="notification-switch scenario-card-switch" @click.stop>
          <input
            type="checkbox"
            :checked="sc.enabled !== false"
            :disabled="busy === sc.id"
            :aria-label="`Сценарий «${sc.title}» ${sc.enabled !== false ? 'включён' : 'выключен'}`"
            data-test="toggle"
            @change="toggle(sc, $event.target.checked)"
          />
          <span class="notification-switch-track" aria-hidden="true"></span>
        </label>
      </div>
      <p class="scenario-card-line"><b>Если</b> {{ describe(sc).when }}</p>
      <p class="scenario-card-line"><b>то:</b> {{ describe(sc).then.join('; ') || '—' }}</p>
      <p v-if="describe(sc).else.length" class="scenario-card-line"><b>иначе:</b> {{ describe(sc).else.join('; ') }}</p>
    </div>

    <!-- Общие параметры -->
    <section v-if="loaded" class="settings-group scenario-section">
      <h3 class="settings-group-title scenario-collapse" data-test="settings" @click="toggleSettings">
        Общие параметры {{ showSettings ? '▾' : '▸' }}
      </h3>
      <template v-if="showSettings && form">
        <div class="scenario-option">
          <span>Часовой пояс</span>
          <select v-model.number="form.tzOffsetMin" aria-label="Часовой пояс" data-test="tz">
            <option v-for="h in zones" :key="h" :value="h * 60">UTC{{ h >= 0 ? '+' : '−' }}{{ Math.abs(h) }}{{ h === 3 ? ' (Москва)' : '' }}</option>
          </select>
        </div>
        <div class="scenario-option">
          <span>Пауза сценариев после ручного управления</span>
          <DurationInput v-model="form.manualOverrideSec" :default-unit="60" label="Пауза после ручного управления" />
        </div>
        <div class="scenario-option">
          <span>Команд в один параметр в минуту, не больше</span>
          <input v-model.number="form.maxCommandsPerMin" type="number" min="1" max="60" step="1" aria-label="Команд в минуту" data-test="rate" />
        </div>
        <p v-if="settingsError" class="notification-error" role="alert">{{ settingsError }}</p>
        <button type="button" class="scenario-button scenario-button--primary" :disabled="busy === 'settings'" data-test="save-settings" @click="saveSettings">
          Сохранить параметры
        </button>
      </template>
    </section>

    <p class="notification-hint scenario-footnote">
      Сценарии выполняет Node-RED на объекте: они работают и без связи с сервером. Новый сценарий создаётся в режиме «Тест» —
      проверьте журнал Node-RED и переключите на «Работает».
    </p>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import DurationInput from './DurationInput.vue';
import { pointOptions, describeScenario } from '@/utils/scenarioModel';
import { TEMPLATES } from '@/utils/scenarioTemplates';
import logger from '@/store/modules/logger.js';

const ZONES = Array.from({ length: 27 }, (_, i) => i - 12); // UTC−12 … UTC+14

export default {
  name: 'ScenarioList',
  components: { DurationInput },
  emits: [],

  data() {
    return {
      showTemplates: false,
      showSettings: false,
      form: null,
      settingsError: '',
      busy: null,
      templates: TEMPLATES,
      zones: ZONES,
    };
  },

  computed: {
    ...mapGetters(['dID']),
    ...mapGetters('config', ['getConfig']),
    ...mapGetters('sortParams', ['getSensorTitle', 'getUnit']),
    ...mapGetters('scenarios', ['loaded', 'list', 'settings']),

    points() {
      return pointOptions(this.getConfig(this.dID), { titleOf: this.getSensorTitle, unitOf: this.getUnit });
    },
    descriptions() {
      return Object.fromEntries(this.list.map((sc) => [sc.id, describeScenario(sc, this.points)]));
    },
  },

  created() {
    this.$store.dispatch('scenarios/request').catch((e) => logger.warn('[ScenarioList] запрос сценариев:', e.message));
  },

  methods: {
    describe(sc) {
      return this.descriptions[sc.id] || { when: '—', then: [], else: [] };
    },
    open(id) {
      this.$router.push(`/scenarios/${encodeURIComponent(id)}`);
    },
    create(key) {
      this.$router.push({ path: '/scenarios/new', query: { template: key } });
    },

    async toggle(sc, enabled) {
      this.busy = sc.id;
      try {
        const r = await this.$store.dispatch('scenarios/save', { action: 'enable', configData: { id: sc.id, enabled } });
        if (r && r.delivered === 0) {
          this.$store.dispatch('popup/show', { message: 'Node-RED не подключён — изменение применится при подключении', type: 'warning', duration: 4000 });
        }
      } catch (e) {
        this.$store.dispatch('popup/show', { message: e.message, type: 'error', duration: 4000 });
      } finally {
        this.busy = null;
      }
    },

    toggleSettings() {
      this.showSettings = !this.showSettings;
      if (this.showSettings) {
        this.form = { ...this.settings };
        this.settingsError = '';
      }
    },
    async saveSettings() {
      const f = this.form;
      if (!Number.isInteger(f.maxCommandsPerMin) || f.maxCommandsPerMin < 1 || f.maxCommandsPerMin > 60) {
        this.settingsError = 'Команд в минуту — целое число от 1 до 60';
        return;
      }
      this.busy = 'settings';
      this.settingsError = '';
      try {
        await this.$store.dispatch('scenarios/save', {
          action: 'settings',
          configData: { tzOffsetMin: f.tzOffsetMin, manualOverrideSec: f.manualOverrideSec ?? 0, maxCommandsPerMin: f.maxCommandsPerMin },
        });
        this.$store.dispatch('popup/show', { message: 'Параметры сценариев сохранены', type: 'success', duration: 2000 });
      } catch (e) {
        this.settingsError = e.message;
      } finally {
        this.busy = null;
      }
    },
  },
};
</script>
