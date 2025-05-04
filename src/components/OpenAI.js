import React, { useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';

// Default prompt template
const DEFAULT_PROMPT = `Help me understanding this with bullet points.`;

const OpenAI = ({ apiKey, cloudflareAccount, geminiApiKey, whisperDeviceId }) => {
  const [prompt, setPrompt] = useState(() => {
    const saved = localStorage.getItem('last_prompt');
    return saved !== null ? saved : DEFAULT_PROMPT;
  });
  const [response, setResponse] = useState('');
  const [formattedResponse, setFormattedResponse] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageData, setImageData] = useState(null);
  const [captureInfo, setCaptureInfo] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const canvasRef = useRef(null);
  const [useGemini, setUseGemini] = useState(false);
  const [whisperTranscription, setWhisperTranscription] = useState('');
  const [whisperAnswer, setWhisperAnswer] = useState('');
  const [isWhisperLoading, setIsWhisperLoading] = useState(false);
  const [isWhisperModalOpen, setIsWhisperModalOpen] = useState(false);
  const [whisperError, setWhisperError] = useState('');
  const [whisperStatus, setWhisperStatus] = useState('Ready - Press ⌘+D to start/stop recording');
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const isWhisperLoadingRef = useRef(isWhisperLoading);
  useEffect(() => {
    isWhisperLoadingRef.current = isWhisperLoading;
  }, [isWhisperLoading]);
  const isWhisperModalOpenRef = useRef(isWhisperModalOpen);
  useEffect(() => {
    isWhisperModalOpenRef.current = isWhisperModalOpen;
  }, [isWhisperModalOpen]);
  const handleWhisperRef = useRef();
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const responseSectionRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('last_prompt', prompt);
    } catch (e) {
      console.warn('Could not persist prompt to localStorage:', e);
    }
  }, [prompt]);

  useEffect(() => {
    if (!response) {
      setFormattedResponse([]);
      return;
    }

    const codeBlockRegex = /```(?:(\w+)(?: ?([^\n]+))?)?(?:\n)([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: response.substring(lastIndex, match.index)
        });
      }

      let language = match[1] ? match[1].toLowerCase() : 'javascript';

      const languageMap = {
        'js': 'javascript',
        'ts': 'typescript',
        'py': 'python',
        'rb': 'ruby',
        'kt': 'kotlin',
        'cpp': 'cpp',
        'c++': 'cpp',
        'cs': 'csharp',
        'java': 'java',
        'go': 'go',
        'php': 'php',
        'sh': 'bash',
        'bash': 'bash',
        'shell': 'bash',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'md': 'markdown',
        'markdown': 'markdown',
        'sql': 'sql'
      };

      language = languageMap[language] || language;

      parts.push({
        type: 'code',
        language: language,
        title: match[2] || '',
        content: match[3]
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < response.length) {
      parts.push({
        type: 'text',
        content: response.substring(lastIndex)
      });
    }

    setFormattedResponse(parts);
  }, [response]);

  useEffect(() => {
    if (response && responseSectionRef.current) {
      const el = responseSectionRef.current;

      const checkScrollNeeded = () => {
        setShowScrollIndicator(el.scrollHeight > el.clientHeight);
      };

      checkScrollNeeded();
      window.addEventListener('resize', checkScrollNeeded);

      return () => {
        window.removeEventListener('resize', checkScrollNeeded);
      };
    } else {
      setShowScrollIndicator(false);
    }
  }, [response, formattedResponse]);

  useEffect(() => {
    if (response && responseSectionRef.current) {
      const el = responseSectionRef.current;

      const handleWheel = (e) => {
        if (el.scrollHeight > el.clientHeight) {
          e.stopPropagation();
        }
      };

      el.addEventListener('wheel', handleWheel);

      return () => {
        el.removeEventListener('wheel', handleWheel);
      };
    }
  }, [response]);

  useEffect(() => {
    if (geminiApiKey && !apiKey) {
      setUseGemini(true);
    } else if (!geminiApiKey && apiKey) {
      setUseGemini(false);
    }
  }, [geminiApiKey, apiKey]);

  useEffect(() => {
    const handleScreenshotEvent = (event) => {
      if (event.detail && event.detail.dataUrl) {
        setImageData(event.detail.dataUrl);
        setCaptureInfo('Screenshot captured! Press ⌘+Enter to analyze.');
        setTimeout(() => setCaptureInfo(''), 3000);
      }
    };

    const handleGlobalShortcut = (event) => {
      if (event.detail && event.detail.type === 'screenshot') {
        captureScreenshot();
      } else if (event.detail && event.detail.type === 'whisper') {
        handleWhisperRef.current && handleWhisperRef.current();
      }
    };

    window.addEventListener('screenshot-captured', handleScreenshotEvent);
    window.addEventListener('global-shortcut', handleGlobalShortcut);

    if (window.electronAPI) {
      window.electronAPI.setupGlobalShortcut &&
        window.electronAPI.setupGlobalShortcut('CommandOrControl+S', 'screenshot');
      window.electronAPI.setupGlobalShortcut &&
        window.electronAPI.setupGlobalShortcut('CommandOrControl+D', 'whisper');

      return () => {
        window.removeEventListener('screenshot-captured', handleScreenshotEvent);
        window.removeEventListener('global-shortcut', handleGlobalShortcut);
      };
    }

    return () => {
      window.removeEventListener('screenshot-captured', handleScreenshotEvent);
      window.removeEventListener('global-shortcut', handleGlobalShortcut);
    };
  }, []);

  const captureScreenshot = async () => {
    if (window.electronAPI && window.electronAPI.captureScreenshot) {
      try {
        setCaptureInfo('Capturing screenshot...');

        const screenshotDataUrl = await window.electronAPI.captureScreenshot();

        if (screenshotDataUrl) {
          setImageData(screenshotDataUrl);
          setCaptureInfo('Screenshot captured! Press ⌘+Enter to analyze.');

          const textArea = document.querySelector('textarea');
          if (textArea) {
            textArea.focus();
          }

          setTimeout(() => setCaptureInfo(''), 3000);
        } else {
          setCaptureInfo('Failed to capture screenshot. Try pasting an image from clipboard.');
          setTimeout(() => setCaptureInfo(''), 3000);
        }
      } catch (error) {
        console.error('Screenshot capture error:', error);
        setCaptureInfo('Error capturing screenshot. Try pasting an image from clipboard.');
        setTimeout(() => setCaptureInfo(''), 3000);
      }
    }
  };

  const handleWhisper = async () => {
    if (mediaRecorderRef.current) {
      finishWhisperRecording();
      return;
    }

    console.log('[WHISPER DEBUG] Iniciando processo de gravação');
    window.electronAPI && window.electronAPI.logToMain && 
      window.electronAPI.logToMain(`[WHISPER DEBUG] Iniciando processo de gravação`);
      
    setResponse('');
    setWhisperError('');
    setWhisperTranscription('');
    setWhisperAnswer('');
    setIsWhisperModalOpen(true);
    setIsWhisperLoading(true);
    setWhisperStatus('Recording... Press ⌘+D to stop and process');

    const key = localStorage.getItem('openai_api_key') || apiKey;
    if (!key) {
      setWhisperError('OpenAI API key not set. Please add your API key in Settings.');
      setWhisperStatus('Error - Add API key in Settings');
      setIsWhisperLoading(false);
      return;
    }

    let stream;
    try {
      const constraints = whisperDeviceId
        ? { audio: { deviceId: { exact: whisperDeviceId } } }
        : { audio: true };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
    } catch (err) {
      setWhisperError('Microphone access failed: ' + err.message);
      setWhisperStatus('Error - Check microphone permissions');
      setIsWhisperLoading(false);
      return;
    }

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    
    console.log('[WHISPER DEBUG] Configuração do MediaRecorder:', {
      mimeType: mediaRecorder.mimeType,
      state: mediaRecorder.state,
      audioBitsPerSecond: mediaRecorder.audioBitsPerSecond
    });
    window.electronAPI && window.electronAPI.logToMain && 
      window.electronAPI.logToMain(`[WHISPER DEBUG] MediaRecorder configurado com mimeType: ${mediaRecorder.mimeType}`);
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        console.log(`[WHISPER DEBUG] Chunk de áudio recebido: ${e.data.size} bytes`);
        window.electronAPI && window.electronAPI.logToMain && 
          window.electronAPI.logToMain(`[WHISPER DEBUG] Chunk de áudio recebido: ${e.data.size} bytes`);
        recordedChunksRef.current.push(e.data);
      }
    };

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.start(1000);
  };

  const finishWhisperRecording = async () => {
    if (!mediaRecorderRef.current) return;

    const key = localStorage.getItem('openai_api_key') || apiKey;
    if (!key) {
      setWhisperError('OpenAI API key not set. Please add your API key in Settings.');
      setWhisperStatus('Error - Add API key in Settings');
      setIsWhisperModalOpen(true);
      setIsWhisperLoading(false);
      return;
    }

    try {
      setWhisperStatus('Processing recording...');
      setIsWhisperModalOpen(true);

      mediaRecorderRef.current.stop();

      await new Promise(resolve => {
        mediaRecorderRef.current.onstop = resolve;
      });

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
      
      console.log('[WHISPER DEBUG] Gravação finalizada:', {
        chunks: recordedChunksRef.current.length,
        totalSize: audioBlob.size,
        type: audioBlob.type,
        duration: 'Estimativa baseada no tamanho: ' + Math.round(audioBlob.size / 16000) + 'ms'
      });
      window.electronAPI && window.electronAPI.logToMain && 
        window.electronAPI.logToMain(`[WHISPER DEBUG] Gravação finalizada com ${recordedChunksRef.current.length} chunks, tamanho total: ${audioBlob.size} bytes`);

      if (audioBlob.size < 2000) {
        console.warn('[WHISPER ALERTA] Áudio gravado muito pequeno (${audioBlob.size} bytes). Isso pode resultar em uma transcrição "you" ou vazia.');
        window.electronAPI && window.electronAPI.logToMain && 
          window.electronAPI.logToMain(`[WHISPER ALERTA] Áudio gravado muito pequeno (${audioBlob.size} bytes). Possível problema de captura.`);
      }

      if (window.electronAPI && window.electronAPI.saveWhisperAudio) {
        try {
          const dataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(audioBlob);
          });
          const savedPath = await window.electronAPI.saveWhisperAudio(dataUrl);
          window.electronAPI.logToMain && window.electronAPI.logToMain(`[WHISPER AUDIO] Saved to: ${savedPath}`);
        } catch (err) {
          console.warn('Could not save Whisper audio file:', err);
        }
      }

      setWhisperStatus('Uploading to Whisper...');

      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;

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
      window.electronAPI && window.electronAPI.logToMain && 
        window.electronAPI.logToMain(`[WHISPER DEBUG] FormData preparado para requisição com idioma: pt`);

      let transcription;
      try {
        console.log('[WHISPER] Preparando para enviar áudio para API Whisper');
        window.electronAPI && window.electronAPI.logToMain && 
          window.electronAPI.logToMain(`[WHISPER] Preparando requisição com tamanho de áudio: ${audioBlob.size} bytes`);
        
        const whisperResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}` },
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

        transcription = whisperData.text?.trim() || '';
        console.log('[WHISPER] Transcrição extraída:', transcription);
        
        // Verificar se a transcrição está vazia e fornecer feedback apropriado
        if (!transcription) {
          console.warn('[WHISPER ALERTA] Transcrição vazia recebida da API');
          window.electronAPI && window.electronAPI.logToMain && 
            window.electronAPI.logToMain(`[WHISPER ALERTA] Transcrição vazia recebida da API`);
          
          // Definir uma mensagem mais informativa para o usuário
          setWhisperError('A transcrição retornou vazia. Possíveis causas: áudio muito curto, silencioso ou problema de conexão com a API.');
          setWhisperTranscription('[Transcrição vazia]');
          
          // Mesmo com transcrição vazia, tentar continuar e pedir ao modelo que explique o problema
          transcription = "A transcrição retornou vazia. Por favor, informe possíveis razões por que o serviço Whisper da OpenAI pode não ter conseguido transcrever meu áudio e dê dicas para melhorar a qualidade da gravação.";
        } else {
          setWhisperTranscription(transcription);
        }
        
        window.electronAPI && window.electronAPI.logToMain &&
          window.electronAPI.logToMain(`[WHISPER TRANSCRIPTION] ${transcription}`);
      } catch (err) {
        console.error('Whisper API error:', err);
        window.electronAPI && window.electronAPI.logToMain &&
          window.electronAPI.logToMain(`[WHISPER ERROR] ${err.message}`);
        setWhisperError('Whisper error: ' + err.message);
        setWhisperStatus('');
        setIsWhisperLoading(false);
        return;
      }

      setWhisperStatus('Generating answer...');
      try {
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
            Authorization: `Bearer ${key}`,
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
        setWhisperAnswer(answer);
        window.electronAPI && window.electronAPI.logToMain &&
          window.electronAPI.logToMain(`[WHISPER ANSWER] ${answer}`);
        setWhisperStatus('Done - Press ⌘+D to start a new recording');
      } catch (err) {
        setWhisperError('Chat error: ' + err.message);
      }
      setIsWhisperLoading(false);
    } catch (err) {
      setWhisperError('Recording error: ' + err.message);
      setWhisperStatus('Error - Press ⌘+D to try again');
      setIsWhisperLoading(false);

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }
  };

  useEffect(() => {
    handleWhisperRef.current = handleWhisper;
  }, [handleWhisper]);

  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = (event) => {
              setImageData(event.target.result);
              setCaptureInfo('Clipboard image captured! Press ⌘+Enter to analyze.');
              setTimeout(() => setCaptureInfo(''), 3000);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    const handleKeyDown = async (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();

        if (document.activeElement && document.activeElement.blur) {
          document.activeElement.blur();
        }

        await captureScreenshot();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        resetAll();
        setCaptureInfo('Reset complete. Ready for a new problem!');
        setTimeout(() => setCaptureInfo(''), 3000);
      }
    };

    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  const callGeminiAPI = async () => {
    if (!geminiApiKey) {
      setError('Gemini API key not set. Please add your Gemini API key in Settings.');
      return;
    }

    if (!imageData) {
      setError('Please capture a screenshot (⌘+S) or paste an image (⌘+V) to analyze with Gemini.');
      return;
    }

    setIsLoading(true);
    setError('');
    setCaptureInfo('Analyzing screenshot with Gemini...');

    try {
      console.log("[Gemini API Call] Model: gemini-2.0-flash, Prompt:", prompt);

      let imageContent;
      let cloudflareUrl;

      if (imageData.startsWith('data:')) {
        if (cloudflareAccount) {
          try {
            const formData = new FormData();
            const blob = await (await fetch(imageData)).blob();
            formData.append('file', blob);

            const cfResponse = await fetch(`https://upload.imagedelivery.net/${cloudflareAccount}`, {
              method: 'POST',
              body: formData,
            });

            if (!cfResponse.ok) {
              throw new Error('Failed to upload image to Cloudflare');
            }

            const cfData = await cfResponse.json();
            cloudflareUrl = cfData.result.variants[0];
            imageContent = {
              mimeType: blob.type,
              data: null,
              fileUri: cloudflareUrl
            };
          } catch (err) {
            console.error('Error uploading to Cloudflare:', err);
            const base64Data = imageData.split(',')[1];
            imageContent = {
              mimeType: imageData.split(';')[0].split(':')[1],
              data: base64Data
            };
          }
        } else {
          const base64Data = imageData.split(',')[1];
          imageContent = {
            mimeType: imageData.split(';')[0].split(':')[1],
            data: base64Data
          };
        }
      } else {
        imageContent = {
          mimeType: "image/jpeg",
          data: null,
          fileUri: imageData
        };
      }

      const geminiPayload = {
        contents: [
          {
            parts: [
              {
                text: prompt || "Analyze this image and explain what's in it."
              },
              {
                inline_data: imageContent
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        }
      };

      const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
      const geminiResponse = await fetch(`${apiUrl}?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(geminiPayload)
      });

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json();
        throw new Error(errorData.error?.message || 'Error calling Gemini API');
      }

      const geminiData = await geminiResponse.json();

      if (geminiData.candidates && geminiData.candidates.length > 0 &&
          geminiData.candidates[0].content && geminiData.candidates[0].content.parts) {
        setResponse(geminiData.candidates[0].content.parts[0].text);
      } else {
        throw new Error('Invalid or empty response from Gemini API');
      }

      setCaptureInfo('');
    } catch (err) {
      setError(err.message);
      setCaptureInfo('');
    } finally {
      setIsLoading(false);
    }
  };

  const callOpenAI = async () => {
    if (!apiKey) {
      if (geminiApiKey && imageData) {
        return callGeminiAPI();
      }

      setError('API key not set. Please add your OpenAI API key in Settings.');
      return;
    }

    if (imageData && imageData.startsWith('data:') && !cloudflareAccount) {
      setError('Cloudflare account not set. Please add your Cloudflare account hash in Settings.');
      return;
    }

    if (!prompt && !imageData) {
      setError('Please provide a problem description or capture a screenshot (⌘+V).');
      return;
    }

    setIsLoading(true);
    setError('');
    setCaptureInfo('Analyzing screenshot with OpenAI...');

    try {
      let payload = {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt }
            ]
          }
        ],
        max_tokens: 4096
      };

      console.log("[OpenAI API Call] Model: gpt-4o, Prompt:", prompt);

      if (imageData) {
        if (imageData.startsWith('data:')) {
          try {
            const formData = new FormData();
            const blob = await (await fetch(imageData)).blob();
            formData.append('file', blob);

            const cfResponse = await fetch(`https://upload.imagedelivery.net/${cloudflareAccount}`, {
              method: 'POST',
              body: formData,
            });

            if (!cfResponse.ok) {
              throw new Error('Failed to upload image to Cloudflare');
            }

            const cfData = await cfResponse.json();
            const cloudflareUrl = cfData.result.variants[0];

            payload.messages[0].content.push({
              type: "image_url",
              image_url: {
                url: cloudflareUrl
              }
            });
          } catch (err) {
            console.error('Error uploading to Cloudflare:', err);
            payload.messages[0].content.push({
              type: "image_url",
              image_url: {
                url: imageData
              }
            });
          }
        } else {
          payload.messages[0].content.push({
            type: "image_url",
            image_url: {
              url: imageData
            }
          });
        }
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Error calling OpenAI API');
      }

      const data = await response.json();
      setResponse(data.choices[0].message.content);

      setCaptureInfo('');
    } catch (err) {
      setError(err.message);
      setCaptureInfo('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isWhisperModalOpen) {
      setIsWhisperModalOpen(false);
      setWhisperAnswer('');
    }

    if (useGemini && geminiApiKey && imageData) {
      callGeminiAPI();
    } else {
      callOpenAI();
    }
  };

  const clearImage = () => {
    setImageData(null);
  };

  const resetAll = () => {
    setPrompt(DEFAULT_PROMPT);
    setResponse('');
    setImageData(null);
    setError('');
    setCaptureInfo('');
    setWhisperAnswer('');
    setWhisperError('');
    setWhisperStatus('Ready - Press ⌘+D to start/stop recording');
    setIsWhisperModalOpen(false);
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    });
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-bg-background">
        <div className="p-5 bg-bg-secondary border-b border-border flex gap-4">
          <div className="flex-1 flex flex-col gap-3">
            {apiKey && geminiApiKey && (
              <div className="flex items-center gap-2 p-1 rounded-md bg-bg-muted">
                <span className="text-sm text-content-secondary-foreground px-2">Model:</span>
                <Button 
                  className={`flex-1 py-1 text-sm ${!useGemini ? 'bg-bg-primary text-content-primary-foreground' : 'bg-transparent text-content-secondary-foreground hover:bg-bg-muted'}`}
                  size="sm"
                  variant={!useGemini ? "default" : "ghost"}
                  onClick={() => setUseGemini(false)}
                  disabled={isLoading}
                >
                  OpenAI
                </Button>
                <Button 
                  className={`flex-1 py-1 text-sm ${useGemini ? 'bg-bg-primary text-content-primary-foreground' : 'bg-transparent text-content-secondary-foreground hover:bg-bg-muted'}`}
                  size="sm"
                  variant={useGemini ? "default" : "ghost"}
                  onClick={() => setUseGemini(true)}
                  disabled={isLoading}
                >
                  Gemini
                </Button>
              </div>
            )}
            <Textarea
              placeholder={`Customize the prompt or describe the problem${useGemini && imageData ? ' (Gemini will analyze the image)' : ''}`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[150px] resize-y text-content-foreground"
            />
            <Button 
              className="w-full text-content-primary-foreground"
              onClick={handleSubmit} 
              disabled={isLoading || 
                (!prompt && !imageData) || 
                (!apiKey && !geminiApiKey) ||
                (useGemini && !geminiApiKey) ||
                (!useGemini && !apiKey)}
            >
              {isLoading ? "Generating..." : `Generate Analysis ${useGemini ? '(Gemini)' : '(OpenAI)'}`}
            </Button>
            {error && <div className="text-sm text-content-primary">{error}</div>}
          </div>

          {imageData && (
            <div className="relative w-[200px] flex-shrink-0">
              <img src={imageData} alt="Pasted screenshot" className="w-full h-[150px] object-cover rounded-md border border-border" />
              <button 
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-content-primary text-white flex items-center justify-center text-sm shadow-md"
                onClick={clearImage}
              >
                ×
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-1 text-xs text-center text-white rounded-b-md">
                <span>⌘+Enter to analyze</span>
              </div>
            </div>
          )}
        </div>

        {captureInfo && (
          <div className="fixed top-[70px] right-5 bg-content-foreground text-white py-2 px-4 rounded-md text-sm z-10 shadow-lg">
            {captureInfo}
          </div>
        )}

        {isWhisperModalOpen ? (
          <Card className="flex-1 m-5 border border-border">
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
                <span className="font-semibold text-content-primary">Whisper Voice Assistant</span>
                <button 
                  className="bg-transparent border-none text-content-muted-foreground text-xl cursor-pointer hover:text-content-foreground"
                  onClick={() => {
                    setIsWhisperModalOpen(false);
                    setWhisperAnswer('');
                  }}
                >
                  ×
                </button>
              </div>
              
              <div className="p-3 mb-4 bg-bg-muted rounded-md">
                {isWhisperLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-bg-primary border-t-transparent animate-spin"></div>
                    <span>{whisperStatus}</span>
                  </div>
                ) : (
                  <span className={whisperError ? "text-content-primary" : ""}>{whisperError || whisperStatus}</span>
                )}
              </div>
              
              <div className="p-4 border-l-3 border-l-bg-primary rounded-md bg-bg-secondary flex-grow flex flex-col max-h-[350px] overflow-auto">
                <div className="h-full">
                  {whisperAnswer ? (
                    <p className="text-content-foreground">{whisperAnswer}</p>
                  ) : (
                    !isWhisperLoading && !whisperError && <p className="text-content-muted-foreground italic">Response will appear here...</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          response && (
            <div 
              className="flex-1 overflow-auto p-5 flex flex-col outline-none scroll-smooth"
              ref={responseSectionRef}
              tabIndex="0"
              onClick={() => {
                responseSectionRef.current.focus();
              }}
              onKeyDown={(e) => {
                if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
                  const el = responseSectionRef.current;
                  const isModifierPressed = e.metaKey || e.ctrlKey;
                  const scrollAmount = isModifierPressed ? 200 : 60;

                  if (e.key === 'ArrowUp') {
                    el.scrollTop -= scrollAmount;
                  } else if (e.key === 'ArrowDown') {
                    el.scrollTop += scrollAmount;
                  }

                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <div 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  responseSectionRef.current.focus();
                }}
              >
                {formattedResponse.length > 0 ? formattedResponse.map((part, index) => (
                  part.type === 'code' ? (
                    <div key={`code-${index}`} className="my-5 rounded-md overflow-hidden bg-[#282c34] shadow-md border border-[#383c44]">
                      <div className="flex justify-between items-center px-4 py-2 bg-[#21252b] border-b border-[#383c44]">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-[#9cdcfe] uppercase">{part.language}</span>
                          {part.title && <span className="text-xs text-[#dcdcaa] pl-3 border-l border-[#3e3e3e]">{part.title}</span>}
                        </div>
                        <button 
                          className="text-xs py-1 px-3 rounded bg-[#3d424a] text-[#ddd] hover:bg-[#4a4f57] hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(part.content, index);
                          }}
                        >
                          {copiedIndex === index ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <SyntaxHighlighter
                        language={part.language}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: '0',
                          borderRadius: '0 0 4px 4px',
                          fontSize: '13px',
                          maxWidth: '100%',
                          background: 'rgba(30, 30, 30, 0.7)',
                        }}
                        wrapLongLines={false}
                        showLineNumbers={true}
                      >
                        {part.content}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <div key={`text-${index}`} className="mb-5 whitespace-pre-wrap break-words text-content-foreground">
                      {part.content.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < part.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  )
                )) : null}
              </div>
              {showScrollIndicator && (
                <div className="fixed bottom-5 right-5 bg-bg-primary text-content-primary-foreground px-4 py-2 rounded-md text-sm shadow-lg">
                  Scroll for more
                </div>
              )}
            </div>
          )
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </>
  );
};

export default OpenAI;
