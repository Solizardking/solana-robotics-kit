# 🔧 Dependency Fix - spl-token Package

## Issue

The `spl-token` package doesn't exist on PyPI as a standalone package. The `spl.token` module is provided by other packages in the Solana Python ecosystem.

## Solution

**Removed `spl-token` from requirements.txt**

The `spl.token` functionality is provided by:
- **`solana`** package (includes SPL token support)
- **`anchorpy`** package (Anchor framework includes SPL token utilities)
- **`solders`** package (low-level Solana bindings)

## Updated Requirements

The core Solana dependencies are now:
```txt
solana>=0.31.0
solders>=0.21.0,<0.24.0
anchorpy>=0.20.0
```

These three packages together provide all the SPL token functionality needed by the codebase.

## Verification

After installing, you can verify the imports work:

```python
# These should all work after installing solana, solders, and anchorpy
from spl.token.instructions import get_associated_token_address
from spl.token.client import Token
from spl.token.constants import TOKEN_PROGRAM_ID
```

## Installation

Now you can install dependencies without errors:

```bash
source venv/bin/activate
pip install -r requirements.txt
```

Or run the setup script again:

```bash
./setup.sh
```
