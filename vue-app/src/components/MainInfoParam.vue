<template>

<div class="container"
    @touchstart="handleTouchStart"
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
              /> 
            </div>

      <!-- <div style=" align-items: center; width: 100dvw;">
      <div id="app_setpointblock" ref="setpointBlock" v-show="showSetpoint"> 
        <BodySetpontBlock 
        :setPoint="setpoint" 
        :highLimit="limHigh" 
        :lowLimit="limLow"
        :step="limStep"
        :secectedComponent="selectedComponent"
        @updateState="updateState"
        /> </div>
      <div class="time_periodUpdated"> Время с последнего обновления, минут - {{ time_periodUpdated }}</div>
    </div> -->
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

        isTouching: false, // Возникает при появлении события Касание по экрану
        }
    },
    mounted () {
        this.commonConfig = JSON.parse(localStorage.getItem('commonConfig'));
        this.key = 'Hum';
        this.paramsList = this.getSortedParams(this.commonConfig, this.key);
    },
    methods: {
        findKeys(config, key) {
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
                const params = [];
                const keys = this.findKeys(config, key); // Получаем ключи, содержащие `key`
                for (let roomKey in config) {
                    const room = config[roomKey];
                    keys.forEach(sensorKey => {
                    if (room.sensors && room.sensors[sensorKey]) {
                        const currentTime = new Date();
                        const savedTime = new Date(room.time[`${sensorKey}_time`]);
                        const timeDiff = Math.abs(currentTime - savedTime) / 1000 / 60; // Разница во времени в минутах

                        params.push({
                        value: parseFloat(room.sensors[sensorKey].toFixed(1)),
                        title: room.title,
                        group: room.group,
                        timeDiff: parseFloat(timeDiff.toFixed(1)),
                        id: room.id
                        });
                    }
                    });
                }
                console.log('params - ', params); // Убедимся, что параметры правильно извлекаются
                return params;
                },

        // getSortedParams(config, key) {
        //     const params = [];

        //     for (let roomKey in config) {
        //         const room = config[roomKey];

        //         if (room.sensors && room.sensors[key]) {
        //         const currentTime = new Date();
        //         const savedTime = new Date(room.time[`${key}_time`]);
        //         const timeDiff = Math.abs(currentTime - savedTime) / 1000 / 60; // Разница во времени в минутах

        //         params.push({
        //             value: room.sensors[key],
        //             title: room.title,
        //             group: room.group,
        //             timeDiff: timeDiff
        //         });
        //         }
        //     }
        //     console.log('params - ', params);
        //     return params;
        //     },
        ParamPlaceAction (message) {
            console.log('MainInfoParam Функция ParamPlaceAction получила информацию от ParamPlace: ', message);
        },
        handleTouchStart(event) {
            console.log('Компонент MainInfoParam событие - handleTouchStart', event.touches[0].clientX, event.touches[0].clientY);
            this.startX = event.touches[0].clientX;
            this.isTouching = true;
        },
        handleTouchEnd(component) {
            console.log('Компонент MainInfoParam событие - handleTouchEnd, secectedComponent - ', component);
            if (component === 'setpointBlock') {
            console.log('Разрешаем изменять значение для Компонента setpointBlock');
            const currentTime = new Date().getTime();
            this.lastTouchTime = currentTime;
            this.$emit('updateState', { updatePermission: true }); // Разрешаем обновление Уставки
            return;
            } else {
            return;
            }
        },
        handleTouchMove (event) {
            console.log('Компонент MainInfoParam событие - handleTouchMove', event.touches[0].clientX, event.touches[0].clientY);
            const touch = event.touches[0];
            const deltaX = touch.clientX - this.startX;
            if (deltaX < 8 && deltaX > - 8) {
            return;
            }
            this.isTouching = false;
            this.$emit('updateState', { updatePermission: false }); // Запрещаем обновление Уставки
        }
    },
}
</script>

<style>

</style>