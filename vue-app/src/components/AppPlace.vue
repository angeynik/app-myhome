<!-- AppPlace.vue -->
<template>
  <div class="app-place_module" @click="$emit('select')">
    <div class="app-place_module_icon">
      <svg viewBox="0 0 512 512">
        <use :href="`#icon_${icon}`" />
      </svg>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppPlace',
  props: {
    title: String,
    icon: {
      type: String,
      required: true
    }
  }
}
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>