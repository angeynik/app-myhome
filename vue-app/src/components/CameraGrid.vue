<!-- components/CameraGrid.vue -->
<!-- Вкладка «Видеонаблюдение»: сетка до 16 камер и полноэкранный просмотр.
     Подписка на кадры (video/subscribe) следует за экраном: миниатюры — только карточки,
     видимые в окне (IntersectionObserver), полный экран — открытая камера. Уход с вкладки —
     пустая подписка, кадры не идут. -->
<template>
  <div class="mainBody camera-grid-page">
    <p v-if="!cameras.length" class="mainBody-empty">{{ camerasLoaded ? emptyText : 'Загрузка…' }}</p>
    <section v-else class="room-group">
      <div class="room-group-header">
        <span class="room-group-title">Видеонаблюдение</span>
        <span class="room-group-count">{{ cameras.length }}</span>
      </div>
      <div class="camera-grid">
        <CameraCard
          v-for="cam in cameras"
          :key="cam.id"
          :data-camera-id="cam.id"
          :title="cam.title"
          :imageSrc="imageSrc(cam.id)"
          :timeUpdated="frameTime(cam.id)"
          :offline="isStale(cam)"
          @click="openFull(cam.id)"
        />
      </div>
    </section>

    <CameraScreen
      :visible="!!fullId"
      :title="fullCamera ? fullCamera.title : ''"
      :imageSrc="fullId ? imageSrc(fullId) : null"
      @close="closeFull"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import CameraCard from './CameraCard.vue';
import CameraScreen from './CameraScreen.vue';
import logger from '../store/modules/logger.js';

const SYNC_DELAY = 250;          // объединяем частые изменения видимости в одну подписку
const CLOCK_TICK = 5000;         // пересчёт «нет сигнала»
const STALE_MIN_MS = 15000;      // кадр старше max(3 интервала, 15 с) — «нет сигнала»

export default {
  name: 'CameraGrid',
  components: { CameraCard, CameraScreen },

  props: {
    emptyText: { type: String, default: 'Камеры не настроены' },
  },

  data() {
    return {
      visibleIds: [],
      fullId: null,
      now: Date.now(),
      observer: null,
      syncTimer: null,
      clockTimer: null,
    };
  },

  computed: {
    ...mapGetters('video', ['cameras', 'camerasLoaded', 'snapshotOf']),
    ...mapGetters(['dID']),

    fullCamera() {
      return this.cameras.find((c) => c.id === this.fullId) || null;
    },
  },

  watch: {
    // Список камер пришёл или изменился — наблюдаем за новыми карточками
    cameras() {
      this.$nextTick(this.observeCards);
    },
  },

  mounted() {
    this.clockTimer = setInterval(() => { this.now = Date.now(); }, CLOCK_TICK);
    this.$store.dispatch('video/requestCameras').catch((e) => {
      logger.error('[CameraGrid] - mounted - список камер:', e.message);
    });
    this.observeCards();
  },

  beforeUnmount() {
    clearInterval(this.clockTimer);
    clearTimeout(this.syncTimer);
    if (this.observer) this.observer.disconnect();
    // Ушли с вкладки — кадры не нужны
    this.$store.dispatch('video/subscribe', { cameras: [], full: null });
  },

  methods: {
    imageSrc(id) {
      const snap = this.snapshotOf(id);
      return snap ? `data:${snap.mimeType};base64,${snap.image}` : null;
    },

    // Время кадра по МСК
    frameTime(id) {
      const snap = this.snapshotOf(id);
      if (!snap) return 'Ожидание кадра…';
      return new Date(snap.timestamp).toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow' });
    },

    isStale(cam) {
      const snap = this.snapshotOf(cam.id);
      if (!snap) return cam.status === 'offline';
      const limit = Math.max((cam.previewIntervalMs || 5000) * 3, STALE_MIN_MS);
      return this.now - snap.timestamp > limit;
    },

    // Подписка на миниатюры только видимых карточек. Без IntersectionObserver — на все.
    observeCards() {
      if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') {
        this.visibleIds = this.cameras.map((c) => c.id);
        this.scheduleSync();
        return;
      }
      if (!this.observer) {
        this.observer = new window.IntersectionObserver((entries) => {
          const visible = new Set(this.visibleIds);
          entries.forEach((e) => {
            const id = e.target.dataset.cameraId;
            if (e.isIntersecting) visible.add(id);
            else visible.delete(id);
          });
          this.visibleIds = [...visible];
          this.scheduleSync();
        });
      }
      this.observer.disconnect();
      (this.$el?.querySelectorAll?.('[data-camera-id]') || []).forEach((el) => this.observer.observe(el));
    },

    scheduleSync() {
      clearTimeout(this.syncTimer);
      this.syncTimer = setTimeout(this.syncSubscription, SYNC_DELAY);
    },

    syncSubscription() {
      this.syncTimer = null;
      const known = new Set(this.cameras.map((c) => c.id));
      this.$store.dispatch('video/subscribe', {
        cameras: this.visibleIds.filter((id) => known.has(id)),
        full: this.fullId,
      });
    },

    openFull(id) {
      this.fullId = id;
      this.syncSubscription();
    },

    closeFull() {
      this.fullId = null;
      this.syncSubscription();
    },
  },
};
</script>
