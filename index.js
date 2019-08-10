const electron = require('electron')
const { BrowserView, BrowserWindow, app, Menu, globalShortcut } = electron;
const path = require('path');
const prompt = require('electron-prompt');
const isMac = process.platform === 'darwin';
const defaultURL = 'https://www.nflgamepass.com';

app.on('ready', () => {
    let win = new BrowserWindow({
        title: "Quad Browser",
        fullscreenable: true,
        resizable: true,
        show: false,
        icon: path.join(__dirname, 'assets/icons/png/64x64.png')
    });

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

    const unmute = (view) => {
        views.forEach((v) => {
            v.webContents.setAudioMuted(true);
        });
        view.webContents.setAudioMuted(false);
    };

    win.setFullScreen(true);
    win.setMenuBarVisibility(false);

    let view1 = new BrowserView();
    let view2 = new BrowserView();
    let view3 = new BrowserView();
    let view4 = new BrowserView();
    let views = [ view1, view2, view3, view4 ];
    
    view1.title = "Top left";
    view2.title = "Top right";
    view3.title = "Bottom left";
    view4.title = "Bottom right";

    views.forEach((view) => {
        view.webContents.setAudioMuted(true);
        win.addBrowserView(view);
        view.webContents.loadURL(defaultURL);
    });

    win.on('show', () => {        
        updateSize();
    });

    const changeAddress = (view) => {
        prompt({
            title: `${view.title} address`,
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
                view.webContents.loadURL(result);
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
            label: 'View',
            submenu: [
                { role: 'togglefullscreen' }
            ]
        },
        {
          label: 'Address',
          submenu: [
            { label: view1.title, click: () => { changeAddress(view1) } },
            { label: view2.title, click: () => { changeAddress(view2) } },
            { label: view3.title, click: () => { changeAddress(view3) } },
            { label: view4.title, click: () => { changeAddress(view4) }}
          ]
        }
      ];
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    const updateSize = () => {
        var windowSize = win.getBounds();

        let viewWidth = Math.floor(windowSize.width / 2);
        let viewHeight = Math.floor(windowSize.height / 2);

        view1.setBounds({ x: 0, y: 0, width: viewWidth, height: viewHeight });
        view2.setBounds({ x: viewWidth, y: 0, width: viewWidth, height: viewHeight });
        view3.setBounds({ x: 0, y: viewHeight, width: viewWidth, height: viewHeight });
        view4.setBounds({ x: viewWidth, y: viewHeight, width: viewWidth, height: viewHeight });
    };

    win.on('enter-full-screen', () => {
        win.setMenuBarVisibility(false);
    });

    win.on('leave-full-screen', () => {
        win.setMenuBarVisibility(true);
    });

    win.on('resize', () => {
        updateSize();
    });

    win.on('closed', () => {
        win = null
    })

    // closing 
    setTimeout(() => {
        win.close();
    }, 10 * 60 * 1000);

    win.show();
});

app.commandLine.appendSwitch('--enable-features', 'OverlayScrollbar')

app.on('window-all-closed', function () {
    app.quit()
});