import { app, BrowserWindow, shell, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';
import fs from 'fs';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.name = 'StockPro'; // Ensure userData goes to StockPro folder, not react-example

let mainWindow = null;
let serverProcess = null;
let SERVER_PORT = 3000;

function getLogPath() {
  return path.join(app.getPath('userData'), 'stockpro-electron.log');
}

function fileLog(message) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(getLogPath(), `[${timestamp}] ${message}\n`);
    console.log(message);
  } catch (e) {
    console.error('Failed to write log:', e);
  }
}

function fileError(message) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(getLogPath(), `[${timestamp}] ERROR: ${message}\n`);
    console.error(message);
  } catch (e) {
    console.error('Failed to write error log:', e);
  }
}

// Global Exception Handlers MUST be at the top level
process.on('uncaughtException', (err) => {
  fileError(`Uncaught exception: ${err.stack || err.message}`);
  dialog.showErrorBox('Fatal Error', `Uncaught exception: ${err.message}\nSee log at: ${getLogPath()}`);
});

process.on('unhandledRejection', (reason, promise) => {
  fileError(`Unhandled rejection: ${reason instanceof Error ? reason.stack : reason}`);
});

function getIconPath() {
  const icoPath = path.join(__dirname, '../assets/icon.ico');
  const pngPath = path.join(__dirname, '../assets/icon.png');
  if (fs.existsSync(icoPath)) return icoPath;
  if (fs.existsSync(pngPath)) return pngPath;
  return undefined;
}

function resolveServerPath() {
  if (app.isPackaged) {
    // Crucial: Use app.asar.unpacked because ELECTRON_RUN_AS_NODE cannot read inside app.asar
    const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'server.cjs');
    if (fs.existsSync(unpackedPath)) {
      return unpackedPath;
    }
    fileError(`Unpacked server not found at: ${unpackedPath}`);
    return path.join(app.getAppPath(), 'dist/server.cjs');
  }
  return path.join(__dirname, '../dist/server.cjs');
}

function getAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer();
    srv.listen(startPort, '0.0.0.0', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        getAvailablePort(startPort + 1).then(resolve, reject);
      } else {
        reject(err);
      }
    });
  });
}

function startServer() {
  const userDataDir = path.join(app.getPath('userData'), 'data');

  if (!fs.existsSync(userDataDir)) {
    try {
      fs.mkdirSync(userDataDir, { recursive: true });
    } catch (e) {
      fileError('Failed to create userData directory: ' + e.message);
    }
  }

  const serverPath = resolveServerPath();
  const distDir = path.dirname(serverPath);

  fileLog(`App started`);
  fileLog(`App packaged: ${app.isPackaged}`);
  fileLog(`Server path: ${serverPath}`);
  fileLog(`Dist path: ${distDir}`);
  fileLog(`UserData path: ${app.getPath('userData')}`);

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(SERVER_PORT),
    STOCKPRO_DATA_DIR: userDataDir,
    STOCKPRO_DIST_PATH: distDir,
    ELECTRON_RUN_AS_NODE: '1' // Run as pure Node to allow native module compilation bindings (SQLite)
  };

  try {
    serverProcess = fork(serverPath, [], {
      env,
      stdio: ['ignore', 'pipe', 'pipe', 'ipc']
    });

    serverProcess.stdout?.on('data', (data) => {
      fileLog(`[Server]: ${data.toString().trim()}`);
    });

    serverProcess.stderr?.on('data', (data) => {
      fileError(`[Server Error]: ${data.toString().trim()}`);
    });

    serverProcess.on('exit', (code) => {
      fileLog(`Server exited with code ${code}`);
    });

    fileLog(`Server start success (PID: ${serverProcess.pid})`);
  } catch (err) {
    fileError(`Server start failure: ${err.stack || err.message}`);
  }
}

function checkServerReady(retries = 40, delay = 250) {
  return new Promise((resolve) => {
    let attempts = 0;
    let lastError = null;

    const interval = setInterval(() => {
      attempts++;
      const req = http.get(`http://localhost:${SERVER_PORT}/api/health`, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          fileLog(`checkServerReady result: true (attempt ${attempts})`);
          resolve(true);
        }
      });

      req.on('error', (err) => {
        lastError = err.message;
        if (attempts >= retries) {
          clearInterval(interval);
          fileError(`checkServerReady result: false (after ${attempts} attempts, last error: ${lastError})`);
          resolve(false);
        }
      });

      req.setTimeout(500, () => {
        req.destroy();
      });

      req.end();
    }, delay);
  });
}

function createWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    return;
  }

  const icon = getIconPath();

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'StockPro ERP',
    icon: icon,
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  const targetUrl = `http://localhost:${SERVER_PORT}`;
  fileLog(`Loading URL: ${targetUrl}`);

  mainWindow.webContents.on('did-finish-load', () => {
    fileLog('BrowserWindow did-finish-load');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    fileError(`BrowserWindow did-fail-load: code ${errorCode}, desc: ${errorDescription}, url: ${validatedURL}`);
    // Auto retry once after 1 second if initial connection was refused during startup
    if (errorCode === -102 || errorCode === -105 || errorCode === -106) {
      fileLog('Retrying mainWindow.loadURL in 1.5s...');
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(targetUrl).catch(err => {
            fileError(`Retry failed: ${err.message}`);
            dialog.showErrorBox('Failed to load App', `The application backend did not start in time.\n\nCode: ${errorCode}\nError: ${errorDescription}\n\nPlease check the logs at:\n${getLogPath()}`);
          });
        }
      }, 1500);
    } else {
      dialog.showErrorBox('Page Load Failed', `Could not load ${validatedURL}\nError: ${errorDescription} (${errorCode})\nLog: ${getLogPath()}`);
    }
  });

  mainWindow.loadURL(targetUrl);

  // Handle external links safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    fileLog('======================================');
    fileLog('App whenReady triggered. Starting up.');
    try {
      SERVER_PORT = await getAvailablePort(3000);
      fileLog(`Selected available port: ${SERVER_PORT}`);
    } catch (e) {
      fileError(`Failed to get available port: ${e.message}`);
    }
    
    startServer();
    const ready = await checkServerReady();
    if (!ready) {
      fileError('checkServerReady result: false - Proceeding to open window with retry mechanism');
      dialog.showErrorBox('Server Not Ready', `The backend server failed to respond on port ${SERVER_PORT}.\nThe app may display a white screen.\n\nPlease check the logs at:\n${getLogPath()}`);
    }
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

  app.on('quit', () => {
    fileLog('App quitting. Server will shut down automatically with the main process.');
    if (serverProcess) {
      try {
        if (typeof serverProcess.kill === 'function') {
          serverProcess.kill();
        }
      } catch (e) {
        console.error('Error killing server process:', e);
      }
    }
  });
}
