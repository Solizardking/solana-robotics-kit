# Token Creator Package

An autonomous token creation system for robots on the Solana blockchain. This package enables AI-powered robots to independently conceive, design, and launch their own cryptocurrency tokens.

## Overview

The Token Creator package provides three core components:

1. **AI Token Generator** (`ai_token_generator.py`)
   - Uses NVIDIA Nemotron LLM to generate creative token concepts
   - Produces name, symbol, description, use case, and visual concepts
   - Can generate multiple options and select the best one

2. **Image Generator** (`image_generator.py`)
   - Creates token logos using AI or placeholder generation
   - Supports NVIDIA image generation APIs
   - Fallback to PIL-based procedural generation
   - IPFS-ready for decentralized storage

3. **Solana Token Creator** (`solana_token_creator.py`)
   - Creates SPL tokens on Solana blockchain
   - Manages token accounts and metadata
   - Handles initial supply minting
   - Supports Metaplex metadata standard

## Installation

```bash
pip install -r requirements.txt
```

## Quick Start

### Generate a Token Concept

```python
from token_creator import AITokenGenerator
import asyncio

async def main():
    generator = AITokenGenerator()

    concept = await generator.generate_token_concept(
        theme="autonomous robotics"
    )

    print(f"Name: {concept.name}")
    print(f"Symbol: {concept.symbol}")
    print(f"Description: {concept.description}")

    await generator.close()

asyncio.run(main())
```

### Create a Token Logo

```python
from token_creator import TokenImageGenerator
import asyncio

async def main():
    generator = TokenImageGenerator()

    result = await generator.generate_token_logo(
        prompt="A futuristic robot head with glowing circuits",
        symbol="ROBOT",
        style="digital art, professional"
    )

    print(f"Image saved to: {result['image_path']}")

    await generator.close()

asyncio.run(main())
```

### Create a Solana Token

```python
from token_creator import SolanaTokenCreator, TokenMetadata
import asyncio

async def main():
    creator = SolanaTokenCreator()

    metadata = TokenMetadata(
        name="Robot Token",
        symbol="ROBOT",
        description="A token created by an autonomous robot",
        image_url="https://example.com/logo.png",
        decimals=9,
        initial_supply=1_000_000_000
    )

    result = await creator.create_token(metadata)

    print(f"Token created: {result['mint']}")
    print(f"Explorer: {result['explorer_url']}")

    await creator.close()

asyncio.run(main())
```

## Complete Example

Full autonomous token creation:

```python
from token_creator import (
    AITokenGenerator,
    TokenImageGenerator,
    SolanaTokenCreator,
    TokenMetadata
)
import asyncio

async def create_autonomous_token():
    # Initialize components
    ai_gen = AITokenGenerator()
    img_gen = TokenImageGenerator()
    token_creator = SolanaTokenCreator()

    try:
        # Step 1: Generate concept
        print("Generating token concept...")
        concept = await ai_gen.generate_token_concept(
            theme="robotics and AI"
        )

        # Step 2: Create logo
        print("Creating logo...")
        image = await img_gen.generate_token_logo(
            prompt=concept.image_prompt,
            symbol=concept.symbol
        )

        # Step 3: Create token
        print("Creating token on Solana...")
        metadata = TokenMetadata(
            name=concept.name,
            symbol=concept.symbol,
            description=concept.description,
            image_url=image['image_url'],
        )

        result = await token_creator.create_token(metadata)

        print(f"\n✅ Token created successfully!")
        print(f"Mint: {result['mint']}")
        print(f"Explorer: {result['explorer_url']}")

        return result

    finally:
        # Cleanup
        await ai_gen.close()
        await img_gen.close()
        await token_creator.close()

asyncio.run(create_autonomous_token())
```

## API Reference

### AITokenGenerator

#### `__init__(api_key=None, base_url=None, model=None)`

Initialize the AI token generator.

**Parameters:**
- `api_key` (str, optional): NVIDIA API key
- `base_url` (str, optional): NIM API base URL
- `model` (str, optional): Model to use

#### `generate_token_concept(theme=None, constraints=None)`

Generate a single token concept.

**Parameters:**
- `theme` (str, optional): Theme constraint
- `constraints` (str, optional): Additional constraints

**Returns:**
- `TokenConcept`: Generated concept

#### `generate_multiple_concepts(count=3, theme=None)`

Generate multiple concepts.

**Parameters:**
- `count` (int): Number of concepts to generate
- `theme` (str, optional): Theme constraint

**Returns:**
- `list[TokenConcept]`: List of generated concepts

#### `select_best_concept(concepts)`

Select the best concept from a list using AI evaluation.

**Parameters:**
- `concepts` (list[TokenConcept]): Concepts to evaluate

**Returns:**
- `TokenConcept`: Best concept

### TokenImageGenerator

#### `__init__(api_key=None, output_dir='/tmp/token_images')`

Initialize the image generator.

**Parameters:**
- `api_key` (str, optional): NVIDIA API key
- `output_dir` (str, optional): Output directory for images

#### `generate_token_logo(prompt, symbol, style=None)`

Generate a token logo.

**Parameters:**
- `prompt` (str): Image description
- `symbol` (str): Token symbol
- `style` (str, optional): Style guidance

**Returns:**
- `dict`: Image details with path and URL

#### `upload_to_ipfs(file_path)`

Upload image to IPFS.

**Parameters:**
- `file_path` (Path): Path to image file

**Returns:**
- `str`: IPFS URL

### SolanaTokenCreator

#### `__init__(rpc_url=None, payer_keypair_path=None)`

Initialize the token creator.

**Parameters:**
- `rpc_url` (str, optional): Solana RPC endpoint
- `payer_keypair_path` (str, optional): Path to keypair file

#### `create_token(metadata, mint_keypair=None)`

Create a new SPL token.

**Parameters:**
- `metadata` (TokenMetadata): Token metadata
- `mint_keypair` (Keypair, optional): Pre-generated mint keypair

**Returns:**
- `dict`: Token creation result

#### `get_token_balance(mint, owner=None)`

Get token balance for an owner.

**Parameters:**
- `mint` (Pubkey): Token mint address
- `owner` (Pubkey, optional): Owner address

**Returns:**
- `int`: Token balance

## Configuration

### Environment Variables

```bash
# NVIDIA API key (required for AI features)
export NVIDIA_API_KEY="your-api-key"

# Solana RPC URL (optional, defaults to devnet)
export SOLANA_RPC_URL="https://api.devnet.solana.com"

# Custom keypair path (optional)
export SOLANA_KEYPAIR_PATH="~/.config/solana/id.json"

# Token image directory (optional)
export TOKEN_IMAGE_DIR="/tmp/token_images"
```

## Data Structures

### TokenConcept

```python
@dataclass
class TokenConcept:
    name: str              # Token name
    symbol: str            # Token ticker (3-6 chars)
    description: str       # Token description
    image_prompt: str      # Image generation prompt
    theme: str             # Theme category
    use_case: str          # Token use case
```

### TokenMetadata

```python
@dataclass
class TokenMetadata:
    name: str              # Token name
    symbol: str            # Token symbol
    description: str       # Token description
    image_url: str         # Logo image URL
    decimals: int = 9      # Token decimals (default: 9)
    initial_supply: int    # Initial token supply
```

## Examples

See the `examples/` directory for complete examples:

- `examples/create_first_token.py` - Full autonomous token creation
- `packages/token_creator/ai_token_generator.py` - Run with `if __name__ == "__main__"`
- `packages/token_creator/image_generator.py` - Run with `if __name__ == "__main__"`
- `packages/token_creator/solana_token_creator.py` - Run with `if __name__ == "__main__"`

## Testing

Run individual components:

```bash
# Test AI generation
python -m packages.token_creator.ai_token_generator

# Test image generation
python -m packages.token_creator.image_generator

# Test token creation
python -m packages.token_creator.solana_token_creator
```

## Requirements

- Python 3.10+
- Solana CLI configured
- NVIDIA API key (optional but recommended)
- SOL tokens for transaction fees

## Troubleshooting

### "NVIDIA_API_KEY not found"

Set your API key or the system will use fallback concepts:
```bash
export NVIDIA_API_KEY="your-key-here"
```

### "Solana keypair not found"

Create a keypair:
```bash
solana-keygen new
```

### "Insufficient funds"

Get Devnet SOL:
```bash
solana airdrop 2
```

## Architecture

```
token_creator/
├── __init__.py                 # Package exports
├── ai_token_generator.py       # AI concept generation
├── image_generator.py          # Logo image generation
├── solana_token_creator.py     # SPL token creation
├── requirements.txt            # Dependencies
└── README.md                   # This file
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- GitHub Issues: [Repository Issues](https://github.com/YourOrg/Solana-Robotics-Kit/issues)
- Documentation: `/docs/token-creator-robot.md`
- Examples: `/examples/create_first_token.py`
