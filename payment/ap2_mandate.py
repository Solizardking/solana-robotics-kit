from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, Optional

from payment.x402_module import X402PaymentHandler, X402PaymentInfo


@dataclass(frozen=True)
class AP2PaymentMandate:
    mandate_id: str
    pay_to: str
    token_mint: str
    max_amount: int
    expires_at: Optional[int] = None
    metadata: Dict[str, str] = field(default_factory=dict)

    def is_active(self) -> bool:
        if self.expires_at is None:
            return True
        return int(time.time()) < self.expires_at


class AP2MandateRegistry:
    def __init__(self) -> None:
        self._mandates: Dict[str, AP2PaymentMandate] = {}

    def create_mandate(
        self,
        pay_to: str,
        token_mint: str,
        max_amount: int,
        ttl_seconds: Optional[int] = None,
        metadata: Optional[Dict[str, str]] = None,
    ) -> AP2PaymentMandate:
        mandate_id = str(uuid.uuid4())
        expires_at = int(time.time()) + ttl_seconds if ttl_seconds else None
        mandate = AP2PaymentMandate(
            mandate_id=mandate_id,
            pay_to=pay_to,
            token_mint=token_mint,
            max_amount=max_amount,
            expires_at=expires_at,
            metadata=metadata or {},
        )
        self._mandates[mandate_id] = mandate
        return mandate

    def get(self, mandate_id: str) -> Optional[AP2PaymentMandate]:
        return self._mandates.get(mandate_id)

    def describe_mandate(self, mandate_id: str) -> Dict[str, str]:
        mandate = self.get(mandate_id)
        if not mandate:
            return {}
        return {
            "mandate_id": mandate.mandate_id,
            "pay_to": mandate.pay_to,
            "token_mint": mandate.token_mint,
            "max_amount": str(mandate.max_amount),
            "expires_at": str(mandate.expires_at) if mandate.expires_at else "",
            **mandate.metadata,
        }

    async def execute_payment(
        self,
        payment_handler: X402PaymentHandler,
        mandate_id: str,
        amount: int,
        memo: Optional[str] = None,
        reference: Optional[str] = None,
    ) -> Optional[str]:
        mandate = self.get(mandate_id)
        if not mandate or not mandate.is_active():
            raise ValueError("AP2 mandate is missing or expired")
        if amount > mandate.max_amount:
            raise ValueError("AP2 mandate exceeds max amount")

        payment_info = X402PaymentInfo(
            amount=amount,
            token_mint=mandate.token_mint,
            recipient=mandate.pay_to,
            reference=reference or mandate.mandate_id,
            memo=memo,
        )
        return await payment_handler.process_payment(payment_info)
