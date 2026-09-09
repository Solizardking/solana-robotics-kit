/**
 * Solana GR00T Chrome Extension - Content Script
 * Injected into trading pages to capture charts, overlay analysis, and interact with page
 */

console.log('Solana GR00T Content Script loaded');

// State
let overlayElement = null;
let vibeCoder = null;
let analysisOverlay = null;
let isVoiceActive = false;
let isVisionActive = false;

// Initialize
function initialize() {
  console.log('Initializing GR00T assistant...');

  // Create UI elements
  createFloatingButton();
  createAnalysisOverlay();

  // Request current state from background
  chrome.runtime.sendMessage({ type: 'get_status' }, (response) => {
    if (response) {
      updateState(response);
    }
  });

  // Detect trading interface
  detectTradingInterface();
}

// Create floating GR00T button
function createFloatingButton() {
  const button = document.createElement('div');
  button.id = 'groot-floating-button';
  button.innerHTML = `
    <div class="groot-button-icon">
      <svg width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#14F195" opacity="0.2"/>
        <circle cx="16" cy="16" r="10" fill="#14F195"/>
        <path d="M16 10 L16 22 M10 16 L22 16" stroke="black" stroke-width="2"/>
      </svg>
    </div>
    <div class="groot-button-tooltip">GR00T Assistant</div>
  `;

  button.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    cursor: pointer;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  `;

  button.addEventListener('click', toggleQuickMenu);

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });

  document.body.appendChild(button);
}

// Create analysis overlay for showing insights on page
function createAnalysisOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'groot-analysis-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 320px;
    max-height: 400px;
    background: rgba(17, 24, 39, 0.95);
    border: 1px solid #14F195;
    border-radius: 12px;
    padding: 16px;
    z-index: 999998;
    display: none;
    color: white;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    backdrop-filter: blur(10px);
  `;

  analysisOverlay = overlay;
  document.body.appendChild(overlay);
}

// Toggle quick action menu
function toggleQuickMenu() {
  const menu = document.getElementById('groot-quick-menu');

  if (menu) {
    menu.remove();
    return;
  }

  const quickMenu = document.createElement('div');
  quickMenu.id = 'groot-quick-menu';
  quickMenu.innerHTML = `
    <div class="groot-menu-header">
      <span>GR00T Assistant</span>
      <button class="groot-close-btn">&times;</button>
    </div>
    <div class="groot-menu-items">
      <button class="groot-menu-item" data-action="capture">
        📸 Analyze Chart
      </button>
      <button class="groot-menu-item" data-action="voice">
        ${isVoiceActive ? '🔴' : '🎤'} Voice ${isVoiceActive ? 'ON' : 'OFF'}
      </button>
      <button class="groot-menu-item" data-action="vibe">
        💻 Vibe Coder
      </button>
      <button class="groot-menu-item" data-action="positions">
        📊 Positions
      </button>
      <button class="groot-menu-item" data-action="stop" style="color: #EF4444;">
        🛑 Emergency Stop
      </button>
    </div>
  `;

  quickMenu.style.cssText = `
    position: fixed;
    bottom: 150px;
    right: 20px;
    width: 240px;
    background: rgba(17, 24, 39, 0.98);
    border: 1px solid #14F195;
    border-radius: 12px;
    padding: 12px;
    z-index: 999999;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    backdrop-filter: blur(10px);
    animation: slideIn 0.2s ease-out;
  `;

  document.body.appendChild(quickMenu);

  // Add event listeners
  quickMenu.querySelector('.groot-close-btn').addEventListener('click', () => {
    quickMenu.remove();
  });

  quickMenu.querySelectorAll('.groot-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const action = e.target.closest('.groot-menu-item').dataset.action;
      handleQuickAction(action);
      quickMenu.remove();
    });
  });
}

// Handle quick actions
async function handleQuickAction(action) {
  switch (action) {
    case 'capture':
      await captureAndAnalyzeChart();
      break;

    case 'voice':
      toggleVoice();
      break;

    case 'vibe':
      openVibeCoder();
      break;

    case 'positions':
      showPositions();
      break;

    case 'stop':
      emergencyStop();
      break;
  }
}

// Capture chart and send for analysis
async function captureAndAnalyzeChart() {
  console.log('Capturing chart for analysis...');

  showNotification('Capturing chart...', 'info');

  try {
    // Find chart element
    const chartElement = findChartElement();

    if (!chartElement) {
      showNotification('Could not find chart', 'error');
      return;
    }

    // Capture screenshot of chart area
    const canvas = await html2canvas(chartElement, {
      backgroundColor: null,
      scale: 2
    });

    // Convert to base64
    const imageData = canvas.toDataURL('image/png');

    // Detect trading pair from page
    const pair = detectTradingPair();

    // Send to background for analysis
    chrome.runtime.sendMessage({
      type: 'analyze_chart',
      image: imageData,
      pair: pair,
      timeframe: '1m'
    }, (response) => {
      if (response.success) {
        showNotification('Analyzing...', 'info');
      } else {
        showNotification('Analysis failed: ' + response.error, 'error');
      }
    });

  } catch (error) {
    console.error('Error capturing chart:', error);
    showNotification('Capture failed', 'error');
  }
}

// Find chart element on page
function findChartElement() {
  // Try common chart container selectors
  const selectors = [
    'canvas[id*="chart"]',
    'div[class*="chart"]',
    'div[class*="tradingview"]',
    '#trading-chart',
    '.chart-container',
    'canvas.tv-lightweight-chart'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log('Found chart element:', selector);
      return element;
    }
  }

  // Fallback: capture visible viewport
  console.log('Chart element not found, using viewport');
  return document.body;
}

// Detect trading pair from page content
function detectTradingPair() {
  // Try to find pair in various locations
  const patterns = [
    /SOL\/USDC/i,
    /SOL\/USD/i,
    /SOLUSDC/i,
    /\bSOL\b/i
  ];

  const text = document.body.innerText;

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return 'SOL/USDC'; // Default
}

// Toggle voice commands
function toggleVoice() {
  isVoiceActive = !isVoiceActive;

  chrome.runtime.sendMessage({
    type: 'update_settings',
    settings: { voiceEnabled: isVoiceActive }
  });

  if (isVoiceActive) {
    startVoiceListening();
    showNotification('Voice commands active', 'success');
  } else {
    stopVoiceListening();
    showNotification('Voice commands stopped', 'info');
  }
}

// Start voice listening
function startVoiceListening() {
  // Create voice indicator
  const indicator = document.createElement('div');
  indicator.id = 'groot-voice-indicator';
  indicator.innerHTML = '🎤 Listening...';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(20, 241, 149, 0.95);
    color: black;
    padding: 12px 24px;
    border-radius: 24px;
    font-weight: 600;
    z-index: 999999;
    animation: pulse 1.5s infinite;
  `;

  document.body.appendChild(indicator);

  // Start speech recognition
  if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        console.log('Voice command:', transcript);

        // Send to background
        chrome.runtime.sendMessage({
          type: 'voice_command',
          command: transcript
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      if (isVoiceActive) {
        recognition.start(); // Restart if still active
      }
    };

    recognition.start();
    window.grootVoiceRecognition = recognition;
  }
}

// Stop voice listening
function stopVoiceListening() {
  const indicator = document.getElementById('groot-voice-indicator');
  if (indicator) {
    indicator.remove();
  }

  if (window.grootVoiceRecognition) {
    window.grootVoiceRecognition.stop();
    window.grootVoiceRecognition = null;
  }
}

// Open vibe coder
function openVibeCoder() {
  if (vibeCoder) {
    vibeCoder.style.display = 'flex';
    return;
  }

  vibeCoder = document.createElement('div');
  vibeCoder.id = 'groot-vibe-coder';
  vibeCoder.innerHTML = `
    <div class="vibe-coder-container">
      <div class="vibe-coder-header">
        <h3>💻 Vibe Coder</h3>
        <button class="vibe-close-btn">&times;</button>
      </div>
      <div class="vibe-coder-content">
        <textarea
          class="vibe-input"
          placeholder="Describe your strategy in plain English...&#10;&#10;Example: Buy SOL when RSI drops below 30 and sell when it goes above 70"
        ></textarea>
        <div class="vibe-actions">
          <button class="vibe-btn vibe-generate-btn">Generate Code</button>
          <button class="vibe-btn vibe-execute-btn" disabled>Execute</button>
        </div>
        <div class="vibe-output">
          <div class="vibe-code-container" style="display:none;">
            <div class="vibe-code-header">Generated Code:</div>
            <pre class="vibe-code"></pre>
          </div>
          <div class="vibe-result-container" style="display:none;">
            <div class="vibe-result-header">Result:</div>
            <pre class="vibe-result"></pre>
          </div>
        </div>
      </div>
    </div>
  `;

  vibeCoder.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9999999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  document.body.appendChild(vibeCoder);

  // Event listeners
  vibeCoder.querySelector('.vibe-close-btn').addEventListener('click', () => {
    vibeCoder.style.display = 'none';
  });

  vibeCoder.querySelector('.vibe-generate-btn').addEventListener('click', async () => {
    const prompt = vibeCoder.querySelector('.vibe-input').value;
    if (!prompt) return;

    // Show loading
    const generateBtn = vibeCoder.querySelector('.vibe-generate-btn');
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    // Send to background
    chrome.runtime.sendMessage({
      type: 'vibe_code',
      prompt: prompt,
      context: {
        pair: detectTradingPair(),
        page: window.location.href
      }
    });
  });

  vibeCoder.querySelector('.vibe-execute-btn').addEventListener('click', async () => {
    const code = vibeCoder.querySelector('.vibe-code').textContent;

    // Execute code
    chrome.runtime.sendMessage({
      type: 'execute_code',
      code: code,
      language: 'python'
    });

    // Show loading
    vibeCoder.querySelector('.vibe-execute-btn').disabled = true;
    vibeCoder.querySelector('.vibe-execute-btn').textContent = 'Executing...';
  });
}

// Show positions
function showPositions() {
  // Request positions from background
  chrome.runtime.sendMessage({ type: 'get_positions' }, (response) => {
    if (response && response.positions) {
      displayPositions(response.positions);
    }
  });
}

// Display positions in overlay
function displayPositions(positions) {
  analysisOverlay.innerHTML = `
    <div class="analysis-header">
      <h3>Active Positions</h3>
      <button class="analysis-close-btn">&times;</button>
    </div>
    <div class="positions-list">
      ${positions.length === 0 ? '<p>No active positions</p>' : positions.map(pos => `
        <div class="position-item">
          <div class="position-symbol">${pos.symbol}</div>
          <div class="position-details">
            <span class="${pos.pnl >= 0 ? 'profit' : 'loss'}">
              ${pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)} SOL
            </span>
            <span>${pos.amount} @ ${pos.entry_price}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  analysisOverlay.style.display = 'block';

  analysisOverlay.querySelector('.analysis-close-btn').addEventListener('click', () => {
    analysisOverlay.style.display = 'none';
  });
}

// Emergency stop
function emergencyStop() {
  if (confirm('⚠️ EMERGENCY STOP\n\nThis will immediately stop all trading and close all positions.\n\nAre you sure?')) {
    chrome.runtime.sendMessage({ type: 'emergency_stop' });
    showNotification('EMERGENCY STOP ACTIVATED', 'error');
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `groot-notification groot-notification-${type}`;
  notification.textContent = message;

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    font-weight: 500;
    z-index: 9999999;
    animation: slideInRight 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;

  // Type-specific styling
  const colors = {
    info: { bg: '#3B82F6', text: 'white' },
    success: { bg: '#14F195', text: 'black' },
    error: { bg: '#EF4444', text: 'white' },
    warning: { bg: '#F59E0B', text: 'black' }
  };

  const color = colors[type] || colors.info;
  notification.style.background = color.bg;
  notification.style.color = color.text;

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Detect trading interface
function detectTradingInterface() {
  const hostname = window.location.hostname;

  if (hostname.includes('jup.ag')) {
    console.log('Detected Jupiter interface');
  } else if (hostname.includes('raydium.io')) {
    console.log('Detected Raydium interface');
  } else if (hostname.includes('orca.so')) {
    console.log('Detected Orca interface');
  } else {
    console.log('Unknown trading interface');
  }
}

// Update state from background
function updateState(state) {
  isVoiceActive = state.voiceEnabled;
  isVisionActive = state.visionEnabled;

  console.log('State updated:', state);
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received:', message.type);

  switch (message.type) {
    case 'show_analysis':
      displayAnalysis(message.analysis);
      break;

    case 'voice_transcript':
      showNotification(`You said: "${message.text}"`, 'info');
      break;

    case 'code_result':
      if (vibeCoder) {
        const generateBtn = vibeCoder.querySelector('.vibe-generate-btn');
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Code';

        if (message.result) {
          // Show generated code
          vibeCoder.querySelector('.vibe-code-container').style.display = 'block';
          vibeCoder.querySelector('.vibe-code').textContent = message.result.code || message.result;
          vibeCoder.querySelector('.vibe-execute-btn').disabled = false;
        }

        if (message.error) {
          showNotification('Code generation failed', 'error');
        }
      }
      break;

    case 'capture_chart':
      captureAndAnalyzeChart();
      break;

    case 'open_vibe_coder':
      openVibeCoder();
      break;

    case 'extension_state':
      updateState(message);
      break;
  }

  sendResponse({ success: true });
  return true;
});

// Display analysis results
function displayAnalysis(analysis) {
  analysisOverlay.innerHTML = `
    <div class="analysis-header">
      <h3>📊 Chart Analysis</h3>
      <button class="analysis-close-btn">&times;</button>
    </div>
    <div class="analysis-content">
      <div class="analysis-signal ${analysis.signal.toLowerCase()}">
        ${analysis.signal}
      </div>
      <div class="analysis-detail">
        <span>Confidence:</span>
        <strong>${analysis.confidence.toFixed(1)}%</strong>
      </div>
      <div class="analysis-detail">
        <span>Pattern:</span>
        <strong>${analysis.pattern}</strong>
      </div>
      <div class="analysis-detail">
        <span>Predicted Move:</span>
        <strong>${analysis.predicted_move > 0 ? '+' : ''}${analysis.predicted_move.toFixed(2)}%</strong>
      </div>
      <div class="analysis-detail">
        <span>Support:</span>
        <strong>$${analysis.support.toFixed(2)}</strong>
      </div>
      <div class="analysis-detail">
        <span>Resistance:</span>
        <strong>$${analysis.resistance.toFixed(2)}</strong>
      </div>
      <div class="analysis-detail">
        <span>Risk/Reward:</span>
        <strong>${analysis.risk_reward.toFixed(2)}:1</strong>
      </div>
    </div>
  `;

  analysisOverlay.style.display = 'block';

  analysisOverlay.querySelector('.analysis-close-btn').addEventListener('click', () => {
    analysisOverlay.style.display = 'none';
  });

  showNotification('Analysis complete!', 'success');
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Load html2canvas library for screenshots
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
document.head.appendChild(script);

console.log('Solana GR00T Content Script initialized');
