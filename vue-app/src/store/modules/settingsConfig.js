// store/modules/settingsConfig.js
// Работа с конфигурацией расписаний / уведомлений / аналитики.
// Сами данные хранятся в модуле config (state.config.schedules|notifications|statistics).
import logger from './logger';
import { applyTimePart, parseTimeString, buildTimeString } from '@/utils/timeFieldEditor';
import {
  checkOverlap as checkOverlapUtil,
  checkTimeOverlap as checkTimeOverlapUtil,
} from '@/utils/checkOverlap';

const CONFIG_TYPES = ['schedules', 'notifications', 'statistics'];

function currentSelection(rootGetters) {
  const settingsData = rootGetters['getSetpointsManager']?.settingsData;
  return {
    settingsData,
    dID: settingsData?.name,
    room: settingsData?.payload?.room,
    param: settingsData?.payload?.param,
  };
}

export default {
  namespaced: true,

  state: () => ({
    loading: false,
    error: null,
    permitSchedule: false,
    permitNotifications: false,
    permitStatistics: false,
  }),

  mutations: {
    SET_LOADING(state, value) { state.loading = value; },
    SET_ERROR(state, error) {
      state.error = error;
      if (error) logger.error('[settingsConfig] - SET_ERROR:', error);
    },
    SET_PERMIT_SCHEDULE(state, value) { state.permitSchedule = value; },
    SET_PERMIT_NOTIFICATIONS(state, value) { state.permitNotifications = value; },
    SET_PERMIT_STATISTICS(state, value) { state.permitStatistics = value; },
  },

  actions: {
    // Запрос всех типов настроек с сервера (ответы придут через websocket/handleMessage)
    async initialize({ commit, dispatch, rootGetters }) {
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - initialize - dID не определен');
        return {};
      }

      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        // typeSettingsKey НЕ сбрасываем: модуль config сам нормализует значение
        // (раньше здесь записывалось невалидное 'schedule').
        const results = await Promise.allSettled(
          CONFIG_TYPES.map((configType) => dispatch('requestToServer', { configType })),
        );
        const failed = results.filter((r) => r.status === 'rejected');
        if (failed.length) {
          commit('SET_ERROR', failed[0].reason?.message || 'Не удалось запросить настройки');
        }
      } finally {
        commit('SET_LOADING', false);
      }
      return {};
    },

    async requestToServer({ dispatch, rootGetters }, { configType }) {
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - requestToServer - dID не определен');
        return;
      }
      // await — иначе ошибки отправки терялись (try/catch ничего не ловил)
      await dispatch('websocket/send', {
        type: 'get',
        request: configType,
        name: dID,
      }, { root: true });
    },

    // Список элементов для выбранных комнаты/параметра
    getConfigDataFromStore({ rootState, rootGetters }, { configName }) {
      const { dID, settingsData } = currentSelection(rootGetters);
      const room = settingsData?.payload?.room || localStorage.getItem('roomKey');
      const param = settingsData?.payload?.param || localStorage.getItem('paramKey');

      if (!dID || !room || !param || !CONFIG_TYPES.includes(configName)) return [];

      const list = rootState.config?.[configName]?.[dID]?.[room]?.[param];
      return Array.isArray(list) ? [...list] : [];
    },

    async checkScheduleOverlap({ dispatch }, { startTime, endTime, configName }) {
      if (!startTime || !endTime) {
        return { message: 'Отсутствует startTime или endTime', hasOverlap: false };
      }
      try {
        return await dispatch('checkOverlap', { startTime, endTime, mode: 'new', configName });
      } catch (error) {
        logger.error('[settingsConfig] - checkScheduleOverlap:', error);
        return { message: 'Ошибка при проверке пересечения', hasOverlap: true, error: error.message };
      }
    },

    async addConfigLocally({ rootGetters, rootState, dispatch }, { room, param, configName, configData }) {
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - addConfigLocally - dID не определен');
        return;
      }
      if (!CONFIG_TYPES.includes(configName)) {
        throw new Error(`Неизвестный тип конфигурации: ${configName}`);
      }

      const current = { ...(rootState.config[configName][dID] || {}) };
      current[room] = { ...(current[room] || {}) };
      current[room][param] = [...(current[room][param] || []), configData];

      await dispatch('config/updateScheduleLocally', { dID, configName, configData: current }, { root: true });

      // Резервная копия в localStorage
      try {
        localStorage.setItem(`${dID}_${configName}`, JSON.stringify(current));
      } catch (e) {
        logger.warn('[settingsConfig] - addConfigLocally - localStorage:', e.message);
      }
      return { success: true, configData };
    },

    async deleteConfigItems({ dispatch, rootGetters }, { room, param, configName, configsIds }) {
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - deleteConfigItems - dID не определен');
        return;
      }
      if (!CONFIG_TYPES.includes(configName)) {
        throw new Error(`Неизвестный тип конфигурации: ${configName}`);
      }
      const ids = Array.isArray(configsIds) ? configsIds : [configsIds];

      await dispatch('websocket/send', {
        type: 'post',
        request: `del${configName}`,
        name: dID,
        payload: { room, param, Ids: ids },
      }, { root: true });

      // Убираем из локального состояния — иначе удалённый элемент
      // «воскресал» при повторном открытии настроек до ответа сервера.
      await dispatch('config/removeConfigItemsLocally', { configName, room, param, ids }, { root: true });
      return { success: true };
    },

    async checkOverlap({ dispatch, rootGetters }, { startTime, endTime, configName, valueToCheck, id, value_name, mode }) {
      try {
        const all = await dispatch('getConfigDataFromStore', { configName });
        const { room, param } = currentSelection(rootGetters);
        const existingSchedules = all.filter((s) => s.room === room && s.param === param);

        const params = {
          existingSchedules,
          currentScheduleId: id || null,
          startTime,
          endTime,
          mode: mode || 'new',
          valueToCheck,
          value_name,
        };

        if (mode === 'edit' && id) {
          const current = existingSchedules.find((s) => s.id === id);
          if (current) {
            params.currentStartTime = current.startTime;
            params.currentEndTime = current.endTime;
          }
        }
        return checkOverlapUtil(params);
      } catch (error) {
        logger.error('[settingsConfig] - checkOverlap:', error);
        return { message: 'Ошибка при проверке', hasOverlap: false };
      }
    },

    async checkTimeOverlap({ dispatch, rootGetters }, { valueToCheck, id }) {
      try {
        const { settingsData, room, param } = currentSelection(rootGetters);
        const configName = settingsData?.payload?.config || 'schedules';
        const value_name = settingsData?.payload?.value_name;

        const all = await dispatch('getConfigDataFromStore', { configName });
        const existingSchedules = all.filter((s) => s.room === room && s.param === param);
        const currentSchedule = existingSchedules.find((s) => s.id === id);

        if (!currentSchedule) return { hasOverlap: false, checkedTime: valueToCheck };

        return checkTimeOverlapUtil({
          existingSchedules,
          currentScheduleId: id,
          valueToCheck,
          value_name,
          currentStartTime: currentSchedule.startTime,
          currentEndTime: currentSchedule.endTime,
        });
      } catch (error) {
        logger.error('[settingsConfig] - checkTimeOverlap:', error);
        return { message: 'Ошибка при проверке', hasOverlap: false, checkedTime: valueToCheck };
      }
    },

    // Применяет изменение часов/минут к редактируемому времени с проверкой пересечений
    async settingsConfigUpdate({ dispatch, rootGetters }, { newValue, value_details }) {
      try {
        const settingsData = rootGetters['getSetpointsManager']?.settingsData;
        const value = settingsData?.payload?.value;           // строка "HH:MM"
        const value_name = settingsData?.payload?.value_name;
        const id = settingsData?.payload?.id;
        const dID = settingsData?.name;

        if (!dID || newValue == null || !value || !value_details || !value_name) {
          logger.warn('[settingsConfig] - settingsConfigUpdate - параметры не определены');
          return { updateStatus: false, message: 'Параметры обновления не определены' };
        }

        // Перенос при редактировании минут: MainSetpoint зажимает значение в [0, 59],
        // поэтому переход 59→0 / 0→59 означает перенос часа.
        if (value_details === 'minutes') {
          const { minutes: oldMinutes, hours: oldHours } = parseTimeString(value);
          let carried = null;
          if (oldMinutes === 59 && newValue === 0) {
            carried = oldHours < 23 ? buildTimeString(oldHours + 1, 0) : '23:59';
          } else if (oldMinutes === 0 && newValue === 59) {
            carried = oldHours > 0 ? buildTimeString(oldHours - 1, 59) : '00:00';
          }
          if (carried) {
            await dispatch('updatePayloadData', { value: carried }, { root: true });
            return { updateStatus: true, updatedValue: carried, hasOverlap: false, message: '' };
          }
        }

        const updatedValue = applyTimePart(value, value_details, newValue);
        const overlap = await dispatch('checkTimeOverlap', { valueToCheck: updatedValue, id });
        const checkedTime = overlap.checkedTime ?? updatedValue;

        await dispatch('updatePayloadData', { value: checkedTime }, { root: true });

        return {
          updateStatus: true,
          updatedValue: checkedTime,
          hasOverlap: !!overlap.hasOverlap,
          message: overlap.message,
        };
      } catch (error) {
        logger.error('[settingsConfig] - settingsConfigUpdate:', error);
        return { updateStatus: false, message: 'Ошибка при обновлении', error };
      }
    },

    async saveConfigItems({ rootGetters, dispatch }, { room, param, configName, configData }) {
      const dID = rootGetters['dID'];
      if (!dID) {
        logger.warn('[settingsConfig] - saveConfigItems - dID не определен');
        return;
      }
      await dispatch('websocket/send', {
        type: 'post',
        request: `add${configName}`,
        name: dID,
        payload: { room, param, configData },
      }, { root: true });
      return { success: true };
    },
  },

  getters: {
    getPermitSchedule: (state) => state.permitSchedule,
    getPermitNotifications: (state) => state.permitNotifications,
    getPermitStatistics: (state) => state.permitStatistics,
    isLoading: (state) => state.loading,
    error: (state) => state.error,
  },
};
