<!-- components/CameraCard.vue -->
<template>
  <div class="camera-card" @click="$emit('click')">
    <!-- Левая часть: Превью -->
    <div class="camera-thumb-wrapper">
      <img v-if="imageSrc" :src="imageSrc" alt="Превью камеры" class="camera-thumb" />
      <div v-else class="camera-thumb placeholder">Нет сигнала</div>
    </div>

    <!-- Правая часть: Информация -->
    <div class="camera-content">
      <div class="camera-title">{{ title }}</div>
      <div class="camera-time">{{ timeUpdated }}</div>
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
  },
  emits: ['click'],
};
</script>