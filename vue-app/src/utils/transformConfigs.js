// Класс checkConfigs предназначен для работы с данными конфигурации а именно
// Метод readLocalStorage - для корректного получения данных из localStorage (преобразование стринговых значений в числовые и булевые там где это необходимо)
// Метод typeofValue - проверяет тип переменной в конфигурации commonConfig по значению ключа в конфигурации manageConfig 
// Метод  typeofName - проверяет по имени переменной ее тип в конфигурации manageConfig 

class checkConfigs {
    constructor(manage = {}, common = {}, directory = {}) {
        // console.log("Для класса checkConfigs вызван конструктор с параметрами: ", manage, common, directory);
        this.manageConfig = manage;
        this.commonConfig = common;
        this.directoryConfig = directory;
        // Инициализация, если необходимо
    }
    find(config, type, param) {
        console.log("Для класса checkConfigs вызван метод find с параметрами: ", config, type, param);
        if (type === 'setpoint') {
            console.log('Поиск значения для параметра setpoint');
            const name = 'set'+param.paramKey;
            console.log('Определили имя - ', name);
            const common = this.manageConfig.common;
            const set = common.setpoint;
            //const set = param.id;
            // var setpoint = this[config].setpoint[name];
            return {set, name};
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

export default checkConfigs;
