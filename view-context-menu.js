const electron = require('electron');
const { Menu, MenuItem } = electron;

const address = require('./address');
const notepad = require('./notepad');
const bookmarks = require('./bookmarks');
const history = require('./history');
const find = require('./find');
const viewManager = require('./view-manager');
const shortcuts = require('./shortcuts');

function show(win, view, onShow, onClose) {
    let viewMenuTemplate = [
        { label: 'Back', click: () => { if (view.webContents.canGoBack()) view.webContents.goBack(); } },
        { label: 'Change address', accelerator: shortcuts.CHANGE_ADDRESS, click: () => { changeAddress(view) } },
        { type: 'separator' },
        { label: 'Refresh', accelerator: shortcuts.REFRESH, click: () => { refresh(view) } },
        { label: 'Auto refresh', submenu: [
          { label: '30s', type: 'radio', checked: viewManager.getAutoRefresh(view) === 30, click: () => { viewManager.setAutoRefresh(view, 30); } },
          { label: '1min', type: 'radio', checked: viewManager.getAutoRefresh(view) === 60, click: () => { viewManager.setAutoRefresh(view, 60); } },
          { label: '5min', type: 'radio', checked: viewManager.getAutoRefresh(view) === 300, click: () => { viewManager.setAutoRefresh(view, 300); } },
          { label: '10min', type: 'radio', checked: viewManager.getAutoRefresh(view) === 600, click: () => { viewManager.setAutoRefresh(view, 600); } },
          { label: 'None', type: 'radio', checked: viewManager.getAutoRefresh(view) === null, click: () => { viewManager.setAutoRefresh(view, null); } }
        ]},
        { type: 'separator' },
        { label: 'Find', accelerator: shortcuts.FIND, click: () => { findFunc(view) } },
        { type: 'separator' },
        { label: 'Save bookmark', accelerator: shortcuts.SAVE_BOOKMARK, click: () => { saveBookmark(view) } },
        { label: 'Load bookmark', submenu: bookmarks.getMenu(view) },
        { label: 'History', submenu: history.getMenu(view, 20) },
      ]

      if (!notepad.isOpen()) {
        viewMenuTemplate.push({ type: 'separator' });
        viewMenuTemplate.push({ label: 'Open Notepad', accelerator: shortcuts.OPEN_NOTEPAD, click: () => { openNotepad(view) } });
      } 

      if (notepad.isOpenOn(view)) {
        viewMenuTemplate = [ { label: 'Find', click: () => { findFunc(view) } } ];
      }
      
      //viewMenuTemplate.push({ label: 'Open Dev Tools', click: () => { view.webContents.openDevTools(); }});

      viewMenu = Menu.buildFromTemplate(viewMenuTemplate);

      viewManager.menuOnClick(view.number, viewMenu);

      //viewMenu.append(new MenuItem({ label: 'Close', click: () => { viewManager.suspend(view); }}));

      viewMenu.once('menu-will-show', () => {
        if (onShow) {
            onShow();
        }
      });
      viewMenu.once('menu-will-close', () => {
        if (onClose) {
            onClose();
        }
      });

      viewMenu.popup({ window: view });
}

function findFunc(view) {
  find.open(view.getParentWindow(), view, () => { });
}

function changeAddress(view) {
  if (!notepad.isOpen()) {
    address.open(view.getParentWindow(), view, (url, v) => {
      viewManager.loadURL(url, v);
    });
  }
}

function refresh(view) {
  if (!notepad.isOpen()) {
    view.webContents.reload();
  }
}

function openNotepad(view) {
  if (!notepad.isOpen()) {
    notepad.open(view);
  }
}

function saveBookmark(view) {
  if (!notepad.isOpen()) {
    bookmarks.add(view.webContents);
  }
}

var exports = (module.exports = {
    show: show,
    find: findFunc,
    changeAddress: changeAddress,
    saveBookmark: saveBookmark,
    openNotepad: openNotepad,
    refresh: refresh
});