"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import Link from "next/link";
import { Card, Button, Input, Badge } from "../../components/ui";
import {
  KIT_TOKEN_MINT,
  KIT_TOKEN_MINT_STRING,
  KIT_TOKEN_NAME,
  KIT_TOKEN_SYMBOL,
  KIT_TOKEN_DECIMALS,
  STAKING_TIERS,
  KIT_TOKEN_LINKS,
  getKitBalance,
  formatKitAmount,
  createKitTransferInstruction,
  getAmountForTier,
  StakingTier,
} from "../../lib/kit-token";

function short(s: string) {
  return s.slice(0, 6) + "…" + s.slice(-4);
}

type Tab = "overview" | "transfer" | "stake" | "x402";

export default function KitTokenPage() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [tab, setTab] = useState<Tab>("overview");
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Transfer form
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [transferStatus, setTransferStatus] = useState<string | null>(null);

  // Stake form
  const [robotId, setRobotId] = useState("");
  const [selectedTier, setSelectedTier] = useState<StakingTier>("basic");

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const result = await getKitBalance(connection, publicKey);
      setBalance(result.balance);
    } catch (e) {
      console.error("Balance fetch error:", e);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Transfer handler
  const handleTransfer = useCallback(async () => {
    if (!publicKey || !recipient || !amount) return;

    setTransferStatus("Preparing transaction...");
    try {
      const recipientPk = new PublicKey(recipient);
      const tx = await createKitTransferInstruction(
        connection,
        publicKey,
        recipientPk,
        parseFloat(amount)
      );

      setTransferStatus("Sending transaction...");
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");

      setTransferStatus(`✅ Success! Signature: ${short(sig)}`);
      setAmount("");
      setRecipient("");
      fetchBalance();
    } catch (e: any) {
      setTransferStatus(`❌ Error: ${e.message}`);
    }
  }, [publicKey, recipient, amount, connection, sendTransaction, fetchBalance]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="text-solGreen">$CLAWD</span> Token
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Official currency for the Solana Robotics Kit ecosystem
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm font-medium transition-colors"
          >
            ← Dashboard
          </Link>
          <WalletMultiButton />
        </div>
      </div>

      {/* Token Info Banner */}
      <Card className="mt-8 bg-gradient-to-r from-solGreen/20 to-solPurple/20 border-solGreen/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-semibold text-xl flex items-center gap-2">
              🪙 {KIT_TOKEN_NAME}
              <Badge className="bg-solGreen/30 text-solGreen">Solana SPL Token</Badge>
            </h2>
            <p className="text-white/70 text-sm mt-2 font-mono">
              {KIT_TOKEN_MINT_STRING}
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href={KIT_TOKEN_LINKS.bagsFm}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-solGreen text-black rounded-lg font-medium hover:bg-solGreen/80 transition-colors"
            >
              View on bags.fm
            </a>
            <a
              href={KIT_TOKEN_LINKS.solscan}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white/10 rounded-lg font-medium hover:bg-white/15 transition-colors"
            >
              Solscan
            </a>
          </div>
        </div>
      </Card>

      {/* Balance Card */}
      {publicKey && (
        <Card className="mt-6 bg-gradient-to-br from-black to-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/60 text-sm">Your Balance</div>
              <div className="text-4xl font-bold text-solGreen mt-1">
                {loading ? "..." : balance !== null ? formatKitAmount(balance) : "---"}
              </div>
              <div className="text-white/50 text-xs mt-1">
                Wallet: {short(publicKey.toBase58())}
              </div>
            </div>
            <Button onClick={fetchBalance} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mt-8 border-b border-white/10 pb-3">
        {[
          { id: "overview" as Tab, label: "Overview" },
          { id: "transfer" as Tab, label: "Transfer" },
          { id: "stake" as Tab, label: "Staking" },
          { id: "x402" as Tab, label: "x402 Commerce" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === t.id
                ? "bg-solGreen text-black"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-semibold text-lg mb-4">Token Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Name</span>
                  <span>{KIT_TOKEN_NAME}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Symbol</span>
                  <span>{KIT_TOKEN_SYMBOL}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Decimals</span>
                  <span>{KIT_TOKEN_DECIMALS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Network</span>
                  <span>Solana</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Launch Platform</span>
                  <span className="text-solGreen">bags.fm</span>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-lg mb-4">Use Cases</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-solGreen">🤖</span>
                  <div>
                    <div className="font-medium">Robot Registration</div>
                    <div className="text-white/60">Stake $CLAWD to register robots</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-solGreen">💼</span>
                  <div>
                    <div className="font-medium">Task Payments</div>
                    <div className="text-white/60">Pay robots for completed tasks</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-solGreen">🔄</span>
                  <div>
                    <div className="font-medium">x402 Commerce</div>
                    <div className="text-white/60">Robot-to-robot micropayments</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-solGreen">🗳️</span>
                  <div>
                    <div className="font-medium">Governance</div>
                    <div className="text-white/60">Vote on protocol decisions</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="md:col-span-2">
              <h3 className="font-semibold text-lg mb-4">Staking Tiers</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(STAKING_TIERS).map(([tier, amount]) => (
                  <div
                    key={tier}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="text-white/60 text-xs uppercase">{tier}</div>
                    <div className="text-xl font-bold text-solGreen mt-1">
                      {amount.toLocaleString()}
                    </div>
                    <div className="text-white/50 text-xs">{KIT_TOKEN_SYMBOL}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Transfer Tab */}
        {tab === "transfer" && (
          <Card className="max-w-lg">
            <h3 className="font-semibold text-lg mb-4">Transfer $CLAWD</h3>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs block mb-1">
                  Recipient Address
                </label>
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Solana wallet address..."
                />
              </div>
              <div>
                <label className="text-white/60 text-xs block mb-1">
                  Amount ({KIT_TOKEN_SYMBOL})
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <Button
                onClick={handleTransfer}
                disabled={!publicKey || !recipient || !amount}
                className="w-full"
              >
                Send {KIT_TOKEN_SYMBOL}
              </Button>
              {transferStatus && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    transferStatus.includes("✅")
                      ? "bg-green-500/20 text-green-400"
                      : transferStatus.includes("❌")
                      ? "bg-red-500/20 text-red-400"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  {transferStatus}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Stake Tab */}
        {tab === "stake" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-semibold text-lg mb-4">Stake for Robot</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-xs block mb-1">
                    Robot ID
                  </label>
                  <Input
                    value={robotId}
                    onChange={(e) => setRobotId(e.target.value)}
                    placeholder="ROBOT-001"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs block mb-2">
                    Staking Tier
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(STAKING_TIERS) as StakingTier[]).map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setSelectedTier(tier)}
                        className={`p-3 rounded-lg border transition-colors ${
                          selectedTier === tier
                            ? "border-solGreen bg-solGreen/10"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="text-xs uppercase text-white/60">
                          {tier}
                        </div>
                        <div className="font-bold text-solGreen">
                          {STAKING_TIERS[tier].toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <Button disabled={!publicKey || !robotId} className="w-full">
                  Stake {formatKitAmount(getAmountForTier(selectedTier))}
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-lg mb-4">Tier Benefits</h3>
              <div className="space-y-4 text-sm">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="font-medium text-white/80">Basic (100 $CLAWD)</div>
                  <div className="text-white/50 mt-1">
                    Standard robot registration and task access
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="font-medium text-white/80">Standard (500 $CLAWD)</div>
                  <div className="text-white/50 mt-1">
                    Enhanced capabilities, priority matching
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="font-medium text-solPurple">Premium (2,000 $CLAWD)</div>
                  <div className="text-white/50 mt-1">
                    Priority task access, reduced fees, reputation boost
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-solGreen/30">
                  <div className="font-medium text-solGreen">Enterprise (10,000 $CLAWD)</div>
                  <div className="text-white/50 mt-1">
                    Full ecosystem access, governance rights, premium support
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* x402 Commerce Tab */}
        {tab === "x402" && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🔄</div>
                <div>
                  <h3 className="font-semibold text-lg">x402 Protocol</h3>
                  <p className="text-white/70 mt-1">
                    HTTP-native payment protocol for robot-to-robot commerce.
                    Enable autonomous micropayments between robots using $CLAWD.
                  </p>
                  <div className="flex gap-3 mt-4">
                    <a
                      href={KIT_TOKEN_LINKS.x402Docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                    >
                      x402.org Docs
                    </a>
                    <a
                      href={KIT_TOKEN_LINKS.x402Solana}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/15"
                    >
                      Solana Guide
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="font-semibold text-lg mb-4">How x402 Works</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-solGreen/20 flex items-center justify-center text-solGreen font-bold">
                      1
                    </div>
                    <div>
                      <div className="font-medium">Robot A requests service</div>
                      <div className="text-white/50">
                        Sends HTTP request to Robot B's API
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-solGreen/20 flex items-center justify-center text-solGreen font-bold">
                      2
                    </div>
                    <div>
                      <div className="font-medium">Robot B returns HTTP 402</div>
                      <div className="text-white/50">
                        With payment terms in headers
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-solGreen/20 flex items-center justify-center text-solGreen font-bold">
                      3
                    </div>
                    <div>
                      <div className="font-medium">Robot A pays in $CLAWD</div>
                      <div className="text-white/50">
                        Automatic on-chain micropayment
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-solGreen/20 flex items-center justify-center text-solGreen font-bold">
                      4
                    </div>
                    <div>
                      <div className="font-medium">Robot B provides service</div>
                      <div className="text-white/50">
                        Verifies payment and responds
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-lg mb-4">Use Cases</h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="font-medium">API Monetization</div>
                    <div className="text-white/50">
                      Charge per-request for robot services
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="font-medium">Data Trading</div>
                    <div className="text-white/50">
                      Sell sensor data, maps, or intelligence
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="font-medium">Compute Sharing</div>
                    <div className="text-white/50">
                      Rent GPU cycles for AI inference
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="font-medium">Task Delegation</div>
                    <div className="text-white/50">
                      Subcontract tasks to specialized robots
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <h3 className="font-semibold text-lg mb-4">Integration Code</h3>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-400">{`// Python - x402 Client
from packages.kit_token.x402 import X402Client

client = X402Client(auto_pay=True, max_auto_pay=10.0)

# Automatically handles 402 responses
result = await client.request(
    "https://robot-b.local/api/navigation",
    method="POST",
    data={"destination": "warehouse"}
)

# TypeScript - Create Payment Terms
import { createPaymentTermsHeader } from "@/lib/kit-token";

const terms = createPaymentTermsHeader({
  amount: 0.1,
  asset: "KIT",
  recipient: "YourWalletAddress",
  network: "solana",
  description: "Navigation service"
});

// Return HTTP 402 with payment header
res.setHeader("X-Payment", terms);
res.status(402).json({ error: "payment_required" });`}</pre>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-10 text-xs text-white/40 text-center">
        $CLAWD Token · Contract: {short(KIT_TOKEN_MINT_STRING)} · Launched on bags.fm
      </footer>
    </main>
  );
}
