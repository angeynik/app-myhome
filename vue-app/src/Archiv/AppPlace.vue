<template> 
        <div @click="$emit('select', title)">
            <div class="app-place_module_icon"></div>
            <h1 class="app-place_module_h1"> {{ title }} </h1>
        </div>
       
</template>

<script> 
export default { 
    name: 'AppPlace', 
    props: {
        title: { type: String, 
            required: true, 
        }, 
    }, 
    }; 
</script>

<style>

</style>