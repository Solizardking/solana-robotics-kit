/**
 * Instruction builders — stubs until on-chain task escrow programs are linked.
 * Pages import these symbols; live deploys should replace with real Anchor ix.
 */
import type { PublicKey, TransactionInstruction } from "@solana/web3.js";

function notImplemented(name: string): never {
  throw new Error(
    `${name} is not wired — set program IDs and replace stubs in lib/ix.ts with Anchor builders`
  );
}

export function ixCreateTask(..._args: unknown[]): TransactionInstruction {
  return notImplemented("ixCreateTask");
}
export function ixAcceptTask(..._args: unknown[]): TransactionInstruction {
  return notImplemented("ixAcceptTask");
}
export function ixCompleteTask(..._args: unknown[]): TransactionInstruction {
  return notImplemented("ixCompleteTask");
}
export function ixCreateTaskSpl(..._args: unknown[]): TransactionInstruction {
  return notImplemented("ixCreateTaskSpl");
}
export function ixAcceptTaskSpl(..._args: unknown[]): TransactionInstruction {
  return notImplemented("ixAcceptTaskSpl");
}
export function ixCompleteTaskSpl(..._args: unknown[]): TransactionInstruction {
  return notImplemented("ixCompleteTaskSpl");
}

export type { PublicKey };
