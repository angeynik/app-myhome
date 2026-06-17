// store/modules/logger.js

const LOG_LEVEL = process.env.VUE_APP_LOG_LEVEL || 'info';

let logInfo = false;
let logDev = false;
let logError = false;
let logWarn = false;

// Инициализация уровней логирования
function initLogging() {
  const level = LOG_LEVEL.toLowerCase();
  
  if (level === 'dev') {
    logDev = true;
    logInfo = true;
    logError = true;
    logWarn = true;
  } else if (level === 'error') {
    logInfo = true;
    logError = true;
    logWarn = true;
  } else if (level === 'info') {
    logInfo = true;
    logWarn = true;
  } else if (level === 'prod'){
    logError = true;
    logWarn = true;
  }
 
  console.log(`[Logger] Инициализирован уровень логирования: ${LOG_LEVEL}`);
  if (logInfo || logDev) console.log(`[Logger] Info: ${logInfo}, Dev: ${logDev}, Error: ${logError}, Warn: ${logWarn}`);
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
function logWarnMessage(...args) {
  if (logWarn) console.warn(`[WARN]`, ...args);
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
function isWarnEnabled() {
  return logWarn;
}

// Инициализируем при импорте
initLogging();

export default {
  info: logInfoMessage,
  dev: logDevMessage,
  error: logErrorMessage,
  warn: logWarnMessage,
  isInfoEnabled,
  isDevEnabled,
  isErrorEnabled,
  isWarnEnabled
};