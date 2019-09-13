const electron = require('electron');
const { app, MenuItem } = electron;
const storage = require('electron-json-storage');
const viewManager = require('./view-manager');

const HISTORY_STORAGE = "history";

let history = [];

// TODO:
// use only host for URL

function init(callback) {
    storage.setDataPath(app.getAppPath());

    try {
        storage.get(HISTORY_STORAGE, function(error, data) {
            if (error) throw error;
            history = data.history || [];
            callback(history);
        });
    } catch (ex) {
        console.log("error while loading history: " + ex);
    }
}

function add(historyItem, callback) {
    if (history.length && history[history.length - 1].url === historyItem.url) {
        // don't add if matches last item
        return;
    }
    
    try {
        storage.get(HISTORY_STORAGE, function(error, data) {
            if (error) throw error;

            data.history = data.history || [];
            data.history.push(historyItem);

            storage.set(HISTORY_STORAGE, data, function(error) {
                if (error) throw error;
                history = data.history;
                callback(history);
            });
        });
    } catch (ex) {
        console.log("error while making history: " + ex);
    }
}

function get(count) {
    let distinct = [];

    for (var i = history.length - 1; i >= 0; i--) {
        let exists = distinct.find(d => d.url === history[i].url);
        if (!exists) {
            distinct.push(history[i]);
        }
        if (distinct.length >= count) {
            break;
        }
    }

    return distinct;
}

function getMenu(view, count) {
    let menu = [];

    let recent = get(count);

    recent.forEach((b) => {
        menu.push(new MenuItem({
            label: b.title,
            url: b.url, // custom property
            // icon: b.iconData,
            click: () => {
                viewManager.loadURL(b.url, view); 
            }
        }));
    });

    return menu;
}

function clear(callback) {
    let data = { history: [] };
    storage.set(HISTORY_STORAGE, data, function(error) {
        if (error) throw error;
        history = data.history;
        callback();
    });
}

var exports = module.exports = {
    init: init,
    add: add,
    getMenu: getMenu,
    clear: clear
};