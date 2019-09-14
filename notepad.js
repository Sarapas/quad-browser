const electron = require('electron');
const { ipcMain, app } = electron;
const storage = require('electron-json-storage');

const NOTEPAD_STORAGE = "notepad";
let saveHandler;

let openOn;
let previousUrl;

function open(view) {
    openOn = view;
    previousUrl = view.webContents.getURL();

    storage.setDataPath(app.getPath('userData'));

    storage.get(NOTEPAD_STORAGE, function(error, data) {
        if (error) throw error;

        view.loadFile("dist/notepad.html");
        //view.webContents.openDevTools();

        ipcMain.on('notepad-loaded', function(event, result) {
            view.webContents.send('get-notepad', data.text);
        });

        view.show();
    });

    ipcMain.on('close-notepad', () => {
        close();
    });

    if (ipcMain.listenerCount('save-notepad') === 0) {
        ipcMain.on('save-notepad', (event, notepad) => {
            if (saveHandler) {
                clearTimeout(saveHandler);
            }

            saveHandler = setTimeout(() => {
                storage.set(NOTEPAD_STORAGE, { text: notepad}, function(error) {
                    if (error) throw error;
                    saveHandler = null;
                    console.log('saved');
                });
            }, 1000);
        });
    }
}

function isOpen() {
    return !!openOn;
}

function isOpenOn(view) {
    return openOn === view;
}

function close() {
    openOn.loadURL(previousUrl);
    setTimeout(() => {
        openOn = null;
        previousUrl = null;
    }, 1000);
}

var exports = module.exports = {
    open: open,
    isOpen: isOpen,
    isOpenOn: isOpenOn
};