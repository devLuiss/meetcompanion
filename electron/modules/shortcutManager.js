const { globalShortcut } = require('electron');
const { getMainWindow } = require('./windowManager');

/**
 * Configura os atalhos globais do sistema
 */
function setupGlobalShortcuts() {
  console.log('[SHORTCUTS] Registering global shortcuts');
  const altKey = process.platform === 'win32' ? 'Alt' : 'Option';

  // Window movement shortcuts
  globalShortcut.register(`CommandOrControl+${altKey}+Up`, () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      moveWindow(x, y - 50);
    }
  });

  globalShortcut.register(`CommandOrControl+${altKey}+Down`, () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      moveWindow(x, y + 50);
    }
  });

  globalShortcut.register(`CommandOrControl+${altKey}+Left`, () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      moveWindow(x - 50, y);
    }
  });

  globalShortcut.register(`CommandOrControl+${altKey}+Right`, () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      moveWindow(x + 50, y);
    }
  });
}

/**
 * Registra um atalho global específico
 */
function registerShortcut(accelerator, type) {
  console.log(`[SHORTCUTS] Setting up global shortcut: ${accelerator} for ${type}`);
  // First unregister any existing shortcut with this accelerator
  globalShortcut.unregister(accelerator);
  
  // Register the new global shortcut
  globalShortcut.register(accelerator, () => {
    const mainWindow = getMainWindow();
    
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
}

/**
 * Move a janela para uma posição específica
 */
function moveWindow(x, y) {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    mainWindow.setPosition(x, y);
  }
}

/**
 * Remove todos os atalhos globais
 */
function unregisterAllShortcuts() {
  globalShortcut.unregisterAll();
  console.log('[SHORTCUTS] All shortcuts unregistered');
}

module.exports = {
  setupGlobalShortcuts,
  registerShortcut,
  unregisterAllShortcuts
};