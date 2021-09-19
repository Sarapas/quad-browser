const electron = require('electron');
const { BrowserWindow, ipcMain } = electron;
const Store = require('electron-store');
const store = new Store();

let frameOptionsWin;
let frame;

function getFrame(parent) {
    if (frame)
        return frame;

    frame = new BrowserWindow({
        frame: false,
        transparent: true,
        show: false,
        skipTaskbar: true,
        parent: parent,
        closable: false,
        focusable: false,
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true
        },
        resizable: false,
        hasShadow: false,
        titleBarStyle: 'customButtonsOnHover', // together with frame: false makes corners not round on macos. It is a bug that we use as a feature
        thickFrame: false
    });

    frame.loadFile('dist/frame.html');
    frame.setIgnoreMouseEvents(true);
    //frame.webContents.openDevTools();

    ipcMain.on('frame-loaded', () => {
        frame.webContents.send('set-frame-options', getOptions());
    });

    return frame;
}

function closeFrame() {
    if (frame && !frame.isDestroyed()) {
        frame.close();
        frame.destroy();
    }
    frame = null;
}

function openOptions(parent, onClose) {
    frameOptionsWin = new BrowserWindow({
        frame: false,
        transparent: false,
        show: false,
        skipTaskbar: true,
        parent: parent,
        closable: true,
        modal: true,
        focusable: true,
        fullscreenable: false,
        height: 500,
        width: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    frameOptionsWin.loadFile(`dist/frame-options.html`);

    frameOptionsWin.once('ready-to-show', () => {
        frameOptionsWin.show();
        //frameOptionsWin.webContents.openDevTools();
    });

    frameOptionsWin.on('closed', () => {
        frameOptionsWin = null;
        onClose();
    })

    ipcMain.on('frame-options-loaded', () => {
        frameOptionsWin.webContents.send('send-frame-options', getOptions());
    });

    ipcMain.on('receive-frame-options', (event, options) => {
        if (options) {
            setOptions(options);
            frame.webContents.send('set-frame-options', options);
        }
    });
}

function getOptions() {
    let thickness = store.get('frame-thickness') || 7;
    let color = store.get('frame-color') || "#E84B3C";
    return { color: color, thickness: thickness };
}

function setOptions(options) {
    store.set('frame-thickness', options.thickness);
    store.set('frame-color', options.color);
}

function setFrameDashed() {
    frame.webContents.send('set-frame-style', "dashed");
}

function setFrameSolid() {
    frame.webContents.send('set-frame-style', "solid");
}

var exports = (module.exports = {
    getFrame: getFrame,
    setFrameDashed: setFrameDashed,
    setFrameSolid: setFrameSolid,
    closeFrame: closeFrame,
    openOptions: openOptions
});