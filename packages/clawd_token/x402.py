#!/usr/bin/env python3
"""
x402 Protocol Integration for Robot-to-Robot Commerce
======================================================

Implements the x402 HTTP Payment Protocol for autonomous robot transactions.

x402 Protocol:
- HTTP 402 "Payment Required" status code
- Machine-readable payment terms
- Cryptographic payment proofs
- USDC/Token payments on Solana

Features:
- Robot API monetization
- Per-request micro-payments
- Autonomous service discovery
- $CLAWD token integration
- Multi-token support (USDC, CLAWD)

Reference: https://x402.org
"""

import asyncio
import os
import json
import hashlib
import base64
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Callable, Awaitable
from enum import Enum
import logging

try:
    import httpx
except ImportError:
    httpx = None

from . import (
    CLAWD_TOKEN_MINT,
    CLAWD_TOKEN_SYMBOL,
    CLAWD_TOKEN_DECIMALS,
    ClawdTokenClient,
)

logger = logging.getLogger("x402")

# =============================================================================
# x402 CONSTANTS
# =============================================================================

# Supported tokens for x402 payments
SUPPORTED_TOKENS = {
    "CLAWD": {
        "mint": CLAWD_TOKEN_MINT,
        "decimals": CLAWD_TOKEN_DECIMALS,
        "network": "solana",
    },
    "USDC": {
        "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  # USDC on Solana
        "decimals": 6,
        "network": "solana",
    },
    "SOL": {
        "mint": "So11111111111111111111111111111111111111112",  # Wrapped SOL
        "decimals": 9,
        "network": "solana",
    },
}

# Default x402 facilitator (Coinbase CDP)
X402_FACILITATOR_URL = os.getenv("X402_FACILITATOR_URL", "https://x402.org/facilitator")

# Payment proof header
X402_PAYMENT_HEADER = "X-Payment"
X402_PAYMENT_PROOF_HEADER = "X-Payment-Proof"


# =============================================================================
# DATA CLASSES
# =============================================================================

class PaymentAsset(Enum):
    """Supported payment assets"""
    CLAWD = "CLAWD"
    USDC = "USDC"
    SOL = "SOL"


@dataclass
class PaymentTerms:
    """x402 payment terms (from 402 response)"""
    amount: float
    asset: PaymentAsset
    recipient: str
    network: str = "solana"
    description: Optional[str] = None
    expires_at: Optional[datetime] = None
    memo: Optional[str] = None

    def to_header(self) -> str:
        """Convert to x402 header format"""
        data = {
            "amount": str(self.amount),
            "asset": self.asset.value,
            "recipient": self.recipient,
            "network": self.network,
        }
        if self.description:
            data["description"] = self.description
        if self.expires_at:
            data["expires"] = self.expires_at.isoformat()
        if self.memo:
            data["memo"] = self.memo
        return base64.b64encode(json.dumps(data).encode()).decode()

    @classmethod
    def from_header(cls, header: str) -> "PaymentTerms":
        """Parse from x402 header"""
        try:
            data = json.loads(base64.b64decode(header))
            return cls(
                amount=float(data["amount"]),
                asset=PaymentAsset(data["asset"]),
                recipient=data["recipient"],
                network=data.get("network", "solana"),
                description=data.get("description"),
                expires_at=datetime.fromisoformat(data["expires"]) if "expires" in data else None,
                memo=data.get("memo"),
            )
        except Exception as e:
            logger.error(f"Failed to parse payment terms: {e}")
            raise ValueError(f"Invalid payment terms header: {e}")


@dataclass
class PaymentProof:
    """Cryptographic payment proof"""
    signature: str
    payer: str
    recipient: str
    amount: float
    asset: PaymentAsset
    timestamp: datetime
    block_height: Optional[int] = None

    def to_header(self) -> str:
        """Convert to x402 proof header"""
        data = {
            "signature": self.signature,
            "payer": self.payer,
            "recipient": self.recipient,
            "amount": str(self.amount),
            "asset": self.asset.value,
            "timestamp": self.timestamp.isoformat(),
        }
        if self.block_height:
            data["block"] = self.block_height
        return base64.b64encode(json.dumps(data).encode()).decode()

    @classmethod
    def from_header(cls, header: str) -> "PaymentProof":
        """Parse from x402 proof header"""
        try:
            data = json.loads(base64.b64decode(header))
            return cls(
                signature=data["signature"],
                payer=data["payer"],
                recipient=data["recipient"],
                amount=float(data["amount"]),
                asset=PaymentAsset(data["asset"]),
                timestamp=datetime.fromisoformat(data["timestamp"]),
                block_height=data.get("block"),
            )
        except Exception as e:
            raise ValueError(f"Invalid payment proof header: {e}")


@dataclass
class RobotService:
    """Robot service available via x402"""
    service_id: str
    robot_id: str
    name: str
    description: str
    endpoint: str
    price_per_request: float
    asset: PaymentAsset = PaymentAsset.CLAWD
    capabilities: List[str] = field(default_factory=list)
    rate_limit: Optional[int] = None  # requests per minute
    is_active: bool = True


@dataclass
class ServiceRequest:
    """Request to a robot service"""
    service_id: str
    requester: str
    payload: Dict[str, Any]
    payment_proof: Optional[PaymentProof] = None
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class ServiceResponse:
    """Response from a robot service"""
    service_id: str
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    payment_received: float = 0.0


# =============================================================================
# x402 CLIENT (For making paid requests)
# =============================================================================

class X402Client:
    """
    x402 Protocol Client for Robot-to-Robot Commerce.

    Enables autonomous robots to:
    - Discover and consume paid services
    - Make automatic micropayments
    - Handle 402 Payment Required responses
    """

    def __init__(
        self,
        token_client: Optional[ClawdTokenClient] = None,
        default_asset: PaymentAsset = PaymentAsset.CLAWD,
        auto_pay: bool = True,
        max_auto_pay: float = 10.0,  # Max $CLAWD per request
    ):
        self.token_client = token_client or ClawdTokenClient()
        self.default_asset = default_asset
        self.auto_pay = auto_pay
        self.max_auto_pay = max_auto_pay

        self._http_client = None
        self._payment_history: List[PaymentProof] = []

        logger.info("🔄 x402 Client initialized")

    async def _get_http(self):
        """Get HTTP client"""
        if self._http_client is None:
            if httpx:
                self._http_client = httpx.AsyncClient(timeout=30.0)
            else:
                raise ImportError("httpx required for x402 client: pip install httpx")
        return self._http_client

    async def request(
        self,
        url: str,
        method: str = "GET",
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Make an x402-enabled HTTP request.

        Automatically handles:
        - 402 Payment Required responses
        - Payment execution
        - Payment proof submission

        Args:
            url: Service endpoint URL
            method: HTTP method
            data: Request payload
            headers: Additional headers

        Returns:
            Response data or error
        """
        http = await self._get_http()
        headers = headers or {}

        # First request (may get 402)
        logger.debug(f"x402 request: {method} {url}")

        if method == "GET":
            response = await http.get(url, headers=headers)
        elif method == "POST":
            response = await http.post(url, json=data, headers=headers)
        else:
            response = await http.request(method, url, json=data, headers=headers)

        # Handle 402 Payment Required
        if response.status_code == 402:
            logger.info("Received 402 Payment Required")

            # Parse payment terms from header
            terms_header = response.headers.get(X402_PAYMENT_HEADER)
            if not terms_header:
                raise ValueError("402 response missing payment terms header")

            terms = PaymentTerms.from_header(terms_header)
            logger.info(f"Payment terms: {terms.amount} {terms.asset.value} to {terms.recipient[:16]}...")

            # Check if we should auto-pay
            if not self.auto_pay:
                return {
                    "error": "payment_required",
                    "terms": terms.__dict__,
                }

            if terms.amount > self.max_auto_pay:
                return {
                    "error": "payment_exceeds_limit",
                    "requested": terms.amount,
                    "limit": self.max_auto_pay,
                }

            # Execute payment
            proof = await self._execute_payment(terms)
            if not proof:
                return {"error": "payment_failed"}

            # Retry request with payment proof
            headers[X402_PAYMENT_PROOF_HEADER] = proof.to_header()

            if method == "GET":
                response = await http.get(url, headers=headers)
            elif method == "POST":
                response = await http.post(url, json=data, headers=headers)
            else:
                response = await http.request(method, url, json=data, headers=headers)

        # Parse response
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "error": f"request_failed_{response.status_code}",
                "message": response.text[:500],
            }

    async def _execute_payment(self, terms: PaymentTerms) -> Optional[PaymentProof]:
        """Execute payment based on terms"""
        logger.info(f"Executing payment: {terms.amount} {terms.asset.value}")

        try:
            # Transfer tokens
            transfer = await self.token_client.transfer(
                to_address=terms.recipient,
                amount=terms.amount,
                memo=f"x402:{terms.memo or 'payment'}",
            )

            if not transfer:
                return None

            proof = PaymentProof(
                signature=transfer.signature,
                payer=self.token_client.pubkey,
                recipient=terms.recipient,
                amount=terms.amount,
                asset=terms.asset,
                timestamp=datetime.now(),
            )

            self._payment_history.append(proof)
            logger.info(f"✅ Payment complete: {proof.signature}")
            return proof

        except Exception as e:
            logger.error(f"Payment execution error: {e}")
            return None

    async def close(self):
        """Close client connections"""
        if self._http_client:
            await self._http_client.aclose()
        await self.token_client.close()


# =============================================================================
# x402 SERVER (For providing paid services)
# =============================================================================

class X402Server:
    """
    x402 Protocol Server for Robot Services.

    Enables robots to:
    - Monetize their capabilities
    - Accept $CLAWD micropayments
    - Serve other robots autonomously
    """

    def __init__(
        self,
        robot_id: str,
        recipient_address: str,
        default_price: float = 0.1,
        default_asset: PaymentAsset = PaymentAsset.CLAWD,
    ):
        self.robot_id = robot_id
        self.recipient = recipient_address
        self.default_price = default_price
        self.default_asset = default_asset

        self._services: Dict[str, RobotService] = {}
        self._handlers: Dict[str, Callable[[ServiceRequest], Awaitable[ServiceResponse]]] = {}
        self._verified_payments: List[PaymentProof] = []

        logger.info(f"🤖 x402 Server initialized for robot {robot_id}")

    def register_service(
        self,
        service_id: str,
        name: str,
        description: str,
        handler: Callable[[ServiceRequest], Awaitable[ServiceResponse]],
        price: Optional[float] = None,
        asset: Optional[PaymentAsset] = None,
        capabilities: Optional[List[str]] = None,
    ) -> RobotService:
        """
        Register a paid service.

        Args:
            service_id: Unique service identifier
            name: Human-readable service name
            description: Service description
            handler: Async function to handle requests
            price: Price per request (defaults to server default)
            asset: Payment asset (defaults to server default)
            capabilities: Required robot capabilities

        Returns:
            Registered RobotService
        """
        service = RobotService(
            service_id=service_id,
            robot_id=self.robot_id,
            name=name,
            description=description,
            endpoint=f"/x402/{service_id}",
            price_per_request=price or self.default_price,
            asset=asset or self.default_asset,
            capabilities=capabilities or [],
        )

        self._services[service_id] = service
        self._handlers[service_id] = handler

        logger.info(f"Registered service: {service_id} ({service.price_per_request} {service.asset.value})")
        return service

    def get_payment_terms(self, service_id: str, memo: Optional[str] = None) -> PaymentTerms:
        """Generate payment terms for a service"""
        if service_id not in self._services:
            raise ValueError(f"Unknown service: {service_id}")

        service = self._services[service_id]

        return PaymentTerms(
            amount=service.price_per_request,
            asset=service.asset,
            recipient=self.recipient,
            description=service.description,
            expires_at=datetime.now() + timedelta(minutes=5),
            memo=memo or service_id,
        )

    async def verify_payment(self, proof: PaymentProof, service_id: str) -> bool:
        """
        Verify a payment proof.

        In production: verify on-chain transaction signature.
        """
        service = self._services.get(service_id)
        if not service:
            return False

        # Verify payment details
        if proof.recipient != self.recipient:
            logger.warning(f"Invalid recipient: {proof.recipient}")
            return False

        if proof.amount < service.price_per_request:
            logger.warning(f"Insufficient payment: {proof.amount} < {service.price_per_request}")
            return False

        if proof.asset != service.asset:
            logger.warning(f"Wrong asset: {proof.asset.value}")
            return False

        # In production: verify signature on-chain
        # For now: accept if format is valid
        self._verified_payments.append(proof)
        logger.info(f"✅ Payment verified: {proof.signature[:24]}...")
        return True

    async def handle_request(
        self,
        service_id: str,
        payload: Dict[str, Any],
        payment_proof_header: Optional[str] = None,
        requester: str = "unknown",
    ) -> tuple[int, Dict[str, Any]]:
        """
        Handle an incoming service request.

        Returns:
            Tuple of (HTTP status code, response body)
        """
        # Check if service exists
        if service_id not in self._services:
            return 404, {"error": "service_not_found"}

        service = self._services[service_id]

        # If no payment proof, return 402
        if not payment_proof_header:
            terms = self.get_payment_terms(service_id, f"request:{requester[:16]}")
            return 402, {
                "error": "payment_required",
                "message": f"Payment of {service.price_per_request} {service.asset.value} required",
                X402_PAYMENT_HEADER: terms.to_header(),
            }

        # Verify payment
        try:
            proof = PaymentProof.from_header(payment_proof_header)
            if not await self.verify_payment(proof, service_id):
                return 402, {"error": "invalid_payment"}
        except Exception as e:
            return 402, {"error": f"payment_verification_failed: {e}"}

        # Execute service handler
        try:
            request = ServiceRequest(
                service_id=service_id,
                requester=requester,
                payload=payload,
                payment_proof=proof,
            )

            handler = self._handlers[service_id]
            response = await handler(request)

            return 200, {
                "success": response.success,
                "data": response.data,
                "payment_received": proof.amount,
            }

        except Exception as e:
            logger.error(f"Service handler error: {e}")
            return 500, {"error": f"service_error: {e}"}

    def list_services(self) -> List[Dict[str, Any]]:
        """List all registered services"""
        return [
            {
                "service_id": s.service_id,
                "name": s.name,
                "description": s.description,
                "price": s.price_per_request,
                "asset": s.asset.value,
                "capabilities": s.capabilities,
            }
            for s in self._services.values()
            if s.is_active
        ]


# =============================================================================
# ROBOT SERVICE REGISTRY
# =============================================================================

class RobotServiceRegistry:
    """
    Decentralized registry of robot services.

    Enables discovery of x402-enabled robot services.
    """

    def __init__(self):
        self._services: Dict[str, List[RobotService]] = {}  # By capability
        self._robots: Dict[str, List[RobotService]] = {}    # By robot

    def register(self, service: RobotService):
        """Register a service"""
        # Index by robot
        if service.robot_id not in self._robots:
            self._robots[service.robot_id] = []
        self._robots[service.robot_id].append(service)

        # Index by capability
        for cap in service.capabilities:
            if cap not in self._services:
                self._services[cap] = []
            self._services[cap].append(service)

        logger.info(f"Registered service {service.service_id} from robot {service.robot_id}")

    def find_by_capability(
        self,
        capability: str,
        max_price: Optional[float] = None,
        asset: Optional[PaymentAsset] = None,
    ) -> List[RobotService]:
        """Find services by capability"""
        services = self._services.get(capability, [])

        if max_price is not None:
            services = [s for s in services if s.price_per_request <= max_price]

        if asset is not None:
            services = [s for s in services if s.asset == asset]

        return [s for s in services if s.is_active]

    def find_by_robot(self, robot_id: str) -> List[RobotService]:
        """Find services by robot"""
        return [s for s in self._robots.get(robot_id, []) if s.is_active]


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

async def make_paid_request(
    url: str,
    method: str = "GET",
    data: Optional[Dict[str, Any]] = None,
    max_payment: float = 1.0,
) -> Dict[str, Any]:
    """Make a single x402 request"""
    client = X402Client(max_auto_pay=max_payment)
    try:
        return await client.request(url, method, data)
    finally:
        await client.close()


def create_payment_terms(
    amount: float,
    recipient: str,
    asset: PaymentAsset = PaymentAsset.CLAWD,
    description: Optional[str] = None,
) -> PaymentTerms:
    """Create payment terms for a 402 response"""
    return PaymentTerms(
        amount=amount,
        asset=asset,
        recipient=recipient,
        description=description,
        expires_at=datetime.now() + timedelta(minutes=5),
    )


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Constants
    "SUPPORTED_TOKENS",
    "X402_PAYMENT_HEADER",
    "X402_PAYMENT_PROOF_HEADER",
    # Enums
    "PaymentAsset",
    # Data Classes
    "PaymentTerms",
    "PaymentProof",
    "RobotService",
    "ServiceRequest",
    "ServiceResponse",
    # Classes
    "X402Client",
    "X402Server",
    "RobotServiceRegistry",
    # Functions
    "make_paid_request",
    "create_payment_terms",
]
