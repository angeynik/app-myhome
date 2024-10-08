<template>
  <div class="setpointSwipe" v-touch:swipe="onSwipe">
    <div>
      <h2> {{ lowLimit }} </h2>
    </div>
    <div
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd" 
    @touchmove="handleTouchMove"
    >
      <h1> {{ setPoint }} </h1>
    </div>
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
    }
},
props: {
    setPoint: Number,
    lowLimit: Number,
    highLimit: Number
    },
}
</script>

<style>

</style>