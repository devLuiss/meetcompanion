const { app, BrowserWindow, globalShortcut, screen, ipcMain, desktopCapturer } = require('electron');
// Remove hardware acceleration disable since we want to use it
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

// Add startup log to see if app initialization begins
console.log('[STARTUP] Electron app initializing...');
console.log(`[STARTUP] Platform: ${process.platform}, Electron: ${process.versions.electron}, Node: ${process.versions.node}`);
console.log(`[STARTUP] App path: ${app.getAppPath()}`);
console.log(`[STARTUP] User data path: ${app.getPath('userData')}`);

// Enable remote module
require('@electron/remote/main').initialize();
console.log('[STARTUP] Remote module initialized');

// Keep references to prevent garbage collection
let mainWindow;

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[ERROR] Uncaught exception:', error);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled rejection at:', promise, 'reason:', reason);
});

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
        preload: path.join(__dirname, 'preload.js'),
        backgroundThrottling: false,
        // Ensure dev tools can be closed by the user
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
      // Use default visual effects
      visualEffectState: 'followWindow',
      roundedCorners: true,
      show: true,
      // Enable compositor layer
      paintWhenInitiallyHidden: true
    });
    console.log('[WINDOW] BrowserWindow created successfully');

    // Load the app
    const startUrl = isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`;

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

// Enable proper rendering with minimal GPU switches
// Platform-specific rendering optimizations
console.log('[STARTUP] Configuring platform-specific optimizations');
if (process.platform === 'win32') {
  // Windows-specific optimizations
  console.log('[STARTUP] Applying Windows-specific optimizations');
  try {
    app.commandLine.appendSwitch('disable-gpu-vsync'); // Reduce vsync-related stuttering
    app.commandLine.appendSwitch('disable-frame-rate-limit'); // Remove frame rate caps
    app.commandLine.appendSwitch('force-device-scale-factor', '1');
    
    // Log GPU features
    console.log('[STARTUP] Windows GPU info:', JSON.stringify(app.getGPUFeatureStatus()));
  } catch (err) {
    console.error('[STARTUP] Error applying Windows optimizations:', err);
  }
} else if (process.platform === 'darwin') {
  // macOS-specific optimizations
  console.log('[STARTUP] Applying macOS-specific optimizations');
  app.commandLine.appendSwitch('force-device-scale-factor', '1');
  // Show in dock
  app.dock.show();
} else {
  // Linux and other platforms
  console.log('[STARTUP] Applying Linux/other optimizations');
  app.commandLine.appendSwitch('force-device-scale-factor', '1');
}

// Attach additional app lifecycle event listeners
app.on('will-finish-launching', () => {
  console.log('[STARTUP] App will-finish-launching');
});

app.on('ready', () => {
  console.log('[STARTUP] App ready event fired');
  // Set app name
  app.setName("Stupid LeetCode Club");
  console.log('[STARTUP] App name set');
  
  console.log('[STARTUP] Creating window from ready event');
  createWindow();
  console.log('[STARTUP] Window created successfully');

 

  // Register global shortcuts - with platform-specific key combinations
  // For Windows, use Alt instead of Option
  console.log('[SHORTCUTS] Registering global shortcuts');
  const altKey = process.platform === 'win32' ? 'Alt' : 'Option';

  globalShortcut.register(`CommandOrControl+${altKey}+Up`, () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      moveWindow(x, y - 50);
    }
  });

  globalShortcut.register(`CommandOrControl+${altKey}+Down`, () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      moveWindow(x, y + 50);
    }
  });

  globalShortcut.register(`CommandOrControl+${altKey}+Left`, () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      moveWindow(x - 50, y);
    }
  });

  globalShortcut.register(`CommandOrControl+${altKey}+Right`, () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      moveWindow(x + 50, y);
    }
  });
});

app.on('will-quit', () => {
  console.log('[STARTUP] App will-quit event');
  // Unregister all shortcuts when app is about to quit
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  console.log('[STARTUP] All windows closed');
  if (process.platform !== 'darwin') {
    console.log('[STARTUP] Quitting app on non-macOS platform');
    app.quit();
  }
});

app.on('activate', () => {
  console.log('[STARTUP] App activated');
  if (mainWindow === null) {
    console.log('[STARTUP] Creating new window on activate');
    createWindow();
  } else {
    console.log('[STARTUP] Restoring existing window');
  }
});

// Handle global shortcuts setup
ipcMain.on('setup-global-shortcut', (event, accelerator, type) => {
  console.log(`[SHORTCUTS] Setting up global shortcut: ${accelerator} for ${type}`);
  // First unregister any existing shortcut with this accelerator
  globalShortcut.unregister(accelerator);
  
  // Register the new global shortcut
  globalShortcut.register(accelerator, () => {
    // Check if window exists and is visible
    if (mainWindow && mainWindow.isVisible()) {
      console.log(`[SHORTCUTS] Global shortcut triggered: ${accelerator} for ${type}`);
      // Focus the window first to ensure it receives subsequent events
      mainWindow.focus();
      
      // Send the event to the renderer
      mainWindow.webContents.send('global-shortcut-triggered', type);
      
      // For screenshot type, also focus
      if (type === 'screenshot') {
        mainWindow.focus();
      }
    } else {
      console.log(`[SHORTCUTS] Cannot trigger shortcut: mainWindow is ${mainWindow ? 'not visible' : 'null'}`);
    }
  });
  
  console.log(`[SHORTCUTS] Global shortcut ${accelerator} registered for ${type}`);
});

// Handle screenshot capture requests
ipcMain.handle('capture-screenshot', async () => {
  console.log('[SCREENSHOT] Screenshot capture requested');
  try {
    if (!mainWindow) {
      console.error('[SCREENSHOT] Error: Window not available');
      throw new Error('Window not available');
    }

    // Capture all screens
    console.log('[SCREENSHOT] Capturing screens with desktopCapturer');
    const sources = await desktopCapturer.getSources({ 
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 } 
    });
    console.log(`[SCREENSHOT] Captured ${sources.length} screen sources`);

    if (!sources || sources.length === 0) {
      console.error('[SCREENSHOT] Error: No screen sources found');
      throw new Error('No screen sources found');
    }

    // Get the screen where the window is currently located
    const currentBounds = mainWindow.getBounds();
    const currentScreen = screen.getDisplayNearestPoint({
      x: currentBounds.x,
      y: currentBounds.y
    });
    console.log(`[SCREENSHOT] Current screen: ${JSON.stringify({
      id: currentScreen.id,
      bounds: currentScreen.bounds,
      workArea: currentScreen.workArea
    })}`);

    // Try to find the matching source for the current screen
    const source = sources.find(s => s.display_id === currentScreen.id) || sources[0];
    console.log(`[SCREENSHOT] Selected source: id=${source.id}, name=${source.name}`);

    console.log('[SCREENSHOT] Screenshot captured successfully');
    return source.thumbnail.toDataURL();
  } catch (error) {
    console.error('[SCREENSHOT] Error capturing screenshot:', error);
    // Return a more specific error message
    throw error;
  }
});

// Handle saving Whisper audio blob (from renderer) to a temp file in dev mode
ipcMain.handle('save-whisper-audio', async (event, dataUrl) => {
  if (!isDev) return null;
  try {
    // Data URL format: data:<mime>;base64,<data>
    const match = /^data:(.*);base64,(.*)$/.exec(dataUrl);
    if (!match) throw new Error('Invalid data URL');
    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    // Choose extension based on mime type
    const ext = mimeType.split('/')[1] || 'webm';
    const tempDir = app.getPath('temp');
    const fileName = `whisper_temp_${Date.now()}.${ext}`;
    const filePath = path.join(tempDir, fileName);
    await fs.promises.writeFile(filePath, buffer);
    console.log(`[WHISPER AUDIO] Saved temp audio to ${filePath}`);
    return filePath;
  } catch (err) {
    console.error('[WHISPER AUDIO] Failed to save audio:', err);
    throw err;
  }
});

// Add IPC listener for logging from renderer process
ipcMain.on('log-to-main', (event, message) => {
  console.log(`[RENDERER LOG] ${message}`);
});
