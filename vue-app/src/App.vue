<template>
  <div class="app">
    <header class="mainHeader">
      <div class="icon" @click=this.resetSelection> back </div>
      
      <div><MainHeader :location="location_title" /></div>

      <div class="icon"> menu </div>
    </header>
   

      <div v-if="!selectedComponent" id="app_mainBody" class="mainBody">
        <div class="app-place_body">
        <component :is="AppPlace" />
        <AppPlace class="app-place_module" title="Комнаты" @select="selectComponent('Rooms')" />
        <AppPlace class="app-place_module" title="Параметры" @select="selectComponent('Params')" />
        <AppPlace class="app-place_module"  title="Настройки" @select="selectComponent('MainSettings')" />
        <AppPlace class="app-place_module"  title="Уведомления" @select="selectComponent('MainAlarms')" />
        <AppPlace class="app-place_module"  title="Сценарии" @select="selectComponent('MainScenario')" />
        <AppPlace class="app-place_module"  title="Видео" @select="selectComponent('MainVideo')" />
        <AppPlace class="app-place_module"  title="Статистика" @select="selectComponent('MainStatistic')" />
      </div>
      </div>
      
      <div v-else id="app_mainBody" class="mainBody">
        <component :is="selectedComponent" v-bind="this[propsTitle]"  @back="resetSelection" />
      </div>


    <div class="mainFooter"> 
      <MainFooter />
    </div>
  </div>
</template>

<script>
import MainHeader from './components/MainHeader.vue'; 
import MainFooter from './components/MainFooter.vue'; 
import AppPlace from './components/AppPlace.vue'; 
import MainSettings from './components/MainSettings.vue';
import MainInfo from './components/MainInfo.vue';
import MainVideo from './components/MainVideo.vue';
import MainAlarms from './components/MainAlarms.vue';
import MainScenarios from './components/MainScenarios.vue';
import MainStatistic from './components/MainStatistic.vue';

export default { 
  name: 'App', 
  components: { 
    MainHeader, 
    MainFooter, 
    AppPlace, 
    MainSettings,
    MainInfo,
    MainVideo,
    MainAlarms,
    MainScenarios,
    MainStatistic,
  }, 
  data() { 
    return { 
      location_title: 'Your Location Title',
      selectedComponent: null, // Состояние для выбранного компонента
      propsTitle: null, // Параметры передаваемые в компонент
    }; 
  },
  methods: {
    selectComponent(component) {
      if (component === 'Rooms') {
        this.propsTitle = 'rooms';
        this.selectedComponent = 'MainInfo';
      } else if (component === 'Params') {
        this.propsTitle = 'params';
        this.selectedComponent = 'MainInfo';
      } else {
        this.selectedComponent = component;
      }
      console.log('selectComponent - ', component, this.propsTitle);
    },
    resetSelection() {
      // Возвращаемся к списку компонентов
      this.selectedComponent = null;
    }
  }
}; 
</script>

<style>
/* Ваши стили */
</style>
