# Chrome Extension Installation Guide - Step by Step

## Current Status
✅ Extension files are ready (background.js, content.js, popup.js, manifest.json)
⚠️ npm install has permission issues (but we can load the extension directly)
⚠️ Icons are missing (extension will work but show default icon)

## Step-by-Step Installation

### Step 1: Fix npm Permissions (Optional - for building later)

If you want to install dependencies later, fix npm permissions:

```bash
# Check npm permissions
npm config get prefix

# Fix npm permissions (if needed)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /Users/8bit/.nvm/versions/node/v25.2.1/lib/node_modules/npm
```

### Step 2: Create Extension Icons (Required)

The extension needs icon files. You have two options:

#### Option A: Quick Placeholder Icons (Fastest)

1. Open any image editor (Preview, Photoshop, GIMP, or online tool)
2. Create 4 square images with Solana green (#14F195) background:
   - `icon16.png` - 16x16 pixels
   - `icon32.png` - 32x32 pixels  
   - `icon48.png` - 48x48 pixels
   - `icon128.png` - 128x128 pixels
3. Save them in: `/Users/8bit/Downloads/SolanaAutomation/chrome-extension/icons/`

#### Option B: Use Online Icon Generator

1. Go to https://www.favicon-generator.org/ or similar
2. Upload/create a simple icon (can be text "GR00T" or Solana logo)
3. Download all sizes
4. Place in the `icons/` folder

#### Option C: Skip Icons (Extension will work but show default icon)

You can load the extension without icons - it will function but show Chrome's default puzzle icon.

### Step 3: Load Extension in Chrome

1. **Open Chrome Extensions Page:**
   - Open Chrome browser
   - Go to: `chrome://extensions/`
   - OR: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode:**
   - Toggle the "Developer mode" switch in the top-right corner
   - This enables "Load unpacked" option

3. **Load the Extension:**
   - Click "Load unpacked" button
   - Navigate to: `/Users/8bit/Downloads/SolanaAutomation/chrome-extension`
   - Click "Select" or "Open"

4. **Verify Installation:**
   - You should see "Solana GR00T Trading Assistant" in your extensions list
   - The extension icon should appear in Chrome toolbar (or puzzle icon if no icons)

### Step 4: Test the Extension

1. **Open Extension Popup:**
   - Click the extension icon in Chrome toolbar
   - You should see the GR00T popup with connection settings

2. **Visit a Trading Site:**
   - Go to: https://jup.ag/swap (or any Solana DEX)
   - The extension should inject its content script
   - Look for the GR00T floating button on the page

### Step 5: Connect to Desktop Agent

Before using the extension, you need to start the desktop trading agent:

```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
python solana_trading_desktop.py
```

Then in the extension popup:
1. Enter connection URL: `ws://localhost:8765`
2. Click "Connect to Desktop"
3. Status should change to "Connected" (green)

## Troubleshooting

### Extension Not Loading

**Error: "Manifest file is missing or unreadable"**
- Make sure you selected the `chrome-extension` folder (not parent folder)
- Check that `manifest.json` exists in the folder

**Error: "Could not load extension"**
- Check Chrome console: `chrome://extensions/` → Click "Errors" button
- Common issues:
  - Missing icons (can be ignored, extension still works)
  - Invalid manifest.json syntax
  - Missing required files

### Extension Loads But Doesn't Work

**Content script not injecting:**
- Make sure you're on a supported DEX (jup.ag, raydium.io, orca.so, meteora.ag)
- Check browser console (F12) for errors
- Reload the extension: `chrome://extensions/` → Click reload icon

**Can't connect to desktop agent:**
- Make sure `solana_trading_desktop.py` is running
- Check the WebSocket URL is correct: `ws://localhost:8765`
- Check firewall isn't blocking localhost connections

### Fix npm Issues (For Future Development)

If you want to build/develop the extension:

```bash
# Try installing with different method
cd /Users/8bit/Downloads/SolanaAutomation/chrome-extension
npm install --legacy-peer-deps

# Or use yarn instead
yarn install

# Or fix npm permissions
sudo npm install -g npm@latest
```

## Quick Start Checklist

- [ ] Extension folder located at: `/Users/8bit/Downloads/SolanaAutomation/chrome-extension`
- [ ] Chrome browser installed
- [ ] Developer mode enabled in `chrome://extensions/`
- [ ] Extension loaded (shows in extensions list)
- [ ] Desktop agent running (`python solana_trading_desktop.py`)
- [ ] Connected extension to desktop agent (ws://localhost:8765)
- [ ] Tested on a DEX site (jup.ag, etc.)

## Next Steps After Installation

1. **Configure Settings:**
   - Open extension popup
   - Toggle features you want (Vision, Voice, Auto-Execution)
   - Set risk limits

2. **Test Features:**
   - Visit jup.ag/swap
   - Try keyboard shortcuts (Ctrl+Shift+S for screenshot)
   - Test voice commands (if enabled)
   - Try vibe coding feature

3. **Read Full Documentation:**
   - See `README.md` for complete feature list
   - Check keyboard shortcuts
   - Review security best practices

## Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Check extension popup for connection status
3. Verify desktop agent is running and accessible
4. Review this guide's troubleshooting section

---

**Ready to install?** Follow steps 3-5 above to load the extension in Chrome!
