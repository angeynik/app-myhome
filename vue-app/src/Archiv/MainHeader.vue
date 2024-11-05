<template>
      <div> 
        <h3> {{ location }} {{ location_sign }}</h3>
    </div>
</template>

<script>

export default {
  props: {
    location: {
      type: String,
      required: true
    }, 
    location_sign: {
      type: String,
      required: true
    }
  }
}
</script>

<style>

</style>