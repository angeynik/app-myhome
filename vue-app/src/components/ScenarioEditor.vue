<!-- components/ScenarioEditor.vue -->
<!-- Редактор сценария (маршруты /scenarios/new?template=<ключ> и /scenarios/:id, уровень 2).
     Новый сценарий — из шаблона (utils/scenarioTemplates.js) с подставленными точками конфигурации,
     в режиме «Тест». Черновик живёт в компоненте; «Сохранить» — create / edit, ответ сервера
     ждём (scenarios/save): ошибка показывается здесь же, экран не закрывается.
     delivered: 0 — Node-RED не подключён, сценарий применится при подключении (предупреждение).
     Формат — docs/scenarios.md. -->
<template>
  <div class="scenario-page">
    <div class="scenario-toolbar">
      <button type="button" class="notification-chip" data-test="back" @click="goBack">← Сценарии</button>
      <h3>{{ isNew ? 'Новый сценарий' : 'Сценарий' }}</h3>
    </div>
    <p v-if="leaveWarning" class="notification-hint warning" data-test="leave-warning">Изменения не сохранены. Нажмите «← Сценарии» ещё раз, чтобы выйти без сохранения.</p>

    <p v-if="!draft && !notFound" class="notification-hint">Загрузка…</p>
    <p v-else-if="notFound" class="notification-error" data-test="not-found">Сценарий не найден — возможно, его удалили.</p>

    <template v-else>
      <!-- Основное -->
      <section class="settings-group scenario-section">
        <h3 class="settings-group-title">Основное</h3>
        <input v-model="draft.title" class="scenario-text" type="text" maxlength="100" placeholder="Название" aria-label="Название" data-test="title" />
        <input v-model="draft.description" class="scenario-text" type="text" maxlength="500" placeholder="Описание (необязательно)" aria-label="Описание" />
        <label class="notification-switch">
          <input v-model="draft.enabled" type="checkbox" data-test="enabled" />
          <span class="notification-switch-track" aria-hidden="true"></span>
          <span>{{ draft.enabled ? 'Включён' : 'Выключен' }}</span>
        </label>
        <div class="notification-chips">
          <button type="button" class="notification-chip" :class="{ active: draft.mode === 'active' }" data-test="mode-active" @click="draft.mode = 'active'">Работает</button>
          <button type="button" class="notification-chip" :class="{ active: draft.mode === 'test' }" data-test="mode-test" @click="draft.mode = 'test'">Тест</button>
        </div>
        <p class="notification-hint">{{ draft.mode === 'test'
          ? 'Тест: Node-RED только пишет в журнал, что сделал бы, — команд и оповещений нет.'
          : 'Сценарий управляет устройствами.' }}</p>
        <div class="notification-row">
          <span>Приоритет</span>
          <button
            v-for="p in priorities"
            :key="p.value"
            type="button"
            class="notification-chip"
            :class="{ active: Number(draft.priority) === p.value }"
            @click="draft.priority = p.value"
          >{{ p.label }}</button>
          <input v-model.number="draft.priority" type="number" min="0" max="100" step="1" aria-label="Приоритет" data-test="priority" />
        </div>
      </section>

      <!-- Когда -->
      <section class="settings-group scenario-section">
        <h3 class="settings-group-title">Когда</h3>
        <ScenarioCondition root :node="draft.when" :options="points" @update="draft.when = $event" />
      </section>

      <!-- Тогда / Иначе -->
      <section v-for="branch in branches" :key="branch.key" class="settings-group scenario-section" :data-test="`branch-${branch.key}`">
        <h3 class="settings-group-title">{{ branch.title }}</h3>
        <p class="notification-hint">{{ branch.hint }}</p>
        <ScenarioAction
          v-for="(a, i) in draft[branch.key]"
          :key="i"
          :action="a"
          :options="points"
          @update="updateAction(branch.key, i, $event)"
          @remove="removeAction(branch.key, i)"
        />
        <div class="notification-chips">
          <button type="button" class="notification-add" :data-test="`add-set-${branch.key}`" @click="addAction(branch.key, 'set')">+ Изменить параметр</button>
          <button type="button" class="notification-add" :data-test="`add-notify-${branch.key}`" @click="addAction(branch.key, 'notify')">+ Оповещение</button>
        </div>
      </section>

      <!-- Надёжность -->
      <section class="settings-group scenario-section">
        <h3 class="settings-group-title scenario-collapse" data-test="advanced" @click="showAdvanced = !showAdvanced">
          Надёжность {{ showAdvanced ? '▾' : '▸' }}
        </h3>
        <template v-if="showAdvanced">
          <div class="scenario-option">
            <span>Нет данных датчика</span>
            <div class="notification-chips">
              <button type="button" class="notification-chip" :class="{ active: opt('onUnknown', 'keep') === 'keep' }" @click="setOpt('onUnknown', 'keep')">Ничего не менять</button>
              <button type="button" class="notification-chip" :class="{ active: opt('onUnknown', 'keep') === 'else' }" data-test="unknown-else" @click="setOpt('onUnknown', 'else')">Выполнить «Иначе»</button>
            </div>
          </div>
          <div class="scenario-option">
            <span>После перезапуска Node-RED</span>
            <div class="notification-chips">
              <button type="button" class="notification-chip" :class="{ active: opt('onStart', 'apply') === 'apply' }" @click="setOpt('onStart', 'apply')">Применить сразу</button>
              <button type="button" class="notification-chip" :class="{ active: opt('onStart', 'apply') === 'skip' }" @click="setOpt('onStart', 'skip')">Ждать изменения</button>
            </div>
          </div>
          <div class="scenario-option">
            <span>Включено не меньше</span>
            <DurationInput :model-value="draft.options.minOnSec" placeholder="0" :default-unit="60" label="Включено не меньше" @update:model-value="setOpt('minOnSec', $event)" />
          </div>
          <div class="scenario-option">
            <span>Выключено не меньше</span>
            <DurationInput :model-value="draft.options.minOffSec" placeholder="0" :default-unit="60" label="Выключено не меньше" @update:model-value="setOpt('minOffSec', $event)" />
          </div>
          <div class="scenario-option">
            <span>Повторять команды каждые</span>
            <DurationInput :model-value="draft.options.repeatSec" placeholder="не повторять" :default-unit="60" label="Повтор" @update:model-value="setOpt('repeatSec', $event)" />
          </div>
          <div class="scenario-option">
            <span>Пауза после ручного управления</span>
            <DurationInput
              :model-value="draft.options.manualOverrideSec"
              :placeholder="`${overrideDefault} (общая)`"
              :default-unit="60"
              label="Пауза после ручного управления"
              @update:model-value="setOpt('manualOverrideSec', $event)"
            />
            <p class="notification-hint">0 — ручные команды не останавливают сценарий (для защит).</p>
          </div>
        </template>
      </section>

      <!-- Итог -->
      <section class="settings-group scenario-section scenario-summary" data-test="summary">
        <h3 class="settings-group-title">Итог</h3>
        <p><b>Если</b> {{ summary.when }}</p>
        <p><b>то:</b> {{ summary.then.join('; ') || '—' }}</p>
        <p><b>иначе:</b> {{ summary.else.join('; ') || '—' }}</p>
      </section>

      <p v-if="error" class="notification-error" role="alert" data-test="error">{{ error }}</p>
      <div class="scenario-buttons">
        <button type="button" class="scenario-button scenario-button--primary" :disabled="saving" data-test="save" @click="save">
          {{ saving ? 'Сохранение…' : 'Сохранить' }}
        </button>
        <button v-if="!isNew" type="button" class="scenario-button scenario-button--danger" :disabled="saving" data-test="delete" @click="remove">
          {{ confirmDelete ? 'Точно удалить?' : 'Удалить' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ScenarioCondition from './ScenarioCondition.vue';
import ScenarioAction from './ScenarioAction.vue';
import DurationInput from './DurationInput.vue';
import {
  pointOptions, toEditor, fromEditor, validateDraft, describeScenario, newSet, newNotify, writable, formatDuration,
} from '@/utils/scenarioModel';
import { fromTemplate } from '@/utils/scenarioTemplates';
import logger from '@/store/modules/logger.js';

const BRANCHES = [
  { key: 'then', title: 'Тогда', hint: 'Когда условие стало выполняться.' },
  { key: 'else', title: 'Иначе', hint: 'Когда условие перестало выполняться.' },
];
const PRIORITIES = [
  { value: 50, label: 'Обычный' },
  { value: 70, label: 'Важный' },
  { value: 90, label: 'Защита' },
];

export default {
  name: 'ScenarioEditor',
  components: { ScenarioCondition, ScenarioAction, DurationInput },
  props: {
    scenarioId: { type: String, default: null },
    template: { type: String, default: 'empty' },
  },
  emits: [],

  data() {
    return {
      draft: null,
      initial: '',
      notFound: false,
      error: '',
      saving: false,
      confirmDelete: false,
      leaveWarning: false,
      showAdvanced: false,
      branches: BRANCHES,
      priorities: PRIORITIES,
    };
  },

  computed: {
    ...mapGetters(['dID']),
    ...mapGetters('config', ['getConfig']),
    ...mapGetters('sortParams', ['getSensorTitle', 'getUnit']),
    ...mapGetters('scenarios', ['loaded', 'byId', 'settings']),

    isNew() {
      return !this.scenarioId;
    },
    points() {
      return pointOptions(this.getConfig(this.dID), { titleOf: this.getSensorTitle, unitOf: this.getUnit });
    },
    dirty() {
      return !!this.draft && JSON.stringify(this.draft) !== this.initial;
    },
    summary() {
      return describeScenario(fromEditor(this.draft), this.points);
    },
    overrideDefault() {
      return formatDuration(this.settings.manualOverrideSec);
    },
  },

  watch: {
    loaded: { immediate: true, handler: 'init' },
    dirty() {
      this.leaveWarning = false;
    },
  },

  created() {
    if (!this.loaded) {
      this.$store.dispatch('scenarios/request').catch((e) => logger.warn('[ScenarioEditor] запрос сценариев:', e.message));
    }
  },

  methods: {
    init() {
      if (this.draft) return;
      if (this.isNew) {
        this.draft = toEditor(fromTemplate(this.template, this.points));
      } else {
        if (!this.loaded) return;
        const sc = this.byId(this.scenarioId);
        if (!sc) {
          this.notFound = true;
          return;
        }
        this.draft = toEditor(sc);
        this.showAdvanced = Object.keys(this.draft.options).length > 0;
      }
      // Новый сценарий из шаблона уже «изменён»: уход без сохранения — с предупреждением
      this.initial = this.isNew ? '' : JSON.stringify(this.draft);
    },

    opt(key, def) {
      return this.draft.options[key] ?? def;
    },
    setOpt(key, value) {
      const options = { ...this.draft.options, [key]: value };
      if (value === null || value === undefined) delete options[key];
      this.draft.options = options;
    },

    addAction(branch, kind) {
      const target = this.points.find(writable);
      this.draft[branch] = [...this.draft[branch], kind === 'set' ? newSet(target) : newNotify()];
    },
    updateAction(branch, i, action) {
      const list = [...this.draft[branch]];
      list[i] = action;
      this.draft[branch] = list;
    },
    removeAction(branch, i) {
      this.draft[branch] = this.draft[branch].filter((_, j) => j !== i);
    },

    goBack() {
      if (this.dirty && !this.leaveWarning) {
        this.leaveWarning = true;
        return;
      }
      this.$router.push('/scenarios');
    },

    notifyDelivery(result, text) {
      if (result && result.delivered === 0) {
        this.$store.dispatch('popup/show', {
          message: `${text}. Node-RED сейчас не подключён — сценарии применятся, когда он подключится.`,
          type: 'warning',
          duration: 5000,
        });
      } else {
        this.$store.dispatch('popup/show', { message: text, type: 'success', duration: 2000 });
      }
    },

    async save() {
      this.error = validateDraft(this.draft);
      if (this.error) return;
      this.saving = true;
      try {
        const result = await this.$store.dispatch('scenarios/save', {
          action: this.isNew ? 'create' : 'edit',
          configData: fromEditor(this.draft),
        });
        this.initial = JSON.stringify(this.draft);
        this.notifyDelivery(result, 'Сценарий сохранён');
        this.$router.push('/scenarios');
      } catch (e) {
        this.error = e.message;
      } finally {
        this.saving = false;
      }
    },

    async remove() {
      if (!this.confirmDelete) {
        this.confirmDelete = true;
        return;
      }
      this.saving = true;
      try {
        const result = await this.$store.dispatch('scenarios/save', { action: 'delete', configData: { id: this.draft.id } });
        this.initial = JSON.stringify(this.draft);
        this.notifyDelivery(result, 'Сценарий удалён');
        this.$router.push('/scenarios');
      } catch (e) {
        this.error = e.message;
      } finally {
        this.saving = false;
        this.confirmDelete = false;
      }
    },
  },
};
</script>
