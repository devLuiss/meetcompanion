const { BrowserWindow, screen } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
require('@electron/remote/main');

let mainWindow = null;

/**
 * Cria a janela principal da aplicação
 */
function createWindow() {
  console.log('[WINDOW] Creating main window...');
  try {
    // Get the screen size
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    console.log(`[WINDOW] Primary display size: ${width}x${height}`);
    
    // Log all displays for Windows
    if (process.platform === 'win32') {
      const displays = screen.getAllDisplays();
      console.log(`[WINDOW] Windows has ${displays.length} display(s):`);
      displays.forEach((display, i) => {
        console.log(`[WINDOW] Display ${i}: ${display.size.width}x${display.size.height}, bounds: (${display.bounds.x},${display.bounds.y}), (${display.bounds.width}x${display.bounds.height}), scaleFactor: ${display.scaleFactor}`);
      });
    }

    console.log('[WINDOW] Creating BrowserWindow with params:', JSON.stringify({
      width, height, x: 0, y: 0, transparent: true, frame: false,
      type: process.platform === 'darwin' ? 'panel' : (process.platform === 'win32' ? 'utility' : 'toolbar')
    }));
    
    mainWindow = new BrowserWindow({
      width: width,
      height: height,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: true,
        preload: path.join(__dirname, '../preload.js'),
        backgroundThrottling: false,
        devTools: true
      },
      transparent: false,
      frame: true,
      backgroundColor: '#FFFFFF',
      skipTaskbar: false,
      title: "Stupid LeetCode Club", 
      alwaysOnTop: false,
      focusable: true,
      movable: true,
      hasShadow: true,
      resizable: true,
      opacity: 1.0,
      useContentSize: true,
      minimizable: true,
      fullscreenable: true,
      visualEffectState: 'followWindow',
      roundedCorners: true,
      show: true,
      paintWhenInitiallyHidden: true
    });
    console.log('[WINDOW] BrowserWindow created successfully');

    // Load the app
    const startUrl = isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../../build/index.html')}`;

    console.log(`[WINDOW] Loading URL: ${startUrl}`);
    mainWindow.loadURL(startUrl).then(() => {
      console.log('[WINDOW] URL loaded successfully');
    }).catch(err => {
      console.error('[WINDOW] Failed to load URL:', err);
    });

    // Enable remote module for the window
    require('@electron/remote/main').enable(mainWindow.webContents);
    console.log('[WINDOW] Remote module enabled for window');

    // Set size constraints
    mainWindow.setMinimumSize(400, 300);
    console.log('[WINDOW] Size constraints set');

    // Add window event listeners for debugging
    mainWindow.on('ready-to-show', () => {
      console.log('[WINDOW] ready-to-show event fired');
      if (process.platform === 'win32') {
        console.log(`[WINDOW] Windows visibility state: isVisible=${mainWindow.isVisible()}, isMinimized=${mainWindow.isMinimized()}, isFocused=${mainWindow.isFocused()}`);
        console.log(`[WINDOW] Windows position: ${JSON.stringify(mainWindow.getBounds())}`);
      }
    });

    mainWindow.webContents.on('did-start-loading', () => {
      console.log('[WINDOW] did-start-loading');
    });

    mainWindow.webContents.on('did-finish-load', () => {
      console.log('[WINDOW] did-finish-load');
      if (process.platform === 'win32') {
        console.log(`[WINDOW] After load: isVisible=${mainWindow.isVisible()}, isFocused=${mainWindow.isFocused()}`);
      }
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error(`[WINDOW] did-fail-load: ${errorDescription} (${errorCode})`);
    });

    mainWindow.webContents.on('crashed', (event, killed) => {
      console.error(`[WINDOW] Renderer process ${killed ? 'was killed' : 'crashed'}`);
    });

    mainWindow.on('closed', () => {
      console.log('[WINDOW] Window closed event');
      mainWindow = null;
    });

    // Only open dev tools if explicitly requested via environment variable
    if (isDev && process.env.OPEN_DEV_TOOLS === 'true') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
      console.log('[WINDOW] DevTools opened');
    }
  } catch (error) {
    console.error('[WINDOW] Error creating window:', error);
  }
}

/**
 * Retorna a referência para a janela principal
 */
function getMainWindow() {
  return mainWindow;
}

/**
 * Move a janela para uma posição específica
 */
function moveWindow(x, y) {
  if (mainWindow) {
    mainWindow.setPosition(x, y);
  }
}

module.exports = {
  createWindow,
  getMainWindow,
  moveWindow
};