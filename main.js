const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    const iconPath = process.platform === 'win32'
        ? path.join(__dirname, 'img', 'icon.ico')
        : path.join(__dirname, 'img', 'icon-square.png');

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: 480,
        minHeight: 640,
        title: 'Pigeon Carousel - Pigeon.Pinou007.fr',
        icon: iconPath,
        autoHideMenuBar: true,
        backgroundColor: '#090a0f',
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    Menu.setApplicationMenu(null);

    mainWindow.loadFile(path.join(__dirname, 'index.html')).catch(err => {
        console.error('Failed to load index.html:', err);
    });

    mainWindow.once('ready-to-show', () => {
        if (mainWindow) mainWindow.show();
    });

    // Safety fallback: ensure window is displayed even if ready-to-show is delayed
    setTimeout(() => {
        if (mainWindow && !mainWindow.isVisible()) {
            mainWindow.show();
        }
    }, 1500);

    // Handle external links safely
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App lifecycle
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
