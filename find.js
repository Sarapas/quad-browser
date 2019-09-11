const electron = require('electron');
const { BrowserWindow } = electron;

let findWin;

function open(parent, onClose) {
    findWin = new BrowserWindow({
        frame: false,
        transparent: false,
        show: false,
        skipTaskbar: true,
        parent: parent,
        closable: true,
        focusable: true,
        resizable: false,
        fullscreenable: false,
        height: 40,
        width: 320,
        webPreferences: {
          nodeIntegration: true
        }
      });

      findWin.loadFile(`dist/find.html`);
    
      findWin.once('ready-to-show', () => {
        findWin.show();
        findWin.webContents.openDevTools();
      });
    
      findWin.on('closed', () => {
        findWin = null;
        onClose();
      });
}

var exports = module.exports = {
    open: open
};