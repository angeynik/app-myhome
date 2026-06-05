// store/modules/dropdown.js
const state = {
  visible: false,
  items: [
    { label: 'Профиль', action: 'profile' },
    { label: 'Настройки', action: 'settings' },
    { label: 'Выйти', action: 'logout' }
  ],
  anchorElement: null,
};

const mutations = {
  SHOW(state, { items, anchorElement }) {
    state.visible = true;
    if (items) state.items = items;
    state.anchorElement = anchorElement;
  },
  HIDE(state) {
    state.visible = false;
    state.anchorElement = null;
  },
  SET_ITEMS(state, items) {
    state.items = items;
  },
};

const actions = {
  show({ commit }, payload) {
    commit('SHOW', payload);
  },
  hide({ commit }) {
    commit('HIDE');
  },
  setItems({ commit }, items) {
    commit('SET_ITEMS', items);
  },
};

const getters = {
  visible: (state) => state.visible,
  items: (state) => state.items,
  anchorElement: (state) => state.anchorElement,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};