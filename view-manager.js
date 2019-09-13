const electron = require('electron');
const { BrowserWindow, MenuItem, ipcMain } = electron;
const path = require('path');
const fs = require('fs');
const util = require('electron-util');

const requestFullscreen = fs.readFileSync(path.resolve(__dirname, 'set-video-fullscreen.js'), 'utf8');
const exitFullscreen = fs.readFileSync(path.resolve(__dirname, 'exit-video-fullscreen.js'), 'utf8');

let aspect_ratio = 16 / 9;

let SINGLE = 'Single';
let QUAD = 'Quad';
let QUADH = 'QuadH';
let QUADV = 'QuadV';
let FIVEH = 'FiveH';
let FIVEV = 'FiveV';
let DUAL = 'Dual';
let TRI = 'Tri';
let SIXH = 'SixH';
let SIXV = 'SixV';

let views;
let activeViews;
let parent;
let isInitialized;
let audibleView;
let frame;
let layoutPickerWnd;
let layout;
let previousLayout;
let layoutChangeCallbacks = [];
let newAddressLoadedCallbacks = [];
let autoRefresh = [];

function init(parentWindow) {
  if (isInitialized) throw new Error('Already initialized');
  parent = parentWindow;
  if (!frame) createFrame();

  views = [
    createView(1),
    createView(2),
    createView(3),
    createView(4),
    createView(5),
    createView(6),
  ];

  isInitialized = true;

  setQuadLayout(); // default layout
}

function swapViews(index1, index2) {
  let _temp = views[index1];
  views[index1] = views[index2];
  views[index1].number = index1 + 1;
  views[index2] = _temp;
  views[index2].number = index2 + 1;
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

function createView(number, title) {
  let view = new BrowserWindow({
    parent: parent,
    frame: false,
    transparent: false,
    show: false,
    skipTaskbar: true,
    resizable: false,
    fullscreen: false,
    minimizable: false,
    fullscreenable: false,
    closable: false,
    focusable: true,
    acceptFirstMouse: true,
    hasShadow: false,
    titleBarStyle: 'customButtonsOnHover' // together with frame: false makes corners not round on macos. It is a bug that we use as a feature
  });

  view.number = number;
  view.webContents.setAudioMuted(true);
  view.webContents.on('new-window', (e, url) => {
    e.preventDefault();
    view.webContents.loadURL(url);
  });
  view.webContents.on('page-title-updated', (e, favicons) => {
    // clearing old favicon
    view.webContents.favicons = null;
    view.webContents.setVisualZoomLevelLimits(1, 5);
    if (newAddressLoadedCallbacks && newAddressLoadedCallbacks.length) {
      newAddressLoadedCallbacks.forEach((cb) => {
        cb({ title: view.webContents.getTitle(), url: view.webContents.getURL() });
      })
    }
  });
  view.webContents.on('page-favicon-updated', (e, favicons) => {
    view.webContents.favicons = favicons;
  });
  view.on('focus', () => {
    setSelected(view);
  });
  return view;
}

function loadURL(url, view) {
  checkInitialized();

  if (view) {
    view.webContents.loadURL(url);
  } else {
    views.forEach(view => {
      view.webContents.loadURL(url);
    });
  }
}

function suspendAudible() {
  checkInitialized();

  if (audibleView) {
    audibleView.webContents.setAudioMuted(true);
  }

  frame.hide();
}

function resumeAudible() {
  checkInitialized();

  setAudible(audibleView);
  setSelected(audibleView);
}

function setSixHorizontalLayout(force) {
  let layoutViews = views.slice(0, 6);
  setLayoutInternal(SIXH, layoutViews, force, updateSixHorizontalLayout);
}

function setSixVerticalLayout(force) {
  let layoutViews = views.slice(0, 6);
  setLayoutInternal(SIXV, layoutViews, force, updateSixVerticalLayout);
}

function setFiveHorizontalLayout(force) {
  let layoutViews = views.slice(0, 5);
  setLayoutInternal(FIVEH, layoutViews, force, updateFiveHorizontalLayout);
}

function setFiveVerticalLayout(force) {
  let layoutViews = views.slice(0, 5);
  setLayoutInternal(FIVEV, layoutViews, force, updateFiveVerticalLayout);
}

function setQuadLayout(force) {
  let layoutViews = views.slice(0, 4);
  setLayoutInternal(QUAD, layoutViews, force, updateQuadLayout);
}

function setQuadHorizontalLayout(force) {
  let layoutViews = views.slice(0, 4);
  setLayoutInternal(QUADH, layoutViews, force, updateQuadHorizontalLayout);
}

function setQuadVerticalLayout(force) {
  let layoutViews = views.slice(0, 4);
  setLayoutInternal(QUADV, layoutViews, force, updateQuadVerticalLayout);
}

function setTriLayout(force) {
  let layoutViews = views.slice(0, 3);
  setLayoutInternal(TRI, layoutViews, force, updateTriLayout);
}

function setDualLayout(force) {
  let layoutViews = views.slice(0, 2);
  setLayoutInternal(DUAL, layoutViews, force, updateDualLayout);
}

function setSingleLayout(number) {
  let layoutViews = [ getViewByNumber(number) ];
  setLayoutInternal(SINGLE, layoutViews, true, updateSingleLayout);
}

function setLayoutInternal(newLayout, layoutViews, force, updateFunc) {
  checkInitialized();

  if (layout != newLayout || force) {
    previousLayout = layout;
    layout = newLayout;
    activeViews = layoutViews;

    views.forEach(view => {
      view.hide();
    });

    setSelected(false);

    updateFunc();

    activeViews.forEach(view => {
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

function isSingleLayout() {
  checkInitialized();
  return layout === SINGLE;
}

function exitSingleLayout() {
  checkInitialized();
  if (layout != SINGLE) return;
  setLayout(previousLayout, true);
}

function updateLayout() {
  if (layout === SINGLE) updateSingleLayout();
  if (layout === DUAL) updateDualLayout();
  if (layout === TRI) updateTriLayout();
  if (layout === QUAD) updateQuadLayout();
  if (layout === QUADH) updateQuadHorizontalLayout();
  if (layout === QUADV) updateQuadVerticalLayout();
  if (layout === FIVEH) updateFiveHorizontalLayout();
  if (layout === FIVEV) updateFiveVerticalLayout();
  if (layout === SIXH) updateSixHorizontalLayout();
  if (layout === SIXV) updateSixVerticalLayout();

  if (audibleView) {
    setSelected(audibleView); // updating size and location of the frame
  }
}

function setLayout(layout, force) {
  if (layout === SIXH) setSixHorizontalLayout(force);
  if (layout === SIXV) setSixVerticalLayout(force);
  if (layout === FIVEH) setFiveHorizontalLayout(force);
  if (layout === FIVEV) setFiveVerticalLayout(force);
  if (layout === QUAD) setQuadLayout(force);
  if (layout === QUADH) setQuadHorizontalLayout(force);
  if (layout === QUADV) setQuadVerticalLayout(force);
  if (layout === TRI) setTriLayout(force);
  if (layout === DUAL) setDualLayout(force);
  if (layout === SINGLE) {
    if (audibleView) {
      setSingleLayout(audibleView.number);
    } else {
      setSingleLayout(activeViews[0].number);
    }
  }
}

function getViewNames() {
  if (layout === SINGLE)
    return [ { name: "Current", number: null } ];
    
  if (layout === DUAL)
    return [ 
      { name: "Top", number: 1 },
      { name: "Bottom", number: 2 },
      { name: "All", number: null }
    ];

  if (layout === TRI)
    return [ 
      { name: "Top left", number: 1 },
      { name: "Top right", number: 2 },
      { name: "Bottom", number: 3 },
      { name: "All", number: null }
    ];

  if (layout === QUAD)
    return [ 
      { name: "Top left", number: 1 },
      { name: "Top right", number: 2 },
      { name: "Bottom left", number: 3 },
      { name: "Bottom right", number: 4 },
      { name: "All", number: null }
    ];

  if (layout === QUADH)
    return [ 
      { name: "Top left", number: 1 },
      { name: "Top center", number: 2 },
      { name: "Top right", number: 3 },
      { name: "Bottom", number: 4 },
      { name: "All", number: null }
    ];

  if (layout === QUADV)
    return [ 
      { name: "Left", number: 1 },
      { name: "Top right", number: 2 },
      { name: "Middle right", number: 3 },
      { name: "Bottom right", number: 4 },
      { name: "All", number: null }
    ];

  if (layout === FIVEH)
    return [ 
      { name: "Top left", number: 1 },
      { name: "Top center", number: 2 },
      { name: "Top right", number: 3 },
      { name: "Bottom left", number: 4 },
      { name: "Bottom right", number: 5 },
      { name: "All", number: null }
    ];

  if (layout === FIVEV)
    return [ 
      { name: "Top left", number: 1 },
      { name: "Bottom left", number: 2 },
      { name: "Top right", number: 3 },
      { name: "Middle right", number: 4 },
      { name: "Bottom right", number: 5 },
      { name: "All", number: null }
    ];

  if (layout === SIXH)
    return [ 
      { name: "Top left", number: 1 },
      { name: "Top center", number: 2 },
      { name: "Top right", number: 3 },
      { name: "Bottom left", number: 4 },
      { name: "Bottom center", number: 5 },
      { name: "Bottom right", number: 6 },
      { name: "All", number: null }
    ];

  if (layout === SIXV)
    return [ 
      { name: "Top left", number: 1 },
      { name: "Top right", number: 2 },
      { name: "Middle left", number: 3 },
      { name: "Middle right", number: 4 },
      { name: "Bottom left", number: 5 },
      { name: "Bottom right", number: 6 },
      { name: "All", number: null }
    ];
}

function getUsableBounds() {
  let parentX = parent.getPosition()[0];
  let parentY = parent.getPosition()[1];
  let contentBounds = parent.getContentBounds();
  let offsetX = parentX;
  let offsetY = parentY + (util.is.macos && !parent.isFullScreen() ? util.menuBarHeight() : 0);
  return { x: offsetX, y: offsetY, width: contentBounds.width, height: contentBounds.height };
}

function updateSingleLayout() {
  checkInitialized();
  activeViews[0].setBounds(getUsableBounds());
}

function updateDualLayout() {
  checkInitialized();

  let bounds = getUsableBounds();
  let viewWidth = bounds.width
  let viewHeight = Math.floor(bounds.height / 2);

  let bounds1 = { x: bounds.x, y: bounds.y, width: viewWidth, height: viewHeight };
  let bounds2 = { x: bounds.x, y: bounds.y + viewHeight, width: viewWidth, height: viewHeight };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);
}

function updateTriLayout() {
  checkInitialized();

  let bounds = getUsableBounds();
  let topViewWidth = Math.floor(bounds.width / 2);
  let topViewHeight = Math.floor(topViewWidth / aspect_ratio);
  let bottomViewWidth = bounds.width;
  let bottomViewHeight = bounds.height - topViewHeight;

  let bounds1 = { x: bounds.x, y: bounds.y, width: topViewWidth, height: topViewHeight };
  let bounds2 = { x: bounds.x + topViewWidth, y: bounds.y, width: topViewWidth, height: topViewHeight };
  let bounds3 = { x: bounds.x, y: bounds.y + topViewHeight, width: bottomViewWidth, height: bottomViewHeight };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);
  views[2].setBounds(bounds3);
}

function updateQuadLayout() {
  checkInitialized();

  let size = calculateViewSize(2, 2);

  let bounds1 = { x: size.x, y: size.y, width: size.width, height: size.height };
  let bounds2 = { x: size.x + size.width, y: size.y, width: size.width, height: size.height };
  let bounds3 = { x: size.x, y: size.y + size.height, width: size.width, height: size.height };
  let bounds4 = { x: size.x + size.width, y: size.y + size.height, width: size.width, height: size.height };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);
  views[2].setBounds(bounds3);
  views[3].setBounds(bounds4);
}

function updateQuadHorizontalLayout() {
  checkInitialized();

  let bounds = getUsableBounds();

  let topViewWidth = Math.floor(bounds.width / 3);
  let topViewHeight = Math.floor(topViewWidth / aspect_ratio);

  let bottomViewWidth = bounds.width;
  let bottomViewHeight = bounds.height - topViewHeight;

  let bounds1 = { x: bounds.x, y: bounds.y, width: topViewWidth, height: topViewHeight };
  let bounds2 = { x: bounds.x + topViewWidth, y: bounds.y, width: topViewWidth, height: topViewHeight };
  let bounds3 = { x: bounds.x + topViewWidth * 2, y: bounds.y, width: topViewWidth, height: topViewHeight };
  let bounds4 = { x: bounds.x, y: bounds.y + topViewHeight, width: bottomViewWidth, height: bottomViewHeight };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);
  views[2].setBounds(bounds3);
  views[3].setBounds(bounds4);
}

function updateQuadVerticalLayout() {
  checkInitialized();

  let bounds = getUsableBounds();

  let rightViewHeight = Math.floor(bounds.height / 3);
  let rightViewWidth = Math.floor(rightViewHeight * aspect_ratio);

  let leftViewWidth = bounds.width - rightViewWidth;
  let leftViewHeight = bounds.height;

  let bounds1 = { x: bounds.x, y: bounds.y, width: leftViewWidth, height: leftViewHeight };
  let bounds2 = { x: bounds.x + leftViewWidth, y: bounds.y, width: rightViewWidth, height: rightViewHeight };
  let bounds3 = { x: bounds.x + leftViewWidth, y: bounds.y + rightViewHeight, width: rightViewWidth, height: rightViewHeight };
  let bounds4 = { x: bounds.x + leftViewWidth, y: bounds.y + rightViewHeight * 2, width: rightViewWidth, height: rightViewHeight };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);
  views[2].setBounds(bounds3);
  views[3].setBounds(bounds4);
}

function updateFiveHorizontalLayout() {
  checkInitialized();

  let bounds = getUsableBounds();

  let topViewWidth = Math.floor(bounds.width / 3);
  let topViewHeight = Math.floor(topViewWidth / aspect_ratio);

  let bottomViewWidth = Math.floor(bounds.width / 2);
  let bottomViewHeight = Math.floor(bottomViewWidth / aspect_ratio);

  bounds.y = bounds.y + Math.floor((bounds.height - topViewHeight - bottomViewHeight) / 2);

  let bounds1 = { x: bounds.x, y: bounds.y, width: topViewWidth, height: topViewHeight };
  let bounds2 = { x: bounds.x + topViewWidth, y: bounds.y, width: topViewWidth, height: topViewHeight };
  let bounds3 = { x: bounds.x + topViewWidth * 2, y: bounds.y, width: topViewWidth, height: topViewHeight };
  let bounds4 = { x: bounds.x, y: bounds.y + topViewHeight, width: bottomViewWidth, height: bottomViewHeight };
  let bounds5 = { x: bounds.x + bottomViewWidth, y: bounds.y + topViewHeight, width: bottomViewWidth, height: bottomViewHeight };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);
  views[2].setBounds(bounds3);
  views[3].setBounds(bounds4);
  views[4].setBounds(bounds5);
}

function updateFiveVerticalLayout() {
  checkInitialized();

  let bounds = getUsableBounds();

  let rightViewHeight = Math.floor(bounds.height / 3);
  let rightViewWidth = Math.floor(rightViewHeight * aspect_ratio);

  let leftViewWidth = 0;
  let leftViewHeight = 0;

  let leftOffset = 0;

  if ((bounds.width - rightViewWidth) / (bounds.height / 2) < aspect_ratio) {
    leftViewWidth = bounds.width - rightViewWidth;
    leftViewHeight = Math.floor(leftViewWidth / aspect_ratio);
    leftOffset = Math.floor(bounds.height / 2) - leftViewHeight;
  } else {
    leftViewHeight = Math.floor(bounds.height / 2);
    leftViewWidth = Math.floor(leftViewHeight * aspect_ratio);
    bounds.x = bounds.x + Math.floor((bounds.width - leftViewWidth - rightViewWidth) / 2);
  }

  let bounds1 = { x: bounds.x, y: bounds.y + leftOffset, width: leftViewWidth, height: leftViewHeight };
  let bounds2 = { x: bounds.x, y: bounds.y + leftOffset + leftViewHeight, width: leftViewWidth, height: leftViewHeight };
  let bounds3 = { x: bounds.x + leftViewWidth, y: bounds.y, width: rightViewWidth, height: rightViewHeight };
  let bounds4 = { x: bounds.x + leftViewWidth, y: bounds.y + rightViewHeight, width: rightViewWidth, height: rightViewHeight };
  let bounds5 = { x: bounds.x + leftViewWidth, y: bounds.y + rightViewHeight * 2, width: rightViewWidth, height: rightViewHeight };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);
  views[2].setBounds(bounds3);
  views[3].setBounds(bounds4);
  views[4].setBounds(bounds5);
}

function updateSixHorizontalLayout() {
  checkInitialized();

  let size = calculateViewSize(2, 3);

  let bounds1 = { x: size.x, y: size.y, width: size.width, height: size.height };
  let bounds2 = { x: size.x + size.width, y: size.y, width: size.width, height: size.height };
  let bounds3 = { x: size.x + size.width * 2, y: size.y, width: size.width, height: size.height };
  let bounds4 = { x: size.x, y: size.y + size.height, width: size.width, height: size.height };
  let bounds5 = { x: size.x + size.width, y: size.y + size.height, width: size.width, height: size.height };
  let bounds6 = { x: size.x + size.width * 2, y: size.y + size.height, width: size.width, height: size.height };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);
  views[2].setBounds(bounds3);
  views[3].setBounds(bounds4);
  views[4].setBounds(bounds5);
  views[5].setBounds(bounds6);
}

function updateSixVerticalLayout() {
  checkInitialized();

  let size = calculateViewSize(3, 2);

  let bounds1 = { x: size.x, y: size.y, width: size.width, height: size.height };
  let bounds2 = { x: size.x + size.width, y: size.y, width: size.width, height: size.height };
  let bounds3 = { x: size.x, y: size.y + size.height, width: size.width, height: size.height };
  let bounds4 = { x: size.x + size.width, y: size.y + size.height, width: size.width, height: size.height };
  let bounds5 = { x: size.x, y: size.y + size.height * 2, width: size.width, height: size.height };
  let bounds6 = { x: size.x + size.width, y: size.y + size.height * 2, width: size.width, height: size.height };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);
  views[2].setBounds(bounds3);
  views[3].setBounds(bounds4);
  views[4].setBounds(bounds5);
  views[5].setBounds(bounds6);
}

function calculateViewSize(rows, cols) {
  let bounds = getUsableBounds();
  let ratio = aspect_ratio * cols / rows;
  let viewWidth = 0;
  let viewHeight = 0;
  let x = bounds.x;
  let y = bounds.y;

  if (bounds.width / bounds.height < ratio) {
    let newHeight = bounds.width / ratio;
    const barHeight = Math.floor((bounds.height - newHeight) / 2);
    y += barHeight;
    viewWidth = Math.floor(bounds.width / cols);
    viewHeight = Math.floor(newHeight / rows);
  } else {
    let newWidth = bounds.height * ratio;
    const barWidth = Math.floor((bounds.width - newWidth) / 2);
    x += barWidth;
    viewWidth = Math.floor(newWidth / cols);
    viewHeight = Math.floor(bounds.height / rows);
  }

  return { x: x, y: y, width: viewWidth, height: viewHeight };
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
    audibleView.webContents.setAudioMuted(false);
  }

  setSelected(view);
}

function setSelected(view) {
  checkInitialized();

  if (isSingleLayout() && frame) {
    frame.hide();
    return;
  }

  if (!parent.isVisible() || !view || !view.isVisible()) {
    if (frame) frame.hide();
    return;
  }

  if (!frame) createFrame();

  frame.setBounds(view.getBounds());
  frame.parent = view;
  frame.show();
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
    height: 310,
    width: 800,
    webPreferences: {
      nodeIntegration: true
    }
  });

  layoutPickerWnd.loadFile(`renderer/layout-picker.html`);

  layoutPickerWnd.once('ready-to-show', () => {
    layoutPickerWnd.show();
    layoutPickerWnd.setAlwaysOnTop(true, "modal-panel");
    layoutPickerWnd.webContents.send('set-current', layout);
  });

  layoutPickerWnd.on('closed', () => {
    layoutPickerWnd = null;
  });

  ipcMain.once('change-layout', (event, newLayout) => {
    if (newLayout) {
      setLayout(newLayout, false);
      callback();
    }
  });
}

function createFrame() {
  frame = new BrowserWindow({
    frame: false,
    transparent: true,
    show: false,
    skipTaskbar: true,
    parent: parent,
    closable: false,
    focusable: false,
    fullscreenable: false
  });

  frame.loadFile('renderer/frame.html');
  frame.setIgnoreMouseEvents(true);
}

function maximizeViews() {
  checkInitialized();

  activeViews.forEach(v => {
    v.webContents
      .executeJavaScript(requestFullscreen, true)
      .then(result => {})
      .catch(error => {
        console.log(`Fullscreen ${error}`);
      });
  });
}

function minimizeViews() {
  checkInitialized();

  activeViews.forEach(v => {
    v.webContents
      .executeJavaScript(exitFullscreen, true)
      .then(result => {})
      .catch(error => {
        console.log(`Exit Fullscreen ${error}`);
      });
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
  if (frame && !frame.isDestroyed()) {
    frame.close();
  }
  frame = null;
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

var exports = (module.exports = {
  init: init,
  setAudible: setAudible,
  getAudible: getAudible,
  suspendAudible: suspendAudible,
  resumeAudible: resumeAudible,
  inView: inView,
  getViewByNumber: getViewByNumber,
  setSixHorizontalLayout: setSixHorizontalLayout,
  setSixVerticalLayout: setSixVerticalLayout,
  setFiveHorizontalLayout: setFiveHorizontalLayout,
  setFiveVerticalLayout: setFiveVerticalLayout,
  setQuadLayout: setQuadLayout,
  setQuadHorizontalLayout: setQuadHorizontalLayout,
  setQuadVerticalLayout: setQuadVerticalLayout,
  setTriLayout: setTriLayout,
  setDualLayout: setDualLayout,
  setSingleLayout: setSingleLayout,
  exitSingleLayout: exitSingleLayout,
  isSingleLayout: isSingleLayout,
  getViewNames: getViewNames,
  changeLayout: changeLayout,
  loadURL: loadURL,
  updateLayout: updateLayout,
  maximizeViews: maximizeViews,
  minimizeViews: minimizeViews,
  unload: unload,
  menuOnClick: appendSwapMenu,
  onLayoutChange: onLayoutChange,
  setAutoRefresh: setAutoRefresh,
  getAutoRefresh: getAutoRefresh,
  onNewAddressLoaded: onNewAddressLoaded
});
