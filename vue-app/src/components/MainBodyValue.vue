<template>

    <div @click="$emit('room', id)">
        <!-- <h2> Main Body Value </h2> -->
      <div class="mainBodyValue_h3">{{ title }} </div>
      <div class="mainBodyValue_h1">{{ value }}</div>
      <div class="mainBodyValue_p"> обновление - {{ timeUpdated }} </div>
     
  </div>
</template>

<script>
export default {
name: 'ParamPlace', 
props: {
  title: { type: String, 
      required: true, 
  }, 
  id: { type: Number, 
      required: true, 
  },
  value: { type: Number, 
      required: true, 
  },
  group: { type: String, 
      required: true, 
  },
  timeUpdated: { type: Number, 
      required: true, 
  },
}, 
}
</script>

<style>

</style>