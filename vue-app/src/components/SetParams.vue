<template>
  <div style="width: 100%; background-color: #E0DFE7">
    <hr />
    <h1>SetParams</h1>
    <hr />
  </div>
<div>
  <figure class="charger">
  <!-- <svg class="battery-charging" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M15 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.19"></path>
    <line x1="23" y1="13" x2="23" y2="11"></line>
    <polyline class="zap" points="11 6 7 12 13 12 9 18"></polyline>
  </svg> -->
  <svg class="progress" width="100" height="100" viewBox="0 0 100 100">
    <circle class="background" cx="50" cy="50" fill="none" />
    <circle class="ring" cx="50" cy="50" r="50" fill="none" /> 
    <circle class="current" cx="50" cy="50" r="50" fill="none" pathLength="100" />
  </svg>
</figure>

<button id="theme-toggle">Toggle theme</button>
</div>


</template>

<script>
/*
  Only necessary for testing light and dark modes
  Code inspired by web.dev tutorial: https://web.dev/building-a-theme-switch-component/
*/
const storageKey = "theme-preference";
const toggle = document.querySelector("#theme-toggle");

const onClick = () => {
  theme.value = theme.value === "light" ? "dark" : "light";

  setPreference();
};

const getColorPreference = () => {
  if (localStorage.getItem(storageKey)) return localStorage.getItem(storageKey);
  else
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
};

const setPreference = () => {
  localStorage.setItem(storageKey, theme.value);
  reflectPreference();
};

const reflectPreference = () => {
  document.firstElementChild.setAttribute("data-theme", theme.value);

  toggle?.setAttribute("aria-label", theme.value);
};

const theme = {
  value: getColorPreference()
};

reflectPreference();

window.onload = () => {
  reflectPreference();

  toggle.addEventListener("click", onClick);
};

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", ({ matches: isDark }) => {
    theme.value = isDark ? "dark" : "light";
    setPreference();
  });

</script>

<style>
:where(html) {
  --color-bg: hsl(152 10% 100%);
  --color-bg-accent: hsl(152 10% 90%);
  --color-text: hsl(152 78% 0%);
  --color-primary: hsl(152 78% 52%);
}

/* [data-theme="dark"] {
  --color-bg: hsl(217 10% 8%);
  --color-bg-accent: hsl(217 10% 16%);
  --color-text: hsl(60 89% 95%);
  --color-primary: hsl(60 89% 50%);
} */

/* @media (prefers-color-scheme: dark) {
  :where(html:not([data-theme])) {
    --color-bg: hsl(217 10% 8%);
    --color-bg-accent: hsl(217 10% 16%);
    --color-text: hsl(60 89% 95%);
    --color-primary: hsl(60 89% 50%);
  }
} */

* {
  box-sizing: border-box;
}

/* #theme-toggle {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
} */

/* html,
body {
  height: 100%;
} */

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
  --size: clamp(4rem, 35vw, 6rem); /* определяем поведение компонента при скеле экрана  Устанавливает размер элемента 
  с использованием функции clamp, которая ограничивает значение между 6rem и 8rem, но позволяет ему 
  изменяться в пределах 20% ширины окна просмотра.*/

  display: grid;
  grid-template-areas: "canvas"; /* Определяет область сетки с именем “canvas”. */
  gap: 1rem;   /* Устанавливает расстояние между элементами сетки. */
  place-items: center; /* Центрирует элементы внутри сетки по горизонтали и вертикали. */
}

/* .charger > * {
  grid-area: canvas;
} */

.progress {
  --size-offset: 2; /* Устанавливает коэффициент для расчета размера */
  --stroke-width: 10; /*  толщина обводки */
  --color-bar: #4e1414; /* цвет незаполненной части */
  --color-charge: #76c7c0; /* цвет заполненной части */

  width: calc(var(--size) * var(--size-offset));
  height: calc(var(--size) * var(--size-offset));
  overflow: visible; /* Позволяет содержимому выходить за пределы элемента, если оно больше его размеров. */
}

.progress circle {
  stroke-width: var(--stroke-width);
}

.progress .ring {
  stroke: var(--color-bar);
}
/* Контрол анимации заполнения окружности */
.progress .current {
  stroke: var(--color-charge);
  stroke-dasharray: 132;
  stroke-dashoffset: 132;
  stroke-linecap: round;
  rotate: -222deg;
  transform-origin: center;
  animation: charge 30s ease-in-out infinite;
}
/* Новый круг для незаполненной части */
.progress .background {
  stroke: var(--color-bar);
  stroke-width: var(--stroke-width);
}

/* .battery-charging {
  overflow: visible;
  stroke: var(--color);
  width: var(--size);
  height: var(--size);
  transform-origin: center;
} */

/* .battery-charging .zap {
  transform-origin: center;
  stroke-dasharray: 42 21;
  animation: zap 1.2s infinite;
} */

/* @keyframes fade-in {
  from {
    opacity: 0;
    scale: 0.6;
  }
  to {
    opacity: 1;
    scale: 1;
  }
} */

/* @keyframes charge {
  2% {
    stroke-dashoffset: 60;
    animation-timing-function: linear;
  }
  100% {
    stroke-dashoffset: 0;
  }
} */

/* @keyframes zap {
  10% {
    translate: 0 1px;
  }
  25% {
    stroke: var(--color-charge);
  }
  40% {
    stroke: var(--color);
  }
  80%,
  100% {
    stroke-dashoffset: -42;
  }
} */

@media (prefers-reduced-motion) {
  .battery-charging .zap {
    animation-duration: 10s;
  }

  @keyframes zap {
    50% {
      stroke: var(--color-charge);
    }
  }
}

/* Fade in elements on page load */
@media (prefers-reduced-motion: no-preference) {
  .progress,
  .battery-charging {
    --init-duration: 800ms;
    --init-delay: 200ms;

    opacity: 0;
    animation: fade-in var(--init-duration) var(--init-delay)
      cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .battery-charging {
    --init-delay: 300ms;
  }

  .progress .current {
    animation-delay: var(--init-delay);
  }
}

</style>
