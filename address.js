const electron = require('electron');
const { BrowserWindow, ipcMain } = electron;
const utilities = require('./utilities');

let addressWindow;

function open(parent, view, onAddress) {
    addressWindow = new BrowserWindow({
      frame: false,
      show: false,
      skipTaskbar: true,
      closable: true,
      focusable: true,
      fullscreenable: false,
      width: 272,
      height: 40,
      webPreferences: {
        nodeIntegration: true
      }
    });
  
    addressWindow.loadFile('dist/address.html');
    utilities.centerWindowToParentWindow(view || parent, addressWindow);
  
    addressWindow.once('ready-to-show', () => {
      addressWindow.show();
    });
  
    addressWindow.on('closed', () => {
      addressWindow = null;
    });
  
    ipcMain.once('load-url', (event, arg) => {
      if (onAddress) {
        onAddress(arg, view);
      }
    });
  }

function close() {
  if (addressWindow) {
    addressWindow.close();
  }
}

var exports = module.exports = {
    open: open,
    close: close
};