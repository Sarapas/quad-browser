module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "./" : "/",
  pages: {
    index: {
      // having index for dev purposes, pointing to app currently developed
      entry: 'src/shortcuts.js',
      template: 'src/template.html',
      filename: 'index.html'
    },
    bookmarks: {
      entry: 'src/bookmarks.js',
      template: 'src/template.html',
      filename: 'bookmarks.html'
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
    },
    notepad: {
      entry: 'src/notepad.js',
      template: 'src/template.html',
      filename: 'notepad.html'
    },
    layouts: {
      entry: 'src/layouts.js',
      template: 'src/template.html',
      filename: 'layouts.html'
    },
    blank: {
      entry: 'src/blank.js',
      template: 'src/template.html',
      filename: 'blank.html'
    },
    shortcuts: {
      entry: 'src/shortcuts.js',
      template: 'src/template.html',
      filename: 'shortcuts.html'
    }
  }
}