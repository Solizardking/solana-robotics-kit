#!/usr/bin/env python3
"""
Firecrawl Agent - Deep Web Research Agent for Solana Hedge Fund
Uses Firecrawl API /agent endpoint for autonomous web research
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum
import aiohttp
import json
from pydantic import BaseModel, Field

logger = logging.getLogger('firecrawl-agent')


class FirecrawlAgentStatus(str, Enum):
    """Firecrawl agent job statuses."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ResearchOutput(BaseModel):
    """Structured output schema for research results."""
    summary: str = Field(description="Executive summary of research findings")
    key_findings: List[str] = Field(description="List of key findings")
    sources: List[str] = Field(description="URLs of source materials")
    confidence_level: str = Field(description="Confidence in findings: HIGH, MEDIUM, LOW")
    market_implications: Optional[str] = Field(description="Market implications if applicable")
    risk_factors: Optional[List[str]] = Field(description="Identified risk factors")


@dataclass
class FirecrawlConfig:
    """Configuration for Firecrawl agent."""
    api_key: str
    base_url: str = "https://api.firecrawl.dev/v1"
    timeout: int = 300  # 5 minutes
    max_retries: int = 3
    poll_interval: int = 2  # seconds


class FirecrawlAgent:
    """
    Firecrawl Agent for deep web research and data gathering.

    Features:
    - No URLs required - just provide research prompt
    - Structured output with Pydantic schemas
    - Async job management with status polling
    - Dynamic credit-based billing tracking
    - Error handling and retry logic
    """

    def __init__(self, config: Optional[FirecrawlConfig] = None):
        """
        Initialize Firecrawl agent.

        Args:
            config: Firecrawl configuration. If None, loads from environment.
        """
        if config is None:
            api_key = os.getenv('FIRECRAWL_API_KEY')
            if not api_key:
                raise ValueError("FIRECRAWL_API_KEY environment variable not set")
            config = FirecrawlConfig(api_key=api_key)

        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        self._total_credits_used = 0

        logger.info("Firecrawl agent initialized")

    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession(
            headers={
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json"
            },
            timeout=aiohttp.ClientTimeout(total=self.config.timeout)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()

    async def research(
        self,
        prompt: str,
        use_structured_output: bool = True,
        max_depth: int = 3,
        include_raw_content: bool = False
    ) -> Dict[str, Any]:
        """
        Conduct deep web research using Firecrawl agent.

        Args:
            prompt: Research question or task description
            use_structured_output: Use Pydantic schema for structured results
            max_depth: Maximum depth of web navigation (1-5)
            include_raw_content: Include raw scraped content in response

        Returns:
            Research results with structured data
        """
        if not self.session:
            raise RuntimeError("Agent not initialized. Use 'async with' context manager.")

        logger.info(f"Starting research: {prompt[:100]}...")

        # Build request payload
        payload = {
            "prompt": prompt,
            "max_depth": max_depth,
            "include_raw_content": include_raw_content
        }

        # Add structured output schema if requested
        if use_structured_output:
            payload["schema"] = ResearchOutput.model_json_schema()

        # Start agent job
        job_id = await self._start_agent(payload)

        # Poll for completion
        result = await self._poll_until_complete(job_id)

        # Track credits used
        credits_used = result.get("credits_used", 0)
        self._total_credits_used += credits_used
        logger.info(f"Research complete. Credits used: {credits_used} (total: {self._total_credits_used})")

        return result

    async def _start_agent(self, payload: Dict[str, Any]) -> str:
        """
        Start a Firecrawl agent job.

        Args:
            payload: Request payload

        Returns:
            Job ID for status polling
        """
        url = f"{self.config.base_url}/agent"

        for attempt in range(self.config.max_retries):
            try:
                async with self.session.post(url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        job_id = data.get("id")
                        if not job_id:
                            raise ValueError("No job ID in response")

                        logger.info(f"Agent job started: {job_id}")
                        return job_id

                    elif response.status == 402:
                        error = await response.text()
                        raise ValueError(f"Insufficient Firecrawl credits: {error}")

                    elif response.status == 429:
                        logger.warning(f"Rate limited, attempt {attempt + 1}/{self.config.max_retries}")
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                        continue

                    else:
                        error_text = await response.text()
                        raise ValueError(f"Agent start failed: HTTP {response.status} - {error_text}")

            except asyncio.TimeoutError:
                logger.warning(f"Timeout starting agent, attempt {attempt + 1}/{self.config.max_retries}")
                if attempt < self.config.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise

            except Exception as e:
                logger.error(f"Error starting agent: {e}")
                if attempt < self.config.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise

        raise RuntimeError("Failed to start agent after retries")

    async def _poll_until_complete(self, job_id: str) -> Dict[str, Any]:
        """
        Poll agent job status until completion.

        Args:
            job_id: Job ID to poll

        Returns:
            Final job result
        """
        url = f"{self.config.base_url}/agent/{job_id}"
        start_time = asyncio.get_event_loop().time()

        while True:
            # Check timeout
            elapsed = asyncio.get_event_loop().time() - start_time
            if elapsed > self.config.timeout:
                raise TimeoutError(f"Agent job {job_id} exceeded timeout")

            try:
                async with self.session.get(url) as response:
                    if response.status != 200:
                        error = await response.text()
                        raise ValueError(f"Status check failed: HTTP {response.status} - {error}")

                    data = await response.json()
                    status = data.get("status")

                    if status == FirecrawlAgentStatus.COMPLETED:
                        logger.info(f"Agent job {job_id} completed")
                        return data

                    elif status == FirecrawlAgentStatus.FAILED:
                        error = data.get("error", "Unknown error")
                        raise RuntimeError(f"Agent job {job_id} failed: {error}")

                    elif status in [FirecrawlAgentStatus.PENDING, FirecrawlAgentStatus.RUNNING]:
                        logger.debug(f"Agent job {job_id} status: {status}")
                        await asyncio.sleep(self.config.poll_interval)

                    else:
                        logger.warning(f"Unknown status: {status}")
                        await asyncio.sleep(self.config.poll_interval)

            except asyncio.TimeoutError:
                logger.warning("Timeout polling status, retrying...")
                await asyncio.sleep(self.config.poll_interval)

    async def quick_search(self, query: str) -> str:
        """
        Quick search for simple queries.

        Args:
            query: Search query

        Returns:
            Summary of findings
        """
        result = await self.research(
            prompt=f"Quick search and summarize: {query}",
            use_structured_output=False,
            max_depth=1
        )

        # Extract summary from result
        data = result.get("data", {})
        if isinstance(data, dict):
            return data.get("summary", str(data))
        return str(data)

    async def deep_research(
        self,
        topic: str,
        specific_questions: Optional[List[str]] = None
    ) -> ResearchOutput:
        """
        Conduct deep research on a topic with optional specific questions.

        Args:
            topic: Research topic
            specific_questions: Specific questions to answer

        Returns:
            Structured research output
        """
        # Build comprehensive prompt
        prompt = f"Conduct deep research on: {topic}\n\n"

        if specific_questions:
            prompt += "Specifically answer these questions:\n"
            for i, q in enumerate(specific_questions, 1):
                prompt += f"{i}. {q}\n"

        prompt += "\nProvide comprehensive findings with sources and confidence assessment."

        result = await self.research(
            prompt=prompt,
            use_structured_output=True,
            max_depth=3,
            include_raw_content=False
        )

        # Parse structured output
        data = result.get("data", {})

        # Validate against schema
        if use_structured_output := result.get("schema"):
            return ResearchOutput(**data)

        # Fallback: construct from unstructured data
        return ResearchOutput(
            summary=data.get("summary", "No summary available"),
            key_findings=data.get("key_findings", []),
            sources=data.get("sources", []),
            confidence_level=data.get("confidence_level", "MEDIUM"),
            market_implications=data.get("market_implications"),
            risk_factors=data.get("risk_factors")
        )

    def get_credits_used(self) -> int:
        """Get total credits used by this agent instance."""
        return self._total_credits_used


async def example_usage():
    """Example usage of Firecrawl agent."""

    # Check if API key is set
    if not os.getenv('FIRECRAWL_API_KEY'):
        print("FIRECRAWL_API_KEY not set. Set it in .env file.")
        return

    async with FirecrawlAgent() as agent:
        # Example 1: Quick search
        print("Example 1: Quick Search")
        summary = await agent.quick_search("Solana TVL growth in 2025")
        print(f"Summary: {summary}\n")

        # Example 2: Deep research with structured output
        print("Example 2: Deep Research")
        research = await agent.deep_research(
            topic="Solana DEX market share and competitive dynamics",
            specific_questions=[
                "What is Solana's current DEX market share?",
                "Who are the main competitors?",
                "What are the growth trends?",
                "What are the key risk factors?"
            ]
        )

        print(f"Summary: {research.summary}")
        print(f"Key Findings: {research.key_findings}")
        print(f"Confidence: {research.confidence_level}")
        print(f"Credits Used: {agent.get_credits_used()}")


if __name__ == "__main__":
    asyncio.run(example_usage())
