const electron = require('electron');
const { BrowserWindow, BrowserView } = electron;
const util = require('electron-util');

function create(parent, number, enableNodeIntegration) {
    if (util.is.windows) {
        return createBrowserView(parent, number, enableNodeIntegration);
    }
    else if (util.is.macos) {
        return createBrowserWindow(parent, number, enableNodeIntegration);
    }
}

function createBrowserWindow(parent, number, nodeIntegration) {
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
        titleBarStyle: 'customButtonsOnHover', // together with frame: false makes corners not round on macos. It is a bug that we use as a feature
        thickFrame: false,
        webPreferences: {
            nodeIntegration: !!nodeIntegration
        }
    });

    view.focusable = true; // adding custom property for macOs usage
    view.number = number;

    return view;
}

function createBrowserView(parent, number, nodeIntegration) {
    let view = new BrowserView({
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
        titleBarStyle: 'customButtonsOnHover', // together with frame: false makes corners not round on macos. It is a bug that we use as a feature
        thickFrame: false,
        webPreferences: {
            nodeIntegration: !!nodeIntegration
        }
    });

    view.focusable = true; // adding custom property for macOs usage
    view.number = number;

    view.show = function() {
        let currentViews = parent.getBrowserViews();
        if (!currentViews.includes(view)) {
            parent.addBrowserView(view);
        }
    }

    view.hide = function() {
        let currentViews = parent.getBrowserViews();
        if (currentViews.includes(view)) {
            parent.removeBrowserView(view);
        }
    }

    // this can be removed when upgraded to electron 7 because it has getBounds
    {
        view.originalSetBounds = view.setBounds;

        view.setBounds = function (bounds) {
            view.originalSetBounds(bounds);
            view.viewBounds = bounds;
        }
    
        view.getBounds = function() {
            let parentBounds = parent.getContentBounds();
            return {
                x: parentBounds.x + view.viewBounds.x,
                y: parentBounds.y + view.viewBounds.y,
                width: view.viewBounds.width,
                height: view.viewBounds.height
            }
        }
    }

    view.isVisible = function() {
        let currentViews = parent.getBrowserViews();
        return currentViews.includes(view);
    }

    view.getParentWindow = function() {
        return parent;
    }

    return view;
}

var exports = module.exports = {
    create: create
};