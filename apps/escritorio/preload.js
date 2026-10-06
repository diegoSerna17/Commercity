// preload.js - Puente seguro Electron (F1-F3 P0 auditoria 2026-10-05).
// Expone solo los 3 canales de ventana via contextBridge; sin Node en el renderer.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
});
