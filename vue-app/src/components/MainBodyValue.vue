<template>

    <!-- <div @click="$emit('room', id)"> -->
    <div 
    @click="customerClick"
    :class="{ selected: isSelected }"
    >
        <!-- <h2> Main Body Value </h2> -->
      <div class="mainBodyValue_h3">{{ title }} </div>
      <div class="mainBodyValue_h1">{{ value }}</div>
      <div class="mainBodyValue_p"> обновление - {{ timeUpdated }} </div>
     
  </div>
</template>

<script>
export default {
name: 'ParamPlace', 
data() {
    return {
        // isSelected: null,
    }
},
props: {
  title: { type: String, 
      required: true, 
  }, 
  paramKey: { type: String, 
      required: true, 
  }, 
  roomKey: { type: String, 
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
  isSelected: { type: Boolean, 
      required: true, 
      default: false,
  },
}, 
watch: {

},
methods: {
    customerClick(event) { 
        console.log(event.isTrusted);
        // this.isSelected = !this.isSelected;
        this.$emit('select', {
            type: 'select', 
            message: {
            state: this.isSelected,
            id: this.id,
            paramKey: this.paramKey,
            roomKey: this.roomKey,
            }
        }); 
    }, 
},

}
</script>

<style>
.selected { 
    border: 9px solid blue; /* Пример изменения обводки */ 
    }
</style>