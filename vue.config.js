const path = require("path");

module.exports = {
    pages: {
      index: {
        // entry for the page
        entry: 'renderer/src/main.js',
        // the source template
        template: 'renderer/settings.html',
        // output as dist/index.html
        filename: 'settings.html',
        // when using title option,
        // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
        title: 'Settings',
      },
    },
    publicPath: process.env.NODE_ENV === "production" ? "./" : "/", 
    outputDir: path.resolve(__dirname, "renderer/dist")
  }