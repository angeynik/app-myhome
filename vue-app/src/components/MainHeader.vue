<template>
      <div> 
        <h3> {{ location }}</h3>
    </div>
</template>

<script>
export default {
  props: {
    location: {
      type: String,
      required: true
    }
  }
}
</script>

<style>

</style>