<template>
    <div @click="$emit('room', id)">
      <div class="paramPlace h3">{{ title }} </div>
      <div class="paramPlace h1">{{ value }}</div>
      <div class="paramPlace p"> обновление - {{ timeUpdated }} мин</div>
      
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