const electron = require('electron')
const { BrowserWindow, app, Menu, globalShortcut } = electron;
const path = require('path');
const prompt = require('electron-prompt');
const ioHook = require('iohook');
const isMac = process.platform === 'darwin';
const contextMenu = require('electron-context-menu');
const defaultURL = 'https://www.nflgamepass.com';
const viewManager = require("./view-manager");
//var robot = require("robotjs");

let win;
let hoverMode = false;

function createWindow() {
    contextMenu({
        showLookUpSelection: false
    });

    win = new BrowserWindow({
        title: "Quad Browser",
        fullscreenable: true,
        resizable: true,
        show: false,
        icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
        backgroundColor: "#000"
    });

    viewManager.init(win, "Vertical");
    let views = viewManager.getViews();

    for (var i = 0; i < views.length; i++) {
        globalShortcut.register(`CommandOrControl+${i + 1}`, () => {
            let view = views[i];
            setAudible(view);
        });
    }

    function setAudible(view) {
        viewManager.setAudible(view);
    }

    globalShortcut.register('Esc', () => {
        if (win != null) {
            win.setFullScreen(false);
        }
    });

    ioHook.on('mousedown', event => {
        if (!hoverMode) {
            let view = viewManager.inView(event.x, event.y);
            if (view) {
                setAudible(view);
            }
        }
    });

    ioHook.on('mousemove', event => {
        if (hoverMode) {
            let view = viewManager.inView(event.x, event.y);
            if (view) {
                setAudible(view);
            }
        }
    });

    ioHook.start();

    win.setFullScreen(true);
    win.setMenuBarVisibility(false);

    viewManager.loadURL(defaultURL);

    // viewManager.loadURL("https://www.youtube.com/watch?v=K6tzeZLjUNE", views[0]);
    // viewManager.loadURL("https://www.youtube.com/watch?v=KD3Qo5DKM2s", views[1]);
    // viewManager.loadURL("https://www.youtube.com/watch?v=_t707pWG7-U", views[2]);
    // viewManager.loadURL("https://www.youtube.com/watch?v=3u-4fxKX8as", views[3]);

    win.on('show', () => {
        viewManager.updateSize();
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

    let addressSubmenu = views.map((view) => {
        return { label: view.title, click: () => { changeAddress(view) } };
    });

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
                { label: "Hover mode", type: "checkbox", accelerator: "CmdOrCtrl+H", click: () => { hoverMode = !hoverMode; }}
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
        viewManager.updateSize();
    });

    win.on('minimize', () => {
        viewManager.suspendAudible();
    })

    win.on('restore', () => {
        viewManager.resumeAudible();
    })
    
    win.on('closed', () => {
        win = null;
        viewManager.unload();
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

app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (!isMac) app.quit()
});

app.on('before-quit', () => {
    ioHook.unload(); // since iohook prevents app from quitting on mac
})