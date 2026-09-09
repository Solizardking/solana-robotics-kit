# 🔧 MCP Server Troubleshooting Guide

## Issue: Cannot find module '@modelcontextprotocol/sdk'

### Solution 1: Install the Package

```bash
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server
npm install @modelcontextprotocol/sdk
```

Or if using pnpm:
```bash
pnpm add @modelcontextprotocol/sdk
```

### Solution 2: Verify Installation

Check if the package is installed:
```bash
npm list @modelcontextprotocol/sdk
# or
ls node_modules/@modelcontextprotocol
```

### Solution 3: Clean Install

If the package still isn't found, try a clean install:

```bash
# Remove node_modules and lock file
rm -rf node_modules package-lock.json pnpm-lock.yaml

# Reinstall everything
npm install
# or
pnpm install
```

## Issue: TypeScript Import Errors

### Check TypeScript Configuration

Make sure `tsconfig.json` has proper module resolution:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### Alternative: Use Different Import Syntax

If ES module imports don't work, try:

```typescript
// Instead of:
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// Try:
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
```

## Issue: Build Fails

### Check Node.js Version

MCP SDK requires Node.js 18+:
```bash
node --version  # Should be v18 or higher
```

### Check TypeScript Version

```bash
npx tsc --version  # Should be 5.0+
```

## Quick Fix Script

Run this to fix common issues:

```bash
cd /Users/8bit/Downloads/SolanaAutomation/mcp-server

# Clean install
rm -rf node_modules package-lock.json pnpm-lock.yaml build
npm install

# Install MCP SDK specifically
npm install @modelcontextprotocol/sdk@latest

# Build
npm run build
```

## Verify Installation

After installing, verify the package structure:

```bash
ls -la node_modules/@modelcontextprotocol/sdk/
```

You should see directories like:
- `server/`
- `types.js` or `types.d.ts`

## Still Having Issues?

1. Check the MCP SDK version:
   ```bash
   npm view @modelcontextprotocol/sdk versions
   ```

2. Try installing a specific version:
   ```bash
   npm install @modelcontextprotocol/sdk@0.5.0
   ```

3. Check for TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```

4. Review the official MCP SDK documentation:
   - GitHub: https://github.com/modelcontextprotocol/typescript-sdk
