const electron = require('electron')
const { BrowserWindow, app, Menu, MenuItem, globalShortcut, systemPreferences } = electron;
const path = require('path');
const prompt = require('electron-prompt');
const ioHook = require('iohook');
const isMac = process.platform === 'darwin';
const contextMenu = require('electron-context-menu');
const viewManager = require("./view-manager");

const defaultURL = 'https://www.nflgamepass.com';

let win;
let hoverMode = false;
let isTrustedAccesibility;

let lastClickTime;
let lastClickView;

function createWindow() {
    isTrustedAccesibility = isMac ? systemPreferences.isTrustedAccessibilityClient(false) : true;

    contextMenu({
        showLookUpSelection: false
    });

    win = new BrowserWindow({
        title: "Quad Screens",
        fullscreenable: true,
        resizable: true,
        show: false,
        icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
        backgroundColor: "#000"
    });

    viewManager.init(win);

    win.setFullScreen(true);
    win.setMenuBarVisibility(false);

    viewManager.loadURL(defaultURL);

    function onMouseMove(event) {
        if (hoverMode) {
            let view = viewManager.inView(event.x, event.y);
            if (view) {
                viewManager.setAudible(view);
            }
        }
    }

    let viewMenu;

    function onMouseClick(event) {
        let view = viewManager.inView(event.x, event.y);
        if (view) {
            if (event.button === 2) {
                // without timeout propagated event closes the context menu; if event had preventDefault - it wouldn't be needed
                setTimeout(() => {
                    viewMenu = new Menu();
                    viewMenu.append(new MenuItem({ label: "Back", click: () => { if (view.webContents.canGoBack()) view.webContents.goBack(); } }));
                    viewMenu.append(new MenuItem({ label: "Refresh", click: () => { view.webContents.reload(); } }));
                    viewMenu.popup({ window: win});
                }, 50);
                return;
            }

            if (!hoverMode) {
                viewManager.setAudible(view);
            }

            let currentClickTime = new Date().getTime();
            if (currentClickTime - lastClickTime < 200 && lastClickView === view) {
                // double click
                if (viewManager.isSingleLayout()) {
                    viewManager.exitSingleLayout();
                } else {
                    viewManager.setSingleLayout(view);
                }

                Menu.setApplicationMenu(createMenu());

                lastClickTime = null;
                lastClickView = null;
            } else {
                lastClickTime = currentClickTime;
                lastClickView = view;
            }
        } else {
            lastClickView = null;
        }
    }

    if (isTrustedAccesibility) {
        let viewNumbers = [ 1, 2, 3, 4 ];
        viewNumbers.forEach((number) => {
            globalShortcut.register(`CommandOrControl+${number}`, () => {
                let view = viewManager.getViewByNumber(number);
                if (view)
                    viewManager.setAudible(view);
            });
        });

        ioHook.on('mousedown', onMouseClick);
        ioHook.on('mousemove', onMouseMove);
        ioHook.start();
    }

    globalShortcut.register('Esc', () => {
        if (win != null) {
            win.setFullScreen(false);
            viewManager.minimizeViews();
        }
    });

    // viewManager.loadURL("https://www.youtube.com/watch?v=f9eoD_dR4fA", viewManager.getViewByNumber(1));
    // viewManager.loadURL("https://www.youtube.com/watch?v=sLaBgT3zE-A", viewManager.getViewByNumber(2));
    // viewManager.loadURL("https://www.youtube.com/watch?v=_t707pWG7-U", viewManager.getViewByNumber(3));
    // viewManager.loadURL("https://www.youtube.com/watch?v=3u-4fxKX8as", viewManager.getViewByNumber(4));

    win.on('show', () => {
        viewManager.updateLayout();
    });

    Menu.setApplicationMenu(createMenu());

    win.on('enter-full-screen', () => {
        win.setMenuBarVisibility(false);
        // updating frame location
        let audible = viewManager.getAudible();
        if (audible)
            viewManager.setAudible(audible);
    });

    win.on('leave-full-screen', () => {
        win.setMenuBarVisibility(true);
    });

    win.on('resize', () => {
        viewManager.updateLayout();
    });

    win.on('minimize', () => {
        viewManager.suspendAudible();
    })

    win.on('restore', () => {
        viewManager.resumeAudible();
    })

    win.on('closed', () => {
        viewManager.unload();
        globalShortcut.unregisterAll();
        ioHook.removeListener('mousedown', onMouseClick);
        ioHook.removeListener('mousemove', onMouseMove);
        win = null;
    });
    
    win.show();
};

function createMenu() {
    let addressSubmenu = [];
    if (viewManager.isSingleLayout()) {
        addressSubmenu.push({ label: 'Current', click: () => { changeAddress(); } });
    } else if (viewManager.isDualLayout()) {
        addressSubmenu.push({ label: 'Top', click: () => { changeAddress(1); } });
        addressSubmenu.push({ label: 'Bottom', click: () => { changeAddress(2); } });
        addressSubmenu.push({ label: "All", click: () => { changeAddress(); }});
    } else if (viewManager.isQuadLayout()) {
        addressSubmenu.push({ label: 'Top left', click: () => { changeAddress(1); } });
        addressSubmenu.push({ label: 'Top right', click: () => { changeAddress(2); } });
        addressSubmenu.push({ label: 'Bottom left', click: () => { changeAddress(3); } });
        addressSubmenu.push({ label: 'Bottom right', click: () => { changeAddress(4); } });
        addressSubmenu.push({ label: "All", click: () => { changeAddress(); }});
    }

    const template = [
        ...(isMac ? [{
          label: app.getName(),
          submenu: [
            { role: 'about' },
            { role: 'quit' }
          ]
        }] : []),
        ...(isMac ? [] :[{
            label: 'File',
            submenu: [
                { role: 'quit' }
            ]
        }]),
        {
        label: "Edit",
        submenu: [
            { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
            { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
            { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
        ]},
        {
            label: 'View',
            submenu: [
                { role: 'togglefullscreen' },
                { type: "separator" },
                { label: "Quad Screen", type: "radio", checked: viewManager.isQuadLayout(), click: () => { viewManager.setQuadLayout(); Menu.setApplicationMenu(createMenu()); }},
                { label: "Dual Screen", type: "radio", checked: viewManager.isDualLayout(), click: () => { viewManager.setDualLayout(); Menu.setApplicationMenu(createMenu()); }},
                { type: "separator" },
                { label: "Hover mode", type: "checkbox", accelerator: "CmdOrCtrl+H", click: () => { hoverMode = !hoverMode; }},
                { type: "separator" },
                { label: "Fullscreen players", accelerator: "CmdorCtrl+F", click: () => { viewManager.maximizeViews(); }}
            ]
        },
        {
          label: 'Address',
          submenu: addressSubmenu
        }
      ];
    
    const menu = Menu.buildFromTemplate(template);
    return menu;
}

function changeAddress(viewNumber = null) {
    prompt({
        title: "Change address",
        label: 'Address:',
        height: 150,
        width: 400,
        resizable: false,
        value: 'https://',
        inputAttrs: {
            type: 'url'
        }
    }, win)
    .then((result) => {
        if(result !== null) {
            let view = viewManager.getViewByNumber(viewNumber);
            viewManager.loadURL(result, view); // loads all if view is null
        }
    })
    .catch(console.error);
};

app.on('ready', createWindow);

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) createWindow()
  })

app.commandLine.appendSwitch('--enable-features', 'OverlayScrollbar')

let suspendClose = false;
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    //if (!isMac && !suspendClose) app.quit()
    if (!suspendClose) app.quit();
});

app.on('before-quit', () => {
    if (isTrustedAccesibility) {
        ioHook.unload(); // since iohook prevents app from quitting on mac
    }
})