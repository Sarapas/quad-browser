const electron = require('electron')
const { BrowserWindow, app, Menu, globalShortcut, systemPreferences } = electron;
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

    function onMouseClick(event) {
        if (!hoverMode) {
            let view = viewManager.inView(event.x, event.y);
            if (view) {
                viewManager.setAudible(view);

                let currentClickTime = new Date().getTime();
                if (currentClickTime - lastClickTime < 500 && lastClickView === view) {
                    // double click
                    if (viewManager.isSingleLayout()) {
                        viewManager.exitSingleLayout();
                    } else {
                        viewManager.setSingleLayout(view);
                    }

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

        ioHook.on('mouseclick', onMouseClick);
        ioHook.on('mousemove', onMouseMove);
        ioHook.start();
    }

    globalShortcut.register('Esc', () => {
        if (win != null) {
            win.setFullScreen(false);
            viewManager.minimizeViews();
        }
    });

    // viewManager.loadURL("https://www.youtube.com/watch?v=6vwy-pIivQU", views[0]);
    // viewManager.loadURL("https://www.youtube.com/watch?v=KD3Qo5DKM2s", views[1]);
    // viewManager.loadURL("https://www.youtube.com/watch?v=_t707pWG7-U", views[2]);
    // viewManager.loadURL("https://www.youtube.com/watch?v=3u-4fxKX8as", views[3]);

    win.on('show', () => {
        viewManager.updateLayout();
    });

    const changeAddress = (view = null) => {
        let title = view ? `${view.title} address` : "Change address for all";
        prompt({
            title: title,
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
                viewManager.loadURL(result, view); // loads all if view is null
            }
        })
        .catch(console.error);
    };

    // TODO: sort out building menu
    let addressSubmenu = [];
    // let addressSubmenu = views.map((view) => {
    //     return { label: view.title, click: () => { changeAddress(view) } };
    // });

    addressSubmenu.push({ label: "All", click: () => { changeAddress() }});

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
                { label: "Quad Screen", type: "radio", checked: viewManager.isQuadLayout(), click: () => { viewManager.setQuadLayout(); }},
                { label: "Dual Screen", type: "radio", checked: viewManager.isDualLayout(), click: () => { viewManager.setDualLayout(); }},
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
    Menu.setApplicationMenu(menu);

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
        ioHook.removeListener('mouseclick', onMouseClick);
        ioHook.removeListener('mousemove', onMouseMove);
        win = null;
    });
    
    win.show();
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