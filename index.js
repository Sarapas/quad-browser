const electron = require('electron')
const { BrowserView, BrowserWindow, app } = electron;

app.commandLine.appendSwitch('--enable-features', 'OverlayScrollbar')

app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
  })

app.on('ready', () => {

    let win = new BrowserWindow({
        fullscreen: true,
        resizable: false,
        show: false
    });
    
    win.on('closed', () => {
        win = null
    })

    setTimeout(() => {
        win.close();
    }, 60 * 1000);

    win.on('show', () => {
        var windowSize = win.getBounds();

        let viewWidth = windowSize.width / 2;
        let viewHeigh = windowSize.height / 2;
    
        console.log(viewWidth);
        console.log(viewHeigh);

        let view1 = new BrowserView({
            webPreferences: {
                setAudioMuted: false
            }
        })
        win.addBrowserView(view1)
        view1.setBounds({ x: 0, y: 0, width: viewWidth, height: viewHeigh })
        view1.webContents.loadURL('https://www.nflgamepass.com/en/games/2019/colts-bills-2019080853#highlights')
    
        let view2 = new BrowserView({
            webPreferences: {
                setAudioMuted: true
            }
        })
        win.addBrowserView(view2)
        view2.setBounds({ x: viewWidth, y: 0, width: viewWidth, height: viewHeigh })
        view2.webContents.loadURL('https://www.nflgamepass.com/en/games/2019/jets-giants-2019080860#highlights')
    
        let view3 = new BrowserView({
            webPreferences: {
                setAudioMuted: true
            }
        })
        win.addBrowserView(view3)
        view3.setBounds({ x: 0, y: viewHeigh, width: viewWidth, height: viewHeigh })
        view3.webContents.loadURL('https://www.nflgamepass.com/en/games/2019/jaguars-ravens-2019080852#highlights')
    
        let view4 = new BrowserView({
            webPreferences: {
                setAudioMuted: true
            }
        })
        win.addBrowserView(view4)
        view4.setBounds({ x: viewWidth, y: viewHeigh, width: viewWidth, height: viewHeigh })
        view4.webContents.loadURL('https://www.nflgamepass.com/en/games/2019/redskins-browns-2019080855#highlights')
    })

    win.show();
});