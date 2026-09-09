from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests

from a2a_integration.registry import A2AAgentConfig, A2AAgentRegistry
from payment.ap2_mandate import AP2MandateRegistry

logger = logging.getLogger(__name__)


@dataclass
class A2ARequestResult:
    agent: str
    response: Dict[str, Any]


class A2AOrchestrator:
    def __init__(
        self,
        registry: Optional[A2AAgentRegistry] = None,
        ap2_registry: Optional[AP2MandateRegistry] = None,
        timeout_seconds: float = 30.0,
    ) -> None:
        self.registry = registry or A2AAgentRegistry()
        self.ap2_registry = ap2_registry or AP2MandateRegistry()
        self.timeout_seconds = timeout_seconds

    def register_agent(self, agent: A2AAgentConfig) -> None:
        self.registry.register(agent)

    def submit_task(
        self,
        agent_name: str,
        method: str,
        params: Dict[str, Any],
        mandate_id: Optional[str] = None,
    ) -> A2ARequestResult:
        agent = self.registry.get(agent_name)
        if not agent:
            raise ValueError(f"Unknown agent: {agent_name}")

        if mandate_id:
            params = dict(params)
            params["ap2_mandate"] = self.ap2_registry.describe_mandate(mandate_id)

        payload = {
            "jsonrpc": "2.0",
            "id": params.get("task_id", "task-1"),
            "method": method,
            "params": params,
        }

        logger.info("Dispatching A2A request to %s", agent.rpc_url)
        response = requests.post(
            agent.rpc_url,
            json=payload,
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        return A2ARequestResult(agent=agent.name, response=response.json())

    def fetch_agent_card(self, agent_name: str) -> Dict[str, Any]:
        agent = self.registry.get(agent_name)
        if not agent:
            raise ValueError(f"Unknown agent: {agent_name}")

        logger.info("Fetching agent card from %s", agent.agent_card_url)
        response = requests.get(agent.agent_card_url, timeout=self.timeout_seconds)
        response.raise_for_status()
        return response.json()

    def bootstrap_from_env(self, registry_blob: str) -> None:
        try:
            entries = json.loads(registry_blob)
        except json.JSONDecodeError as exc:
            raise ValueError("Invalid A2A registry JSON") from exc

        if not isinstance(entries, list):
            raise ValueError("A2A registry JSON must be a list of agents")

        for entry in entries:
            agent = A2AAgentConfig(
                name=entry["name"],
                base_url=entry["base_url"],
                rpc_path=entry.get("rpc_path", "/rpc"),
                agent_card_path=entry.get("agent_card_path", "/.well-known/agent-card.json"),
                metadata=entry.get("metadata", {}),
            )
            self.register_agent(agent)
