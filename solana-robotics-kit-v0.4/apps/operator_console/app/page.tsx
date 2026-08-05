"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { Card, Button, Input, Badge } from "../components/ui";
import { decodeTaskAccount, decodeTaskSplAccount, pkFromBytes, statusLabel } from "../lib/task";
import {
  ixAcceptTask, ixCompleteTask, ixCreateTask,
  ixAcceptTaskSpl, ixCompleteTaskSpl, ixCreateTaskSpl
} from "../lib/ix";
import Link from "next/link";

import { KIT_TOKEN_MINT_STRING, KIT_TOKEN_SYMBOL, formatKitAmount } from "../lib/kit-token";

type Mode = "sol" | "spl" | "kit";

type Row = {
  mode: Mode;
  pubkey: PublicKey;
  creator: PublicKey;
  robot: PublicKey;
  taskId: bigint;
  rewardLabel: string;
  mint?: PublicKey;
  status: number;
  description: string;
  tags: string[];
};

function short(pk: PublicKey) {
  const s = pk.toBase58();
  return s.slice(0, 4) + "…" + s.slice(-4);
}

export default function Page() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const programSol = useMemo(() => {
    const v = process.env.NEXT_PUBLIC_TASK_ESCROW_PROGRAM_ID || "";
    return v ? new PublicKey(v) : null;
  }, []);
  const programSpl = useMemo(() => {
    const v = process.env.NEXT_PUBLIC_TASK_ESCROW_SPL_PROGRAM_ID || "";
    return v ? new PublicKey(v) : null;
  }, []);

  const [mode, setMode] = useState<Mode>("kit");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [description, setDescription] = useState("deliver package to station B");
  const [tags, setTags] = useState("delivery,nav");
  const [amountSol, setAmountSol] = useState("0.05");
  const [mint, setMint] = useState(KIT_TOKEN_MINT_STRING);
  const [amountTokens, setAmountTokens] = useState("10");
  const [taskId, setTaskId] = useState(() => BigInt(Date.now()));

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const out: Row[] = [];

      if (programSol) {
        const accts = await connection.getProgramAccounts(programSol);
        for (const a of accts) {
          try {
            const t = decodeTaskAccount(a.account.data);
            out.push({
              mode: "sol",
              pubkey: a.pubkey,
              creator: pkFromBytes(t.creator),
              robot: pkFromBytes(t.robot),
              taskId: t.task_id,
              rewardLabel: `${(Number(t.amount_lamports) / LAMPORTS_PER_SOL).toFixed(4)} SOL`,
              status: t.status,
              description: t.description,
              tags: t.capability_tags || []
            });
          } catch {}
        }
      }

      if (programSpl) {
        const accts = await connection.getProgramAccounts(programSpl);
        for (const a of accts) {
          try {
            const t = decodeTaskSplAccount(a.account.data);
            out.push({
              mode: "spl",
              pubkey: a.pubkey,
              creator: pkFromBytes(t.creator),
              robot: pkFromBytes(t.robot),
              taskId: t.task_id,
              mint: pkFromBytes(t.mint),
              rewardLabel: `${t.amount_tokens.toString()} tokens`,
              status: t.status,
              description: t.description,
              tags: t.capability_tags || []
            });
          } catch {}
        }
      }

      out.sort((a, b) => Number(b.taskId - a.taskId));
      setRows(out);
    } finally {
      setLoading(false);
    }
  }, [connection, programSol, programSpl]);

  useEffect(() => { refresh(); }, [refresh]);

  const createTask = useCallback(async () => {
    if (!publicKey) return;
    const tagList = tags.split(",").map(s => s.trim()).filter(Boolean).slice(0, 8);

    if (mode === "sol") {
      if (!programSol) return;
      const lamports = BigInt(Math.floor(parseFloat(amountSol || "0") * LAMPORTS_PER_SOL));
      const ix = ixCreateTask({ programId: programSol, creator: publicKey, taskId, amountLamports: lamports, description, tags: tagList });
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
    } else {
      if (!programSpl) return;
      const mintPk = new PublicKey(mint);
      const amt = BigInt(amountTokens);
      const ix = ixCreateTaskSpl({ programId: programSpl, creator: publicKey, mint: mintPk, taskId, amountTokens: amt, description, tags: tagList });
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
    }

    setTaskId(BigInt(Date.now()));
    await refresh();
  }, [publicKey, mode, programSol, programSpl, amountSol, amountTokens, mint, description, tags, taskId, sendTransaction, connection, refresh]);

  const acceptTask = useCallback(async (r: Row) => {
    if (!publicKey) return;
    const tx = new Transaction();
    if (r.mode === "sol") {
      if (!programSol) return;
      tx.add(ixAcceptTask({ programId: programSol, robot: publicKey, taskPda: r.pubkey }));
    } else {
      if (!programSpl) return;
      tx.add(ixAcceptTaskSpl({ programId: programSpl, robot: publicKey, taskPda: r.pubkey }));
    }
    const sig = await sendTransaction(tx, connection);
    await connection.confirmTransaction(sig, "confirmed");
    await refresh();
  }, [publicKey, programSol, programSpl, sendTransaction, connection, refresh]);

  const completeTask = useCallback(async (r: Row) => {
    if (!publicKey) return;
    const proof = new Uint8Array(32);
    // Deterministic demo proof; robot daemon should generate real proof from evidence.
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`done:${r.pubkey.toBase58()}`));
    proof.set(new Uint8Array(buf).slice(0, 32));

    const tx = new Transaction();
    if (r.mode === "sol") {
      if (!programSol) return;
      tx.add(ixCompleteTask({ programId: programSol, robot: publicKey, taskPda: r.pubkey, proofHash32: proof }));
    } else {
      if (!programSpl || !r.mint) return;
      tx.add(ixCompleteTaskSpl({ programId: programSpl, robot: publicKey, mint: r.mint, taskPda: r.pubkey, proofHash32: proof }));
    }

    const sig = await sendTransaction(tx, connection);
    await connection.confirmTransaction(sig, "confirmed");
    await refresh();
  }, [publicKey, programSol, programSpl, sendTransaction, connection, refresh]);

  const headerProgram = mode === "sol" ? programSol : programSpl; // kit mode uses SPL program

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">🤖 Solana Robotics Operator Console</h1>
          <p className="text-white/70 text-sm mt-1">
            Missions + payments · mode <span className="text-solGreen">{mode.toUpperCase()}</span> · program{" "}
            <span className="text-solGreen">{headerProgram ? short(headerProgram) : "not set"}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/kit" className="px-4 py-2 bg-solGreen hover:bg-solGreen/80 rounded-lg text-black text-sm font-medium transition-colors">
            🪙 $CLAWD Token
          </Link>
          <Link href="/tokens" className="px-4 py-2 bg-solPurple hover:bg-solPurple/80 rounded-lg text-white text-sm font-medium transition-colors">
            ✨ Create Token
          </Link>
          <Link href="/console" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white text-sm font-medium transition-colors">
            🤖 Autonomous Console
          </Link>
          <WalletMultiButton />
        </div>
      </div>

      {/* $CLAWD Token Banner */}
      <Card className="mt-8 bg-gradient-to-r from-solGreen/20 to-solPurple/20 border-solGreen/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">🪙 $CLAWD Token - Official Robotics Currency</h2>
            <p className="text-white/70 text-sm mt-1">
              Pay for robot tasks, stake for registration, and enable robot-to-robot commerce with x402 protocol.
            </p>
            <p className="text-white/50 text-xs mt-1 font-mono">
              Contract: {KIT_TOKEN_MINT_STRING}
            </p>
          </div>
          <Link href="/kit">
            <Button className="bg-solGreen text-black hover:bg-solGreen/80">
              View $CLAWD →
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Create mission (escrow)</h2>
            <div className="flex gap-2">
              <Button className={mode==="kit" ? "bg-solGreen text-black" : "bg-white/10 hover:bg-white/15"} onClick={() => { setMode("kit"); setMint(KIT_TOKEN_MINT_STRING); }}>$CLAWD</Button>
              <Button className={mode==="sol" ? "" : "bg-white/10 hover:bg-white/15"} onClick={() => setMode("sol")}>SOL</Button>
              <Button className={mode==="spl" ? "" : "bg-white/10 hover:bg-white/15"} onClick={() => setMode("spl")}>SPL</Button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="text-xs text-white/60 mb-1">Description</div>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <div className="text-xs text-white/60 mb-1">Capability tags (comma)</div>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>

            {mode === "sol" ? (
              <div>
                <div className="text-xs text-white/60 mb-1">Reward (SOL)</div>
                <Input value={amountSol} onChange={(e) => setAmountSol(e.target.value)} />
              </div>
            ) : mode === "kit" ? (
              <>
                <div>
                  <div className="text-xs text-white/60 mb-1">$CLAWD Token (Official Currency)</div>
                  <Input value={mint} disabled className="bg-solGreen/10 border-solGreen/30 text-solGreen" />
                </div>
                <div>
                  <div className="text-xs text-white/60 mb-1">Reward ($CLAWD)</div>
                  <Input value={amountTokens} onChange={(e) => setAmountTokens(e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-xs text-white/60 mb-1">Mint (SPL)</div>
                  <Input placeholder="Mint address" value={mint} onChange={(e) => setMint(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-white/60 mb-1">Reward (tokens)</div>
                  <Input value={amountTokens} onChange={(e) => setAmountTokens(e.target.value)} />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Button disabled={!publicKey || !headerProgram} onClick={createTask}>Create task</Button>
              <Button className="bg-white/10 hover:bg-white/15" onClick={refresh} disabled={loading}>
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Robot daemon</h2>
          <p className="text-white/70 text-sm mt-1">
            Orin Nano can publish safe <code>/cmd_vel</code> using Cosmos vision + a stop-veto layer.
          </p>
          <div className="mt-4 space-y-2 text-sm text-white/80">
            <div className="flex items-center justify-between">
              <span>ROS wire</span>
              <Badge>/camera/image_raw → Cosmos → /cmd_vel</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Task runner</span>
              <Badge>poll + tags + proof</Badge>
            </div>
            <div className="mt-3 text-xs text-white/60">
              Run: <span className="text-white/80">python -m apps.robot_daemon.main --task-runner --task-mode {mode} --capabilities {tags || "delivery,nav"} --poll-s 2</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Missions</h2>
          <div className="text-xs text-white/60">{rows.length} tasks</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/60">
              <tr className="text-left border-b border-white/10">
                <th className="py-2 pr-4">task</th>
                <th className="py-2 pr-4">mode</th>
                <th className="py-2 pr-4">status</th>
                <th className="py-2 pr-4">reward</th>
                <th className="py-2 pr-4">tags</th>
                <th className="py-2 pr-4">creator</th>
                <th className="py-2 pr-4">robot</th>
                <th className="py-2 pr-4">actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const status = statusLabel(r.status);
                const canAccept = publicKey && status === "open";
                const canComplete = publicKey && status === "accepted" && r.robot.equals(publicKey);
                return (
                  <tr key={r.pubkey.toBase58()} className="border-b border-white/5">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{r.description}</div>
                      <div className="text-xs text-white/50">{short(r.pubkey)}</div>
                    </td>
                    <td className="py-3 pr-4"><Badge>{r.mode.toUpperCase()}</Badge></td>
                    <td className="py-3 pr-4"><Badge>{status}</Badge></td>
                    <td className="py-3 pr-4">{r.rewardLabel}</td>
                    <td className="py-3 pr-4">{(r.tags || []).slice(0, 4).join(", ") || "—"}</td>
                    <td className="py-3 pr-4">{short(r.creator)}</td>
                    <td className="py-3 pr-4">{r.robot.toBase58() === PublicKey.default.toBase58() ? "—" : short(r.robot)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <Button disabled={!canAccept} onClick={() => acceptTask(r)}>Accept</Button>
                        <Button className="bg-solGreen text-black hover:bg-solGreen/80" disabled={!canComplete} onClick={() => completeTask(r)}>
                          Complete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <footer className="mt-10 text-xs text-white/40">
        Solana purple: #9945FF · Solana green: #14F195
      </footer>
    </main>
  );
}
