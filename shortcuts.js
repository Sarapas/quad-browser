const electron = require('electron');
const { ipcMain, app, BrowserWindow } = electron;
const storage = require('electron-json-storage');

const SHORTCUT_STORAGE = "notepad";

let shortcutsWin;

function open(parent, onClose) {
    storage.setDataPath(app.getPath('userData'));

    shortcutsWin = new BrowserWindow({
        frame: false,
        transparent: false,
        show: false,
        skipTaskbar: true,
        parent: parent,
        closable: true,
        modal: true,
        focusable: true,
        fullscreenable: false,
        height: 600,
        width: 600,
        webPreferences: {
          nodeIntegration: true
        }
      });

      ipcMain.on('shortcuts-loaded', function() {
          storage.get(SHORTCUT_STORAGE, function(error, data) {
              if (error) throw error;
              shortcutsWin.webContents.send('set-shortcuts', data.shortcuts || getDefaults());
          });
      });

      shortcutsWin.once('ready-to-show', () => {
        shortcutsWin.show();
        //shortcutsWin.webContents.openDevTools();
      });
    
      shortcutsWin.loadFile(`dist/shortcuts.html`);

      shortcutsWin.once('closed', () => {
        shortcutsWin = null;
        onClose();
      })
    
      ipcMain.once('save-shortcuts', (event, shortcuts) => {
        if (shortcuts) {
            storage.set(SHORTCUT_STORAGE, { shortcuts: shortcuts}, function(error) {
                if (error) throw error;
            });
        }
      });
}

function getDefaults() {
  return [
    { title: 'Save bookmark', hotkey: 'B' },
    { title: 'Change layout', hotkey: 'L' },
    { title: 'Hover mode', hotkey: 'H' },
    { title: 'Fullscreen players', hotkey: 'Q' },
    { title: 'Mute', hotkey: 'M' },
    { title: 'Change address', hotkey: 'D' },
    { title: 'Find', hotkey: 'F' },
    { title: 'Refresh', hotkey: 'R' },
    { title: 'Open Notepad', hotkey: 'N' }
];
}

function getHotkey() {
  // TODO: get
  let shortcuts = getDefaults();
  let shortcut = shortcuts.find(s => s.title === shortcutTitle);
  if (!shortcut) throw new Error(`Shortcut ${shortcutTitle} not configured`);
  return `CommandOrControl+${shortcut.hotkey}`;
}

var exports = (module.exports = {
    open: open,
    SAVE_BOOKMARK: () => getHotkey('Save bookmark'),
    CHANGE_LAYOUT: () => getHotkey('Change layout'),
    HOVER_MODE: () => getHotkey('Hover mode'),
    FULLSCREEN_PLAYERS: () => getHotkey('Fullscreen players'),
    MUTE: () => getHotkey('Mute'),
    CHANGE_ADDRESS: () => getHotkey('Change address'),
    FIND: () => getHotkey('Find'),
    REFRESH: () => getHotkey('Refresh'),
    OPEN_NOTEPAD: () => getHotkey('Open Notepad')
});