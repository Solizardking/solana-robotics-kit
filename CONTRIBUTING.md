# Contributing to Solana Robotics Kit

Thank you for your interest in contributing to the Solana Robotics Kit! Together, we're building the future of autonomous robotics on Solana.

**Website**: [solanarobotics.org](https://solanarobotics.org)
**$CLAWD Token**: `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Contributions](#making-contributions)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

Please be respectful and constructive in all interactions. We're building the future of autonomous robotics together!

### Our Standards

- Be welcoming and inclusive
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Git** installed
- **Python 3.10+** for Python packages
- **Node.js 18+** for TypeScript/JavaScript
- **Rust 1.70+** for Anchor programs (optional)
- **Solana CLI** configured for devnet

### Fork and Clone

1. **Fork** the repository on GitHub

2. **Clone** your fork locally:
```bash
git clone https://github.com/YOUR_USERNAME/Solana-Robotics-Kit.git
cd Solana-Robotics-Kit
```

3. **Add upstream** remote:
```bash
git remote add upstream https://github.com/8bitsats/Solana-Robotics-Kit.git
```

4. **Keep your fork synced**:
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

## Development Setup

### Quick Setup

```bash
# Run the setup script
./scripts/setup.sh
```

### Manual Setup

#### Python Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"
```

#### Node.js Environment

```bash
# Install operator console dependencies
cd solana-robotics-kit-v0.4/apps/operator_console
npm install
cd ../../..
```

#### Solana Setup

```bash
# Configure for devnet
solana config set --url devnet

# Create wallet if needed
solana-keygen new --outfile ~/.config/solana/id.json
```

### Environment Variables

```bash
cp .env.example .env
cp solana-robotics-kit-v0.4/apps/operator_console/.env.local.example \
   solana-robotics-kit-v0.4/apps/operator_console/.env.local
```

---

## Making Contributions

### Types of Contributions

| Type | Description | Good First Issue? |
|------|-------------|-------------------|
| **Bug Fixes** | Fix issues and bugs | Yes |
| **Documentation** | Improve docs, add examples | Yes |
| **Tests** | Add test coverage | Yes |
| **Features** | Add new functionality | Discuss first |
| **Refactoring** | Improve code quality | Discuss first |

### Workflow

1. **Check existing issues** - Your idea may already be in progress
2. **Open an issue** - Discuss your idea before starting major work
3. **Create a branch** - Use descriptive names
4. **Make changes** - Follow coding standards
5. **Write tests** - Ensure your code works
6. **Submit PR** - Reference the issue

### Branch Naming

```
feature/add-multi-robot-coordination
fix/task-escrow-timeout-bug
docs/improve-x402-examples
test/add-passport-generator-tests
```

---

## Pull Request Process

### Before Submitting

1. **Update from upstream**:
```bash
git fetch upstream
git rebase upstream/main
```

2. **Run tests**:
```bash
python -m pytest tests/
npm run test --prefix solana-robotics-kit-v0.4/apps/operator_console
```

3. **Check formatting**:
```bash
black .
isort .
```

### PR Template

```markdown
## Description
Brief description of changes

## Related Issue
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation

## Testing
How was this tested?

## Checklist
- [ ] Code follows project style
- [ ] Tests pass locally
- [ ] Documentation updated
```

---

## Coding Standards

### Python

```python
# Use type hints
def register_robot(robot_id: str, capabilities: List[str]) -> Robot:
    """Register a robot on-chain."""
    pass

# Use async/await for I/O
async def fetch_tasks() -> List[Task]:
    return await client.get_tasks()

# Use dataclasses
@dataclass
class RobotConfig:
    robot_id: str
    capabilities: List[str]
    stake_amount: float = 100.0
```

**Tools**: `black`, `isort`, `mypy`, `flake8`

### TypeScript

```typescript
// Use explicit types
interface RobotIdentity {
  robotId: string;
  pubkey: string;
  capabilities: string[];
}

// Use async/await
async function registerRobot(identity: RobotIdentity): Promise<Transaction> {
  return new Transaction();
}
```

**Tools**: `prettier`, `eslint`, `typescript`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add multi-robot coordination support
fix: resolve task escrow timeout issue
docs: improve x402 protocol examples
test: add robot passport generator tests
refactor: simplify task marketplace logic
```

---

## Testing

### Running Tests

```bash
# Python tests
python -m pytest tests/

# With coverage
python -m pytest tests/ --cov=packages --cov-report=html

# TypeScript tests
npm run test --prefix solana-robotics-kit-v0.4/apps/operator_console

# Anchor tests
cd solana-robotics-kit-v0.4 && anchor test
```

### Writing Tests

```python
import pytest
from packages.kit_token import KitTokenClient

@pytest.mark.asyncio
async def test_get_balance():
    client = KitTokenClient()
    balance = await client.get_balance()
    assert balance.balance >= 0
    await client.close()
```

---

## Documentation

When adding features, please update:

1. **Code comments** - Explain complex logic
2. **Docstrings** - Document functions and classes
3. **README** - Update if adding major features
4. **Docs folder** - Add detailed guides for new features

---

## Community

### Getting Help

- **Discord**: [discord.gg/solanarobotics](https://discord.gg/solanarobotics)
- **GitHub Issues**: For bugs and features
- **GitHub Discussions**: For questions

### Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Community spotlights

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `./scripts/setup.sh` | Full development setup |
| `python -m pytest tests/` | Run Python tests |
| `npm run dev` | Start operator console |
| `black .` | Format Python code |

---

Thank you for contributing to Solana Robotics Kit!

**Website**: [solanarobotics.org](https://solanarobotics.org)
