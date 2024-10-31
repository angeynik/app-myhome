<template>
  <div class="app">
            <header class="mainHeader">
              <MainHeader :location="location_title"/>
            </header>
            <div id="app_mainBody" class="mainBody">

              <AppPlace title="Info" link="/info?sorting=room" /> 
              <AppPlace title="Param" link="/info?sorting=param" /> 
              <AppPlace title="Settings" link="/settings" /> 
              <AppPlace title="Alarms" link="/alarms" /> 
              <AppPlace title="Scenarios" link="/scenarios" /> 
              <AppPlace title="Statistic" link="/statistic" />
              <router-view></router-view> <!-- Добавьте это для отображения компонентов -->

            </div>
            <div class="mainFooter"> 
              <MainFooter />
            </div>
  </div>
</template>

<script>
import MainHeader from './components/MainHeader.vue'; 
import MainFooter from './components/MainFooter.vue'; 
import AppPlace from './components/AppPlace.vue'; // Импортируем AppPlace 
export default { 
  name: 'App', 
  components: { 
    MainHeader, 
    MainFooter, 
    AppPlace, 
  }, 
  data() { 
    return { 
      location_title: 'Your Location Title', // Замени на нужное значение 
      }; 
      }, 
      }; 
      </script>

<style>

</style>
