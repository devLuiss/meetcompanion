/**
 * Serviço para gerenciar capturas de tela e operações com imagens
 */

/**
 * Captura uma screenshot usando a API do Electron
 * @returns {Promise<string>} - Data URL da imagem capturada
 */
export async function captureScreenshot() {
  if (window.electronAPI && window.electronAPI.captureScreenshot) {
    try {
      const screenshotDataUrl = await window.electronAPI.captureScreenshot();
      if (!screenshotDataUrl) {
        throw new Error('Failed to capture screenshot');
      }
      return screenshotDataUrl;
    } catch (error) {
      console.error('Screenshot capture error:', error);
      throw error;
    }
  } else {
    throw new Error('Screenshot capture is not available');
  }
}

/**
 * Processa um evento de colar do clipboard que contém uma imagem
 * @param {ClipboardEvent} event - Evento de colar
 * @returns {Promise<string|null>} - Data URL da imagem ou null se não houver imagem
 */
export function handleImagePaste(event) {
  return new Promise((resolve) => {
    if (!event.clipboardData || !event.clipboardData.items) {
      resolve(null);
      return;
    }
    
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          resolve(readerEvent.target.result);
        };
        reader.readAsDataURL(blob);
        return;
      }
    }
    
    resolve(null);
  });
}

/**
 * Envia um comando para configurar um atalho global no Electron
 * @param {string} accelerator - Tecla de atalho (ex: 'CommandOrControl+S')
 * @param {string} type - Tipo de atalho (ex: 'screenshot', 'whisper')
 */
export function setupGlobalShortcut(accelerator, type) {
  if (window.electronAPI && window.electronAPI.setupGlobalShortcut) {
    window.electronAPI.setupGlobalShortcut(accelerator, type);
  }
}