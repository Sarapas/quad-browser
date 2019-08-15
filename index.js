const electron = require('electron')
const { BrowserView, BrowserWindow, app, Menu, globalShortcut } = electron;
const path = require('path');
const prompt = require('electron-prompt');
const ioHook = require('iohook');
const isMac = process.platform === 'darwin';
const contextMenu = require('electron-context-menu');
const defaultURL = 'https://www.nflgamepass.com';

let win;
let views;
let audibleView;
let frame;
let viewBounds;
let aspect_ratio = 16/9;
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

    if (!frame) createFrame(win);

    globalShortcut.register('CommandOrControl+1', () => {
        unmute(view1);
    });
    globalShortcut.register('CommandOrControl+2', () => {
        unmute(view2);
    });
    globalShortcut.register('CommandOrControl+3', () => {
        unmute(view3);
    });
    globalShortcut.register('CommandOrControl+4', () => {
        unmute(view4);
    });
    globalShortcut.register('Esc', () => {
        win.setFullScreen(false);
    });

    const unmute = (view) => {
        views.forEach((v) => {
            v.webContents.setAudioMuted(true);
        });

        audibleView = view;
        audibleView.webContents.setAudioMuted(false);
        showFrame(audibleView);
    };

    function showFrame(view) {
        if (!win.isVisible()) {
            if (frame)
                frame.hide();
            return;
        }

        if (!frame) createFrame(win);

        let vb = viewBounds.find(vb => vb.view === view);
        let initialPos = isMac ? win.getBounds() : win.getContentBounds();

        let frameBounds = {
            x: initialPos.x + vb.bounds.x,
            y: initialPos.y + vb.bounds.y,
            width: vb.bounds.width,
            height: vb.bounds.height
        };

        frame.setBounds(frameBounds);
        frame.show();
    }

    function mouseInView(mouseX, mouseY) {
        if (!win || !win.isFocused() || !win.isVisible()) return null;
        if (!viewBounds || viewBounds.length != 4) return null;
        
        if (!isMac) {
            let scaleFactor = electron.screen.getPrimaryDisplay().scaleFactor;
            mouseX = Math.floor(mouseX / scaleFactor);
            mouseY = Math.floor(mouseY / scaleFactor);
        }

        let initialPos = isMac ? win.getBounds() : win.getContentBounds();

        // console.log("------------------");
        // console.log(`click: x: ${mouseX} y: ${mouseY}`);
        // console.log(`winpos: x: ${winX} y: ${winY}`);

        let found = viewBounds.find((vb) => {
            let viewLeft = initialPos.x + vb.bounds.x;
            let viewRight = viewLeft + vb.bounds.width;
            let viewTop = initialPos.y + vb.bounds.y;
            let viewBottom = viewTop + vb.bounds.height;

            let tolerance = 10;

            let matchX = (mouseX > viewLeft + tolerance && mouseX < viewRight - tolerance);
            let matchY = (mouseY > viewTop + tolerance && mouseY < viewBottom - tolerance);

            // let match = "";
            // if (matchX && matchY) {
            //     match = "(MATCH)";
            // }

            // console.log(`${match} ${vb.view.title} x: ${viewLeft}-${viewRight} y: ${viewTop}-${viewBottom}`)

            if (matchX && matchY) {
                return vb;
            }
        });

        if (!found)
            return null;

        return found.view;
    }

    ioHook.on('mousedown', event => {
        if (!hoverMode) {
            let view = mouseInView(event.x, event.y);
            if (view && view !== audibleView) {
                unmute(view);
            }
        }
    });

    ioHook.on('mousemove', event => {
        if (hoverMode) {
            let view = mouseInView(event.x, event.y);
            if (view && view !== audibleView) {
                unmute(view);
            }
        }
    });

    ioHook.start();

    win.setFullScreen(true);
    win.setMenuBarVisibility(false);

    let view1;
    let view2;
    let view3;
    let view4;

    // avoiding recreation of views
    if (!views || views.length == 0) {
        view1 = new BrowserView();
        view2 = new BrowserView();
        view3 = new BrowserView();
        view4 = new BrowserView();
        views = [ view1, view2, view3, view4 ];

        view1.title = "Top left";
        view2.title = "Top right";
        view3.title = "Bottom left";
        view4.title = "Bottom right";
    
        views.forEach((view) => {
            view.webContents.loadURL(defaultURL);
        });
    } else {
        view1 = views[0];
        view2 = views[1];
        view3 = views[2];
        view4 = views[3];   
    }
    
    views.forEach((view) => {
        win.addBrowserView(view);
        view.webContents.setAudioMuted(true);
    });

    // view1.webContents.loadURL("https://www.youtube.com/watch?v=K6tzeZLjUNE");
    // view2.webContents.loadURL("https://www.youtube.com/watch?v=vKAteau0CrA");
    // view3.webContents.loadURL("https://www.youtube.com/watch?v=_t707pWG7-U");
    // view4.webContents.loadURL("https://www.youtube.com/watch?v=3u-4fxKX8as");

    win.on('show', () => {
        updateSize();
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
                if (view) {
                    view.webContents.loadURL(result);
                } else {
                    views.forEach((v) => {
                        v.webContents.loadURL(result);
                    });
                }
            }
        })
        .catch(console.error);
    };

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
          submenu: [
            { label: view1.title, click: () => { changeAddress(view1) } },
            { label: view2.title, click: () => { changeAddress(view2) } },
            { label: view3.title, click: () => { changeAddress(view3) } },
            { label: view4.title, click: () => { changeAddress(view4) }},
            { label: "All", click: () => { changeAddress() }}
          ]
        }
      ];
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    const updateSize = () => {
        let viewWidth = 0;
        let viewHeight = 0;
        let bounds = win.getBounds();
        let contentBounds = win.getContentBounds();
        let offsetY = isMac ? bounds.height - contentBounds.height : 0; // to avoid hiding webviews under the windowmenu
        let offsetX = 0;

        if (contentBounds.width / contentBounds.height < aspect_ratio) {
            let newHeight = contentBounds.width / aspect_ratio;
            const barHeight = Math.floor((contentBounds.height - newHeight) / 2);
            offsetY += barHeight;
            viewWidth = Math.floor(contentBounds.width / 2);
            viewHeight = Math.floor(newHeight / 2);
        } else {
            let newWidth = contentBounds.height * aspect_ratio;
            const barWidth = Math.floor((contentBounds.width - newWidth) / 2);
            offsetX += barWidth;
            viewWidth = Math.floor(newWidth / 2);
            viewHeight = Math.floor(contentBounds.height / 2);
        }

        let bounds1 = { x: offsetX, y: offsetY, width: viewWidth, height: viewHeight };
        let bounds2 = { x: offsetX + viewWidth, y: offsetY, width: viewWidth, height: viewHeight };
        let bounds3 = { x: offsetX, y: offsetY + viewHeight, width: viewWidth, height: viewHeight };
        let bounds4 = { x: offsetX + viewWidth, y: offsetY + viewHeight, width: viewWidth, height: viewHeight };

        view1.setBounds(bounds1);
        view2.setBounds(bounds2);
        view3.setBounds(bounds3);
        view4.setBounds(bounds4);

        // preserving view bounds for later reference
        viewBounds = [ 
            { view: view1, bounds: bounds1},
            { view: view2, bounds: bounds2},
            { view: view3, bounds: bounds3},
            { view: view4, bounds: bounds4},
        ];

        if (audibleView)
            showFrame(audibleView); // update location and size
    };

    win.on('enter-full-screen', () => {
        win.setMenuBarVisibility(false);
        if (audibleView)
            showFrame(audibleView);
    });

    win.on('leave-full-screen', () => {
        win.setMenuBarVisibility(true);
    });

    win.on('resize', () => {
        updateSize();
    });

    win.on('minimize', () => {
        frame.hide();
    })

    win.on('restore', () => {
        if (audibleView)
            showFrame(audibleView);
    })
    
    win.on('closed', () => {
        win = null;
        if (frame && !frame.isDestroyed()) {
            frame.close();
        }
        frame = null;
    });
    
    win.show();
};

function createFrame(parent) {
    frame = new BrowserWindow({
        frame: false,
        transparent: true,
        show: false,
        skipTaskbar: true,
        parent: parent,
        closable: false,
        focusable: false,
        fullscreenable: false
    });

    frame.loadFile("frame.html");
    frame.setIgnoreMouseEvents(true);
}

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