// Пример реализации ModBus RTU для RS485

const ModbusRTU = require('modbus-serial');

// Настройка сервера Express
const app = express();
const port = 3000;

// Инициализация клиента Modbus
const modbusClient = new ModbusRTU();

// Подключение к последовательному порту
modbusClient.connectRTU('/dev/ttyUSB0', { baudRate: 9600, parity: 'none' })
    .then(() => {
        console.log('Подключено к Modbus устройству.');
    })
    .catch(err => {
        console.error('Ошибка подключения:', err);
    });

// Пример маршрута для чтения данных из Modbus устройства
app.get('/read-registers', async (req, res) => {
    try {
        // Установка ID устройства
        modbusClient.setID(1);

        // Чтение 10 регистров начиная с адреса 0
        const data = await modbusClient.readHoldingRegisters(0, 10);

        // Отправка данных в ответе
        res.json({ registers: data.data });
    } catch (error) {
        console.error('Ошибка чтения:', error);
        res.status(500).send('Ошибка чтения данных.');
    }
});

// Пример записи 
app.post('/write-register', async (req, res) => {
    try {
        modbusClient.setID(1); // ID устройства
        const address = 0; // Адрес регистра
        const value = 123; // Значение для записи

        await modbusClient.writeRegister(address, value);
        res.send('Данные успешно записаны!');
    } catch (error) {
        console.error('Ошибка записи:', error);
        res.status(500).send('Ошибка записи.');
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
