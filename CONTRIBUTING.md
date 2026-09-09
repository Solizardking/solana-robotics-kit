# Contributing to Solana Robotics

Thank you for your interest in contributing to Solana Robotics! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

This project adheres to our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@solanarobotics.org.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Python 3.10+** installed
- **Node.js 18+** for TypeScript/JavaScript components
- **Rust & Anchor** for Solana programs
- **Solana CLI** configured
- **Git** for version control
- A **GitHub account**

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/SolanaAutomation.git
cd SolanaAutomation
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/8bitsats/SolanaAutomation.git
```

---

## How to Contribute

### Types of Contributions

We welcome many types of contributions:

| Type | Description |
|------|-------------|
| **Bug Fixes** | Fix issues and improve stability |
| **New Features** | Add new functionality |
| **AI Agents** | Create new agent personalities |
| **DeFi Tools** | Integrate new protocols |
| **Robotics** | Expand hardware support |
| **Documentation** | Improve guides and examples |
| **Tests** | Add test coverage |
| **Translations** | Translate documentation |

### Finding Issues

- Check [GitHub Issues](https://github.com/8bitsats/SolanaAutomation/issues) for open tasks
- Look for issues labeled `good first issue` for beginner-friendly tasks
- Issues labeled `help wanted` need community assistance
- Check the [Project Board](https://github.com/8bitsats/SolanaAutomation/projects) for roadmap items

### Creating Issues

Before creating a new issue:

1. Search existing issues to avoid duplicates
2. Use the appropriate issue template
3. Provide detailed information including:
   - Clear description of the problem or feature
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Environment details (OS, Python version, etc.)

---

## Development Setup

### 1. Environment Setup

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Install pre-commit hooks
pre-commit install
```

### 2. Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit with your API keys (for testing)
# You can use testnet/devnet for development
```

### 3. Node Dependencies (Optional)

For Chrome extension or MCP server work:

```bash
cd chrome-extension && pnpm install && cd ..
cd mcp-server && pnpm install && cd ..
```

### 4. Rust/Anchor (Optional)

For Solana program development:

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli

# Build programs
cd programs/agent-arena
anchor build
```

---

## Pull Request Process

### 1. Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
# OR for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions
- `agent/` - New AI agents
- `tool/` - New DeFi tools

### 2. Make Changes

- Write clean, documented code
- Follow the coding standards below
- Add tests for new functionality
- Update documentation as needed

### 3. Commit Changes

Use conventional commit messages:

```bash
# Format: type(scope): description

git commit -m "feat(agent): add new momentum trading agent"
git commit -m "fix(tools): resolve Jupiter swap timeout issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(browser): add automation test coverage"
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, no code change
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance tasks

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:

- Clear title describing the change
- Description of what and why
- Link to related issues
- Screenshots/recordings if UI changes
- Test results

### 5. PR Review

- Address reviewer feedback
- Keep discussions constructive
- Update PR as needed
- Squash commits if requested

---

## Coding Standards

### Python

```python
# Use type hints
def transfer_tokens(
    recipient: str,
    amount: float,
    token_mint: str = KIT_TOKEN_ADDRESS
) -> TransactionResult:
    """
    Transfer tokens to a recipient.

    Args:
        recipient: Destination wallet address
        amount: Amount to transfer
        token_mint: Token mint address (defaults to $KIT)

    Returns:
        TransactionResult with signature and status
    """
    pass

# Use async/await for I/O operations
async def fetch_balance(wallet: str) -> float:
    async with aiohttp.ClientSession() as session:
        # ...
        pass

# Use dataclasses or Pydantic for data structures
from pydantic import BaseModel

class AgentConfig(BaseModel):
    name: str
    character: str
    kit_balance: float = 0.0
```

**Style Guide:**
- Follow PEP 8
- Use Black for formatting
- Use isort for imports
- Maximum line length: 100 characters
- Use meaningful variable names

### TypeScript

```typescript
// Use TypeScript strict mode
// tsconfig.json has strict: true

interface AgentResponse {
  success: boolean;
  data?: MarketAnalysis;
  error?: string;
}

// Use async/await
async function analyzeMarket(pair: string): Promise<AgentResponse> {
  try {
    const result = await agent.analyze(pair);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Rust (Anchor Programs)

```rust
use anchor_lang::prelude::*;

#[program]
pub mod agent_arena {
    use super::*;

    /// Initialize a new trading arena
    pub fn initialize(ctx: Context<Initialize>, config: ArenaConfig) -> Result<()> {
        let arena = &mut ctx.accounts.arena;
        arena.authority = ctx.accounts.authority.key();
        arena.config = config;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + Arena::INIT_SPACE)]
    pub arena: Account<'info, Arena>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

---

## Testing Guidelines

### Running Tests

```bash
# Run all Python tests
pytest tests/

# Run with coverage
pytest tests/ --cov=. --cov-report=html

# Run specific test file
pytest tests/test_trading.py

# Run specific test
pytest tests/test_trading.py::test_jupiter_swap
```

### Writing Tests

```python
import pytest
from kit import KitToken

@pytest.fixture
def kit_token():
    """Fixture for $KIT token instance."""
    return KitToken(network="devnet")

@pytest.mark.asyncio
async def test_kit_balance(kit_token):
    """Test fetching $KIT balance."""
    balance = await kit_token.get_balance(TEST_WALLET)
    assert balance >= 0

@pytest.mark.asyncio
async def test_kit_transfer(kit_token):
    """Test $KIT token transfer."""
    result = await kit_token.transfer(
        recipient=TEST_WALLET_2,
        amount=1.0
    )
    assert result.success
    assert result.signature is not None
```

### Test Categories

- **Unit Tests**: Test individual functions
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete workflows
- **Contract Tests**: Test Solana programs

---

## Documentation

### Updating Documentation

- Update README.md for major changes
- Add docstrings to all public functions
- Update API documentation for new endpoints
- Add examples for new features

### Documentation Style

```python
def create_agent(
    character: str,
    kit_stake: float = 0.0,
    config: Optional[AgentConfig] = None
) -> SolanaAgent:
    """
    Create a new AI trading agent.

    This function initializes an AI agent with the specified character
    personality and optional $KIT token stake for premium features.

    Args:
        character: Agent personality (e.g., "warren_buffett", "cathie_wood")
        kit_stake: Amount of $KIT tokens to stake (enables premium features)
        config: Optional configuration override

    Returns:
        Initialized SolanaAgent instance

    Raises:
        ValueError: If character is not found
        InsufficientBalanceError: If kit_stake exceeds wallet balance

    Example:
        >>> agent = create_agent("warren_buffett", kit_stake=100)
        >>> analysis = await agent.analyze("SOL/USDC")

    See Also:
        - Agent personalities: characters/
        - $KIT token: kit/
    """
    pass
```

---

## Community

### Getting Help

- **Discord**: [Join our server](https://discord.gg/solanarobotics)
- **GitHub Discussions**: Ask questions and share ideas
- **Twitter**: [@SolanaRobotics](https://twitter.com/SolanaRobotics)

### Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Community shoutouts

### $KIT Rewards

Active contributors may receive $KIT token rewards for:
- Significant feature contributions
- Critical bug fixes
- Extensive documentation improvements
- Community support and mentoring

---

## Security

### Reporting Vulnerabilities

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email security@solanarobotics.org
3. Include detailed description and reproduction steps
4. Allow time for fix before disclosure

### Security Best Practices

- Never commit private keys or secrets
- Use environment variables for sensitive data
- Validate all user inputs
- Follow OWASP guidelines

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

If you have questions about contributing, please:
1. Check existing documentation
2. Search GitHub issues and discussions
3. Ask in our Discord community
4. Create a GitHub discussion

Thank you for contributing to Solana Robotics! Together we're building the future of AI-powered blockchain automation.

---

**$KIT Token:** `DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS`

**Website:** [solanarobotics.org](https://solanarobotics.org)
