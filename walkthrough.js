const electron = require('electron');
const { BrowserWindow } = electron;
let walkthroughWin;

function show(parent, onClose) {
	walkthroughWin = new BrowserWindow({
		frame: true,
		transparent: false,
		show: false,
		skipTaskbar: true,
		parent: parent,
		closable: true,
		modal: true,
		focusable: true,
		fullscreenable: false,
		height: 620,
		width: 700,
		webPreferences: {
			nodeIntegration: true
		}
	});

	walkthroughWin.once('ready-to-show', () => {
		walkthroughWin.show();
		//shortcutsWin.webContents.openDevTools();
	});

	walkthroughWin.loadFile(`dist/walkthrough.html`);
}

var exports = (module.exports = {
    show: show
});