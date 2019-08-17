const electron = require('electron')
const { BrowserWindow, BrowserView } = electron;

const isMac = process.platform === 'darwin';
let aspect_ratio = 16/9;

let views;
let viewBounds;
let parent;
let isInitialized;
let audibleView;
let frame;
let layout;
let singleView;

function init(parentWindow, viewlayout) {
    if (isInitialized) throw new Error("Already initialized");
    layout = viewlayout;
    parent = parentWindow;
    if (!frame) createFrame();

    if (layout === "Quad") {
        views = [
            createBrowserView(1, "Top left"),
            createBrowserView(2, "Top right"),
            createBrowserView(3, "Bottom left"),
            createBrowserView(4, "Bottom right")
        ];
    } else if (layout === "Vertical") {
        views = [
            createBrowserView(1, "Top"),
            createBrowserView(2, "Bottom")
        ];
    } else if (layout === "Horizontal") {
        throw new Error("Not implemented");
    } else {
        throw new Error("Unknown layout");
    }

    views.forEach((view) => {
        parent.addBrowserView(view);
        view.webContents.setAudioMuted(true);
    });

    isInitialized = true;
}

function createBrowserView(number, title) {
    let browserView = new BrowserView();
    browserView.title = title;
    browserView.number = number;
    return browserView;
}

function loadURL(url, view) {
    checkInitialized();

    if (view) {
        view.webContents.loadURL(url);
    } else {
        views.forEach((view) => {
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

function updateSize() {
    if (singleView) {
        updateSingleView();
        return;
    }

    if (layout === "Quad") {
        updateQuadSize();
    } else if (layout === "Vertical") {
        updateVerticalSize();
    } else if (layout === "Horizontal") {
        throw new Error("Not implemented");
    } else {
        throw new Error("Unknown layout");
    }
}

function updateSingleView() {
    let bounds = parent.getBounds();
    let contentBounds = parent.getContentBounds();
    let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu

    let vBounds = { x: 0, y: offsetY, width: contentBounds.width, height: contentBounds.height };

    viewBounds = [ 
        { view: singleView, bounds: vBounds},
    ];

    singleView.setBounds(vBounds);
    setSelected(singleView);
}

function updateVerticalSize() {
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

    if (audibleView) {
        setSelected(audibleView); // update location and size
    }
}

function updateQuadSize() {
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

    if (audibleView) {
        setSelected(audibleView); // update location and size
    }
};

function toggleShowSingle() {
    if (singleView) {
        parent.removeBrowserView(singleView);
        singleView = null;
        views.forEach((view) => {
            parent.addBrowserView(view);
        });
        updateSize();
        return false;
    } else {
        if (!audibleView)
            return; // no view selected

        singleView = audibleView;
        parent.setBrowserView(singleView);
        updateSize();
        return true;
    }
}

function checkInitialized() {
    if (!isInitialized) throw new Error("Init needs to be called first");
}

function getAudible() {
    checkInitialized();

    return audibleView;
}

function setAudible(view) {
    checkInitialized();

    if (!view || singleView)
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

    if (singleView && frame) {
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

function getViews() {
    checkInitialized();

    if (singleView)
        return [ singleView ];

    return views;
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
    getViews: getViews,
    toggleShowSingle: toggleShowSingle,
    loadURL: loadURL,
    updateSize: updateSize,
    unload: unload
};