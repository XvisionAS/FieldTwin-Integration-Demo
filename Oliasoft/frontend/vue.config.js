module.exports = {
  lintOnSave: false,
  devServer: {
    proxy: 'http://localhost:3000'
  },
  productionSourceMap: true,
}