// store/classes/manageSetpoints.js
export default class ManageSetpoints {
    constructor(dID, config) {
        if (!dID || !config) {
            throw new Error('[ManageSetpointsъ - Инициализация - dID или config не определены');
        }
        this.settingsData = {
            name: dID,
            type: '',
            request: '',
            payload: {
                config: config,
                room: '',
                param: '',
                value: '',
                value_name: '',
                id: null,
                updated: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
            }
        };
    }
    getState() {
    return {
      settingsData: this.settingsData,
    }
  }
    resetPayload() {
        this.settingsData.payload = {
            config: '',
            room: '',
            param: '',
            value: '',
            value_name: '',
            id: null,
            updated: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
        };
    }
    updatePayload(data) {
        this.settingsData.payload = {
            ...this.settingsData.payload,
            ...data,
            updated: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
        };
    }

}