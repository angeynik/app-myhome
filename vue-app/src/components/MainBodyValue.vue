<template>
  <div 
    class="sensor-card"
    :class="{ selected: isSelected, [type]: true }"
    @click="customerClick"
    @dblclick="customerDoubleClick"
    @touchstart="customerTouchStart" 
    @touchend="customerTouchEnd"
  >
    <div v-if="sortType === 'rooms'" class="sensor-header">
    <span class="room">{{ paramTitle }}</span>
    </div>
        <div v-else class="sensor-header">
      <span class="room">{{ roomTitle }}</span>
    </div>

    <div class="sensor-value">
      {{ formattedValue(value) }}
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>
       <div v-if="setValue != null || undefined" class="sensor-SetValue">
      {{ formattedValue(setValue) }}
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>
    <div class="sensor-footer">
      <time>{{ formattedTime }}</time>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ParamPlace', 
  props: {
    paramTitle: { type: String, required: true }, 
    roomTitle: { type: String, required: true },
    value: { type: Number, required: true },
    setValue: { type: Number, required: true },
    sortType: { type: Number, required: true },
    unit: String,
    timeUpdated: { type: Number, required: true },
    isSelected: { type: Boolean, required: true, default: false },
  }, 
  computed: {
    type() {
      if (typeof this.value === 'number') {
        if (this.unit === '°C') return 'temperature'
        if (this.unit === '%') return 'humidity'
      }
      return 'default'
    },
    formattedTime() {
      if (!this.timeUpdated) return 'Нет данных'
      
      const date = new Date(this.timeUpdated)
      return isNaN(date) 
        ? this.timeUpdated 
        : date.toLocaleTimeString()
    }
  },
  methods: {
        formattedValue(value) {
      if (typeof value === 'number') {
        return value.toFixed(1)
      }
      return value
    },
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
  }
}
</script>

<style lang="css" src="../assets/mainStyle.css">
.selected { 
    border: 3px solid var(--light_font); /* Пример изменения обводки */ 
    }
</style>
