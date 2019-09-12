module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "./" : "/",
  pages: {
    index: {
      // having index for dev purposes, pointing to app currently developed
      entry: 'src/find.js',
      template: 'src/template.html',
      filename: 'index.html'
    },
    settings: {
      entry: 'src/settings.js',
      template: 'src/template.html',
      filename: 'settings.html'
    },
    find: {
      entry: 'src/find.js',
      template: 'src/template.html',
      filename: 'find.html'
    },
    address: {
      entry: 'src/address.js',
      template: 'src/template.html',
      filename: 'address.html'
    }
  }
}