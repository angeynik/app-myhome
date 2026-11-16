<!-- components/CameraCard.vue -->
<!-- Карточка камеры: миниатюра последнего кадра, название, время кадра; «нет сигнала» — кадр устарел -->
<template>
  <div
    class="camera-card"
    :class="{ 'camera-card--offline': offline }"
    role="button"
    tabindex="0"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
  >
    <div class="camera-thumb-wrapper">
      <img v-if="imageSrc" :src="imageSrc" :alt="`Камера: ${title}`" class="camera-thumb" />
      <div v-else class="camera-thumb placeholder">Нет сигнала</div>
    </div>

    <div class="camera-content">
      <div class="camera-title">{{ title }}</div>
      <div class="camera-time">{{ offline && imageSrc ? `Нет сигнала · ${timeUpdated}` : timeUpdated }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CameraCard',
  props: {
    title: { type: String, required: true },
    timeUpdated: { type: String, default: '' },
    imageSrc: { type: String, default: null },
    offline: { type: Boolean, default: false },
  },
  emits: ['click'],
};
</script>
