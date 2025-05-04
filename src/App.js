import React, { useEffect, useState } from 'react';
import OpenAI from './components/OpenAI';
import Settings from './components/Settings';
import { Button } from './components/ui/button';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [cloudflareAccount, setCloudflareAccount] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [heightPercentage, setHeightPercentage] = useState('100');
  const [whisperDeviceId, setWhisperDeviceId] = useState('');

  // Load settings on component mount and when settings are updated
  useEffect(() => {
    const loadSettings = () => {
      const savedApiKey = localStorage.getItem('openai_api_key');
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }

      const savedCloudflareAccount = localStorage.getItem('cloudflare_account');
      if (savedCloudflareAccount) {
        setCloudflareAccount(savedCloudflareAccount);
      }
      
      const savedGeminiApiKey = localStorage.getItem('gemini_api_key');
      if (savedGeminiApiKey) {
        setGeminiApiKey(savedGeminiApiKey);
      }
      
      const savedHeightPercentage = localStorage.getItem('height_percentage');
      if (savedHeightPercentage) {
        setHeightPercentage(savedHeightPercentage);
      }

      // Load Whisper audio device selection
      const savedWhisperDevice = localStorage.getItem('whisper_device_id');
      if (savedWhisperDevice) {
        setWhisperDeviceId(savedWhisperDevice);
      }
    };

    // Load settings initially
    loadSettings();

    // Listen for settings updates
    window.addEventListener('settings-updated', loadSettings);

    return () => {
      window.removeEventListener('settings-updated', loadSettings);
    };
  }, []);

  // Handle keyboard shortcuts for app functionality
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Enter shortcut with Command/Control key for OpenAI generation
      const isModifierPressed = e.metaKey || e.ctrlKey;

      // Check for settings toggle with comma key
      if (isModifierPressed && (e.key === ',' || e.key === '<')) {
        e.preventDefault();
        toggleSettings();
        return;
      }
      
      // Don't handle screenshot shortcut here - let the OpenAI component handle it
      if (isModifierPressed && (e.key === 's' || e.key === 'S')) {
        return; // Skip processing - let OpenAI component handle this
      }

      // If settings are open, don't process other shortcuts - except ESC key which should propagate
      if (isSettingsOpen && e.key !== 'Escape') {
        return;
      }

      // Special OpenAI shortcuts - these should work even when in an input
      if (isModifierPressed) {
        // ⌘+Enter - trigger generation
        if (e.key === 'Enter') {
          e.preventDefault();
          // Find and click the generate button if it exists and not disabled
          const generateButton = document.querySelector('.submit-button');
          if (generateButton && !generateButton.disabled) {
            generateButton.click();
            return;
          } else if (document.querySelector('.image-preview')) {
            // If we have an image but button might be disabled, force call OpenAI
            // Directly call OpenAI if the image exists
            const openAIEvent = new CustomEvent('force-openai-call');
            window.dispatchEvent(openAIEvent);
            return;
          }
        }

        // ⌘+R - reset everything
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault(); // Prevent browser refresh
          console.log("⌘+R pressed - resetting");
          // Dispatch a custom event for the OpenAI component to handle
          window.dispatchEvent(new CustomEvent('reset-openai'));
          return;
        }

        // ⌘+P - switch to problem mode
        if (e.key === 'p' || e.key === 'P') {
          const problemModeButton = document.querySelector('.mode-button:first-child');
          if (problemModeButton) {
            e.preventDefault();
            problemModeButton.click();
            return;
          }
        }

        // ⌘+M - switch to solution mode
        if (e.key === 'm' || e.key === 'M') {
          const solutionModeButton = document.querySelector('.mode-button:last-child');
          if (solutionModeButton) {
            e.preventDefault();
            solutionModeButton.click();
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen]);

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const closeSettings = () => {
    console.log("Closing settings...");
    setIsSettingsOpen(false);
  };

  return (
    <div className="w-full h-screen bg-bg-background">
      <div className="flex flex-col w-full h-full" style={{ height: `${heightPercentage}vh` }}>
        <header className="flex justify-between items-center p-4 bg-bg-primary text-content-primary-foreground h-[60px] min-h-[60px]">
          <h1 className="text-xl font-semibold m-0">
            MeetCompanion
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${apiKey ? "bg-green-500" : "bg-red-500"}`}></span>
              <span>{apiKey ? "API Key Set" : "No API Key"}</span>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={toggleSettings}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              Settings
            </Button>
          </div>
        </header>
        
        <main className="flex-1 overflow-hidden">
          <OpenAI
            apiKey={apiKey}
            cloudflareAccount={cloudflareAccount}
            geminiApiKey={geminiApiKey}
            whisperDeviceId={whisperDeviceId}
          />
        </main>
      </div>

      {isSettingsOpen && (
        <Settings 
          onClose={closeSettings} 
        />
      )}
    </div>
  );
}

export default App;
