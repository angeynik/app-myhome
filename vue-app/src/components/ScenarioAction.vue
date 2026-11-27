<!-- components/ScenarioAction.vue -->
<!-- Действие сценария: изменить параметр (уставка, переключатель) — значением или значением другого
     параметра со сдвигом — или оповещение. Задержка «через» — выполнить, если состояние сценария
     за это время не сменилось. Изменения уходят событием update (props не мутируются).
     Формат — docs/scenarios.md, раздел 3.4. -->
<template>
  <div class="scenario-node scenario-action" :data-test="`action-${isSet ? 'set' : 'notify'}`">
    <div class="scenario-node-head">
      <span class="scenario-node-title">{{ isSet ? 'Изменить' : 'Оповещение' }}</span>
      <button type="button" class="notification-remove" aria-label="Удалить действие" data-test="remove" @click="$emit('remove')">✕</button>
    </div>

    <template v-if="isSet">
      <ScenarioPointSelect
        :model-value="action.set"
        :options="options"
        :filter="writableFilter"
        label="Что изменить"
        placeholder="Выберите уставку или переключатель"
        @select="onTarget"
      />
      <div class="notification-row">
        <span>на</span>
        <template v-if="isBool">
          <button
            v-for="b in [true, false]"
            :key="String(b)"
            type="button"
            class="notification-chip"
            :class="{ active: action.value === b }"
            :data-test="`bool-${b}`"
            @click="patch({ value: b })"
          >{{ b ? 'ВКЛ' : 'ВЫКЛ' }}</button>
        </template>
        <template v-else>
          <select :value="action.valueFrom ? 'point' : 'value'" aria-label="Какое значение" data-test="set-source" @change="setSource($event.target.value)">
            <option value="value">число</option>
            <option value="point">значение параметра</option>
          </select>
          <input
            v-if="!action.valueFrom"
            type="number"
            step="any"
            :value="action.value"
            aria-label="Значение"
            data-test="value"
            @input="patch({ value: $event.target.value === '' ? '' : Number($event.target.value) })"
          />
          <span v-if="!action.valueFrom && target && target.unit" class="notification-unit">{{ target.unit }}</span>
        </template>
      </div>
      <div v-if="action.valueFrom" class="notification-row">
        <ScenarioPointSelect
          :model-value="action.valueFrom"
          :options="options"
          label="Источник значения"
          @update:model-value="patch({ valueFrom: $event })"
        />
        <span>±</span>
        <input type="number" step="any" :value="action.valueFrom.offset || 0" aria-label="Сдвиг" @input="patchOffset($event.target.value)" />
      </div>
    </template>

    <template v-else>
      <input
        class="scenario-text"
        type="text"
        maxlength="1000"
        :value="action.notify"
        placeholder="Текст оповещения"
        aria-label="Текст оповещения"
        data-test="notify"
        @input="patch({ notify: $event.target.value })"
      />
      <div class="notification-chips">
        <button
          v-for="s in severities"
          :key="s.value"
          type="button"
          class="notification-chip"
          :class="{ active: (action.severity || 'info') === s.value }"
          :data-test="`severity-${s.value}`"
          @click="patch({ severity: s.value })"
        >{{ s.label }}</button>
      </div>
    </template>

    <div class="notification-row scenario-extra">
      <span>Через</span>
      <DurationInput :model-value="action.delaySec" placeholder="сразу" label="Задержка" :default-unit="60" @update:model-value="patch({ delaySec: $event })" />
    </div>
  </div>
</template>

<script>
import ScenarioPointSelect from './ScenarioPointSelect.vue';
import DurationInput from './DurationInput.vue';
import { SEVERITIES, findPoint, writable } from '@/utils/scenarioModel';

export default {
  name: 'ScenarioAction',
  components: { ScenarioPointSelect, DurationInput },
  props: {
    action: { type: Object, required: true },
    options: { type: Array, required: true },
  },
  emits: ['update', 'remove'],

  data() {
    return { severities: SEVERITIES, writableFilter: writable };
  },

  computed: {
    isSet() {
      return Object.prototype.hasOwnProperty.call(this.action, 'set');
    },
    target() {
      return this.isSet ? findPoint(this.options, this.action.set) : null;
    },
    isBool() {
      return this.target ? this.target.type === 'bool' : typeof this.action.value === 'boolean';
    },
  },

  methods: {
    patch(fields) {
      const next = { ...this.action, ...fields };
      for (const [k, v] of Object.entries(fields)) if (v === undefined || v === null) delete next[k];
      this.$emit('update', next);
    },
    patchOffset(raw) {
      const offset = raw === '' ? 0 : Number(raw);
      if (Number.isFinite(offset)) this.patch({ valueFrom: { ...this.action.valueFrom, offset } });
    },
    onTarget(p) {
      const next = { set: { room: p.room, item: p.item } };
      if (p.type === 'bool') Object.assign(next, { value: typeof this.action.value === 'boolean' ? this.action.value : true, valueFrom: undefined });
      else if (typeof this.action.value === 'boolean') next.value = Number.isFinite(Number(p.value)) && p.value !== null ? Number(p.value) : 0;
      this.patch(next);
    },
    setSource(src) {
      if (src === 'point') {
        const p = this.options.find((x) => x.type === 'num' && x.key !== `${this.action.set.room}|${this.action.set.item}`);
        this.patch({ valueFrom: { room: p?.room || '', item: p?.item || '', offset: 0 }, value: undefined });
      } else {
        this.patch({ valueFrom: undefined, value: 0 });
      }
    },
  },
};
</script>
