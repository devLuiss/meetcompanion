# Stupid LeetCode Club

## About

Let's face it - LeetCode problems can make anyone feel stupid. But hey, we're all in this together! This app is your friendly AI companion that helps you understand, solve, and learn from LeetCode problems. No judgment, just help when you need it.

## Important Notice

This software is licensed for **PERSONAL USE ONLY**. You may not use it for commercial purposes or redistribute it. See the [LICENSE](LICENSE) file for full terms.

## Features

- 🧠 AI-powered problem analysis (when your brain needs a break)
- 📸 Quick screenshot capture (because copy-paste is too mainstream)
- 💡 Detailed explanations (in human language, not alien code)
- ⚡️ Time & space complexity analysis (the stuff that makes us feel extra stupid)
- 🔍 Edge cases consideration (those sneaky test cases that always get us)
- 🎯 Focused interface (no distractions, just solutions)
 - 🎙️ Voice transcription via OpenAI Whisper (select microphone in Settings and press ⌘/Ctrl+D)

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/lucasmontano/stupid-leetcode-club.git
cd stupid-leetcode-club
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:

**For macOS/Linux:**
```bash
npm run electron:dev
```

**For Windows:**
```bash
npm run electron:dev:win
```
> Note: The Windows-specific script includes a longer timeout to ensure the React server has enough time to start.

4. Add your API keys in Settings (see API Keys section below)
5. Start solving LeetCode problems!

## Building for Production

1. Build the React application:
```bash
npm run build
```

2. Package for all platforms:
```bash
npm run dist
```

**Platform-specific builds:**
```bash
npm run dist:mac    # MacOS only
npm run dist:win    # Windows only
npm run dist:linux  # Linux only
```

> Note: The packaged applications will be available in the `dist` directory.

## Setting Up API Keys

### OpenAI API Key

1. Create an OpenAI account at [https://openai.com](https://openai.com) if you don't already have one
2. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. Click "Create new secret key"
4. Copy your API key (starts with "sk-")
5. Open the LeetCode Helper app and click "Settings"
6. Paste your API key in the "OpenAI API Key" field
7. Click "Save"

* This key is also used for Whisper audio transcription (press ⌘/Ctrl+D to transcribe).

### Cloudflare Account Hash

For image analysis, you'll need a Cloudflare account to handle image uploads:

1. Sign up for a Cloudflare account at [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Once logged in, go to "Images" in the dashboard
3. Create a new Images service if you don't have one
4. Look for your Account Hash in the URL of your Images dashboard: `https://dash.cloudflare.com/<your-account-hash>/images/variants`
5. Copy your account hash
6. Open the LeetCode Helper app and click "Settings"
7. Paste your account hash in the "Cloudflare Account Hash" field
8. Click "Save"
 9. [Optional] If you want voice transcription, open Settings, select your audio input device under "Whisper Input Device", then click "Save".

## Keyboard Shortcuts

### Basic Controls
- `⌘S` / `Ctrl+S`: Capture Screenshot
- `⌘Enter` / `Ctrl+Enter`: Analyze Screenshot
- `⌘R` / `Ctrl+R`: Reset Everything
- `⌘D` / `Ctrl+D`: Transcribe audio with Whisper (configurable in Settings)

### Navigation
- `⌘,` / `Ctrl+,`: Toggle Settings Panel
- Arrow Keys (`↑↓←→`): Move window
- `⌘ + Arrow Keys`: Move window faster
- `⌘⌥ + Arrow Keys`: Move window globally (macOS)

## E2E Testing

To run the end-to-end startup tests for the Electron application:

```bash
npm run test:e2e
```

This command will automatically generate HTML and JSON reports.

The tests will:
1. Start the React development server
2. Launch the Electron app
3. Verify the app starts correctly
4. Generate logs, screenshots, and reports

Test results are saved in:
- `playwright-report/`: Contains HTML reports
- `test-results/`: Contains logs, screenshots, and JSON reports

If you encounter issues, please create a GitHub issue and attach the contents of these directories to help with debugging.

## Contributing

Found a bug? Made it less stupid? Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed for personal use only - see the [LICENSE](LICENSE) file for details.

### License Summary:
- ✅ Personal use
- ✅ Learning from the code
- ✅ Personal modifications
- ❌ Commercial use
- ❌ Redistribution
- ❌ Sublicensing

## Troubleshooting

### MacOS Permissions
The app requires the following permissions on MacOS:
- **Screen Recording**: Required for screenshot capture functionality
- **Accessibility**: Required for window positioning and global keyboard shortcuts

To enable these permissions:
1. Go to System Preferences/Settings > Security & Privacy > Privacy
2. Enable permissions for the app in both "Screen Recording" and "Accessibility" sections
3. Restart the app after enabling permissions

## Remember

Every great programmer was once a stupid LeetCoder. You're not alone in this journey! 💪
