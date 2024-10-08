<template>
    <div class="container">
      <!-- <div class="control"
        :class="borderColor"
        @click="toggleTempControl"
        @swipeleft="swipeRight"
        @swiperight="swipeRight"
        @swipeup="nextRoom"
        @swipedown="prevRoom"
      >
        <span class="value">{{ point_value }} </span> <p class="valueSign">C</p>
      </div> -->

    <div class="control" 
    :class="borderColor"  
    @dblclick="handleDbClick"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd" 
    @touchmove="handleTouchMove"
    @updateState="updateState"
    >
      <span class="value">{{ point_value }} </span> <p class="valueSign">C</p>
    </div>


    </div>
  </template>

<script>
// import VueTouch from 'v-touch';
export default {
    data() {
        return {
            //Переменные работы с контролом
            isHolding: false,
            holdTimer: null,
            isMobile: false,
            buttonText: 'Состояние: Выключено',
            startX: 0,
            isTouching: false,
            isSwipingX: false,
            isSwipingY: false,
            controlState: this.control_stateSelected || false, // Состояние управления для текущего параметра

            // state: 0, // переменная отвечающая за визуализацию состояния связи с устройством в зависимости от времени последнего обновления 0 - нет связи, 1 - есть связь 2 - есть связь, установлена не давно
        }
    },
    created() {
        this.detectDevice(); // Проверка на мобильное устройство
        this.debouncedCalculateItem = this.debounce(this.calculateItem, 1000);
        this.debouncedCalculateRoom = this.debounce(this.calculateRoom, 1000);
    },
  props: {   // Переменные полученные в компонент
    state: Number,
    control_stateSelecte: Boolean,
    point_value: Number
  },
  computed: {
    // title() {
    //   return this.temperatures[this.currentTempIndex];
    // },
    borderColor() {
      return {
        'border-red': this.state === 0,
        'border-yellow': this.state === 1,
        'border-green': this.state === 2,
      };
    },
  },
  methods: {
    detectDevice() {
      // Проверка на мобильное устройство
      this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
      console.log('Используем мобильное устройство: ', this.isMobile);
    },
    debounce(func, wait) {
      let timeout;
      return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    },
    // Работа с мышью
    handleDbClick() {
      this.changeControlState();
    },

    // Работа с тачем
    handleTouchStart(event) {
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
      this.isTouching = true;
    },
    handleTouchEnd() {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - this.lastTouchTime;
      // Проверяем, было ли предыдущее касание в пределах 400 мс
      if (tapLength < 400 && tapLength > 0) {
        this.changeControlState();
      }
      this.lastTouchTime = currentTime;
    },
    handleTouchMove(event) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.startX;
      const deltaY = touch.clientY - this.startY;
      console.log('ДельтаX:', deltaX, 'ДельтаY:', deltaY, 'isSwipingX:', this.isSwipingX, 'isSwipingY:', this.isSwipingY);

      if (Math.abs(deltaX) > Math.abs(deltaY) && this.isTouching) {
        this.isSwipingX = true;
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && this.isTouching) {
        this.isSwipingY = true;
      }
      if (!this.isSwipingX && deltaX < 50 && deltaX > -50) {
        // console.log('Недостаточное смещение контролла');
      } else {
        this.debouncedCalculateItem(deltaX);
        // console.log('Выполнено обновление индекса датчика');
      }
      if (!this.isSwipingY && deltaY < 50 && deltaY > -50) {
        // console.log('Недостаточное смещение контролла');
      } else {
        this.debouncedCalculateRoom(deltaY);
        // console.log('Выполнено обновление индекса комнаты');
      }

    },

    // Выполнение операций с переменными
    changeControlState() {
      this.controlState = !this.controlState;
      this.value += 0.75; // Обновляем значение value
      this.$emit('updateState', { controlState: this.controlState, value: this.value });
      this.buttonText = this.controlState ? 'Состояние: Включено' : 'Состояние: Выключено';
      console.log('Текущее состояние controlState:', this.controlState);
    },
    calculateItem(value) {
      this.isTouching = false;
      if (value > 20) {
        this.$emit('updateState', { incrementPoint: 1 });
        console.log('Увеличили incrementPoint:', this.incrementPoint);
      } else if (value < -20) {
        this.$emit('updateState', { incrementPoint: -1 });
        console.log('Уменьшили incrementPoint:', this.incrementPoint);
      }
    },

    calculateRoom(value) {
      if (value > 20) {
        this.$emit('updateState', { icrementRoom: 1 });
        console.log('Увеличили icrementRoom:', this.icrementRoom);
      } else if (value < -20) {
        this.$emit('updateState', { icrementRoom: -1 });
        console.log('Уменьшили icrementRoom:', this.icrementRoom);
      }
    },


  },


}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 100%;
  min-height: 100%;
  /* background-color: aliceblue; */
  padding: 1%;
}
.control {
    position: relative; 
    width: 80vw; /* 80% ширины экрана */
    height: 80vw; /* 80% высоты экрана */
    background-color: var(--sensorControl);
    color: var(--dark_font);
    border: var(--borderColor);
    border-radius: 50%; /* Создание круга */
    display: flex; 
    justify-content: center; 
    align-items: center; 
}
.value {
    position: absolute; 
    top: 50%; 
    left: 50%; 
    transform: translate(-50%, -50%);
    font-size: 30vw;
    font-weight: 600;
    letter-spacing: 2vw;
    text-transform: uppercase;
    color: var(--borderColor);
    display: flex;
    justify-content: center;
    align-items: center;
}
.valueSign {
    position: absolute; 
    top: 40%; 
    left: 80%; 
    transform: translate(-50%, -50%);
    font-size: 14vw;
    font-weight: 600;
    color: var(--borderColor);
    display: flex;
    justify-content: center;
    align-items: center;
}
.temp-value {
  position: absolute;
  font-size: 4em;
}

.border-red {
  border: 3vw solid rgb(226, 30, 30);
}

.border-yellow {
  border: 3vw solid rgb(239, 143, 9);
}

.border-green {
  border: 2vw solid rgb(27, 176, 27);
}
</style>