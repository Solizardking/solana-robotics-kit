# 🔧 Fix MCP Server Build Issues

## Quick Fix

Run these commands in order:

```bash
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server

# 1. Clean everything
rm -rf node_modules package-lock.json pnpm-lock.yaml build

# 2. Install dependencies
npm install

# 3. Install MCP SDK (if not already installed)
npm install @modelcontextprotocol/sdk@latest

# 4. Build
npm run build
```

## If That Doesn't Work

### Step 1: Verify MCP SDK Installation

```bash
npm list @modelcontextprotocol/sdk
```

If it shows "empty" or missing, install it:
```bash
npm install @modelcontextprotocol/sdk@latest --save
```

### Step 2: Check Package Structure

```bash
ls -la node_modules/@modelcontextprotocol/sdk/
```

You should see:
- `server/` directory
- `types.js` or similar files

### Step 3: Try Alternative Import

If imports still fail, the MCP SDK might use different paths. Check the actual package:

```bash
cat node_modules/@modelcontextprotocol/sdk/package.json | grep -A 5 '"exports"'
```

This will show the actual export paths.

### Step 4: Manual Build Check

```bash
# Check TypeScript compilation
npx tsc --noEmit

# If there are errors, they'll show what's missing
```

## Common Solutions

### Solution A: Use pnpm (if npm fails)

```bash
pnpm install
pnpm add @modelcontextprotocol/sdk@latest
pnpm run build
```

### Solution B: Check Node Version

```bash
node --version  # Should be 18+
```

If not, update Node.js or use nvm:
```bash
nvm install 18
nvm use 18
```

### Solution C: Update TypeScript

```bash
npm install typescript@latest --save-dev
npm run build
```

## Still Stuck?

1. Check the actual error message carefully
2. Verify the MCP SDK package exists: `npm view @modelcontextprotocol/sdk`
3. Try installing a specific version: `npm install @modelcontextprotocol/sdk@0.4.0`
4. Check the official docs: https://github.com/modelcontextprotocol/typescript-sdk
