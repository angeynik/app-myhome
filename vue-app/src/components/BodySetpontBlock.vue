<template>
  <div class="swipe" v-touch:swipe="onSwipe">
    Проведите по этому блоку
  </div>
</template>

<script>
export default {
    methods: {
    onSwipe(event) {
      console.log('Свайп!', event);
    }
}
}
</script>

<style>

</style>