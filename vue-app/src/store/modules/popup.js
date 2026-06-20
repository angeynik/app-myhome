// store/modules/popup.js
export default {
  namespaced: true,
  state: {
    visiblePopup:  false,
    messagePopup:  '',
    typePopup:     'info',
    durationPopup: 4000
  },
  mutations: {
    SHOW(state, { message, type, duration }) {
      console.log('[popup] SHOW mutation, visiblePopup = true');
      state.visiblePopup  = true;
      state.messagePopup  = message;
      state.typePopup     = type || 'info';
      state.durationPopup = duration !== undefined ? duration : 3000;
    },
    HIDE(state) {
      state.visiblePopup = false;
      state.messagePopup = '';
    }
  },
  actions: {
    show({ commit }, payload) {
      console.trace('[popup] show called with payload:', payload);
      commit('SHOW', payload);
    },
    hide({ commit }) {
      commit('HIDE');
    }
  },
  getters: {
    // Составной геттер — для обратной совместимости
    popupState: (state) => ({
      visiblePopup:  state.visiblePopup,
      messagePopup:  state.messagePopup,
      typePopup:     state.typePopup,
      durationPopup: state.durationPopup,
    }),

    // Индивидуальные геттеры с префиксом popup
    popupIsVisible:  (state) => state.visiblePopup,
    popupMessage:    (state) => state.messagePopup,
    popupType:       (state) => state.typePopup,
    popupDuration:   (state) => state.durationPopup,
  }
};