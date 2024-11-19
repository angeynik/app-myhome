// Класс checkConfigs предназначен для работы с данными конфигурации а именно
// Метод readLocalStorage - для корректного получения данных из localStorage (преобразование стринговых значений в числовые и булевые там где это необходимо)
// Метод typeofValue - проверяет тип переменной в конфигурации commonConfig по значению ключа в конфигурации manageConfig 
// Метод  typeofName - проверяет по имени переменной ее тип в конфигурации manageConfig 

class checkConfigs {
    constructor() {
        // Инициализация, если необходимо
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
}

export default checkConfigs;
