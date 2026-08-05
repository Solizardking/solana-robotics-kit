"""
Token Logo Image Generator

Generates token logo images using NVIDIA's image generation APIs or fallback methods.
Supports both AI-generated images and placeholder generation.
"""

import os
import asyncio
import base64
import hashlib
from typing import Optional, Dict, Any
from pathlib import Path
import httpx


class TokenImageGenerator:
    """
    Generates logo images for tokens using AI or placeholders.

    Supports:
    1. NVIDIA Picasso API for AI-generated images
    2. Stable Diffusion via API
    3. Placeholder generation as fallback
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        output_dir: str = "/tmp/token_images"
    ):
        """
        Initialize the image generator.

        Args:
            api_key: NVIDIA API key for image generation
            output_dir: Directory to save generated images
        """
        self.api_key = api_key or os.getenv("NVIDIA_API_KEY")
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.client = httpx.AsyncClient(timeout=120.0)

        print(f"✓ Image generator initialized")
        print(f"   Output directory: {self.output_dir}")

    async def generate_token_logo(
        self,
        prompt: str,
        symbol: str,
        style: str = "digital art, logo design, clean, professional"
    ) -> Dict[str, Any]:
        """
        Generate a token logo image.

        Args:
            prompt: Description of the desired image
            symbol: Token symbol (used for filename)
            style: Additional style guidance

        Returns:
            Dictionary with image_path, image_url, and metadata
        """
        print(f"\n🎨 Generating logo for {symbol}...")
        print(f"   Prompt: {prompt}")

        # Enhance prompt for logo generation
        enhanced_prompt = f"{prompt}, {style}, high quality, centered composition, transparent background"

        # Try AI generation first
        image_path = None

        if self.api_key:
            try:
                print("   Attempting AI generation...")
                image_path = await self._generate_with_nvidia(enhanced_prompt, symbol)
            except Exception as e:
                print(f"   ⚠️  AI generation failed: {e}")

        # Fallback to placeholder
        if image_path is None:
            print("   Using placeholder generation...")
            image_path = await self._generate_placeholder(symbol, prompt)

        # Generate a mock URL (in production, upload to IPFS or cloud storage)
        image_url = f"https://token-images.example.com/{symbol.lower()}.png"

        # In production, you would upload to IPFS here:
        # image_url = await self._upload_to_ipfs(image_path)

        print(f"✓ Logo generated!")
        print(f"   File: {image_path}")
        print(f"   URL: {image_url}")

        return {
            "image_path": str(image_path),
            "image_url": image_url,
            "prompt": prompt,
            "symbol": symbol,
        }

    async def _generate_with_nvidia(
        self,
        prompt: str,
        symbol: str
    ) -> Optional[Path]:
        """
        Generate image using NVIDIA Picasso API.

        Note: This is a placeholder implementation. The actual NVIDIA API
        for image generation may vary. Update with real endpoint when available.
        """

        # Example endpoint (update with actual NVIDIA image gen API)
        # For now, this is a conceptual implementation
        endpoint = "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "prompt": prompt,
            "negative_prompt": "blurry, low quality, distorted, ugly",
            "samples": 1,
            "steps": 30,
            "cfg_scale": 7,
            "height": 512,
            "width": 512,
        }

        try:
            response = await self.client.post(
                endpoint,
                headers=headers,
                json=payload
            )

            if response.status_code == 200:
                data = response.json()

                # Extract image data (format depends on API response)
                if "artifacts" in data and len(data["artifacts"]) > 0:
                    image_data = data["artifacts"][0].get("base64")

                    if image_data:
                        # Decode and save
                        image_bytes = base64.b64decode(image_data)
                        image_path = self.output_dir / f"{symbol.lower()}_logo.png"

                        with open(image_path, "wb") as f:
                            f.write(image_bytes)

                        return image_path

        except Exception as e:
            print(f"   Error in NVIDIA API call: {e}")
            return None

        return None

    async def _generate_placeholder(
        self,
        symbol: str,
        description: str
    ) -> Path:
        """
        Generate a placeholder logo using PIL.

        Creates a simple colored square with the token symbol.
        """
        try:
            from PIL import Image, ImageDraw, ImageFont
        except ImportError:
            print("   ⚠️  PIL not available, creating text file placeholder")
            # Create a text file as absolute fallback
            text_path = self.output_dir / f"{symbol.lower()}_logo.txt"
            with open(text_path, "w") as f:
                f.write(f"Token: {symbol}\nDescription: {description}")
            return text_path

        # Generate a color from the symbol (deterministic)
        color = self._symbol_to_color(symbol)

        # Create image
        size = 512
        image = Image.new("RGB", (size, size), color=color)
        draw = ImageDraw.Draw(image)

        # Try to load a font, fall back to default if not available
        try:
            font_size = 180
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except Exception:
            try:
                font = ImageFont.truetype("arial.ttf", 180)
            except Exception:
                font = ImageFont.load_default()

        # Draw symbol in center
        # Get text bounding box for centering
        bbox = draw.textbbox((0, 0), symbol, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        x = (size - text_width) // 2
        y = (size - text_height) // 2

        # Draw text with shadow for depth
        shadow_color = tuple(max(0, c - 50) for c in color)
        draw.text((x + 3, y + 3), symbol, fill=shadow_color, font=font)
        draw.text((x, y), symbol, fill="white", font=font)

        # Add a border
        border_width = 10
        border_color = tuple(min(255, c + 50) for c in color)
        draw.rectangle(
            [0, 0, size - 1, size - 1],
            outline=border_color,
            width=border_width
        )

        # Save image
        image_path = self.output_dir / f"{symbol.lower()}_logo.png"
        image.save(image_path)

        print(f"   Created placeholder with color: rgb{color}")

        return image_path

    def _symbol_to_color(self, symbol: str) -> tuple:
        """
        Convert symbol to a deterministic RGB color.

        Args:
            symbol: Token symbol

        Returns:
            RGB tuple
        """
        # Use hash to generate deterministic color
        hash_value = int(hashlib.md5(symbol.encode()).hexdigest()[:6], 16)

        r = (hash_value >> 16) & 0xFF
        g = (hash_value >> 8) & 0xFF
        b = hash_value & 0xFF

        # Ensure colors are not too dark
        r = max(r, 80)
        g = max(g, 80)
        b = max(b, 80)

        # Adjust to make colors more vibrant
        max_val = max(r, g, b)
        if max_val < 200:
            scale = 200 / max_val
            r = min(255, int(r * scale))
            g = min(255, int(g * scale))
            b = min(255, int(b * scale))

        return (r, g, b)

    async def upload_to_ipfs(
        self,
        file_path: Path
    ) -> str:
        """
        Upload image to IPFS for decentralized storage.

        Args:
            file_path: Path to image file

        Returns:
            IPFS URL
        """
        # This is a placeholder implementation
        # In production, use services like:
        # - Pinata (https://pinata.cloud)
        # - NFT.Storage (https://nft.storage)
        # - Web3.Storage (https://web3.storage)

        print("   📤 Uploading to IPFS...")

        # Example with NFT.Storage (requires API key)
        # nft_storage_key = os.getenv("NFT_STORAGE_KEY")
        # if nft_storage_key:
        #     try:
        #         with open(file_path, 'rb') as f:
        #             response = await self.client.post(
        #                 "https://api.nft.storage/upload",
        #                 headers={"Authorization": f"Bearer {nft_storage_key}"},
        #                 files={"file": f}
        #             )
        #             data = response.json()
        #             ipfs_hash = data["value"]["cid"]
        #             return f"https://ipfs.io/ipfs/{ipfs_hash}"
        #     except Exception as e:
        #         print(f"   Error uploading to IPFS: {e}")

        # Mock IPFS URL for development
        ipfs_hash = hashlib.sha256(str(file_path).encode()).hexdigest()[:32]
        return f"https://ipfs.io/ipfs/{ipfs_hash}"

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


async def main():
    """Example usage"""

    generator = TokenImageGenerator()

    try:
        # Generate a logo
        result = await generator.generate_token_logo(
            prompt="A futuristic robot head with glowing blue circuits, geometric design",
            symbol="ROBOT",
            style="cyberpunk, neon, digital art"
        )

        print("\n" + "="*60)
        print("🎨 IMAGE GENERATED")
        print("="*60)
        print(f"Path: {result['image_path']}")
        print(f"URL: {result['image_url']}")
        print("="*60)

    finally:
        await generator.close()


if __name__ == "__main__":
    asyncio.run(main())
