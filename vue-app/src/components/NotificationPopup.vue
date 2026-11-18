<!-- components/NotificationPopup.vue -->
<!-- Окно уведомлений: активные (ON) непрочитанные уведомления с каналом «веб», по одному,
     начиная с самого свежего. Закрыть может только пользователь — флаг «прочитано» = ON
     (notifications/markRead), затем показывается следующее. Кадры камер запрашиваются
     у сервера при показе (get/notificationSnapshot). Подключается в App.vue. -->
<template>
  <div v-if="current" class="popup-overlay notification-popup" @click.self="close">
    <div class="popup-content popup-error" role="alertdialog" aria-live="assertive" :aria-label="title">
      <div class="popup-header">
        <span class="popup-title">{{ title }}</span>
        <span v-if="unread.length > 1" class="notification-popup-count">1 из {{ unread.length }}</span>
        <button class="popup-close" aria-label="Закрыть" @click="close">×</button>
      </div>
      <div class="popup-message">
        <p class="notification-popup-text">{{ current.text || place }}</p>
        <p class="notification-popup-time">{{ time }}</p>
        <div v-if="current.attachments && current.attachments.length" class="notification-popup-shots">
          <figure v-for="a in current.attachments" :key="a.cameraId">
            <img v-if="shot(a.cameraId)" :src="shot(a.cameraId)" :alt="`Камера: ${a.title}`" />
            <div v-else-if="shotFailed(a.cameraId)" class="notification-popup-shot-wait">Кадр недоступен</div>
            <div v-else class="notification-popup-shot-wait">Загрузка кадра…</div>
            <figcaption>{{ a.title }}</figcaption>
          </figure>
        </div>
      </div>
      <div class="popup-footer">
        <button class="popup-ok-button" data-test="close" @click="close">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import logger from '@/store/modules/logger.js';

export default {
  name: 'NotificationPopup',

  computed: {
    ...mapGetters('notifications', ['unread', 'snapshotOf']),

    current() {
      return this.unread[0] || null;
    },
    title() {
      const item = this.current?.item;
      return item ? `Уведомление: ${item.title || item.item}` : 'Уведомление';
    },
    place() {
      const item = this.current?.item;
      return item ? [item.roomTitle || item.group, item.title].filter(Boolean).join(' · ') : '';
    },
    time() {
      if (!this.current?.since) return '';
      return new Date(this.current.since).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    },
  },

  watch: {
    // Показано новое уведомление — запросить его кадры
    'current.eventId': {
      immediate: true,
      handler() {
        const c = this.current;
        if (!c) return;
        for (const a of c.attachments || []) {
          this.$store.dispatch('notifications/requestSnapshot', { id: c.id, cameraId: a.cameraId })
            .catch((e) => logger.warn('[NotificationPopup] кадр:', e.message));
        }
      },
    },
  },

  methods: {
    shot(cameraId) {
      const s = this.snapshotOf(this.current.id, cameraId);
      return s && !s.failed ? `data:${s.mimeType};base64,${s.image}` : null;
    },
    shotFailed(cameraId) {
      return !!this.snapshotOf(this.current.id, cameraId)?.failed;
    },
    close() {
      if (this.current) this.$store.dispatch('notifications/markRead', this.current.id);
    },
  },
};
</script>
