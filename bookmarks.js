const electron = require('electron');
const { BrowserWindow, ipcMain, app, MenuItem, nativeImage } = electron;
const utilities = require('./utilities');
const fs = require('fs');
const storage = require('electron-json-storage');
const viewManager = require('./view-manager');

let onChangeCallbacks = [];

const BOOKMARK_STORAGE = "bookmarks";
const ICON_DIR = `${app.getPath('userData')}/icons/`

let bookmarks = [];
let bookmarksWin;

function init(onChange) {
    storage.setDataPath(app.getPath('userData'));
    onChangeCallbacks.push(onChange);

    try {
        storage.get(BOOKMARK_STORAGE, function (error, data) {
            if (error) throw error;
            setBookmarks(data.bookmarks);
        });
    } catch (ex) {
        console.log("error while loading bookmarks: " + ex);
    }
}

function getMenu(view) {
    let menu = [];
    bookmarks.forEach((b) => {
        menu.push(new MenuItem({
            label: b.title,
            url: b.url, // custom property
            icon: b.iconData,
            click: () => {
                viewManager.loadURL(b.url, view);
            }
        }));
    })
    return menu;
}

function getBookmarks() {
    return bookmarks;
}

function getIcon(fileName) {
    let file;
    if (fileName) {
        file = `${ICON_DIR}${fileName}`;
    } else {
        file = "assets/default-bookmark-icon.png";
    }

    let icon = null;
    const size = 16;

    try {
        if (file.endsWith(".ico")) {
            // converting to png
            const source = fs.readFileSync(file);
            let png = utilities.icoToPng(source, size);
            icon = nativeImage.createFromBuffer(png);
        } else {
            icon = nativeImage.createFromPath(file);
            icon = icon.resize({ width: size, height: size });
        }
    } catch (ex) {
        console.log("error while reading icon: " + ex);
        return null;
    }

    return icon;
}

function add(contents) {
    try {
        storage.get(BOOKMARK_STORAGE, function (error, data) {
            if (error) throw error;

            data.bookmarks = data.bookmarks || [];
            let icon;

            function appendBookmarks() {
                data.bookmarks.push({ id: utilities.newGuid(), title: contents.getTitle(), url: contents.getURL(), icon: icon });
                save(data.bookmarks);
            }

            if (contents.favicons && contents.favicons.length) {

                let png = contents.favicons.find(f => f.endsWith("png"));
                let jpg = contents.favicons.find(f => f.endsWith("jpg"));
                let ico = contents.favicons.find(f => f.endsWith("ico"));

                let ext;
                if (png) {
                    src = png;
                    ext = ".png";
                } else if (jpg) {
                    src = jpg;
                    ext = ".jpg";
                } else if (ico) {
                    src = ico;
                    ext = ".ico";
                }

                icon = `${utilities.newGuid()}${ext}`;
                if (src) {
                    utilities.downloadFile(src, ICON_DIR, icon, () => {
                        appendBookmarks();
                    });
                } else {
                    appendBookmarks();
                }
            } else {
                appendBookmarks();
            }
        });
    } catch (ex) {
        console.log("error while adding bookmark: " + ex);
    }
}

function setBookmarks(bMarks) {
    bookmarks = bMarks || [];

    bookmarks.forEach(b => {
        b.iconData = getIcon(b.icon);
        if (b.iconData) {
            b.iconDataURL = b.iconData.toDataURL();
        }
    });

    onChangeCallbacks.forEach((cb) => {
        cb();
    });
}

function remove(bookmark) {
    if (!bookmark || !bookmark.id)
        return;

    try {
        storage.get(BOOKMARK_STORAGE, function (error, data) {
            if (error) throw error;

            data.bookmarks = data.bookmarks || [];
            data.bookmarks = data.bookmarks.filter(b => b.id !== bookmark.id);
            save(data.bookmarks);
        });
    } catch (ex) {
        console.log("error while removing bookmark: " + ex);
    }
}

function save(bookmarks) {
    storage.set(BOOKMARK_STORAGE, { bookmarks: bookmarks }, function (error) {
        if (error) throw error;
        setBookmarks(bookmarks);
    });
}

function open(parent, onClose) {
    bookmarksWin = new BrowserWindow({
        frame: false,
        transparent: false,
        show: false,
        skipTaskbar: true,
        parent: parent,
        closable: true,
        modal: true,
        focusable: true,
        fullscreenable: false,
        height: 400,
        width: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    bookmarksWin.loadFile(`dist/bookmarks.html`);

    bookmarksWin.once('ready-to-show', () => {
        bookmarksWin.show();
        bookmarksWin.webContents.send('bookmarks-received', getBookmarks());
        //bookmarksWin.webContents.openDevTools();
    });

    bookmarksWin.on('closed', () => {
        bookmarksWin = null;
        onClose();
    })

    ipcMain.on('delete-bookmark', (event, bookmark) => {
        if (bookmark) {
            remove(bookmark);
        }
    });

    ipcMain.on('edit-bookmark', (event, bookmarks) => {
        try {
            save(bookmarks);
        } catch (ex) {
            console.log("error while editing bookmark: " + ex);
        }
    });
}

var exports = module.exports = {
    init: init,
    add: add,
    getMenu: getMenu,
    get: getBookmarks,
    remove: remove,
    open: open
};