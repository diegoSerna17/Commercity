const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

let mainWindow;

// M-19: la ventana solo carga este archivo local; se usa para validar
// navegacion y el remitente de los canales IPC.
const APP_INDEX = path.join(__dirname, 'src', 'index.html');
const APP_INDEX_URL = pathToFileURL(APP_INDEX).href;

// M-19: valida que el IPC venga del frame principal de la ventana propia.
function ventanaDe(event) {
  if (!mainWindow || mainWindow.isDestroyed()) return null;
  const frame = event.senderFrame;
  if (!frame || frame !== mainWindow.webContents.mainFrame) return null;
  if (!String(frame.url || '').startsWith(APP_INDEX_URL)) return null;
  return mainWindow;
}

// M-19: canales registrados fuera de createWindow (una sola vez).
ipcMain.on('minimize-window', (event) => { const w = ventanaDe(event); if (w) w.minimize(); });
ipcMain.on('maximize-window', (event) => { const w = ventanaDe(event); if (w) (w.isMaximized() ? w.restore() : w.maximize()); });
ipcMain.on('close-window',    (event) => { const w = ventanaDe(event); if (w) w.close(); });

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 1024, minHeight: 700,
    frame: false, titleBarStyle: 'hidden',
    // F1-F3 (P0 auditoria 2026-10-05) + M-19 (auditoria 2026-10-11):
    // sin acceso Node en el renderer, contexto aislado y sandbox explicito.
    // El renderer solo usa window.electron via preload + contextBridge.
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#0e0e12',
  });
  // M-19: sin ventanas emergentes y navegacion restringida al propio index.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (String(url).split('#')[0].split('?')[0] !== APP_INDEX_URL) event.preventDefault();
  });
  mainWindow.loadFile(APP_INDEX);
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
  console.log('  🚀  CommerCity v' + app.getVersion() + '  —  Marketplace Desktop App');
  console.log('  📦  Electron ' + process.versions.electron);
  console.log('  ✅  Iniciando aplicación...');
  console.log('');
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
