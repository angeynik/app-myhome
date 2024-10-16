

  <template>
    <div class="container">
      <svg style="position: absolute; width: 0; height: 0;">
        <defs>
          <linearGradient id="gradientStroke" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1C1F27; stop-opacity:1" />
            <stop offset="100%" style="stop-color:#656F8A; stop-opacity:1" />
          </linearGradient>
        </defs>
        <symbol id="sensorback" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg" >
          <circle cx="320" cy="320" r="254" fill="var(--background_color)" />
        </symbol>
        <symbol id="sensorfront" viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg" >
          <circle cx="240" cy="240" r="180"/>
        </symbol>

      </svg>
      <div class="control" 
    @dblclick="handleDbClick"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd(this.secectedComponent)" 
    @touchmove="handleTouchMove"
    @updateState="updateState"
    >
    <svg class="sensorControl">
        <use href="#sensorback" :stroke="borderColor" stroke-width="30"></use>
      </svg>
      <svg class="sensorControl">
        <use href="#sensorback" stroke="url(#gradientStroke)" stroke-width="18"></use>
      </svg>
      <svg class="sensorControl">
        <use href="#sensorfront" :fill="borderColor" stroke="white" stroke-width="2"></use>
      </svg>
      <span class="value">{{ point_value }}  </span> 
      <!-- <span class="value"> °C </span> -->
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
            incrementPoint: 0,
            icrementRoom: 0,
            // state: 0, // переменная отвечающая за визуализацию состояния связи с устройством в зависимости от времени последнего обновления 0 - нет связи, 1 - есть связь 2 - есть связь, установлена не давно
        }
    },
    created() {
        this.debouncedCalculateItem = this.debounce(this.calculateItem, 1000);
        this.debouncedCalculateRoom = this.debounce(this.calculateRoom, 1000);
    },
  props: {   // Переменные полученные в компонент
    state: Number,
    control_stateSelecte: Boolean,
    point_value: Number,
    secectedComponent: String,
  },
  computed: {
    // title() {
    //   return this.temperatures[this.currentTempIndex];
    // },
    // borderColor() {
    //   return {
    //     'border-red': this.state === 0,
    //     'border-yellow': this.state === 1,
    //     'border-green': this.state === 2,
    //   };
    // },
    borderColor() {
      if (this.state === 1) return 'var(--sensor-green)';
      if (this.state === 2) return 'var(--sensor-yellow)';
      if (this.state === 3) return 'var(--sensor-red)';
      if (this.state === 4) return 'var(--sensor-gray)';
      return 'var(--sensor-green)'; // Значение по умолчанию
    },

  },
  methods: {
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
    handleTouchEnd(component) {
      if (component === 'valueBlock') {
      console.log('Разрешаем изменять значение для Компонента valueBlock');
      const currentTime = new Date().getTime();
      const tapLength = currentTime - this.lastTouchTime;
      // Проверяем, было ли предыдущее касание в пределах 400 мс
      if (tapLength < 400 && tapLength > 0) {
        this.changeControlState();
      }
      this.lastTouchTime = currentTime;
      return;
    } else {
      return;
    }
    },
    handleTouchMove(event) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.startX;
      const deltaY = touch.clientY - this.startY;
      // console.log('ДельтаX:', deltaX, 'ДельтаY:', deltaY, 'isSwipingX:', this.isSwipingX, 'isSwipingY:', this.isSwipingY);

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
      if (!this.isSwipingY && deltaY < 150 && deltaY > -150) {
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
      // console.log('Текущее состояние controlState:', this.controlState);
    },
    calculateItem(value) {
      this.isTouching = false;
      if (value > 15) {
        this.incrementPoint = 1;
        this.$emit('updateState', { incrementPoint: this.incrementPoint });
        // console.log('Увеличили incrementPoint:', this.incrementPoint);
      } else if (value < -20) {
        this.incrementPoint = -1;
        this.$emit('updateState', { incrementPoint: this.incrementPoint });
        // console.log('Уменьшили incrementPoint:', this.incrementPoint);
      }
    },

    calculateRoom(value) {
      if (value > 15) {
        this.icrementRoom = 1;
        this.$emit('updateState', { icrementRoom: this.icrementRoom });
        // console.log('Увеличили icrementRoom:', this.icrementRoom);
      } else if (value < -15) {
        this.icrementRoom = -1;
        this.$emit('updateState', { icrementRoom: this.icrementRoom });
        // console.log('Уменьшили icrementRoom:', this.icrementRoom);
      }
    },
  },
}
</script>

<style scoped>
.temp-value {
  position: absolute;
  font-size: 4em;
}
</style>