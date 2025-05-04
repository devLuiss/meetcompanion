/**
 * Serviço para interação com a API Whisper da OpenAI
 */

/**
 * Processa o áudio com a API Whisper para transcrição
 * @param {Blob} audioBlob - Blob de áudio para enviar à API Whisper
 * @param {string} apiKey - Chave da API OpenAI
 * @returns {Promise<Object>} - Objeto com transcrição e dados completos da resposta
 */
export async function processAudioWithWhisper(audioBlob, apiKey) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'pt'); // Especificando português como idioma
  
  console.log('[WHISPER DEBUG] FormData preparado:', {
    fileName: 'audio.webm',
    audioType: audioBlob.type,
    model: 'whisper-1',
    language: 'pt'
  });
  
  // Log para o processo principal do Electron, se disponível
  window.electronAPI && window.electronAPI.logToMain && 
    window.electronAPI.logToMain(`[WHISPER DEBUG] FormData preparado para requisição com idioma: pt`);

  console.log('[WHISPER] Preparando para enviar áudio para API Whisper');
  window.electronAPI && window.electronAPI.logToMain && 
    window.electronAPI.logToMain(`[WHISPER] Preparando requisição com tamanho de áudio: ${audioBlob.size} bytes`);
  
  const whisperResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });
  
  console.log('[WHISPER] Resposta recebida da API Whisper:', whisperResp.status, whisperResp.statusText);
  window.electronAPI && window.electronAPI.logToMain && 
    window.electronAPI.logToMain(`[WHISPER] Resposta recebida com status: ${whisperResp.status} ${whisperResp.statusText}`);
  
  if (!whisperResp.ok) {
    try {
      const errorData = await whisperResp.json();
      console.error('[WHISPER] Erro na API:', errorData);
      window.electronAPI && window.electronAPI.logToMain && 
        window.electronAPI.logToMain(`[WHISPER ERROR DETAILS] ${JSON.stringify(errorData)}`);
      throw new Error(`Whisper API error: ${errorData.error?.message || whisperResp.statusText}`);
    } catch (jsonError) {
      console.error('[WHISPER] Erro ao processar resposta de erro:', jsonError);
      window.electronAPI && window.electronAPI.logToMain && 
        window.electronAPI.logToMain(`[WHISPER ERROR PARSING] ${jsonError.message}`);
      throw new Error(`Whisper API error: ${whisperResp.statusText || 'Unknown error'}`);
    }
  }

  const whisperData = await whisperResp.json();
  console.log('[WHISPER] Resposta completa da API:', whisperData);
  window.electronAPI && window.electronAPI.logToMain &&
    window.electronAPI.logToMain(`[WHISPER RESPONSE] ${JSON.stringify(whisperData)}`);

  const transcription = whisperData.text?.trim() || '';
  console.log('[WHISPER] Transcrição extraída:', transcription);
  
  return { transcription, whisperData };
}

/**
 * Processa a transcrição do Whisper usando o chat GPT
 * @param {string} prompt - Prompt adicional para contexto
 * @param {string} transcription - Transcrição do áudio a ser processada
 * @param {string} apiKey - Chave da API OpenAI
 * @returns {Promise<string>} - Resposta do modelo
 */
export async function processChatWithTranscription(prompt, transcription, apiKey) {
  console.log('[WHISPER] Enviando transcrição para processamento:', { 
    prompt: prompt, 
    transcription: transcription 
  });
  window.electronAPI && window.electronAPI.logToMain && 
    window.electronAPI.logToMain(`[WHISPER CHAT] Enviando prompt: "${prompt}" e transcrição: "${transcription}"`);
  
  // Combinar o prompt com a transcrição em uma única mensagem para contextualização
  const userMessage = prompt ? 
    `${prompt}\n\nTranscrição do áudio: "${transcription}"` : 
    `Por favor, responda ao seguinte: "${transcription}"`;
  
  const chatResp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: 'user', content: userMessage }
      ],
    }),
  });
  
  if (!chatResp.ok) throw new Error('Chat Completion API error');
  
  const chatData = await chatResp.json();
  const answer = chatData.choices?.[0]?.message?.content.trim() || '';
  
  window.electronAPI && window.electronAPI.logToMain &&
    window.electronAPI.logToMain(`[WHISPER ANSWER] ${answer}`);
    
  return answer;
}

/**
 * Salva o áudio do Whisper no electron (apenas para desenvolvimento)
 * @param {Blob} audioBlob - Blob de áudio para salvar
 * @returns {Promise<string|null>} - Caminho do arquivo salvo ou null
 */
export async function saveWhisperAudio(audioBlob) {
  if (!window.electronAPI || !window.electronAPI.saveWhisperAudio) {
    return null;
  }
  
  try {
    const dataUrl = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(audioBlob);
    });
    
    const savedPath = await window.electronAPI.saveWhisperAudio(dataUrl);
    window.electronAPI.logToMain && 
      window.electronAPI.logToMain(`[WHISPER AUDIO] Saved to: ${savedPath}`);
    
    return savedPath;
  } catch (err) {
    console.warn('Could not save Whisper audio file:', err);
    return null;
  }
}

// Serviço para interagir com a API Whisper da OpenAI
import { ipcRenderer } from 'electron';

class WhisperService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
    this.stream = null;
  }

  // Iniciar a gravação do microfone
  async startRecording() {
    if (this.isRecording) {
      console.log('[WHISPER SERVICE] Already recording, stopping first...');
      await this.stopRecording();
    }

    try {
      this.audioChunks = [];
      this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
      this.setupMediaRecorder(this.stream);
      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('[WHISPER SERVICE] Error starting recording:', err);
      throw err;
    }
  }

  // Configurar o MediaRecorder com o stream fornecido
  setupMediaRecorder(stream) {
    this.mediaRecorder = new MediaRecorder(stream);
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.onstop = () => {
      console.log('[WHISPER SERVICE] Recording stopped, processing data...');
    };
    
    this.mediaRecorder.start();
    console.log('[WHISPER SERVICE] Recording started');
  }

  // Parar a gravação e retornar os dados
  async stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      console.log('[WHISPER SERVICE] Not recording, nothing to stop');
      return null;
    }
    
    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          this.cleanupRecording();
          
          // Converte Blob para base64 data URL
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = reader.result;
            console.log('[WHISPER SERVICE] Audio processed successfully');
            
            // Salva o áudio usando o processo principal se em ambiente de desenvolvimento
            const filePath = await ipcRenderer.invoke('save-whisper-audio', base64data);
            console.log('[WHISPER SERVICE] Audio saved at:', filePath);
            
            resolve({ audioBlob, base64data, filePath });
          };
          reader.onerror = (error) => {
            reject(error);
          };
          reader.readAsDataURL(audioBlob);
        } catch (error) {
          reject(error);
        }
      };
      
      this.mediaRecorder.stop();
    });
  }

  // Limpa os recursos após a gravação
  cleanupRecording() {
    this.isRecording = false;
    
    // Parar todas as faixas do stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  // Função auxiliar para determinar se o usuário tem permissão para gravar
  async checkMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('[WHISPER SERVICE] Microphone permission error:', error);
      return false;
    }
  }
}

// Exportar como singleton
const whisperService = new WhisperService();
export default whisperService;