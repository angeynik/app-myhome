// src/utils/tone.js
// Тон значения уставки относительно фактического — общий для плашки (MainBodyValue)
// и экрана изменения значения (SetpointScreen), чтобы они всегда красились одинаково.
//   'is-warm' — уставка выше факта (нагрев, жёлтый)
//   'is-cool' — уставка ниже факта (охлаждение, синий)
//   ''        — нет данных, булево значение или значения равны (нейтральный)

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN; // null, undefined, boolean, ''
}

export function getTone(setValue, actualValue) {
  const set = toNumber(setValue);
  const cur = toNumber(actualValue);
  if (!Number.isFinite(set) || !Number.isFinite(cur) || set === cur) return '';
  return set > cur ? 'is-warm' : 'is-cool';
}
