/**
 * RPC-based tag fetching for Solana accounts
 * Uses RPC_URL to fetch on-chain data and derive tags
 */

import type { Address } from "@solana/addresses";
import { Connection, PublicKey } from "@solana/web3.js";
import { getSavedAccounts } from "../accounts/storage";

const DEFAULT_RPC_URL = "https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/";

/**
 * Get RPC URL from browser storage
 */
async function getRpcUrl(): Promise<string> {
  try {
    const result = await browser.storage.local.get("RPC_URL");
    if (result.RPC_URL && typeof result.RPC_URL === "string") {
      return result.RPC_URL;
    }
  } catch (e) {
    console.warn("Could not read RPC_URL from storage:", e);
  }
  return DEFAULT_RPC_URL;
}

/**
 * Fetch tags for accounts using RPC
 */
export async function getRpcTagsForAccounts(
  addresses: readonly Address[]
): Promise<Record<Address, string[]>> {
  const rpcUrl = await getRpcUrl();
  const connection = new Connection(rpcUrl, "confirmed");
  const tagsForAccounts: Record<Address, string[]> = {};

  for (const address of addresses) {
    const tags: string[] = [];
    try {
      const publicKey = new PublicKey(address);
      const accountInfo = await connection.getAccountInfo(publicKey);

      if (accountInfo) {
        if (accountInfo.executable) {
          tags.push("executable");
        }
        if (accountInfo.owner.toBase58() === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") {
          tags.push("token-account");
        }
        if (accountInfo.owner.toBase58() === "11111111111111111111111111111111") {
          tags.push("system-program");
        }
        if (accountInfo.owner.toBase58() === "Stake11111111111111111111111111111111111111") {
          tags.push("stake-account");
        }
        if (accountInfo.lamports === 0) {
          tags.push("zero-balance");
        } else if (accountInfo.lamports < 1_000_000) {
          tags.push("low-balance");
        } else if (accountInfo.lamports > 100_000_000_000) {
          tags.push("high-balance");
        }
        if (accountInfo.data.length > 0) {
          tags.push("has-data");
        } else {
          tags.push("empty");
        }
      } else {
        tags.push("empty");
      }
    } catch (e) {
      console.error(`Error fetching RPC tags for ${address}:`, e);
      tags.push("rpc-error");
    }
    tagsForAccounts[address] = tags;
  }
  return tagsForAccounts;
}

/**
 * Get combined tags (RPC + local storage)
 */
export async function getCombinedTagsForAccounts(
  addresses: readonly Address[]
): Promise<Record<Address, string[]>> {
  const localAccounts = await getSavedAccounts();
  const localTags: Record<Address, string[]> = {};
  for (const address of addresses) {
    const account = localAccounts.find((a) => a.address === address);
    if (account) {
      localTags[address] = account.tags;
    } else {
      localTags[address] = [];
    }
  }

  const rpcTags = await getRpcTagsForAccounts(addresses);

  const combinedTags: Record<Address, string[]> = {};
  for (const address of addresses) {
    const tagsSet = new Set<string>();
    for (const tag of localTags[address] || []) {
      tagsSet.add(tag);
    }
    for (const tag of rpcTags[address] || []) {
      tagsSet.add(tag);
    }
    combinedTags[address] = Array.from(tagsSet);
  }
  return combinedTags;
}

