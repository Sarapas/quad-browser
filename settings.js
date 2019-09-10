const electron = require('electron');
const { BrowserWindow, ipcMain } = electron;
const bookmarks = require("./bookmarks");

let settingsWin;

function open(parent, onClose) {
    settingsWin = new BrowserWindow({
        frame: false,
        transparent: false,
        show: false,
        skipTaskbar: true,
        parent: parent,
        closable: true,
        modal: true,
        focusable: true,
        fullscreenable: false,
        height: 400,
        width: 600,
        webPreferences: {
          nodeIntegration: true
        }
      });

      settingsWin.loadFile(`dist/index.html`);
    
      settingsWin.once('ready-to-show', () => {
        settingsWin.show();
        settingsWin.webContents.send('bookmarks-received', bookmarks.get());
        //settingsWin.webContents.openDevTools();
      });
    
      settingsWin.on('closed', () => {
        settingsWin = null;
        onClose();
      })
    
      ipcMain.on('delete-bookmark', (event, bookmark) => {
        if (bookmark) {
          bookmarks.remove(bookmark);
        }
      });
}

var exports = module.exports = {
    open: open
};