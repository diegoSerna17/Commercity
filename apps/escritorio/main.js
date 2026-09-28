const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 1024, minHeight: 700,
    frame: false, titleBarStyle: 'hidden',
    webPreferences: { nodeIntegration: true, contextIsolation: false },
    backgroundColor: '#0e0e12',
  });
  mainWindow.loadFile('src/index.html');
  ipcMain.on('minimize-window', () => mainWindow.minimize());
  ipcMain.on('maximize-window', () => mainWindow.isMaximized() ? mainWindow.restore() : mainWindow.maximize());
  ipcMain.on('close-window',    () => mainWindow.close());
}

app.whenReady().then(() => {
  console.log('');
  console.log('   ██████╗ ██████╗ ███╗   ███╗███╗   ███╗███████╗██████╗  ██████╗██╗████████╗██╗   ██╗');
  console.log('  ██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔════╝██╔══██╗██╔════╝██║╚══██╔══╝╚██╗ ██╔╝');
  console.log('  ██║     ██║   ██║██╔████╔██║██╔████╔██║█████╗  ██████╔╝██║     ██║   ██║    ╚████╔╝ ');
  console.log('  ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══╝  ██╔══██╗██║     ██║   ██║     ╚██╔╝  ');
  console.log('  ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║███████╗██║  ██║╚██████╗██║   ██║      ██║   ');
  console.log('   ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝   ╚═╝      ╚═╝  ');
  console.log('');
  console.log('  🚀  CommerCity v2.0.0  —  Marketplace Desktop App');
  console.log('  📦  Electron ' + process.versions.electron);
  console.log('  ✅  Iniciando aplicación...');
  console.log('');
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
