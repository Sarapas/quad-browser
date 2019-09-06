const electron = require('electron');
const { BrowserWindow, BrowserView, Menu, MenuItem, ipcMain } = electron;
const path = require('path');
const fs = require('fs');

const requestFullscreen = fs.readFileSync(path.resolve(__dirname, 'set-video-fullscreen.js'), 'utf8');
const exitFullscreen = fs.readFileSync(path.resolve(__dirname, 'exit-video-fullscreen.js'), 'utf8');

const isMac = process.platform === 'darwin';
let aspect_ratio = 16 / 9;

let SINGLE = 'Single';
let QUAD = 'Quad';
let DUAL = 'Dual';
let TRI = 'Tri';
let SIXH = 'SIXH'
let SIXV = 'SIXV'

let views;
let activeViews;
let viewBounds;
let parent;
let isInitialized;
let audibleView;
let frame;
let textBox;
let layout;
let previousLayout;

function init(parentWindow) {
  if (isInitialized) throw new Error('Already initialized');
  parent = parentWindow;
  if (!frame) createFrame();

  views = [
    createBrowserView(1),
    createBrowserView(2),
    createBrowserView(3),
    createBrowserView(4),
    createBrowserView(5),
    createBrowserView(6),
  ];

  isInitialized = true;

  setQuadLayout(); // default layout
}

function swapBrowserView(index1, index2) {
  let _temp = views[index1];
  views[index1] = views[index2];
  views[index1].number = index1 + 1;
  views[index2] = _temp;
  views[index2].number = index2 + 1;
}

function appendSwapMenu(number, ctxMenu) {
  let viewNumbers = activeViews.map(v => v.number);
  let swapTo = viewNumbers.filter(n => n !== number);

  swapTo.forEach(n => {
    ctxMenu.append(
      new MenuItem({
        label: 'Swap with ' + n,
        click: function() {
          swapBrowserView(number - 1, n - 1);
          updateLayout();
        }
      })
    );
  });
}

function createBrowserView(number, title) {
  let browserView = new BrowserView();
  browserView.number = number;
  browserView.webContents.setAudioMuted(true);
  return browserView;
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
  checkInitialized();

  if (layout != SIXH || force) {
    previousLayout = layout;
    layout = SIXH;
    activeViews = views.slice(0, 6);
    parent.setBrowserView(null); // clearing browserviews
    activeViews.forEach(view => {
      parent.addBrowserView(view);
    });

    updateSixHorizontalLayout();

    if (audibleView) {
      setAudible(audibleView);
    }
  }
}

function setSixVerticalLayout(force) {
  checkInitialized();

  if (layout != SIXV || force) {
    previousLayout = layout;
    layout = SIXV;
    activeViews = views.slice(0, 6);
    parent.setBrowserView(null); // clearing browserviews
    activeViews.forEach(view => {
      parent.addBrowserView(view);
    });

    updateSixVerticalLayout();

    if (audibleView) {
      setAudible(audibleView);
    }
  }
}

function setQuadLayout(force) {
  checkInitialized();

  if (layout != QUAD || force) {
    previousLayout = layout;
    layout = QUAD;
    activeViews = views.slice(0, 4);
    parent.setBrowserView(null); // clearing browserviews
    activeViews.forEach(view => {
      parent.addBrowserView(view);
    });

    updateQuadLayout();

    if (audibleView) {
      setAudible(audibleView);
    }
  }
}

function setTriLayout(force) {
  checkInitialized();

  if (layout != TRI || force) {
    previousLayout = layout;
    layout = TRI;
    activeViews = views.slice(0, 3);

    parent.setBrowserView(null); // clear browser views
    activeViews.forEach(view => {
      parent.addBrowserView(view);
    });

    updateTriLayout();

    if (audibleView) {
      if (!activeViews.includes(audibleView)) {
        setAudible(activeViews[0]);
      } else {
        setAudible(audibleView);
      }
    }
  }
}

function setDualLayout(force) {
  checkInitialized();

  if (layout != DUAL || force) {
    previousLayout = layout;
    layout = DUAL;
    activeViews = views.slice(0, 2);

    parent.setBrowserView(null); // clear browser views
    activeViews.forEach(view => {
      parent.addBrowserView(view);
    });

    updateDualLayout();

    if (audibleView) {
      if (!activeViews.includes(audibleView)) {
        setAudible(activeViews[0]);
      } else {
        setAudible(audibleView);
      }
    }
  }
}

function setSingleLayout(number) {
  checkInitialized();

  if (layout != SINGLE) {
    previousLayout = layout;
    layout = SINGLE;
    activeViews = [ views[number] ];

    parent.setBrowserView(null); // clear browser views
    activeViews.forEach(view => {
      parent.addBrowserView(view);
    });

    updateSingleLayout(number);

    if (audibleView) {
      if (!activeViews.includes(audibleView)) {
        setAudible(activeViews[0]);
      } else {
        setAudible(audibleView);
      }
    }
  }
}

function exitSingleLayout() {
  checkInitialized();
  if (layout != SINGLE) return;
  if (previousLayout === QUAD) setQuadLayout(true);
  if (previousLayout === DUAL) setDualLayout(true);
  if (previousLayout === TRI) setTriLayout(true);
}

function isSingleLayout() {
  checkInitialized();
  return layout === SINGLE;
}

function isDualLayout() {
  checkInitialized();
  return layout === DUAL;
}

function isTriLayout() {
  checkInitialized();
  return layout === TRI;
}

function isQuadLayout() {
  checkInitialized();
  return layout === QUAD;
}

function isSixHorizontalLayout() {
  checkInitialized();
  return layout === SIXH;
}

function isSixVerticalLayout() {
  checkInitialized();
  return layout === SIXV;
}

function updateLayout() {
  if (layout === SINGLE) {
    updateSingleLayout();
  } else if (layout === DUAL) {
    updateDualLayout();
  } else if (layout === TRI) {
    updateTriLayout();
  } else if (layout === QUAD) {
    updateQuadLayout();
  } else if (layout === SIXH) {
    updateSixHorizontalLayout();
  } else if (layout === SIXV) {
    updateSixVerticalLayout();
  } else {
    throw new Error('Unknown layout');
  }

  if (audibleView) {
    setSelected(audibleView); // updating size and location of the frame
  }
}

function updateSingleLayout(number) {
  let bounds = parent.getBounds();
  let contentBounds = parent.getContentBounds();
  let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu

  let vBounds = { x: 0, y: offsetY, width: contentBounds.width, height: contentBounds.height };

  views[number].setBounds(vBounds);

  viewBounds = [{ view: views[number], bounds: vBounds }];
}

function updateDualLayout() {
  checkInitialized();

  // not trying to maintain aspect ratio and letting vide players take care of that
  let bounds = parent.getBounds();
  let contentBounds = parent.getContentBounds();
  let viewWidth = Math.floor(contentBounds.width);
  let viewHeight = Math.floor(contentBounds.height / 2);
  let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu
  let offsetX = 0;

  let bounds1 = { x: offsetX, y: offsetY, width: viewWidth, height: viewHeight };
  let bounds2 = { x: offsetX, y: offsetY + viewHeight, width: viewWidth, height: viewHeight };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);

  // preserving view bounds for later reference
  viewBounds = [
    { view: views[0], bounds: bounds1 },
    { view: views[1], bounds: bounds2 }
  ];
}

function updateTriLayout() {
  checkInitialized();

  let viewWidth = 0;
  let viewHeight = 0;
  let bounds = parent.getBounds();
  let contentBounds = parent.getContentBounds();
  let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu
  let offsetX = 0;

  if (contentBounds.width / contentBounds.height < aspect_ratio) {
    let newHeight = contentBounds.width / aspect_ratio;
    const barHeight = Math.floor((contentBounds.height - newHeight) / 2);
    offsetY += barHeight;
    viewWidth = Math.floor(contentBounds.width / 2);
    viewHeight = Math.floor(newHeight / 2);
  } else {
    let newWidth = contentBounds.height * aspect_ratio;
    const barWidth = Math.floor((contentBounds.width - newWidth) / 2);
    offsetX += barWidth;
    viewWidth = Math.floor(newWidth / 2);
    viewHeight = Math.floor(contentBounds.height / 2);
  }

  let bounds1 = { x: offsetX, y: offsetY, width: viewWidth, height: viewHeight };
  let bounds2 = { x: offsetX + viewWidth, y: offsetY, width: viewWidth, height: viewHeight };
  let bounds3 = { x: offsetX, y: offsetY + viewHeight, width: Math.floor(contentBounds.width), height: Math.floor(contentBounds.height / 2) };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);
  views[2].setBounds(bounds3);

  // preserving view bounds for later reference
  viewBounds = [
    { view: views[0], bounds: bounds1 },
    { view: views[1], bounds: bounds2 },
    { view: views[2], bounds: bounds3 }
  ];
}

function updateSixHorizontalLayout() {
  checkInitialized();

  let cols = 3;
  let rows = 2;
  let ratio = aspect_ratio * cols / rows;
  let viewWidth = 0;
  let viewHeight = 0;
  let bounds = parent.getBounds();
  let contentBounds = parent.getContentBounds();
  let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu
  let offsetX = 0;

  if (contentBounds.width / contentBounds.height < ratio) {
    let newHeight = contentBounds.width / ratio;
    const barHeight = Math.floor((contentBounds.height - newHeight) / 2);
    offsetY += barHeight;
    viewWidth = Math.floor(contentBounds.width / cols);
    viewHeight = Math.floor(newHeight / rows);
  } else {
    let newWidth = contentBounds.height * ratio;
    const barWidth = Math.floor((contentBounds.width - newWidth) / 2);
    offsetX += barWidth;
    viewWidth = Math.floor(newWidth / cols);
    viewHeight = Math.floor(contentBounds.height / rows);
  }

  let bounds1 = { x: offsetX, y: offsetY, width: viewWidth, height: viewHeight };
  let bounds2 = { x: offsetX + viewWidth, y: offsetY, width: viewWidth, height: viewHeight };
  let bounds3 = { x: offsetX + viewWidth * 2, y: offsetY, width: viewWidth, height: viewHeight };
  let bounds4 = { x: offsetX, y: offsetY + viewHeight, width: viewWidth, height: viewHeight };
  let bounds5 = { x: offsetX + viewWidth, y: offsetY + viewHeight, width: viewWidth, height: viewHeight };
  let bounds6 = { x: offsetX + viewWidth * 2, y: offsetY + viewHeight, width: viewWidth, height: viewHeight };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);
  views[2].setBounds(bounds3);
  views[3].setBounds(bounds4);
  views[4].setBounds(bounds5);
  views[5].setBounds(bounds6);

  // preserving view bounds for later reference
  viewBounds = [
    { view: views[0], bounds: bounds1 },
    { view: views[1], bounds: bounds2 },
    { view: views[2], bounds: bounds3 },
    { view: views[3], bounds: bounds4 },
    { view: views[4], bounds: bounds5 },
    { view: views[5], bounds: bounds6 }
  ];
}

function updateSixVerticalLayout() {
  checkInitialized();

  let cols = 2;
  let rows = 3;
  let ratio = aspect_ratio * cols / rows;
  let viewWidth = 0;
  let viewHeight = 0;
  let bounds = parent.getBounds();
  let contentBounds = parent.getContentBounds();
  let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu
  let offsetX = 0;

  if (contentBounds.width / contentBounds.height < ratio) {
    let newHeight = contentBounds.width / ratio;
    const barHeight = Math.floor((contentBounds.height - newHeight) / 2);
    offsetY += barHeight;
    viewWidth = Math.floor(contentBounds.width / cols);
    viewHeight = Math.floor(newHeight / rows);
  } else {
    let newWidth = contentBounds.height * ratio;
    const barWidth = Math.floor((contentBounds.width - newWidth) / 2);
    offsetX += barWidth;
    viewWidth = Math.floor(newWidth / cols);
    viewHeight = Math.floor(contentBounds.height / rows);
  }

  let bounds1 = { x: offsetX, y: offsetY, width: viewWidth, height: viewHeight };
  let bounds2 = { x: offsetX + viewWidth, y: offsetY, width: viewWidth, height: viewHeight };
  let bounds3 = { x: offsetX, y: offsetY + viewHeight, width: viewWidth, height: viewHeight };
  let bounds4 = { x: offsetX + viewWidth, y: offsetY + viewHeight, width: viewWidth, height: viewHeight };
  let bounds5 = { x: offsetX, y: offsetY + viewHeight * 2, width: viewWidth, height: viewHeight };
  let bounds6 = { x: offsetX + viewWidth, y: offsetY + viewHeight * 2, width: viewWidth, height: viewHeight };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);
  views[2].setBounds(bounds3);
  views[3].setBounds(bounds4);
  views[4].setBounds(bounds5);
  views[5].setBounds(bounds6);

  // preserving view bounds for later reference
  viewBounds = [
    { view: views[0], bounds: bounds1 },
    { view: views[1], bounds: bounds2 },
    { view: views[2], bounds: bounds3 },
    { view: views[3], bounds: bounds4 },
    { view: views[4], bounds: bounds5 },
    { view: views[5], bounds: bounds6 }
  ];
}

function updateQuadLayout() {
  checkInitialized();

  let viewWidth = 0;
  let viewHeight = 0;
  let bounds = parent.getBounds();
  let contentBounds = parent.getContentBounds();
  let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu
  let offsetX = 0;

  if (contentBounds.width / contentBounds.height < aspect_ratio) {
    let newHeight = contentBounds.width / aspect_ratio;
    const barHeight = Math.floor((contentBounds.height - newHeight) / 2);
    offsetY += barHeight;
    viewWidth = Math.floor(contentBounds.width / 2);
    viewHeight = Math.floor(newHeight / 2);
  } else {
    let newWidth = contentBounds.height * aspect_ratio;
    const barWidth = Math.floor((contentBounds.width - newWidth) / 2);
    offsetX += barWidth;
    viewWidth = Math.floor(newWidth / 2);
    viewHeight = Math.floor(contentBounds.height / 2);
  }

  let bounds1 = { x: offsetX, y: offsetY, width: viewWidth, height: viewHeight };
  let bounds2 = { x: offsetX + viewWidth, y: offsetY, width: viewWidth, height: viewHeight };
  let bounds3 = { x: offsetX, y: offsetY + viewHeight, width: viewWidth, height: viewHeight };
  let bounds4 = { x: offsetX + viewWidth, y: offsetY + viewHeight, width: viewWidth, height: viewHeight };

  views[0].setBounds(bounds1);
  views[1].setBounds(bounds2);
  views[2].setBounds(bounds3);
  views[3].setBounds(bounds4);

  // preserving view bounds for later reference
  viewBounds = [
    { view: views[0], bounds: bounds1 },
    { view: views[1], bounds: bounds2 },
    { view: views[2], bounds: bounds3 },
    { view: views[3], bounds: bounds4 }
  ];
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

  if (!parent.isVisible() || !view) {
    if (frame) frame.hide();
    return;
  }

  if (!frame) createFrame();

  let vb = viewBounds.find(vb => vb.view === view);
  let initialPos = isMac ? parent.getBounds() : parent.getContentBounds();

  let frameBounds = {
    x: initialPos.x + vb.bounds.x,
    y: initialPos.y + vb.bounds.y,
    width: vb.bounds.width,
    height: vb.bounds.height
  };

  frame.setBounds(frameBounds);
  frame.show();
}

function getViewByNumber(number) {
  checkInitialized();

  let view = views.find(v => v.number === number);
  return view;
}

function inView(x, y) {
  checkInitialized();

  if (!parent || !parent.isFocused() || !parent.isVisible()) return null;
  if (!viewBounds || viewBounds.length === 0) return null;

  if (!isMac) {
    let scaleFactor = electron.screen.getPrimaryDisplay().scaleFactor;
    x = Math.floor(x / scaleFactor);
    y = Math.floor(y / scaleFactor);
  }

  let initialPos = isMac ? parent.getBounds() : parent.getContentBounds();

  // console.log("------------------");
  // console.log(`click: x: ${x} y: ${y}`);
  // console.log(`winpos: x: ${winX} y: ${winY}`);

  let found = viewBounds.find(vb => {
    let viewLeft = initialPos.x + vb.bounds.x;
    let viewRight = viewLeft + vb.bounds.width;
    let viewTop = initialPos.y + vb.bounds.y;
    let viewBottom = viewTop + vb.bounds.height;

    let tolerance = 10;

    let matchX = x > viewLeft + tolerance && x < viewRight - tolerance;
    let matchY = y > viewTop + tolerance && y < viewBottom - tolerance;

    // let match = "";
    // if (matchX && matchY) {
    //     match = "(MATCH)";
    // }

    //console.log(`${match} ${vb.view.title} x: ${viewLeft}-${viewRight} y: ${viewTop}-${viewBottom}`)

    if (matchX && matchY) {
      return vb;
    }
  });

  if (!found) return null;

  return found.view;
}

function createUrlWindow(number) {
  view = views[number - 1];
  textBox = new BrowserWindow({
    frame: false,
    transparent: true,
    show: false,
    skipTaskbar: true,
    parent: parent,
    closable: true,
    focusable: true,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  textBox.loadFile('textBox.html');

  let vb = viewBounds.find(vb => vb.view === view);
  let initialPos = isMac ? parent.getBounds() : parent.getContentBounds();

  let frameBounds;
  if (!parent.screenTop && !parent.screenY) {
    if (number == 1) {
      frameBounds = {
        x: initialPos.x + vb.bounds.width / 2,
        y: initialPos.y + vb.bounds.height - 50,
        width: 300,
        height: 72
      };
    } else if (number == 2) {
      frameBounds = {
        x: initialPos.x + vb.bounds.width + vb.bounds.width / 2,
        y: initialPos.y + vb.bounds.height - 50,
        width: 272,
        height: 72
      };
    } else if (number == 3) {
      frameBounds = {
        x: initialPos.x + vb.bounds.width / 2,
        y: initialPos.y - 50 + vb.bounds.height * 2,
        width: 272,
        height: 72
      };
    } else if (number == 4) {
      frameBounds = {
        x: initialPos.x + vb.bounds.width + vb.bounds.width / 2,
        y: initialPos.y - 50 + vb.bounds.height * 2,
        width: 272,
        height: 72
      };
    }
  } else {
    if (number == 1) {
      frameBounds = {
        x: initialPos.x + vb.bounds.width / 2,
        y: initialPos.y + vb.bounds.height - 20,
        width: 272,
        height: 72
      };
    } else if (number == 2) {
      frameBounds = {
        x: initialPos.x + vb.bounds.width + vb.bounds.width / 2,
        y: initialPos.y + vb.bounds.height - 20,
        width: 272,
        height: 72
      };
    } else if (number == 3) {
      frameBounds = {
        x: initialPos.x + vb.bounds.width / 2,
        y: initialPos.y - 20 + vb.bounds.height * 2,
        width: 272,
        height: 72
      };
    } else if (number == 4) {
      frameBounds = {
        x: initialPos.x + vb.bounds.width + vb.bounds.width / 2,
        y: initialPos.y - 20 + vb.bounds.height * 2,
        width: 272,
        height: 72
      };
    }
  }

  textBox.setBounds(frameBounds);
  textBox.once('ready-to-show', () => {
    textBox.show();
  });

  textBox.on('close', () => {
    textBox = null;
  });

  ipcMain.once('load-url', (event, arg) => {
    activeViews[number - 1].webContents.loadURL(arg);
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

  frame.loadFile('frame.html');
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
  if (!parent.isDestroyed()) {
    parent.setBrowserView(null);
  }
  views.forEach(v => {
    v.destroy();
  });
  views = [];
  viewBounds = [];
  parent = null;
  isInitialized = false;
  audibleView = null;
  if (frame && !frame.isDestroyed()) {
    frame.close();
  }
  frame = null;
}

function zoomIn(number) {
  let zoom = activeViews[number].webContents.getZoomFactor();
  if (zoom < 5) {
    activeViews[number].webContents.setZoomFactor(zoom + 1);
  }
}

function zoomOut(number) {
  let zoom = activeViews[number].webContents.getZoomFactor();
  if (zoom >= 1) {
    activeViews[number].webContents.setZoomFactor(zoom - 1);
  }
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
  setQuadLayout: setQuadLayout,
  setTriLayout: setTriLayout,
  setDualLayout: setDualLayout,
  setSingleLayout: setSingleLayout,
  exitSingleLayout: exitSingleLayout,
  isSingleLayout: isSingleLayout,
  isDualLayout: isDualLayout,
  isTriLayout: isTriLayout,
  isQuadLayout: isQuadLayout,
  isSixHorizontalLayout: isSixHorizontalLayout,
  isSixVerticalLayout: isSixVerticalLayout,
  loadURL: loadURL,
  updateLayout: updateLayout,
  maximizeViews: maximizeViews,
  minimizeViews: minimizeViews,
  unload: unload,
  menuOnClick: appendSwapMenu,
  zoomIn: zoomIn,
  zoomOut: zoomOut,
  createUrlWindow: createUrlWindow
});
