// store/modules/popup.js
// Таймер автозакрытия живёт здесь (а не в компоненте), поэтому каждый новый
// popup корректно перезапускает отсчёт, даже если предыдущий ещё не закрыт.

const DEFAULT_DURATION = 3000;
let hideTimer = null;

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

export default {
  namespaced: true,

  state: () => ({
    visiblePopup: false,
    messagePopup: '',
    typePopup: 'info',
    durationPopup: DEFAULT_DURATION,
  }),

  mutations: {
    SHOW(state, { message, type, duration }) {
      state.visiblePopup = true;
      state.messagePopup = message;
      state.typePopup = type || 'info';
      state.durationPopup = duration !== undefined ? duration : DEFAULT_DURATION;
    },
    HIDE(state) {
      state.visiblePopup = false;
      state.messagePopup = '';
    },
  },

  actions: {
    show({ commit, state }, payload) {
      if (!payload?.message) return;
      clearHideTimer();
      commit('SHOW', payload);
      const duration = state.durationPopup;
      if (duration > 0) {
        hideTimer = setTimeout(() => {
          hideTimer = null;
          commit('HIDE');
        }, duration);
      }
    },
    hide({ commit }) {
      clearHideTimer();
      commit('HIDE');
    },
  },

  getters: {
    popupState: (state) => ({
      visiblePopup: state.visiblePopup,
      messagePopup: state.messagePopup,
      typePopup: state.typePopup,
      durationPopup: state.durationPopup,
    }),
    popupIsVisible: (state) => state.visiblePopup,
    popupMessage:   (state) => state.messagePopup,
    popupType:      (state) => state.typePopup,
    popupDuration:  (state) => state.durationPopup,
  },
};
