<template> 
    <div class="app-place_body">
        <router-link :to="link" class="app-place_module">{{ title }}</router-link>
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