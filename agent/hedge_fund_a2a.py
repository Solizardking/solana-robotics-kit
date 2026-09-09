from __future__ import annotations

from a2a_integration.registry import A2AAgentConfig, A2AAgentRegistry


def build_hedge_fund_registry(base_url: str) -> A2AAgentRegistry:
    registry = A2AAgentRegistry()
    registry.register(
        A2AAgentConfig(
            name="quant-strategist",
            base_url=f"{base_url}/agents/quant-strategist",
            metadata={"role": "quantitative", "domain": "signals"},
        )
    )
    registry.register(
        A2AAgentConfig(
            name="risk-governor",
            base_url=f"{base_url}/agents/risk-governor",
            metadata={"role": "risk", "domain": "limits"},
        )
    )
    registry.register(
        A2AAgentConfig(
            name="execution-pilot",
            base_url=f"{base_url}/agents/execution-pilot",
            metadata={"role": "execution", "domain": "trade-routing"},
        )
    )
    registry.register(
        A2AAgentConfig(
            name="content-steward",
            base_url=f"{base_url}/agents/content-steward",
            metadata={"role": "content", "domain": "streaming"},
        )
    )
    return registry
