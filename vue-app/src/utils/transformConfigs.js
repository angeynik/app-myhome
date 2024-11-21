// Класс checkConfigs предназначен для работы с данными конфигурации а именно
// Метод readLocalStorage - для корректного получения данных из localStorage (преобразование стринговых значений в числовые и булевые там где это необходимо)
// Метод typeofValue - проверяет тип переменной в конфигурации commonConfig по значению ключа в конфигурации manageConfig 
// Метод  typeofName - проверяет по имени переменной ее тип в конфигурации manageConfig 

class CheckConfigs {
    constructor(manage = {}, common = {}, directory = {}) {
        // console.log("Для класса checkConfigs вызван конструктор с параметрами: ", manage, common, directory);
        this.manageConfig = manage;
        this.commonConfig = common;
        this.directoryConfig = directory;
        // Инициализация, если необходимо
    }
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
    getUniqueSensorKeys(config) { // Получаем уникальные ключи датчиков
        let uniqueKeys = new Set();
    
        for (const roomKey in config) {
            if (config[roomKey].sensors) {
                const sensorKeys = Object.keys(config[roomKey].sensors);
               
                sensorKeys.forEach(key => {
                    const cleanKey = key.replace(/[0-9]/g, '');
                    if (isNaN(cleanKey)) {
                        uniqueKeys.add(cleanKey);
                    }
                });
            }
        }
        return Array.from(uniqueKeys);
    }
   
    updateRoomId(array, room_id, calcDirection) {
        let id;
        console.log(' Class - checkConfigs вызван метод updateRoomIndex с параметрами: ', array, room_id, calcDirection);
        const length = Object.keys(array).length;
        if (calcDirection === false) { // Уменьшение id на 1, если значение первое, вернуть индекс последнего элемента 
            id = (room_id - 1 + length) % length; 
        } else if (calcDirection === true) { // Увеличение id на 1, если значение последнее, вернуть индекс первого элемента 
            id =(room_id + 1) % length; 
        } 
        if (id === 0) {
            id = length-1;
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
    updateParamKey(length, paramKey, value) {
        console.log(' Class - checkConfigs вызван метод updateParamIndex с параметрами: ', length, paramKey, value);
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
        //console.log("!!! Class - checkConfigs вызван метод typeofValue с параметрами: ", name);
        if (name === 'dTemp' || name === 'dHum') {
            return true
        } else {
            return false
        }
    }
    setManageConfig(manage) {
        this.manageConfig = manage;
        console.log(" Class - checkConfigs вызван метод setManageConfig для получения конфигурации manageConfig: ");
    }
    setCommonConfig(common) {
        this.commonConfig = common;
        console.log(" Class - checkConfigs вызван метод setCommonConfig для получения конфигурации commonConfig: ");
    }
    setDirectoryConfig(directory) {
        this.directoryConfig = directory;
        console.log(" Class - checkConfigs вызван метод setDirectoryConfig для получения конфигурации directoryConfig: ");
    }
    
}
// class CalcTime {
//     updateGup(config, params) {
//         console.log('Class - calcTime вызван метод updateGup с параметрами: ', config, params);
//         return 200;

//     }
// }
export default CheckConfigs;
