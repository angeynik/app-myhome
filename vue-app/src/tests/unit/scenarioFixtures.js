// Общие данные тестов сценариев: конфигурация dID (как <dID>.json сервера) и её точки.
import { pointOptions } from '@/utils/scenarioModel';

export const CONFIG = {
  init: { limits: {} },
  common: { title: 'Общие', sensors: { dX01: { value: 1 } } },
  room01: {
    title: 'Гостиная',
    _meta: { 'sensors|dTemp01': { title: 'Температура в зале' } },
    sensors: { dTemp01: { value: 21.5, type: 'num' }, dHum01: { value: 45, type: 'num' }, aLamp01: { value: 'OFF', type: 'bool' } },
    setpoints: { sLamp01: { value: false, type: 'bool' } },
  },
  room02: {
    title: 'Котельная',
    sensors: { dTemp02: { value: 19, type: 'num' }, dPower01: { value: 300 } },
    setpoints: { sTemp02: { value: 21, type: 'num' } },
    system: { aPump01: { value: true, type: 'bool' } },
  },
};

const TITLES = { dHum01: 'Влажность', aLamp01: 'Свет', sLamp01: 'Свет (уставка)', dTemp02: 'Температура', dPower01: 'Мощность', sTemp02: 'Уставка', aPump01: 'Насос' };
export const titleOf = (k) => TITLES[k] || k;
export const unitOf = (k) => (/Temp/.test(k) ? '°C' : /Hum/.test(k) ? '%' : /Power/.test(k) ? 'Вт' : '');
export const POINTS = pointOptions(CONFIG, { titleOf, unitOf });
