<template>
    <div class="container">
      <div class="control"
        :class="borderColor"
        @click="toggleTempControl"
        @swipeleft="nextTemperature"
        @swiperight="prevTemperature"
        @swipeup="nextRoom"
        @swipedown="prevRoom"
      >
      <!-- <h1> {{ state }} </h1> -->
        <span class="value">{{ title }}</span>
      </div>
    </div>
  </template>

<script>
export default {
    data() {
        return {
            temperatures: [20, 21, 22, 23, 24],
            rooms: ['Living Room', 'Bedroom', 'Kitchen'],
            currentTempIndex: 0,
            currentRoomIndex: 0,
            state: 0, // 0 - красная, 1 - желтая, 2 - зеленая
        }
    },
    props: {   // Переменные полученные в компонент
    title1: String,
    state1: Number,
  },
  computed: {
    title() {
      return this.temperatures[this.currentTempIndex];
    },
    borderColor() {
      return {
        'border-red': this.state === 0,
        'border-yellow': this.state === 1,
        'border-green': this.state === 2,
      };
    },
  },
  methods: {
    toggleTempControl() {
      // Логика включения/выключения функции TempControl
    },
    nextTemperature() {
      this.currentTempIndex = (this.currentTempIndex + 1) % this.temperatures.length;
    },
    prevTemperature() {
      this.currentTempIndex = (this.currentTempIndex - 1 + this.temperatures.length) % this.temperatures.length;
    },
    nextRoom() {
      this.currentRoomIndex = (this.currentRoomIndex + 1) % this.rooms.length;
      // Логика обновления температуры для новой комнаты
    },
    prevRoom() {
      this.currentRoomIndex = (this.currentRoomIndex - 1 + this.rooms.length) % this.rooms.length;
      // Логика обновления температуры для новой комнаты
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
    width: 90%;
    height: 0;
    padding-top: 90%; /* Соотношение сторон 1:1 для создания круга */
    background-color: var(--light_font);
    color: var(--dark_font);
    clip-path: circle(50%);
    display: flex; 
    justify-content: center; 
    align-items: center; 
}
.value {
    position: absolute; 
    top: 50%; 
    left: 50%; 
    transform: translate(-50%, -50%);
    font-size: 8vw;
    color: var(--dark_font);
    display: flex;
    justify-content: center;
    align-items: center;
}
.temp-value {
  position: absolute;
  font-size: 4em;
}

.border-red {
  border: 5px solid red;
}

.border-yellow {
  border: 5px solid yellow;
}

.border-green {
  border: 5px solid green;
}
</style>