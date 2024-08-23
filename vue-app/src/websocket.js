const btn = document.getElementById('btn');

const socket = new WebSocket('ws://localhost:9202');

socket.onopen = () => {
    console.log('Соединение установлено');
};

socket.onmessage = (event) => {
    console.log(`Получено сообщение: ${event.data}`);
};

socket.onclose = (event) => {
    console.log(`Соединение закрыто: ${event.code}`);
};

socket.onerror = (error) => {
    console.log(`Произошла ошибка: ${error.message}`);
};

