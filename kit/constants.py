"""
$KIT Token Constants

Token: DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS
Website: https://solanarobotics.org
"""

# Token Configuration
KIT_TOKEN_ADDRESS = "DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS"
KIT_SYMBOL = "KIT"
KIT_DECIMALS = 9
KIT_NAME = "Solana Robotics Kit"

# Website & Links
SOLANA_ROBOTICS_URL = "https://solanarobotics.org"
SOLSCAN_URL = f"https://solscan.io/token/{KIT_TOKEN_ADDRESS}"
JUPITER_SWAP_URL = f"https://jup.ag/swap/SOL-{KIT_TOKEN_ADDRESS}"
BIRDEYE_URL = f"https://birdeye.so/token/{KIT_TOKEN_ADDRESS}"

# Tier Requirements (in $KIT tokens)
TIER_FREE = 0
TIER_STARTER = 100
TIER_PRO = 1_000
TIER_ENTERPRISE = 10_000

# Fee Structure (in $KIT tokens)
FEE_AGENT_EXECUTION = 0.1  # Per agent execution
FEE_ROBOT_PAYMENT = 0.01  # Per robot transaction
FEE_PREMIUM_ANALYSIS = 1.0  # Premium market analysis
FEE_CUSTOM_AGENT = 10.0  # Custom agent creation

# Staking Configuration
MIN_STAKE_AMOUNT = 10  # Minimum $KIT to stake
STAKE_PERIODS = [7, 14, 30, 90, 180, 365]  # Days
STAKE_APY = {
    7: 5.0,    # 5% APY for 7 days
    14: 7.5,   # 7.5% APY for 14 days
    30: 10.0,  # 10% APY for 30 days
    90: 15.0,  # 15% APY for 90 days
    180: 20.0, # 20% APY for 180 days
    365: 25.0, # 25% APY for 365 days
}

# Governance Configuration
MIN_PROPOSAL_STAKE = 1_000  # Minimum $KIT to create proposal
VOTING_PERIOD_DAYS = 7
QUORUM_PERCENTAGE = 10.0  # 10% of circulating supply

# Network Configuration
NETWORKS = {
    "mainnet-beta": {
        "rpc": "https://api.mainnet-beta.solana.com",
        "token_address": KIT_TOKEN_ADDRESS,
    },
    "devnet": {
        "rpc": "https://api.devnet.solana.com",
        "token_address": KIT_TOKEN_ADDRESS,  # Same address on devnet for testing
    },
    "testnet": {
        "rpc": "https://api.testnet.solana.com",
        "token_address": KIT_TOKEN_ADDRESS,
    },
}

# API Endpoints
API_ENDPOINTS = {
    "balance": "/api/v1/kit/balance",
    "transfer": "/api/v1/kit/transfer",
    "stake": "/api/v1/kit/stake",
    "unstake": "/api/v1/kit/unstake",
    "governance": "/api/v1/kit/governance",
    "proposals": "/api/v1/kit/proposals",
}
