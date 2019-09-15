const electron = require('electron');
const { Menu, MenuItem } = electron;
const address = require('./address');
const notepad = require('./notepad');
const bookmarks = require('./bookmarks');
const history = require('./history');
const find = require('./find');
const viewManager = require('./view-manager');

function show(win, view, onShow, onClose) {
    let viewMenuTemplate = [
        { label: 'Back', click: () => { if (view.webContents.canGoBack()) view.webContents.goBack(); } },
        { label: 'Change address', click: () => { address.open(win, view, (url, v) => { viewManager.loadURL(url, v); }); } },
        { type: 'separator' },
        { label: 'Refresh', click: () => { view.webContents.reload(); } },
        { label: 'Auto refresh', submenu: [
          { label: '30s', type: 'radio', checked: viewManager.getAutoRefresh(view) === 30, click: () => { viewManager.setAutoRefresh(view, 30); } },
          { label: '1min', type: 'radio', checked: viewManager.getAutoRefresh(view) === 60, click: () => { viewManager.setAutoRefresh(view, 60); } },
          { label: '5min', type: 'radio', checked: viewManager.getAutoRefresh(view) === 300, click: () => { viewManager.setAutoRefresh(view, 300); } },
          { label: '10min', type: 'radio', checked: viewManager.getAutoRefresh(view) === 600, click: () => { viewManager.setAutoRefresh(view, 600); } },
          { label: 'None', type: 'radio', checked: viewManager.getAutoRefresh(view) === null, click: () => { viewManager.setAutoRefresh(view, null); } }
        ]},
        { type: 'separator' },
        { label: 'Find', click: () => { find.open(win, view, () => { }); } },
        { type: 'separator' },
        { label: 'Save bookmark', click: () => { bookmarks.add(view.webContents); } },
        { label: 'Load bookmark', submenu: bookmarks.getMenu(view) },
        { label: 'History', submenu: history.getMenu(view) },
      ]

      if (!notepad.isOpen()) {
        viewMenuTemplate.push({ type: 'separator' });
        viewMenuTemplate.push({ label: 'Open Notepad', click: () => { notepad.open(view); }});
      } 

      if (notepad.isOpenOn(view)) {
        viewMenuTemplate = [ { label: 'Find', click: () => { find.open(win, view, () => { }); } } ];
      }
      
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

var exports = (module.exports = {
    show: show
});