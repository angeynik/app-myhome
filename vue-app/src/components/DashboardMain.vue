<template>
  <div class="app-place_body" id="app_place">
    <AppPlace class="app-place_module" title="Комнаты" @select="$router.push({ name: 'DashboardRooms' })" />
    <AppPlace class="app-place_module" title="Параметры" @select="$router.push({ name: 'DashboardParams' })" />
  </div>
</template>

<script>
export default {

}
</script>

<style>

</style>