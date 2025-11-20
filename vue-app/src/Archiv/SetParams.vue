<template>
  <div style="width: 100%; background-color: #E0DFE7">
    <hr />
    <h1>SetParams</h1>
    <hr />
  </div>
  <div>
    <figure class="charger">
      <svg class="progress" width="100" height="100" viewBox="0 0 100 100">
        <circle class="background" cx="50" cy="50" fill="none" />
        <circle class="ring" cx="50" cy="50" r="50" fill="none" />
        <circle class="current" cx="50" cy="50" r="50" fill="none" :stroke-dashoffset="strokeDashoffset" pathLength="100" :class="{ 'no-animation': !animationActive }" />
      </svg>
    </figure>
  </div>
</template>


<script>
export default {
  data() {
    return {
      a: 10, // Начало диапазона
      b: 100, // Окончание диапазона
      c: 12, // Значение в рамках диапазона
      progress: 0,
      animationActive: true, // Флаг для управления анимацией
    };
  },
  created() {
    this.updateProgress();
  },
  computed: {
    strokeDashoffset() {
      const range = this.b - this.a;
      const progress = ((this.c - this.a) / range) * 100;
      return 132 - (132 * progress) / 100;
    },
    isComplete() {
      return this.c >= this.b;
    }
  },
  watch: {
    a: 'updateProgress',
    b: 'updateProgress',
    c: 'updateProgress',
    progress(newVal) {
      if (newVal >= this.c) {
        this.stopAnimation();
      }
    }
  },
  methods: {
    updateProgress() {
      const range = this.b - this.a;
      this.progress = ((this.c - this.a) / range) * 100;
    },
    stopAnimation() {
      // Логика для остановки анимации
      const currentCircle = this.$el.querySelector('.current');
      if (currentCircle) {
        currentCircle.style.animation = 'none';
      }
    }
  }
};
</script>


<style>
:where(html) {
  --color-bg: hsl(152 10% 100%);
  --color-accent: hwb(112 6% 9%);
  --color-bg-accent: hwb(112 2% 56%);
  --color-text: hsl(152 78% 0%);
}

* {
  box-sizing: border-box;
}

body {
  display: grid;
  place-items: center;
  color: var(--color-text);
  background-color: var(--color-bg);
  font-family: system-ui;
}

.charger {
  --color: currentcolor;
  --color-bar: var(--color-bg-accent);
  --color-charge: var(--color-primary);
  --size: clamp(4rem, 35vw, 6rem);
  display: grid;
  grid-template-areas: "canvas";
  gap: 1rem;
  place-items: center;
}

.charger > * {
  grid-area: canvas;
}

.progress {
  --size-offset: 2;
  --stroke-width: 10;
  --color-bar: var(--color-bg-accent);
  --color-charge: var(--color-accent);
  width: calc(var(--size) * var(--size-offset));
  height: calc(var(--size) * var(--size-offset));
  overflow: visible;
}

.progress circle {
  stroke-width: var(--stroke-width);
}

.progress .ring {
  stroke: var(--color-bar);
}

.progress .current {
  stroke: var(--color-charge);
  stroke-dasharray: 134;
  stroke-linecap: round;
  rotate: -222deg;
  transform-origin: center;
  animation: charge 10s ease-in-out infinite;
}

.progress .current.no-animation {
  animation: none;
}

.progress .background {
  stroke: var(--color-bg-accent);
  stroke-width: var(--stroke-width);
  stroke-dasharray: 132;
  stroke-linecap: round;
  rotate: -220deg;
  transform-origin: center;
}



@keyframes charge {
  0% {
    stroke-dashoffset: 132;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .progress {
    --init-duration: 200ms;
    --init-delay: 100ms;
    opacity: 0;
    animation: fade-in var(--init-duration) var(--init-delay) cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .progress .current {
    animation-delay: var(--init-delay);
  }
}
@media (prefers-reduced-motion) {
  @keyframes zap {
    90% {
      stroke: var(--color-charge);
    }
  }
}
</style>
