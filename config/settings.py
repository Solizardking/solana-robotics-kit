import os
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Server settings
PORT = int(os.getenv('PORT', '8000'))
HOST = os.getenv('HOST', '0.0.0.0')
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')

# Database settings
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/solana_ai_agent')
REDIS_URI = os.getenv('REDIS_URI', 'redis://localhost:6379/0')

# Authentication settings
JWT_SECRET = os.getenv('JWT_SECRET', 'your_jwt_secret_key')
JWT_EXPIRATION = int(os.getenv('JWT_EXPIRATION', '86400'))

# AI settings
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
XAI_API_KEY = os.getenv('XAI_API_KEY', '')
OPEN_ROUTER_API_KEY = os.getenv('OPEN_ROUTER_API_KEY', '')
DEFAULT_MODEL = os.getenv('DEFAULT_MODEL', 'anthropic/claude-3-opus-20240229')
NIM_API_KEY = os.getenv('NIM_API_KEY', '')
NVIDIA_API_KEY = os.getenv('NVIDIA_API_KEY', '')
NIM_BASE_URL = os.getenv('NIM_BASE_URL', 'https://api.nvidia.com/nim')
NIM_MODEL = os.getenv('NIM_MODEL', 'nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16')
NIM_BASE_URL = os.getenv('NIM_BASE_URL', 'https://api.nvidia.com/nim')
NIM_MODEL = os.getenv('NIM_MODEL', '')
NIM_TIMEOUT_SECONDS = float(os.getenv('NIM_TIMEOUT_SECONDS', '30'))
NIM_MAX_RETRIES = int(os.getenv('NIM_MAX_RETRIES', '2'))
NIM_MAX_TOKENS = int(os.getenv('NIM_MAX_TOKENS', '512'))
NIM_TEMPERATURE = float(os.getenv('NIM_TEMPERATURE', '0.2'))
NIM_POOL_CONNECTIONS = int(os.getenv('NIM_POOL_CONNECTIONS', '20'))
NIM_POOL_MAXSIZE = int(os.getenv('NIM_POOL_MAXSIZE', '40'))

# A2A / AP2 settings
A2A_AGENT_REGISTRY = os.getenv('A2A_AGENT_REGISTRY', '')
AP2_DEFAULT_TOKEN_MINT = os.getenv('AP2_DEFAULT_TOKEN_MINT', 'So11111111111111111111111111111111111111112')
AP2_MAX_PAYMENT_AMOUNT = int(os.getenv('AP2_MAX_PAYMENT_AMOUNT', '1000000'))
AP2_MANDATE_TTL_SECONDS = int(os.getenv('AP2_MANDATE_TTL_SECONDS', '3600'))

# Solana settings
SOLANA_RPC_URL = os.getenv('SOLANA_RPC_URL', 'https://api.devnet.solana.com')
SOLANA_WALLET_PATH = os.getenv('SOLANA_WALLET_PATH', './key/wallet.json')
NETWORK = os.getenv('NETWORK', 'devnet')

# Birdeye API
BIRDEYE_API_KEY = os.getenv('BIRDEYE_API_KEY', '')

# Browser automation settings
BROWSER_HEADLESS = os.getenv('BROWSER_HEADLESS', 'False').lower() == 'true'

# Privy wallet settings
PRIVY_APP_ID = os.getenv('PRIVY_APP_ID', '')
PRIVY_APP_SECRET = os.getenv('PRIVY_APP_SECRET', '')
PRIVY_API_KEY = os.getenv('PRIVY_API_KEY', '')  # Alternative to APP_SECRET 
