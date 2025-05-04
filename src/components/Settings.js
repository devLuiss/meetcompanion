import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';

// Settings component
const Settings = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [cloudflareAccount, setCloudflareAccount] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [heightPercentage, setHeightPercentage] = useState('100');
  const [clickThrough, setClickThrough] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const inputRef = useRef(null);

  // Focus the input field when modal opens
  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    return () => {
      console.log("Settings cleanup effect");
    };
  }, []);

  // Load settings from localStorage when component mounts
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    const savedCloudflareAccount = localStorage.getItem('cloudflare_account');
    const savedGeminiApiKey = localStorage.getItem('gemini_api_key');
    const savedHeightPercentage = localStorage.getItem('height_percentage');
    const savedClickThrough = localStorage.getItem('click_through') === 'true';

    if (savedApiKey) {
      setApiKey(savedApiKey);
    }

    if (savedCloudflareAccount) {
      setCloudflareAccount(savedCloudflareAccount);
    }
    
    if (savedGeminiApiKey) {
      setGeminiApiKey(savedGeminiApiKey);
    }
    
    if (savedHeightPercentage) {
      setHeightPercentage(savedHeightPercentage);
    }

    setClickThrough(savedClickThrough);
    
    const savedDeviceId = localStorage.getItem('whisper_device_id');
    if (savedDeviceId) {
      setSelectedDeviceId(savedDeviceId);
    }

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, []);
  
  // Enumerate audio input devices for Whisper
  useEffect(() => {
    async function loadAudioDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputDevices = devices.filter(d => d.kind === 'audioinput');
        setAudioDevices(inputDevices);
      } catch (err) {
        console.error('Error loading audio devices', err);
      }
    }
    loadAudioDevices();
  }, []);

  // Handle ESC key to close settings
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);

    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const handleSave = () => {
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('cloudflare_account', cloudflareAccount);
    localStorage.setItem('gemini_api_key', geminiApiKey);
    localStorage.setItem('height_percentage', heightPercentage);
    localStorage.setItem('click_through', clickThrough);
    localStorage.setItem('whisper_device_id', selectedDeviceId);
    setIsSaved(true);

    window.dispatchEvent(new Event('settings-updated'));

    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  const handleApiKeyChange = (e) => {
    const newValue = e.target.value;
    setApiKey(newValue);
  };

  const handleCloudflareAccountChange = (e) => {
    const newValue = e.target.value;
    setCloudflareAccount(newValue);
  };
  
  const handleGeminiApiKeyChange = (e) => {
    const newValue = e.target.value;
    setGeminiApiKey(newValue);
  };

  const handleHeightPercentageChange = (e) => {
    const newValue = e.target.value;
    if (newValue === '' || (parseInt(newValue) >= 1 && parseInt(newValue) <= 100)) {
      setHeightPercentage(newValue);
    }
  };

  const handleClickThroughChange = () => {
    setClickThrough(!clickThrough);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && apiKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="max-w-md">
      <DialogHeader className="bg-bg-primary text-content-primary-foreground">
        <DialogTitle>Settings</DialogTitle>
        <button 
          className="absolute top-4 right-4 text-content-primary-foreground hover:bg-white/20 rounded-full w-6 h-6 flex items-center justify-center"
          onClick={onClose}
          type="button"
          aria-label="Close settings"
        >
          ×
        </button>
      </DialogHeader>
      
      <DialogContent>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium text-content-foreground">
              OpenAI API Key
            </label>
            <Input
              ref={inputRef}
              id="api-key"
              type="password"
              value={apiKey}
              onChange={handleApiKeyChange}
              onKeyDown={handleKeyDown}
              placeholder="sk-..."
              autoComplete="off"
              spellCheck="false"
            />
            <p className="text-xs text-content-muted-foreground">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="cloudflare-account" className="text-sm font-medium text-content-foreground">
              Cloudflare Account Hash
            </label>
            <Input
              id="cloudflare-account"
              type="text"
              value={cloudflareAccount}
              onChange={handleCloudflareAccountChange}
              onKeyDown={handleKeyDown}
              placeholder="your-account-hash"
              autoComplete="off"
              spellCheck="false"
            />
            <p className="text-xs text-content-muted-foreground">
              Your Cloudflare account hash for image uploads.
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="gemini-api-key" className="text-sm font-medium text-content-foreground">
              Gemini API Key
            </label>
            <Input
              id="gemini-api-key"
              type="password"
              value={geminiApiKey}
              onChange={handleGeminiApiKeyChange}
              onKeyDown={handleKeyDown}
              placeholder="AIza..."
              autoComplete="off"
              spellCheck="false"
            />
            <p className="text-xs text-content-muted-foreground">
              Your Gemini API key for image analysis support.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="height-percentage" className="text-sm font-medium text-content-foreground">
              Window Height (%)
            </label>
            <Input
              id="height-percentage"
              type="number"
              min="1"
              max="100"
              value={heightPercentage}
              onChange={handleHeightPercentageChange}
              onKeyDown={handleKeyDown}
              placeholder="100"
              autoComplete="off"
              spellCheck="false"
            />
            <p className="text-xs text-content-muted-foreground">
              Window height as percentage of screen height (1-100%).
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div 
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${clickThrough ? 'bg-bg-primary' : 'bg-bg-muted'}`}
                onClick={handleClickThroughChange}
              >
                <span 
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    clickThrough ? 'translate-x-6' : 'translate-x-1'
                  }`} 
                />
              </div>
              <span className="text-sm font-medium text-content-foreground">Enable Click-Through</span>
            </div>
            <p className="text-xs text-content-muted-foreground">
              When enabled, clicks will pass through the app except when hovering over React components.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="whisper-device" className="text-sm font-medium text-content-foreground">
              Whisper Input Device
            </label>
            <select
              id="whisper-device"
              value={selectedDeviceId}
              onChange={e => setSelectedDeviceId(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-content-primary"
            >
              {audioDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || device.deviceId}
                </option>
              ))}
            </select>
            <p className="text-xs text-content-muted-foreground">
              Select the audio input device for Whisper transcription.
            </p>
          </div>

          <Card className="border border-border bg-bg-secondary p-4">
            <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="inline-block bg-bg-muted px-2 py-1 rounded text-xs font-mono">⌘,</span>
                <span className="text-content-secondary-foreground">Toggle settings panel</span>
              </div>
              <div className="flex justify-between">
                <span className="inline-block bg-bg-muted px-2 py-1 rounded text-xs font-mono">Ctrl+D</span>
                <span className="text-content-secondary-foreground">Record & Transcribe audio</span>
              </div>
              <div className="flex justify-between">
                <span className="inline-block bg-bg-muted px-2 py-1 rounded text-xs font-mono">Ctrl+S</span>
                <span className="text-content-secondary-foreground">Capture screenshot</span>
              </div>
              <div className="flex justify-between">
                <span className="inline-block bg-bg-muted px-2 py-1 rounded text-xs font-mono">⌘⏎</span>
                <span className="text-content-secondary-foreground">Analyze screenshot</span>
              </div>
              <div className="flex justify-between">
                <span className="inline-block bg-bg-muted px-2 py-1 rounded text-xs font-mono">⌘R</span>
                <span className="text-content-secondary-foreground">Reset everything</span>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
      
      <DialogFooter className="bg-bg-secondary p-4 border-t border-border">
        <Button 
          onClick={handleSave}
          disabled={!apiKey}
          className="w-full sm:w-auto"
        >
          {isSaved ? "Saved!" : "Save"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default Settings;
