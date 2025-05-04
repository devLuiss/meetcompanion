import React from 'react';
import { Card, CardContent } from '../ui/card';

/**
 * Componente para exibir a interface do assistente de voz Whisper
 */
const WhisperAssistant = ({ 
  isOpen, 
  onClose, 
  isLoading, 
  status, 
  error, 
  answer
}) => {
  if (!isOpen) return null;
  
  return (
    <Card className="flex-1 m-5 border border-border">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
          <span className="font-semibold text-content-primary">Whisper Voice Assistant</span>
          <button 
            className="bg-transparent border-none text-content-muted-foreground text-xl cursor-pointer hover:text-content-foreground"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div className="p-3 mb-4 bg-bg-muted rounded-md">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-bg-primary border-t-transparent animate-spin"></div>
              <span>{status}</span>
            </div>
          ) : (
            <span className={error ? "text-content-primary" : ""}>{error || status}</span>
          )}
        </div>
        
        <div className="p-4 border-l-3 border-l-bg-primary rounded-md bg-bg-secondary flex-grow flex flex-col max-h-[350px] overflow-auto">
          <div className="h-full">
            {answer ? (
              <p className="text-content-foreground">{answer}</p>
            ) : (
              !isLoading && !error && <p className="text-content-muted-foreground italic">Response will appear here...</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhisperAssistant;