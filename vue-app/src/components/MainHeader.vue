<template>
    <div> 
        <h1> {{ title }} </h1>
    </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    }, 
  },
  created() {
    // console.log('Header   ---  LOCATION ', this.title);
  },
}
</script>

<style>

</style>