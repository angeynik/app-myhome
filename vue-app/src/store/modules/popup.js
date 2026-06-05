// store/modules/popup.js
export default {
  namespaced: true,
  state: {
    visible: false,
    message: '',
    type: 'info',
    duration: 3000
  },
  mutations: {
    SHOW(state, { message, type, duration }) {
      console.log('[popup] SHOW mutation, visible = true');
      state.visible = true;
      state.message = message;
      state.type = type || 'info';
      state.duration = duration !== undefined ? duration : 3000;
    },
    HIDE(state) {
      state.visible = false;
      state.message = '';
    }
  },
  actions: {
    show({ commit }, payload) {
      console.trace('[popup] show called with payload:', payload); 
      commit('SHOW', payload);
      // Автоскрытие через duration сработает внутри компонента по watch,
      // но здесь можно предусмотреть дополнительный механизм на случай,
      // если компонент не среагирует.
    },
    hide({ commit }) {
      commit('HIDE');
    }
  },
  getters: {
    popupState: state => ({
      visible: state.visible,
      message: state.message,
      type: state.type,
      duration: state.duration
    })
  }
};