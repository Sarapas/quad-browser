const electron = require('electron');
const { ipcMain, app } = electron;
const storage = require('electron-json-storage');

const SHORTCUT_STORAGE = "notepad";

let shortcutsWin;

function open(parent, onClose) {
    storage.setDataPath(app.getPath('userData'));

    shortcutsWin = new BrowserWindow({
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

      shortcutsWin.loadFile(`dist/shortcuts.html`);
    
      shortcutsWin.once('ready-to-show', () => {
        ipcMain.on('shortcuts-loaded', function() {
            storage.get(SHORTCUT_STORAGE, function(error, data) {
                if (error) throw error;
                view.webContents.send('set-shortcuts', data.shortcuts || []);
            });
        });

        shortcutsWin.show();
        //shortcutsWin.webContents.openDevTools();
      });
    
      shortcutsWin.once('closed', () => {
        shortcutsWin = null;
        onClose();
      })
    
      ipcMain.once('save-shortcuts', (event, shortcuts) => {
        if (shortcuts) {
            storage.set(SHORTCUT_STORAGE, { shortcuts: shortcuts}, function(error) {
                if (error) throw error;
            });
        }
      });
}

var exports = (module.exports = {
    open: open
});