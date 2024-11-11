<template>
    <div>
        <MainBodyRoomValue />
  </div>
</template>

<script>
import MainBodyRoomValue from './MainBodyRoomValue.vue';
export default {
    name: 'MainBodyParam',
    components: {
        MainBodyRoomValue,
    },
    data() {
        return {
            
        }
    },
    props: {
    // propsTitle: String,
    // room_id: Number,
    // param_id: Number,
  },
    created() {

    },
    mounted() {
        // console.log('MainBodyParam - Открыт компонент MainBody - Room -  сортировки данных по Параметрам');
        this.sendEmitMessage('customer_message', 'Открыт компонент MainBody - Room -  сортировки данных по Параметрам');
    },
    beforeUnmount() {
    },
    methods: {
        sendEmitMessage(name, message) {
            this.$emit('AppNewSetpoint',
            {
                [name]: message
            });
        },
    },
}
</script>


<style>

</style>