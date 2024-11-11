<template>
    <div id="app_mainBody" class="mainBody">
        <!-- <h1> Main Body </h1> -->
              <MainBodyRoom 
              v-if="propsTitle == 'rooms'"
              :id_item="id_infoRoom"
              :localStorageUpdated="localStorageUpdated"
              @AppNewSetpoint="messageFromInfoRoom"
              />
              <MainBodyParam 
              v-if="propsTitle == 'params'"
              :id_item="id_infoParam"
              :localStorageUpdated="localStorageUpdated"
              @AppNewSetpoint="messageFromInfoParam"
              />
    </div>
</template>

<script>
import MainBodyRoom from './MainBodyRoom.vue';
import MainBodyParam from './MainBodyParam.vue';
export default {
    name: 'MainBody',
    components: {
        MainBodyRoom,
        MainBodyParam,
    },
    data() {
        return {
            
        }
    },
    props: {
    propsTitle: String,
    room_id: Number,
    param_id: Number,
  },
    created() {
        this.sendEmitMessage('customer_message', 'Открыт компонент MainBody -  сортировки данных');
    },
    mounted() {
        // this.sendEmitMessage('customer_message', 'Открыт компонент MainBody -  сортировки данных');
    },
    beforeUnmount() {
    },
    methods: {
        sendEmitMessage(name, message) {
            this.$emit('eventsComponent',{
                sendLogToServer: {
                    type: name,
                    message: message
                }
            });
        },
    //     messageFromInfoRoom(n) {
    
    // // console.log('MainBody.vue: Функция messageFromMainBody: Получено ообщение', n);
    //     if (n.getConfig !== undefined && n.getConfig === true) { // При получении сообщения  getConfig (true) о завершении обновления  localStorage сбрасываем флаг запроса на обновления localStorage
    //         this.localStorageUpdated = false;
    //       } 
    //     if (n !== undefined && n !== null) {
    //     // console.log('Сообщение messageFromMainBody корректно', n);

    //     try {
    //         if (n.setpointUpdate !== undefined) {
    //         // console.log(' Получено сообщение n.setpointUpdate', n.setpointUpdate );
    //         // console.log(' 1 ---  Компонент APP.vue Функция messageFromMainBody приступила к обработке запроса на изменение значения параметра', n );
    //         this.id_title = n.setpointUpdate.id;
    //         // console.log('Функция messageFromMainBody: id_title:', n.setpointUpdate.id);
    //         // console.log('Функция messageFromMainBody: type:', n.setpointUpdate.type, 'request:', n.setpointUpdate.request, 'name:', n.setpointUpdate.name, 'data:', n.setpointUpdate.setpoint);
            
    //         if (n.setpointUpdate.request === 'setpoint') {
    //             // console.log('отправляем запрос в sendServerRequest на обнновление Уставок  ');
    //         this.$emit('eventsComponent', {
    //             sendServerRequest: {
    //             type: n.setpointUpdate.type, 
    //             request: n.setpointUpdate.request, 
    //             name: n.setpointUpdate.name, 
    //             setpoint: n.setpointUpdate.setpoint
    //             },
    //         });
    //         // console.log('messageFromMainBody Завершаем работу функции, проверяем localStorage:', JSON.parse(localStorage.getItem('manageConfig')));

    //         }
            
    //         } else if (n.sendLogToServer !== undefined) {
    //         // console.log(' MainInfo Получено сообщение n.sendLogToServer', n.sendLogToServer );
    //         this.$emit('eventsComponent', {
    //             sendLogToServer: {
    //             type: n.sendLogToServer.type, 
    //             message: n.sendLogToServer.message, 
    //             },
    //         });
    //         }
    //     } catch (error) {
    //         console.error('MainInfo Функция messageFromMainBody. Ошибка обработки сообщения от MainBody: ', error);
    //         this.$emit('eventsComponent', {
    //             sendLogToServer: {
    //             type: 'error', 
    //             message: `MainInfo Функция messageFromMainBody. Ошибка обработки сообщения от MainBody: `+ error, 
    //             },
    //         });
    //         }
    //     } else {
    //     console.error('MainInfo Функция messageFromMainBody. Value: undefined');
    //     this.$emit('eventsComponent', {
    //             sendLogToServer: {
    //             type: 'error', 
    //             message: `MainInfo Функция messageFromMainBody. Value: undefined`, 
    //             },
    //         });
    //     }

    //     },  
        
    
        messageFromInfoRoom(n) {
            // console.log('MainInfo.vue: Функция messageFromInfo - Room: Получено ообщение', n);
            if (n !== undefined && n !== null) {
                if (n.customer_message) {
                    // console.log('MainInfo Функция messageFromInfo - Room. customer_message: ', n.customer_message);
                    this.sendEmitMessage('customer_message', n.customer_message);
                }
            } else {
                console.error('MainInfo Функция messageFromInfo - Room. Value: undefined');
                this.sendEmitMessage('error', `MainInfo Функция messageFromInfo - Room. Value: undefined`);
            }
        },
        messageFromInfoParam(n) {
            // console.log('MainInfo.vue: Функция messageFromInfo - Param: Получено ообщение', n);
            if (n !== undefined && n !== null) {
                if (n.customer_message) {
                    // console.log('MainInfo Функция messageFromInfo - Param. customer_message: ', n.customer_message);
                    this.sendEmitMessage('customer_message', n.customer_message);
                }
            } else {
                console.error('MainInfo Функция messageFromInfo - Param. Value: undefined');
                this.sendEmitMessage('error', `MainInfo Функция messageFromInfo - Param. Value: undefined`);
            }
        }, 
    },
}
</script>

<style>

</style>