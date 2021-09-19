const electron = require('electron');
const { BrowserWindow, MenuItem, ipcMain, globalShortcut } = electron;
const path = require('path');
const fs = require('fs');
const util = require('electron-util');
const layouts = require('./layouts');
const frameOptions = require('./frame-options');
const viewFactory = require('./view-factory');

const requestFullscreen = fs.readFileSync(path.resolve(__dirname, 'set-video-fullscreen.js'), 'utf8');
const exitFullscreen = fs.readFileSync(path.resolve(__dirname, 'exit-video-fullscreen.js'), 'utf8');

let views = [];
let activeViews;
let parent;
let isInitialized;
let audibleView;
let layoutPickerWnd;
let layout;
let previousLayout;
let layoutChangeCallbacks = [];
let newAddressLoadedCallbacks = [];
let autoRefresh = [];
let homepage;
let muted;
let hover;
let numberMode;
let fullscreenNumberMode;

function init(parentWindow, defaultURL) {
  if (isInitialized) throw new Error('Already initialized');
  parent = parentWindow;
  homepage = defaultURL;
  frameOptions.getFrame(parent); // constructs frame
  isInitialized = true;
  setLayout(layouts.QUAD, true); // default layout
}

function swapViews(index1, index2) {
  let _temp = views[index1];
  views[index1] = views[index2];
  views[index1].number = index1 + 1;
  views[index2] = _temp;
  views[index2].number = index2 + 1;

  if (views[index1].isBlank) {
    suspend(views[index1]); // to refresh the number
  }

  if (views[index2].isBlank) {
    suspend(views[index2]); // to refresh the number
  }
}

function appendSwapMenu(number, ctxMenu) {
  let viewNumbers = activeViews.map(v => v.number);
  let swapTo = viewNumbers.filter(n => n !== number).sort();

  let swapMenu = new MenuItem({
    label: 'Swap with',
    submenu: []
  });

  swapTo.forEach(n => {
    swapMenu.submenu.append(new MenuItem({
      label: `${n}`,
      click: function() {
        swapViews(number - 1, n - 1);
        updateLayout();
      }
    }));
  });
  
  ctxMenu.append(new MenuItem({ type: 'separator' }));
  ctxMenu.append(swapMenu);
}

function createView(number) {
  let view = viewFactory.create(parent, number);

  view.webContents.setAudioMuted(true);
  view.webContents.on('new-window', (e, url) => {
    if (view && view.webContents) {
      e.preventDefault();
      view.webContents.loadURL(url);
      view.isBlank = false;
    }
  });
  view.webContents.on('page-title-updated', (e, favicons) => {
    if (view && view.webContents) {
      // clearing old favicon
      view.webContents.favicons = null;
      view.webContents.setVisualZoomLevelLimits(1, 5);
      if (!view.isBlank) {
        if (newAddressLoadedCallbacks && newAddressLoadedCallbacks.length) {
          newAddressLoadedCallbacks.forEach((cb) => {
            cb({ title: view.webContents.getTitle(), url: view.webContents.getURL() });
          })
        }
      }
    }
  });
  view.webContents.on('page-favicon-updated', (e, favicons) => {
    if (view && view.webContents) {
      view.webContents.favicons = favicons;
    }
  });
  view.webContents.on('before-input-event', (event, input) => {
    if (numberMode || fullscreenNumberMode) {
      let numberKeys = [ '1', '2', '3', '4', '5', '6', '7', '8', '9', '0' ];
      if (numberKeys.includes(input.key)) {
        event.preventDefault();
      }
    }
  });
  view.on('focus', () => {
    if (view && view.focusable) {
      setAudible(view);
      setSelected(view);
    }
  });
  view.webContents.loadURL(homepage);
  return view;
}

function substituteView(view, newView) {
  views[view.number - 1] = newView;
  let activeIndex = activeViews.indexOf(view);
  if (activeIndex >= 0) {
    activeViews[activeIndex] = newView;
  }
  newView.number = view.number;
  parent.focus(); // to avoid focus jumping around
  view.hide();
  newView.show();
  updateLayout();
}

function muteAll(mute) {
  muted = mute;
  if (muted) {
    views.forEach(v => {
      v.webContents.setAudioMuted(true);
    });
    frameOptions.setFrameDashed();
  } else if (audibleView) {
    setAudible(audibleView);
    frameOptions.setFrameSolid();
  }
}

function isMuted() {
  return !!muted;
}

function loadURL(url, view) {
  checkInitialized();

  if (view) {
    if (!view.isNotepad) {
      view.webContents.loadURL(url);
      view.isBlank = false;
    }
  } else {
    views.forEach(view => {
      if (!view.isNotepad) {
        view.webContents.loadURL(url);
        view.isBlank = false;
      }
    });
  }
}

function suspendAudible() {
  checkInitialized();

  if (audibleView) {
    audibleView.webContents.setAudioMuted(true);
  }

  frameOptions.getFrame(parent).hide();
}

function resumeAudible() {
  checkInitialized();

  setAudible(audibleView);
  setSelected(audibleView);
}

function setLayout(newLayout, force, layoutViews = null) {
  checkInitialized();

  if (layout != newLayout || force) {
    if (layout !== layouts.SINGLE) {
      previousLayout = layout;
    }

    layout = newLayout;
    let viewCount = layouts.getViewCount(layout);

    // making sure we have enough views
    for (var i = views.length; i < viewCount; i++) {
      views.push(createView(i + 1));
    }
    activeViews = layoutViews || views.slice(0, viewCount);

    views.forEach(view => {
      view.hide();
      view.webContents.setBackgroundThrottling(true);
    });

    setSelected(false);

    layouts.updateLayout(newLayout, parent, activeViews);

    activeViews.forEach(view => {
      view.webContents.setBackgroundThrottling(false);
      view.show();
    });

    if (audibleView) {
      if (!activeViews.includes(audibleView)) {
        setAudible(activeViews[0]);
      } else {
        setAudible(audibleView);
      }
    }

    layoutChangeCallbacks.forEach((cb) => {
      cb();
    });
  }
}

function updateLayout() {
  layouts.updateLayout(layout, parent, views);
  if (audibleView) {
    setSelected(audibleView); // updating size and location of the frame
  }
}

function toggleSingleLayout(view) {
  if (layout === layouts.SINGLE) {
    setLayout(previousLayout, true);
  } else {
    setLayout(layouts.SINGLE, true, [ view ]);
  }
}

function setSingleLayout(view) {
  if (view) {
    setLayout(layouts.SINGLE, true, [ view ]);
  }
}

function exitSingleLayout() {
  if (layout === layouts.SINGLE) {
    let currentAudible = audibleView;
    setLayout(previousLayout, true);
    if (currentAudible) {
      currentAudible.focus();
      setSelected(currentAudible);
    }
  }
}

function checkInitialized() {
  if (!isInitialized) throw new Error('Init needs to be called first');
}

function getAudible() {
  checkInitialized();

  return audibleView;
}

function setAudible(view) {
  checkInitialized();

  if (!view || !activeViews.includes(view)) return;

  if (
    audibleView !== view ||
    (audibleView && audibleView.webContents.isAudioMuted())
  ) {
    views.forEach(v => {
      v.webContents.setAudioMuted(true);
    });

    audibleView = view;
    if (!muted) {
      audibleView.webContents.setAudioMuted(false);
    }
  }

  setSelected(view);
}

function setSelected(view) {
  checkInitialized();

  let frame = frameOptions.getFrame(parent);

  // if (layout === layouts.SINGLE && frame) {
  //   frame.hide();
  //   return;
  // }

  if (!parent.isVisible() || !view || !view.isVisible()) {
    frame.hide();
    return;
  }

  frame.setBounds(view.getBounds());
  frame.parent = view;
  frame.show();
  frame.moveTop();
}

function getViewByNumber(number) {
  checkInitialized();

  let view = views.find(v => v.number === number);
  return view;
}

function inView(x, y) {
  checkInitialized();

  if (!parent || !parent.isVisible()) return null;

  if (!util.is.macos) {
    let scaleFactor = electron.screen.getPrimaryDisplay().scaleFactor;
    x = Math.floor(x / scaleFactor);
    y = Math.floor(y / scaleFactor);
  }

  let found = activeViews.find(view => {
    let bounds = view.getBounds();
    let tolerance = 10;

    let matchX = x > bounds.x + tolerance && x < (bounds.x + bounds.width) - tolerance;
    let matchY = y > bounds.y + tolerance && y < (bounds.y + bounds.height) - tolerance;

    if (matchX && matchY) {
      return view;
    }
  });

  return found;
}

function changeLayout(callback) {
  layoutPickerWnd = new BrowserWindow({
    frame: false,
    transparent: false,
    show: false,
    skipTaskbar: true,
    parent: parent,
    closable: true,
    modal: true,
    focusable: true,
    fullscreenable: false,
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: true
    }
  });

  layoutPickerWnd.loadFile(`dist/layouts.html`);

  layoutPickerWnd.once('ready-to-show', () => {
    layoutPickerWnd.show();
    layoutPickerWnd.setAlwaysOnTop(true, "modal-panel");
    //layoutPickerWnd.webContents.openDevTools();
  });

  ipcMain.once('change-layout-loaded', () => {
    layoutPickerWnd.webContents.send('set-current-layout', { layout: layout, alignment: layouts.getAlignment() });
  });

  layoutPickerWnd.on('closed', () => {
    layoutPickerWnd = null;
    callback();
  });

  ipcMain.once('change-layout', (event, layoutResult) => {
    if (layoutResult) {
      let force = false;
      if (layouts.getAlignment() !== layoutResult.alignment) {
        layouts.setAlignment(layoutResult.alignment);
        force = true;
      }
      setLayout(layoutResult.layout, force);
      callback();
    }
  });
}

function maximizeViews() {
  checkInitialized();
  injectToAll(requestFullscreen);
}

function minimizeViews() {
  checkInitialized();
  injectToAll(exitFullscreen);
}

function injectToAll(script) {
  activeViews.forEach(v => {
    v.webContents
      .executeJavaScript(script, true)
      .then(result => {})
      .catch(error => {});
  });
}

function unload() {
  views.forEach(v => {
    v.destroy();
  });
  views = [];
  parent = null;
  isInitialized = false;
  audibleView = null;
  frameOptions.closeFrame();
}

function onLayoutChange(callback) {
  layoutChangeCallbacks.push(callback);
}

function setAutoRefresh(view, seconds) {
  let ar = autoRefresh.find(ar => ar.view === view);
  if (ar) {
    clearInterval(ar.interval);
    ar.time = null;
  } 

  if (seconds) {
    ar = ar || { view: view };
    ar.interval = setInterval(() => {
      if (activeViews.includes(view)) {
        view.webContents.reload();
      }
    }, seconds * 1000);

    ar.time = seconds;
    autoRefresh.push(ar);
  }
}

function getAutoRefresh(view) {
  let ar = autoRefresh.find(ar => ar.view === view);
  if (ar) {
    return ar.time;
  }
  return null;
}

function onNewAddressLoaded(callback) {
  newAddressLoadedCallbacks.push(callback);
}

function getViewNames() {
  return layouts.getViewNames(layout);
}

function setFocusable(focusable) {
  views.forEach(v => {
    v.focusable = focusable;
  })
}

function suspend(view) {
  view.webContents.loadFile(`dist/blank.html`, { query: { number: view.number }});
  //view.webContents.openDevTools();
  view.isBlank = true;
}

function toggleHoverMode() {
  hover = !hover;
}

function isHoverMode() {
  return !!hover;
}

function toggleNumberMode() {
  numberMode = !numberMode;
  
  if (numberMode) {
    fullscreenNumberMode = false;
    
    globalShortcut.register('TAB', () => {
      let nextNumber = 1;
      if (audibleView) {
        if (audibleView.number < activeViews.length) {
          nextNumber = audibleView.number + 1;
        }
      }
      let view = getViewByNumber(nextNumber);
      if (view) setAudible(view);
    });
  } else {
    globalShortcut.unregister('TAB');
  }
}

function isNumberMode() {
  return !!numberMode;
}

function toggleFullscreenNumberMode() {
  fullscreenNumberMode = !fullscreenNumberMode;
  if (fullscreenNumberMode) {
    numberMode = false;
  }
}

function isFullscreenNumberMode() {
  return !!fullscreenNumberMode;
}

var exports = (module.exports = {
  init: init,
  setAudible: setAudible,
  getAudible: getAudible,
  suspendAudible: suspendAudible,
  suspend: suspend,
  resumeAudible: resumeAudible,
  inView: inView,
  getViewByNumber: getViewByNumber,
  toggleSingleLayout: toggleSingleLayout,
  setSingleLayout: setSingleLayout,
  exitSingleLayout: exitSingleLayout,
  changeLayout: changeLayout,
  getViewNames: getViewNames,
  loadURL: loadURL,
  updateLayout: updateLayout,
  maximizeViews: maximizeViews,
  minimizeViews: minimizeViews,
  setFocusable: setFocusable,
  unload: unload,
  menuOnClick: appendSwapMenu,
  onLayoutChange: onLayoutChange,
  setAutoRefresh: setAutoRefresh,
  getAutoRefresh: getAutoRefresh,
  onNewAddressLoaded: onNewAddressLoaded,
  muteAll: muteAll,
  isMuted: isMuted,
  toggleHoverMode: toggleHoverMode,
  isHoverMode: isHoverMode,
  toggleNumberMode: toggleNumberMode,
  isNumberMode: isNumberMode,
  isFullscreenNumberMode: isFullscreenNumberMode,
  toggleFullscreenNumberMode: toggleFullscreenNumberMode,
  substituteView: substituteView
});
