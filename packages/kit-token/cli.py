#!/usr/bin/env python3
"""
$KIT Token CLI
==============

Command-line interface for $KIT token operations.

Usage:
    python -m packages.kit_token.cli info
    python -m packages.kit_token.cli balance [ADDRESS]
    python -m packages.kit_token.cli transfer TO_ADDRESS AMOUNT
    python -m packages.kit_token.cli stake ROBOT_ID --tier premium
    python -m packages.kit_token.cli x402 request URL
"""

import asyncio
import argparse
import json
import sys
from datetime import datetime

from . import (
    KIT_TOKEN_MINT,
    KIT_TOKEN_NAME,
    KIT_TOKEN_SYMBOL,
    KIT_TOKEN_DECIMALS,
    STAKING_TIERS,
    ACTION_LOG_COSTS,
    KitTokenClient,
    StakingTier,
    get_token_info,
)
from .x402 import (
    X402Client,
    X402Server,
    PaymentAsset,
    make_paid_request,
)


def print_header():
    """Print CLI header"""
    print()
    print("=" * 60)
    print(f"  🪙 {KIT_TOKEN_NAME} Token CLI")
    print(f"  Contract: {KIT_TOKEN_MINT}")
    print("=" * 60)
    print()


def cmd_info(args):
    """Show token information"""
    print_header()

    info = get_token_info()

    print("Token Information:")
    print(f"  Name:      {info.name}")
    print(f"  Symbol:    {info.symbol}")
    print(f"  Mint:      {info.mint}")
    print(f"  Decimals:  {info.decimals}")
    print(f"  Platform:  {info.launch_platform}")

    print("\nStaking Tiers:")
    for tier, amount in STAKING_TIERS.items():
        print(f"  {tier.capitalize():12} {amount:,} {KIT_TOKEN_SYMBOL}")

    print("\nAction Log Costs:")
    for action, cost in ACTION_LOG_COSTS.items():
        print(f"  {action:15} {cost} {KIT_TOKEN_SYMBOL}")

    print("\nUseful Links:")
    print(f"  bags.fm:    https://bags.fm/token/{KIT_TOKEN_MINT}")
    print(f"  Solscan:    https://solscan.io/token/{KIT_TOKEN_MINT}")
    print(f"  x402 Docs:  https://x402.org")


def cmd_balance(args):
    """Check token balance"""
    async def _balance():
        client = KitTokenClient()
        address = args.address or client.pubkey
        balance = await client.get_balance(address)
        await client.close()

        print_header()
        print(f"Address: {address}")
        print(f"Balance: {balance.formatted}")
        print(f"Raw:     {balance.raw_amount}")

    asyncio.run(_balance())


def cmd_transfer(args):
    """Transfer tokens"""
    async def _transfer():
        client = KitTokenClient()

        print_header()
        print(f"Transferring {args.amount} {KIT_TOKEN_SYMBOL}")
        print(f"  To: {args.to_address}")

        transfer = await client.transfer(
            to_address=args.to_address,
            amount=args.amount,
            memo=args.memo,
        )
        await client.close()

        if transfer:
            print(f"\n✅ Transfer Successful!")
            print(f"  Signature: {transfer.signature}")
            print(f"  Amount:    {transfer.amount} {KIT_TOKEN_SYMBOL}")
        else:
            print("\n❌ Transfer Failed")
            sys.exit(1)

    asyncio.run(_transfer())


def cmd_stake(args):
    """Stake tokens for robot"""
    async def _stake():
        client = KitTokenClient()

        tier = StakingTier(args.tier)
        amount = STAKING_TIERS[tier.value]

        print_header()
        print(f"Staking for Robot: {args.robot_id}")
        print(f"  Tier:   {tier.value.capitalize()}")
        print(f"  Amount: {amount} {KIT_TOKEN_SYMBOL}")

        stake = await client.stake_for_robot(args.robot_id, tier)
        await client.close()

        if stake:
            print(f"\n✅ Stake Successful!")
            print(f"  Robot:    {stake.robot_id}")
            print(f"  Amount:   {stake.amount} {KIT_TOKEN_SYMBOL}")
            print(f"  Tier:     {stake.tier.value}")
            print(f"  Staked:   {stake.staked_at}")
        else:
            print("\n❌ Staking Failed")
            sys.exit(1)

    asyncio.run(_stake())


def cmd_unstake(args):
    """Unstake tokens from robot"""
    async def _unstake():
        client = KitTokenClient()

        print_header()
        print(f"Unstaking from Robot: {args.robot_id}")

        amount = await client.unstake(args.robot_id)
        await client.close()

        if amount:
            print(f"\n✅ Unstake Successful!")
            print(f"  Amount Returned: {amount} {KIT_TOKEN_SYMBOL}")
        else:
            print("\n❌ Unstake Failed")
            sys.exit(1)

    asyncio.run(_unstake())


def cmd_x402_request(args):
    """Make x402 paid request"""
    async def _request():
        print_header()
        print(f"x402 Request: {args.url}")
        print(f"  Method:    {args.method}")
        print(f"  Max Pay:   {args.max_pay} {KIT_TOKEN_SYMBOL}")

        result = await make_paid_request(
            url=args.url,
            method=args.method,
            max_payment=args.max_pay,
        )

        print("\nResponse:")
        print(json.dumps(result, indent=2, default=str))

    asyncio.run(_request())


def cmd_x402_serve(args):
    """Start x402 server (demo)"""
    print_header()
    print("x402 Server Demo")
    print()
    print("To integrate x402 in your robot:")
    print()
    print("```python")
    print("from packages.kit_token.x402 import X402Server, ServiceRequest, ServiceResponse")
    print()
    print("server = X402Server(")
    print('    robot_id="YOUR-ROBOT-ID",')
    print('    recipient_address="YOUR_WALLET_ADDRESS",')
    print("    default_price=0.1,")
    print(")")
    print()
    print("async def my_service_handler(request: ServiceRequest) -> ServiceResponse:")
    print("    # Process request")
    print("    return ServiceResponse(")
    print("        service_id=request.service_id,")
    print("        success=True,")
    print('        data={"result": "Hello from robot!"},')
    print("    )")
    print()
    print('server.register_service(')
    print('    service_id="hello",')
    print('    name="Hello Service",')
    print('    description="Simple greeting service",')
    print('    handler=my_service_handler,')
    print('    price=0.05,')
    print(')')
    print("```")


def cmd_x402_info(args):
    """Show x402 protocol information"""
    print_header()
    print("x402 Protocol - Robot-to-Robot Commerce")
    print()
    print("x402 is an HTTP payment protocol that enables:")
    print("  - Autonomous micropayments between robots")
    print("  - API monetization with per-request pricing")
    print("  - Machine-readable payment terms")
    print("  - Cryptographic payment proofs")
    print()
    print("Supported Payment Assets:")
    print(f"  - $KIT  (Solana Robotics Kit native token)")
    print(f"  - USDC  (Stablecoin)")
    print(f"  - SOL   (Native Solana)")
    print()
    print("How It Works:")
    print("  1. Robot A requests service from Robot B")
    print("  2. Robot B returns HTTP 402 with payment terms")
    print("  3. Robot A pays with $KIT tokens")
    print("  4. Robot A retries with payment proof")
    print("  5. Robot B verifies and provides service")
    print()
    print("Reference: https://x402.org")
    print("Solana Guide: https://solana.com/developers/guides/getstarted/intro-to-x402")


def main():
    parser = argparse.ArgumentParser(
        description=f"{KIT_TOKEN_NAME} Token CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # info
    subparsers.add_parser("info", help="Show token information")

    # balance
    balance_parser = subparsers.add_parser("balance", help="Check token balance")
    balance_parser.add_argument("address", nargs="?", help="Wallet address (default: your wallet)")

    # transfer
    transfer_parser = subparsers.add_parser("transfer", help="Transfer tokens")
    transfer_parser.add_argument("to_address", help="Recipient address")
    transfer_parser.add_argument("amount", type=float, help="Amount to transfer")
    transfer_parser.add_argument("--memo", help="Transaction memo")

    # stake
    stake_parser = subparsers.add_parser("stake", help="Stake tokens for robot")
    stake_parser.add_argument("robot_id", help="Robot identifier")
    stake_parser.add_argument(
        "--tier",
        choices=["basic", "standard", "premium", "enterprise"],
        default="basic",
        help="Staking tier",
    )

    # unstake
    unstake_parser = subparsers.add_parser("unstake", help="Unstake tokens from robot")
    unstake_parser.add_argument("robot_id", help="Robot identifier")

    # x402 subcommand
    x402_parser = subparsers.add_parser("x402", help="x402 protocol commands")
    x402_sub = x402_parser.add_subparsers(dest="x402_command")

    # x402 request
    x402_request = x402_sub.add_parser("request", help="Make x402 paid request")
    x402_request.add_argument("url", help="Service URL")
    x402_request.add_argument("--method", default="GET", help="HTTP method")
    x402_request.add_argument("--max-pay", type=float, default=1.0, help="Max payment amount")

    # x402 serve
    x402_sub.add_parser("serve", help="Show x402 server example")

    # x402 info
    x402_sub.add_parser("info", help="Show x402 protocol info")

    args = parser.parse_args()

    if args.command == "info":
        cmd_info(args)
    elif args.command == "balance":
        cmd_balance(args)
    elif args.command == "transfer":
        cmd_transfer(args)
    elif args.command == "stake":
        cmd_stake(args)
    elif args.command == "unstake":
        cmd_unstake(args)
    elif args.command == "x402":
        if args.x402_command == "request":
            cmd_x402_request(args)
        elif args.x402_command == "serve":
            cmd_x402_serve(args)
        elif args.x402_command == "info":
            cmd_x402_info(args)
        else:
            x402_parser.print_help()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
