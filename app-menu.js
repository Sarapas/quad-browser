const electron = require('electron');
const { app, Menu } = electron;
const prompt = require('electron-prompt');
const util = require('electron-util');
const Store = require('electron-store');
const store = new Store();

const address = require('./address');
const bookmarks = require('./bookmarks');
const history = require('./history');
const viewManager = require('./view-manager');
const shortcuts = require('./shortcuts');
const frameOptions = require('./frame-options');

function update(win, onModalOpen, onModalClose) {
    let addressSubmenu = [];
  
    let viewNames = viewManager.getViewNames();
    viewNames.forEach((vn) => {
      addressSubmenu.push({label: vn.name, click: () => {
        let view = viewManager.getViewByNumber(vn.number);
        address.open(win, view, (url, v) => { viewManager.loadURL(url, v); });
      } });
    });
  
    const template = [
      ...(util.is.macos
        ? [ { label: app.getName(), submenu: [{ role: 'about' }, { role: 'quit' }] } ] 
        : [ { label: 'File', submenu: [{ role: 'quit' }] } ]),
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
          { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
          { type: 'separator' },
          { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
          { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
          { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
          {
            label: 'Select All',
            accelerator: 'CmdOrCtrl+A',
            selector: 'selectAll:'
          }
        ]
      },
      {
        label: 'Bookmarks',
        submenu: [ 
          { label: "Bookmark manager", click: () => { 
            if (onModalOpen) onModalOpen();
            bookmarks.open(win, () => {  
                if (onModalClose) onModalClose();
            }); 
          }},
          { type: "separator" },
          ...bookmarks.getMenu(null) 
        ]
      },
      {
        label: 'History',
        submenu: [ 
          ...history.getMenu(null, 20),
          { type: 'separator' },
          { label: 'Clear', click: () => { history.clear(() => { update(win, onModalOpen, onModalClose); }); }}
         ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'togglefullscreen' },
          {
            label: 'Change layout',
            accelerator: shortcuts.CHANGE_LAYOUT,
            click: () => {
                if (onModalOpen) onModalOpen();
                viewManager.changeLayout(() => {
                    if (onModalClose) onModalClose();
                    update(win, onModalOpen, onModalClose);
                });
            }
          },
          {
            label: 'Hover mode',
            type: 'checkbox',
            accelerator: shortcuts.HOVER_MODE,
            checked: viewManager.isHoverMode(),
            click: () => {
                viewManager.toggleHoverMode();
            }
          },
          {
            label: 'Number mode',
            type: 'checkbox',
            accelerator: shortcuts.NUMBER_MODE,
            checked: viewManager.isNumberMode(),
            click: () => {
                viewManager.toggleNumberMode();
            }
          },
          {
            label: 'Fullscreen number mode',
            type: 'checkbox',
            accelerator: shortcuts.FULLSCREEN_NUMBER_MODE,
            checked: viewManager.isFullscreenNumberMode(),
            click: () => {
                viewManager.toggleFullscreenNumberMode();
            }
          },
          { type: 'separator' },
          {
            label: 'Fullscreen players',
            accelerator: shortcuts.FULLSCREEN_PLAYERS,
            click: () => {
              win.setFullScreen(true);
              viewManager.maximizeViews();
            }
          },
          {
            label: 'Mute',
            accelerator: shortcuts.MUTE,
            type: 'checkbox',
            checked: viewManager.isMuted(),
            click: () => {
              viewManager.muteAll(!viewManager.isMuted());
            }
          }
        ]
      },
      {
        label: 'Address',
        submenu: [
            ...addressSubmenu,
            { type: 'separator' },
            { label: 'Change homepage', click: () => { changeHomepage(win, onModalOpen, onModalClose); } }
        ]
      },
      {
        label: 'Options',
        submenu: [
          { label: 'Shortcuts', click: () => { 
            if (onModalOpen) onModalOpen();
            shortcuts.open(win, () => {
              if (onModalClose) onModalClose();
            });
          }},
          {
            label: 'Frame',
            click: () => {
              if (onModalOpen) onModalOpen();
              frameOptions.openOptions(win, () => {
                if (onModalClose) onModalClose();
              });
            }
          }
        ]
      }
    ];
  
    const menu = Menu.buildFromTemplate(template);

    Menu.setApplicationMenu(menu);
}

function changeHomepage(win, onShow, onClose) {
    if (onShow) {
      onShow();
    }
    prompt(
      {
        title: 'Change homepage',
        label: 'Homepage:',
        height: 150,
        width: 400,
        resizable: false,
        value: 'https://',
        inputAttrs: {
          type: 'url'
        }
      },
      win
    )
      .then(result => {
        if (result !== null) {
          store.set('homepage', result);
        }
        if (onClose) {
          onClose();
        }
      })
      .catch(console.error);
  }

var exports = (module.exports = {
    update: update
});