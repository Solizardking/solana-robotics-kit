"""
AI Token Concept Generator

Uses NVIDIA Nemotron LLM to autonomously generate creative token concepts
including name, ticker, description, and visual concepts.
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional
from dataclasses import dataclass
import httpx


@dataclass
class TokenConcept:
    """AI-generated token concept"""
    name: str
    symbol: str
    description: str
    image_prompt: str
    theme: str
    use_case: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "name": self.name,
            "symbol": self.symbol,
            "description": self.description,
            "image_prompt": self.image_prompt,
            "theme": self.theme,
            "use_case": self.use_case,
        }


class AITokenGenerator:
    """
    Generates creative token concepts using NVIDIA Nemotron LLM.

    This class uses the robot's reasoning capabilities to autonomously
    think of unique and creative token concepts.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://integrate.api.nvidia.com/v1",
        model: str = "nvidia/llama-3.1-nemotron-70b-instruct"
    ):
        """
        Initialize the AI token generator.

        Args:
            api_key: NVIDIA API key (or set NVIDIA_API_KEY env var)
            base_url: NIM API base URL
            model: Model to use for generation
        """
        self.api_key = api_key or os.getenv("NVIDIA_API_KEY")
        if not self.api_key:
            raise ValueError(
                "NVIDIA_API_KEY not found. Set environment variable or pass api_key."
            )

        self.base_url = base_url
        self.model = model
        self.client = httpx.AsyncClient(timeout=60.0)

        print(f"✓ AI Token Generator initialized with model: {model}")

    async def generate_token_concept(
        self,
        theme: Optional[str] = None,
        constraints: Optional[str] = None
    ) -> TokenConcept:
        """
        Generate a creative token concept using AI reasoning.

        Args:
            theme: Optional theme for the token (e.g., "robotics", "space", "nature")
            constraints: Optional constraints (e.g., "must be related to AI")

        Returns:
            TokenConcept with AI-generated details
        """
        print("\n🤖 Robot is thinking of a new token concept...")

        # Build the prompt
        prompt = self._build_prompt(theme, constraints)

        # Call LLM
        response_text = await self._call_llm(prompt)

        # Parse response
        concept = self._parse_response(response_text)

        print(f"\n✓ Token concept generated!")
        print(f"   Name: {concept.name}")
        print(f"   Symbol: {concept.symbol}")
        print(f"   Theme: {concept.theme}")
        print(f"   Description: {concept.description[:100]}...")

        return concept

    def _build_prompt(
        self,
        theme: Optional[str],
        constraints: Optional[str]
    ) -> str:
        """Build the LLM prompt for token generation"""

        base_prompt = """You are an autonomous robot on the Solana blockchain with the ability to create new cryptocurrency tokens.

Your task is to think creatively and come up with a unique, interesting token concept. Be original and innovative!

Generate a token concept with the following details:
1. Token Name: A catchy, memorable name
2. Token Symbol (Ticker): 3-6 uppercase letters
3. Theme: The overall theme/category (e.g., robotics, AI, space, nature, gaming)
4. Use Case: What the token could be used for
5. Description: A compelling 2-3 sentence description that explains the token's purpose and appeal
6. Image Prompt: A detailed description for generating the token's logo image (describe colors, style, elements)

"""

        if theme:
            base_prompt += f"\nTheme constraint: The token should be related to {theme}\n"

        if constraints:
            base_prompt += f"\nAdditional constraints: {constraints}\n"

        base_prompt += """
IMPORTANT: Return your response in this exact JSON format (and nothing else):
{
  "name": "Token Name Here",
  "symbol": "TICKER",
  "theme": "theme category",
  "use_case": "what the token is used for",
  "description": "Compelling description of the token in 2-3 sentences.",
  "image_prompt": "Detailed description for logo: a futuristic robot head in blue and silver, geometric style, glowing circuits, tech aesthetic"
}

Think creatively and be original! Generate the JSON now:"""

        return base_prompt

    async def _call_llm(self, prompt: str) -> str:
        """Call NVIDIA NIM API"""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.8,  # Higher for creativity
            "top_p": 0.9,
            "max_tokens": 1024,
        }

        try:
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            response_text = data["choices"][0]["message"]["content"]

            return response_text

        except Exception as e:
            print(f"❌ Error calling LLM: {e}")
            # Fallback to a simple concept
            return self._get_fallback_concept()

    def _get_fallback_concept(self) -> str:
        """Fallback concept if LLM fails"""
        return json.dumps({
            "name": "Robot Builder Token",
            "symbol": "BUILD",
            "theme": "robotics",
            "use_case": "Rewards for autonomous robot task completion",
            "description": "Robot Builder Token (BUILD) is the native currency for autonomous robots building and creating on Solana. Each BUILD token represents verified work completed by AI-powered robots.",
            "image_prompt": "A stylized robot hand holding building blocks, metallic blue and orange colors, modern minimalist design, slight glow effect"
        })

    def _parse_response(self, response_text: str) -> TokenConcept:
        """Parse LLM response into TokenConcept"""

        try:
            # Try to extract JSON from response
            # LLM might wrap it in markdown code blocks
            if "```json" in response_text:
                # Extract content between ```json and ```
                start = response_text.find("```json") + 7
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()
            elif "```" in response_text:
                # Extract content between ``` and ```
                start = response_text.find("```") + 3
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()

            data = json.loads(response_text)

            return TokenConcept(
                name=data["name"],
                symbol=data["symbol"].upper(),
                description=data["description"],
                image_prompt=data["image_prompt"],
                theme=data["theme"],
                use_case=data["use_case"],
            )

        except Exception as e:
            print(f"⚠️  Error parsing LLM response: {e}")
            print(f"Response was: {response_text[:200]}...")

            # Try fallback parsing
            data = json.loads(self._get_fallback_concept())
            return TokenConcept(
                name=data["name"],
                symbol=data["symbol"],
                description=data["description"],
                image_prompt=data["image_prompt"],
                theme=data["theme"],
                use_case=data["use_case"],
            )

    async def generate_multiple_concepts(
        self,
        count: int = 3,
        theme: Optional[str] = None
    ) -> list[TokenConcept]:
        """
        Generate multiple token concepts for the robot to choose from.

        Args:
            count: Number of concepts to generate
            theme: Optional theme constraint

        Returns:
            List of TokenConcept objects
        """
        print(f"\n🤖 Generating {count} token concepts...")

        concepts = []
        for i in range(count):
            print(f"\n[{i+1}/{count}] Thinking...")
            concept = await self.generate_token_concept(theme=theme)
            concepts.append(concept)
            await asyncio.sleep(1)  # Rate limiting

        return concepts

    async def select_best_concept(
        self,
        concepts: list[TokenConcept]
    ) -> TokenConcept:
        """
        Use AI to select the best concept from multiple options.

        Args:
            concepts: List of concepts to evaluate

        Returns:
            The best TokenConcept
        """
        print("\n🤖 Evaluating concepts to select the best one...")

        # Build evaluation prompt
        concepts_json = json.dumps(
            [c.to_dict() for c in concepts],
            indent=2
        )

        prompt = f"""You are an autonomous robot evaluating token concepts you've generated.

Here are {len(concepts)} token concepts to evaluate:

{concepts_json}

Analyze these concepts based on:
1. Creativity and uniqueness
2. Market appeal
3. Clear use case
4. Memorable name and ticker
5. Overall potential

Select the BEST concept and return ONLY the index number (0, 1, 2, etc.) of the best concept.
Return just the number, nothing else."""

        response = await self._call_llm(prompt)

        # Parse index
        try:
            # Extract first number from response
            import re
            match = re.search(r'\d+', response)
            if match:
                index = int(match.group())
                if 0 <= index < len(concepts):
                    selected = concepts[index]
                    print(f"✓ Selected: {selected.name} ({selected.symbol})")
                    return selected
        except Exception as e:
            print(f"⚠️  Error parsing selection: {e}")

        # Default to first concept
        print("⚠️  Defaulting to first concept")
        return concepts[0]

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


async def main():
    """Example usage"""

    generator = AITokenGenerator()

    try:
        # Generate a single concept
        concept = await generator.generate_token_concept(
            theme="autonomous robotics and AI"
        )

        print("\n" + "="*60)
        print("🎨 TOKEN CONCEPT GENERATED")
        print("="*60)
        print(json.dumps(concept.to_dict(), indent=2))
        print("="*60)

        # Generate multiple concepts and select best
        print("\n\n🔄 Now generating multiple concepts for selection...")
        concepts = await generator.generate_multiple_concepts(
            count=3,
            theme="robotics"
        )

        best = await generator.select_best_concept(concepts)

        print("\n" + "="*60)
        print("🏆 BEST CONCEPT SELECTED")
        print("="*60)
        print(json.dumps(best.to_dict(), indent=2))
        print("="*60)

    finally:
        await generator.close()


if __name__ == "__main__":
    asyncio.run(main())
