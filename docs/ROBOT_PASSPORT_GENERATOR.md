# Solana Robot Passport Generator

Generate visual identity passports for autonomous robots and mint them as compressed NFTs (cNFTs) on Solana using Metaplex Bubblegum.

## Overview

The Robot Passport Generator creates official identity documents for robots in the Solana Robotics Network. Each passport includes:

- **Robot ID**: Unique identifier in the network
- **Public Key**: Robot's Solana wallet address
- **Owner**: Owner's wallet address
- **Title**: Role/designation of the robot
- **Reputation Score**: Trust rating from 0-100%
- **Capabilities**: List of robot abilities
- **Visual Avatar**: AI-generated robot portrait

## Features

- **AI Image Generation**: Uses FAL AI (GPT Image 1.5) for passport creation
- **Multiple Styles**: Cyberpunk, Industrial, Minimal, Futuristic, Steampunk
- **Role Templates**: Pre-defined descriptions for common robot roles
- **Metaplex Integration**: Mint as compressed NFTs using Bubblegum
- **Batch Generation**: Create multiple passports efficiently
- **CLI Interface**: Easy command-line usage

## Prerequisites

### 1. FAL AI API Key

Get your API key from [fal.ai](https://fal.ai/dashboard/keys)

```bash
export FAL_API_KEY="your_key_here"
export FAL_MODEL="fal-ai/gpt-image-1.5"  # optional, this is default
```

### 2. Install Dependencies

```bash
cd packages/robot-passport
pip install -r requirements.txt
```

### 3. Solana Setup (for minting)

```bash
export SOLANA_RPC_URL="https://api.devnet.solana.com"
export SOLANA_PRIVATE_KEY="your_base58_private_key"
```

## Quick Start

### Generate a Passport

```bash
cd packages/robot-passport

# Basic generation
python passport_cli.py generate \
  --robot-id "SOL-2024-0042" \
  --title "Delivery Agent" \
  --reputation 87.5 \
  --role delivery_agent \
  --style cyberpunk

# With custom capabilities
python passport_cli.py generate \
  --robot-id "SOL-WH-001" \
  --title "Warehouse Worker" \
  --reputation 92.0 \
  --capabilities "forklift,inventory,heavy_lifting" \
  --style industrial \
  --output warehouse_passport.json
```

### Batch Generation

```bash
python passport_cli.py batch \
  --input robots.json \
  --output passports/
```

### Interactive Mode

```bash
python passport_cli.py interactive
```

## Passport Styles

| Style | Description | Best For |
|-------|-------------|----------|
| `cyberpunk` | Neon colors, holographic effects, tech overlays | Futuristic delivery/patrol bots |
| `industrial` | Metal textures, warning stripes, utilitarian | Warehouse and factory robots |
| `minimal` | Clean lines, monochrome, Swiss design | Research and medical bots |
| `futuristic` | Sleek gradients, floating UI elements | Advanced AI systems |
| `steampunk` | Brass, gears, Victorian aesthetic | Specialized custom builds |

## Robot Roles

| Role | Description |
|------|-------------|
| `delivery_agent` | Autonomous delivery robot for packages |
| `warehouse_worker` | Warehouse operations and inventory management |
| `patrol_sentinel` | Security and surveillance robot |
| `research_assistant` | Laboratory and research support |
| `companion_unit` | Personal assistant and companion robot |
| `industrial_arm` | Manufacturing manipulator arm |
| `agricultural_drone` | Farming and crop monitoring |
| `medical_assistant` | Healthcare support robot |

## Programmatic Usage

### Basic Generation

```python
import asyncio
from robot_passport import (
    RobotPassportGenerator,
    RobotIdentity,
    PassportStyle,
    RobotRole,
)

async def main():
    # Create robot identity
    identity = RobotIdentity(
        robot_id="SOL-2024-0042",
        pubkey="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        owner="8dHEsWsbKLyN7mMUb1jLMNUVs7sNJmWHpTQpKDpYX3mV",
        title="Autonomous Delivery Agent",
        reputation=87.5,
        capabilities=["navigation", "package_handling", "obstacle_avoidance"],
        role=RobotRole.DELIVERY_AGENT,
        style=PassportStyle.CYBERPUNK,
    )

    # Generate passport
    generator = RobotPassportGenerator()
    passport = await generator.generate_passport(identity)

    print(f"Image URL: {passport.image_url}")

    # Get NFT metadata
    metadata = generator.generate_metadata(passport)
    print(metadata)

asyncio.run(main())
```

### Batch Generation

```python
from robot_passport import generate_passport_batch, RobotIdentity, RobotRole, PassportStyle

identities = [
    RobotIdentity(
        robot_id=f"SOL-BATCH-{i:03d}",
        pubkey=f"pubkey_{i}",
        owner="owner_address",
        title=f"Robot #{i}",
        reputation=90.0 + i,
        capabilities=["capability_1"],
        role=RobotRole.DELIVERY_AGENT,
        style=PassportStyle.CYBERPUNK,
    )
    for i in range(10)
]

passports = await generate_passport_batch(identities)
```

### Synchronous Usage

```python
from robot_passport import generate_passport, RobotIdentity, RobotRole, PassportStyle

identity = RobotIdentity(
    robot_id="SOL-SYNC-001",
    pubkey="...",
    owner="...",
    title="Sync Robot",
    reputation=85.0,
    capabilities=["demo"],
    role=RobotRole.COMPANION_UNIT,
    style=PassportStyle.MINIMAL,
)

passport = generate_passport(identity)
print(passport.image_url)
```

## Minting as Compressed NFTs

The package generates TypeScript code for minting passports as cNFTs using Metaplex Bubblegum.

### Generate Mint Code

```bash
python passport_cli.py mint-code \
  --name "Solana Robot Passport #0042" \
  --uri "https://arweave.net/metadata_uri" \
  --tree "YourMerkleTreeAddress" \
  --collection "YourCollectionMint" \
  --recipient "RecipientWallet"
```

### Create Merkle Tree

```bash
python passport_cli.py create-tree \
  --max-depth 14 \
  --max-buffer-size 64
```

### Generated TypeScript Code

```typescript
import { createMintToCollectionV1Instruction } from "@metaplex-foundation/mpl-bubblegum";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

// ... generated code ready to execute
```

## NFT Metadata Structure

The generator creates Metaplex-compatible metadata:

```json
{
  "name": "Solana Robot Passport #0042",
  "symbol": "SROBOT",
  "description": "Official identity passport for autonomous robot SOL-2024-0042",
  "image": "https://fal.ai/generated/passport.png",
  "external_url": "https://solana-robotics.io/passport/SOL-2024-0042",
  "attributes": [
    {"trait_type": "Robot ID", "value": "SOL-2024-0042"},
    {"trait_type": "Role", "value": "Delivery Agent"},
    {"trait_type": "Reputation Score", "value": "87.5"},
    {"trait_type": "Visual Style", "value": "Cyberpunk"},
    {"trait_type": "Capabilities", "value": "4"},
    {"trait_type": "Network", "value": "Solana"}
  ],
  "properties": {
    "category": "image",
    "files": [{"uri": "...", "type": "image/png"}],
    "creators": [{"address": "...", "share": 100}]
  },
  "collection": {
    "name": "Solana Robotics Passports",
    "family": "Solana Robotics Kit"
  }
}
```

## CLI Reference

### Commands

| Command | Description |
|---------|-------------|
| `generate` | Generate a single passport |
| `batch` | Generate multiple passports from JSON |
| `mint-code` | Generate TypeScript minting code |
| `create-tree` | Generate Merkle tree creation code |
| `transfer-code` | Generate cNFT transfer code |
| `list-roles` | List available robot roles |
| `list-styles` | List available passport styles |
| `interactive` | Interactive generation mode |

### Generate Options

```
--robot-id       Unique robot identifier
--pubkey         Robot's Solana public key
--owner          Owner's wallet address
--title          Robot title/designation
--reputation     Reputation score (0-100)
--capabilities   Comma-separated capabilities
--role           Robot role (delivery_agent, warehouse_worker, etc.)
--style          Visual style (cyberpunk, industrial, etc.)
--output         Output file path
--format         Output format (json, text)
```

## Integration with Solana Robotics Kit

The Robot Passport Generator integrates with other Solana Robotics Kit components:

1. **Robot Registry**: Generate passports for registered robots
2. **Task Marketplace**: Visual identity for task assignment
3. **Reputation System**: Display reputation scores
4. **Blender Assets**: Use 3D robot models as passport avatars

## File Structure

```
packages/robot-passport/
├── __init__.py           # Main generator module
├── metaplex_mint.py      # Metaplex cNFT integration
├── passport_cli.py       # CLI interface
├── requirements.txt      # Python dependencies
└── .env.example          # Environment template

examples/
└── robot_passport_generation.py  # Usage examples
```

## Troubleshooting

### FAL API Errors

- Ensure `FAL_API_KEY` is set correctly
- Check API quota at fal.ai dashboard
- Verify model name is `fal-ai/gpt-image-1.5`

### Minting Issues

- Use devnet for testing before mainnet
- Ensure Merkle tree has available capacity
- Verify collection is properly initialized

### Image Generation Quality

- Use detailed prompts for better results
- Try different styles for variety
- Consider custom prompts for unique designs

## License

Part of the Solana Robotics Kit. See main repository for license details.
