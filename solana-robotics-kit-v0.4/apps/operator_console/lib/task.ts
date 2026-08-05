/**
 * Task account decode stubs — replace with Anchor IDL decoders when programs ship.
 */

export type TaskAccount = {
  creator: Uint8Array;
  robot: Uint8Array;
  task_id: bigint;
  amount_lamports: bigint;
  status: number;
  description: string;
  capability_tags: string[];
};

export function pkFromBytes(bytes: Uint8Array): import("@solana/web3.js").PublicKey {
  const { PublicKey } = require("@solana/web3.js");
  return new PublicKey(bytes);
}

export function statusLabel(status: number): string {
  const map: Record<number, string> = {
    0: "open",
    1: "accepted",
    2: "completed",
    3: "cancelled",
  };
  return map[status] ?? `status_${status}`;
}

/** Placeholder decoder — returns empty/open task shape for UI scaffolding. */
export function decodeTaskAccount(_data: Buffer | Uint8Array): TaskAccount {
  return {
    creator: new Uint8Array(32),
    robot: new Uint8Array(32),
    task_id: BigInt(0),
    amount_lamports: BigInt(0),
    status: 0,
    description: "(undecoded — wire Anchor layout)",
    capability_tags: [],
  };
}

export function decodeTaskSplAccount(data: Buffer | Uint8Array): TaskAccount {
  return decodeTaskAccount(data);
}
