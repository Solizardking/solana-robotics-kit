#!/usr/bin/env python3
"""
Simple FastAPI server to serve the Solana Web Browser frontend.
Provides a web interface for browser automation.
"""

import json
import os
import subprocess
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Load environment
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(
    title="Solana Web Browser Frontend",
    description="Web interface for Solana browser automation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get project root
PROJECT_ROOT = Path(__file__).parent
BROWSER_SCRIPT = PROJECT_ROOT / "browser" / "browser_api.py"
SCREENSHOTS_DIR = PROJECT_ROOT / "browser" / "screenshots"

# Request models
class BrowserRequest(BaseModel):
    instructions: str
    url: Optional[str] = None

# Serve static files (screenshots)
if SCREENSHOTS_DIR.exists():
    app.mount("/screenshots", StaticFiles(directory=str(SCREENSHOTS_DIR)), name="screenshots")

@app.get("/", response_class=HTMLResponse)
async def get_frontend():
    """Serve the frontend HTML."""
    html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solana Web Browser - E2B Automation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section h2 {
            color: #1e3a8a;
            margin-bottom: 15px;
            font-size: 1.5rem;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #374151;
            font-weight: 500;
        }
        
        input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #3b82f6;
        }
        
        textarea {
            min-height: 120px;
            resize: vertical;
            font-family: monospace;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .btn-secondary {
            background: #6b7280;
            color: white;
        }
        
        .btn-secondary:hover:not(:disabled) {
            background: #4b5563;
        }
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .quick-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .quick-action-btn {
            padding: 15px;
            background: #f3f4f6;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            transition: all 0.3s;
        }
        
        .quick-action-btn:hover {
            background: #e5e7eb;
            border-color: #3b82f6;
            transform: translateY(-2px);
        }
        
        .result-container {
            margin-top: 30px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
        }
        
        .result-container h3 {
            color: #1e3a8a;
            margin-bottom: 15px;
        }
        
        .result-content {
            background: white;
            padding: 15px;
            border-radius: 8px;
            max-height: 500px;
            overflow-y: auto;
        }
        
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .status {
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
        }
        
        .status.success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #6ee7b7;
        }
        
        .status.error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }
        
        .status.info {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #93c5fd;
        }
        
        .screenshot {
            max-width: 100%;
            border-radius: 8px;
            margin-top: 15px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .wallet-info {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .wallet-info p {
            margin: 10px 0;
            font-family: monospace;
            word-break: break-all;
        }
        
        .wallet-info button {
            margin-right: 10px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Solana Web Browser</h1>
            <p>E2B-Powered Browser Automation for Solana</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>Agent Wallet</h2>
                <div id="wallet-section" class="wallet-info">
                    <p><strong>Wallet Address:</strong> <span id="wallet-address">Loading...</span></p>
                    <p><strong>Wallet Type:</strong> <span>Privy Embedded Wallet (Solana)</span></p>
                    <button class="btn-secondary" id="refresh-wallet-btn" onclick="loadWalletInfo()">Refresh Wallet</button>
                    <button class="btn-secondary" id="generate-wallet-btn" onclick="generateWallet()">Create New Wallet</button>
                </div>
            </div>
            
            <div class="section">
                <h2>Browser Automation</h2>
                <form id="browser-form">
                    <div class="form-group">
                        <label for="instructions">Instructions</label>
                        <textarea 
                            id="instructions" 
                            name="instructions" 
                            placeholder="Enter browser automation instructions (e.g., 'Navigate to https://jup.ag', 'Check Solana explorer for address X', 'Check token price of SOL')"
                            required
                        ></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="url">URL (Optional)</label>
                        <input 
                            type="url" 
                            id="url" 
                            name="url" 
                            placeholder="https://example.com"
                        />
                    </div>
                    
                    <div class="button-group">
                        <button type="submit" class="btn-primary" id="submit-btn">
                            Run Automation
                        </button>
                        <button type="button" class="btn-secondary" id="clear-btn">
                            Clear
                        </button>
                    </div>
                </form>
            </div>
            
            <div class="section">
                <h2>Quick Actions</h2>
                <div class="quick-actions">
                    <div class="quick-action-btn" data-action="explorer">
                        <strong>🔍 Check Explorer</strong>
                        <p>View address on Solana Explorer</p>
                    </div>
                    <div class="quick-action-btn" data-action="price">
                        <strong>💰 Check Price</strong>
                        <p>Get token price from Birdeye</p>
                    </div>
                    <div class="quick-action-btn" data-action="jupiter">
                        <strong>🪐 Jupiter</strong>
                        <p>Navigate to Jupiter DEX</p>
                    </div>
                    <div class="quick-action-btn" data-action="birdeye">
                        <strong>👁️ Birdeye</strong>
                        <p>Open Birdeye analytics</p>
                    </div>
                </div>
            </div>
            
            <div id="result-section" class="result-container" style="display: none;">
                <h3>Results</h3>
                <div id="status"></div>
                <div class="result-content" id="result-content"></div>
            </div>
        </div>
    </div>
    
    <script>
        const API_BASE = window.location.origin;
        
        // Load wallet info on page load
        window.addEventListener('DOMContentLoaded', () => {
            loadWalletInfo();
        });
        
        // Form submission
        document.getElementById('browser-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await runAutomation();
        });
        
        // Wallet functions
        async function loadWalletInfo() {
            try {
                const response = await fetch(`${API_BASE}/api/wallet/info`);
                const data = await response.json();
                
                if (data.success && data.wallet.has_wallet) {
                    const address = data.wallet.address || data.wallet.wallet_id || 'Wallet loaded';
                    document.getElementById('wallet-address').textContent = address;
                } else {
                    document.getElementById('wallet-address').textContent = 'No wallet found';
                }
            } catch (error) {
                document.getElementById('wallet-address').textContent = 'Error loading wallet';
                console.error('Error loading wallet:', error);
            }
        }
        
        async function generateWallet() {
            if (!confirm('Create a new Privy wallet? This will create a new embedded wallet.')) {
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE}/api/wallet/generate`);
                const data = await response.json();
                
                if (data.success) {
                    const address = data.wallet.address || data.wallet.wallet_id || 'Unknown';
                    alert('New Privy wallet created! Address: ' + address);
                    loadWalletInfo();
                } else {
                    alert('Error creating wallet: ' + data.error);
                }
            } catch (error) {
                alert('Error generating wallet: ' + error.message);
                console.error('Error generating wallet:', error);
            }
        }
        
        // Clear button
        document.getElementById('clear-btn').addEventListener('click', () => {
            document.getElementById('instructions').value = '';
            document.getElementById('url').value = '';
            document.getElementById('result-section').style.display = 'none';
        });
        
        // Quick actions
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                handleQuickAction(action);
            });
        });
        
        async function runAutomation() {
            const instructions = document.getElementById('instructions').value;
            const url = document.getElementById('url').value;
            const submitBtn = document.getElementById('submit-btn');
            const resultSection = document.getElementById('result-section');
            const resultContent = document.getElementById('result-content');
            const statusDiv = document.getElementById('status');
            
            // Show loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading"></span>Running...';
            resultSection.style.display = 'block';
            statusDiv.innerHTML = '<div class="status info">⏳ Running browser automation...</div>';
            resultContent.innerHTML = '';
            
            try {
                const response = await fetch(`${API_BASE}/api/browser/run`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        instructions: instructions,
                        url: url || undefined
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    statusDiv.innerHTML = '<div class="status success">✅ Automation completed successfully!</div>';
                    resultContent.innerHTML = formatResult(data.result);
                } else {
                    statusDiv.innerHTML = '<div class="status error">❌ Automation failed</div>';
                    resultContent.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
                }
            } catch (error) {
                statusDiv.innerHTML = '<div class="status error">❌ Error: ' + error.message + '</div>';
                resultContent.innerHTML = `<pre>Error: ${error.message}</pre>`;
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Run Automation';
            }
        }
        
        function handleQuickAction(action) {
            const instructionsInput = document.getElementById('instructions');
            const urlInput = document.getElementById('url');
            
            switch(action) {
                case 'explorer':
                    const address = prompt('Enter Solana address:');
                    if (address) {
                        instructionsInput.value = `Check Solana explorer for address ${address}`;
                        urlInput.value = '';
                    }
                    break;
                case 'price':
                    const token = prompt('Enter token symbol (e.g., SOL, BONK):');
                    if (token) {
                        instructionsInput.value = `Check token price of ${token}`;
                        urlInput.value = '';
                    }
                    break;
                case 'jupiter':
                    instructionsInput.value = 'Navigate to https://jup.ag';
                    urlInput.value = 'https://jup.ag';
                    break;
                case 'birdeye':
                    instructionsInput.value = 'Navigate to https://birdeye.so';
                    urlInput.value = 'https://birdeye.so';
                    break;
            }
        }
        
        function formatResult(result) {
            let html = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
            
            // If there's a screenshot, display it
            if (result.screenshot) {
                const screenshotPath = result.screenshot.replace(/^.*screenshots[/\\]/, '/screenshots/');
                html += `<img src="${screenshotPath}" alt="Screenshot" class="screenshot" />`;
            }
            
            return html;
        }
    </script>
</body>
</html>
    """
    return HTMLResponse(content=html_content)

@app.post("/api/browser/run")
async def run_browser(request: BrowserRequest):
    """Run browser automation."""
    try:
        # Build command
        cmd = ["python3", str(BROWSER_SCRIPT), request.instructions]
        
        # Run the browser script
        result = subprocess.run(
            cmd,
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            env={**os.environ, "PYTHONUNBUFFERED": "1"}
        )
        
        if result.returncode != 0:
            return {
                "success": False,
                "error": result.stderr or result.stdout,
                "instructions": request.instructions
            }
        
        # Try to parse JSON output
        try:
            output = json.loads(result.stdout)
            return {
                "success": True,
                "result": output
            }
        except json.JSONDecodeError:
            # If not JSON, return raw output
            return {
                "success": True,
                "result": {
                    "output": result.stdout,
                    "stderr": result.stderr if result.stderr else None
                }
            }
            
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Browser automation timed out after 5 minutes"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/wallet/info")
async def get_wallet_info():
    """Get agent wallet information."""
    try:
        from browser.wallet_manager import get_wallet_manager
        wallet_manager = get_wallet_manager()
        wallet_info = wallet_manager.get_wallet_info()
        return {
            "success": True,
            "wallet": wallet_info
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/wallet/generate")
async def generate_wallet():
    """Create a new Privy wallet for the agent."""
    try:
        from browser.wallet_manager import get_wallet_manager
        wallet_manager = get_wallet_manager()
        wallet_info = wallet_manager.create_wallet()
        return {
            "success": True,
            "wallet": wallet_info
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "solana-browser-frontend"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("FRONTEND_PORT", "8080"))
    uvicorn.run(
        "browser_frontend:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
