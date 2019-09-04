const electron = require('electron')
const { BrowserWindow, BrowserView } = electron;
const path = require('path');
const fs = require('fs');
const requestFullscreen = fs.readFileSync(path.resolve(__dirname, 'set-video-fullscreen.js'), 'utf8');
const exitFullscreen = fs.readFileSync(path.resolve(__dirname, 'exit-video-fullscreen.js'), 'utf8');

const isMac = process.platform === 'darwin';
let aspect_ratio = 16/9;

let SINGLE = "Single";
let QUAD = "Quad";
let DUAL = "Dual";

let views;
let activeViews;
let viewBounds;
let parent;
let isInitialized;
let audibleView;
let frame;
let layout;
let previousLayout;
let singleView;

function init(parentWindow) {
    if (isInitialized) throw new Error("Already initialized");
    parent = parentWindow;
    if (!frame) createFrame();

    views = [
        createBrowserView(1),
        createBrowserView(2),
        createBrowserView(3),
        createBrowserView(4)
    ];

    isInitialized = true;

    setQuadLayout(); // default layout
}

function createBrowserView(number, title) {
    let browserView = new BrowserView();
    browserView.number = number;
    browserView.webContents.setAudioMuted(true);
    // browserView.webContents.on('new-window', (e, url) => {
    //     e.preventDefault()
    //     let win = new BrowserWindow({width: 400, height: 400})
    //     win.loadURL(url);
    // });
    return browserView;
}

function loadURL(url, view) {
    checkInitialized();

    if (view) {
        view.webContents.loadURL(url);
    } else {
        activeViews.forEach((view) => {
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

function setQuadLayout() {
    checkInitialized();

    if (layout != QUAD) {
        previousLayout = layout;
        layout = QUAD;
        activeViews = views;

        parent.setBrowserView(null); // clearing browserviews
        activeViews.forEach((view) => {
            parent.addBrowserView(view);
        });

        updateQuadLayout();

        if (audibleView) {
            setAudible(audibleView);
        }
    }
}

function setDualLayout() {
    checkInitialized();

    if (layout != DUAL) {
        previousLayout = layout;
        layout = DUAL;
        activeViews = [ views[0], views[1] ];
        
        parent.setBrowserView(null); // clear browser views
        activeViews.forEach((view) => {
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

function setSingleLayout(view) {
    checkInitialized();

    if (layout != SINGLE || singleView != view) {
        previousLayout = layout;
        layout = SINGLE;
        singleView = view;
        activeViews = [ view ];
        parent.setBrowserView(singleView);
        updateSingleLayout();
        setAudible(singleView);
    }
}

function exitSingleLayout() {
    checkInitialized();

    if (layout != SINGLE || !singleView)
        return;

    singleView = null;

    if (previousLayout === QUAD)
        setQuadLayout();

    if (previousLayout === DUAL)
        setDualLayout();
}

function isSingleLayout() {
    checkInitialized();

    return layout === SINGLE;
}

function isDualLayout() {
    checkInitialized();

    return layout === DUAL;
}

function isQuadLayout() {
    checkInitialized();

    return layout === QUAD;
}

function updateLayout() {
    if (layout === SINGLE) {
        updateSingleLayout();
    } else if (layout === QUAD) {
        updateQuadLayout();
    } else if (layout === DUAL) {
        updateDualLayout();
    } else {
        throw new Error("Unknown layout");
    }

    if (audibleView) {
        setSelected(audibleView); // updating size and location of the frame
    }
}

function updateSingleLayout() {
    let bounds = parent.getBounds();
    let contentBounds = parent.getContentBounds();
    let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu

    let vBounds = { x: 0, y: offsetY, width: contentBounds.width, height: contentBounds.height };

    viewBounds = [ 
        { view: singleView, bounds: vBounds},
    ];

    singleView.setBounds(vBounds);
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
        { view: views[0], bounds: bounds1},
        { view: views[1], bounds: bounds2}
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
        { view: views[0], bounds: bounds1},
        { view: views[1], bounds: bounds2},
        { view: views[2], bounds: bounds3},
        { view: views[3], bounds: bounds4},
    ];
};

function checkInitialized() {
    if (!isInitialized) throw new Error("Init needs to be called first");
}

function getAudible() {
    checkInitialized();

    return audibleView;
}

function setAudible(view) {
    checkInitialized();

    if (!view || !activeViews.includes(view))
        return;

    if (audibleView !== view || (audibleView && audibleView.webContents.isAudioMuted())) {
        views.forEach((v) => {
            v.webContents.setAudioMuted(true);
        });
    
        audibleView = view;
        audibleView.webContents.setAudioMuted(false);
    }

    setSelected(view);
};

function setSelected(view) {
    checkInitialized();

    if (isSingleLayout() && frame) {
        frame.hide();
        return;
    }

    if (!parent.isVisible() || !view) {
        if (frame)
            frame.hide();
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

    let view = views.find((v) => v.number === number);
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

    let found = viewBounds.find((vb) => {
        let viewLeft = initialPos.x + vb.bounds.x;
        let viewRight = viewLeft + vb.bounds.width;
        let viewTop = initialPos.y + vb.bounds.y;
        let viewBottom = viewTop + vb.bounds.height;

        let tolerance = 10;

        let matchX = (x > viewLeft + tolerance && x < viewRight - tolerance);
        let matchY = (y > viewTop + tolerance && y < viewBottom - tolerance);

        // let match = "";
        // if (matchX && matchY) {
        //     match = "(MATCH)";
        // }

        //console.log(`${match} ${vb.view.title} x: ${viewLeft}-${viewRight} y: ${viewTop}-${viewBottom}`)

        if (matchX && matchY) {
            return vb;
        }
    });

    if (!found)
        return null;

    return found.view;
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

    frame.loadFile("frame.html");
    frame.setIgnoreMouseEvents(true);
}

function maximizeViews() {
    checkInitialized();

    activeViews.forEach((v) => {
        v.webContents.executeJavaScript(requestFullscreen, true).then((result) => {}).catch((error) => { console.log(`Fullscreen ${error}`); });
    });
}

function minimizeViews() {
    checkInitialized();

    activeViews.forEach((v) => {
        v.webContents.executeJavaScript(exitFullscreen, true).then((result) => {}).catch((error) => { console.log(`Exit Fullscreen ${error}`); });
    });
}

function unload() {
    if (!parent.isDestroyed()) {
        parent.setBrowserView(null);
    }
    views.forEach((v) => {
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

var exports = module.exports = {
    init: init,
    setAudible: setAudible,
    getAudible: getAudible,
    suspendAudible: suspendAudible,
    resumeAudible: resumeAudible,
    inView: inView,
    getViewByNumber: getViewByNumber,
    setQuadLayout: setQuadLayout,
    setDualLayout: setDualLayout,
    setSingleLayout: setSingleLayout,
    exitSingleLayout: exitSingleLayout,
    isSingleLayout: isSingleLayout,
    isDualLayout: isDualLayout,
    isQuadLayout: isQuadLayout,
    loadURL: loadURL,
    updateLayout: updateLayout,
    maximizeViews: maximizeViews,
    minimizeViews: minimizeViews,
    unload: unload
};