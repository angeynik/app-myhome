export default {
    namespaced: true,
    state: () => ({
      commonConfig: (() => {
        try {
          const storedConfig = localStorage.getItem('commonConfig')
          return storedConfig ? JSON.parse(storedConfig) : {}
        } catch (error) {
          console.error('Ошибка парсинга конфига:', error)
          return {}
        }
      })()
    }),
    mutations: {
      SET_COMMON_CONFIG(state, config) {
        state.commonConfig = config
        try {
          localStorage.setItem('commonConfig', JSON.stringify(config))
        } catch (error) {
          console.error('Ошибка сохранения конфига:', error)
        }
      },
      UPDATE_COMMON_CONFIG(state, { key, value }) {
        state.commonConfig = {
          ...state.commonConfig,
          [key]: value
        }
        try {
          localStorage.setItem('commonConfig', JSON.stringify(state.commonConfig))
        } catch (error) {
          console.error('Ошибка обновления конфига:', error)
        }
      }
    },
    actions: {
      async fetchCommonConfig({ commit }) {
        try {
          const response = await fetch('/api/config/common')
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
          
          const config = await response.json()
          if (!config || typeof config !== 'object') {
            throw new Error('Некорректный формат конфигурации')
          }
          
          commit('SET_COMMON_CONFIG', config)
          return config
        } catch (error) {
          console.error('Ошибка загрузки конфига:', error)
          commit('SET_COMMON_CONFIG', {}) // Сброс конфига при ошибке
          throw error
        }
      }
    },
    getters: {
      getCommonConfig: state => state.commonConfig,
      getRoomConfig: state => roomKey => state.commonConfig[roomKey] || {},
      getSensorConfig: (state) => (roomKey, sensorKey) => {
        return state.commonConfig[roomKey]?.sensors?.[sensorKey] || {}
      }
    }
  }