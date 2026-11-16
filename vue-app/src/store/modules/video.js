// store/modules/video.js
// Видеонаблюдение: список камер (get/videoCameras), последние кадры по камерам
// (push post/videoSnapshot) и подписка на кадры (post/videoSubscribe).
//
// Подписка — какие камеры видны на экране (миниатюры) и какая открыта на полном экране.
// Сервер помнит её, пока открыто соединение: после переподключения websocket/onConnected
// вызывает video/resubscribe. Кадр: { cameraId, title, image (base64), mimeType, size, timestamp }.
import logger from './logger';

const RESPONSES = ['videoCameras', 'videoSnapshot', 'videoSubscribeSuccess'];
const sameSubscription = (a, b) =>
  a && b && a.full === b.full && a.cameras.length === b.cameras.length
  && a.cameras.every((id) => b.cameras.includes(id));

export default {
  namespaced: true,

  state: () => ({
    cameras: [],          // [{ id, title, status, lastFrameAt, previewIntervalMs, fullIntervalMs }]
    camerasLoaded: false,
    snapshots: {},        // cameraId → { image, mimeType, size, timestamp, title }
    lastSnapshotId: null, // для геттера getSnapshot (одна камера, прежний интерфейс)
    desired: null,        // { cameras: [id], full: id | null } — что запросил интерфейс
    accepted: null,       // что подтвердил сервер
  }),

  getters: {
    cameras: (s) => s.cameras,
    camerasLoaded: (s) => s.camerasLoaded,
    hasCameras: (s) => s.cameras.length > 0,
    snapshotOf: (s) => (cameraId) => s.snapshots[cameraId] || null,
    subscription: (s) => s.accepted,
    // Прежний интерфейс одной камеры: последний полученный кадр
    getSnapshot: (s) => (s.lastSnapshotId ? s.snapshots[s.lastSnapshotId] : null),
    hasSnapshot: (s) => !!s.lastSnapshotId,
  },

  mutations: {
    SET_CAMERAS(state, cameras) {
      state.cameras = Array.isArray(cameras) ? cameras : [];
      state.camerasLoaded = true;
    },
    SET_SNAPSHOT(state, payload) {
      const id = payload.cameraId || '_default';
      // Сохраняем только нужные поля, чтобы не тянуть лишнее в память
      state.snapshots = {
        ...state.snapshots,
        [id]: {
          image: payload.image,
          mimeType: payload.mimeType,
          size: payload.size,
          timestamp: payload.timestamp,
          title: payload.title,
        },
      };
      state.lastSnapshotId = id;
    },
    SET_DESIRED(state, sub) { state.desired = sub; },
    SET_ACCEPTED(state, sub) { state.accepted = sub; },
    RESET(state) {
      state.cameras = [];
      state.camerasLoaded = false;
      state.snapshots = {};
      state.lastSnapshotId = null;
      state.desired = null;
      state.accepted = null;
    },
  },

  actions: {
    handleSnapshot({ commit }, payload) {
      if (!payload || !payload.image) {
        logger.warn('[video] - handleSnapshot - пустой payload');
        return;
      }
      // Логируем только размер, чтобы не спамить консоль base64
      logger.dev(`[video] - handleSnapshot - ${payload.cameraId || '—'}: ${payload.size} байт`);
      commit('SET_SNAPSHOT', payload);
    },

    // Ответы type: 'response', относящиеся к видео; true — ответ обработан здесь
    handleResponse({ commit, dispatch }, response) {
      const request = response?.request;
      if (!RESPONSES.includes(request)) return false;
      const payload = response.payload || {};
      if (request === 'videoCameras') commit('SET_CAMERAS', payload.cameras);
      else if (request === 'videoSnapshot') dispatch('handleSnapshot', payload);
      else if (request === 'videoSubscribeSuccess') {
        commit('SET_ACCEPTED', { cameras: payload.cameras || [], full: payload.full ?? null });
      }
      return true;
    },

    async requestCameras({ dispatch, rootGetters }) {
      const dID = rootGetters['dID'];
      if (!dID) return;
      await dispatch('websocket/send', { type: 'get', request: 'videoCameras', name: dID, payload: {} }, { root: true });
    },

    // Подписка: { cameras: [id], full: id | null }. Одинаковая подписка повторно не отправляется.
    async subscribe({ state, commit, dispatch, rootGetters }, { cameras = [], full = null } = {}) {
      const sub = { cameras: [...new Set(cameras)], full: full || null };
      if (sameSubscription(sub, state.desired)) return;
      commit('SET_DESIRED', sub);
      const dID = rootGetters['dID'];
      if (!dID) return;
      try {
        await dispatch('websocket/send', { type: 'post', request: 'videoSubscribe', name: dID, payload: sub }, { root: true });
      } catch (e) {
        logger.warn('[video] - subscribe -', e.message);
      }
    },

    // После переподключения сервер не помнит подписку — отправляем последнюю заново
    async resubscribe({ state, commit, dispatch }) {
      if (!state.desired) return;
      const sub = state.desired;
      commit('SET_DESIRED', null);
      await dispatch('subscribe', sub);
    },
  },
};
