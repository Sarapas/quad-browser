module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "./" : "/",
  pages: {
    index: {
      // having index for dev purposes, pointing to app currently developed
      entry: 'src/shortcuts.ts',
      template: 'src/template.html',
      filename: 'index.html'
    },
    bookmarks: {
      entry: 'src/bookmarks.ts',
      template: 'src/template.html',
      filename: 'bookmarks.html'
    },
    find: {
      entry: 'src/find.ts',
      template: 'src/template.html',
      filename: 'find.html'
    },
    address: {
      entry: 'src/address.ts',
      template: 'src/template.html',
      filename: 'address.html'
    },
    notepad: {
      entry: 'src/notepad.ts',
      template: 'src/template.html',
      filename: 'notepad.html'
    },
    layouts: {
      entry: 'src/layouts.ts',
      template: 'src/template.html',
      filename: 'layouts.html'
    },
    blank: {
      entry: 'src/blank.ts',
      template: 'src/template.html',
      filename: 'blank.html'
    },
    shortcuts: {
      entry: 'src/shortcuts.ts',
      template: 'src/template.html',
      filename: 'shortcuts.html'
    }
  }
}