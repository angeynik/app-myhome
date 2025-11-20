// store/modules/logger.js

const LOG_LEVEL = process.env.VUE_APP_LOG_LEVEL || 'info';

let logInfo = false;
let logDev = false;
let logError = false;

// Инициализация уровней логирования
function initLogging() {
  const level = LOG_LEVEL.toLowerCase();
  
  if (level === 'dev') {
    logDev = true;
    logInfo = true;
    logError = true;
  } else if (level === 'error') {
    logInfo = true;
    logError = true;
  } else if (level === 'info') {
    logInfo = true;
  } else if (level === 'prod'){
    logError = true;
  }
 
  console.log(`[Logger] Инициализирован уровень логирования: ${LOG_LEVEL}`);
  if (logInfo || logDev) console.log(`[Logger] Info: ${logInfo}, Dev: ${logDev}, Error: ${logError}`);
}

// Функции для безопасного логирования
function logInfoMessage(...args) {
  if (logInfo) console.log(`[INFO]`, ...args);
}

function logDevMessage(...args) {
  if (logDev) console.log(`[DEV]`, ...args);
}

function logErrorMessage(...args) {
  if (logError) console.error(`[ERROR]`, ...args);
}

// Функции для проверки уровней (можно использовать в условиях)
function isInfoEnabled() {
  return logInfo;
}

function isDevEnabled() {
  return logDev;
}

function isErrorEnabled() {
  return logError;
}

// Инициализируем при импорте
initLogging();

export default {
  info: logInfoMessage,
  dev: logDevMessage,
  error: logErrorMessage,
  isInfoEnabled,
  isDevEnabled,
  isErrorEnabled
};