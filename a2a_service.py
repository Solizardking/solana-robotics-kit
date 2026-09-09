import json
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException

from a2a_integration.orchestrator import A2AOrchestrator
from a2a_integration.registry import A2AAgentConfig

orchestrator = A2AOrchestrator()


def _bootstrap_registry() -> None:
    """Bootstrap the A2A agent registry from environment variables."""
    registry_blob = os.getenv("A2A_AGENT_REGISTRY", "").strip()
    if registry_blob:
        orchestrator.bootstrap_from_env(registry_blob)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    _bootstrap_registry()
    yield
    # Shutdown (if needed in the future)
    # pass


app = FastAPI(
    title="Solana Automation A2A Gateway",
    lifespan=lifespan
)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/a2a/register")
def register_agent(payload: Dict[str, Any]) -> Dict[str, str]:
    try:
        agent = A2AAgentConfig(
            name=payload["name"],
            base_url=payload["base_url"],
            rpc_path=payload.get("rpc_path", "/rpc"),
            agent_card_path=payload.get("agent_card_path", "/.well-known/agent-card.json"),
            metadata=payload.get("metadata", {}),
        )
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=f"Missing field: {exc}") from exc
    orchestrator.register_agent(agent)
    return {"status": "registered", "agent": agent.name}


@app.post("/a2a/dispatch")
def dispatch_task(payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        agent_name = payload["agent"]
        method = payload["method"]
        params = payload.get("params", {})
        mandate_id = payload.get("ap2_mandate_id")
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=f"Missing field: {exc}") from exc

    result = orchestrator.submit_task(agent_name, method, params, mandate_id=mandate_id)
    return {"agent": result.agent, "response": result.response}


@app.get("/a2a/agent-card/{agent_name}")
def get_agent_card(agent_name: str) -> Dict[str, Any]:
    return orchestrator.fetch_agent_card(agent_name)
