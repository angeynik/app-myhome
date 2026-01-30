<!-- components/MainBodyNotifications.vue -->
<template>
    <!-- <h2>Уведомления</h2> -->
<div class="settings-block" v-if="visible">
        <!-- Информация о расписании -->
    <div v-if="scheduleData.id" class="settings-info">
      <div class="settings-info-item">
        <span class="settings-info-value">ID:</span>
        <span class="settings-info-value">{{ scheduleData.id }}</span>
      </div>
      <div class="settings-info-item" v-if="scheduleData.createdAt">
        <span class="settings-info-value">Создано:</span>
        <span class="settings-info-value">{{ formatDate(scheduleData.createdAt) }}</span>
      </div>
      <div class="settings-info-item" v-if="scheduleData.updatedAt">
        <span class="settings-info-value">Обновлено:</span>
        <span class="settings-info-value">{{ formatDate(scheduleData.updatedAt) }}</span>
      </div>
    </div>



     <div  class="settings-block-title clickable" @click.stop="toggleValueType" >
        <p> {{ valueTypeLabel }} </p>
    </div>



 </div>
</template>

<script>
import logger from '../store/modules/logger.js';
import { mapGetters } from 'vuex';

export default {
      name: 'MainBodyNotifications',
  
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    scheduleData: {
      type: Object,
      required: true
    },
    scheduleUnit: {
      type: String,
      default: null
    }
  },
    data() {
    return {
    };
  },
  computed: {
    ...mapGetters(['level']),
    
    userLevel() {
      return this.level || 0;
    },
  },
  watch: {
    scheduleData: {
      handler(newData) {
        logger.dev('[MainBodySchedule] - Данные расписания обновлены:', newData);
      },
      deep: true
    }
  },
  


}
</script>

<style lang="css" src="../assets/mainStyle.css"> 

</style>