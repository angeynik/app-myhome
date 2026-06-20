// store/modules/dropdown.js
const state = {
  visibleDropdown: false,
  itemsDropdown: [
    { label: 'Профиль',   action: 'profile'  },
    { label: 'Настройки', action: 'settings' },
    { label: 'Выйти',     action: 'logout'   },
  ],
  anchorDropdown: null,
};

const mutations = {
  SHOW(state, { items, anchorElement }) {
    state.visibleDropdown = true;
    if (items) state.itemsDropdown = items;
    state.anchorDropdown = anchorElement;
  },
  HIDE(state) {
    state.visibleDropdown = false;
    state.anchorDropdown = null;
  },
  SET_ITEMS(state, items) {
    state.itemsDropdown = items;
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

// Геттеры с уникальными именами — используются в App.vue через mapGetters.
// Псевдонимы задаются на стороне App.vue, здесь имена «нейтральные».
const getters = {
  isVisible:  (state) => state.visibleDropdown,
  menuItems:  (state) => state.itemsDropdown,
  anchorEl:   (state) => state.anchorDropdown,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};