<!-- ConFiguration.vue — Раздел настроек системы -->
<template>
  <div class="app">
    <!-- Здесь будет header аналогичный DashBoard, добавить по аналогии -->
    <div class="configuration-placeholder">
      <h2>Configuration</h2>
      <p>Раздел в разработке</p>
    </div>
  </div>
</template>

<script>
import logger from '@/store/modules/logger.js';

export default {
  name: 'Configuration',

  mounted() {
    logger.info('[Configuration] - mounted - Раздел Configuration загружен');
  },
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>