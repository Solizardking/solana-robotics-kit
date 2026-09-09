/**
 * RPC-based tag fetching for Solana accounts
 * Uses RPC_URL to fetch on-chain data and derive tags
 */

import { Address } from "@solana/addresses";

const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";

/**
 * Get RPC URL from environment or storage
 */
async function getRpcUrl(): Promise<string> {
  // Try to get from browser storage first
  try {
    const result = await browser.storage.local.get("RPC_URL");
    if (result.RPC_URL && typeof result.RPC_URL === "string") {
      return result.RPC_URL;
    }
  } catch (e) {
    console.warn("Could not read RPC_URL from storage:", e);
  }

  // Fallback to default
  return DEFAULT_RPC_URL;
}

/**
 * Fetch account info from RPC to derive tags
 */
async function fetchAccountInfo(address: Address, rpcUrl: string): Promise<string[]> {
  const tags: string[] = [];

  try {
    // Fetch account info
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [
          address,
          {
            encoding: "jsonParsed",
          },
        ],
      }),
    });

    if (!response.ok) {
      return tags;
    }

    const data = await response.json();
    const accountInfo = data.result?.value;

    if (!accountInfo) {
      // Account doesn't exist or has no data
      tags.push("empty");
      return tags;
    }

    // Derive tags based on account data
    const owner = accountInfo.owner;
    const executable = accountInfo.executable;
    const lamports = accountInfo.lamports;

    // Tag based on owner program
    if (owner === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") {
      tags.push("token-account");
    } else if (owner === "11111111111111111111111111111111") {
      tags.push("system-program");
    } else if (owner === "Stake11111111111111111111111111111111111111") {
      tags.push("stake-account");
    } else {
      tags.push("program-owned");
    }

    // Tag based on executable status
    if (executable) {
      tags.push("executable");
    }

    // Tag based on balance
    if (lamports === 0) {
      tags.push("zero-balance");
    } else if (lamports < 1000000) {
      // Less than 0.001 SOL
      tags.push("low-balance");
    } else if (lamports >= 1000000000) {
      // 1 SOL or more
      tags.push("high-balance");
    }

    // Check if it's a program-derived address (PDA)
    if (accountInfo.data && typeof accountInfo.data === "object") {
      tags.push("has-data");
    }

  } catch (error) {
    console.error(`Error fetching account info for ${address}:`, error);
    tags.push("rpc-error");
  }

  return tags;
}

/**
 * Fetch tags for multiple addresses using RPC
 * Combines RPC-derived tags with locally stored tags
 */
export async function getTagsForAccounts(
  addresses: Address[]
): Promise<Record<Address, string[]>> {
  const rpcUrl = await getRpcUrl();
  const tagsForAccounts: Record<Address, string[]> = {};

  // Fetch tags from RPC in parallel
  const tagPromises = addresses.map(async (address) => {
    const rpcTags = await fetchAccountInfo(address, rpcUrl);
    return { address, tags: rpcTags };
  });

  const results = await Promise.all(tagPromises);

  // Combine RPC tags with local storage tags
  try {
    const { getSavedAccounts } = await import("../../accounts/storage");
    const savedAccounts = await getSavedAccounts();

    for (const { address, tags: rpcTags } of results) {
      const savedAccount = savedAccounts.find((a) => a.address === address);
      const localTags = savedAccount?.tags || [];

      // Combine: RPC tags first, then local tags (avoid duplicates)
      const allTags = [...rpcTags];
      for (const localTag of localTags) {
        if (!allTags.includes(localTag)) {
          allTags.push(localTag);
        }
      }

      tagsForAccounts[address] = allTags;
    }
  } catch (error) {
    console.error("Error combining with local tags:", error);
    // Fallback to RPC tags only
    for (const { address, tags } of results) {
      tagsForAccounts[address] = tags;
    }
  }

  return tagsForAccounts;
}
