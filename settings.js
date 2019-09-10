const electron = require('electron');
const { BrowserWindow } = electron;

let settingsWin;

function open(parent) {
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
        //settingsWin.webContents.openDevTools();
      });
    
      settingsWin.on('close', () => {
        settingsWin = null;
      });
    
    //   ipcMain.once('change-layout', (event, newLayout) => {
    //     if (newLayout) {
    //       setLayout(newLayout, false);
    //       callback();
    //     }
    //   });
}

var exports = module.exports = {
    open: open
};