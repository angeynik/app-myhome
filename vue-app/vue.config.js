const { defineConfig } = require('@vue/cli-service')
const { execFileSync } = require('child_process')

// Версия сборки для экрана «Настройки»: appVersion из package.json (номер выпуска, тег version_X_X_X_X)
// и короткий хеш коммита на момент сборки. Переменные VUE_APP_* Vue CLI встраивает в код.
process.env.VUE_APP_VERSION = require('./package.json').appVersion || ''
try {
  process.env.VUE_APP_COMMIT = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
} catch {
  process.env.VUE_APP_COMMIT = ''
}

module.exports = defineConfig({
  publicPath: '/app/',
  transpileDependencies: true,
  devServer: { port: 3020 }
})
