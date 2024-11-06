<template>
    <h1> Main Body </h1>
</template>

<script>
export default {
    data() {
        return {
            title: 'Main Body'
        }
    },
    mounted() {
        this.sendEmitMessage('customer_message', 'Открыт компонент MainBody -  сортировки данных');
    },
    beforeUnmount() {
    },
    methods: {
        sendEmitMessage(name, message) {
            this.$emit('eventsComponent',
            {
                [name]: message
            });
        }
    },
}
</script>

<style>

</style>