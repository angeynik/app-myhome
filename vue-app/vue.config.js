const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: '/app/',
  transpileDependencies: true,
  devServer: { port: 3020 }
})
