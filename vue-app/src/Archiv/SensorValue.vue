Отправлено пользователем Copilot:
CSS-анимации позволяют создавать плавные переходы между состояниями элементов. Одним из полезных свойств для управления анимацией является animation-fill-mode. Это свойство определяет, как стили анимации применяются к элементу до и после её выполнения.
Основные значения animation-fill-mode:
none: Анимация не будет применять стили к элементу до и после её выполнения.
forwards: Элемент сохранит стили последнего ключевого кадра после завершения анимации.
backwards: Элемент применит стили первого ключевого кадра до начала анимации (во время задержки animation-delay).
both: Анимация будет вести себя как при значениях forwards и backwards.
Пример использования в Vue 3
Рассмотрим пример, где элемент заполняется цветом в зависимости от значения:
HTML

<template>
  <div class="progress-bar" :style="{ width: progress + '%' }"></div>
</template>

<script>
export default {
  data() {
    return {
      progress: 0
    };
  },
  mounted() {
    this.animateProgress();
  },
  methods: {
    animateProgress() {
      this.progress = 100;
    }
  }
};
</script>

<style scoped>
.progress-bar {
  height: 30px;
  background-color: lightblue;
  animation: fill 2s forwards;
}

@keyframes fill {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}
</style>