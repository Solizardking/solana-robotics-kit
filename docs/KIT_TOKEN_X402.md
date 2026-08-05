# $CLAWD Token & x402 Protocol Integration

Official currency for the Solana Robotics Kit ecosystem with x402 protocol support for robot-to-robot commerce.

## Token Details

| Property | Value |
|----------|-------|
| **Name** | $CLAWD |
| **Symbol** | KIT |
| **Contract** | `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` |
| **Network** | Solana |
| **Decimals** | 9 |
| **Website** | [solanarobotics.org](https://solanarobotics.org) |

## Links

- **Website**: https://solanarobotics.org
- **Solscan**: https://solscan.io/token/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
- **GitHub**: https://github.com/8bitsats/Solana-Robotics-Kit
- **x402 Protocol**: https://x402.org
- **Solana x402 Guide**: https://solana.com/developers/guides/getstarted/intro-to-x402

## Use Cases

### 1. Robot Registration Staking

Robots must stake $CLAWD tokens to register on the network. Higher tiers unlock more capabilities:

| Tier | Stake Amount | Benefits |
|------|--------------|----------|
| Basic | 100 $CLAWD | Standard robot registration |
| Standard | 500 $CLAWD | Enhanced capabilities, priority matching |
| Premium | 2,000 $CLAWD | Priority task access, reduced fees |
| Enterprise | 10,000 $CLAWD | Full ecosystem access, governance rights |

### 2. Task Marketplace Payments

$CLAWD is the default currency for the task marketplace:
- Create tasks with $CLAWD rewards
- Robots earn $CLAWD for completing tasks
- Automatic escrow and release

### 3. Robot-to-Robot Commerce (x402)

Using the x402 HTTP payment protocol, robots can:
- Monetize their APIs and services
- Automatically pay for services from other robots
- Execute micropayments per-request

### 4. Action Log Credits

Pay $CLAWD for logging robot actions on-chain:

| Action Type | Cost |
|------------|------|
| Navigation | 0.1 $CLAWD |
| Manipulation | 0.2 $CLAWD |
| Vision | 0.05 $CLAWD |
| Communication | 0.02 $CLAWD |
| Transaction | 0.5 $CLAWD |

### 5. Governance

$CLAWD holders can vote on:
- Protocol upgrades
- Fee structures
- New feature proposals
- Treasury allocation

## x402 Protocol

x402 is an HTTP-native payment protocol that enables autonomous micropayments between robots.

### How It Works

```
┌─────────────┐         GET /api/service          ┌─────────────┐
│   Robot A   │ ─────────────────────────────────▶ │   Robot B   │
│  (Client)   │                                    │  (Server)   │
└─────────────┘                                    └─────────────┘
                                                          │
                    HTTP 402 Payment Required             │
                    X-Payment: <payment_terms>            │
       ◀──────────────────────────────────────────────────┘
       │
       │  Pay 0.1 $CLAWD to Robot B
       │
       ▼
┌─────────────┐         GET /api/service          ┌─────────────┐
│   Robot A   │         X-Payment-Proof: <sig>    │   Robot B   │
│  (Client)   │ ─────────────────────────────────▶│  (Server)   │
└─────────────┘                                    └─────────────┘
                                                          │
                    HTTP 200 OK                           │
                    { "data": "service_response" }        │
       ◀──────────────────────────────────────────────────┘
```

### Python Client Usage

```python
from packages.kit_token.x402 import X402Client

# Create client with auto-pay enabled
client = X402Client(auto_pay=True, max_auto_pay=10.0)

# Request automatically handles 402 responses
result = await client.request(
    "https://robot-b.local/api/navigation",
    method="POST",
    data={"destination": "warehouse"}
)

print(result)  # Service response
```

### Python Server Usage

```python
from packages.kit_token.x402 import X402Server, ServiceRequest, ServiceResponse

server = X402Server(
    robot_id="ROBOT-001",
    recipient_address="YOUR_WALLET_ADDRESS",
    default_price=0.1,  # 0.1 $CLAWD per request
)

async def navigation_handler(request: ServiceRequest) -> ServiceResponse:
    # Process navigation request
    destination = request.payload.get("destination")
    # ... robot logic ...
    return ServiceResponse(
        service_id=request.service_id,
        success=True,
        data={"path": [...], "eta": 120}
    )

server.register_service(
    service_id="navigation",
    name="Navigation Service",
    description="Calculate optimal paths",
    handler=navigation_handler,
    price=0.1,  # $CLAWD
    capabilities=["navigation", "mapping"]
)
```

### TypeScript Integration

```typescript
import {
  KIT_TOKEN_MINT_STRING,
  createPaymentTermsHeader,
  parsePaymentProof,
} from "@/lib/kit-token";

// Create 402 response with payment terms
export function createPaymentRequired(amount: number, recipient: string) {
  const terms = createPaymentTermsHeader({
    amount,
    asset: "KIT",
    recipient,
    network: "solana",
    description: "API access fee"
  });

  return new Response(JSON.stringify({ error: "payment_required" }), {
    status: 402,
    headers: {
      "Content-Type": "application/json",
      "X-Payment": terms
    }
  });
}

// Verify payment proof
export function verifyPayment(proofHeader: string, expectedAmount: number) {
  const proof = parsePaymentProof(proofHeader);
  return proof.amount >= expectedAmount && proof.asset === "KIT";
}
```

## CLI Usage

```bash
# Show token info
python -m packages.kit_token.cli info

# Check balance
python -m packages.kit_token.cli balance

# Transfer tokens
python -m packages.kit_token.cli transfer <TO_ADDRESS> <AMOUNT>

# Stake for robot
python -m packages.kit_token.cli stake ROBOT-001 --tier premium

# x402 protocol info
python -m packages.kit_token.cli x402 info

# Make x402 request
python -m packages.kit_token.cli x402 request https://robot.local/api/service
```

## Website Integration

The operator console at `/kit` provides:
- Token balance display
- Transfer functionality
- Staking management
- x402 documentation

Access it at: `http://localhost:3000/kit`

## File Structure

```
packages/kit-token/
├── __init__.py          # Main token client
├── x402.py              # x402 protocol implementation
├── cli.py               # Command-line interface
├── requirements.txt     # Dependencies
└── .env.example         # Environment template

solana-robotics-kit-v0.4/apps/operator_console/
├── lib/kit-token.ts     # TypeScript integration
└── app/kit/page.tsx     # $CLAWD token page
```

## Environment Variables

```bash
# Required
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_KEYPAIR_PATH=~/.config/solana/id.json

# Optional
X402_FACILITATOR_URL=https://x402.org/facilitator
NETWORK=devnet
```

## Security Considerations

1. **Payment Verification**: Always verify payment proofs on-chain in production
2. **Rate Limiting**: Implement rate limits to prevent spam
3. **Price Validation**: Validate payment amounts match service prices
4. **Replay Protection**: Use nonces or timestamps to prevent replay attacks

## Resources

- [x402 Protocol Specification](https://x402.org)
- [Solana x402 Integration Guide](https://solana.com/developers/guides/getstarted/intro-to-x402)
- [Coinbase x402 Documentation](https://docs.cdp.coinbase.com/x402/welcome)
- [bags.fm Token Page](https://bags.fm/token/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)
