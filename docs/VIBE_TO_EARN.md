# Vibe to Earn Platform

Developer reward system for the Solana Robotics Kit ecosystem. Earn **$KIT tokens** by contributing code to the repository.

## Overview

The Vibe to Earn platform rewards developers who actively participate in the Solana Robotics Kit ecosystem. Every commit, pull request, code review, and issue resolution earns you $KIT tokens that are distributed directly to your verified Solana wallet.

### Key Features

- **Git Contribution Tracking**: Automatic tracking of commits, PRs, and code reviews
- **GitHub Webhook Integration**: Real-time contribution detection
- **$KIT Token Rewards**: Earn tokens for every contribution
- **Streak Bonuses**: Up to 2x rewards for consistent contributors
- **Developer Tiers**: Progress from Newcomer to Legend
- **Leaderboard**: Compete with other developers
- **Bags SDK Integration**: Partner fee distribution

## Token Information

| Property | Value |
|----------|-------|
| **Token** | $KIT |
| **Mint Address** | `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` |
| **Network** | Solana Mainnet |
| **Decimals** | 9 |
| **Fee Wallet** | `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` |

## Reward Structure

### Contribution Rewards

| Contribution Type | Base Reward ($KIT) |
|-------------------|-------------------|
| Commit | 1.0 |
| Pull Request (Merged) | 10.0 |
| Issue Created | 2.0 |
| Issue Resolved | 5.0 |
| Code Review | 3.0 |
| Documentation | 5.0 |
| Bug Fix | 15.0 |
| New Feature | 25.0 |
| Security Fix | 50.0 |
| Test Coverage | 2.0 |

### Streak Bonuses

Consistent contributions earn bonus multipliers:

| Streak Days | Bonus Multiplier |
|-------------|-----------------|
| 7 days | 1.1x (10% bonus) |
| 14 days | 1.25x (25% bonus) |
| 30 days | 1.5x (50% bonus) |
| 90 days | 2.0x (100% bonus) |

### Developer Tiers

Progress through tiers based on total $KIT earned:

| Tier | Required $KIT | Benefits |
|------|--------------|----------|
| Newcomer | 0 | Welcome to the ecosystem |
| Contributor | 100 | Early contributor recognition |
| Regular | 500 | Trusted contributor status |
| Core | 2,000 | Core team recognition |
| Maintainer | 5,000 | Maintainer privileges |
| Legend | 10,000 | Elite developer status |

## Getting Started

### 1. Register as a Developer

```bash
curl -X POST https://api.solanarobotics.org/vibe/developers/register \
  -H "Content-Type: application/json" \
  -d '{
    "github_username": "your-github-username",
    "wallet_address": "YourSolanaWalletAddress"
  }'
```

### 2. Verify Your Wallet

Sign a message with your wallet to verify ownership:

```
Message: "Verify wallet {wallet_address} for {github_username} on Solana Robotics Kit"
```

Then submit the verification:

```bash
curl -X POST https://api.solanarobotics.org/vibe/developers/verify \
  -H "Content-Type: application/json" \
  -d '{
    "github_username": "your-github-username",
    "wallet_address": "YourSolanaWalletAddress",
    "signature": "your_signature_here"
  }'
```

### 3. Start Contributing

Make contributions to the repository:
- Fork the repo
- Create a feature branch
- Make your changes
- Submit a pull request

### 4. Claim Your Rewards

Once your contributions are merged:

```bash
curl -X POST https://api.solanarobotics.org/vibe/rewards/claim \
  -H "Content-Type: application/json" \
  -d '{"github_username": "your-github-username"}'
```

## API Reference

### Base URL

```
https://api.solanarobotics.org/vibe
```

### Endpoints

#### Developers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/developers/register` | Register a new developer |
| POST | `/developers/verify` | Verify wallet ownership |
| GET | `/developers/{username}` | Get developer profile |
| GET | `/developers/{username}/stats` | Get contribution stats |

#### Contributions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/contributions` | Record a contribution |
| GET | `/contributions/{username}` | Get developer's contributions |

#### Rewards

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/rewards/claim` | Claim pending rewards |
| GET | `/rewards/pending/{username}` | Check pending rewards |
| GET | `/rewards/rates` | Get current reward rates |

#### Leaderboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leaderboard` | Get full leaderboard |
| GET | `/leaderboard/top` | Get top 10 contributors |

#### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Get platform statistics |
| GET | `/stats/partner-fees` | Get partner fee stats |
| GET | `/stats/token-fees` | Get $KIT token fees |

#### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhooks/github` | Handle GitHub webhooks |

## Running Locally

### Prerequisites

- Python 3.10+
- pip or poetry

### Installation

```bash
# Install dependencies
pip install -e ".[dev]"

# Set environment variables
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
export BAGS_API_KEY="your_bags_api_key"
export GITHUB_TOKEN="your_github_token"
export GITHUB_WEBHOOK_SECRET="your_webhook_secret"

# Run the API server
python -m packages.vibe_to_earn.api
```

### Docker

```bash
docker-compose up vibe-to-earn
```

## GitHub Webhook Setup

To enable automatic contribution tracking:

1. Go to your repository Settings > Webhooks
2. Add webhook:
   - **Payload URL**: `https://api.solanarobotics.org/vibe/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Your webhook secret
   - **Events**: Select:
     - Push
     - Pull requests
     - Issues
     - Pull request reviews

## Bags SDK Integration

The platform integrates with the Bags SDK for partner fee management:

```python
from packages.vibe_to_earn.bags_integration import BagsSDKClient

# Initialize client
client = BagsSDKClient(api_key="your_bags_api_key")

# Get partner fee stats
stats = await client.get_partner_claim_stats()
print(f"Unclaimed fees: {stats.unclaimed_sol} SOL")

# Claim partner fees
signature = await client.claim_partner_fees()
print(f"Claimed! Transaction: {signature}")
```

### Partner Configuration

Partners can earn a percentage of fees from token launches:

```python
# Get partner config
config = await client.get_partner_config()
print(f"BPS: {config.bps}")  # 100 bps = 1%
print(f"Total accumulated: {config.accumulated_fees_sol} SOL")
```

## Security Considerations

1. **Wallet Verification**: Always verify wallet ownership before distributing rewards
2. **Webhook Signatures**: Validate GitHub webhook signatures
3. **Rate Limiting**: Cooldown periods prevent reward farming
4. **Private Key Security**: Never expose private keys in client-side code

## FAQ

**Q: How long until my rewards appear?**
A: Contributions are tracked in real-time via webhooks. Rewards appear within minutes of merge.

**Q: Why is my contribution showing less $KIT than expected?**
A: Check if you're on a cooldown. Same-type contributions within the cooldown period may not earn rewards.

**Q: How do I increase my tier?**
A: Keep contributing! Total $KIT earned determines your tier level.

**Q: Can I lose my streak?**
A: Yes, if you don't contribute for more than 1 day, your streak resets.

**Q: When can I claim my rewards?**
A: You can claim anytime after your wallet is verified and you have pending rewards.

## Contributing

Help improve the Vibe to Earn platform:

1. Report bugs via GitHub Issues
2. Suggest features in Discussions
3. Submit PRs for improvements

All contributions to the platform itself earn rewards!

## Support

- **Discord**: [Join our community](https://discord.gg/solanarobotics)
- **GitHub Issues**: [Report bugs](https://github.com/8bitsats/Solana-Robotics-Kit/issues)
- **Documentation**: [Full docs](https://docs.solanarobotics.org)
