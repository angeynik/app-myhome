<!-- DashBoard.vue -->
<template>
  <div class="app">
    <svg display="none">
      <symbol id="arrowRight" viewBox="0 0 34 64" xmlns="http://www.w3.org/2000/svg" stroke="white">
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(-0.684508 0.729005 -0.684508 -0.729005 30.4863 28.9999)" stroke="#E0DFE7" stroke-width="4"/>
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(-0.684508 -0.729005 0.684508 -0.729005 33 31.4023)" stroke="#E0DFE7" stroke-width="4"/>
      </symbol>
      <symbol id="arrowLeft" viewBox="0 0 34 64" xmlns="http://www.w3.org/2000/svg" stroke="white">
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(0.684508 -0.729005 0.684508 0.729005 3.51367 34.4023)" stroke="#E0DFE7" stroke-width="4"/>
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(0.684508 0.729005 -0.684508 0.729005 1 31.9999)" stroke="#E0DFE7" stroke-width="4"/>
      </symbol>
      <symbol id="homeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </symbol>
      <symbol id="menuIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </symbol>

      
<symbol id="icon_rooms" viewBox="0 0 512 512">
  <!-- Скруглённый фон -->
  <rect x="40" y="40" width="432" height="432" rx="64" fill="#1a2332" />
  <rect x="40" y="40" width="432" height="432" rx="64" fill="#232e3e" />
  <!-- Внешняя обводка -->
  <rect x="40" y="40" width="432" height="432" rx="64" fill="none" stroke="#E0DFE7" stroke-width="10" />
  <defs>
    <clipPath id="clip_rooms">
      <rect x="40" y="40" width="432" height="432" rx="64" />
    </clipPath>
  </defs>
  <g clip-path="url(#clip_rooms)">
    <!-- Уменьшаем всё внутреннее содержимое на 10% с центрированием -->
    <g transform="translate(256, 256) scale(0.9) translate(-256, -256)">
      <rect x="58" y="58" width="185" height="231" fill="#232e3e"/>
      <rect x="249" y="58" width="205" height="112" fill="#1e2a38"/>
      <rect x="249" y="176" width="205" height="113" fill="#1c2836"/>
      <rect x="58" y="289" width="396" height="165" fill="#253040"/>
      <rect x="58" y="58" width="396" height="8" fill="#2e3d52"/>
      <rect x="58" y="446" width="396" height="8" fill="#2e3d52"/>
      <rect x="58" y="58" width="8" height="396" fill="#2e3d52"/>
      <rect x="446" y="58" width="8" height="396" fill="#2e3d52"/>
      <rect x="243" y="58" width="12" height="92" fill="#2e3d52"/>
      <rect x="243" y="194" width="12" height="95" fill="#2e3d52"/>
      <rect x="58" y="283" width="80" height="12" fill="#2e3d52"/>
      <rect x="192" y="283" width="262" height="12" fill="#2e3d52"/>
      <rect x="243" y="170" width="130" height="12" fill="#2e3d52"/>
      <rect x="419" y="170" width="35" height="12" fill="#2e3d52"/>
      <rect x="93" y="88" width="51" height="37" rx="3" fill="#c05e10"/>
      <rect x="93" y="88" width="51" height="11" rx="2" fill="#141c28" opacity="0.4"/>
      <rect x="160" y="88" width="39" height="12" rx="3" fill="#4a5568"/>
      <rect x="160" y="104" width="39" height="12" rx="3" fill="#6b7a8e"/>
      <rect x="160" y="120" width="39" height="12" rx="3" fill="#4a5568"/>
      <rect x="93" y="135" width="106" height="11" rx="3" fill="#2e3d52"/>
      <rect x="84" y="185" width="90" height="60" rx="4" fill="#4a5568"/>
      <rect x="93" y="193" width="72" height="42" rx="2" fill="#3a4a5e"/>
      <rect x="263" y="72" width="166" height="76" rx="4" fill="#4a5568"/>
      <rect x="272" y="81" width="66" height="58" rx="3" fill="#3a4a5e"/>
      <rect x="345" y="81" width="76" height="32" rx="3" fill="#c05e10"/>
      <rect x="345" y="117" width="76" height="23" rx="3" fill="#6b7a8e"/>
      <rect x="263" y="188" width="120" height="58" rx="4" fill="#4a5568"/>
      <rect x="272" y="197" width="101" height="40" rx="3" fill="#3a4a5e"/>
      <rect x="72" y="308" width="67" height="99" rx="4" fill="#4a5568"/>
      <rect x="81" y="317" width="48" height="80" rx="2" fill="#3a4a5e"/>
      <rect x="152" y="308" width="92" height="51" rx="4" fill="#4a5568"/>
      <rect x="161" y="317" width="74" height="32" rx="2" fill="#3a4a5e"/>
      <rect x="152" y="366" width="44" height="41" rx="4" fill="#c05e10"/>
      <rect x="200" y="366" width="42" height="41" rx="4" fill="#6b7a8e"/>
      <rect x="265" y="302" width="162" height="110" rx="4" fill="#4a5568"/>
      <rect x="274" y="311" width="144" height="92" rx="3" fill="#3a4a5e"/>
    </g>
  </g>
</symbol>

<symbol id="icon_sensors" viewBox="0 0 512 512">
  <rect x="40" y="40" width="432" height="432" rx="64" fill="none" stroke="#E0DFE7" stroke-width="10" />
  <rect x="40" y="40" width="432" height="432" rx="64" fill="#1a2332"/>
  <rect x="40" y="40" width="432" height="432" rx="64" fill="#232e3e" />
  <circle cx="256" cy="258" r="68" fill="#4a5568"/>
  <circle cx="256" cy="258" r="52" fill="#3a4a5e"/>
  <circle cx="256" cy="258" r="34" fill="#f07820"/>
  <circle cx="256" cy="258" r="22" fill="#c05e10"/>
  <circle cx="256" cy="258" r="10" fill="#141c28"/>
  <path d="M190 195 Q170 230 170 258 Q170 286 190 321" fill="none" stroke="#6b7a8e" stroke-width="10" stroke-linecap="round"/>
  <path d="M322 195 Q342 230 342 258 Q342 286 322 321" fill="none" stroke="#6b7a8e" stroke-width="10" stroke-linecap="round"/>
  <path d="M158 162 Q126 210 126 258 Q126 306 158 354" fill="none" stroke="#4a5568" stroke-width="9" stroke-linecap="round"/>
  <path d="M354 162 Q386 210 386 258 Q386 306 354 354" fill="none" stroke="#4a5568" stroke-width="9" stroke-linecap="round"/>
  <rect x="244" y="170" width="24" height="24" rx="4" fill="#f07820"/>
  <polygon points="256,152 248,166 264,166" fill="#f07820"/>
  <rect x="108" y="362" width="52" height="18" rx="12" fill="#f07820"/>
  <circle cx="114" cy="371" r="4" fill="#141c28"/>
  <circle cx="124" cy="371" r="4" fill="#141c28"/>
  <circle cx="134" cy="371" r="4" fill="#141c28"/>
  <circle cx="144" cy="371" r="4" fill="#141c28"/>
  <circle cx="154" cy="371" r="4" fill="#141c28"/>
  <rect x="352" y="362" width="52" height="18" rx="12" fill="#4a5568"/>
  <circle cx="82" cy="82" r="12" fill="#141c28"/>
  <circle cx="430" cy="82" r="14" fill="#141c28"/>
  <circle cx="410" cy="70" r="7" fill="#f07820"/>
  <circle cx="82" cy="430" r="10" fill="#f07820"/>
  <circle cx="430" cy="438" r="8" fill="#141c28"/>
</symbol>

<symbol id="icon_devices" viewBox="0 0 512 512">
  <rect x="40" y="40" width="432" height="432" rx="64" fill="none" stroke="#E0DFE7" stroke-width="10" />
  <rect x="40" y="40" width="432" height="432" rx="64" fill="#1a2332"/>
  <rect x="40" y="40" width="432" height="432" rx="64" fill="#232e3e" />
  <rect x="96" y="128" width="138" height="186" rx="16" fill="#4a5568"/>
  <rect x="106" y="138" width="118" height="130" rx="8" fill="#3a4a5e"/>
  <rect x="118" y="150" width="94" height="94" rx="6" fill="#c05e10"/>
  <circle cx="165" cy="197" r="24" fill="#141c28"/>
  <circle cx="165" cy="197" r="14" fill="#f07820"/>
  <circle cx="165" cy="197" r="6" fill="#141c28"/>
  <rect x="130" y="282" width="48" height="8" rx="4" fill="#2e3d52"/>
  <circle cx="214" cy="290" r="8" fill="#f07820"/>
  <rect x="106" y="300" width="118" height="8" rx="4" fill="#3a4a5e"/>
  <rect x="278" y="128" width="138" height="186" rx="16" fill="#6b7a8e"/>
  <rect x="288" y="138" width="118" height="130" rx="8" fill="#3a4a5e"/>
  <rect x="300" y="150" width="94" height="40" rx="6" fill="#f07820"/>
  <rect x="308" y="158" width="40" height="8" rx="3" fill="#141c28" opacity="0.5"/>
  <rect x="308" y="172" width="60" height="5" rx="2" fill="#141c28" opacity="0.4"/>
  <rect x="300" y="205" width="40" height="32" rx="4" fill="#4a5568"/>
  <rect x="352" y="205" width="40" height="32" rx="4" fill="#8b9ab0"/>
  <rect x="300" y="248" width="94" height="12" rx="4" fill="#f07820"/>
  <rect x="296" y="280" width="28" height="8" rx="4" fill="#6b7a8e"/>
  <circle cx="376" cy="288" r="8" fill="#f07820"/>
  <rect x="288" y="300" width="118" height="8" rx="4" fill="#3a4a5e"/>
  <rect x="96" y="338" width="320" height="36" rx="14" fill="#f07820"/>
  <circle cx="116" cy="356" r="7" fill="#141c28"/>
  <circle cx="132" cy="356" r="7" fill="#141c28"/>
  <circle cx="148" cy="356" r="7" fill="#141c28"/>
  <circle cx="164" cy="356" r="7" fill="#141c28"/>
  <circle cx="180" cy="356" r="7" fill="#141c28"/>
  <rect x="300" y="344" width="100" height="24" rx="10" fill="#c05e10"/>
  <circle cx="312" cy="356" r="6" fill="#f07820" opacity="0.5"/>
  <circle cx="328" cy="356" r="6" fill="#f07820" opacity="0.5"/>
  <circle cx="344" cy="356" r="6" fill="#f07820" opacity="0.5"/>
  <circle cx="360" cy="356" r="6" fill="#f07820" opacity="0.5"/>
  <circle cx="430" cy="80" r="14" fill="#141c28"/>
  <circle cx="410" cy="70" r="7" fill="#f07820"/>
  <circle cx="82" cy="82" r="10" fill="#141c28"/>
  <circle cx="82" cy="430" r="12" fill="#141c28"/>
  <circle cx="430" cy="430" r="9" fill="#f07820"/>
</symbol>

<symbol id="icon_setpoints" viewBox="0 0 512 512">
  <!-- Скруглённый фон -->
  <rect x="40" y="40" width="432" height="432" rx="64" fill="#1a2332" />
  <rect x="40" y="40" width="432" height="432" rx="64" fill="#232e3e" />
  <!-- Внешняя обводка -->
  <rect x="40" y="40" width="432" height="432" rx="64" fill="none" stroke="#E0DFE7" stroke-width="10" />
  <defs>
    <clipPath id="clip_setpoints">
      <rect x="40" y="40" width="432" height="432" rx="64" />
    </clipPath>
  </defs>
  <g clip-path="url(#clip_setpoints)">
    <!-- Уменьшенный на 10% тёмный квадрат (356x356, центрирован) -->
    <rect x="78" y="78" width="356" height="356" fill="#141c28" />
    <!-- Остальное содержимое -->
    <rect x="78" y="96" width="356" height="96" rx="14" fill="#232e3e"/>
    <rect x="96" y="112" width="76" height="14" rx="4" fill="#4a5568"/>
    <rect x="96" y="112" width="38" height="14" rx="4" fill="#6b7a8e"/>
    <text x="256" y="144" font-family="monospace, sans-serif" font-size="32" font-weight="700" fill="#f07820" text-anchor="middle" dominant-baseline="central">22.5</text>
    <text x="302" y="144" font-family="sans-serif" font-size="14" font-weight="600" fill="#6b7a8e" text-anchor="start" dominant-baseline="central">°C</text>
    <rect x="92" y="158" width="130" height="8" rx="4" fill="#1a2332"/>
    <rect x="92" y="158" width="86" height="8" rx="4" fill="#f07820"/>
    <rect x="360" y="112" width="58" height="28" rx="8" fill="#4a5568"/>
    <polygon points="389,118 380,132 398,132" fill="#6b7a8e"/>
    <rect x="360" y="148" width="58" height="28" rx="8" fill="#f07820"/>
    <polygon points="389,170 380,156 398,156" fill="#141c28"/>
    <rect x="78" y="208" width="356" height="96" rx="14" fill="#232e3e"/>
    <rect x="96" y="224" width="76" height="14" rx="4" fill="#4a5568"/>
    <rect x="96" y="224" width="52" height="14" rx="4" fill="#6b7a8e"/>
    <text x="256" y="256" font-family="monospace, sans-serif" font-size="32" font-weight="700" fill="#f07820" text-anchor="middle" dominant-baseline="central">65</text>
    <text x="280" y="256" font-family="sans-serif" font-size="14" font-weight="600" fill="#6b7a8e" text-anchor="start" dominant-baseline="central">%</text>
    <rect x="92" y="270" width="130" height="8" rx="4" fill="#1a2332"/>
    <rect x="92" y="270" width="54" height="8" rx="4" fill="#c05e10"/>
    <rect x="360" y="224" width="58" height="28" rx="8" fill="#4a5568"/>
    <polygon points="389,230 380,244 398,244" fill="#6b7a8e"/>
    <rect x="360" y="260" width="58" height="28" rx="8" fill="#4a5568"/>
    <polygon points="389,282 380,268 398,268" fill="#6b7a8e"/>
    <rect x="78" y="320" width="356" height="96" rx="14" fill="#232e3e"/>
    <rect x="96" y="336" width="76" height="14" rx="4" fill="#4a5568"/>
    <rect x="96" y="336" width="64" height="14" rx="4" fill="#6b7a8e"/>
    <text x="248" y="368" font-family="monospace, sans-serif" font-size="32" font-weight="700" fill="#f07820" text-anchor="middle" dominant-baseline="central">1013</text>
    <text x="294" y="368" font-family="sans-serif" font-size="14" font-weight="600" fill="#6b7a8e" text-anchor="start" dominant-baseline="central">hPa</text>
    <rect x="92" y="382" width="130" height="8" rx="4" fill="#1a2332"/>
    <rect x="92" y="382" width="118" height="8" rx="4" fill="#f07820"/>
    <rect x="360" y="336" width="58" height="28" rx="8" fill="#c05e10"/>
    <polygon points="389,342 380,356 398,356" fill="#f07820"/>
    <rect x="360" y="372" width="58" height="28" rx="8" fill="#4a5568"/>
    <polygon points="389,394 380,380 398,380" fill="#6b7a8e"/>
  </g>
</symbol>

      
      <!-- <symbol id="icon_rooms" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </symbol>

      <symbol id="icon_sensors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
        <circle cx="12" cy="12" r="2"/>
      </symbol>
      
      <symbol id="icon_devices" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="4" width="20" height="12" rx="2"/>
        <line x1="8" y1="20" x2="16" y2="20"/>
        <line x1="12" y1="16" x2="12" y2="20"/>
      </symbol>
      
      <symbol id="icon_setpoints" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        <circle cx="12" cy="12" r="3"/>
      </symbol> -->

    </svg>

    <header class="header">
      <div class="header-top">
        <div class="icon" @click="goHome">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <use href="#homeIcon"></use>
          </svg>
        </div>

        <svg class="header_arrow" v-show="showHeaderArrow" @click="sortingBack">
          <use href="#arrowLeft"></use>
        </svg>
        <div style="display: flex; justify-content: center; width: 86%;">
          <MainHeader :title="headerTitle" :mobile="getMobile" />
        </div>
        
        <svg class="header_arrow" v-show="showHeaderArrow" @click="sortingForvard">
          <use href="#arrowRight"></use>
        </svg>

        <!-- <div class="icon">menu</div> -->
         <!-- иконка меню -->
        <div class="icon" @click="openMenu">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <use href="#menuIcon"></use>
          </svg>
        </div>

      </div>
      <p style="width: 100%; height: 1px; background-color: var(--orange);"></p>
      <div class="header-bottom">
        <nav>
          <!-- <router-link to="/">Главная</router-link> -->
          <router-link :to="{ name: 'DashboardSort', params: { sortType: 'rooms' } }">Комнаты</router-link>
          <router-link :to="{ name: 'DashboardSort', params: { sortType: 'params' } }">Датчики</router-link>
          <router-link :to="{ name: 'DashboardSort', params: { sortType: 'devices' } }">Устройства</router-link>
          <router-link :to="{ name: 'DashboardSort', params: { sortType: 'setpoints' } }">Уставки</router-link>
        </nav>
      </div>
    </header>

    <div class="body">
      <!-- Главное меню -->
      <div class="app-place_body" v-if="!$route.params.sortType && !$route.params.settingsType" id="app_place">
  <div class="app-place_item">
    <AppPlace icon="rooms" @select="selectComponent('rooms')" />
    <div class="app-place_title">Комнаты</div></div>
  <div class="app-place_item"><AppPlace icon="sensors" @select="selectComponent('params')" />
    <div class="app-place_title">Датчики</div></div>
  <div class="app-place_item"><AppPlace icon="devices" @select="selectComponent('devices')" />
    <div class="app-place_title">Устройства</div></div>
  <div class="app-place_item">
    <AppPlace icon="setpoints" @select="selectComponent('setpoints')" />
    <div class="app-place_title">Уставки</div></div>
</div>

      <!-- Динамический компонент для всех типов сортировки -->
      <!-- <router-view 
        v-else :key="$route.params.sortType"
        @eventsMainBody="handleMainBodyEvent"
        @swipe-forward="sortingForvard"
        @swipe-back="sortingBack"
        ref="mainBody"
      /> -->
       <router-view 
        v-else 
        :key="componentKey"
        @eventsMainBody="handleMainBodyEvent"
        @eventsMainBodySettings="handlePermitEvent"
        @getComponentData="getComponentData"
        @updateTypeValue="editValueMainSetpoint"
        @swipe="handleSwipe"
        :ref="currentRef"
      />

    </div>

    <footer class="footer"> 
      <MainFooter/>
    </footer>
    
    <InputDialog
      :visible="manualInputDialog.visible"
      :title="manualInputDialog.title"
      :initial-value="manualInputDialog.initialValue"
      :type="manualInputDialog.type"
      @confirm="onManualInputConfirm"
      @cancel="closeManualInputDialog"
    />
  </div>
  <!-- Плавающий блок MainSetpoint через Teleport -->
  <Teleport to="body">
    <div 
      class="setpoint-overlay" 
      v-if="showFooterSetpoint"
    >
      <MainSetpoint
        ref="mainSetpoint"
        :setPoint="setpoint"
        :request="request"
        :roomKey="selectedItemData.roomKey"
        :setpointKey="selectedItemData.setpointKey"
        :valueTitle="selectedItemData.valueTitle"
        @eventsMainSetpoint="editValueMainSetpoint"
        @eventsSchedule="editValueMainSetpoint"
        @inactivity-timeout="handleSetpointInactivity"
      />
    </div>
  </Teleport>
</template>

<script>
import logger from './store/modules/logger.js';

import { mapGetters, mapActions} from 'vuex';
import AppPlace from './components/AppPlace.vue';
import MainHeader from './components/MainHeader.vue';
import MainFooter from './components/MainFooter.vue';
import MainSetpoint from './components/MainSetpoint.vue';
import InputDialog from './components/InputDialog.vue';
import { nowMoscow, createTimePoint } from '@/utils/timeUtils';

export default { 
  name: 'DashBoard',
  components: { 
    AppPlace,
    MainHeader,
    MainFooter,
    MainSetpoint,
    InputDialog,
  }, 
  provide() {
    return {
      getMainSetpointEl: () => this.$refs.mainSetpoint?.$el ?? null
    };
  },
  data() { 
    return {
      showHeaderArrow: false,
      // showSetpoint: false,
      request: null,
      setpoint: null,
      selectedItemData: {},
      handlePermit: false,
      manualInputDialog: {
        visible: false,
        title: '',
        initialValue: null,
        type: 'number',    // 'number' или 'time'
        callback: null,    // функция, которая будет вызвана с новым значением
      },
      swipeThreshold: 50,
    }; 
  },
  async created() {
    await this.initializeSetpointsManager();
    logger.info('[DashBoard] - created ManageSetpoints - Менеджер сетпоинтов инициализирован Актуальные данные:', 
    JSON.parse(JSON.stringify(this.$store.state.setpointsManager)));
    console.log('[DashBoard] - created ManageSetpoints - Менеджер сетпоинтов инициализирован Актуальные данные:', 
    JSON.parse(JSON.stringify(this.$store.state.setpointsManager)));
  },
 
  computed: {
    ...mapGetters({ // Используем корневые геттеры
      getRoomKey: 'roomKey',
      getParamKey: 'paramKey',
      getDeviceKey: 'deviceKey',
      getSetpointKey: 'setpointKey',
    }),
    ...mapGetters(['level', 'dID', 'showSetpoint']),
    ...mapGetters('sortParams', [
      'updateSortKey',
      'currentSortType',
      'getRoomId',
      'getRoomTitle',
      'getParamTitle',
      'getSensorTitle',
    ]),
    ...mapGetters('config', ['getMobile', 'getDeviceType']),
    
    headerTitle() {
      const sortType = this.currentSortType;
      logger.dev(`[DashBoard] - headerTitle - Выбор заголовка для: ${sortType}`);
      //console.log('[DashBoard] - headerTitle - Выбор заголовка для sortType:', sortType);
      if (!sortType) {
        // Если это настройки
        if (this.$route.params.settingsType) {
          return "Настройки";
        }
        return "Главное меню";
      }
      
      if (sortType === 'rooms') {
        return this.getRoomKey ? `${this.getRoomTitle}` : "Сортировка по комнатам";
      } else if (sortType === 'params') {
        return this.getParamKey ? `${this.getSensorTitle(this.getParamKey)}` : "Сортировка по параметрам";
      } else if (sortType === 'devices') {
        return this.getDeviceKey ? `${this.getSensorTitle(this.getDeviceKey)}` : "Сортировка по устройствам";
      } else if (sortType === 'setpoints') {
        return this.getSetpointKey ? `${this.getSensorTitle(this.getSetpointKey)}` : "Сортировка по Уставкам";
      }
      return "Dashboard";
    },
    showFooterSetpoint() {
      return this.showSetpoint && this.setpoint !== null && this.setpoint !== undefined;
    },

    // Добавляем вычисляемые свойства для навигации
    hasParams() {
      return this.$route.params.sortType || this.$route.params.settingsType;
    },
    
    componentKey() {
      // Уникальный ключ для пересоздания компонента
      return this.$route.params.sortType || this.$route.params.settingsType || 'main';
    },
    
    currentRef() {
      // Динамическое имя ref в зависимости от типа компонента
      return this.$route.params.settingsType ? 'mainBodySettings' : 'mainBody';
    },


  },
  beforeUnmount() {
    if (this.setpointUpdateTimer) {
      clearTimeout(this.setpointUpdateTimer);
    }
  },
  watch: {
    '$route.params.sortType': {
      immediate: true,
      handler(newSortType) {
        this.$store.commit('SHOW_SETPOINT', false);
        this.handleSortTypeChange(newSortType);
      }
    },
    '$route.params.settingsType': {
      immediate: true,
      handler(newSettingsType) {
        this.handleSettingsTypeChange(newSettingsType);
      }
    },
    getConfig: {
      handler(newConfig) {
        if (newConfig) {
          logger.dev('[DashBoard] - Watch - handler - Конфигурация изменена, обновляем навигацию');
          console.log('[DashBoard] - Watch - handler - Конфигурация изменена, обновляем навигацию');
        }
      },
      deep: true
    }
  },
  methods: {
    createTimePoint,
    nowMoscow,
    ...mapActions('sortParams', [
      'switchSortKey',
      'UPDATE_LIMITS',
    ]),
    // ...mapActions('config', ['initialize']),
    ...mapActions('settingsConfig', ['settingsConfigUpdate', 'checkScheduleOverlap']),
    ...mapActions(['initializeSetpointsManager', 'updateSettingsData','updatePayloadData', 'updateLimitsData', 'updateViewData']),
    ...mapActions('dropdown', ['show']),
    
    handleSortTypeChange(sortType) {
      this.$store.commit('SHOW_SETPOINT', false);
      //console.log('[DashBoard] - handleSortTypeChange - Обновляем информацию для sortType: ', sortType);
      if (sortType) {
        // Устанавливаем тип сортировки в store
        this.$store.commit('sortParams/SET_SORT_TYPE', sortType);
        // Показываем стрелки для навигации (кроме уставок и на мобильных)
        this.showHeaderArrow = ['rooms', 'params', 'devices', 'setpoints'].includes(sortType) && !this.getMobile;
      } else {
        this.showHeaderArrow = false;
      }
    },
    handleSettingsTypeChange(settingsType) {
      console.log('[DashBoard] - handleSettingsTypeChange - Обновляем информацию для settingsType: ', settingsType);  
    },
    
    selectComponent(sortType) {
      //logger.info(`[DashBoard] - selectComponent - Выбор компонента: ${sortType}`);
      //console.log('[DashBoard] - selectComponent - Выбор компонента:', sortType);
      this.$store.commit('SHOW_SETPOINT', false);
      this.$router.push({ 
        name: 'DashboardSort', 
        params: { sortType } 
      });
      this.$store.commit('UPDATE_SETTINGS_DATA', { 
        field: 'room', 
        value: this.getRoomKey 
      });
      //console.log('[DashBoard] - selectComponent - Обновили комнату - ', this.getRoomKey);
      // Проверка
      // console.log('[DashBoard] - selectComponent - Комната в settingsData.payload:',
      //   this.$store.state.setpointsManager?.settingsData?.payload?.room
      // );
    },
    
    goHome() {
      this.$store.commit('SHOW_SETPOINT', false);
      this.$router.push('/');
    },
    openMenu(event) {
      event.stopPropagation();
      const isMobile = this.getMobile; // текущее состояние
      this.show({
        items: [
          { label: 'Профиль', action: 'profile' },
          { label: 'Настройки', action: 'settings' },
          { label: 'Выйти', action: 'logout' },
          { divider: true }, // разделитель
          { 
            label: isMobile ? '🖥️ Десктоп' : '📱 Мобильн',
            action: 'toggleMobile'
          }
        ],
        anchorElement: event.currentTarget,
      });
    },

    sortingBack() {
      this.$store.commit('SHOW_SETPOINT', false);
      const sortType = this.$route.params.sortType;
      logger.dev('[DashBoard] - sortingBack - Сортировка назад', sortType);
      console.log('[DashBoard] - sortingBack - Сортировка назад', sortType);
      this.switchSortKey({ sortingType: sortType, direction: 'prev' });
    },    
    sortingForvard() {
      this.$store.commit('SHOW_SETPOINT', false);
      const sortType = this.$route.params.sortType;
      logger.dev('[DashBoard] - sortingForvard - Сортировка назад', sortType);
      console.log('[DashBoard] - sortingForvard - Сортировка назад', sortType);
      this.switchSortKey({ sortingType: sortType, direction: 'next' });
    },



    // Работа с компонентом настройки Расписания, Уведомлений и Статистики
  async editValueMainSetpoint(eventData) { // Формирует сообщение при изменении уставки и выполняет отправку этого сообщения на сервер с фиксированной задержкой
    console.groupCollapsed('[DashBoard] - editValueMainSetpoint');
    console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения Уставки :', eventData);
    const settingsData = this.$store.state.setpointsManager?.settingsData;
    console.log('[DashBoard] - editValueMainSetpoint - Текущие settingsData:', settingsData.request);

    let dID = this.dID;
    let roomKey = settingsData?.payload?.room;
    let setpointKey = settingsData?.payload?.param;
    let requestName = eventData.updateState.request || 'unknown';
    let valueTitle = eventData.updateState.title || '';
    let value = eventData.updateState.value || '';
    let value_details = eventData.updateState.value_details || settingsData.payload.value_details || null;
    const value_type = settingsData.payload.value_type || 'absolute';

    if (!dID || !roomKey ) {
          logger.error(`[DashBoard] - editValueMainSetpoint - Не удалось обновить значение уставки: dID - ${dID}, roomKey - ${roomKey}, setpointKey - ${setpointKey} - не определены`);
          console.error('Не удалось обновить значение уставки: dID, roomKey или setpointKey не определены');
          return;
    }
    console.log('[DashBoard] - editValueMainSetpoint - REQUEST:', requestName, 'valueTitle -', valueTitle, 'value_type -', value_type);

    let oldValue, newValue, payload;
    try {
      oldValue = this.setpoint;
      if (valueTitle === 'startTime' || valueTitle === 'endTime') {
        value = parseFloat(eventData.updateState.value).toFixed(0);
      } else if (value_type === 'deviation') {
        //value = parseFloat(eventData.updateState.value).toFixed(2);
        value = Math.round(parseFloat(eventData.updateState.value) * 100) / 100;
      } else if (valueTitle === 'frequency') {
        value = parseInt(eventData.updateState.value, 10);
      } else if (typeof eventData.updateState.value === 'boolean') {
        value = eventData.updateState.value;
        console.log ('[DashBoard] - editValueMainSetpoint - Получили булевое значение', value);
      } else {
        //value = parseFloat(eventData.updateState.value).toFixed(1);
        value = Math.round(parseFloat(eventData.updateState.value) * 10) / 10;
      }
    this.setpoint = value;
    console.log('[DashBoard] - editValueMainSetpoint - Обновляем значение уставки:', this.setpoint);
    logger.dev('[DashBoard] - editValueMainSetpoint - Обновляем значение уставки:', value, ' oldValue -', oldValue);
    //console.log('[DashBoard] - editValueMainSetpoint - Обновляем значение уставки:', value, ' oldValue -', oldValue);
    console.groupEnd();

    
    switch (requestName) {
      case 'setpoints':
        console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения конфигурации - Уставка');
        payload = {
          room: roomKey, 
          param: settingsData.payload.param,
          value: value, 
          time: nowMoscow()
        };
        newValue = value;
        
      break;
      case 'schedules':
        console.log('[DashBoard] - editValueMainSetpoint -- case schedules -- Обработка данных от компонента MainSetpoint изменения конфигурации - Расписание');
        if (value_details === 'minutes' || value_details === 'hours') {
          //console.log('[DashBoard] - editValueMainSetpoint - value_details -', value_details);
          const settingsConfigUpdate = await this.$store.dispatch('settingsConfig/settingsConfigUpdate', {newValue: value, value_details});
          console.log('[DashBoard] - editValueMainSetpoint -- case schedules -- Результат проверки:', settingsConfigUpdate);
          if (settingsConfigUpdate.hasOverlap) {
          
            // Отображаем Уведомление для пользователя - PopupMenu.vue 
          this.$store.dispatch('popup/show', {
            message: `-- case schedules -- Время скорректировано из-за пересечения с другими расписаниями `,
            type: 'warning',
            duration: 1000
          });

            this.setpoint = oldValue;
          }
          newValue = settingsConfigUpdate.updatedValue;
          payload = {
            room: roomKey, 
            param: settingsData.payload.param,
            value: newValue, 
            time: nowMoscow()
          };
         
        }
         else {
          //console.log('[DashBoard] - editValueMainSetpoint - ', value_details);
          newValue = value;
          payload = {
            room: roomKey, 
            param: settingsData.payload.param,
            value: value, 
            value_type: value_type,
            time: nowMoscow()
          };
        }
        
      break;
      case 'notifications':
        console.log('[DashBoard] - editValueMainSetpoint -- case notifications --  Обработка данных от компонента MainSetpoint изменения конфигурации - Уведомления');
                if (value_details === 'minutes' || value_details === 'hours') {
          console.log('[DashBoard] - editValueMainSetpoint -- case notifications -- value_details-', value_details);
          const settingsConfigUpdate = await this.$store.dispatch('settingsConfig/settingsConfigUpdate', {newValue: value, value_details});
          console.log('[DashBoard] - editValueMainSetpoint -- case notifications -- Результат проверки:', settingsConfigUpdate);
          if (settingsConfigUpdate.hasOverlap) {
          
            // Отображаем Уведомление для пользователя - PopupMenu.vue 
          this.$store.dispatch('popup/show', {
            message: `-- case notifications -- Время скорректировано из-за пересечения с другими расписаниями `,
            type: 'warning',
            duration: 1000
          });

            this.setpoint = oldValue;
          }
          newValue = settingsConfigUpdate.updatedValue;
          payload = {
            room: roomKey, 
            param: settingsData.payload.param,
            value: newValue, 
            time: nowMoscow()
          };
         
        }
         else {
          //console.log('[DashBoard] - editValueMainSetpoint - -- ДОПИСЫВАЕМ ОБРАБОТКУ ИЗМЕНЕНИЯ ВРЕМЕНИ -- ДЛЯ', value_details);
          newValue = value;
          payload = {
            room: roomKey, 
            param: settingsData.payload.param,
            value: value, 
            value_type: value_type,
            time: nowMoscow()
          };
        }
        break;
      case 'statistics':
        console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения конфигурации - Статистика');
        newValue = value;
        payload = {
            room: roomKey, 
            param: settingsData.payload.param,
            value: newValue, 
            time: nowMoscow()
          };
      break;
    
      default:
        console.log('[DashBoard] - editValueMainSetpoint - Обработка данных от компонента MainSetpoint изменения конфигурации - ?????');
        break;
    }
    //console.log('[DashBoard] - editValueMainSetpoint - Сформирован payload', payload);
      
    } catch (error) {
      return error;
    }

    logger.dev('[DashBoard] - editValueMainSetpoint - Формируем сообщение для отпраку на сервер:', payload);
    console.log('[DashBoard] - editValueMainSetpoint - Формируем сообщение для отпраку на сервер:', payload);
    console.groupEnd();

    if (newValue !== undefined && !Number.isNaN(newValue)) {
      this.updatePayloadData({ value: newValue });
    }
    await this.$store.dispatch('config/handleValueUpdate', { dID, payload, type: requestName });

    console.log('[DashBoard] - editValueMainSetpoint - ', eventData);
      //this.sendChangedData(eventData);
      const sendTimer = this.sendChangedData(eventData);
      if (sendTimer) this.setpoint = oldValue;
    
      // Установка нового таймера для отправки на сервер
      if (this.setpointUpdateTimer) {
        clearTimeout(this.setpointUpdateTimer);
        console.log('[DashBoard] - editValueMainSetpoint - Предыдущий таймер очищен');
      }
        this.setpointUpdateTimer = setTimeout(async () => {
          try {
            logger.dev('[DashBoard] - editValueMainSetpoint - Обновляем уставку -', value, ' roomKey -', roomKey, ' setpointKey -', setpointKey, 'valueTitle -', valueTitle);
            console.log('[DashBoard] - editValueMainSetpoint - Обновляем уставку -', value, ' roomKey -', roomKey, ' setpointKey -', setpointKey, 'valueTitle -', valueTitle, 'request-', requestName);
            
        await this.$store.dispatch('config/updateSetpointServer'); // Отправляем на данные из settingsData - index.js на сервер
             
            logger.info('[DashBoard] - editValueMainSetpoint - Уставка успешно отправлена на сервер после задержки');
            //console.log('Уставка успешно отправлена на сервер после задержки');
          } catch (error) {
            logger.error('[DashBoard] - editValueMainSetpoint - Ошибка при отправке уставки на сервер:', error);
            //console.error('Ошибка при отправке уставки на сервер:', error);
            // Откат значения при ошибке
            this.setpoint = oldValue;
          }
        }, 500);

        // Запускаем повторную сортировку через изменение флага Обновления updateView
        this.$store.commit('sortParams/SET_FORCE_UPDATE', Date.now());
        console.groupEnd();
  },
  sendChangedData (event) {
    console.log('[DashBoard] - sendChangedData - Запускаем таймер задержки отправки на данных на сервер', event);
    //const oldValue = event.updateState.value;
      // Установка нового таймера для отправки на сервер
      if (this.setpointUpdateTimer) {
        clearTimeout(this.setpointUpdateTimer);
        console.log('[DashBoard] - sendChangedData - Предыдущий таймер очищен');
      }
        const value = event.updateState.value;
        console.log('[DashBoard] - sendChangedData - event.updateState.value', value, 'event.updateState.request: ', event.updateState.request);
        this.updatePayloadData({ value: value });
        this.setpointUpdateTimer = setTimeout(async () => {
          try {    
            await this.$store.dispatch('config/updateSetpointServer'); // Отправляем на данные из settingsData - index.js на сервер
             
            logger.info('[DashBoard] - sendChangedData - Уставка успешно отправлена на сервер после задержки');
            console.log('[DashBoard] - sendChangedData - Данные  успешно отправлены на сервер после задержки');
            return true;
          } catch (error) {
            logger.error('[DashBoard] - sendChangedData - Ошибка при отправке уставки на сервер:', error);
            console.error('Ошибка при отправке уставки на сервер:', error);
            return false;
          }
        }, 200);
  },
  getComponentData(event) {
      console.log('[DashBoard] - getComponentData - Данные от компонента:', event);
      this.request = event.request;
      this.setpoint = event.updateState.value;
      if (event.action === 'show') {  
        console.log('[DashBoard] - getComponentData - Показываем компонент MainSetpoint с данными:', event.updateState.value);
        this.$store.commit('SHOW_SETPOINT', true);
        this.selectedItemData = {
          roomKey: this.$store.state.setpointsManager?.settingsData?.payload?.room,
          setpointKey: event.updateState.paramKey || this.$store.state.setpointsManager?.settingsData?.payload?.param,
          valueTitle: event.updateState.title,
        };
        console.log('[DashBoard] - getComponentData - Компонент MainSetpoint показан', this.selectedItemData);
      } else if (event.action === 'hide') {
        this.$store.commit('SHOW_SETPOINT', false);
        //console.log('[DashBoard] - getComponentData - Компонент MainSetpoint скрыт');
          this.sendChangedData(
            {updateState : {
              request: event.request,
              title: event.updateState.title,
              value: event.updateState.value
            }});
      }

  },









  

// Блок для управления ручным редактированием значения
      changeeventHandlePermit (event) {
        if (!event.handlePermit) this.handlePermit = event.handlePermit;
        console.log('[DashBoard] - handlePermitEvent', event.handlePermit);
      },
      handlePermitEvent(event) {
        
        if (event.handlePermit === true) {
          this.openManualInputDialog({
            title: event.title,
            initialValue: event.currentValue,
            type: event.inputType,
            callback: (newValue) => {
              // После подтверждения вызываем метод, который обновит данные через store и дочерние компоненты
              this.processManualInputUpdate({
                id: event.id,
                field: event.field,
                newValue: newValue,
                scheduleData: event.scheduleData,
              });
            },
          });
        } else {
          // остальная логика обработки событий MainBodySettings
        }
      },
      processManualInputUpdate({ id, field, newValue, scheduleData }) {
        console.log('[DashBoard] - processManualInputUpdate - Получены данные с ручной формы ввода InputDialog', newValue, scheduleData);
        // Обновляем через существующие механизмы
        // this.updateSettingsData({ field: 'request', value: 'updateSchedules' });
        this.updatePayloadData({
          id: id,
          value: newValue,
          value_name: field,
          value_details: '',
        });
        // Эмитим событие вниз (через ref) для обновления UI
        // this.$refs.mainBodySettings?.$emit('getDataScheduleItem', {
        //   value: newValue,
        //   title: field,
        //   value_type: scheduleData?.value_type,
        // });
      },
    // Открыть диалог ручного ввода InputDialog.vue
      openManualInputDialog({ title, initialValue, type, callback }) {
        this.manualInputDialog = {
          visible: true,
          title,
          initialValue,
          type,
          callback,
        };
      },
      // Закрыть диалог InputDialog.vue
      closeManualInputDialog() {
        this.manualInputDialog.visible = false;
      },
      // Подтверждение ввода InputDialog.vue
      onManualInputConfirm(newValue) {
        if (this.manualInputDialog.callback) {
          this.manualInputDialog.callback(newValue);
        }
        this.closeManualInputDialog();
      },
// Окончание Блока для управления ручным редактированием значения

  handleSwipe(event){
    console.log('[DashBoard] - handleSwipe - Получены данные ', event);
    if (event > this.swipeThreshold) {console.log('[DashBoard] - handleSwipe - Смещение вперед'); this.sortingBack();}
    if (event < -(this.swipeThreshold)) {console.log('[DashBoard] - handleSwipe - Смещение назад'); this.sortingForvard();}
  },

  handleSetpointInactivity() {
    // Логирование для отладки
    logger.dev('[DashBoard] - handleSetpointInactivity - Бездействие в MainSetpoint, скрываем панель');
    console.log('[DashBoard] - handleSetpointInactivity - Бездействие, скрываем панель');

    // Скрываем панель MainSetpoint через Vuex
    this.$store.commit('SHOW_SETPOINT', false);

    // Очищаем локальные данные, связанные с текущей уставкой
    this.setpoint = null;
    this.selectedItemData = {};
    this.request = null;
  },

  }
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>