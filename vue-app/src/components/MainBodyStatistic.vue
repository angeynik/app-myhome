<!-- components/MainBodyStatistic.vue -->
<template>
  <div class="settings-block" v-if="analyticData">

    <!-- Информация о записи -->
    <div v-if="analyticData.id" class="settings-info">
      <div class="settings-info-item">
        <span class="settings-info-value">ID:</span>
        <span class="settings-info-value">{{ analyticData.id }}</span>
      </div>
      <div class="settings-info-item" v-if="analyticData.createdAt">
        <span class="settings-info-value">Создано:</span>
        <span class="settings-info-value">{{ formatDate(analyticData.createdAt) }}</span>
      </div>
      <div class="settings-info-item" v-if="analyticData.updatedAt">
        <span class="settings-info-value">Обновлено:</span>
        <span class="settings-info-value">{{ formatDate(analyticData.updatedAt) }}</span>
      </div>
    </div>

    <div class="settings-row">

      <!-- Первая колонка (80%) -->
      <div class="settings-col-first">

        <!-- Строка 1: Тип графика -->
        <div class="settings-row">
          <div class="settings-block-title">
            <p>График</p>
          </div>
          <div
            class="settings-block clickable time-input"
            :class="{ 'selected': isFieldSelected('chartType') }"
            @click.stop="editChartType"
          >
            <div class="settings-value">{{ chartTypeLabel }}</div>
          </div>
        </div>

        <!-- Строка 2: Период сбора -->
        <div class="settings-row">
          <div class="settings-block-title">
            <p>Период</p>
          </div>
          <div
            class="settings-block clickable time-input"
            :class="{ 'selected': isFieldSelected('period') }"
            @click.stop="editPeriod"
          >
            <div class="settings-value">{{ periodLabel }}</div>
          </div>
        </div>

        <!-- Строка 3: Агрегация -->
        <div class="settings-row">
          <div class="settings-block-title">
            <p>Агрегация</p>
          </div>
          <div
            class="settings-block clickable time-input"
            :class="{ 'selected': isFieldSelected('aggregation') }"
            @click.stop="editAggregation"
          >
            <div class="settings-value">{{ aggregationLabel }}</div>
          </div>
        </div>

      </div>

      <!-- Вторая колонка: кнопка удаления (20%) -->
      <div class="settings-col-second">
        <div class="icon-settings item">
          <button class="mainBodySettings-header-button" @click="deleteAnalyticItem">
            <svg class="icon-settings close" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle class="hover-bg" cx="44" cy="44" r="42" fill="#CC0000" opacity="0"/>
              <circle cx="44" cy="44" r="42" fill="#FF4747"/>
              <circle cx="44" cy="44" r="42" stroke="#FF4747" stroke-width="4"/>
              <line x1="28" y1="28" x2="60" y2="60" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
              <line x1="60" y1="28" x2="28" y2="60" stroke="#E0DFE7" stroke-width="8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import logger from '../store/modules/logger.js';
import { mapGetters, mapActions } from 'vuex';

const CHART_TYPES   = ['line', 'bar', 'area', 'scatter'];
const PERIODS       = ['hour', 'day', 'week', 'month', 'year'];
const AGGREGATIONS  = ['average', 'min', 'max', 'sum', 'last'];

const CHART_LABELS = {
  line:    'Линейный',
  bar:     'Столбчатый',
  area:    'Область',
  scatter: 'Точечный',
};

const PERIOD_LABELS = {
  hour:  'Час',
  day:   'День',
  week:  'Неделя',
  month: 'Месяц',
  year:  'Год',
};

const AGGREGATION_LABELS = {
  average: 'Среднее',
  min:     'Минимум',
  max:     'Максимум',
  sum:     'Сумма',
  last:    'Последнее',
};

export default {
  name: 'MainBodyStatistic',

  props: {
    analyticData: {
      type: Object,
      required: true,
    },
    activeSelection: {
      type: Object,
      default: null,
    },
  },

  emits: ['delete-analytic', 'edit-analytic', 'field-selected'],

  data() {
    return {};
  },

  computed: {
    ...mapGetters(['level']),
    ...mapGetters('settingsConfig', ['dateTimeUtils']),

    userLevel() {
      return this.level || 0;
    },

    chartTypeLabel() {
      return CHART_LABELS[this.analyticData.chartType] ?? this.analyticData.chartType ?? '—';
    },

    periodLabel() {
      return PERIOD_LABELS[this.analyticData.period] ?? this.analyticData.period ?? '—';
    },

    aggregationLabel() {
      return AGGREGATION_LABELS[this.analyticData.aggregation] ?? this.analyticData.aggregation ?? '—';
    },
  },

  watch: {
    analyticData: {
      handler(newData) {
        logger.dev('[MainBodyStatistic] - analyticData обновлены:', newData);
      },
      deep: true,
    },
  },

  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },

  methods: {
    ...mapActions(['updateSettingsData', 'updatePayloadData']),

    // ─── Выделение поля ──────────────────────────────────────────────────────

    isFieldSelected(fieldName) {
      return (
        this.activeSelection?.scheduleId === this.analyticData.id &&
        this.activeSelection?.field === fieldName
      );
    },

    handleClickOutside(event) {
      if (this.$el && !this.$el.contains(event.target)) {
        // сброс activeSelection управляется родителем
      }
    },

    // ─── Редактирование полей ────────────────────────────────────────────────

    editChartType(event) {
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updateStatistics' });

      const currentIndex = CHART_TYPES.indexOf(this.analyticData.chartType);
      const nextType = CHART_TYPES[(currentIndex + 1) % CHART_TYPES.length];

      this.updatePayloadData({
        id: this.analyticData.id,
        value: nextType,
        value_name: 'chartType',
        value_details: '',
      });

      this.$emit('field-selected', { scheduleId: this.analyticData.id, field: 'chartType' });
      this.$emit('edit-analytic', { field: 'chartType', value: nextType });

      logger.dev('[MainBodyStatistic] - editChartType ->', nextType);
    },

    editPeriod(event) {
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updateStatistics' });

      const currentIndex = PERIODS.indexOf(this.analyticData.period);
      const nextPeriod = PERIODS[(currentIndex + 1) % PERIODS.length];

      this.updatePayloadData({
        id: this.analyticData.id,
        value: nextPeriod,
        value_name: 'period',
        value_details: '',
      });

      this.$emit('field-selected', { scheduleId: this.analyticData.id, field: 'period' });
      this.$emit('edit-analytic', { field: 'period', value: nextPeriod });

      logger.dev('[MainBodyStatistic] - editPeriod ->', nextPeriod);
    },

    editAggregation(event) {
      event.stopPropagation();
      this.updateSettingsData({ field: 'request', value: 'updateStatistics' });

      const currentIndex = AGGREGATIONS.indexOf(this.analyticData.aggregation);
      const nextAgg = AGGREGATIONS[(currentIndex + 1) % AGGREGATIONS.length];

      this.updatePayloadData({
        id: this.analyticData.id,
        value: nextAgg,
        value_name: 'aggregation',
        value_details: '',
      });

      this.$emit('field-selected', { scheduleId: this.analyticData.id, field: 'aggregation' });
      this.$emit('edit-analytic', { field: 'aggregation', value: nextAgg });

      logger.dev('[MainBodyStatistic] - editAggregation ->', nextAgg);
    },

    // ─── Удаление ────────────────────────────────────────────────────────────

    deleteAnalyticItem() {
      if (!this.analyticData.id) {
        logger.error('[MainBodyStatistic] - deleteAnalyticItem - нет ID');
        return;
      }

      if (!confirm(`Удалить аналитику ID: ${this.analyticData.id}?\n\nУдаление будет применено после сохранения изменений.`)) return;

      this.$emit('delete-analytic', {
        id: this.analyticData.id,
        analyticData: this.analyticData,
      });

      this.$el.style.opacity = '0.35';
      this.$el.style.pointerEvents = 'none';

      logger.info('[MainBodyStatistic] - deleteAnalyticItem - id:', this.analyticData.id);
    },

    // ─── Форматирование ──────────────────────────────────────────────────────

    formatDate(dateString) {
      return this.dateTimeUtils.formatDate(dateString, 'ru-RU');
    },
  },
};
</script>

<style lang="css" src="../assets/mainStyle.css">
</style>