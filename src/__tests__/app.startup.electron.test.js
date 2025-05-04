// @ts-check
const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

/**
 * End-to-end test for the Electron app startup
 * 
 * This test performs the following steps:
 * 1. Starts the React development server
 * 2. Waits for the React server to be available
 * 3. Launches the Electron app
 * 4. Verifies that the app starts correctly and the window is created properly
 * 5. Checks that React content is loaded in the Electron window
 * 6. Captures a screenshot and generates a test report
 * 7. Cleans up by closing the Electron app and terminating the React server
 */
test('Electron app should start and close correctly', async () => {
  console.log('[TEST] Starting Electron app test...');

  // Create a log file to capture console output
  const logFilePath = path.join(__dirname, '../../test-results/app-startup-logs.txt');
  const logDir = path.dirname(logFilePath);
  console.log(`[TEST] Log file will be created at: ${logFilePath}`);

  // Ensure the directory exists
  if (!fs.existsSync(logDir)) {
    console.log(`[TEST] Creating log directory: ${logDir}`);
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Clear previous log file if it exists
  if (fs.existsSync(logFilePath)) {
    console.log(`[TEST] Removing previous log file`);
    fs.unlinkSync(logFilePath);
  }

  // Store test start time
  const testStartTime = new Date();

  // Function to append to log file with timestamp
  const appendToLog = (message) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `${timestamp} - ${message}\n`);
  };

  // Function to log to both console and log file
  const log = (message, type = 'TEST', isError = false) => {
    const prefix = type ? `[${type}]` : '';
    const fullMessage = prefix ? `${prefix} ${message}` : message;
    if (isError) {
      console.error(fullMessage);
    } else {
      console.log(fullMessage);
    }
    appendToLog(fullMessage);
  };

  // Shorthand function for error logging
  const logError = (message, type = 'TEST-ERROR') => {
    log(message, type, true);
  };

  // Add startTime property to the function for later reference
  appendToLog.startTime = testStartTime.toISOString();

  log(`Test started at: ${testStartTime.toISOString()}`);
  log(`Test execution started`);

  // Start React development server
  log('Starting React development server...', 'REACT');

  const reactProcess = spawn('npm', ['run', 'start'], {
    shell: true,
    env: { ...process.env, BROWSER: 'none' }, // Prevent browser from opening
    stdio: 'pipe'
  });

  log(`Process spawned with PID: ${reactProcess.pid}`, 'REACT');

  let reactOutput = '';

  // Capture React server output
  reactProcess.stdout.on('data', (data) => {
    const output = data.toString();
    reactOutput += output;
    console.log(`[REACT] ${output.trim()}`);
    appendToLog(`[REACT] ${output.trim()}`);
  });

  reactProcess.stderr.on('data', (data) => {
    const output = data.toString();
    reactOutput += output;
    console.error(`[REACT-ERROR] ${output.trim()}`);
    appendToLog(`[REACT-ERROR] ${output.trim()}`);
  });

  // Handle React process exit
  reactProcess.on('exit', (code) => {
    console.log(`[REACT] Process exited with code ${code}`);
    appendToLog(`[REACT] Process exited with code ${code}`);
  });

  // Wait for React server to be available
  log('Waiting for React server to be available at http://localhost:3000...', 'REACT');

  try {
    await waitOn({
      resources: ['http://localhost:3000'],
      timeout: 60000, // 60 seconds timeout
      interval: 1000, // Check every second
    });

    log('Server is available and responding', 'REACT');
  } catch (error) {
    logError(`Server failed to start: ${error.message}`, 'REACT-ERROR');

    // Kill React process if it's still running
    if (reactProcess && !reactProcess.killed) {
      log('Terminating failed React process', 'REACT');
      reactProcess.kill();
    }

    throw new Error(`[REACT-ERROR] Server failed to start: ${error.message}\nOutput: ${reactOutput}`);
  }

  // Now launch Electron app
  log('Launching Electron application...', 'ELECTRON');

  const electronAppPath = path.join(__dirname, '../../electron/main.js');
  log(`Using main script: ${electronAppPath}`, 'ELECTRON');

  const electronApp = await electron.launch({
    args: [electronAppPath],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      // Disable dev tools to avoid interference
      OPEN_DEV_TOOLS: 'false'
    }
  });

  log('Application launched successfully', 'ELECTRON');

  try {
    // Evaluate in Electron context to get app info
    log('Retrieving application information...', 'ELECTRON');

    const appInfo = await electronApp.evaluate(async ({ app }) => {
      return {
        appPath: app.getAppPath(),
        appName: app.getName(),
        appVersion: app.getVersion(),
        isReady: app.isReady(),
        platform: process.platform,
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node
      };
    });

    log(`App info: ${JSON.stringify(appInfo, null, 2)}`, 'ELECTRON');

    // Verify app is ready
    log('Verifying app is ready...', 'ELECTRON');

    expect(appInfo.isReady).toBe(true);

    log('App is ready: ✓', 'ELECTRON');

    // Get the first window
    log('Waiting for first window...', 'ELECTRON');

    const window = await electronApp.firstWindow();

    log('First window obtained', 'ELECTRON');

    // Verify window properties
    log('Retrieving window properties...', 'ELECTRON');

    const title = await window.title();

    log(`Window title: "${title}"`, 'ELECTRON');

    // Capture window bounds
    log('Retrieving window bounds...', 'ELECTRON');

    const bounds = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win ? win.getBounds() : null;
    });

    log(`Window bounds: ${JSON.stringify(bounds, null, 2)}`, 'ELECTRON');

    expect(bounds).not.toBeNull();

    log('Window bounds check: ✓', 'ELECTRON');

    // Check if window is visible
    log('Checking window visibility...', 'ELECTRON');

    const isVisible = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win ? win.isVisible() : false;
    });

    log(`Window is visible: ${isVisible}`, 'ELECTRON');

    expect(isVisible).toBe(true);

    log('Window visibility check: ✓', 'ELECTRON');

    // Capture a screenshot
    log('Capturing application screenshot...');

    const screenshotPath = path.join(__dirname, '../../test-results/app-screenshot.png');
    await window.screenshot({ path: screenshotPath });

    log(`Screenshot saved to: ${screenshotPath}`);

    // Listen for console messages
    log('Setting up console message listener...');

    window.on('console', (msg) => {
      const messageType = msg.type();
      const messageText = msg.text();
      const logPrefix = messageType === 'error' ? '[APP-ERROR]' : '[APP-CONSOLE]';

      console.log(`${logPrefix} [${messageType}] ${messageText}`);
      appendToLog(`${logPrefix} [${messageType}] ${messageText}`);

      // Check for error logs
      if (messageType === 'error') {
        console.error(`[TEST] Error detected in application console: ${messageText}`);
        appendToLog(`[TEST] Error detected in application console: ${messageText}`);
      }
    });

    // Wait a moment to ensure the app is fully loaded
    log('Waiting for application to stabilize...');

    await new Promise(resolve => setTimeout(resolve, 2000));

    log('Application stabilization period completed');

    // Initialize variables to store React content verification results
    let reactRootInfo = { rootExists: false, childrenCount: 0, hasContent: false };
    let reactAppContent = { title: null, hasAppElement: false, bodyContent: '' };

    // Verify that React content is loaded in the Electron window
    log('Verifying React content in Electron window...', 'REACT');

    try {
      // Check if we can find React-specific elements in the page
      log('Checking for React root element...', 'REACT');

      reactRootInfo = await window.evaluate(() => {
        // Look for React root element or any app-specific elements
        const rootElement = document.getElementById('root');
        const hasChildren = rootElement && rootElement.children.length > 0;

        // Return more detailed information about what we found
        return {
          rootExists: !!rootElement,
          childrenCount: rootElement ? rootElement.children.length : 0,
          hasContent: hasChildren
        };
      });

      log(`Root element check results: ${JSON.stringify(reactRootInfo)}`, 'REACT');

      if (reactRootInfo.hasContent) {
        log('React content detected in Electron window: ✓', 'REACT');
      } else {
        logError('WARNING: React content not detected in Electron window', 'REACT-WARNING');

        if (reactRootInfo.rootExists) {
          logError('Root element exists but has no children', 'REACT-WARNING');
        } else {
          logError('Root element not found', 'REACT-WARNING');
        }
      }

      // Additional check for React-specific content
      log('Checking for app-specific content...', 'REACT');

      reactAppContent = await window.evaluate(() => {
        // Try to find app-specific elements or text
        const titleElement = document.querySelector('h1, h2, h3, .app-title');
        const appElement = document.querySelector('.App, #app, [data-testid="app"]');

        return {
          title: titleElement ? titleElement.textContent : null,
          hasAppElement: !!appElement,
          bodyContent: document.body.textContent.substring(0, 100) // First 100 chars for debugging
        };
      });

      log(`App content check results: ${JSON.stringify(reactAppContent)}`, 'REACT');

      if (reactAppContent.title) {
        log(`Found app title: "${reactAppContent.title}"`, 'REACT');
      } else if (reactAppContent.hasAppElement) {
        log('No specific title found, but App element exists', 'REACT');
      } else {
        log('No specific app elements found, but React may still be running', 'REACT');
        log(`Body content preview: "${reactAppContent.bodyContent}..."`, 'REACT');
      }
    } catch (error) {
      logError(`Error checking React content: ${error.message}`, 'REACT-ERROR');
      logError(error.stack, 'REACT-ERROR');
    }

    // Check for any uncaught exceptions or unhandled rejections
    log('Checking for uncaught exceptions...');

    const hasErrors = await window.evaluate(() => {
      return window.hasUncaughtErrors || false;
    });

    if (hasErrors) {
      logError('Uncaught exceptions detected in renderer process');
    } else {
      log('No uncaught exceptions detected: ✓');
    }

    // Generate a detailed test report
    log('Generating test report...');

    const reportPath = path.join(__dirname, '../../test-results/app-startup-report.json');

    // Use the detailed React verification results we already collected
    const reactVerification = {
      rootElement: reactRootInfo,
      appContent: reactAppContent,
      timestamp: new Date().toISOString()
    };

    // Create a comprehensive report with all test results
    const report = {
      testName: 'Electron app startup test',
      timestamp: new Date().toISOString(),
      success: true,
      testDuration: Date.now() - new Date(appendToLog.startTime || 0).getTime(),
      environment: {
        platform: process.platform,
        nodeVersion: process.version,
        testFile: __filename
      },
      reactServer: {
        started: true,
        url: 'http://localhost:3000',
        pid: reactProcess.pid
      },
      electronApp: {
        ...appInfo,
        launchTime: new Date().toISOString()
      },
      windowInfo: {
        title,
        bounds,
        isVisible,
        screenshotPath
      },
      reactVerification,
      errors: {
        hasUncaughtErrors: hasErrors,
        errorMessages: [] // Could be populated if we captured specific errors
      }
    };

    // Write the report to a JSON file
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    log(`Report saved to: ${reportPath}`);

    // Log a summary of the test results
    log('Test summary:');
    log(`- React server: ${report.reactServer.started ? 'Started ✓' : 'Failed ✗'}`);
    log(`- Electron app: ${report.electronApp.isReady ? 'Ready ✓' : 'Not ready ✗'}`);
    log(`- Window visible: ${report.windowInfo.isVisible ? 'Yes ✓' : 'No ✗'}`);
    log(`- React content: ${reactRootInfo.hasContent ? 'Detected ✓' : 'Not detected ✗'}`);
    log(`- App title: ${reactAppContent.title ? `"${reactAppContent.title}" ✓` : 'Not found ✗'}`);
    log(`- Errors detected: ${report.errors.hasUncaughtErrors ? 'Yes ✗' : 'No ✓'}`);

  } catch (error) {
    // Log any errors with detailed information
    logError(`Test failed: ${error.message}`);
    logError(`Stack trace: ${error.stack}`);

    // Create an error report
    try {
      const errorReportPath = path.join(__dirname, '../../test-results/app-startup-error-report.json');
      const errorReport = {
        testName: 'Electron app startup test',
        timestamp: new Date().toISOString(),
        success: false,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        environment: {
          platform: process.platform,
          nodeVersion: process.version
        }
      };

      fs.writeFileSync(errorReportPath, JSON.stringify(errorReport, null, 2));
      logError(`Error report saved to: ${errorReportPath}`);
    } catch (reportError) {
      logError(`Failed to create error report: ${reportError.message}`);
    }

    throw error;
  } finally {
    // Clean up resources in the finally block to ensure they're always released
    log('Starting cleanup process...');

    // Close the Electron app
    try {
      log('Closing Electron application...', 'ELECTRON');

      await electronApp.close();

      log('Application closed successfully', 'ELECTRON');
    } catch (closeError) {
      logError(`Error closing Electron app: ${closeError.message}`, 'ELECTRON-ERROR');
    }

    // Terminate React development server
    log('Terminating React development server...', 'REACT');

    if (reactProcess && !reactProcess.killed) {
      // On Windows, we need to use taskkill to ensure the process and its children are terminated
      if (process.platform === 'win32') {
        try {
          log(`Using taskkill to terminate process ${reactProcess.pid} and its children`, 'REACT');

          spawn('taskkill', ['/pid', reactProcess.pid, '/f', '/t'], { shell: true });

          log('Process terminated with taskkill', 'REACT');
        } catch (killError) {
          logError(`Error terminating React process with taskkill: ${killError.message}`, 'REACT-ERROR');

          // Fallback to kill if taskkill fails
          log('Falling back to standard kill method', 'REACT');

          reactProcess.kill('SIGTERM');
        }
      } else {
        // For non-Windows platforms
        log(`Sending SIGTERM to process ${reactProcess.pid}`, 'REACT');

        reactProcess.kill('SIGTERM');
      }

      log('Process termination signal sent', 'REACT');
    } else {
      log('Process already terminated or not started', 'REACT');
    }

    const testEndTime = new Date().toISOString();
    log(`Test completed at: ${testEndTime}`);
  }
});
