# Migration Guide - Old to New Structure

This guide helps you migrate from the old directory structure to the new organized architecture.

## Quick Reference

### Import Path Changes

#### Python

```python
# OLD → NEW

# Blockchain
from packages.solana_client import SolanaClient
→ from blockchain.clients import SolanaClient

from packages.kit_token import KitToken
→ from blockchain.tokens import KitToken

from packages.robot_passport import RobotPassport
→ from blockchain.passport import RobotPassport

# AI
from packages.nim_client import NIMClient
→ from ai.nvidia import NIMClient

from packages.perception import CosmosPerception
→ from ai.vision import CosmosPerception

from packages.planning import NemotronPlanning
→ from ai.reasoning import NemotronPlanning

# Robotics
from apps.robot_daemon import RobotDaemon
→ from robotics.control import RobotDaemon

from a2a.orchestrator import A2AOrchestrator
→ from robotics.coordination.a2a import A2AOrchestrator
```

#### TypeScript

```typescript
// OLD → NEW

// Web
import { RobotUI } from '../website/components/Robot'
→ import { RobotUI } from '@solana-robotics/web/robot'

// Tools
import { Ralph } from '../ralph/src'
→ import { Ralph } from '@solana-robotics/tools/ralph'
```

## Directory Mapping

| Old Path | New Path |
|----------|----------|
| `programs/` | `blockchain/programs/` |
| `packages/solana-client/` | `blockchain/clients/solana-client/` |
| `packages/kit-token/` | `blockchain/tokens/kit-token/` |
| `packages/robot-passport/` | `blockchain/passport/` |
| `MeloTTS/` | `ai/voice/melotts/` |
| `OpenVoice/` | `ai/voice/openvoice/` |
| `packages/nim-client/` | `ai/nvidia/nim-client/` |
| `packages/perception/` | `ai/vision/perception/` |
| `packages/planning/` | `ai/reasoning/planning/` |
| `apps/robot-daemon/` | `robotics/control/daemon/` |
| `a2a/` | `robotics/coordination/a2a/` |
| `avatar_companion/` | `robotics/avatars/companion/` |
| `agents/` | `ai/agents/` |
| `apps/operator-console/` | `web/console/` |
| `apps/trading_agent_server/` | `apps/trading/` |
| `apps/autonomous_launchpad/` | `apps/launchpad/` |
| `website/` | `web/robot/` |
| `ralph/` | `tools/ralph/` |
| `scripts/` | `tools/scripts/` |
| `checkpoints/` | `assets/models/checkpoints/checkpoints/` |

## Step-by-Step Migration

### 1. Run Reorganization Script

```bash
# Python (recommended)
python scripts/reorganize.py

# Or Bash
bash scripts/reorganize.sh
```

### 2. Update Import Paths

Use find/replace in your IDE:

**Python:**
```bash
# Find all Python files
find . -name "*.py" -type f | xargs sed -i '' \
  's/from packages\.solana_client/from blockchain.clients/g'
```

**TypeScript:**
```bash
# Find all TypeScript files
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  's/from.*website/from @solana-robotics\/web\/robot/g'
```

### 3. Update Configuration Files

Update paths in:
- `pyproject.toml`
- `package.json` files
- `.env` files
- CI/CD configs (`.github/workflows/`)

### 4. Update Documentation

Update file paths in:
- All `README.md` files
- All `docs/*.md` files
- Code comments
- Example code

### 5. Test Everything

```bash
# Python tests
pytest

# TypeScript tests
npm test

# Integration tests
pytest tests/integration/
```

### 6. Update CI/CD

Update paths in:
- `.github/workflows/*.yml`
- `Dockerfile`
- `docker-compose.yml`
- Deployment scripts

## Common Issues

### Issue: Import Errors

**Symptom:** `ModuleNotFoundError` or `Cannot find module`

**Fix:**
1. Check new import path in [ARCHITECTURE.md](ARCHITECTURE.md)
2. Update import statement
3. Ensure `__init__.py` exists in new location

### Issue: Missing Files

**Symptom:** File not found errors

**Fix:**
1. Check migration map above
2. Verify file was moved correctly
3. Check for merge conflicts

### Issue: Broken Tests

**Symptom:** Tests fail after migration

**Fix:**
1. Update test import paths
2. Update test file paths
3. Update test data paths

## Need Help?

- Check [ARCHITECTURE.md](ARCHITECTURE.md)
- Check [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- Ask in [Discord](https://discord.gg/solanarobotics)
- Open an [issue](https://github.com/8bitsats/Solana-Robotics-Kit/issues)

## Rollback

If you need to rollback:

```bash
git checkout main  # Or your previous branch
```

The reorganization script creates backups, but it's always good to commit before running it.
