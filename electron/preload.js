const { ipcRenderer, contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    platform: process.platform,
    captureScreenshot: () => {
      return ipcRenderer.invoke('capture-screenshot');
    },
    setupGlobalShortcut: (accelerator, type) => {
      ipcRenderer.send('setup-global-shortcut', accelerator, type);
    },
    logToMain: (message) => {
      ipcRenderer.send('log-to-main', message);
    },
    // Save Whisper audio data URL to temp file
    saveWhisperAudio: (dataUrl) => {
      return ipcRenderer.invoke('save-whisper-audio', dataUrl);
    }
  }
);

// Setup IPC listeners to forward events to the renderer process
ipcRenderer.on('global-shortcut-triggered', (event, type) => {
  // Create and dispatch a custom event to the window
  const customEvent = new CustomEvent('global-shortcut', { 
    detail: { type } 
  });
  window.dispatchEvent(customEvent);
});
