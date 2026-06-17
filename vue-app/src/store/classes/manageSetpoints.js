// store/classes/manageSetpoints.js

import { nowMoscow } from '@/utils/timeUtils';
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
                room: null,
                key: null,
                param: null,
                value: null,
                id: null,
                updated: nowMoscow()
            },
            limits: {
              limHigh: null,
              limLow: null,
              limStep: null,
              updated: nowMoscow()
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
            key: null,
            param: '',
            value: '',
            value_name: '',
            value_type: 'absolute',
            id: null,
            updated: nowMoscow()
        };
    }
    // updatePayload(data) {
    //     this.settingsData.payload = {
    //         ...this.settingsData.payload,
    //         ...data,
    //         updated: nowMoscow()
    //     };
    // }
    updateSettingsData(data) {
        const { request, type, payload } = data;
        
        if (request !== undefined) {
            this.settingsData.request = request;
        }
        
        if (type !== undefined) {
            this.settingsData.type = type;
        }
        
        if (payload) {
            this.settingsData.payload = {
                ...this.settingsData.payload,
                ...payload,
                updated: nowMoscow()
            };
        }
    }


}