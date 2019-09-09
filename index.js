const electron = require('electron');
const { BrowserWindow, app, Menu, MenuItem, globalShortcut, systemPreferences, nativeImage } = electron;
const path = require('path');
const prompt = require('electron-prompt');
const ioHook = require('iohook');
const isMac = process.platform === 'darwin';
const contextMenu = require('electron-context-menu');
const viewManager = require('./view-manager');
const downloader = require('./downloader');
const icoToPng = require('./ico-to-png');
const uuid = require('./uuid');
const Store = require('electron-store');
const storage = require('electron-json-storage');
const fs = require('fs');
const store = new Store();
//require('electron-reload')(__dirname);

let bookmarks = [];

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

  storage.setDataPath(app.getAppPath());

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
          let viewMenuTemplate = [
            { label: 'Back', click: () => { if (view.webContents.canGoBack()) view.webContents.goBack(); } },
            { label: 'Refresh', click: () => { view.webContents.reload(); } },
            { label: 'Change address', click: () => { changeAddress(view.number); } },
            { type: 'separator' },
            { label: 'Save bookmark', click: () => { saveBookmark(view.webContents); } },
            { label: 'Load bookmark', submenu: getBookmarksMenu(view) }
          ]
          viewMenu = Menu.buildFromTemplate(viewMenuTemplate);

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
          viewManager.setSingleLayout(view.number);
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

    globalShortcut.register(`CommandOrControl+f1`, () => { 
      let audibleView = viewManager.getAudible();
      if (audibleView) {
        viewManager.setSingleLayout(audibleView.number); 
      }
    });
    globalShortcut.register(`CommandOrControl+f2`, () => { viewManager.setDualLayout(false); });
    globalShortcut.register(`CommandOrControl+f3`, () => { viewManager.setTriLayout(false); });
    globalShortcut.register(`CommandOrControl+f4`, () => { viewManager.setQuadLayout(false); });
    globalShortcut.register(`CommandOrControl+f5`, () => { viewManager.setQuadHorizontalLayout(false); });
    globalShortcut.register(`CommandOrControl+f6`, () => { viewManager.setQuadVerticalLayout(false); });
    globalShortcut.register(`CommandOrControl+f7`, () => { viewManager.setFiveHorizontalLayout(false); });
    globalShortcut.register(`CommandOrControl+f8`, () => { viewManager.setFiveVerticalLayout(false); });
    globalShortcut.register(`CommandOrControl+f9`, () => { viewManager.setSixHorizontalLayout(false); });
    globalShortcut.register(`CommandOrControl+f10`, () => { viewManager.setSixVerticalLayout(false); });

    ioHook.on('mousedown', onMouseClick);
    ioHook.on('mousemove', onMouseMove);
    ioHook.start();
  }

  globalShortcut.register('Esc', unmaximize);

  win.on('show', () => {
    viewManager.updateLayout();
  });

  Menu.setApplicationMenu(createMenu());

  storage.get('bookmarks', function(error, data) {
    if (error) throw error;

    bookmarks = data.bookmarks || [];
    Menu.setApplicationMenu(createMenu());
  });

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

  let viewNames = viewManager.getViewNames();
  viewNames.forEach((vn) => {
    addressSubmenu.push({label: vn.name, click: () => { changeAddress(vn.number); } });
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
      submenu: getBookmarksMenu(null)
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
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

function saveBookmark(contents) {
  storage.get('bookmarks', function(error, data) {
    if (error) throw error;
  
    data.bookmarks = data.bookmarks || [];
    let icon;

    if (contents.favicons && contents.favicons.length) {

      let png = contents.favicons.find(f => f.endsWith("png"));
      let jpg = contents.favicons.find(f => f.endsWith("jpg"));
      let ico = contents.favicons.find(f => f.endsWith("ico"));

      let ext;
      if (png) {
        src = png;
        ext = ".png";
      } else if (jpg) {
        src = jpg;
        ext = ".jpg";
      } else if (ico) {
        src = ico;
        ext = ".ico";
      }

      icon = `${uuid.new()}${ext}`;
      let destDir = `${app.getAppPath()}/icons`;
      downloader.downloadFile(src, destDir, icon);
    }

    data.bookmarks.push({ title: contents.getTitle(), url: contents.getURL(), icon: icon });

    storage.set('bookmarks', data, function(error) {
      if (error) throw error;

      bookmarks = data.bookmarks;
      Menu.setApplicationMenu(createMenu());
    });
  });
}

function getBookmarksMenu(view) {
  let bookmarksMenu = [];
  bookmarks.forEach((b) => {
    let icon = null;
    const size = 16;
    if (b.icon) {
      let file = `${app.getAppPath()}/icons/${b.icon}`;
      if (b.icon.endsWith(".ico")) {
        const source = fs.readFileSync(file);
        let png = icoToPng(source, size);
        icon = nativeImage.createFromBuffer(png);
      } else {
        icon = nativeImage.createFromPath(file);
        icon = icon.resize({ width: size, height: size });
      }
    }
    bookmarksMenu.push(new MenuItem({
      label: b.title,
      click: () => {
        viewManager.loadURL(b.url, view);
      },
      icon: icon
    }));
  });
  return bookmarksMenu;
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
