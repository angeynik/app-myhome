<template>


    <div 
    @click="customerClick"
    @dblclick="customerDoubleClick"
    @touchstart="customerTouchStart" 
    @touchend="customerTouchEnd"
    :class="{ selected: isSelected }"
    >
        <!-- <h2> Main Body Value </h2> -->
      <div class="mainBodyValue_h3">{{ title }} </div>
      <div class="mainBodyValue_h1">{{ value }}</div>
      <div class="mainBodyValue_p"> обновление - {{ timeUpdated }} </div>
      <!-- <h5> {{ paramKey }} </h5> -->

  </div>
</template>

<script>
import checkConfigs from '../utils/transformConfigs'
export default {
name: 'ParamPlace', 
data() {
    return {
        // isSelected: null,
        checkConfigs: null,
        touchTimeout: null,
    }
},
props: {
  title: { type: String, 
      required: true, 
  }, 
  paramTitle: { type: String, 
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
  roomTitle: { type: String, 
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
created() {
    // Инициализация класса при создании компонента
    this.checkConfigs = new checkConfigs();
  },
methods: {
    customerClick() {
        //console.log(' --- 82 --- Функция customerClick(MainBodyValue) - Пользователь выбрал параметр', this.paramKey, 'для комнаты', this.roomKey);
        this.$emit('select', {
            type: 'select', 
            message: {
            state: this.isSelecte,
            id: this.id,
            paramKey: this.paramKey,
            roomKey: this.roomKey,
            }
        }); 
    }, 
    customerDoubleClick() {
        //console.log('--- 87 ---Функция customerDoubleClick(MainBodyValue) - Пользователь начал двойной клик');
        // this.$emit('doubleclick', { 
        //     'changeSorting': true,
        // });
        this.$emit('doubleclick', { 
                    roomKey: this.roomKey, 
                    paramKey: this.paramKey, 
                    roomId: this.id,
                });
    },
    customerTouchStart(event) {
        //console.log('Функция handleTouchStart(MainBodyValue) - Пользователь сделал клик', event.touches[0].clientX, event.touches[0].clientY);
        if (event.touches.length === 1) { 
            if (this.touchTimeout) {
                clearTimeout(this.touchTimeout);
                this.touchTimeout = null;
                this.$emit('doubletouch', { 
                    roomKey: this.roomKey, 
                    paramKey: this.paramKey, 
                    roomId: this.id,
                });
                //console.log('Функция customerDoubleClick(MainBodyValue) отправила в MainBody  - room_id', this.room_id, 'room_key', this.room_key, 'param_key', this.param_key);
            } else {
                this.touchTimeout = setTimeout(() => { 
                    this.touchTimeout = null; 
                }, 400); 
            }
        }
    }, 
    customerTouchEnd() {
        // console.log('Функция handleTouchStart(MainBodyValue) - Пользователь завершил двойной клик', event.touches[0].clientX, event.touches[0].clientY);
        if (this.touchTimeout) { 
            clearTimeout(this.touchTimeout); 
            this.touchTimeout = null; 
        }
    },
},

}
</script>

<style>
.selected { 
    border: 3px solid var(--light_font); /* Пример изменения обводки */ 
    }
</style>