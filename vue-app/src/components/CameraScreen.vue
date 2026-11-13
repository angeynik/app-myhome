<!-- components/CameraScreen.vue -->
<template>
  <Teleport to="body">
    <div v-if="visible" class="camera-screen" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <!-- Шапка -->
      <div class="camera-screen-header">
        <span class="camera-screen-title">{{ title }}</span>
        <button class="setpoint-close" aria-label="Закрыть" @click="$emit('close')">✕</button>
      </div>

      <!-- Изображение -->
      <div class="camera-screen-body" @click.self="$emit('close')">
        <img v-if="imageSrc" :src="imageSrc" alt="Полноэкранное превью" class="camera-screen-img" />
        <div v-else class="camera-screen-placeholder">Ожидание сигнала от камеры...</div>
      </div>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: 'CameraScreen',
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: 'Камера' },
    imageSrc: { type: String, default: null },
  },
  emits: ['close'],
  mounted() {
    window.addEventListener('keydown', this.onKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown);
  },
  methods: {
    onKeydown(event) {
      if (event.key === 'Escape') this.$emit('close');
    },
  },
};
</script>