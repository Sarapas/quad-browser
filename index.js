const electron = require('electron');
const { BrowserWindow, app, Menu, globalShortcut, systemPreferences } = electron;
const path = require('path');
const prompt = require('electron-prompt');
const ioHook = require('iohook');
const isMac = process.platform === 'darwin';
const contextMenu = require('electron-context-menu');
const viewManager = require('./view-manager');
const bookmarks = require('./bookmarks');
const settings = require('./settings')
const find = require('./find');
const history = require('./history');
const Store = require('electron-store');
const util = require('electron-util');
const address = require('./address');
const viewContextMenu = require('./view-context-menu');
const store = new Store();
//require('electron-reload')(__dirname);

let win;
let hoverMode = false;
let isTrustedAccesibility;

let lastClickTime;
let lastClickView;

let suspendViewFocus;

function createWindow() {
  isTrustedAccesibility = isMac ? systemPreferences.isTrustedAccessibilityClient(false) : true;

  contextMenu({
    showLookUpSelection: false
  });

  win = new BrowserWindow({
    title: 'Quad Screens',
    fullscreenable: true,
    resizable: true,
    show: false,
    icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
    backgroundColor: '#000'
  });

  let defaultURL = store.get('homepage') || 'https://google.com';
  viewManager.init(win, defaultURL);

  viewManager.onLayoutChange(() => {
    find.close();
  });

  win.setFullScreen(true);
  win.setMenuBarVisibility(false);

  function onMouseMove(event) {
    if (hoverMode && !suspendViewFocus) {
      let view = viewManager.inView(event.x, event.y);
      if (view) {
        viewManager.setAudible(view);
      }
    }
  }

  function onMouseClick(event) {
    if (!util.activeWindow() || suspendViewFocus)
      return;

    let view = viewManager.inView(event.x, event.y);

    if (view) {
      clickedView = view.number;
      if (event.button === 2) {
        // without timeout propagated event closes the context menu; if event had preventDefault - it wouldn't be needed
        setTimeout(() => {
          viewContextMenu.show(win, view, () => { setFocusable(false); }, () => { setFocusable(true); })
        }, 50);
        return;
      }

      if (!hoverMode) {
        viewManager.setAudible(view);
      }

      let currentClickTime = new Date().getTime();
      if (currentClickTime - lastClickTime < 200 && lastClickView === view) {
        // double click

        viewManager.toggleSingleLayout(view);

        updateMenu();

        lastClickTime = null;
        lastClickView = null;
      } else {
        lastClickTime = currentClickTime;
        lastClickView = view;
      }
    } else {
      lastClickView = null;
    }
  }

  if (isTrustedAccesibility) {
    let viewNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    viewNumbers.forEach(number => {
      globalShortcut.register(`CommandOrControl+${number}`, () => {
        let view = viewManager.getViewByNumber(number);
        if (view) viewManager.setAudible(view);
      });
    });

    globalShortcut.register(`CommandOrControl+t`, () => {
      let audible = viewManager.getAudible();
      find.open(win, audible, () => {});
    });

    ioHook.on('mousedown', onMouseClick);
    ioHook.on('mousemove', onMouseMove);
    ioHook.start();
  }

  globalShortcut.register('Esc', unmaximize);

  win.on('show', () => {
    viewManager.updateLayout();
  });

  viewManager.onNewAddressLoaded((address) => {
    history.add(address, () => { updateMenu(); });
  });

  history.init(() => {
    updateMenu();
  });

  bookmarks.onChange(() => {
    updateMenu();
  });

  bookmarks.init();

  win.on('resize', () => {
    viewManager.updateLayout();
    find.close();
  });

  win.on('enter-full-screen', () => {
    win.setMenuBarVisibility(false);
    viewManager.updateLayout();
  });

  win.on('leave-full-screen', () => {
    win.setMenuBarVisibility(true);
    viewManager.updateLayout();
  });

  win.on('minimize', () => {
    viewManager.suspendAudible();
    find.close();
  });

  win.on('restore', () => {
    viewManager.resumeAudible();
  });

  win.on('closed', () => {
    viewManager.unload();
    globalShortcut.unregisterAll();
    ioHook.removeListener('mousedown', onMouseClick);
    ioHook.removeListener('mousemove', onMouseMove);
    win = null;
  });

  win.show();
}

function createMenu() {
  let addressSubmenu = [];

  let viewNames = viewManager.getViewNames();
  viewNames.forEach((vn) => {
    addressSubmenu.push({label: vn.name, click: () => {
      let view = viewManager.getViewByNumber(vn.number);
      address.open(win, view, (url, v) => { viewManager.loadURL(url, v); });
    } });
  });

  addressSubmenu.push({ type: 'separator' });
  addressSubmenu.push({ label: 'Change homepage', click: () => { changeHomepage(); } });

  const template = [
    ...(isMac
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
          setFocusable(false);
          globalShortcut.unregister('Esc'); // to allow modal to use esc
          settings.open(win, () => {  
            setFocusable(true);
            globalShortcut.register('Esc', unmaximize);
          }); 
        }},
        { type: "separator" },
        ...bookmarks.getMenu(null) 
      ]
    },
    {
      label: 'History',
      submenu: [ 
        ...history.getMenu(null),
        { type: 'separator' },
        { label: 'Clear', click: () => { history.clear(() => { updateMenu() }); }}
       ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        {
          label: 'Change layout',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            setFocusable(false);
            globalShortcut.unregister('Esc'); // to allow modal to use esc
            viewManager.changeLayout(() => {
              setFocusable(true);
              globalShortcut.register('Esc', unmaximize);
              updateMenu();
            });
          }
        },
        {
          label: 'Hover mode',
          type: 'checkbox',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            hoverMode = !hoverMode;
          }
        },
        { type: 'separator' },
        {
          label: 'Fullscreen players',
          accelerator: 'CmdorCtrl+F',
          click: () => {
            win.setFullScreen(true);
            viewManager.maximizeViews();
          }
        },
        {
          label: 'Mute',
          accelerator: 'CmdorCtrl+M',
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
      submenu: addressSubmenu
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  return menu;
}

function unmaximize() {
  if (win != null) {
    let hasFocus = win.isFocused() || win.getChildWindows().find(w => w.isFocused()) !== null;
    if (hasFocus) {
      win.setFullScreen(false);
      viewManager.minimizeViews();
    }
  }
}

function updateMenu() {
  Menu.setApplicationMenu(createMenu());
}

function setFocusable(focusable) {
  viewManager.setFocusable(focusable);
  suspendViewFocus = !focusable;
}

function changeHomepage() {
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
    })
    .catch(console.error);
}

app.on('ready', createWindow);

app.on('activate', function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) createWindow();
});

app.commandLine.appendSwitch('--enable-features', 'OverlayScrollbar');

let suspendClose = false;
app.on('window-all-closed', function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //if (!isMac && !suspendClose) app.quit()
  if (!suspendClose) app.quit();
});

app.on('before-quit', () => {
  if (isTrustedAccesibility) {
    ioHook.unload(); // since iohook prevents app from quitting on mac
  }
});
