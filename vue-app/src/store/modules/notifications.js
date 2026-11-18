// store/modules/notifications.js
// Уведомления по условиям (docs/notifications.md):
//   items    — конфигурация уведомлений dID: { "<room>:<section>:<item>": item } (response 'notification')
//   statuses — статусы: { id: { status: 'ON'|'OFF', read: 'ON'|'OFF', eventId, since, value, text,
//              channel, attachments } } (response 'notificationStatus', post 'notificationEvent')
//   editor   — экран настройки уведомления (NotificationScreen.vue)
//
// Флаг «прочитано» живёт только на клиенте: сервер всегда хранит read: 'OFF'. Прочитанные события
// запоминаются в localStorage (ключ notificationsRead:<dID> → { id: eventId }), чтобы окно
// не показывалось снова после перезагрузки. Сброс (OFF) снимает и статус, и флаг прочтения.
import logger from './logger';

const RESPONSES = ['notification', 'notificationStatus', 'notificationSnapshot', 'notificationSuccess'];
const readKey = (dID) => `notificationsRead:${dID}`;

export const OPS = [
  { op: 'gt', sign: '>', label: 'больше' },
  { op: 'lt', sign: '<', label: 'меньше' },
  { op: 'eq', sign: '=', label: 'равно' },
  { op: 'gte', sign: '≥', label: 'больше или равно' },
  { op: 'lte', sign: '≤', label: 'меньше или равно' },
  { op: 'ne', sign: '≠', label: 'не равно' },
];

export const CHANNELS = [
  { value: 'web', label: 'Веб' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'both', label: 'Веб + Telegram' },
];

export const notificationId = (room, section, item) => `${room}:${section}:${item}`;
export const showsInWeb = (channel) => !channel || channel === 'web' || channel === 'both';

function loadReadMap(dID) {
  if (!dID) return {};
  try {
    return JSON.parse(localStorage.getItem(readKey(dID))) || {};
  } catch {
    return {};
  }
}

function saveReadMap(dID, map) {
  if (!dID) return;
  try {
    localStorage.setItem(readKey(dID), JSON.stringify(map));
  } catch (e) {
    logger.warn('[notifications] localStorage:', e.message);
  }
}

const initialState = () => ({
  items: {},
  itemsLoaded: false,     // сервер прислал конфигурацию (нет файла — не присылает)
  statuses: {},
  editor: { open: false, target: null },
  snapshots: {},          // `${id}|${cameraId}` → { image, mimeType, timestamp, title }
});

export default {
  namespaced: true,
  state: initialState,

  mutations: {
    SET_ITEMS(state, items) {
      state.items = items && typeof items === 'object' ? items : {};
      state.itemsLoaded = true;
    },
    SET_STATUSES(state, statuses) { state.statuses = statuses; },
    SET_STATUS(state, { id, entry }) { state.statuses = { ...state.statuses, [id]: entry }; },
    SET_READ(state, id) {
      if (state.statuses[id]) state.statuses = { ...state.statuses, [id]: { ...state.statuses[id], read: 'ON' } };
    },
    OPEN_EDITOR(state, target) { state.editor = { open: true, target }; },
    CLOSE_EDITOR(state) { state.editor = { open: false, target: null }; },
    SET_SNAPSHOT(state, snap) {
      state.snapshots = { ...state.snapshots, [`${snap.id}|${snap.cameraId}`]: snap };
    },
    CLEAR_SNAPSHOTS(state, id) {
      state.snapshots = Object.fromEntries(Object.entries(state.snapshots).filter(([k]) => !k.startsWith(`${id}|`)));
    },
    RESET(state) { Object.assign(state, initialState()); },
  },

  actions: {
    // Ответы сервера модуля уведомлений; true — обработан здесь
    handleResponse({ commit, rootGetters }, response) {
      const request = response?.request;
      if (!RESPONSES.includes(request)) return false;
      const payload = response.payload || {};
      if (request === 'notification') {
        commit('SET_ITEMS', payload);
      } else if (request === 'notificationStatus') {
        // read: сервер всегда 'OFF' — берём из локальной памяти, если это то же событие
        const readMap = loadReadMap(rootGetters.dID);
        const statuses = {};
        for (const [id, entry] of Object.entries(payload)) {
          const read = entry?.status === 'ON' && entry.eventId && readMap[id] === entry.eventId;
          statuses[id] = { ...entry, read: read ? 'ON' : 'OFF' };
        }
        commit('SET_STATUSES', statuses);
      } else if (request === 'notificationSnapshot') {
        if (payload.id && payload.cameraId && payload.image) commit('SET_SNAPSHOT', payload);
      }
      return true;
    },

    // post/notificationEvent: событие (ON) или сброс (OFF)
    handleEvent({ commit, rootGetters }, payload) {
      const id = payload?.id;
      if (!id || !['ON', 'OFF'].includes(payload.status)) return;
      const entry = {
        status: payload.status,
        read: 'OFF',
        eventId: payload.eventId || null,
        since: payload.time,
        value: payload.value ?? null,
        text: payload.text || '',
        channel: payload.channel,
        attachments: payload.attachments || [],
      };
      if (payload.status === 'OFF') {
        const map = loadReadMap(rootGetters.dID);
        if (map[id]) {
          delete map[id];
          saveReadMap(rootGetters.dID, map);
        }
        // В том числе reason 'removed' (условие удалено): статус и «прочитано» → OFF, обводка снимается
        commit('CLEAR_SNAPSHOTS', id);
      }
      commit('SET_STATUS', { id, entry });
    },

    // Пользователь закрыл окно уведомления
    markRead({ state, commit, rootGetters }, id) {
      const entry = state.statuses[id];
      if (!entry) return;
      commit('SET_READ', id);
      if (entry.eventId) {
        const map = loadReadMap(rootGetters.dID);
        map[id] = entry.eventId;
        saveReadMap(rootGetters.dID, map);
      }
    },

    openEditor({ commit }, target) { commit('OPEN_EDITOR', target); },
    closeEditor({ commit }) { commit('CLOSE_EDITOR'); },

    // action: 'create' | 'edit' | 'delete'; configData — поля уведомления (для delete — room/section/item)
    async save({ dispatch, rootGetters }, { action, configData }) {
      const dID = rootGetters.dID;
      if (!dID) return;
      await dispatch('websocket/send', {
        type: 'post', request: 'notification', name: dID, payload: { action, configData },
      }, { root: true });
    },

    // error/notificationSnapshotError { id, cameraId } — кадр не получен
    snapshotFailed({ commit }, { id, cameraId } = {}) {
      if (id && cameraId) commit('SET_SNAPSHOT', { id, cameraId, failed: true });
    },

    async requestSnapshot({ state, dispatch, rootGetters }, { id, cameraId }) {
      const dID = rootGetters.dID;
      const known = state.snapshots[`${id}|${cameraId}`];
      if (!dID || (known && !known.failed)) return;
      await dispatch('websocket/send', {
        type: 'get', request: 'notificationSnapshot', name: dID, payload: { id, cameraId },
      }, { root: true });
    },
  },

  getters: {
    items: (state) => state.items,
    itemOf: (state) => (id) => state.items[id] || null,
    statusOf: (state) => (id) => state.statuses[id] || null,
    isActive: (state) => (id) => state.statuses[id]?.status === 'ON',
    editor: (state) => state.editor,
    snapshotOf: (state) => (id, cameraId) => state.snapshots[`${id}|${cameraId}`] || null,

    // Непрочитанные активные уведомления для окна: сначала самые свежие
    unread: (state) => Object.entries(state.statuses)
      .filter(([id, e]) => e.status === 'ON' && e.read !== 'ON' && showsInWeb(e.channel ?? state.items[id]?.channel))
      .map(([id, e]) => ({ id, ...e, item: state.items[id] || null }))
      .sort((a, b) => String(b.since || '').localeCompare(String(a.since || ''))),
  },
};
