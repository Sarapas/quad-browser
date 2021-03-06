const electron = require('electron');
const { ipcMain, app } = electron;
const storage = require('electron-json-storage');
const viewManager = require('./view-manager');
const viewFactory = require('./view-factory');

const NOTEPAD_STORAGE = "notepad";
let saveHandler;

let openOn;
let notepadView;

function open(view) {
    storage.setDataPath(app.getPath('userData'));

    let parent = view.getParentWindow();
    if (!notepadView) {
        notepadView = createNotepad(parent);
    }

    openOn = view;
    viewManager.substituteView(view, notepadView);
}

function isOpen() {
    return !!openOn;
}

function isOpenOn(view) {
    return !!view.isNotepad;
}

function close() {
    viewManager.substituteView(notepadView, openOn);
    openOn = null;
}

function createNotepad(parent) {
    let notepad = viewFactory.create(parent, 0, true);
    notepad.isNotepad = true; // custom property

    storage.get(NOTEPAD_STORAGE, function(error, data) {
        if (error) throw error;

        ipcMain.on('notepad-loaded', function(event, result) {
            notepad.webContents.send('get-notepad', data.text);
        });
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
                });
            }, 1000);
        });
    }

    notepad.webContents.loadFile("dist/notepad.html");
    return notepad;
}

var exports = module.exports = {
    open: open,
    isOpen: isOpen,
    isOpenOn: isOpenOn
};