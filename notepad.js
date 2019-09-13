const electron = require('electron');
const { ipcMain } = electron;
const storage = require('electron-json-storage');

const NOTEPAD_STORAGE = "notepad";

function open(view) {

    storage.get(NOTEPAD_STORAGE, function(error, data) {
        if (error) throw error;

        view.loadFile("dist/notepad.html");
        //view.webContents.openDevTools();

        ipcMain.on('notepad-loaded', function(event, result) {
            view.webContents.send('get-notepad', data.text);
        });

        view.show();
    });

    if (ipcMain.listenerCount('save-notepad') === 0) {
        ipcMain.on('save-notepad', (event, notepad) => {
            storage.set(NOTEPAD_STORAGE, { text: notepad}, function(error) {
                if (error) throw error;
            });
        });
    }

    // TODO: deal with trying to open multiple notepads
    // TODO: debounce on save
}

var exports = module.exports = {
    open: open
};