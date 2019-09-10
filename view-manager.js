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
let QUADV = 'QuadV';
let FIVEH = 'FiveH';
let FIVEV = 'FiveV';
let DUAL = 'Dual';
let TRI = 'Tri';
let SIXH = 'SixH';
let SIXV = 'SixV';

let views;
let activeViews;
let viewBounds;
let parent;
let isInitialized;
let audibleView;
let frame;
let addressChangeWnd;
let layoutPickerWnd;
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

  let swapMenu = new MenuItem({
    label: 'Swap with',
    submenu: []
  });

  swapTo.forEach(n => {
    swapMenu.submenu.append(new MenuItem({
      label: `${n}`,
      click: function() {
        swapBrowserView(number - 1, n - 1);
        updateLayout();
      }
    }));
  });
  
  ctxMenu.append(new MenuItem({ type: 'separator' }));
  ctxMenu.append(swapMenu);
}

function createBrowserView(number, title) {
  let browserView = new BrowserView();
  browserView.number = number;
  browserView.webContents.setAudioMuted(true);
  browserView.webContents.on('new-window', (e, url) => {
    e.preventDefault()
    browserView.webContents.loadURL(url);
  });
  browserView.webContents.on('page-title-updated', (e, favicons) => {
    // clearing old favicon
    browserView.webContents.favicons = null;
  });
  browserView.webContents.on('page-favicon-updated', (e, favicons) => {
    browserView.webContents.favicons = favicons;
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
    parent.setBrowserView(null); // clearing browserviews
    activeViews.forEach(view => {
      parent.addBrowserView(view);
    });

    updateFunc();

    if (audibleView) {
      if (!activeViews.includes(audibleView)) {
        setAudible(activeViews[0]);
      } else {
        setAudible(audibleView);
      }
    }
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

function updateSingleLayout() {
  let bounds = parent.getBounds();
  let contentBounds = parent.getContentBounds();
  let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu

  let vBounds = { x: 0, y: offsetY, width: contentBounds.width, height: contentBounds.height };
  let view = activeViews[0];
  viewBounds = [{ view: view, bounds: vBounds }];
  view.setBounds(vBounds);
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

function updateQuadVerticalLayout() {
  checkInitialized();

  let bounds = parent.getBounds();
  let contentBounds = parent.getContentBounds();
  let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu
  let offsetX = 0;

  let rightViewHeight = Math.floor(contentBounds.height / 3);
  let rightViewWidth = Math.floor(rightViewHeight * aspect_ratio);

  let leftViewWidth = contentBounds.width - rightViewWidth;
  let leftViewHeight = contentBounds.height;

  let bounds1 = { x: offsetX, y: offsetY, width: leftViewWidth, height: leftViewHeight };
  let bounds2 = { x: offsetX + leftViewWidth, y: offsetY, width: rightViewWidth, height: rightViewHeight };
  let bounds3 = { x: offsetX + leftViewWidth, y: offsetY + rightViewHeight, width: rightViewWidth, height: rightViewHeight };
  let bounds4 = { x: offsetX + leftViewWidth, y: offsetY + rightViewHeight * 2, width: rightViewWidth, height: rightViewHeight };

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

function updateFiveVerticalLayout() {
  checkInitialized();

  let bounds = parent.getBounds();
  let contentBounds = parent.getContentBounds();
  let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu
  let offsetX = 0;

  let rightViewHeight = Math.floor(contentBounds.height / 3);
  let rightViewWidth = Math.floor(rightViewHeight * aspect_ratio);

  let leftViewWidth = 0;
  let leftViewHeight = 0;
  let leftOffsetY = offsetY;

  if ((contentBounds.width - rightViewWidth) / (contentBounds.height / 2) < aspect_ratio) {
    leftViewWidth = contentBounds.width - rightViewWidth;
    leftViewHeight = Math.floor(leftViewWidth / aspect_ratio);
    leftOffsetY = leftOffsetY + Math.floor(contentBounds.height / 2) - leftViewHeight;
  } else {
    leftViewHeight = Math.floor(contentBounds.height / 2);
    leftViewWidth = Math.floor(leftViewHeight * aspect_ratio);
    offsetX = offsetX + Math.floor((contentBounds.width - leftViewWidth - rightViewWidth) / 2);
  }

  let bounds1 = { x: offsetX, y: leftOffsetY, width: leftViewWidth, height: leftViewHeight };
  let bounds2 = { x: offsetX, y: leftOffsetY + leftViewHeight, width: leftViewWidth, height: leftViewHeight };
  let bounds3 = { x: offsetX + leftViewWidth, y: offsetY, width: rightViewWidth, height: rightViewHeight };
  let bounds4 = { x: offsetX + leftViewWidth, y: offsetY + rightViewHeight, width: rightViewWidth, height: rightViewHeight };
  let bounds5 = { x: offsetX + leftViewWidth, y: offsetY + rightViewHeight * 2, width: rightViewWidth, height: rightViewHeight };

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

function createUrlWindow(number) {
  addressChangeWnd = new BrowserWindow({
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

  addressChangeWnd.loadFile('renderer/address-change.html');

  let initialPos = isMac ? parent.getBounds() : parent.getContentBounds();
  let width = 272;
  let height = 72;
  let x;
  let y;

  if (number) {
    let view = getViewByNumber(number);
    let vb = viewBounds.find(vb => vb.view === view);
    x = initialPos.x + vb.bounds.x + Math.floor((vb.bounds.width - width) / 2);
    y = initialPos.y + vb.bounds.y + Math.floor((vb.bounds.height - height) / 2);
  } else {
    x = initialPos.x + Math.floor((parent.getContentBounds().width - width) / 2);
    y = initialPos.y + Math.floor((parent.getContentBounds().height - height) / 2);
  }

  addressChangeWnd.setBounds({x: x, y: y, width: width, height: height });
  addressChangeWnd.once('ready-to-show', () => {
    addressChangeWnd.show();
  });

  addressChangeWnd.on('closed', () => {
    addressChangeWnd = null;
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
  zoomIn: zoomIn,
  zoomOut: zoomOut,
  createUrlWindow: createUrlWindow
});
