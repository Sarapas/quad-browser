const electron = require('electron');
const { ipcMain, app, BrowserWindow } = electron;
const storage = require('electron-json-storage');

const SHORTCUT_STORAGE = "shortcuts";

let shortcutsWin;
let onChange;
let onObsolete;

function init(changeCallback, obsoleteCallback) {
	storage.setDataPath(app.getPath('userData'));
	onChange = changeCallback;
	onObsolete = obsoleteCallback;
	load((shortcuts, defaults) => {
		set(shortcuts);
	});
}

function open(parent, onClose) {
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
		height: 670,
		width: 600,
		webPreferences: {
			nodeIntegration: true
		}
	});

	ipcMain.on('shortcuts-loaded', function () {
		load((shortcuts, defaults) => {
			shortcutsWin.webContents.send('set-shortcuts', { shortcuts: shortcuts, defaults: defaults });
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
			storage.set(SHORTCUT_STORAGE, { shortcuts: shortcuts }, function (error) {
				if (error) throw error;
				set(shortcuts);
			});
		}
	});
}

function load(onLoad) {
	storage.get(SHORTCUT_STORAGE, function (error, data) {
		if (error) throw error;
		let defaults = getDefaults();
		let shortcuts = data.shortcuts || defaults;

		// after adding new shortcuts in code - we need to update saved shortcuts
		defaults.forEach(d => {
			let exists = shortcuts.find(s => s.title === d.title);
			if (!exists) {
				shortcuts.push(d);
			}
		});

		if (onLoad) {
			onLoad(shortcuts, defaults);
		}
	});
}

function getDefaults() {
	return [
		{ title: 'Save bookmark', hotkey: 'B' },
		{ title: 'Change layout', hotkey: 'L' },
		{ title: 'Hover mode', hotkey: 'H' },
		{ title: 'Fullscreen players', hotkey: 'E' },
		{ title: 'Mute', hotkey: 'M' },
		{ title: 'Change address', hotkey: 'D' },
		{ title: 'Find', hotkey: 'F' },
		{ title: 'Refresh', hotkey: 'R' },
		{ title: 'Open Notepad', hotkey: 'N' },
		{ title: 'Watch Mode', hotkey: 'W' }
	];
}

function set(shortcuts) {
	const updateHotkey = (property, hotkeyName) => {
		let oldHotkey = exports[property];
		let shortcut = shortcuts.find(s => s.title === hotkeyName);
		if (!shortcut) throw new Error(`Shortcut ${title} not configured`);
		let newHotkey = `CommandOrControl+${shortcut.hotkey}`;
		exports[property] = newHotkey;
		if (oldHotkey && oldHotkey !== newHotkey) onObsolete({ oldHotkey: oldHotkey, newHotkey: newHotkey });
	}

	updateHotkey('SAVE_BOOKMARK', 'Save bookmark');
	updateHotkey('CHANGE_LAYOUT', 'Change layout');
	updateHotkey('HOVER_MODE', 'Hover mode');
	updateHotkey('FULLSCREEN_PLAYERS', 'Fullscreen players');
	updateHotkey('MUTE', 'Mute');
	updateHotkey('CHANGE_ADDRESS', 'Change address');
	updateHotkey('FIND', 'Find');
	updateHotkey('REFRESH', 'Refresh');
	updateHotkey('OPEN_NOTEPAD', 'Open Notepad');
	updateHotkey('WATCH_MODE', 'Watch Mode');

	if (onChange) {
		onChange();
	}
}


var exports = (module.exports = {
	init: init,
	open: open,
	SAVE_BOOKMARK: null,
	CHANGE_LAYOUT: null,
	HOVER_MODE: null,
	FULLSCREEN_PLAYERS: null,
	MUTE: null,
	CHANGE_ADDRESS: null,
	FIND: null,
	REFRESH: null,
	OPEN_NOTEPAD: null,
	WATCH_MODE: null
});