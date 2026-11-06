"""
Solana Robotics Website Integration

Provides integration with solanarobotics.org for the platform.

Website: https://solanarobotics.org
Token: $CLAWD (8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)
"""

import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

from clawd.constants import (
    CLAWD_TOKEN_ADDRESS,
    SOLANA_ROBOTICS_URL,
    SOLSCAN_URL,
    JUPITER_SWAP_URL,
    BIRDEYE_URL,
)

logger = logging.getLogger(__name__)


@dataclass
class PlatformConfig:
    """Configuration for Solana Robotics platform."""
    website_url: str = SOLANA_ROBOTICS_URL
    token_address: str = CLAWD_TOKEN_ADDRESS
    api_base_url: str = f"{SOLANA_ROBOTICS_URL}/api/v1"
    docs_url: str = f"{SOLANA_ROBOTICS_URL}/docs"
    discord_url: str = "https://discord.gg/solanarobotics"
    twitter_url: str = "https://twitter.com/SolanaRobotics"
    github_url: str = "https://github.com/8bitsats/SolanaAutomation"


class SolanaRoboticsAPI:
    """
    Client for Solana Robotics website API.

    Provides access to platform features, analytics, and community data.

    Example:
        api = SolanaRoboticsAPI()

        # Get platform stats
        stats = await api.get_platform_stats()

        # Get agent leaderboard
        leaderboard = await api.get_agent_leaderboard()

        # Get $CLAWD token info
        token_info = await api.get_token_info()
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Solana Robotics API client.

        Args:
            api_key: Optional API key for authenticated requests
        """
        self.config = PlatformConfig()
        self.api_key = api_key
        self._session = None

    async def get_platform_stats(self) -> Dict[str, Any]:
        """Get overall platform statistics."""
        return {
            "platform": "Solana Robotics",
            "website": self.config.website_url,
            "token": {
                "symbol": "CLAWD",
                "address": self.config.token_address,
            },
            "stats": {
                "total_agents": 21,
                "active_users": 0,  # Would fetch from API
                "total_trades": 0,
                "total_volume_usd": 0,
            },
            "links": {
                "website": self.config.website_url,
                "docs": self.config.docs_url,
                "discord": self.config.discord_url,
                "twitter": self.config.twitter_url,
                "github": self.config.github_url,
            }
        }

    async def get_token_info(self) -> Dict[str, Any]:
        """Get $CLAWD token information."""
        return {
            "name": "Solana Robotics Kit",
            "symbol": "CLAWD",
            "address": CLAWD_TOKEN_ADDRESS,
            "decimals": 9,
            "links": {
                "solscan": SOLSCAN_URL,
                "jupiter": JUPITER_SWAP_URL,
                "birdeye": BIRDEYE_URL,
            },
            "use_cases": [
                "Agent execution fees",
                "Robot-to-robot payments",
                "Staking rewards",
                "Governance voting",
                "Premium feature access",
            ]
        }

    async def get_agent_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get AI agent performance leaderboard.

        Args:
            limit: Number of agents to return

        Returns:
            List of agent performance data
        """
        # Demo data - would fetch from API
        return [
            {
                "rank": 1,
                "name": "Warren Buffett",
                "character": "warren_buffett",
                "roi_percent": 18.9,
                "total_trades": 156,
                "win_rate": 72.5,
            },
            {
                "rank": 2,
                "name": "Cathie Wood",
                "character": "cathie_wood",
                "roi_percent": 15.2,
                "total_trades": 234,
                "win_rate": 68.3,
            },
            {
                "rank": 3,
                "name": "Charlie Munger",
                "character": "charlie_munger",
                "roi_percent": 12.3,
                "total_trades": 89,
                "win_rate": 78.2,
            },
        ][:limit]

    async def get_robotics_inventory(self) -> List[Dict[str, Any]]:
        """Get available robotics components."""
        return [
            {
                "category": "Compute",
                "items": [
                    {
                        "name": "NVIDIA Jetson Orin Nano",
                        "specs": "40 TOPS AI, 8GB RAM",
                        "power": "7-15W",
                        "price_kit": 500,
                    }
                ]
            },
            {
                "category": "Vision",
                "items": [
                    {
                        "name": "Cosmos Reason Camera",
                        "specs": "4K, AI-accelerated",
                        "model": "cosmos-reason2-8b",
                        "price_kit": 200,
                    }
                ]
            },
            {
                "category": "Actuators",
                "items": [
                    {
                        "name": "Servo Kit",
                        "specs": "6 DOF, precision control",
                        "price_kit": 150,
                    }
                ]
            },
        ]

    def get_documentation_links(self) -> Dict[str, str]:
        """Get documentation links."""
        base = self.config.docs_url
        return {
            "quickstart": f"{base}/quickstart",
            "agents": f"{base}/agents",
            "defi_tools": f"{base}/tools",
            "robotics": f"{base}/robotics",
            "clawd_token": f"{base}/clawd-token",
            "api_reference": f"{base}/api",
            "contributing": f"{base}/contributing",
        }

    def get_social_links(self) -> Dict[str, str]:
        """Get social media and community links."""
        return {
            "website": self.config.website_url,
            "discord": self.config.discord_url,
            "twitter": self.config.twitter_url,
            "github": self.config.github_url,
            "telegram": "https://t.me/solanarobotics",
        }


def get_platform_banner() -> str:
    """Get platform ASCII banner."""
    return """
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗                      ║
║   ██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗                     ║
║   ███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║                     ║
║   ╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║                     ║
║   ███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║                     ║
║   ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝                     ║
║                                                                           ║
║   ██████╗  ██████╗ ██████╗  ██████╗ ████████╗██╗ ██████╗███████╗          ║
║   ██╔══██╗██╔═══██╗██╔══██╗██╔═══██╗╚══██╔══╝██║██╔════╝██╔════╝          ║
║   ██████╔╝██║   ██║██████╔╝██║   ██║   ██║   ██║██║     ███████╗          ║
║   ██╔══██╗██║   ██║██╔══██╗██║   ██║   ██║   ██║██║     ╚════██║          ║
║   ██║  ██║╚██████╔╝██████╔╝╚██████╔╝   ██║   ██║╚██████╗███████║          ║
║   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝    ╚═╝   ╚═╝ ╚═════╝╚══════╝          ║
║                                                                           ║
║   Website: https://solanarobotics.org                                     ║
║   $CLAWD Token: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
"""


def print_welcome():
    """Print welcome message with platform info."""
    print(get_platform_banner())
    print("\nWelcome to Solana Robotics!")
    print(f"Website: {SOLANA_ROBOTICS_URL}")
    print(f"$CLAWD Token: {CLAWD_TOKEN_ADDRESS}")
    print("\nGet started: https://solanarobotics.org/docs/quickstart")
    print("Join community: https://discord.gg/solanarobotics")
