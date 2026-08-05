"""
Solana Robotics Passport Generator

This module generates Robot Passport NFTs using:
- FAL API (GPT Image 1.5) for passport image generation
- Metaplex Bubblegum for compressed NFT minting on Solana

A Robot Passport is a digital identity certificate for robots in the
Solana Robotics Kit ecosystem, containing:
- Robot ID and public key
- Owner wallet address
- Title and role
- Reputation score
- Capabilities list
- AI-generated robot avatar
"""

import os
import json
import asyncio
import httpx
import base64
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from datetime import datetime
import hashlib


class PassportStyle(Enum):
    """Visual styles for robot passports."""
    CYBERPUNK = "cyberpunk"
    INDUSTRIAL = "industrial"
    MINIMAL = "minimal"
    FUTURISTIC = "futuristic"
    STEAMPUNK = "steampunk"


class RobotRole(Enum):
    """Predefined robot roles/titles."""
    DELIVERY_AGENT = "Delivery Agent"
    WAREHOUSE_WORKER = "Warehouse Worker"
    PATROL_SENTINEL = "Patrol Sentinel"
    RESEARCH_ASSISTANT = "Research Assistant"
    MANUFACTURING_UNIT = "Manufacturing Unit"
    AGRICULTURAL_DRONE = "Agricultural Drone"
    MEDICAL_ASSISTANT = "Medical Assistant"
    COMPANION_BOT = "Companion Bot"
    ARCHITECT = "Robot Architect"
    CUSTOM = "Custom Role"


@dataclass
class RobotCapabilities:
    """Robot capabilities for the passport."""
    primary: List[str] = field(default_factory=list)
    secondary: List[str] = field(default_factory=list)

    def to_display_string(self) -> str:
        """Format capabilities for display."""
        all_caps = self.primary + self.secondary
        if len(all_caps) <= 3:
            return "{" + ", ".join(all_caps) + "}"
        return "{" + ", ".join(all_caps[:3]) + ", ...}"

    def to_list(self) -> List[str]:
        return self.primary + self.secondary


@dataclass
class RobotIdentity:
    """Complete robot identity for passport generation."""
    robot_id: str
    pubkey: str
    owner: str
    title: str
    role: RobotRole
    reputation: int  # 0-100
    capabilities: RobotCapabilities
    created_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        # Validate reputation
        self.reputation = max(0, min(100, self.reputation))

    def short_pubkey(self) -> str:
        """Get shortened pubkey for display."""
        if len(self.pubkey) > 8:
            return f"{self.pubkey[:4]}...{self.pubkey[-4:]}"
        return self.pubkey

    def to_dict(self) -> Dict[str, Any]:
        return {
            "robot_id": self.robot_id,
            "pubkey": self.pubkey,
            "owner": self.owner,
            "title": self.title,
            "role": self.role.value,
            "reputation": self.reputation,
            "capabilities": self.capabilities.to_list(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "metadata": self.metadata,
        }


@dataclass
class PassportConfig:
    """Configuration for passport generation."""
    fal_api_key: Optional[str] = None
    fal_model: str = "fal-ai/gpt-image-1.5"
    image_size: str = "1536x1024"  # Landscape for passport
    quality: str = "high"
    output_format: str = "png"
    style: PassportStyle = PassportStyle.CYBERPUNK

    def __post_init__(self):
        if self.fal_api_key is None:
            self.fal_api_key = os.environ.get("FAL_API_KEY")
        model_env = os.environ.get("FAL_MODEL")
        if model_env:
            self.fal_model = model_env


@dataclass
class GeneratedPassport:
    """Result of passport generation."""
    identity: RobotIdentity
    image_url: str
    image_data: Optional[bytes] = None
    metadata_uri: Optional[str] = None
    transaction_signature: Optional[str] = None
    asset_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "identity": self.identity.to_dict(),
            "image_url": self.image_url,
            "metadata_uri": self.metadata_uri,
            "transaction_signature": self.transaction_signature,
            "asset_id": self.asset_id,
        }


# Passport image generation prompts
PASSPORT_PROMPTS = {
    PassportStyle.CYBERPUNK: """Create a high-tech digital robot passport/ID card with cyberpunk aesthetic:
- Dark background with neon accents (cyan, purple, magenta)
- Holographic elements and scan lines
- Circuit board patterns in the border
- Glowing status indicators
- Futuristic barcode at bottom
The passport displays: ID: {robot_id}, Owner: {owner}, Title: {title}, Reputation: {reputation}/100
Include a detailed robot portrait on the right side: {robot_description}
Style: Cyberpunk, high-tech, neon-lit, digital certificate""",

    PassportStyle.INDUSTRIAL: """Create an industrial-style robot identification card:
- Metallic gray and orange color scheme
- Riveted metal border design
- Warning stripes and safety markings
- QR code and barcode elements
- Stamped/embossed text appearance
The passport displays: ID: {robot_id}, Owner: {owner}, Title: {title}, Reputation: {reputation}/100
Include a detailed robot portrait on the right side: {robot_description}
Style: Industrial, rugged, factory aesthetic""",

    PassportStyle.MINIMAL: """Create a clean, minimal robot passport design:
- White/light gray background
- Simple black text and lines
- Minimal geometric accents
- Small Solana logo
- Clean sans-serif typography
The passport displays: ID: {robot_id}, Owner: {owner}, Title: {title}, Reputation: {reputation}/100
Include a detailed robot portrait on the right side: {robot_description}
Style: Minimal, clean, modern, professional""",

    PassportStyle.FUTURISTIC: """Create a futuristic holographic robot passport:
- Translucent/glass-like appearance
- Floating holographic data fields
- Animated-looking light effects
- Solana gradient colors (purple to cyan)
- 3D depth effects
The passport displays: ID: {robot_id}, Owner: {owner}, Title: {title}, Reputation: {reputation}/100
Include a detailed robot portrait on the right side: {robot_description}
Style: Futuristic, holographic, transparent, sci-fi""",

    PassportStyle.STEAMPUNK: """Create a steampunk-style robot passport:
- Brass and copper color scheme
- Gears and clockwork decorations
- Vintage typography
- Wax seal element
- Aged paper texture
The passport displays: ID: {robot_id}, Owner: {owner}, Title: {title}, Reputation: {reputation}/100
Include a detailed robot portrait on the right side: {robot_description}
Style: Steampunk, Victorian, mechanical, vintage""",
}

# Robot description templates based on role
ROBOT_DESCRIPTIONS = {
    RobotRole.DELIVERY_AGENT: "A sleek autonomous delivery robot with wheels, cargo compartment, and friendly LED face display. Has sensors and cameras for navigation.",
    RobotRole.WAREHOUSE_WORKER: "A heavy-duty warehouse robot with forklift attachments, mecanum wheels, and industrial design. Features warning lights and robust frame.",
    RobotRole.PATROL_SENTINEL: "A rugged security patrol robot with tank treads, multiple cameras, spotlights, and sensor array. Military-inspired design with dark coloring.",
    RobotRole.RESEARCH_ASSISTANT: "A sophisticated lab assistant robot with articulated arms, precise manipulators, and clean white/blue aesthetic. Has display screen face.",
    RobotRole.MANUFACTURING_UNIT: "An industrial manufacturing robot arm with multiple joints, welding attachments, and orange safety coloring. Mounted on rotating base.",
    RobotRole.AGRICULTURAL_DRONE: "A quadcopter agricultural drone with crop sensors, spray attachments, and GPS antenna. Green and yellow color scheme.",
    RobotRole.MEDICAL_ASSISTANT: "A medical assistant robot with gentle curves, white and blue coloring, sanitizable surfaces, and friendly display face.",
    RobotRole.COMPANION_BOT: "A friendly companion robot with expressive eyes, rounded design, soft materials, and warm color scheme. Approachable and cute.",
    RobotRole.ARCHITECT: "A sophisticated robot architect with multiple tools, holographic displays, and professional appearance. Wears Solana Robotics Kit badge.",
    RobotRole.CUSTOM: "A unique custom robot with distinctive features, advanced sensors, and personalized design elements.",
}


class RobotPassportGenerator:
    """
    Generates Robot Passport NFTs using FAL API and Metaplex.

    The generator creates unique passport images for robots using AI,
    then mints them as compressed NFTs on Solana.
    """

    def __init__(self, config: Optional[PassportConfig] = None):
        """Initialize the passport generator."""
        self.config = config or PassportConfig()
        if not self.config.fal_api_key:
            raise ValueError(
                "FAL API key not found. Set FAL_API_KEY environment variable "
                "or pass fal_api_key in PassportConfig."
            )

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for FAL API requests."""
        return {
            "Authorization": f"Key {self.config.fal_api_key}",
            "Content-Type": "application/json",
        }

    def _build_passport_prompt(self, identity: RobotIdentity) -> str:
        """Build the image generation prompt for the passport."""
        base_prompt = PASSPORT_PROMPTS.get(
            self.config.style,
            PASSPORT_PROMPTS[PassportStyle.CYBERPUNK]
        )

        # Get robot description
        robot_desc = ROBOT_DESCRIPTIONS.get(
            identity.role,
            ROBOT_DESCRIPTIONS[RobotRole.CUSTOM]
        )

        # Add capability-based details
        if identity.capabilities.primary:
            robot_desc += f" Specialized in: {', '.join(identity.capabilities.primary[:2])}."

        return base_prompt.format(
            robot_id=identity.robot_id,
            owner=identity.short_pubkey() if identity.owner == identity.pubkey else f"[{identity.owner[:8]}...]",
            title=identity.title,
            reputation=identity.reputation,
            robot_description=robot_desc,
        )

    async def _generate_image_fal(self, prompt: str) -> Tuple[str, Optional[bytes]]:
        """Generate passport image using FAL API."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Submit request to FAL queue
            response = await client.post(
                f"https://queue.fal.run/{self.config.fal_model}",
                headers=self._get_headers(),
                json={
                    "prompt": prompt,
                    "image_size": self.config.image_size,
                    "quality": self.config.quality,
                    "output_format": self.config.output_format,
                    "num_images": 1,
                },
            )
            response.raise_for_status()
            queue_response = response.json()
            request_id = queue_response.get("request_id")

            if not request_id:
                raise ValueError("No request_id returned from FAL API")

            # Poll for completion
            max_attempts = 60
            for _ in range(max_attempts):
                status_response = await client.get(
                    f"https://queue.fal.run/{self.config.fal_model}/requests/{request_id}/status",
                    headers=self._get_headers(),
                )
                status = status_response.json()

                if status.get("status") == "COMPLETED":
                    break
                elif status.get("status") == "FAILED":
                    raise ValueError(f"FAL request failed: {status}")

                await asyncio.sleep(2)
            else:
                raise TimeoutError("FAL request timed out")

            # Get result
            result_response = await client.get(
                f"https://queue.fal.run/{self.config.fal_model}/requests/{request_id}",
                headers=self._get_headers(),
            )
            result = result_response.json()

            images = result.get("images", [])
            if not images:
                raise ValueError("No images returned from FAL API")

            image_url = images[0].get("url")

            # Optionally download image data
            image_data = None
            if image_url:
                img_response = await client.get(image_url)
                if img_response.status_code == 200:
                    image_data = img_response.content

            return image_url, image_data

    async def generate_passport(
        self,
        identity: RobotIdentity,
        custom_prompt: Optional[str] = None,
    ) -> GeneratedPassport:
        """
        Generate a robot passport image.

        Args:
            identity: The robot identity information
            custom_prompt: Optional custom prompt override

        Returns:
            GeneratedPassport with image URL and data
        """
        prompt = custom_prompt or self._build_passport_prompt(identity)

        print(f"Generating passport for {identity.robot_id}...")
        print(f"Using FAL model: {self.config.fal_model}")

        image_url, image_data = await self._generate_image_fal(prompt)

        return GeneratedPassport(
            identity=identity,
            image_url=image_url,
            image_data=image_data,
        )

    async def generate_passport_with_template(
        self,
        identity: RobotIdentity,
        template_image_url: str,
    ) -> GeneratedPassport:
        """
        Generate a passport by editing an existing template image.

        Uses FAL's image editing API to customize a template.

        Args:
            identity: The robot identity information
            template_image_url: URL of the template image to edit

        Returns:
            GeneratedPassport with customized image
        """
        edit_prompt = f"""Edit this robot passport template to show:
- ID: {identity.robot_id}
- PUBKEY: {identity.short_pubkey()}
- OWNER: [Wallet Address]
- TITLE: {identity.title}
- REPUTATION: {identity.reputation}/100
- CAPABILITIES: {identity.capabilities.to_display_string()}

Keep the overall design but update the text fields and generate a unique robot portrait
that matches a {identity.role.value.lower()} robot."""

        async with httpx.AsyncClient(timeout=120.0) as client:
            # Use edit endpoint
            response = await client.post(
                f"https://queue.fal.run/{self.config.fal_model}/edit",
                headers=self._get_headers(),
                json={
                    "prompt": edit_prompt,
                    "image_urls": [template_image_url],
                    "image_size": "auto",
                    "quality": self.config.quality,
                    "output_format": self.config.output_format,
                    "input_fidelity": "high",
                },
            )
            response.raise_for_status()
            queue_response = response.json()
            request_id = queue_response.get("request_id")

            # Poll for completion (same as above)
            max_attempts = 60
            for _ in range(max_attempts):
                status_response = await client.get(
                    f"https://queue.fal.run/{self.config.fal_model}/requests/{request_id}/status",
                    headers=self._get_headers(),
                )
                status = status_response.json()

                if status.get("status") == "COMPLETED":
                    break
                elif status.get("status") == "FAILED":
                    raise ValueError(f"FAL request failed: {status}")

                await asyncio.sleep(2)

            # Get result
            result_response = await client.get(
                f"https://queue.fal.run/{self.config.fal_model}/requests/{request_id}",
                headers=self._get_headers(),
            )
            result = result_response.json()

            images = result.get("images", [])
            if not images:
                raise ValueError("No images returned from FAL API")

            image_url = images[0].get("url")
            image_data = None
            if image_url:
                img_response = await client.get(image_url)
                if img_response.status_code == 200:
                    image_data = img_response.content

            return GeneratedPassport(
                identity=identity,
                image_url=image_url,
                image_data=image_data,
            )

    def generate_metadata(
        self,
        passport: GeneratedPassport,
        collection_name: str = "Solana Robotics Passports",
    ) -> Dict[str, Any]:
        """
        Generate Metaplex-compatible metadata for the passport NFT.

        Args:
            passport: The generated passport
            collection_name: Name of the NFT collection

        Returns:
            Metadata dictionary compatible with Metaplex standard
        """
        identity = passport.identity

        return {
            "name": f"Robot Passport: {identity.robot_id}",
            "symbol": "SRKPASS",
            "description": f"Official Robot Passport for {identity.robot_id}, a {identity.role.value} in the Solana Robotics Kit ecosystem. Reputation: {identity.reputation}/100.",
            "image": passport.image_url,
            "external_url": f"https://solana-robotics.io/robots/{identity.robot_id}",
            "attributes": [
                {"trait_type": "Robot ID", "value": identity.robot_id},
                {"trait_type": "Role", "value": identity.role.value},
                {"trait_type": "Title", "value": identity.title},
                {"trait_type": "Reputation", "value": identity.reputation},
                {"trait_type": "Owner", "value": identity.owner},
                {"trait_type": "Pubkey", "value": identity.pubkey},
                {"trait_type": "Style", "value": self.config.style.value},
                {"trait_type": "Created", "value": identity.created_at.isoformat() if identity.created_at else ""},
            ] + [
                {"trait_type": "Capability", "value": cap}
                for cap in identity.capabilities.to_list()
            ],
            "properties": {
                "category": "image",
                "files": [
                    {
                        "uri": passport.image_url,
                        "type": f"image/{self.config.output_format}",
                    }
                ],
                "creators": [
                    {
                        "address": identity.owner,
                        "share": 100,
                    }
                ],
            },
            "collection": {
                "name": collection_name,
                "family": "Solana Robotics Kit",
            },
        }

    # Sync wrapper methods
    def generate_passport_sync(self, *args, **kwargs) -> GeneratedPassport:
        """Synchronous wrapper for generate_passport."""
        return asyncio.run(self.generate_passport(*args, **kwargs))

    def generate_passport_with_template_sync(self, *args, **kwargs) -> GeneratedPassport:
        """Synchronous wrapper for generate_passport_with_template."""
        return asyncio.run(self.generate_passport_with_template(*args, **kwargs))


# Convenience functions
def create_robot_identity(
    robot_id: str,
    pubkey: str,
    owner: str,
    role: RobotRole,
    capabilities: List[str],
    reputation: int = 50,
    title: Optional[str] = None,
) -> RobotIdentity:
    """Create a robot identity for passport generation."""
    return RobotIdentity(
        robot_id=robot_id,
        pubkey=pubkey,
        owner=owner,
        title=title or role.value,
        role=role,
        reputation=reputation,
        capabilities=RobotCapabilities(primary=capabilities[:3], secondary=capabilities[3:]),
    )


def generate_robot_id(prefix: str = "SRK") -> str:
    """Generate a unique robot ID."""
    import random
    import string
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{suffix}"


__all__ = [
    "RobotPassportGenerator",
    "PassportConfig",
    "PassportStyle",
    "RobotIdentity",
    "RobotCapabilities",
    "RobotRole",
    "GeneratedPassport",
    "create_robot_identity",
    "generate_robot_id",
    "PASSPORT_PROMPTS",
    "ROBOT_DESCRIPTIONS",
]
