<template>
  
    <div class="setpointBlock" 
    @touchstart="handleTouchStart" 
    @touchend="handleTouchEnd('setpointBlock')"
    @touchmove="handleTouchMove"
    >
    <svg display="none"> // Задаем код для визуализации области скрола для изменения уставки
        <symbol id="iconTelegram" viewBox="0 0 24 24">
          <path style="fill-rule:evenodd;clip-rule:evenodd;" d="M12,0C5.373,0,0,5.373,0,12s5.373,12,12,12s12-5.373,12-12S18.627,0,12,0z    M17.562,8.161c-0.18,1.897-0.962,6.502-1.359,8.627c-0.168,0.9-0.5,1.201-0.82,1.23c-0.697,0.064-1.226-0.461-1.901-0.903   c-1.056-0.692-1.653-1.123-2.678-1.799c-1.185-0.781-0.417-1.21,0.258-1.911c0.177-0.184,3.247-2.977,3.307-3.23   c0.007-0.032,0.015-0.15-0.056-0.212s-0.174-0.041-0.248-0.024c-0.106,0.024-1.793,1.139-5.062,3.345   c-0.479,0.329-0.913,0.489-1.302,0.481c-0.428-0.009-1.252-0.242-1.865-0.442c-0.751-0.244-1.349-0.374-1.297-0.788   c0.027-0.216,0.324-0.437,0.892-0.663c3.498-1.524,5.831-2.529,6.998-3.015c3.333-1.386,4.025-1.627,4.477-1.635   C17.472,7.214,17.608,7.681,17.562,8.161z"/>
        </symbol>
        <symbol id="setpointSelector" 
        viewBox="0 0 440 60"  
        xmlns="http://www.w3.org/2000/svg" 
        stroke="white" 
        width="100%" 
        height="100%" 
        preserveAspectRatio="xMidYMid meet"
        >         
          <!-- <line x1="261.5" y1="10" x2="261.5" y2="50" stroke="white"/>
          <line x1="204.5" y1="10" x2="204.5" y2="50" stroke="white"/>
          <line x1="147.5" y1="10" x2="147.5" y2="50" stroke="white"/>
          <line x1="90.5" y1="10" x2="90.5" y2="50" stroke="white"/>
          <line x1="33.5" y1="10" x2="33.5" y2="50" stroke="white"/>
          <line x1="250.5" y1="10" x2="250.5" y2="50" stroke="white"/>
          <line x1="193.5" y1="10" x2="193.5" y2="50" stroke="white"/>
          <line x1="136.5" y1="10" x2="136.5" y2="50" stroke="white"/>
          <line x1="79.5" y1="10" x2="79.5" y2="50" stroke="white"/>
          <line x1="22.5" y1="10" x2="22.5" y2="50" stroke="white"/>
          <line x1="239.5" y1="10" x2="239.5" y2="50" stroke="white"/>
          <line x1="182.5" y1="10" x2="182.5" y2="50" stroke="white"/>
          <line x1="125.5" y1="10" x2="125.5" y2="50" stroke="white"/>
          <line x1="68.5" y1="10" x2="68.5" y2="50" stroke="white"/>
          <line x1="11.5" y1="10" x2="11.5" y2="50" stroke="white"/>
          <line x1="228.5" y1="10" x2="228.5" y2="50" stroke="white"/>
          <line x1="171.5" y1="10" x2="171.5" y2="50" stroke="white"/>
          <line x1="114.5" y1="10" x2="114.5" y2="50" stroke="white"/>
          <line x1="57.5" y1="10" x2="57.5" y2="50" stroke="white"/>
          <line x1="0.5" y1="10" x2="0.499998" y2="50" stroke="white"/>
          <line x1="273.5" y1="6.55671e-08" x2="273.5" y2="60" stroke="white" stroke-width="3"/>
          <line x1="216.5" y1="6.55671e-08" x2="216.5" y2="60" stroke="white" stroke-width="3"/>
          <line x1="159.5" y1="6.55671e-08" x2="159.5" y2="60" stroke="white" stroke-width="3"/>
          <line x1="102.5" y1="6.55671e-08" x2="102.5" y2="60" stroke="white" stroke-width="3"/>
          <line x1="45.5" y1="4" x2="45.5" y2="64" stroke="white" stroke-width="3"/>
          <line x1="285.5" y1="10" x2="285.5" y2="50" stroke="white"/>
          <line x1="296.5" y1="10" x2="296.5" y2="50" stroke="white"/>
          <line x1="307.5" y1="10" x2="307.5" y2="50" stroke="white"/>
          <line x1="318.5" y1="10" x2="318.5" y2="50" stroke="white"/> -->




            <!-- <svg width="433" height="60" viewBox="0 0 433 60" fill="none" xmlns="http://www.w3.org/2000/svg"> -->

<line x1="261.5" y1="10" x2="261.5" y2="50" stroke="white"/>
<line x1="204.5" y1="10" x2="204.5" y2="50" stroke="white"/>
<line x1="147.5" y1="10" x2="147.5" y2="50" stroke="white"/>
<line x1="90.5" y1="10" x2="90.5" y2="50" stroke="white"/>
<line x1="33.5" y1="10" x2="33.5" y2="50" stroke="white"/>
<line x1="250.5" y1="10" x2="250.5" y2="50" stroke="white"/>
<line x1="193.5" y1="10" x2="193.5" y2="50" stroke="white"/>
<line x1="136.5" y1="10" x2="136.5" y2="50" stroke="white"/>
<line x1="79.5" y1="10" x2="79.5" y2="50" stroke="white"/>
<line x1="22.5" y1="10" x2="22.5" y2="50" stroke="white"/>
<line x1="239.5" y1="10" x2="239.5" y2="50" stroke="white"/>
<line x1="182.5" y1="10" x2="182.5" y2="50" stroke="white"/>
<line x1="125.5" y1="10" x2="125.5" y2="50" stroke="white"/>
<line x1="68.5" y1="10" x2="68.5" y2="50" stroke="white"/>
<line x1="11.5" y1="10" x2="11.5" y2="50" stroke="white"/>
<line x1="228.5" y1="10" x2="228.5" y2="50" stroke="white"/>
<line x1="171.5" y1="10" x2="171.5" y2="50" stroke="white"/>
<line x1="114.5" y1="10" x2="114.5" y2="50" stroke="white"/>
<line x1="57.5" y1="10" x2="57.5" y2="50" stroke="white"/>
<line x1="0.5" y1="10" x2="0.499998" y2="50" stroke="white"/>
<line x1="273.5" y1="6.55671e-08" x2="273.5" y2="60" stroke="white" stroke-width="3"/>
<line x1="330.5" y1="6.55671e-08" x2="330.5" y2="60" stroke="white" stroke-width="3"/>
<line x1="387.5" y1="6.55671e-08" x2="387.5" y2="60" stroke="white" stroke-width="3"/>
<line x1="216.5" y1="6.55671e-08" x2="216.5" y2="60" stroke="white" stroke-width="3"/>
<line x1="159.5" y1="6.55671e-08" x2="159.5" y2="60" stroke="white" stroke-width="3"/>
<line x1="102.5" y1="6.55671e-08" x2="102.5" y2="60" stroke="white" stroke-width="3"/>
<line x1="45.5" y1="6.55671e-08" x2="45.5" y2="60" stroke="white" stroke-width="3"/>
<line x1="285.5" y1="10" x2="285.5" y2="50" stroke="white"/>
<line x1="342.5" y1="10" x2="342.5" y2="50" stroke="white"/>
<line x1="399.5" y1="10" x2="399.5" y2="50" stroke="white"/>
<line x1="296.5" y1="10" x2="296.5" y2="50" stroke="white"/>
<line x1="353.5" y1="10" x2="353.5" y2="50" stroke="white"/>
<line x1="410.5" y1="10" x2="410.5" y2="50" stroke="white"/>
<line x1="307.5" y1="10" x2="307.5" y2="50" stroke="white"/>
<line x1="364.5" y1="10" x2="364.5" y2="50" stroke="white"/>
<line x1="421.5" y1="10" x2="421.5" y2="50" stroke="white"/>
<line x1="318.5" y1="10" x2="318.5" y2="50" stroke="white"/>
<line x1="375.5" y1="10" x2="375.5" y2="50" stroke="white"/>
<line x1="432.5" y1="10" x2="432.5" y2="50" stroke="white"/>









        </symbol>
  
        <symbol id="setpointBigSelector" viewBox="0 0 6 60" xmlns="http://www.w3.org/2000/svg">
          <line x1="1.5" y1="6.55671e-08" x2="1.5" y2="60" stroke="white" stroke-width="3"/>
        </symbol>
  
        <symbol id="setpointSmallSelector" viewBox="0 0 34 40"  xmlns="http://www.w3.org/2000/svg">
          <line x1="33.5" y1="2.18557e-08" x2="33.5" y2="40" stroke="white"/>
          <line x1="22.5" y1="2.18557e-08" x2="22.5" y2="40" stroke="white"/>
          <line x1="11.5" y1="2.18557e-08" x2="11.5" y2="40" stroke="white"/>
          <line x1="0.5" y1="2.18557e-08" x2="0.499998" y2="40" stroke="white"/>
        </symbol>
  
  
    </svg>
 
    <div class="setpointValue">
        <svg class="setpointValue_icon">
          <use href="#setpointSelector"></use>
        </svg>

      <div class="setpointValue_number"> 
      <h1> {{ newSetPointValue }} </h1>
      </div>

        <svg class="setpointValue_icon">
          <use href="#setpointSelector"></use>
        </svg>

    </div>
    <div class="setpointLimits">
      <h4> {{ lowLimit }} </h4>
      <h4> {{ highLimit }} </h4>
    </div>
  
  
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        startX: 0,
        isTouching: false,
        newSetPointValue: this.setPoint,
      }
    },
    watch: {
      setPoint(newSetPoint) {
        // console.log('Изменилось значение Уставки setPoint :', newSetPoint, 'BodySetpontBlock');
        this.newSetPointValue = parseFloat(newSetPoint).toFixed(1);
        // console.log('Обновили newSetPointValue значение Уставки:', this.newSetPointValue, 'BodySetpontBlock');
      },
    },
    created() {
      this.debouncedCalculateSetpoint = this.debounce(this.calculateSetpoint, 16);
      },
    props: {   // Переменные полученные в компонент
      setPoint: Number,
      highLimit: Number,
      lowLimit: Number,
      step: Number,
    },
      methods: {
    sendEmitMessage(event, name, message) {
                this.$emit('eventsComponent',{
                    [event]: {
                        type: name,
                        message: message
                    }
                });
    },
    handleTouchStart(event) {
        // console.log('Компонент bodySetpointBlock событие - handleTouchStart', event.touches[0].clientX, event.touches[0].clientY);
        this.startX = event.touches[0].clientX;
        this.isTouching = true;
    },
    handleTouchEnd(component) {
        console.log('Функция handleTouchEnd (MainSetpoint) событие - handleTouchEnd, secectedComponent - ', component);
        if (component === 'setpointBlock') {
        // console.log('Разрешаем изменять значение для Компонента setpointBlock');
        const currentTime = new Date().getTime();
        this.lastTouchTime = currentTime;
        this.$emit('updateState', { updatePermission: true }); // Разрешаем обновление Уставки
        return;
      } else {
        return;
      }
    },
    handleTouchMove(event) {
        this.isTouching = false;
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.startX;
  
        if (deltaX < 8 && deltaX > - 8) {
          console.log('Недостаточное смещение контролла');
        } else {
          // console.log('Достаточное смещение контролла. Вызываем функцию calculateSetpoint. Смещение - ', deltaX, ' Шаг - ', this.step, ' Минимум - ', this.lowLimit, ' Максимум - ', this.highLimit);
          this.debouncedCalculateSetpoint(deltaX, this.step, this.lowLimit, this.highLimit);
        }
    },
    calculateSetpoint(value, step, min, max) {
        // console.log('BodySetpointBlock Функция calculateSetpoint Приступаем к вычислению уставки. Смещение - ', value,' Шаг - ', step, ' Минимум - ', min, ' Максимум - ', max, 'Текущее значение Уставки - ', this.setPoint);
        let newValue;
        const currentSetPoint = this.setPoint;
        try {
          if (value > 5 && value < 120) {
          newValue = currentSetPoint + step;
        // console.log('Увеличили SetPoint:', newSetPointValue);
        } else if (value < -5 && value > -120) {
          newValue = currentSetPoint - step;
          // console.log('Уменьшили SetPoint:', newSetPointValue);
        } else if (value > 120) {
          newValue = currentSetPoint + (step*10);
          // console.log('Увеличили SetPoint:', newSetPointValue);
        } else if (value < - 120) {
          newValue = currentSetPoint - (step*10);
          // console.log('Уменьшили SetPoint:', newSetPointValue);
        }
        } catch (error) {
          console.error('BodySetpointBlock Функция calculateSetpoint Ошибка вычисления изменения Уставки', error);
          this.sendEmitMessage('error', 'BodySetpointBlock Функция calculateSetpoint Ошибка вычисления изменения Уставки', error); // отправка логов на сервер для сохранения в файл
        }
  
       this.sendSetPoint(newValue, min, max);
    },

    sendSetPoint(setPoint, min, max) {
        if (setPoint !== undefined && setPoint !== null && min !== undefined && max) {
          try {
            if (setPoint > max) {
          setPoint = max;
            this.$emit('updateState', { newSetPoint: setPoint });
            // console.log(' BodySetpointBlock Функция sendSetPoint Ограничиваем Верхняю границу Уставки');
          } else if (setPoint < min) {
            setPoint = min;
            // console.log(' BodySetpointBlock Функция sendSetPoint Ограничиваем Нижнюю границу Уставки');
            this.$emit('updateState', { newSetPoint: setPoint });
          } else {
            // console.log(' BodySetpointBlock Функция sendSetPoint Отправляем Уставку без изменений');
            this.$emit('updateState', { newSetPoint: setPoint });
          }
          } catch (error) {
            console.error('BodySetpointBlock Функция sendSetPoint Ошибка проверки ограничений диапазона Уставки', error);
            this.sendEmitMessage('error', 'BodySetpointBlock Функция sendSetPoint Ошибка проверки ограничений диапазона Уставки', error); // отправка логов на сервер для сохранения в файл
          }
        } else {
          console.error('BodySetpointBlock Функция sendSetPoint Попытка проверки с неопределенными значениями setPoint', setPoint, 'min', min, 'max', max);
          this.sendEmitMessage('error', 'BodySetpointBlock Функция sendSetPoint Попытка проверки с неопределенными значениями setPoint: ', setPoint); 
      }
    },
    debounce(func, wait) {
        // console.log('Активирована задержка выполнения функции', func, 'в', wait, 'мсек');
      let timeout;
      return function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), wait);
      };
    },
 
  
      },
  }
  </script>
  
  <style scoped>
  
  </style>