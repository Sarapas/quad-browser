const electron = require('electron')
const { BrowserView, BrowserWindow, app } = electron;
var path = require('path');

app.commandLine.appendSwitch('--enable-features', 'OverlayScrollbar')

app.on('window-all-closed', function () {
    app.quit()
});

app.on('ready', () => {
    let win = new BrowserWindow({
        title: "Quad Browser",
        width: 1024, 
        height: 800,
        show: false,
        icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
        autoHideMenuBar: true
    });

    let view1 = new BrowserView();
    let view2 = new BrowserView();
    let view3 = new BrowserView();
    let view4 = new BrowserView();
    let views = [ view1, view2, view3, view4 ];

    views.forEach((view) => {
        view.webContents.setAudioMuted(true);
        win.addBrowserView(view);
    });

    win.on('show', () => {        
        view1.webContents.loadURL('https://www.nflgamepass.com/en/games/2019/colts-bills-2019080853#highlights')
        view2.webContents.loadURL('https://www.nflgamepass.com/en/games/2019/jets-giants-2019080860#highlights')
        view3.webContents.loadURL('https://www.nflgamepass.com/en/games/2019/jaguars-ravens-2019080852#highlights')
        view4.webContents.loadURL('https://www.nflgamepass.com/en/games/2019/redskins-browns-2019080855#highlights')

        updateSize();
    })

    const updateSize = () => {
        var windowSize = win.getBounds();

        let viewWidth = windowSize.width / 2;
        let viewHeight = windowSize.height / 2;

        view1.setBounds({ x: 0, y: 0, width: viewWidth, height: viewHeight });
        view2.setBounds({ x: viewWidth, y: 0, width: viewWidth, height: viewHeight });
        view3.setBounds({ x: 0, y: viewHeight, width: viewWidth, height: viewHeight });
        view4.setBounds({ x: viewWidth, y: viewHeight, width: viewWidth, height: viewHeight });
    };

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