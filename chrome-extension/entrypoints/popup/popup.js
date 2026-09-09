/**
 * Solana GR00T Chrome Extension - Popup Script
 */

// DOM elements
const statusIndicator = document.getElementById('status-indicator');
const connectionSection = document.getElementById('connection-section');
const featuresSection = document.getElementById('features-section');
const actionsSection = document.getElementById('actions-section');
const statsSection = document.getElementById('stats-section');
const emergencySection = document.getElementById('emergency-section');

const connectionUrlInput = document.getElementById('connection-url');
const apiKeyInput = document.getElementById('api-key');
const connectBtn = document.getElementById('connect-btn');

const visionToggle = document.getElementById('vision-toggle');
const voiceToggle = document.getElementById('voice-toggle');
const autoToggle = document.getElementById('auto-toggle');
const alertsToggle = document.getElementById('alerts-toggle');

const analyzeBtn = document.getElementById('analyze-btn');
const vibeBtn = document.getElementById('vibe-btn');
const positionsBtn = document.getElementById('positions-btn');
const balanceBtn = document.getElementById('balance-btn');
const emergencyStopBtn = document.getElementById('emergency-stop-btn');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await updateStatus();
  setupEventListeners();
});

// Load saved settings
async function loadSettings() {
  const settings = await chrome.storage.local.get([
    'connectionUrl',
    'apiKey',
    'voiceEnabled',
    'visionEnabled',
    'autoExecutionEnabled',
    'alertsEnabled'
  ]);

  if (settings.connectionUrl) {
    connectionUrlInput.value = settings.connectionUrl;
  }

  if (settings.apiKey) {
    apiKeyInput.value = settings.apiKey;
  }

  visionToggle.checked = settings.visionEnabled || false;
  voiceToggle.checked = settings.voiceEnabled || false;
  autoToggle.checked = settings.autoExecutionEnabled || false;
  alertsToggle.checked = settings.alertsEnabled !== false;
}

// Save settings
async function saveSettings() {
  await chrome.storage.local.set({
    connectionUrl: connectionUrlInput.value,
    apiKey: apiKeyInput.value,
    voiceEnabled: voiceToggle.checked,
    visionEnabled: visionToggle.checked,
    autoExecutionEnabled: autoToggle.checked,
    alertsEnabled: alertsToggle.checked
  });
}

// Update status display
async function updateStatus() {
  chrome.runtime.sendMessage({ type: 'get_status' }, (response) => {
    if (response && response.connected) {
      setConnectedState();
    } else {
      setDisconnectedState();
    }
  });
}

// Set connected state
function setConnectedState() {
  statusIndicator.classList.add('connected');
  statusIndicator.classList.remove('disconnected');
  statusIndicator.querySelector('.status-text').textContent = 'Connected';

  connectBtn.textContent = 'Disconnect';
  connectBtn.classList.remove('btn-primary');
  connectBtn.classList.add('btn-secondary');

  featuresSection.style.display = 'block';
  actionsSection.style.display = 'block';
  statsSection.style.display = 'block';
  emergencySection.style.display = 'block';

  // Load stats
  loadStats();
}

// Set disconnected state
function setDisconnectedState() {
  statusIndicator.classList.remove('connected');
  statusIndicator.classList.add('disconnected');
  statusIndicator.querySelector('.status-text').textContent = 'Disconnected';

  connectBtn.textContent = 'Connect to Desktop';
  connectBtn.classList.add('btn-primary');
  connectBtn.classList.remove('btn-secondary');

  featuresSection.style.display = 'none';
  actionsSection.style.display = 'none';
  statsSection.style.display = 'none';
  emergencySection.style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
  // Connect button
  connectBtn.addEventListener('click', async () => {
    const status = await getConnectionStatus();

    if (status.connected) {
      // Disconnect
      chrome.runtime.sendMessage({ type: 'disconnect' }, () => {
        setDisconnectedState();
      });
    } else {
      // Connect
      await saveSettings();
      chrome.runtime.sendMessage({
        type: 'connect',
        url: connectionUrlInput.value,
        apiKey: apiKeyInput.value
      }, (response) => {
        if (response.success) {
          // Wait a bit for connection to establish
          setTimeout(updateStatus, 1000);
        }
      });
    }
  });

  // Feature toggles
  visionToggle.addEventListener('change', async () => {
    await saveSettings();
    chrome.runtime.sendMessage({
      type: 'update_settings',
      settings: { visionEnabled: visionToggle.checked }
    });
  });

  voiceToggle.addEventListener('change', async () => {
    await saveSettings();
    chrome.runtime.sendMessage({
      type: 'update_settings',
      settings: { voiceEnabled: voiceToggle.checked }
    });
  });

  autoToggle.addEventListener('change', async () => {
    await saveSettings();
    chrome.runtime.sendMessage({
      type: 'update_settings',
      settings: { autoExecutionEnabled: autoToggle.checked }
    });

    if (autoToggle.checked) {
      showWarning('Auto-execution enabled. AI will execute trades automatically.');
    }
  });

  alertsToggle.addEventListener('change', async () => {
    await saveSettings();
  });

  // Action buttons
  analyzeBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'capture_chart' });
      window.close();
    });
  });

  vibeBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'open_vibe_coder' });
      window.close();
    });
  });

  positionsBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'get_positions' }, (response) => {
      if (response && response.positions) {
        showPositions(response.positions);
      }
    });
  });

  balanceBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'get_balance' }, (response) => {
      if (response && response.balance !== undefined) {
        showNotification(`Balance: ${response.balance.toFixed(4)} SOL`);
      }
    });
  });

  emergencyStopBtn.addEventListener('click', () => {
    if (confirm('⚠️ EMERGENCY STOP\n\nThis will immediately stop all trading.\n\nAre you sure?')) {
      chrome.runtime.sendMessage({ type: 'emergency_stop' });
      showNotification('Emergency stop activated!');
    }
  });

  // Settings link
  document.getElementById('settings-link').addEventListener('click', (e) => {
    e.preventDefault();
    // Show settings in popup instead of opening options page
    showNotification('Settings are managed in this popup. Use the connection section above.');
  });
}

// Get connection status
async function getConnectionStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'get_status' }, (response) => {
      resolve(response || { connected: false });
    });
  });
}

// Load statistics
function loadStats() {
  chrome.runtime.sendMessage({ type: 'get_stats' }, (response) => {
    if (response && response.stats) {
      updateStatsDisplay(response.stats);
    }
  });
}

// Update stats display
function updateStatsDisplay(stats) {
  const pnlElement = document.getElementById('stat-pnl');
  const pnl = stats.pnl || 0;
  pnlElement.textContent = `${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL`;
  pnlElement.style.color = pnl >= 0 ? '#14F195' : '#EF4444';

  document.getElementById('stat-winrate').textContent =
    stats.winRate ? `${(stats.winRate * 100).toFixed(1)}%` : '--';

  document.getElementById('stat-trades').textContent =
    stats.totalTrades || 0;

  document.getElementById('stat-positions').textContent =
    stats.activePositions || 0;
}

// Show positions modal
function showPositions(positions) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Active Positions</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${positions.length === 0 ? '<p>No active positions</p>' : `
          <div class="positions-list">
            ${positions.map(pos => `
              <div class="position-card">
                <div class="position-header">
                  <strong>${pos.symbol}</strong>
                  <span class="${pos.pnl >= 0 ? 'profit' : 'loss'}">
                    ${pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(4)} SOL
                  </span>
                </div>
                <div class="position-details">
                  <div>Amount: ${pos.amount}</div>
                  <div>Entry: $${pos.entry_price}</div>
                  <div>Current: $${pos.current_price}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Show warning
function showWarning(message) {
  const warning = document.createElement('div');
  warning.className = 'notification warning';
  warning.textContent = '⚠️ ' + message;

  document.body.appendChild(warning);

  setTimeout(() => {
    warning.classList.add('show');
  }, 10);

  setTimeout(() => {
    warning.classList.remove('show');
    setTimeout(() => warning.remove(), 300);
  }, 5000);
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'connection_status':
      if (message.connected) {
        setConnectedState();
      } else {
        setDisconnectedState();
      }
      break;

    case 'connection_error':
      showWarning(`Connection error: ${message.error || 'Unknown error'}. ${message.suggestion || ''}`);
      setDisconnectedState();
      break;

    case 'trade_notification':
      const trade = message.trade;
      showNotification(`${trade.action} ${trade.amount} ${trade.symbol}`);
      loadStats();
      break;

    case 'auth_failed':
      showWarning('Authentication failed. Check your API key.');
      setDisconnectedState();
      break;
  }

  sendResponse({ success: true });
  return true;
});

// Refresh stats periodically
setInterval(() => {
  chrome.runtime.sendMessage({ type: 'get_status' }, (response) => {
    if (response && response.connected) {
      loadStats();
    }
  });
}, 5000);
