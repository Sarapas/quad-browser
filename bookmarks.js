const electron = require('electron');
const { app, MenuItem, nativeImage } = electron;
const utilities = require('./utilities');
const fs = require('fs');
const storage = require('electron-json-storage');
const viewManager = require('./view-manager');
let onChangeCallbacks = [];

const BOOKMARK_STORAGE = "bookmarks";
const ICON_DIR = `${app.getAppPath()}/icons/` // TODO: separator

let menu = [];

function init() {
    storage.setDataPath(app.getAppPath());

    try {
        storage.get(BOOKMARK_STORAGE, function(error, data) {
            if (error) throw error;

            menu = buildMenu(data.bookmarks || []);

            onChangeCallbacks.forEach((cb) => {
                cb();
            });
        });
    } catch (ex) {
        console.log("error while loading bookmarks: " + ex);
    }
}

function onChange(callback) {
    onChangeCallbacks.push(callback);
}

function buildMenu(bookmarks) {
    let menu = [];

    bookmarks.forEach((b) => {
      menu.push(new MenuItem({
        label: b.title,
        url: b.url, // custom property
        icon: getIcon(b.icon)
      }));
    });

    return menu;
}

function getMenu(view) {
    menu.forEach((item) => {
        item.click = () => { viewManager.loadURL(item.url, view); }
    })
    return menu;
}

function getIcon(fileName) {
    if (!fileName)
        return null;

    let file = `${ICON_DIR}${fileName}`;
    let icon = null;
    const size = 16;

    try {
        if (fileName.endsWith(".ico")) {
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
        storage.get(BOOKMARK_STORAGE, function(error, data) {
            if (error) throw error;
            
            data.bookmarks = data.bookmarks || [];
            let icon;
        
            function appendBookmarks() {
                data.bookmarks.push({ title: contents.getTitle(), url: contents.getURL(), icon: icon });
        
                storage.set(BOOKMARK_STORAGE, data, function(error) {
                    if (error) throw error;
    
                    menu = buildMenu(data.bookmarks);
    
                    onChangeCallbacks.forEach((cb) => {
                        cb(menu);
                    });
                });
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
                utilities.downloadFile(src, ICON_DIR, icon, () => {
                    appendBookmarks();
                });
            } else {
                appendBookmarks();
            }
        });
    } catch (ex) {
        console.log("error while adding bookmark: " + ex);
    }
  }

var exports = module.exports = {
    init: init,
    add: add,
    onChange: onChange,
    getMenu: getMenu
};