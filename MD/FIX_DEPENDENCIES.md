# Fix Dependency Conflicts

## Issues Found

After installing vibe coding dependencies, there are dependency conflicts:

1. **e2b-desktop vs e2b-code-interpreter**:
   - `e2b-desktop 2.2.0` requires `e2b>=2.6.0,<3.0.0`
   - `e2b-code-interpreter 1.0.0` requires `e2b<2.0.0,>=1.0.0`
   - **Conflict**: Cannot use both packages together

2. **websockets version**:
   - `solana 0.35.1` requires `websockets<12.0,>=9.0`
   - Current: `websockets>=12.0`
   - **Conflict**: Version too high

3. **httpx version**:
   - `mistralai 1.10.0` requires `httpx>=0.28.1`
   - `e2b-code-interpreter` requires `httpx<0.28.0,>=0.20.0`
   - **Conflict**: Version mismatch

## Solution

### Use E2B Sandbox API Directly

Instead of using `e2b-code-interpreter`, we'll use the E2B Sandbox API directly with the `anthropic-claude-code` template. This approach:
- ✅ Works with `e2b>=2.6.0` (compatible with `e2b-desktop`)
- ✅ Uses Claude Code via the sandbox template
- ✅ Avoids dependency conflicts

### Fix Version Constraints

Update `requirements.txt`:
```txt
websockets>=9.0,<12.0  # Compatible with solana 0.35.1
anthropic>=0.35.0      # For Claude API
# e2b is already included via e2b_desktop dependency
```

## Installation Steps

1. **Uninstall conflicting packages**:
```bash
pip uninstall -y e2b-code-interpreter e2b
```

2. **Reinstall with correct versions**:
```bash
pip install "websockets>=9.0,<12.0" "httpx>=0.28.1" anthropic
```

3. **Verify e2b-desktop still works**:
```bash
python -c "from e2b_desktop import Sandbox; print('e2b_desktop OK')"
```

4. **Verify E2B Sandbox API**:
```bash
python -c "from e2b import Sandbox; print('e2b Sandbox API OK')"
```

## Code Changes

The vibe coding implementation has been updated to:
- Use `from e2b import Sandbox` instead of `from e2b_code_interpreter import Sandbox`
- Use `Sandbox.create("anthropic-claude-code", ...)` for vibe coding
- Use `Sandbox.create()` for direct code execution

## Testing

After fixing dependencies, test vibe coding:
1. Set `E2B_API_KEY` and `ANTHROPIC_API_KEY` in `.env`
2. Start desktop agent: `python solana_trading_desktop.py`
3. Send vibe_code message from Chrome extension
4. Verify code generation and execution works
