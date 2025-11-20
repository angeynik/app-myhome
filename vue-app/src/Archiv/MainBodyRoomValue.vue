<template>
    <div>
      <svg >
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
        <use href="#sensorback" :stroke="borderColor" stroke-width="44"></use>
      </svg>
      <svg class="sensorControl">
        <use href="#sensorback" stroke="url(#gradientStroke)" stroke-width="18"></use>
      </svg>
      <svg class="sensorControl">
        <use href="#sensorfront" :fill="placeColor" stroke="white" stroke-width="2"></use>
      </svg>
      <span class="value"> {{ point_value }}  </span> 
      <!-- <span class="value"> °C </span> -->
    </div>
    </div>
</template>

<script>
export default {

}
</script>

<style>

</style>