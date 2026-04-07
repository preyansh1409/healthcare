const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  const isDev = !app.isPackaged;
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    // icon: path.join(__dirname, 'client/public/favicon.svg'),
    title: 'Healthcare Management System',
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:5173'
    : 'http://localhost:5000';

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

// Start the backend server
function startServer() {
  const isPackaged = app.isPackaged;
  // If packaged, server is inside the ASAR file
  const serverPath = isPackaged
    ? path.join(process.resourcesPath, 'app.asar', 'server', 'server.js')
    : path.join(__dirname, 'server', 'server.js');

  console.log('Starting server at:', serverPath);

  serverProcess = fork(serverPath, [], {
    env: {
      ...process.env,
      NODE_ENV: isPackaged ? 'production' : 'development',
      ELECTRON_ENV: isPackaged ? 'production' : 'development'
    }
  });

  serverProcess.on('message', (msg) => {
    console.log('Server message:', msg);
  });

  serverProcess.on('error', (err) => {
    console.error('Server process error:', err);
  });
}

app.on('ready', () => {
  startServer();
  // Wait a bit for the server to start before opening window
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) serverProcess.kill();
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Clean up server on exit
app.on('will-quit', () => {
  if (serverProcess) serverProcess.kill();
});
