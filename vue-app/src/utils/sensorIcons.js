// src/utils/sensorIcons.js
// Соответствие ключей конфигурации (dTemp02, aFan01, sTemp…) именам иконок спрайта
// (components/SensorIconSprite.vue, id вида "si-<имя>").

export const FALLBACK_ICON = 'unknown';

export const SENSOR_ICON_BY_KEY = {
  // датчики
  dTemp: 'thermometer',
  dHum: 'humidity',
  dPress: 'gauge',
  dPower: 'bolt',
  dEnergy: 'energy',
  dMove: 'motion',
  dFire: 'flame',
  dLeak: 'leak',
  dFrequency: 'wave',
  dVoltage: 'voltage',
  dCurrent: 'current',
  dBat: 'battery',
  dStatus: 'pulse',
  dMode: 'sliders',
  dConnect: 'wifi',
  dErrStat: 'warning',
  dErrCode: 'error-code',
  // актуаторы
  aLamp: 'bulb',
  aFan: 'fan',
  aPump: 'pump',
  aValve: 'valve',
  aRelay: 'relay',
  aActuator: 'actuator',
  aSwitch: 'toggle',
  aController: 'chip',
  // уставки
  sTemp: 'thermometer-sp',
  sHum: 'humidity-sp',
  sActuator: 'actuator-sp',
  sSwitch: 'toggle-sp',
  dCurSetpoint: 'target',
  // вентилятор
  dFanSp: 'fan-speed',
  dFanMode: 'fan-mode',
};

// Все имена иконок спрайта (для проверок и каталога)
export const ICON_NAMES = [...new Set([...Object.values(SENSOR_ICON_BY_KEY), FALLBACK_ICON])];

// Серверные ключи содержат кириллическую «С» (dСurrent): приводим к латинице
function normalize(key) {
  return String(key ?? '')
    .replace(/\u0421/g, 'C')
    .replace(/\u0441/g, 'c')
    .replace(/\d+$/, ''); // dTemp02 → dTemp
}

/**
 * Имя иконки по ключу конфигурации или по имени иконки.
 *   resolveSensorIcon('dTemp02') → 'thermometer'
 *   resolveSensorIcon('dСurrent') → 'current'      (кириллическая «С»)
 *   resolveSensorIcon('fan')      → 'fan'           (имя иконки)
 *   resolveSensorIcon('xyz')      → 'unknown'
 */
export function resolveSensorIcon(key) {
  if (ICON_NAMES.includes(key)) return key;
  return SENSOR_ICON_BY_KEY[normalize(key)] || FALLBACK_ICON;
}
