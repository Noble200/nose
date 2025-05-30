const { contextBridge, ipcRenderer } = require('electron');

// API segura expuesta al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
  // Sistema de archivos - delegamos al main process
  readFile: (filePath) => ipcRenderer.invoke('fs-read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs-write-file', filePath, data),
  deleteFile: (filePath) => ipcRenderer.invoke('fs-delete-file', filePath),
  copyFile: (source, destination) => ipcRenderer.invoke('fs-copy-file', source, destination),
  readDir: (dirPath) => ipcRenderer.invoke('fs-read-dir', dirPath),
  pathExists: (path) => ipcRenderer.invoke('fs-path-exists', path),
  makeDir: (dirPath) => ipcRenderer.invoke('fs-make-dir', dirPath),
  
  // Obtener ruta del directorio de datos del usuario
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  
  // Diálogos de archivo
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Sistema
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Ventana
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
});

// Comportamientos de seguridad adicionales
window.addEventListener('DOMContentLoaded', () => {
  // Sobrescribir console.log en producción para evitar fugas de información
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      originalConsoleLog('[AgroGestión]', ...args);
    };
  }
});