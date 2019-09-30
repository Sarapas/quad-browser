const electron = require('electron');
const { BrowserWindow, app, globalShortcut, systemPreferences } = electron;
const path = require('path');
const ioHook = require('iohook');
const contextMenu = require('electron-context-menu');
const Store = require('electron-store');
const util = require('electron-util');
const log = require('electron-log');
const store = new Store();

const viewManager = require('./view-manager');
const bookmarks = require('./bookmarks');
const find = require('./find');
const history = require('./history');
const appMenu = require('./app-menu');
const viewContextMenu = require('./view-context-menu');
const shortcuts = require('./shortcuts');
const utilities = require('./utilities');

let win;
let isTrustedAccesibility;

let lastClickTime;
let lastClickView;

let suspendViewFocus;

function createWindow() {
  isTrustedAccesibility = util.is.macos ? systemPreferences.isTrustedAccessibilityClient(false) : true;

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

  function onKeyDown(event) {
    if (viewManager.isNumberMode()) {
      let number = utilities.getNumberFromKey(event.rawcode);
      if (number) {
        let view = viewManager.getViewByNumber(number);
        if (view) viewManager.setAudible(view);
      }
    } else if (viewManager.isFullscreenNumberMode()) {
      let number = utilities.getNumberFromKey(event.rawcode);
      if (number === 0) {
        viewManager.exitSingleLayout();
      } else if (number > 0 && number <= 9) {
        let view = viewManager.getViewByNumber(number);
        if (view) viewManager.setSingleLayout(view);
      }
    }
  }

  function onMouseMove(event) {
    if (viewManager.isHoverMode() && !suspendViewFocus) {
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

      if (!viewManager.isHoverMode()) {
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

    ioHook.on('mousedown', onMouseClick);
    ioHook.on('mousemove', onMouseMove);
    ioHook.on('keydown', onKeyDown);
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

  function updateContextMenu() {
    function execute(viewAction) {
      let audible = viewManager.getAudible();
      if (audible) {
        viewAction(audible);
      }
    }

    globalShortcut.register(shortcuts.FIND, () => { execute(viewContextMenu.find); });
    globalShortcut.register(shortcuts.REFRESH, () => { execute(viewContextMenu.refresh) });
    globalShortcut.register(shortcuts.CHANGE_ADDRESS, () => { execute(viewContextMenu.changeAddress) });
    globalShortcut.register(shortcuts.OPEN_NOTEPAD, () => { execute(viewContextMenu.openNotepad) });
    globalShortcut.register(shortcuts.SAVE_BOOKMARK, () => { execute(viewContextMenu.saveBookmark) });
  }

  shortcuts.init(() => {
    updateMenu();
    updateContextMenu();
  }, (obsoleteShortcut) => {
    globalShortcut.unregister(obsoleteShortcut.oldHotkey);
  });

  bookmarks.init(() => {
    updateMenu();
  });

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
    ioHook.removeListener('keydown', onKeyDown);
    win = null;
  });

  win.show();
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
  appMenu.update(win, () => {
    setFocusable(false);
    globalShortcut.unregister('Esc');
  }, () => {
    setFocusable(true);
    globalShortcut.register('Esc', unmaximize);
  })
}

function setFocusable(focusable) {
  viewManager.setFocusable(focusable);
  suspendViewFocus = !focusable;
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
  if (!suspendClose) app.quit();
});

app.on('before-quit', () => {
  if (isTrustedAccesibility) {
    ioHook.unload(); // since iohook prevents app from quitting on mac
  }
});
