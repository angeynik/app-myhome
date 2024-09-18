<template>
      <div> 
        <h3> {{ title }}</h3>
        <!-- <h1> B O D Y </h1>  -->
            <div id="app_valueblock"> <BodyValueBlock :title="title"  /> </div>
    </div>
</template>

<script>
import BodyValueBlock from './BodyValueBlock.vue';
export default {
  name: 'MainBody',
  components: {
    BodyValueBlock,
  },
  data() {
    return {
      BVB_title: '',
    };
  },
  computed: {
propsValueBlock() {
  return {
    // title: this.title, 
    // TYPES: this.types, 
    // FUNC: this.functions, 
    // CONFIG: this.config,
    // user: this.uuid,
    }
  },
},
props: {
user: null,
title: String,
},
}
</script>

<style>

</style>