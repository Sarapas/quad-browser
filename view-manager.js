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
let QUADH = 'QuadH';
let FIVEH = 'FiveH'
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
  let swapTo = viewNumbers.filter(n => n !== number).sort();

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
  browserView.webContents.on('new-window', (e, url) => {
    e.preventDefault()
    browserView.webContents.loadURL(url);
  });
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

function setFiveHorizontalLayout(force) {
  checkInitialized();

  if (layout != FIVEH || force) {
    previousLayout = layout;
    layout = FIVEH;
    activeViews = views.slice(0, 5);
    parent.setBrowserView(null); // clearing browserviews
    activeViews.forEach(view => {
      parent.addBrowserView(view);
    });

    updateFiveHorizontalLayout();

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

function setQuadHorizontalLayout(force) {
  checkInitialized();

  if (layout != QUADH || force) {
    previousLayout = layout;
    layout = QUADH;
    activeViews = views.slice(0, 4);
    parent.setBrowserView(null); // clearing browserviews
    activeViews.forEach(view => {
      parent.addBrowserView(view);
    });

    updateQuadHorizontalLayout();

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
  if (previousLayout === SIXH) setSixHorizontalLayout(true);
  if (previousLayout === SIXV) setSixVerticalLayout(true);
  if (previousLayout === FIVEH) setFiveHorizontalLayout(true);
  if (previousLayout === QUAD) setQuadLayout(true);
  if (previousLayout === QUADH) setQuadHorizontalLayout(true);
  if (previousLayout === TRI) setTriLayout(true);
  if (previousLayout === DUAL) setDualLayout(true);
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

function isQuadHorizontalLayout() {
  checkInitialized();
  return layout === QUADH;
}

function isFiveHorizontalLayout() {
  checkInitialized();
  return layout === FIVEH;
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
  } else if (layout === QUADH) {
    updateQuadHorizontalLayout();
  } else if (layout === FIVEH) {
    updateFiveHorizontalLayout();
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

  let bounds = parent.getBounds();
  let contentBounds = parent.getContentBounds();
  let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu
  let offsetX = 0;

  let topViewWidth = Math.floor(contentBounds.width / 2);
  let topViewHeight = Math.floor(topViewWidth / aspect_ratio);

  let bottomViewWidth = contentBounds.width;
  let bottomViewHeight = contentBounds.height - topViewHeight;

  let bounds1 = { x: offsetX, y: offsetY, width: topViewWidth, height: topViewHeight };
  let bounds2 = { x: topViewWidth, y: offsetY, width: topViewWidth, height: topViewHeight };
  let bounds3 = { x: offsetX, y: offsetY + topViewHeight, width: bottomViewWidth, height: bottomViewHeight };

  viewBounds = [
    { view: views[0], bounds: bounds1 },
    { view: views[1], bounds: bounds2 },
    { view: views[2], bounds: bounds3 }
  ];

  viewBounds.forEach(vb => {
    vb.view.setBounds(vb.bounds);
  });
}

function updateQuadLayout() {
  checkInitialized();

  let size = calculateViewSize(2, 2);

  let bounds1 = { x: size.x, y: size.y, width: size.width, height: size.height };
  let bounds2 = { x: size.x + size.width, y: size.y, width: size.width, height: size.height };
  let bounds3 = { x: size.x, y: size.y + size.height, width: size.width, height: size.height };
  let bounds4 = { x: size.x + size.width, y: size.y + size.height, width: size.width, height: size.height };

  viewBounds = [
    { view: views[0], bounds: bounds1 },
    { view: views[1], bounds: bounds2 },
    { view: views[2], bounds: bounds3 },
    { view: views[3], bounds: bounds4 }
  ];

  viewBounds.forEach(vb => {
    vb.view.setBounds(vb.bounds);
  });
}

function updateQuadHorizontalLayout() {
  checkInitialized();

  let bounds = parent.getBounds();
  let contentBounds = parent.getContentBounds();
  let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu
  let offsetX = 0;

  let topViewWidth = Math.floor(contentBounds.width / 3);
  let topViewHeight = Math.floor(topViewWidth / aspect_ratio);

  let bottomViewWidth = contentBounds.width;
  let bottomViewHeight = contentBounds.height - topViewHeight;

  let bounds1 = { x: offsetX, y: offsetY, width: topViewWidth, height: topViewHeight };
  let bounds2 = { x: topViewWidth, y: offsetY, width: topViewWidth, height: topViewHeight };
  let bounds3 = { x: topViewWidth * 2, y: offsetY, width: topViewWidth, height: topViewHeight };
  let bounds4 = { x: offsetX, y: offsetY + topViewHeight, width: bottomViewWidth, height: bottomViewHeight };

  viewBounds = [
    { view: views[0], bounds: bounds1 },
    { view: views[1], bounds: bounds2 },
    { view: views[2], bounds: bounds3 },
    { view: views[3], bounds: bounds4 }
  ];

  viewBounds.forEach(vb => {
    vb.view.setBounds(vb.bounds);
  });
}

function updateFiveHorizontalLayout() {
  checkInitialized();

  let bounds = parent.getBounds();
  let contentBounds = parent.getContentBounds();
  let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu
  let offsetX = 0;

  let topViewWidth = Math.floor(contentBounds.width / 3);
  let topViewHeight = Math.floor(topViewWidth / aspect_ratio);

  let bottomViewWidth = Math.floor(contentBounds.width / 2);
  let bottomViewHeight = Math.floor(bottomViewWidth / aspect_ratio);

  offsetY = offsetY + Math.floor((contentBounds.height - topViewHeight - bottomViewHeight) / 2);

  let bounds1 = { x: offsetX, y: offsetY, width: topViewWidth, height: topViewHeight };
  let bounds2 = { x: topViewWidth, y: offsetY, width: topViewWidth, height: topViewHeight };
  let bounds3 = { x: topViewWidth * 2, y: offsetY, width: topViewWidth, height: topViewHeight };
  let bounds4 = { x: offsetX, y: offsetY + topViewHeight, width: bottomViewWidth, height: bottomViewHeight };
  let bounds5 = { x: offsetX + bottomViewWidth, y: offsetY + topViewHeight, width: bottomViewWidth, height: bottomViewHeight };

  viewBounds = [
    { view: views[0], bounds: bounds1 },
    { view: views[1], bounds: bounds2 },
    { view: views[2], bounds: bounds3 },
    { view: views[3], bounds: bounds4 },
    { view: views[4], bounds: bounds5 }
  ];

  viewBounds.forEach(vb => {
    vb.view.setBounds(vb.bounds);
  });
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

  viewBounds = [
    { view: views[0], bounds: bounds1 },
    { view: views[1], bounds: bounds2 },
    { view: views[2], bounds: bounds3 },
    { view: views[3], bounds: bounds4 },
    { view: views[4], bounds: bounds5 },
    { view: views[5], bounds: bounds6 }
  ];

  viewBounds.forEach(vb => {
    vb.view.setBounds(vb.bounds);
  });
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

  viewBounds = [
    { view: views[0], bounds: bounds1 },
    { view: views[1], bounds: bounds2 },
    { view: views[2], bounds: bounds3 },
    { view: views[3], bounds: bounds4 },
    { view: views[4], bounds: bounds5 },
    { view: views[5], bounds: bounds6 }
  ];

  viewBounds.forEach(vb => {
    vb.view.setBounds(vb.bounds);
  });
}

function calculateViewSize(rows, cols) {
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

  return { x: offsetX, y: offsetY, width: viewWidth, height: viewHeight };
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

  let view = getViewByNumber(number);
  let vb = viewBounds.find(vb => vb.view === view);

  let initialPos = isMac ? parent.getBounds() : parent.getContentBounds();

  let width = 272;
  let height = 72;

  let frameBounds = {
    x: initialPos.x + vb.bounds.x + Math.floor((vb.bounds.width - width) / 2),
    y: initialPos.y + vb.bounds.y + Math.floor((vb.bounds.height - height) / 2),
    width: width,
    height: height
  };

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
  setFiveHorizontalLayout: setFiveHorizontalLayout,
  setQuadLayout: setQuadLayout,
  setQuadHorizontalLayout: setQuadHorizontalLayout,
  setTriLayout: setTriLayout,
  setDualLayout: setDualLayout,
  setSingleLayout: setSingleLayout,
  exitSingleLayout: exitSingleLayout,
  isSingleLayout: isSingleLayout,
  isDualLayout: isDualLayout,
  isTriLayout: isTriLayout,
  isQuadLayout: isQuadLayout,
  isQuadHorizontalLayout: isQuadHorizontalLayout,
  isFiveHorizontalLayout: isFiveHorizontalLayout,
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
