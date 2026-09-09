#!/usr/bin/env python3
"""
Privy wallet manager for the Solana browser agent.
Handles wallet creation, signing, and transaction sending using Privy infrastructure.
"""

import json
import os
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment
load_dotenv()

try:
    try:
        from privy import PrivyClient
    except ImportError:
        from privy_sdk import PrivyClient
    PRIVY_AVAILABLE = True
except ImportError:
    PRIVY_AVAILABLE = False
    print("Warning: Privy not available. Install with: pip install privy-sdk")

class AgentWalletManager:
    """Manages the agent's wallet using Privy infrastructure."""
    
    def __init__(self, wallet_path: Optional[Path] = None):
        """
        Initialize Privy wallet manager.
        
        Args:
            wallet_path: Path to wallet cache file. Defaults to browser/agent_wallet_privy.json
        """
        if not PRIVY_AVAILABLE:
            raise ImportError("Privy library required. Install with: pip install privy")
        
        # Get Privy credentials from environment
        self.app_id = os.getenv('PRIVY_APP_ID')
        self.app_secret = os.getenv('PRIVY_APP_SECRET') or os.getenv('PRIVY_API_KEY')
        
        if not self.app_id:
            raise ValueError("PRIVY_APP_ID must be set in environment")
        if not self.app_secret:
            raise ValueError("PRIVY_APP_SECRET or PRIVY_API_KEY must be set in environment")
        
        # Initialize Privy client
        self.client = PrivyClient(
            app_id=self.app_id,
            app_secret=self.app_secret
        )
        
        self.wallet_dir = Path(__file__).parent
        self.wallet_path = wallet_path or self.wallet_dir / "agent_wallet_privy.json"
        self.wallet_id: Optional[str] = None
        self.wallet_address: Optional[str] = None
        
    def create_wallet(self) -> Dict[str, Any]:
        """Create a new Solana wallet using Privy."""
        if not PRIVY_AVAILABLE:
            raise ImportError("Privy library required")
        
        try:
            # Create Solana wallet via Privy
            wallet = self.client.wallets.create(chain_type="solana")
            
            self.wallet_id = wallet.id
            self.wallet_address = wallet.address if hasattr(wallet, 'address') else None
            
            # Save wallet info (only ID, not private keys)
            self.save_wallet_info()
            
            return {
                "wallet_id": self.wallet_id,
                "address": self.wallet_address,
                "chain_type": "solana",
                "message": "New Privy wallet created successfully"
            }
        except Exception as e:
            raise ValueError(f"Failed to create Privy wallet: {str(e)}")
    
    def load_wallet_info(self) -> bool:
        """Load wallet ID from cache file."""
        if not self.wallet_path.exists():
            return False
        
        try:
            with open(self.wallet_path, 'r') as f:
                wallet_data = json.load(f)
            
            self.wallet_id = wallet_data.get("wallet_id")
            self.wallet_address = wallet_data.get("address")
            
            return self.wallet_id is not None
        except Exception as e:
            print(f"Error loading wallet info: {e}")
            return False
    
    def save_wallet_info(self) -> None:
        """Save wallet info to cache file (only public info, no private keys)."""
        if not self.wallet_id:
            raise ValueError("No wallet to save")
        
        wallet_data = {
            "wallet_id": self.wallet_id,
            "address": self.wallet_address,
            "chain_type": "solana",
            "wallet_type": "privy_embedded_wallet"
        }
        
        with open(self.wallet_path, 'w') as f:
            json.dump(wallet_data, f, indent=2)
        
        # Set restrictive permissions
        os.chmod(self.wallet_path, 0o600)
    
    def get_wallet_info(self) -> Dict[str, Any]:
        """Get wallet information."""
        if not self.wallet_id:
            if not self.load_wallet_info():
                return {
                    "has_wallet": False,
                    "message": "No wallet found. Create one first."
                }
        
        return {
            "has_wallet": True,
            "wallet_id": self.wallet_id,
            "address": self.wallet_address,
            "chain_type": "solana",
            "wallet_type": "privy_embedded_wallet",
            "wallet_exists": self.wallet_path.exists()
        }
    
    def get_or_create_wallet(self) -> Dict[str, Any]:
        """Get existing wallet or create a new one."""
        if self.load_wallet_info():
            return {
                "action": "loaded",
                "wallet_id": self.wallet_id,
                "address": self.wallet_address,
                "chain_type": "solana"
            }
        else:
            return self.create_wallet()
    
    def sign_message(self, message: str, encoding: str = "base64") -> Dict[str, Any]:
        """
        Sign a message with the wallet.
        
        Args:
            message: Message to sign (base64 encoded)
            encoding: Encoding type (default: "base64")
        
        Returns:
            Signature result
        """
        if not self.wallet_id:
            if not self.load_wallet_info():
                raise ValueError("No wallet available. Create one first.")
        
        try:
            tx = self.client.wallets.rpc(
                wallet_id=self.wallet_id,
                chain_type="solana",
                method="signMessage",
                params={
                    "message": message,
                    "encoding": encoding
                }
            )
            return {
                "success": True,
                "signature": tx.get("signature") if isinstance(tx, dict) else str(tx),
                "result": tx
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def sign_and_send_transaction(self, transaction: str, caip2: str, encoding: str = "base64") -> Dict[str, Any]:
        """
        Sign and send a transaction.
        
        Args:
            transaction: Base64 encoded serialized transaction
            caip2: CAIP-2 chain ID (e.g., "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1")
            encoding: Encoding type (default: "base64")
        
        Returns:
            Transaction result with hash
        """
        if not self.wallet_id:
            if not self.load_wallet_info():
                raise ValueError("No wallet available. Create one first.")
        
        try:
            tx = self.client.wallets.rpc(
                wallet_id=self.wallet_id,
                caip2=caip2,
                method="signAndSendTransaction",
                params={
                    "transaction": transaction,
                    "encoding": encoding
                }
            )
            return {
                "success": True,
                "transaction_hash": tx.get("hash") if isinstance(tx, dict) else str(tx),
                "result": tx
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# Global wallet manager instance
_wallet_manager: Optional[AgentWalletManager] = None

def get_wallet_manager() -> AgentWalletManager:
    """Get or create the global wallet manager instance."""
    global _wallet_manager
    if _wallet_manager is None:
        _wallet_manager = AgentWalletManager()
    return _wallet_manager
