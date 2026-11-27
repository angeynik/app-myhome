<!-- components/ScenarioCondition.vue -->
<!-- Узел условия сценария (рекурсивный): группа «все (И)» / «любое (ИЛИ)» с вложенными узлами или лист —
     параметр, время суток, дни недели, даты. Отрицание { not: узел } показывается как переключатель «НЕ»
     у самого узла. Изменения не мутируют props: узел целиком уходит событием update (так же вверх по дереву).
     Корень (root) — всегда группа, без «НЕ» и удаления. Формат — docs/scenarios.md, раздел 3.3. -->
<template>
  <div
    class="scenario-node"
    :class="[`scenario-node--${kind}`, { 'scenario-node--root': root, 'scenario-node--not': negated }]"
    :data-test="`cond-${kind}`"
  >
    <!-- Шапка узла -->
    <div class="scenario-node-head">
      <template v-if="isGroupNode">
        <button
          v-for="g in groupKinds"
          :key="g.kind"
          type="button"
          class="notification-chip small-chip"
          :class="{ active: kind === g.kind }"
          :data-test="`group-${g.kind}`"
          @click="setGroupKind(g.kind)"
        >{{ g.label }}</button>
      </template>
      <span v-else class="scenario-node-title">{{ kindTitle }}</span>
      <button
        v-if="!root"
        type="button"
        class="notification-chip small-chip"
        :class="{ active: negated }"
        title="Отрицание: условие выполнено, когда это НЕ выполняется"
        data-test="not"
        @click="toggleNot"
      >НЕ</button>
      <button v-if="!root" type="button" class="notification-remove" aria-label="Удалить условие" data-test="remove" @click="$emit('remove')">✕</button>
    </div>

    <!-- Группа -->
    <template v-if="isGroupNode">
      <p v-if="!items.length" class="notification-hint">{{ root ? 'Добавьте первое условие.' : 'Пустая группа.' }}</p>
      <template v-for="(child, i) in items" :key="i">
        <div v-if="i > 0" class="scenario-join">{{ kind === 'all' ? 'И' : 'ИЛИ' }}</div>
        <ScenarioCondition
          :node="child"
          :options="options"
          :depth="depth + 1"
          @update="updateChild(i, $event)"
          @remove="removeChild(i)"
        />
      </template>
      <div class="notification-chips scenario-add-row">
        <button type="button" class="notification-add" data-test="add-point" @click="addChild('point')">+ Параметр</button>
        <button type="button" class="notification-add" data-test="add-time" @click="addChild('time')">+ Время</button>
        <button type="button" class="notification-add" data-test="add-days" @click="addChild('days')">+ Дни</button>
        <button type="button" class="notification-add" data-test="add-dates" @click="addChild('dates')">+ Даты</button>
        <button v-if="depth < maxDepth - 1" type="button" class="notification-add" data-test="add-group" @click="addChild('group')">+ Группа</button>
      </div>
    </template>

    <!-- Двойное отрицание из файла: показываем вложенный узел как есть -->
    <ScenarioCondition
      v-else-if="kind === 'not'"
      :node="inner"
      :options="options"
      :depth="depth + 1"
      @update="emitInner($event)"
      @remove="$emit('remove')"
    />

    <!-- Параметр -->
    <template v-else-if="kind === 'point'">
      <ScenarioPointSelect :model-value="inner.point" :options="options" @select="onPoint" />
      <div class="notification-row">
        <select :value="inner.op" aria-label="Сравнение" data-test="op" @change="onOp($event.target.value)">
          <option v-for="o in allowedOps" :key="o.op" :value="o.op">{{ o.sign }} {{ o.label }}</option>
        </select>

        <DurationInput
          v-if="inner.op === 'stale'"
          :model-value="inner.sec"
          :default-unit="60"
          label="Нет данных дольше"
          @update:model-value="patch({ sec: $event })"
        />
        <template v-else-if="isRange">
          <input type="number" step="any" :value="inner.value" aria-label="От" data-test="value" @input="patchNum('value', $event.target.value)" />
          <span>…</span>
          <input type="number" step="any" :value="inner.value2" aria-label="До" data-test="value2" @input="patchNum('value2', $event.target.value)" />
        </template>
        <template v-else-if="isBool">
          <button
            v-for="b in [true, false]"
            :key="String(b)"
            type="button"
            class="notification-chip"
            :class="{ active: inner.value === b }"
            :data-test="`bool-${b}`"
            @click="patch({ value: b })"
          >{{ b ? 'ВКЛ' : 'ВЫКЛ' }}</button>
        </template>
        <template v-else>
          <select :value="inner.valueFrom ? 'point' : 'value'" aria-label="С чем сравнивать" data-test="cmp-source" @change="setSource($event.target.value)">
            <option value="value">числом</option>
            <option value="point">с параметром</option>
          </select>
          <input
            v-if="!inner.valueFrom"
            type="number"
            step="any"
            :value="inner.value"
            aria-label="Значение"
            data-test="value"
            @input="patchNum('value', $event.target.value)"
          />
          <span v-if="!inner.valueFrom && unit" class="notification-unit">{{ unit }}</span>
        </template>
      </div>
      <div v-if="inner.valueFrom" class="notification-row">
        <ScenarioPointSelect
          :model-value="inner.valueFrom"
          :options="options"
          label="Параметр для сравнения"
          @update:model-value="patch({ valueFrom: $event })"
        />
        <span>±</span>
        <input type="number" step="any" :value="inner.valueFrom.offset || 0" aria-label="Сдвиг" data-test="offset" @input="patchOffset($event.target.value)" />
      </div>
      <div v-if="inner.op !== 'stale'" class="notification-row scenario-extra">
        <template v-if="hystAllowed">
          <span>Гистерезис</span>
          <input type="number" min="0" step="any" :value="inner.hysteresis ?? ''" placeholder="0" aria-label="Гистерезис" data-test="hysteresis" @input="patchNum('hysteresis', $event.target.value)" />
        </template>
        <span>Держится не менее</span>
        <DurationInput :model-value="inner.forSec" placeholder="0" label="Держится не менее" @update:model-value="patch({ forSec: $event })" />
      </div>
    </template>

    <!-- Время суток -->
    <div v-else-if="kind === 'time'" class="notification-row">
      <span>с</span>
      <input type="time" :value="inner.time.from" aria-label="С" data-test="time-from" @input="patch({ time: { ...inner.time, from: $event.target.value } })" />
      <span>до</span>
      <input type="time" :value="inner.time.to" aria-label="До" data-test="time-to" @input="patch({ time: { ...inner.time, to: $event.target.value } })" />
      <span v-if="inner.time.from > inner.time.to" class="notification-hint">через полночь</span>
    </div>

    <!-- Дни недели -->
    <div v-else-if="kind === 'days'" class="notification-chips">
      <button
        v-for="(name, idx) in weekDays"
        :key="name"
        type="button"
        class="notification-chip"
        :class="{ active: inner.days.includes(idx + 1) }"
        :data-test="`day-${idx + 1}`"
        @click="toggleDay(idx + 1)"
      >{{ name }}</button>
    </div>

    <!-- Даты -->
    <template v-else-if="kind === 'dates'">
      <label class="scenario-check">
        <input type="checkbox" :checked="yearly" data-test="yearly" @change="setYearly($event.target.checked)" />
        каждый год
      </label>
      <div class="notification-row">
        <span>с</span>
        <input type="date" :value="dateInput(inner.dates.from)" aria-label="С даты" data-test="date-from" @input="setDate('from', $event.target.value)" />
        <span>по</span>
        <input type="date" :value="dateInput(inner.dates.to)" aria-label="По дату" data-test="date-to" @input="setDate('to', $event.target.value)" />
      </div>
    </template>

    <!-- Длительность группы (не корень) -->
    <div v-if="isGroupNode && !root" class="notification-row scenario-extra">
      <span>Держится не менее</span>
      <DurationInput :model-value="inner.forSec" placeholder="0" label="Группа держится не менее" @update:model-value="patch({ forSec: $event })" />
    </div>
  </div>
</template>

<script>
import ScenarioPointSelect from './ScenarioPointSelect.vue';
import DurationInput from './DurationInput.vue';
import {
  OPS, BOOL_OPS, HYST_OPS, RANGE_OPS, WEEK_DAYS, MAX_DEPTH,
  kindOf, findPoint, newPointCond, newTime, newDays, newDates, newGroup,
} from '@/utils/scenarioModel';

const TITLES = { point: 'Параметр', time: 'Время суток', days: 'Дни недели', dates: 'Даты', not: 'НЕ' };
const YEAR = '2000'; // для поля даты «каждый год» (високосный — есть 29 февраля)

export default {
  name: 'ScenarioCondition',
  components: { ScenarioPointSelect, DurationInput },
  props: {
    node: { type: Object, required: true },
    options: { type: Array, required: true },
    depth: { type: Number, default: 1 },
    root: { type: Boolean, default: false },
  },
  emits: ['update', 'remove'],

  data() {
    return {
      weekDays: WEEK_DAYS,
      maxDepth: MAX_DEPTH,
      groupKinds: [{ kind: 'all', label: 'Все (И)' }, { kind: 'any', label: 'Любое (ИЛИ)' }],
    };
  },

  computed: {
    // { not: X } показывается как X с включённым «НЕ»
    negated() {
      return !this.root && kindOf(this.node) === 'not';
    },
    inner() {
      return this.negated ? this.node.not : this.node;
    },
    kind() {
      return kindOf(this.inner);
    },
    kindTitle() {
      return TITLES[this.kind] || this.kind;
    },
    isGroupNode() {
      return this.kind === 'all' || this.kind === 'any';
    },
    items() {
      return this.isGroupNode ? this.inner[this.kind] : [];
    },
    point() {
      return this.kind === 'point' ? findPoint(this.options, this.inner.point) : null;
    },
    isBool() {
      return this.point ? this.point.type === 'bool' : typeof this.inner.value === 'boolean';
    },
    isRange() {
      return RANGE_OPS.includes(this.inner.op);
    },
    hystAllowed() {
      return HYST_OPS.includes(this.inner.op) && !this.isBool;
    },
    allowedOps() {
      return this.isBool ? OPS.filter((o) => BOOL_OPS.includes(o.op)) : OPS;
    },
    unit() {
      return this.point?.unit || '';
    },
    yearly() {
      return this.kind === 'dates' && String(this.inner.dates.from).length === 5;
    },
  },

  methods: {
    emitInner(inner) {
      this.$emit('update', this.negated ? { ...this.node, not: inner } : inner);
    },
    // Поля со значением undefined / null удаляются
    patch(fields) {
      const next = { ...this.inner, ...fields };
      for (const [k, v] of Object.entries(fields)) if (v === undefined || v === null) delete next[k];
      this.emitInner(next);
    },
    patchNum(field, raw) {
      this.patch({ [field]: raw === '' ? (field === 'hysteresis' ? undefined : '') : Number(raw) });
    },
    patchOffset(raw) {
      const offset = raw === '' ? 0 : Number(raw);
      if (Number.isFinite(offset)) this.patch({ valueFrom: { ...this.inner.valueFrom, offset } });
    },

    toggleNot() {
      this.$emit('update', this.negated ? this.node.not : { not: this.node });
    },
    setGroupKind(kind) {
      if (kind === this.kind) return;
      const next = { ...this.inner, [kind]: this.items };
      delete next[this.kind];
      this.emitInner(next);
    },
    addChild(type) {
      const first = this.options.find((p) => p.section === 'sensors') || this.options[0];
      const make = {
        point: () => newPointCond(first),
        time: newTime,
        days: newDays,
        dates: newDates,
        group: () => newGroup(this.kind === 'all' ? 'any' : 'all', [newPointCond(first)]),
      }[type];
      this.patch({ [this.kind]: [...this.items, make()] });
    },
    updateChild(i, child) {
      const items = [...this.items];
      items[i] = child;
      this.patch({ [this.kind]: items });
    },
    removeChild(i) {
      this.patch({ [this.kind]: this.items.filter((_, j) => j !== i) });
    },

    // Сменили параметр: тип значения и сравнение под него
    onPoint(p) {
      const next = { point: { room: p.room, item: p.item } };
      if (p.type === 'bool' && this.inner.op !== 'stale') {
        if (!BOOL_OPS.includes(this.inner.op)) next.op = 'eq';
        if (typeof this.inner.value !== 'boolean') next.value = true;
        Object.assign(next, { valueFrom: undefined, value2: undefined, hysteresis: undefined });
      } else if (p.type !== 'bool' && typeof this.inner.value === 'boolean') {
        next.value = Number.isFinite(Number(p.value)) && p.value !== null ? Number(p.value) : 0;
      }
      this.patch(next);
    },
    onOp(op) {
      const next = { op };
      if (op === 'stale') {
        Object.assign(next, { sec: this.inner.sec || 3600, value: undefined, valueFrom: undefined, value2: undefined, hysteresis: undefined });
      } else {
        next.sec = undefined;
        if (this.inner.op === 'stale') next.value = this.isBool ? true : 0;
        if (RANGE_OPS.includes(op)) {
          const v = Number(this.inner.value) || 0;
          Object.assign(next, { value: v, value2: this.inner.value2 ?? v + 10, valueFrom: undefined, hysteresis: undefined });
        } else {
          next.value2 = undefined;
          if (!HYST_OPS.includes(op)) next.hysteresis = undefined;
        }
      }
      this.patch(next);
    },
    setSource(src) {
      if (src === 'point') {
        const same = this.options.find((p) => p.room === this.inner.point.room && p.item === `s${this.inner.point.item.slice(1)}`);
        const p = same || this.options.find((x) => x.type === 'num' && x.key !== `${this.inner.point.room}|${this.inner.point.item}`);
        this.patch({ valueFrom: { room: p?.room || '', item: p?.item || '', offset: 0 }, value: undefined });
      } else {
        this.patch({ valueFrom: undefined, value: 0 });
      }
    },

    toggleDay(d) {
      const days = this.inner.days.includes(d) ? this.inner.days.filter((x) => x !== d) : [...this.inner.days, d];
      this.patch({ days: days.sort((a, b) => a - b) });
    },
    dateInput(v) {
      return String(v || '').length === 5 ? `${YEAR}-${v}` : v;
    },
    setDate(field, value) {
      if (!value) return;
      this.patch({ dates: { ...this.inner.dates, [field]: this.yearly ? value.slice(5) : value } });
    },
    setYearly(on) {
      const year = new Date().getFullYear();
      const conv = (v) => (on ? String(v).slice(-5) : `${year}-${String(v).slice(-5)}`);
      this.patch({ dates: { from: conv(this.inner.dates.from), to: conv(this.inner.dates.to) } });
    },
  },
};
</script>
