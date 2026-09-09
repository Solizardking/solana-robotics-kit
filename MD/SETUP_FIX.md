# 🔧 Setup Fix - Package Dependencies

## Issue Fixed

The `requirements.txt` had an incorrect version constraint for `spl-token`:
- **Before**: `spl-token>=0.10.0` (this version doesn't exist)
- **After**: `spl-token>=0.2.0` (correct version)

## Additional Dependencies Added

Based on the codebase analysis, the following packages are also required:

- `solders>=0.21.0,<0.24.0` - Rust bindings for Solana (used extensively)
- `anchorpy>=0.20.0` - Anchor framework for Solana programs

These are now included in `requirements.txt`.

## How to Fix Your Installation

If you encountered the error, run:

```bash
# Activate your virtual environment
source venv/bin/activate

# Install the corrected dependencies
pip install -r requirements.txt
```

The setup should now work correctly!

## Verification

After installation, verify the packages are installed:

```bash
pip list | grep -E "spl-token|solders|anchorpy|solana"
```

You should see:
- `spl-token` (version 0.2.x)
- `solders` (version 0.21.x - 0.23.x)
- `anchorpy` (version 0.20.x or higher)
- `solana` (version 0.31.x or higher)
