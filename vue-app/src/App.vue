<template>
  <div class="app">
      <div class="body_l0">
        <MainManu />
      </div>

      <div class="body_l1"> 
            <div class="mainHeader">
              <MainHeader />
            </div>
            <div class="mainBody">
              <MainBody />
            </div>
      </div>

  </div>
</template>

<script>
import MainManu from './components/MainManu.vue';
import MainBody from './components/MainBody.vue';
import MainHeader from './components/MainHeader.vue';
export default {
  name: 'App',
  components: {
    MainManu,
    MainBody,
    MainHeader
  },
  data() {
    return {
      param1: 0,
    };
  }
}
</script>

<style>

</style>
