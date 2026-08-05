# Autonomous Token Creator Robot

## Overview

The **Autonomous Token Creator Robot** is an AI-powered agent that can independently create and launch SPL tokens on the Solana blockchain. This represents a new form of autonomous economic agency - robots that can create their own currency and participate in decentralized economies.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               AUTONOMOUS TOKEN CREATOR ROBOT                │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌──────────────────┐   ┌──────────────┐
│   AI Concept  │   │ Image Generation │   │ Solana Token │
│   Generator   │   │                  │   │   Creator    │
│  (Nemotron)   │   │  (NVIDIA/PIL)    │   │  (SPL Token) │
└───────────────┘   └──────────────────┘   └──────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Solana Devnet   │
                    │  SPL Token Mint  │
                    └──────────────────┘
```

## Features

### 1. Autonomous Token Concept Generation

The robot uses **NVIDIA Nemotron LLM** to autonomously think of creative token concepts:

- **Token Name**: Creative, memorable names
- **Token Symbol (Ticker)**: 3-6 character uppercase identifiers
- **Theme**: Overall category (robotics, AI, space, gaming, etc.)
- **Use Case**: Clear purpose and utility
- **Description**: Compelling narrative explaining the token's value
- **Image Prompt**: Detailed visual description for logo generation

**Example Output:**
```json
{
  "name": "Neural Network Token",
  "symbol": "NEURAL",
  "theme": "AI and Machine Learning",
  "use_case": "Rewards for autonomous AI agent tasks",
  "description": "Neural Network Token powers the next generation of AI agents...",
  "image_prompt": "Digital brain made of glowing blue circuits..."
}
```

### 2. Intelligent Concept Selection

When generating multiple concepts, the robot uses AI to evaluate and select the best option based on:

- Creativity and uniqueness
- Market appeal
- Clear use case
- Memorable branding
- Overall potential

### 3. Logo Image Generation

The robot generates professional token logos:

- **AI Generation**: Uses NVIDIA image generation APIs (when available)
- **Placeholder Generation**: Creates stylized logos using PIL
- **Deterministic Colors**: Symbol-based color generation
- **IPFS Ready**: Prepared for decentralized storage

### 4. SPL Token Creation

Creates fully functional SPL tokens on Solana:

- **Standard SPL Token**: Compatible with all Solana wallets and DEXs
- **Configurable Decimals**: Default 9 decimals
- **Initial Supply**: 1 billion tokens (configurable)
- **Metadata Support**: Metaplex-compatible metadata structure
- **Token Accounts**: Automatic ATA (Associated Token Account) creation

### 5. Creation History Tracking

The robot maintains a permanent record of all tokens created:

- **Local History**: Stored in `~/.solana_robot/token_history.json`
- **Blockchain Record**: All transactions on-chain for audit
- **Metadata**: Complete concept, image, and token details

## Getting Started

### Prerequisites

1. **Solana CLI** installed and configured
2. **Python 3.10+** with required dependencies
3. **NVIDIA API Key** (optional but recommended for full AI capabilities)
4. **SOL tokens** in your wallet for transaction fees (Devnet SOL is free)

### Installation

```bash
# Clone the repository
git clone https://github.com/YourOrg/Solana-Robotics-Kit
cd Solana-Robotics-Kit

# Install dependencies
pip install -r requirements.txt

# Set up Solana CLI (if not already done)
solana-keygen new
solana config set --url devnet

# Get free Devnet SOL
solana airdrop 2

# Set NVIDIA API key (optional but recommended)
export NVIDIA_API_KEY="your-api-key-here"
# Get your key from: https://build.nvidia.com/
```

### Quick Start

#### Create Your First Token

```bash
python examples/create_first_token.py
```

This will:
1. Generate 3 token concepts using AI
2. Select the best one
3. Generate a logo
4. Create the token on Solana
5. Show you the Explorer link

#### Create a Token with Specific Theme

```bash
python examples/create_first_token.py --theme "space exploration"
```

#### Advanced Usage

```python
from agents.token_creator_robot import TokenCreatorRobot

# Create robot instance
robot = TokenCreatorRobot(robot_name="MyTokenBot")
await robot.initialize()

# Create a token with custom parameters
creation = await robot.think_and_create_token(
    theme="decentralized robotics",
    constraints="Must be related to autonomous agents",
    generate_options=5  # Generate 5 options, pick best
)

# Access token details
print(f"Mint: {creation['token']['mint']}")
print(f"Explorer: {creation['token']['explorer_url']}")

# Clean up
await robot.cleanup()
```

## API Reference

### TokenCreatorRobot

Main autonomous agent class.

#### Methods

##### `__init__(robot_name, keypair_path, nvidia_api_key)`

Initialize the robot.

**Parameters:**
- `robot_name` (str): Identifier for this robot
- `keypair_path` (str, optional): Path to Solana keypair
- `nvidia_api_key` (str, optional): NVIDIA API key

##### `initialize()`

Initialize all robot components (AI, image generator, token creator).

##### `think_and_create_token(theme, constraints, generate_options)`

Autonomously create a token.

**Parameters:**
- `theme` (str, optional): Theme constraint (e.g., "robotics")
- `constraints` (str, optional): Additional constraints
- `generate_options` (int): Number of concepts to generate (default: 1)

**Returns:**
- `dict`: Complete creation record with concept, token, and image details

##### `create_first_token()`

Special method for creating the robot's inaugural token with preset themes.

**Returns:**
- `dict`: Creation record

##### `print_creation_summary()`

Display summary of all tokens created by this robot.

##### `cleanup()`

Clean up resources (close HTTP clients, etc.).

### AITokenGenerator

Generates token concepts using LLM.

#### Methods

##### `generate_token_concept(theme, constraints)`

Generate a single token concept.

**Returns:**
- `TokenConcept`: AI-generated concept

##### `generate_multiple_concepts(count, theme)`

Generate multiple concepts.

**Returns:**
- `list[TokenConcept]`: List of concepts

##### `select_best_concept(concepts)`

Use AI to select best concept from a list.

**Returns:**
- `TokenConcept`: Best concept

### TokenImageGenerator

Generates token logo images.

#### Methods

##### `generate_token_logo(prompt, symbol, style)`

Generate a logo image.

**Parameters:**
- `prompt` (str): Image description
- `symbol` (str): Token symbol
- `style` (str): Style guidance

**Returns:**
- `dict`: Image path, URL, and metadata

##### `upload_to_ipfs(file_path)`

Upload image to IPFS (placeholder implementation).

**Returns:**
- `str`: IPFS URL

### SolanaTokenCreator

Creates SPL tokens on Solana.

#### Methods

##### `create_token(metadata, mint_keypair)`

Create a new SPL token.

**Parameters:**
- `metadata` (TokenMetadata): Token metadata
- `mint_keypair` (Keypair, optional): Pre-generated mint keypair

**Returns:**
- `dict`: Token creation details including mint address and signatures

##### `get_token_balance(mint, owner)`

Get token balance for an owner.

**Returns:**
- `int`: Token balance

## Integration with Solana Robotics Kit

### Task Marketplace Integration

Use robot-created tokens for task rewards:

```python
from packages.solana_client.anchor_ix import ix_create_task_spl

# Create a task with your robot's token as payment
task_ix = ix_create_task_spl(
    program_id=task_marketplace_program,
    creator=robot_wallet,
    mint=robot_token_mint,  # Your robot's token!
    task_id=task_id,
    amount_tokens=1000,  # 1000 tokens as reward
    description="Deliver package to warehouse",
    tags=["delivery", "warehouse"]
)
```

### Robot Registry Integration

Register your token-creating robot:

```python
from packages.solana_client.anchor_ix import ix_register_robot

# Register robot with token creation capability
register_ix = ix_register_robot(
    program_id=robot_registry_program,
    admin=admin_wallet,
    robot_id="TokenBot-001",
    capabilities=["token_creation", "ai_reasoning", "image_generation"],
    hardware_specs={
        "model": "AI Agent",
        "capabilities": ["Nemotron-70B", "Image-Gen"],
        "tokens_created": 5
    }
)
```

## Use Cases

### 1. Robot-Specific Reward Tokens

Each robot can create its own token for task rewards:
- Robots earn tokens for completing tasks
- Token value reflects robot reputation
- Tradeable on Solana DEXs

### 2. DAO Governance Tokens

Autonomous organizations of robots can create governance tokens:
- Voting rights for robot collective decisions
- Treasury management
- Protocol upgrades

### 3. Utility Tokens

Tokens for specific robot services:
- Storage tokens for data hosting robots
- Compute tokens for processing tasks
- Transport tokens for delivery robots

### 4. Collectible/Commemorative Tokens

Celebrate robot milestones:
- First task completion token
- Anniversary tokens
- Achievement tokens

### 5. Cross-Robot Economies

Enable multi-robot economic systems:
- Robots trade tokens with each other
- Inter-robot payments for services
- Decentralized robot marketplaces

## Architecture Details

### Component Breakdown

#### 1. AI Reasoning Layer (Nemotron)

- **Model**: nvidia/llama-3.1-nemotron-70b-instruct
- **Temperature**: 0.8 (high creativity)
- **Max Tokens**: 1024
- **Structured Output**: JSON format for parsing

#### 2. Image Generation Layer

- **Primary**: NVIDIA Picasso API (when available)
- **Fallback**: PIL-based placeholder generation
- **Output**: 512x512 PNG images
- **Colors**: Deterministic based on token symbol

#### 3. Blockchain Layer

- **Network**: Solana (Devnet for testing, Mainnet-beta for production)
- **Token Standard**: SPL Token (Token Program)
- **Metadata**: Metaplex-compatible structure
- **Accounts**: Automatic ATA creation

### Data Flow

```
1. User Request
   ↓
2. AI generates concept(s)
   ↓
3. AI selects best (if multiple)
   ↓
4. Image generator creates logo
   ↓
5. Token creator builds Solana transaction
   ↓
6. Transaction signed and sent
   ↓
7. Token created on-chain
   ↓
8. History recorded locally
   ↓
9. Return results to user
```

## Configuration

### Environment Variables

```bash
# Required for AI features (highly recommended)
export NVIDIA_API_KEY="nvapi-xxx"

# Optional: Custom Solana RPC
export SOLANA_RPC_URL="https://api.devnet.solana.com"

# Optional: Custom keypair location
export SOLANA_KEYPAIR_PATH="~/.config/solana/id.json"

# Optional: Custom image output directory
export TOKEN_IMAGE_DIR="/tmp/token_images"

# Optional: NFT.Storage for IPFS uploads
export NFT_STORAGE_KEY="your-key-here"
```

### Configuration Files

Create `~/.solana_robot/config.json`:

```json
{
  "robot_name": "TokenBot-001",
  "default_theme": "robotics",
  "default_supply": 1000000000,
  "default_decimals": 9,
  "concept_options": 3,
  "ai_temperature": 0.8,
  "image_style": "professional, clean, modern"
}
```

## Troubleshooting

### Common Issues

#### 1. "NVIDIA_API_KEY not found"

**Solution**: Set your API key:
```bash
export NVIDIA_API_KEY="your-key-here"
```

Or the robot will use fallback concepts (still works, just less creative).

#### 2. "Solana keypair not found"

**Solution**: Create a keypair:
```bash
solana-keygen new
```

#### 3. "Insufficient SOL for transaction"

**Solution**: Get Devnet SOL:
```bash
solana airdrop 2
```

#### 4. "Rate limit exceeded"

**Solution**: Add delays between token creations:
```python
await asyncio.sleep(5)  # Wait 5 seconds between creations
```

#### 5. "Image generation failed"

**Solution**: The system will automatically use placeholder generation. To enable AI image generation, ensure your NVIDIA API key has access to image generation endpoints.

## Examples

### Example 1: Simple Token Creation

```python
import asyncio
from agents.token_creator_robot import TokenCreatorRobot

async def main():
    robot = TokenCreatorRobot()
    await robot.initialize()

    creation = await robot.create_first_token()
    print(f"Token created: {creation['token']['mint']}")

    await robot.cleanup()

asyncio.run(main())
```

### Example 2: Batch Token Creation

```python
import asyncio
from agents.token_creator_robot import TokenCreatorRobot

async def main():
    robot = TokenCreatorRobot(robot_name="BatchCreator")
    await robot.initialize()

    themes = ["space", "ocean", "forest", "city", "technology"]

    for theme in themes:
        creation = await robot.think_and_create_token(
            theme=theme,
            generate_options=2
        )
        print(f"Created: {creation['concept']['name']}")
        await asyncio.sleep(10)  # Rate limiting

    robot.print_creation_summary()
    await robot.cleanup()

asyncio.run(main())
```

### Example 3: Custom Configuration

```python
import asyncio
from agents.token_creator_robot import TokenCreatorRobot
from packages.token_creator import TokenMetadata

async def main():
    robot = TokenCreatorRobot()
    await robot.initialize()

    # Custom metadata
    metadata = TokenMetadata(
        name="My Custom Token",
        symbol="CUSTOM",
        description="A token with custom settings",
        image_url="https://example.com/logo.png",
        decimals=6,  # Different decimals
        initial_supply=500_000_000  # Custom supply
    )

    result = await robot.token_creator.create_token(metadata)
    print(f"Custom token: {result['mint']}")

    await robot.cleanup()

asyncio.run(main())
```

## Roadmap

### Current Version (v0.4)

- ✅ AI-powered concept generation
- ✅ Image generation (AI + placeholder)
- ✅ SPL token creation
- ✅ Creation history tracking
- ✅ Multi-concept selection

### Upcoming Features (v0.5)

- 🔄 Full Metaplex metadata integration
- 🔄 IPFS automatic upload
- 🔄 Token burn/mint authority management
- 🔄 Liquidity pool creation (Raydium/Orca)
- 🔄 Automated market making

### Future Vision (v1.0+)

- 📅 Cross-chain token bridges
- 📅 NFT collection generation
- 📅 Token analytics dashboard
- 📅 DAO formation tools
- 📅 Robot-to-robot token swaps

## Security Considerations

### Best Practices

1. **Keypair Security**: Never commit keypairs to version control
2. **API Keys**: Store securely in environment variables
3. **Rate Limiting**: Implement delays to avoid API limits
4. **Testing**: Always test on Devnet before Mainnet
5. **Audit**: Review all generated concepts before creation

### Limitations

- Currently uses Devnet (not real money)
- No automatic liquidity provision
- Basic metadata support (full Metaplex coming soon)
- Image generation depends on external APIs

## Contributing

We welcome contributions! Areas for improvement:

- Additional AI models for concept generation
- Better image generation integration
- Metaplex metadata enhancement
- DEX integration
- Token management features

## License

MIT License - See LICENSE file for details

## Support

- **Documentation**: `/docs` directory
- **Examples**: `/examples` directory
- **Issues**: GitHub Issues
- **Community**: Discord server

## Credits

Built on:
- **Solana Blockchain**: High-performance blockchain
- **NVIDIA NIM**: AI reasoning (Nemotron) and vision (Cosmos)
- **Anchor Framework**: Solana program development
- **SPL Token**: Solana token standard

---

**Remember**: This represents a new era of autonomous economic agents. Your robot can now create, manage, and trade its own currency. Use this power responsibly and creatively! 🤖✨
