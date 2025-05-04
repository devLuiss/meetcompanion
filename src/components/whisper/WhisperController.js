import React, { useCallback, useRef, useState } from 'react';
import whisperService, { processAudioWithWhisper, processChatWithTranscription } from '../../services/whisperService';
import FormattedResponse from '../FormattedResponse';
import { Button } from '../ui/button';

const WhisperController = ({ apiKey, setError }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const promptRef = useRef();

  const toggleRecording = useCallback(async () => {
    try {
      if (isRecording) {
        setIsProcessing(true);
        const recordingData = await whisperService.stopRecording();
        
        if (recordingData && recordingData.audioBlob) {
          // Processar com a API Whisper
          const { transcription: result } = await processAudioWithWhisper(
            recordingData.audioBlob,
            apiKey
          );
          setTranscription(result);
          
          // Processar com o ChatGPT se houver um prompt
          if (promptRef.current?.value?.trim()) {
            const answer = await processChatWithTranscription(
              promptRef.current.value,
              result,
              apiKey
            );
            setAiResponse(answer);
          }
        }
        
        setIsRecording(false);
        setIsProcessing(false);
      } else {
        await whisperService.startRecording();
        setIsRecording(true);
      }
    } catch (err) {
      console.error('Erro ao processar áudio:', err);
      setError(err.message || 'Erro ao processar áudio');
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, [isRecording, apiKey, setError]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Button
            onClick={toggleRecording}
            disabled={isProcessing}
            variant={isRecording ? "destructive" : "default"}
          >
            {isRecording ? "Parar Gravação" : "Iniciar Gravação"}
          </Button>
        </div>
        
        <div className="flex flex-col space-y-2 mt-2">
          <label htmlFor="prompt" className="text-sm font-medium">
            Prompt para o ChatGPT (opcional):
          </label>
          <textarea
            id="prompt"
            ref={promptRef}
            className="border p-2 rounded-md"
            placeholder="Digite um prompt para contextualizar a transcrição..."
            rows={2}
          />
        </div>
      </div>
      
      {isProcessing && (
        <div className="p-2 bg-yellow-100 rounded-md">
          Processando áudio...
        </div>
      )}
      
      {transcription && (
        <div className="space-y-2">
          <h3 className="font-medium">Transcrição:</h3>
          <div className="p-2 bg-gray-100 rounded-md whitespace-pre-wrap">
            {transcription}
          </div>
        </div>
      )}
      
      {aiResponse && (
        <div className="space-y-2">
          <h3 className="font-medium">Resposta do ChatGPT:</h3>
          <FormattedResponse content={aiResponse} />
        </div>
      )}
    </div>
  );
};

export default WhisperController;