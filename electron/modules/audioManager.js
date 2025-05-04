const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

/**
 * Salva o áudio do Whisper em um arquivo temporário
 * @param {string} dataUrl - Data URL do áudio em base64
 * @returns {Promise<string|null>} - Caminho do arquivo temporário ou null
 */
async function saveWhisperAudio(dataUrl) {
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
}

module.exports = {
  saveWhisperAudio
};