const electron = require('electron');
const { BrowserWindow, app, Menu, MenuItem, globalShortcut, systemPreferences } = electron;
const path = require('path');
const prompt = require('electron-prompt');
const ioHook = require('iohook');
const isMac = process.platform === 'darwin';
const contextMenu = require('electron-context-menu');
const viewManager = require('./view-manager');
const Store = require('electron-store');
const store = new Store();
require('electron-reload')(__dirname);

let win;
let hoverMode = false;
let isTrustedAccesibility;

let lastClickTime;
let lastClickView;

let clickedView = 0;

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

  viewManager.init(win);

  win.setFullScreen(true);
  win.setMenuBarVisibility(false);

  let defaultURL = store.get('homepage') || 'https://google.com';
  viewManager.loadURL(defaultURL);

  function onMouseMove(event) {
    if (hoverMode) {
      let view = viewManager.inView(event.x, event.y);
      if (view) {
        viewManager.setAudible(view);
      }
    }
  }

  let viewMenu;

  function onMouseClick(event) {
    let view = viewManager.inView(event.x, event.y);

    if (view) {
      clickedView = view.number;
      if (event.button === 2) {
        // without timeout propagated event closes the context menu; if event had preventDefault - it wouldn't be needed
        setTimeout(() => {
          viewMenu = new Menu();

          viewMenu.append(
            new MenuItem({
              label: 'Back',
              click: () => {
                if (view.webContents.canGoBack()) view.webContents.goBack();
              }
            })
          );
          viewMenu.append(
            new MenuItem({
              label: 'Refresh',
              click: () => {
                view.webContents.reload();
              }
            })
          );
          viewMenu.append(
            new MenuItem({
              label: 'Change address',
              click: () => {
                changeAddress(view.number);
              }
            })
          );
          viewManager.menuOnClick(view.number, viewMenu);
          viewMenu.popup({ window: win });
        }, 50);
        return;
      }

      if (!hoverMode) {
        viewManager.setAudible(view);
      }

      let currentClickTime = new Date().getTime();
      if (currentClickTime - lastClickTime < 200 && lastClickView === view) {
        // double click
        if (viewManager.isSingleLayout()) {
          viewManager.exitSingleLayout();
        } else {
          viewManager.setSingleLayout(view.number - 1);
        }

        Menu.setApplicationMenu(createMenu());

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
    let viewNumbers = [1, 2, 3, 4];
    viewNumbers.forEach(number => {
      globalShortcut.register(`CommandOrControl+${number}`, () => {
        let view = viewManager.getViewByNumber(number);
        if (view) viewManager.setAudible(view);
      });
    });

    ioHook.on('mousedown', onMouseClick);
    ioHook.on('mousemove', onMouseMove);
    ioHook.start();
  }

  globalShortcut.register('Esc', unmaximize);

  win.on('show', () => {
    viewManager.updateLayout();
  });

  Menu.setApplicationMenu(createMenu());

  win.on('enter-full-screen', () => {
    win.setMenuBarVisibility(false);
    // updating frame location
    let audible = viewManager.getAudible();
    if (audible) viewManager.setAudible(audible);
  });

  win.on('leave-full-screen', () => {
    win.setMenuBarVisibility(true);
  });

  win.on('resize', () => {
    viewManager.updateLayout();
  });

  win.on('minimize', () => {
    viewManager.suspendAudible();
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
  if (viewManager.isSingleLayout()) {
    addressSubmenu.push({label: 'Current', click: () => { changeAddress(); } });
  } else if (viewManager.isDualLayout()) {
    addressSubmenu.push({ label: 'Top', click: () => { changeAddress(1); } });
    addressSubmenu.push({ label: 'Bottom', click: () => { changeAddress(2); } });
    addressSubmenu.push({ label: 'All', click: () => { changeAddress(); } });
  } else if (viewManager.isTriLayout()) {
    addressSubmenu.push({ label: 'Top left', click: () => { changeAddress(1); } });
    addressSubmenu.push({ label: 'Top right', click: () => { changeAddress(2); } });
    addressSubmenu.push({ label: 'Bottom', click: () => { changeAddress(3); } });
    addressSubmenu.push({ label: 'All', click: () => { changeAddress(); } });
  } else if (viewManager.isQuadLayout()) {
    addressSubmenu.push({ label: 'Top left', click: () => { changeAddress(1); } });
    addressSubmenu.push({ label: 'Top right', click: () => { changeAddress(2); } });
    addressSubmenu.push({ label: 'Bottom left', click: () => { changeAddress(3); } });
    addressSubmenu.push({ label: 'Bottom right', click: () => { changeAddress(4); } });
    addressSubmenu.push({ label: 'All', click: () => { changeAddress(); } });
  } else if (viewManager.isQuadHorizontalLayout()) {
    addressSubmenu.push({ label: 'Top left', click: () => { changeAddress(1); } });
    addressSubmenu.push({ label: 'Top center', click: () => { changeAddress(2); } });
    addressSubmenu.push({ label: 'Top right', click: () => { changeAddress(3); } });
    addressSubmenu.push({ label: 'Bottom', click: () => { changeAddress(4); } });
    addressSubmenu.push({ label: 'All', click: () => { changeAddress(); } });
  } else if (viewManager.isQuadVerticalLayout()) {
    addressSubmenu.push({ label: 'Left', click: () => { changeAddress(1); } });
    addressSubmenu.push({ label: 'Top right', click: () => { changeAddress(2); } });
    addressSubmenu.push({ label: 'Middle right', click: () => { changeAddress(3); } });
    addressSubmenu.push({ label: 'Bottom right', click: () => { changeAddress(4); } });
    addressSubmenu.push({ label: 'All', click: () => { changeAddress(); } });
  } else if (viewManager.isFiveHorizontalLayout()) {
    addressSubmenu.push({ label: 'Top left', click: () => { changeAddress(1); } });
    addressSubmenu.push({ label: 'Top center', click: () => { changeAddress(2); } });
    addressSubmenu.push({ label: 'Top right', click: () => { changeAddress(3); } });
    addressSubmenu.push({ label: 'Bottom left', click: () => { changeAddress(4); } });
    addressSubmenu.push({ label: 'Bottom right', click: () => { changeAddress(5); } });
    addressSubmenu.push({ label: 'All', click: () => { changeAddress(); } });
  } else if (viewManager.isFiveVerticalLayout()) {
    addressSubmenu.push({ label: 'Top left', click: () => { changeAddress(1); } });
    addressSubmenu.push({ label: 'Bottom left', click: () => { changeAddress(2); } });
    addressSubmenu.push({ label: 'Top right', click: () => { changeAddress(3); } });
    addressSubmenu.push({ label: 'Middle right', click: () => { changeAddress(4); } });
    addressSubmenu.push({ label: 'Bottom right', click: () => { changeAddress(5); } });
    addressSubmenu.push({ label: 'All', click: () => { changeAddress(); } });
  } else if (viewManager.isSixHorizontalLayout()) {
    addressSubmenu.push({ label: 'Top left', click: () => { changeAddress(1); } });
    addressSubmenu.push({ label: 'Top center', click: () => { changeAddress(2); } });
    addressSubmenu.push({ label: 'Top right', click: () => { changeAddress(3); } });
    addressSubmenu.push({ label: 'Bottom left', click: () => { changeAddress(4); } });
    addressSubmenu.push({ label: 'Bottom center', click: () => { changeAddress(5); } });
    addressSubmenu.push({ label: 'Bottom right', click: () => { changeAddress(6); } });
    addressSubmenu.push({ label: 'All', click: () => { changeAddress(); } });
  } else if (viewManager.isSixVerticalLayout()) {
    addressSubmenu.push({ label: 'Top left', click: () => { changeAddress(1); } });
    addressSubmenu.push({ label: 'Top right', click: () => { changeAddress(2); } });
    addressSubmenu.push({ label: 'Middle left', click: () => { changeAddress(3); } });
    addressSubmenu.push({ label: 'Middle right', click: () => { changeAddress(4); } });
    addressSubmenu.push({ label: 'Bottom left', click: () => { changeAddress(5); } });
    addressSubmenu.push({ label: 'Bottom right', click: () => { changeAddress(6); } });
    addressSubmenu.push({ label: 'All', click: () => { changeAddress(); } });
  }
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
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Change layout',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            globalShortcut.unregister('Esc'); // to allow modal to use esc
            viewManager.changeLayout(() => {
              globalShortcut.register('Esc', unmaximize);
              Menu.setApplicationMenu(createMenu());
            });
          }
        },
        {
          label: 'Single Screen',
          accelerator: 'CmdOrCtrl+f1',
          type: 'radio',
          checked: viewManager.isSingleLayout(),
          click: () => {
            viewManager.setSingleLayout(0);
            Menu.setApplicationMenu(createMenu());
          }
        },
        {
          label: 'Dual Screen',
          accelerator: 'CmdOrCtrl+f2',
          type: 'radio',
          checked: viewManager.isDualLayout(),
          click: () => {
            viewManager.setDualLayout();
            Menu.setApplicationMenu(createMenu());
          }
        },
        {
          label: 'Tri Screen',
          accelerator: 'CmdOrCtrl+f3',
          type: 'radio',
          checked: viewManager.isTriLayout(),
          click: () => {
            viewManager.setTriLayout();
            Menu.setApplicationMenu(createMenu());
          }
        },
        {
          label: 'Quad Screen',
          accelerator: 'CmdOrCtrl+f4',
          type: 'radio',
          checked: viewManager.isQuadLayout(),
          click: () => {
            viewManager.setQuadLayout();
            Menu.setApplicationMenu(createMenu());
          }
        },
        {
          label: 'Quad 3+1 Screen',
          accelerator: 'CmdOrCtrl+f5',
          type: 'radio',
          checked: viewManager.isQuadHorizontalLayout(),
          click: () => {
            viewManager.setQuadHorizontalLayout();
            Menu.setApplicationMenu(createMenu());
          }
        },
        {
          label: 'Quad 1+3 Screen',
          accelerator: 'CmdOrCtrl+f6',
          type: 'radio',
          checked: viewManager.isQuadVerticalLayout(),
          click: () => {
            viewManager.setQuadVerticalLayout();
            Menu.setApplicationMenu(createMenu());
          }
        },
        {
          label: 'Five Horizontal Screen',
          accelerator: 'CmdOrCtrl+f7',
          type: 'radio',
          checked: viewManager.isFiveHorizontalLayout(),
          click: () => {
            viewManager.setFiveHorizontalLayout();
            Menu.setApplicationMenu(createMenu());
          }
        },
        {
          label: 'Five Vertical Screen',
          accelerator: 'CmdOrCtrl+f8',
          type: 'radio',
          checked: viewManager.isFiveVerticalLayout(),
          click: () => {
            viewManager.setFiveVerticalLayout();
            Menu.setApplicationMenu(createMenu());
          }
        },
        {
          label: 'Six Horizontal Screen',
          accelerator: 'CmdOrCtrl+f9',
          type: 'radio',
          checked: viewManager.isSixHorizontalLayout(),
          click: () => {
            viewManager.setSixHorizontalLayout();
            Menu.setApplicationMenu(createMenu());
          }
        },
        {
          label: 'Six Vertical Screen',
          accelerator: 'CmdOrCtrl+f10',
          type: 'radio',
          checked: viewManager.isSixVerticalLayout(),
          click: () => {
            viewManager.setSixVerticalLayout();
            Menu.setApplicationMenu(createMenu());
          }
        },
        { type: 'separator' },
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
          label: 'Zoom In',
          accelerator: 'CommandOrControl+m',
          click: () => {
            viewManager.zoomIn(clickedView - 1);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CommandOrControl+n',
          click: () => {
            viewManager.zoomOut(clickedView - 1);
          }
        },
        { type: 'separator' },
        {
          label: 'Fullscreen players',
          accelerator: 'CmdorCtrl+F',
          click: () => {
            viewManager.maximizeViews();
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

function changeAddress(viewNumber = null) {
  viewManager.createUrlWindow(viewNumber);
}

function unmaximize() {
  if (win != null) {
    win.setFullScreen(false);
    viewManager.minimizeViews();
  }
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
