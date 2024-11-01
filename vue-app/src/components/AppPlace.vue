<template> 
    <div class="app-place_body">
        <div class="app-place_module" @click="$emit('select', title)">{{ title }}</div>
        
    </div>
</template>

<script> 
export default { 
    name: 'AppPlace', 
    props: {
        title: { type: String, 
            required: true, 
        }, 
    link: { 
        type: String, 
        required: true, 
        }, 
    }, 
    }; 
</script>

<style>

</style>