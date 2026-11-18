<!-- components/NotificationScreen.vue -->
<!-- Экран настройки уведомления параметра (клон SetpointScreen: полноэкранная панель в <body>).
     Открывается нажатием на иконку плашки (MainBody → notifications/openEditor).
     Переключатель «Уведомление»: ON — показать и задать условия; уже созданное — видно и правится.
     По умолчанию при включении: условие «≠», значение — текущее значение параметра, канал «Веб»;
     интервалы, периоды и камеры не выбраны. Условие и значение обязательны (без текущего
     значения экран не открывается — MainBody.openNotification).
     Закрытие (✕ или Esc) сохраняет: новое — action 'create', изменённое — 'edit',
     выключенное существующее — 'delete'. Неполные данные — сообщение, экран не закрывается.
     Локальный статус уведомления (обводка, «прочитано») экран не трогает: его меняет только
     событие сброса от сервера (notifications/handleEvent).
     Формат — docs/notifications.md. -->
<template>
  <Teleport to="body">
    <div
      v-if="editor.open && target"
      ref="panel"
      tabindex="-1"
      class="setpoint-screen notification-screen"
      role="dialog"
      aria-modal="true"
      :aria-label="`Уведомление: ${target.roomTitle} — ${target.title}`"
      @keydown.esc="close"
    >
      <div class="setpoint-header">
        <div class="setpoint-titles">
          <span class="setpoint-room">{{ target.roomTitle }}</span>
          <span class="setpoint-param">{{ target.title }}</span>
        </div>
        <button type="button" class="setpoint-close" aria-label="Сохранить и закрыть" @click="close">✕</button>
      </div>

      <div class="notification-body">
        <label class="notification-switch">
          <input v-model="form.enabled" type="checkbox" data-test="enabled" />
          <span class="notification-switch-track" aria-hidden="true"></span>
          <span>Уведомление {{ form.enabled ? 'ON' : 'OFF' }}</span>
        </label>
        <p v-if="!form.enabled" class="notification-hint">
          {{ existing
            ? 'Выключено — при закрытии условие будет удалено на сервере. Обводка снимется, когда сервер пришлёт сброс.'
            : 'Включите, чтобы задать условие уведомления.' }}
        </p>

        <template v-if="form.enabled">
          <!-- Условие -->
          <section class="notification-section">
            <h3>Условие</h3>
            <div class="notification-chips">
              <button
                v-for="o in ops"
                :key="o.op"
                type="button"
                class="notification-chip"
                :class="{ active: form.op === o.op }"
                :title="o.label"
                :data-test="`op-${o.op}`"
                @click="form.op = o.op"
              >{{ o.sign }}</button>
            </div>
            <div class="notification-value">
              <template v-if="isBool">
                <button
                  v-for="b in [true, false]"
                  :key="String(b)"
                  type="button"
                  class="notification-chip"
                  :class="{ active: form.value === b }"
                  @click="form.value = b"
                >{{ b ? 'ON' : 'OFF' }}</button>
              </template>
              <template v-else>
                <button type="button" class="notification-step" aria-label="Уменьшить" @click="stepValue(-1)">−</button>
                <input v-model.number="form.value" type="number" step="any" inputmode="decimal" data-test="value" />
                <span v-if="target.unit" class="notification-unit">{{ target.unit }}</span>
                <button type="button" class="notification-step" aria-label="Увеличить" @click="stepValue(1)">+</button>
              </template>
            </div>
            <p class="notification-hint">Сейчас: {{ currentText }}</p>
          </section>

          <!-- Интервалы контроля (время суток) -->
          <section class="notification-section">
            <h3>Интервалы контроля</h3>
            <p v-if="!form.intervals.length" class="notification-hint">Не заданы — круглые сутки.</p>
            <div v-for="(iv, i) in form.intervals" :key="`iv-${i}`" class="notification-row">
              <input v-model="iv.from" type="time" aria-label="С" />
              <span>—</span>
              <input v-model="iv.to" type="time" aria-label="По" />
              <button type="button" class="notification-remove" aria-label="Удалить интервал" @click="form.intervals.splice(i, 1)">✕</button>
            </div>
            <button type="button" class="notification-add" data-test="add-interval" @click="addInterval">+ Интервал</button>
          </section>

          <!-- Периоды контроля (календарь) -->
          <section class="notification-section">
            <h3>Периоды контроля</h3>
            <p v-if="!form.periods.length" class="notification-hint">Не заданы — круглый год.</p>
            <div v-for="(p, i) in form.periods" :key="`p-${i}`" class="notification-period">
              <div class="notification-row">
                <span class="notification-period-title">{{ periodTitles[p.type] }}</span>
                <button type="button" class="notification-remove" aria-label="Удалить период" @click="form.periods.splice(i, 1)">✕</button>
              </div>
              <div v-if="p.type === 'dates'" class="notification-row">
                <input v-model="p.from" type="date" aria-label="С даты" />
                <span>—</span>
                <input v-model="p.to" type="date" aria-label="По дату" />
              </div>
              <div v-else-if="p.type === 'monthDays'" class="notification-chips notification-chips--grid">
                <button
                  v-for="d in 31"
                  :key="d"
                  type="button"
                  class="notification-chip small"
                  :class="{ active: p.days.includes(d) }"
                  @click="toggleDay(p, d)"
                >{{ d }}</button>
              </div>
              <div v-else class="notification-chips">
                <button
                  v-for="(name, idx) in weekDays"
                  :key="name"
                  type="button"
                  class="notification-chip"
                  :class="{ active: p.days.includes(idx + 1) }"
                  @click="toggleDay(p, idx + 1)"
                >{{ name }}</button>
              </div>
            </div>
            <div class="notification-chips">
              <button type="button" class="notification-add" data-test="add-dates" @click="addPeriod('dates')">+ Даты</button>
              <button type="button" class="notification-add" data-test="add-monthDays" @click="addPeriod('monthDays')">+ Числа месяца</button>
              <button type="button" class="notification-add" data-test="add-weekDays" @click="addPeriod('weekDays')">+ Дни недели</button>
            </div>
          </section>

          <!-- Дополнительные данные: кадры камер -->
          <section class="notification-section">
            <h3>Снимок с камер</h3>
            <p v-if="!cameras.length" class="notification-hint">Камеры не настроены.</p>
            <div v-else class="notification-chips">
              <button
                v-for="cam in cameras"
                :key="cam.id"
                type="button"
                class="notification-chip"
                :class="{ active: form.cameras.includes(cam.id) }"
                @click="toggleCamera(cam.id)"
              >{{ cam.title }}</button>
            </div>
          </section>

          <!-- Канал оповещения -->
          <section class="notification-section">
            <h3>Канал оповещения</h3>
            <div class="notification-chips">
              <button
                v-for="c in channels"
                :key="c.value"
                type="button"
                class="notification-chip"
                :class="{ active: form.channel === c.value }"
                :data-test="`channel-${c.value}`"
                @click="form.channel = c.value"
              >{{ c.label }}</button>
            </div>
          </section>
        </template>

        <p v-if="error" class="notification-error" role="alert">{{ error }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { mapGetters } from 'vuex';
import { OPS, CHANNELS } from '@/store/modules/notifications';
import logger from '@/store/modules/logger.js';

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const PERIOD_TITLES = { dates: 'Даты', monthDays: 'Числа месяца', weekDays: 'Дни недели' };

// Значение с плашки: число или 'ON'/'OFF'
const asBool = (v) => (v === true || v === 'ON' ? true : v === false || v === 'OFF' ? false : null);
const today = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10); // МСК

const clone = (x) => JSON.parse(JSON.stringify(x));

export default {
  name: 'NotificationScreen',

  data() {
    return {
      form: this.emptyForm(),
      initial: null,       // форма при открытии — чтобы не слать edit без изменений
      error: '',
      ops: OPS,
      channels: CHANNELS,
      weekDays: WEEK_DAYS,
      periodTitles: PERIOD_TITLES,
    };
  },

  computed: {
    ...mapGetters('notifications', ['editor', 'itemOf']),
    ...mapGetters('video', ['cameras', 'camerasLoaded']),

    target() {
      return this.editor.target;
    },
    existing() {
      return this.target ? this.itemOf(this.target.id) : null;
    },
    isBool() {
      const cond = this.existing?.condition?.value;
      return typeof cond === 'boolean' || asBool(this.target?.value) !== null;
    },
    currentText() {
      const v = this.target?.value;
      if (v === null || v === undefined || v === '') return '—';
      return `${v}${this.target.unit && typeof v === 'number' ? ` ${this.target.unit}` : ''}`;
    },
  },

  watch: {
    // Новое открытие — форма из существующего уведомления или по умолчанию
    'editor.open': {
      immediate: true,
      handler(open) {
        if (!open || !this.target) return;
        this.error = '';
        this.form = this.existing ? this.formFrom(this.existing) : this.emptyForm();
        this.initial = clone(this.form);
        this.$nextTick(() => this.$refs.panel?.focus());
        if (!this.camerasLoaded) {
          this.$store.dispatch('video/requestCameras').catch((e) => logger.warn('[NotificationScreen] камеры:', e.message));
        }
      },
    },
  },

  methods: {
    emptyForm() {
      const v = this.target?.value;
      const b = asBool(v);
      // Условие по умолчанию — «не равно», значение — текущее значение параметра
      return {
        enabled: false,
        op: 'ne',
        value: b !== null ? b : (typeof v === 'number' ? v : ''),
        intervals: [],
        periods: [],
        cameras: [],
        channel: 'web',
      };
    },

    formFrom(item) {
      return {
        enabled: true,
        op: item.condition.op,
        value: item.condition.value,
        intervals: clone(item.intervals || []),
        periods: clone(item.periods || []),
        cameras: [...(item.cameras || [])],
        channel: item.channel || 'web',
      };
    },

    stepValue(dir) {
      const v = Number(this.form.value) || 0;
      const step = Number.isInteger(v) ? 1 : 0.1;
      this.form.value = Math.round((v + dir * step) * 10) / 10;
    },

    addInterval() {
      this.form.intervals.push({ from: '08:00', to: '20:00' });
    },

    addPeriod(type) {
      if (type === 'dates') this.form.periods.push({ type, from: today(), to: today() });
      else this.form.periods.push({ type, days: [] });
    },

    toggleDay(period, day) {
      const i = period.days.indexOf(day);
      if (i >= 0) period.days.splice(i, 1);
      else period.days.push(day);
      period.days.sort((a, b) => a - b);
    },

    toggleCamera(id) {
      const i = this.form.cameras.indexOf(id);
      if (i >= 0) this.form.cameras.splice(i, 1);
      else this.form.cameras.push(id);
    },

    // Текст ошибки или '' — данные можно отправлять
    validate() {
      const f = this.form;
      if (!OPS.some((o) => o.op === f.op)) return 'Выберите условие';
      if (this.isBool ? typeof f.value !== 'boolean' : (f.value === '' || f.value === null || !Number.isFinite(Number(f.value)))) {
        return 'Укажите значение условия';
      }
      if (f.intervals.some((iv) => !iv.from || !iv.to)) return 'Заполните время начала и окончания интервалов';
      for (const p of f.periods) {
        if (p.type === 'dates' && (!p.from || !p.to)) return 'Заполните даты периода';
        if (p.type === 'dates' && p.from > p.to) return `Период ${p.from} — ${p.to}: дата начала позже окончания`;
        if (p.type !== 'dates' && p.days.length === 0) return `${PERIOD_TITLES[p.type]}: выберите хотя бы один день`;
      }
      return '';
    },

    configData() {
      const t = this.target;
      const f = this.form;
      return {
        group: t.group,
        room: t.room,
        section: t.section,
        item: t.item,
        roomTitle: t.roomTitle,
        title: t.title,
        unit: t.unit,
        condition: { op: f.op, value: this.isBool ? Boolean(f.value) : Number(f.value) },
        intervals: f.intervals,
        periods: f.periods,
        cameras: f.cameras,
        channel: f.channel,
      };
    },

    async close() {
      const t = this.target;
      let request = null;
      if (this.form.enabled) {
        this.error = this.validate();
        if (this.error) return;
        const changed = JSON.stringify(this.form) !== JSON.stringify(this.initial);
        if (!this.existing) request = { action: 'create', configData: this.configData() };
        else if (changed) request = { action: 'edit', configData: this.configData() };
      } else if (this.existing) {
        request = { action: 'delete', configData: { room: t.room, section: t.section, item: t.item } };
      }

      this.$store.dispatch('notifications/closeEditor');
      if (!request) return;
      try {
        await this.$store.dispatch('notifications/save', request);
      } catch (e) {
        logger.error('[NotificationScreen] сохранение:', e.message);
        this.$store.dispatch('popup/show', { message: `Уведомление не сохранено: ${e.message}`, type: 'error', duration: 3000 });
      }
    },
  },
};
</script>
