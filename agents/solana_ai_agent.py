import logging
from typing import Optional

from utils.nim_client import build_nim_client_from_env

logger = logging.getLogger(__name__)

class SolanaAIAgent:
    """
    Main SolanaAI agent implementation.
    """
    def __init__(self, model_name: Optional[str] = None, verbosity_level: int = 1):
        self.model_name = model_name or "default"
        self.verbosity_level = verbosity_level
        self.nim_client = build_nim_client_from_env()
        if self.nim_client:
            logger.info("NVIDIA NIM client configured for low-latency inference.")

    def run(self, prompt: str) -> str:
        logger.info(f"Running agent with prompt: {prompt}")
        if self.nim_client:
            try:
                return self.nim_client.generate(prompt)
            except Exception as exc:
                logger.exception("NIM inference failed; falling back to placeholder response.")
                return f"[NIM error: {exc}]"
        return f"[Agent response for prompt: {prompt} (model: {self.model_name})]"
