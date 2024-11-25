// Класс checkConfigs предназначен для работы с данными конфигурации а именно
// Метод readLocalStorage - для корректного получения данных из localStorage (преобразование стринговых значений в числовые и булевые там где это необходимо)
// Метод typeofValue - проверяет тип переменной в конфигурации commonConfig по значению ключа в конфигурации manageConfig 
// Метод  typeofName - проверяет по имени переменной ее тип в конфигурации manageConfig 

class CheckConfigs {
    constructor(manageConfig = {}, commonConfig = {}, directoryConfig = {}) {
        //console.log("Для класса CheckConfigs вызван конструктор с параметрами: ", manageConfig, commonConfig, directoryConfig);
        this.manageConfig = manageConfig;
        this.commonConfig = commonConfig;
        this.directoryConfig = directoryConfig;
    }

    // Статические переменные
    static manage = 'manageConfig';
    static common = 'commonConfig';
    static directory = 'directoryConfig';
  
    // Обычные методы
    getConfig(name) { // Получаем конфигурацию по имени - ключу
       console.log('Для класса CheckConfigs вызван метод getConfig для получения конфигурации: ', name);
       switch(name) {
           case CheckConfigs.manage:
               return this.manageConfig !== undefined && this.manageConfig !== null ? this.manageConfig : 'Конфигурация не найдена';
           case CheckConfigs.common:
               return this.commonConfig !== undefined && this.commonConfig !== null ? this.commonConfig : 'Конфигурация не найдена';
           case CheckConfigs.directory:
               return this.directoryConfig !== undefined && this.directoryConfig !== null ? this.directoryConfig : 'Конфигурация не найдена';
           default:
               return 'Конфигурация не найдена';
       }
    }
// Получение конфигурации checkConfigs.getConfig(CheckConfigs.manage));

    setConfig(name, config) { // Сохраняем конфигурацию по имени - ключу
        console.log('Для класса CheckConfigs вызван метод setConfig для сохранения конфигурации: ', name, config);
        
        // Проверка корректности данных
        if (!name || typeof name !== 'string') {
            console.error('Ошибка: Неправильное значение name');
            return 'Неправильное значение name';
        }

        if (typeof config !== 'object' || config === null) {
            console.error('Ошибка: Неправильное значение config');
            return 'Неправильное значение config';
        }
        
        switch(name) {
            case CheckConfigs.manage:
                this.manageConfig = config;
                break;
            case CheckConfigs.common:
                this.commonConfig = config;
                break;
            case CheckConfigs.directory:
                this.directoryConfig = config;
                break;
            default:
                console.error('Ошибка: Конфигурация не найдена');
                return 'Конфигурация не найдена';
        }
    }
// Обновление конфигурации checkConfigs.setConfig(CheckConfigs.manage, array); 

    setMessage(name, message) {
        console.log(' Class - checkConfigs вызван метод setMessage с параметрами: ', message, 'name: ', name);
    }
// Сохранение сообщенияcheckConfigs.setMessage(CheckConfigs.manage, mesaage); 
    find(config, type, param) {
        //console.log("Для класса checkConfigs вызван метод find с параметрами: ", config, type, param);
        if (type === 'setpoint') {
            console.log('Поиск значения для параметра setpoint');
            const name = 'set'+param.paramKey;
            console.log('Определили имя - ', name);
            const common = this[config].common;
            const set = common.setpoint;
            //const set = param.id;
            // var setpoint = this[config].setpoint[name];
            return {set, name};
        }
    }
    findRoomTitle(config, room_id) {
        //console.log(' Class - checkConfigs вызван метод findRoomTitle с параметрами: ', config, room_id);
        return this[config].rooms[room_id].title;
    }
    getUniqueSensorKeys(config) { // Получаем уникальные ключи датчиков
        //console.log(' Class - checkConfigs вызван метод getUniqueSensorKeys с параметрами: ', config);
        let uniqueKeys = new Set();
    
        for (const roomKey in config) {
            if (config[roomKey].sensors) {
                const sensorKeys = Object.keys(config[roomKey].sensors);
               
                sensorKeys.forEach(key => {
                    const cleanKey = key.replace(/[0-9]/g, '').substring(1);
                    if (isNaN(cleanKey)) {
                        uniqueKeys.add(cleanKey);
                    }
                });
            }
        }
        return Array.from(uniqueKeys);
    }
   
    updateRoomId(array, room_id, direction) {
        let id;
        //console.log(' Class - checkConfigs вызван метод updateRoomIndex с параметрами: ', array, room_id, calcDirection);
        const length = Object.keys(array).length;
        if (direction === false) { // Уменьшение id на 1, если значение первое, вернуть индекс последнего элемента 
            //console.log('Уменьшение id на 1, если значение первое, вернуть индекс последнего элемента');
            id = (room_id - 1 + length) % length; 
            if (id === 0) {
                id = length-1;
            }
        } else if (direction === true) { // Увеличение id на 1, если значение последнее, вернуть индекс первого элемента 
            //console.log('Увеличение id на 1, если значение последнее, вернуть индекс первого элемента');
            id =(room_id + 1) % length;
            if (id === length || id === 0) {
                id = 1;
            }
        }   
        for (let room in array) {
            if (array[room].id === id) {
                // const roomId = room;
                return {
                    roomId: id,
                    roomKey: room,
                    roomTitle: array[room].title
                }
            }
        }
    }
    updateParamKey(array, param_key, direction) {
        console.log(' Class - checkConfigs вызван метод updateParamIndex с параметрами: array: ', array, 'currentKey: ', param_key, 'direction: ', direction);
        const currentIndex = array.indexOf(param_key);
        console.log(' Class - checkConfigs вызван метод updateParamIndex с параметрами: currentIndex', currentIndex);
        if (currentIndex === -1) {
            console.error('Текущий ключ не найден в массиве');
            return null;
        }
        let newIndex;
    
        if (direction) {
            // Следующий элемент
            newIndex = (currentIndex + 1) % array.length;
        } else {
            // Предыдущий элемент
            newIndex = (currentIndex - 1 + array.length) % array.length;
        }
        return array[newIndex];
       
    }

    checkSymbol(variable, indexSymbol, symbol = '', addSymbol = '') {
        // variable = Переменная для проверки например 'dTemp'
        // indexSymbol = Позиция символа в строке например '0' или '1'
        // symbol = Символ для проверки например 'd'
        // addSymbol = Дополнительные символы для добавления например 'limDown'

        if (indexSymbol === undefined || indexSymbol === null) {
            return symbol + addSymbol;
        } else {
            if (variable[indexSymbol] === symbol) {
                return variable.substring(indexSymbol + 1);
            }
            return variable;
        }
    }
    typeofValue(value) {
        console.log("Для класса checkConfigs вызван метод typeofValue с параметрами: ", value);
        // Ваш код здесь
    }

    typeofName(name) {
        console.log("!!! Class - checkConfigs вызван метод typeofValue с параметрами: ", name);
        if (name === 'dTemp' || name === 'dHum') {
            return true
        } else {
            return false
        }
    }





    // setManageConfig(directoryConfig) {
    //     this.manageConfig = directoryConfig;
    //     console.log(" Class - checkConfigs вызван метод setManageConfig для получения конфигурации manageConfig: ");
    // }
    // setCommonConfig(commonConfig) {
    //     this.commonConfig = commonConfig;
    //     console.log(" Class - checkConfigs вызван метод setCommonConfig для получения конфигурации commonConfig: ");
    // }
    // setDirectoryConfig(directoryConfig) {
    //     this.directoryConfig = directoryConfig;
    //     console.log(" Class - checkConfigs вызван метод setDirectoryConfig для получения конфигурации directoryConfig: ");
    // }
    
}
// class CalcTime {
//     updateGup(config, params) {
//         console.log('Class - calcTime вызван метод updateGup с параметрами: ', config, params);
//         return 200;

//     }
// }
export default CheckConfigs;
