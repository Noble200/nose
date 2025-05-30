const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const isDev = require('electron-is-dev');
const log = require('electron-log');

// Configuración del log
log.transports.file.level = 'info';
log.info('Aplicación iniciando...');

let mainWindow;

// Función para crear la ventana principal
function createWindow() {
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev, // Desactivar solo en desarrollo
    },
    show: false, // No mostrar hasta que esté listo
    icon: path.join(__dirname, '../public/assets/icons/icon.png'),
  });

  // Maximizar la ventana por defecto para aprovechar toda la pantalla
  mainWindow.maximize();

  // Cargar la URL de la aplicación
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Mostrar la ventana una vez que esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log.info('Ventana principal mostrada');
  });

  // Abrir DevTools en desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Gestionar el cierre de la ventana
  mainWindow.on('closed', () => {
    mainWindow = null;
    log.info('Ventana principal cerrada');
  });

  // Configurar CSP para producción
  if (!isDev) {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://fonts.googleapis.com https://cdnjs.cloudflare.com https://fonts.gstatic.com;"
          ]
        }
      });
    });
  }
}

// Crear ventana cuando la aplicación esté lista
app.whenReady().then(createWindow);

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Manejadores de IPC para sistema de archivos
ipcMain.handle('fs-read-file', async (event, filePath) => {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    log.error('Error al leer archivo:', error);
    throw error;
  }
});

ipcMain.handle('fs-write-file', async (event, filePath, data) => {
  try {
    return await fs.writeFile(filePath, data);
  } catch (error) {
    log.error('Error al escribir archivo:', error);
    throw error;
  }
});

ipcMain.handle('fs-delete-file', async (event, filePath) => {
  try {
    return await fs.unlink(filePath);
  } catch (error) {
    log.error('Error al eliminar archivo:', error);
    throw error;
  }
});

ipcMain.handle('fs-copy-file', async (event, source, destination) => {
  try {
    return await fs.copyFile(source, destination);
  } catch (error) {
    log.error('Error al copiar archivo:', error);
    throw error;
  }
});

ipcMain.handle('fs-read-dir', async (event, dirPath) => {
  try {
    return await fs.readdir(dirPath);
  } catch (error) {
    log.error('Error al leer directorio:', error);
    throw error;
  }
});

ipcMain.handle('fs-path-exists', async (event, path) => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('fs-make-dir', async (event, dirPath) => {
  try {
    return await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    log.error('Error al crear directorio:', error);
    throw error;
  }
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

// Manejador para mostrar diálogo de guardar
ipcMain.handle('show-save-dialog', async (event, options) => {
  try {
    return await dialog.showSaveDialog(mainWindow, options);
  } catch (error) {
    log.error('Error en diálogo de guardar:', error);
    return { canceled: true, error: error.message };
  }
});

// Manejador para mostrar diálogo de abrir
ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    return await dialog.showOpenDialog(mainWindow, options);
  } catch (error) {
    log.error('Error en diálogo de abrir:', error);
    return { canceled: true, error: error.message };
  }
});

// Manejador para obtener versión de la app
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Manejadores para controlar la ventana
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// Manejador de errores no controlados
process.on('uncaughtException', (error) => {
  log.error('Error no controlado:', error);
  dialog.showErrorBox(
    'Error en la aplicación',
    `Ha ocurrido un error inesperado: ${error.message}`
  );
});