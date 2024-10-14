<template>

  <div class="setpointSwipe" v-touch:swipe="onSwipe">
    <svg display="none">
      <symbol id="iconTelegram" viewBox="0 0 24 24">
        <path style="fill-rule:evenodd;clip-rule:evenodd;" d="M12,0C5.373,0,0,5.373,0,12s5.373,12,12,12s12-5.373,12-12S18.627,0,12,0z    M17.562,8.161c-0.18,1.897-0.962,6.502-1.359,8.627c-0.168,0.9-0.5,1.201-0.82,1.23c-0.697,0.064-1.226-0.461-1.901-0.903   c-1.056-0.692-1.653-1.123-2.678-1.799c-1.185-0.781-0.417-1.21,0.258-1.911c0.177-0.184,3.247-2.977,3.307-3.23   c0.007-0.032,0.015-0.15-0.056-0.212s-0.174-0.041-0.248-0.024c-0.106,0.024-1.793,1.139-5.062,3.345   c-0.479,0.329-0.913,0.489-1.302,0.481c-0.428-0.009-1.252-0.242-1.865-0.442c-0.751-0.244-1.349-0.374-1.297-0.788   c0.027-0.216,0.324-0.437,0.892-0.663c3.498-1.524,5.831-2.529,6.998-3.015c3.333-1.386,4.025-1.627,4.477-1.635   C17.472,7.214,17.608,7.681,17.562,8.161z"/>
      </symbol>
      <symbol id="setpointSelector" viewBox="0 0 137 60" stroke="white" fill="none">
          <line x1="136.5" y1="10" x2="136.5" y2="50" stroke="white"/>
          <line x1="79.5" y1="10" x2="79.5" y2="50" stroke="white"/>
          <line x1="22.5" y1="10" x2="22.5" y2="50" stroke="white"/>
          <line x1="125.5" y1="10" x2="125.5" y2="50" stroke="white"/>
          <line x1="68.5" y1="10" x2="68.5" y2="50" stroke="white"/>
          <line x1="11.5" y1="10" x2="11.5" y2="50" stroke="white"/>
          <line x1="114.5" y1="10" x2="114.5" y2="50" stroke="white"/>
          <line x1="57.5" y1="10" x2="57.5" y2="50" stroke="white"/>
          <line x1="0.5" y1="10" x2="0.499998" y2="50" stroke="white"/>
          <line x1="103.5" y1="10" x2="103.5" y2="50" stroke="white"/>
          <line x1="46.5" y1="10" x2="46.5" y2="50" stroke="white"/>
          <line x1="91.5" y1="6.55671e-08" x2="91.5" y2="60" stroke="white" stroke-width="3"/>
          <line x1="34.5" y1="6.55671e-08" x2="34.5" y2="60" stroke="white" stroke-width="3"/>
      </symbol>
    </svg>

    <div>
      <h2> {{ lowLimit }} </h2>
    </div>
    <svg class="icon">
      <use href="#setpointSelector"></use>
    </svg>
    <div
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd" 
    @touchmove="handleTouchMove"
    >
      <h1> {{ setPoint }} </h1>
    </div>
    <svg class="icon">
      <use href="#setpointSelector"></use>
    </svg>
    <div>
      <h2> {{ highLimit }} </h2>
    </div>
  </div>

</template>

<script>
export default {
    methods: {
    onSwipe(event) {
      console.log('Свайп!', event);
    },
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
},
props: {
    setPoint: Number,
    lowLimit: Number,
    highLimit: Number,
    secectedComponent: String,
    },
}
</script>

<style>

</style>