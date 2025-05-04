const { app } = require('electron');

/**
 * Configura as otimizações específicas para cada plataforma
 */
function configurePlatformSettings() {
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
}

module.exports = {
  configurePlatformSettings
};