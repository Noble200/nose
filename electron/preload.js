const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const { app } = require('@electron/remote');

// API segura expuesta al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
  // Sistema de archivos
  readFile: (filePath) => fs.readFile(filePath),
  writeFile: (filePath, data) => fs.writeFile(filePath, data),
  deleteFile: (filePath) => fs.unlink(filePath),
  copyFile: (source, destination) => fs.copyFile(source, destination),
  readDir: (dirPath) => fs.readdir(dirPath),
  pathExists: async (path) => {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  },
  makeDir: (dirPath) => fs.mkdir(dirPath, { recursive: true }),
  
  // Obtener ruta del directorio de datos del usuario
  getUserDataPath: () => app.getPath('userData'),
  
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

// También podemos agregar comportamientos de seguridad adicionales aquí
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