from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Optional


@dataclass(frozen=True)
class A2AAgentConfig:
    name: str
    base_url: str
    rpc_path: str = "/rpc"
    agent_card_path: str = "/.well-known/agent-card.json"
    metadata: Dict[str, str] = field(default_factory=dict)

    @property
    def rpc_url(self) -> str:
        return f"{self.base_url.rstrip('/')}{self.rpc_path}"

    @property
    def agent_card_url(self) -> str:
        return f"{self.base_url.rstrip('/')}{self.agent_card_path}"


class A2AAgentRegistry:
    def __init__(self) -> None:
        self._agents: Dict[str, A2AAgentConfig] = {}

    def register(self, agent: A2AAgentConfig) -> None:
        self._agents[agent.name] = agent

    def get(self, name: str) -> Optional[A2AAgentConfig]:
        return self._agents.get(name)

    def list(self) -> Dict[str, A2AAgentConfig]:
        return dict(self._agents)
