const electron = require('electron');
const { BrowserWindow, ipcMain } = electron;
const viewManager = require("./view-manager");

let findWin;

function open(parent, view, onClose) {
  if (findWin) {
    findWin.focus();
    return;
  }

  let bounds = viewManager.getViewBounds(view);
  let margin = 20;
  let width = 320;
  let height = 40;
  let parentBounds = parent.getBounds();
  let x = parentBounds.x + bounds.x + bounds.width - width - margin;
  let y = parentBounds.y + bounds.y + margin;
  let findWinBounds = { x: x, y: y, width: width, height: height };

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
      acceptFirstMouse: true,
      webPreferences: {
        nodeIntegration: true
      }
  });

  findWin.setBounds(findWinBounds);

  findWin.loadFile(`dist/find.html`);

  findWin.once('ready-to-show', () => {
    findWin.show();
    //findWin.webContents.openDevTools();
  });

  findWin.once('closed', () => {
    findWin = null;

    findStop();
    ipcMain.removeListener('find', find);
    ipcMain.removeListener('find-up', findUp);
    ipcMain.removeListener('find-down', findDown);
    ipcMain.removeListener('find-stop', findStop);
    view.webContents.removeListener('found-in-page', foundInPage);

    onClose();
  });

  function find(event, text) {
    view.webContents.findInPage(text, { findNext: false, forward: true });
  }

  function findUp(event, text) {
    view.webContents.findInPage(text, { findNext: true, forward: false });
  }

  function findDown(event, text) {
    view.webContents.findInPage(text, { findNext: true, forward: true });
  }

  function findStop(event) {
    view.webContents.stopFindInPage('clearSelection');
  }

  function foundInPage(event, result) {
    if (result) {
      findWin.webContents.send('update-matches', { match: result.activeMatchOrdinal, totalMatches: result.matches });
    }
  }

  ipcMain.on('find', find);
  ipcMain.on('find-up', findUp);
  ipcMain.on('find-down', findDown);
  ipcMain.on('find-stop', findStop);
  view.webContents.on('found-in-page', foundInPage);
}

function close() {
  if (findWin) {
    findWin.close();
  }
}

var exports = module.exports = {
    open: open,
    close: close
};