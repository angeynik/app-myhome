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

    <div class="control" :class="borderColor" v-touch:swipe.left="swipeRight" v-touch:swipe.right="swipeRight">
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

            temperatures: [20, 21, 22, 23, 24],
            rooms: ['Living Room', 'Bedroom', 'Kitchen'],
            currentTempIndex: 0,
            currentRoomIndex: 0,

            //Переменные получаемые откопонента MainBody
            id_room: this.id_roomSelected, // ID текущей комнаты
            id_item: this.id_pointSelected, // ID текущего датчика
            controlState: this.control_stateSelected, // Состояние управления для текущего параметра
            // state: 0, // переменная отвечающая за визуализацию состояния связи с устройством в зависимости от времени последнего обновления 0 - нет связи, 1 - есть связь 2 - есть связь, установлена не давно
        }
    },
    props: {   // Переменные полученные в компонент
    state: Number,
    id_pointSelected: Number,
    id_roomSelected: Number,
    control_stateSelecte: Boolean,
    point_value: Number,
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
    // swipeLeft() {
    //   this.$emit('updateState', { id_item: this.id_item - 1 });
    //   console.log('Swiped left, new item ID:', this.id_item - 1);
    // },
    swipeRight() {
        console.log('Swiped right, new item ID:');
      this.$emit('updateState', { id_item: this.id_item + 1 });
      this.$emit('updateState', { point_value: this.point_value + 1 });
      console.log('Swiped right, new item ID:', this.id_item + 1);
    },
    // swipeUp() {
    //   this.$emit('updateState', { id_room: this.id_room + 1 });
    //   console.log('Swiped up, new room ID:', this.id_room + 1);
    // },
    // swipeDown() {
    //   this.$emit('updateState', { id_room: this.id_room - 1 });
    //   console.log('Swiped down, new room ID:', this.id_room - 1);
    // },
    // startHold() {
    //   this.holdTimer = setTimeout(() => {
    //     this.isHolding = !this.control_state;
    //     this.$emit('updateState', { control_state: this.isHolding });
    //     alert(Control state changed to: ${this.isHolding ? 'Enabled' : 'Disabled'});
    //     console.log('Control state changed:', this.isHolding);
    //   }, 2000);
    // },
    // endHold() {
    //   clearTimeout(this.holdTimer);
    //   this.isHolding = false;
    // },



    // toggleTempControl() {
    //   // Логика включения/выключения функции TempControl
    // },
    // nextItem() {
    //   this.currentTempIndex = (this.currentTempIndex + 1) % this.temperatures.length;
    // },
    // prevItem() {
    //   this.currentTempIndex = (this.currentTempIndex - 1 + this.temperatures.length) % this.temperatures.length;
    // },
    // nextRoom() {
    //   this.currentRoomIndex = (this.currentRoomIndex + 1) % this.rooms.length;
    //   // Логика обновления температуры для новой комнаты
    // },
    // prevRoom() {
    //   this.currentRoomIndex = (this.currentRoomIndex - 1 + this.rooms.length) % this.rooms.length;
    //   // Логика обновления температуры для новой комнаты
    // },
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