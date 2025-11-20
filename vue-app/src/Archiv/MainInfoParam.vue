<template>

<div class="container"
    @touchstart="handleTouchStart($event)"
    @touchend="handleTouchEnd" 
    @touchmove="handleTouchMove"
    >
    <h1>Параметры</h1>

            <div id="app_paramplace" class="app-place_body" style=" align-items: center; width: 90dvw;">
              <ParamPlace 
              class="paramPlaceMain"
              v-for="(param, index) in paramsList"
              :key="index"
              :id="param.id"
              :title="param.title" 
              :value="param.value"
              :group="param.group"
              :timeUpdated="param.timeDiff"
              @action="ParamPlaceAction"
              @touchstart="handleTouchStart($event, param.id)" 
              @touchend="handleTouchEnd(param.id)" 
              @touchmove="handleTouchMove($event)" 
              :class="{ 'bordered': longPressId === param.id }"
              /> 
            </div>

      <div style=" align-items: center; width: 100dvw;">
      <div id="app_setpointblock" ref="setpointBlock" v-show="showSetpoint"> 
        <BodySetpontBlock 
        :setPoint="setpoint" 
        :highLimit="limHigh" 
        :lowLimit="limLow"
        :step="limStep"
        :secectedComponent="selectedComponent"
        @updateState="updateState"
        /> </div>
      <!-- <div class="time_periodUpdated"> Время с последнего обновления, минут - {{ time_periodUpdated }}</div> -->
    </div>
  </div>
</template>

<script>
import ParamPlace from './ParamPlace.vue';
export default {
    name: 'MainInfoParam',
    components: {
        ParamPlace
    },
    data() {
        return {
        title: '',
        value: null,
        selected: false,
        timeUpdated: null,
        key: '',
        paramsList: [],
        commonConfig: {},
    // Переменные для обработки свайпа
        keysArray: [],
        key_index: 0, 
        key_value: '', 
        isTouching: false, // Возникает при появлении события Касание по экрану
        startX: 0, 
        endX: 0, 
        swipeThreshold: 80, // Порог срабатывания события Касание по экрану
    // Переменные для блока Уставки
        showSetpoint: false, // Показывать или нет блок с установкой значений
    // Переменные для обработки двойного касания и выбора компонента
        longPressId: null, 
        longPressTimer: null, 
        doubleTapTimer: null, 
        isDoubleTap: false,
        }
    },
    mounted () {
        this.commonConfig = JSON.parse(localStorage.getItem('commonConfig'));
        this.keysArray = Object.keys(this.commonConfig.room00.info);
        this.key = this.keysArray[this.key_index];
        // this.paramsList = this.getSortedParams(this.commonConfig, this.key);
        this.updateParamsList();
    },
    methods: {
        findKeys(config, key) {
            console.log('MainInfoParam функция findKeys получила key - ', key);
            const foundKeys = [];

            for (let roomKey in config) {
                const room = config[roomKey];
                if (room.sensors) {
                for (let sensorKey in room.sensors) {
                    if (sensorKey.includes(key)) {
                    foundKeys.push(sensorKey);
                    }
                }
                }
            }
            return [...new Set(foundKeys)]; // Удаляем дубликаты
            },
        getSortedParams(config, key) {
            // console.log('MainInfoParam функция getSortedParams получила key - ', key);
                const params = [];
                const keys = this.findKeys(config, key); // Получаем ключи, содержащие `key`
                for (let roomKey in config) {
                    const room = config[roomKey];
                    keys.forEach(sensorKey => {
                    if (room.sensors && room.sensors[sensorKey]) {
                        const currentTime = new Date();
                        const savedTime = new Date(room.time[`${sensorKey}_time`]);
                        const timeDiff = Math.abs(currentTime - savedTime) / 1000 / 60; // Разница во времени в минутах
                        
                        let souce_value = room.sensors[sensorKey];
                        if (typeof souce_value === 'number') { 
                            souce_value = parseFloat(souce_value.toFixed(1));
                            this.$emit('AppNewSetpoint', {
                                showSetpoint: true
                                });
                        } else if (typeof souce_value === 'boolean') {
                             souce_value = souce_value ? 'ON' : 'OFF'; 
                             this.$emit('AppNewSetpoint', {
                                showSetpoint: false
                                });
                            } else {
                                this.$emit('AppNewSetpoint', {
                                showSetpoint: false
                                });
                            }

                        params.push({
                        value: souce_value,
                        title: room.title,
                        group: room.group,
                        timeDiff: parseFloat(timeDiff.toFixed(1)),
                        id: room.id
                        });
                    }
                    });
                }
                this.$emit('AppNewSetpoint', {
                changeTitle: config.room00.info[key],
                keys: key
                });
                // console.log('params - ', params); // Убедимся, что параметры правильно извлекаются
                return params;
            },
        // ParamPlaceAction (message) {
        //     console.log('MainInfoParam Функция ParamPlaceAction получила информацию от ParamPlace: ', message);
        // },
        updateParamsList() { 
            this.paramsList = this.getSortedParams(this.commonConfig, this.key); 
            while (this.paramsList.length === 0) { 
                this.key_index = (this.key_index + 1) % this.keysArray.length; 
                this.key = this.keysArray[this.key_index]; 
                this.paramsList = this.getSortedParams(this.commonConfig, this.key); 
            } 
            this.key_value = this.key; },
        
        handleTouchStart(event, id) {
            if (!event) { 
                console.error('Компонент MainInfoParam событие - handleTouchStart, не передан event', event);
            } else {
            // console.log('Компонент MainInfoParam событие - handleTouchStart', event.touches[0].clientX, event.touches[0].clientY);
            this.startX = event.touches[0].clientX;
            this.isTouching = true;

        // Долгий тач 
            this.longPressTimer = setTimeout(() => { 
            this.longPressId = id; 
            }, 1000); 

        // Двойной тач 
        if (this.doubleTapTimer) { 
            clearTimeout(this.doubleTapTimer); 
            this.doubleTapTimer = null; 
            this.isDoubleTap = true; 
            this.navigateToRoom(id); 
        } else { 
            this.doubleTapTimer = setTimeout(() => { 
                this.doubleTapTimer = null; 
                this.isDoubleTap = false; 
            }, 200); }
        }
        },
        handleTouchEnd() {
            // console.log('Компонент MainInfoParam событие - handleTouchEnd, secectedComponent - ');
                this.key = this.keysArray[this.key_index]; 
                this.updateParamsList(); 
                this.isTouching = false; 
        },
        handleTouchMove (event) {
            // console.log('Компонент MainInfoParam событие - handleTouchMove', event.touches[0].clientX);

            if (this.isTouching) { 
                // this.endX = event.touches[0].clientX; 
                const deltaX = event.touches[0].clientX - this.startX; 
                // console.log('Компонент MainInfoParam событие - handleTouchEnd, deltaX - ', deltaX, 'swipeThreshold - ', this.swipeThreshold);
                if (deltaX > this.swipeThreshold) { 
                    this.key_index = (this.key_index - 1 + this.keysArray.length) % this.keysArray.length;
                    // console.log(' -1 _____ Компонент MainInfoParam событие - handleTouchEnd, key_index - ', this.key_index);
                } else if (deltaX < -this.swipeThreshold) { 
                    this.key_index = (this.key_index + 1) % this.keysArray.length; 
                    // console.log('+1 _____ Компонент MainInfoParam событие - handleTouchEnd, key_index - ', this.key_index);
                } 
            }

        },
        navigateToRoom(id) { 
            console.log('Переход в комнату с id:', id); 
        // Ваша логика перехода в комнату 
        },
    },
}
</script>

<style>
.bordered { 
    border: 2px solid blue;
}
</style>