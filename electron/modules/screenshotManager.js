const { desktopCapturer, screen } = require('electron');
const { getMainWindow } = require('./windowManager');

/**
 * Captura a tela atual onde a janela está posicionada
 */
async function captureScreenshot() {
  console.log('[SCREENSHOT] Screenshot capture requested');
  try {
    const mainWindow = getMainWindow();
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
    throw error;
  }
}

module.exports = {
  captureScreenshot
};