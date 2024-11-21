<template>
      <!-- <svg display="none"> // Задаем код для визуализации области скрола для изменения уставки
        <symbol id="arrowRight" 
        viewBox="0 0 34 64"  
        xmlns="http://www.w3.org/2000/svg" 
        stroke="white" 
        width="100%" 
        height="100%" 
        preserveAspectRatio="xMidYMid meet"
        >         
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(-0.684508 0.729005 -0.684508 -0.729005 30.4863 28.9999)" stroke="#E0DFE7" stroke-width="4"/>
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(-0.684508 -0.729005 0.684508 -0.729005 33 31.4023)" stroke="#E0DFE7" stroke-width="4"/>
        </symbol>
        <symbol id="arrowLeft" 
        viewBox="0 0 34 64"  
        xmlns="http://www.w3.org/2000/svg" 
        stroke="white" 
        width="100%" 
        height="100%" 
        preserveAspectRatio="xMidYMid meet"
        >         
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(0.684508 -0.729005 0.684508 0.729005 3.51367 34.4023)" stroke="#E0DFE7" stroke-width="4"/>
        <line y1="-2" x2="43.0756" y2="-2" transform="matrix(0.684508 0.729005 -0.684508 0.729005 1 31.9999)" stroke="#E0DFE7" stroke-width="4"/>
      </symbol>
    </svg> -->
    <!-- <div>
      <svg class="setpointValue_icon">
          <use href="#arrowLeft"></use>
        </svg>
    </div> -->
    <div> 
        <h1> {{ title }} </h1>
        <h5> Mobile - {{ mobile }} </h5>
    </div>
    <!-- <div>
      <svg class="setpointValue_icon">
          <use href="#arrowRight"></use>
        </svg>
    </div> -->
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    },
    mobile: {
      type: Boolean,
    }
  },
  created() {
    // console.log('Header   ---  LOCATION ', this.title);
  },
}
</script>

<style>

</style>