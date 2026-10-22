// store/modules/logger.js
// Уровни по возрастанию «тишины»: dev < info < warn < error < silent.
// Ошибки (error) печатаются на ВСЕХ уровнях, кроме silent.
// 'prod' оставлен как псевдоним 'warn' для обратной совместимости с .env.

const LEVELS = { dev: 0, info: 1, warn: 2, error: 3, silent: 4 };
const ALIASES = { prod: 'warn' };

const raw = String(process.env.VUE_APP_LOG_LEVEL || 'info').toLowerCase();
const current = LEVELS[ALIASES[raw] ?? raw] ?? LEVELS.info;

const enabled = (name) => current <= LEVELS[name];

const logger = {
  dev:   (...args) => { if (enabled('dev'))   console.log('[DEV]', ...args); },
  info:  (...args) => { if (enabled('info'))  console.log('[INFO]', ...args); },
  warn:  (...args) => { if (enabled('warn'))  console.warn('[WARN]', ...args); },
  error: (...args) => { if (enabled('error')) console.error('[ERROR]', ...args); },

  isDevEnabled:   () => enabled('dev'),
  isInfoEnabled:  () => enabled('info'),
  isWarnEnabled:  () => enabled('warn'),
  isErrorEnabled: () => enabled('error'),
};

if (enabled('info')) console.log(`[Logger] Уровень логирования: ${raw}`);

export default logger;
