"""packages/* $CLAWD token module tests."""
from packages.clawd_token import (
    CLAWD_TOKEN_MINT,
    CLAWD_TOKEN_SYMBOL,
    ClawdTokenClient,
    ClawdTokenInfo,
    KitTokenClient,
)
from packages.clawd_token.x402 import PaymentAsset, SUPPORTED_TOKENS
from packages import kit_token


def test_clawd_constants():
    assert CLAWD_TOKEN_MINT == "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"
    assert CLAWD_TOKEN_SYMBOL == "CLAWD"
    assert ClawdTokenInfo().mint == CLAWD_TOKEN_MINT
    assert ClawdTokenInfo().symbol == "CLAWD"


def test_x402_clawd_asset():
    assert PaymentAsset.CLAWD.value == "CLAWD"
    assert "CLAWD" in SUPPORTED_TOKENS
    assert SUPPORTED_TOKENS["CLAWD"]["mint"] == CLAWD_TOKEN_MINT
    assert "KIT" not in SUPPORTED_TOKENS


def test_compat_aliases():
    assert KitTokenClient is ClawdTokenClient
    assert kit_token.KIT_TOKEN_MINT == CLAWD_TOKEN_MINT
    assert kit_token.KitTokenClient is ClawdTokenClient


def test_no_old_bags_mint():
    from packages.clawd_token import CLAWD_TOKEN_MINT as m
    assert "DZbPqt" not in m
    assert m.startswith("8cHz")
