// wallet/solanaRpc.ts
/**
 * Solana RPC client using Helius RPC for standard calls and DAS API for digital assets
 * Uses HELIUS_RPC_URL from storage with fallback to default endpoint
 */

import { Connection, PublicKey, CommitmentLevel } from "@solana/web3.js";
import { storage } from "#imports";

const DEFAULT_HELIUS_RPC_URL = "https://mainnet.helius-rpc.com";

/**
 * Get Helius RPC URL from browser storage
 */
async function getHeliusRpcUrl(): Promise<string> {
  try {
    const result = await browser.storage.local.get("HELIUS_RPC_URL");
    if (result.HELIUS_RPC_URL && typeof result.HELIUS_RPC_URL === "string") {
      return result.HELIUS_RPC_URL;
    }
  } catch (e) {
    console.warn("Could not read HELIUS_RPC_URL from storage:", e);
  }
  return DEFAULT_HELIUS_RPC_URL;
}

/**
 * Get Helius API key from browser storage
 */
async function getHeliusApiKey(): Promise<string | null> {
  try {
    const result = await browser.storage.local.get("HELIUS_API_KEY");
    if (result.HELIUS_API_KEY && typeof result.HELIUS_API_KEY === "string") {
      return result.HELIUS_API_KEY;
    }
  } catch (e) {
    console.warn("Could not read HELIUS_API_KEY from storage:", e);
  }
  return null;
}

/**
 * Make a DAS API request to Helius
 */
async function makeDasRequest(
  method: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const rpcUrl = await getHeliusRpcUrl();
  const apiKey = await getHeliusApiKey();

  const url = new URL(rpcUrl);
  if (apiKey) {
    url.searchParams.set("api-key", apiKey);
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "1",
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`DAS API request failed: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    jsonrpc: string;
    id: string;
    result?: unknown;
    error?: { code: number; message: string };
  };

  if (data.error) {
    throw new Error(`DAS API error: ${data.error.message}`);
  }

  return data.result;
}

export interface DasAsset {
  interface: string;
  id: string;
  content?: {
    json_uri?: string;
    metadata?: {
      name?: string;
      symbol?: string;
      description?: string;
      attributes?: Array<{ trait_type: string; value: string }>;
    };
    files?: Array<{ uri: string; mime?: string }>;
  };
  ownership?: {
    owner: string;
    ownership_model: string;
    frozen?: boolean;
    delegated?: boolean;
  };
  compression?: {
    eligible: boolean;
    compressed: boolean;
    tree?: string;
    leaf_id?: number;
  };
  grouping?: Array<{ group_key: string; group_value: string }>;
  royalty?: {
    royalty_model: string;
    percent?: number;
    basis_points?: number;
  };
  creators?: Array<{
    address: string;
    share: number;
    verified: boolean;
  }>;
  token_info?: {
    supply?: number;
    decimals?: number;
    token_program?: string;
  };
}

export interface DasAssetBatchResponse {
  items: DasAsset[];
}

export interface DasAssetsByOwnerResponse {
  items: DasAsset[];
  total: number;
  limit: number;
  page: number;
  last_indexed_slot: number;
}

export interface DasAssetsByGroupResponse {
  items: DasAsset[];
  total: number;
  limit: number;
  page: number;
  last_indexed_slot: number;
}

export interface DasAssetsByCreatorResponse {
  items: DasAsset[];
  total: number;
  limit: number;
  page: number;
  last_indexed_slot: number;
}

export interface DasSearchAssetsResponse {
  items: DasAsset[];
  total: number;
  limit: number;
  page: number;
  last_indexed_slot: number;
}

export interface DasTokenAccount {
  address: string;
  mint: string;
  owner: string;
  amount: number;
  delegated_amount?: number;
  frozen: boolean;
  burnt: boolean;
}

export interface DasGetTokenAccountsResponse {
  token_accounts: DasTokenAccount[];
  total: number;
  limit: number;
  cursor?: string;
  last_indexed_slot: number;
}

export class SolanaRPC {
  private connection: Connection | null = null;
  private commitment: CommitmentLevel = "finalized";

  readonly TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );
  readonly TOKEN_PROGRAM = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  );

  constructor() {
    this._startConnection();
  }

  private async _startConnection(
    commitment: CommitmentLevel = "finalized"
  ): Promise<void> {
    const endpoint = await getHeliusRpcUrl();
    this.commitment = commitment;

    let rpcUrl = endpoint;
    if (rpcUrl.indexOf("://") === -1) {
      rpcUrl = `https://${rpcUrl}`;
    }

    this.connection = new Connection(rpcUrl, commitment);
    console.log("Connected to Solana RPC:", rpcUrl);
  }

  /**
   * Get SOL balance for an address
   */
  async getBalance(
    address: string | PublicKey,
    commitment?: CommitmentLevel
  ): Promise<number> {
    if (!this.connection) {
      await this._startConnection();
    }
    const publicKey =
      typeof address === "string" ? new PublicKey(address) : address;
    return this.connection!.getBalance(publicKey, commitment || this.commitment);
  }

  /**
   * Returns the owner of a given token account
   */
  async getTokenOwner(tokenAddr: string | PublicKey): Promise<string> {
    if (!this.connection) {
      await this._startConnection();
    }
    const publicKey =
      typeof tokenAddr === "string" ? new PublicKey(tokenAddr) : tokenAddr;
    const largestAccounts =
      await this.connection!.getTokenLargestAccounts(publicKey);
    const largestAccountInfo = await this.connection!.getParsedAccountInfo(
      new PublicKey(largestAccounts.value[0].address)
    );

    const parsedData = largestAccountInfo.value.data;
    if (parsedData && "parsed" in parsedData) {
      return (parsedData.parsed as { info: { owner: string } }).info.owner;
    }
    throw new Error("Could not parse token owner");
  }

  getParsedAccountInfo(
    address: string | PublicKey,
    commitment?: CommitmentLevel
  ) {
    if (!this.connection) {
      throw new Error("Connection not initialized");
    }
    const publicKey = typeof address === "string" ? new PublicKey(address) : address;
    return this.connection.getParsedAccountInfo(
      publicKey,
      commitment || this.commitment
    );
  }

  getAccountInfo(
    address: string | PublicKey,
    commitment?: CommitmentLevel
  ) {
    if (!this.connection) {
      throw new Error("Connection not initialized");
    }
    const publicKey = typeof address === "string" ? new PublicKey(address) : address;
    return this.connection.getAccountInfo(
      publicKey,
      commitment || this.commitment
    );
  }

  getParsedTokenAccountsByOwner(
    owner: string | PublicKey,
    filter?: { programId?: PublicKey }
  ) {
    if (!this.connection) {
      throw new Error("Connection not initialized");
    }
    const publicKey = typeof owner === "string" ? new PublicKey(owner) : owner;
    return this.connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: filter?.programId || this.TOKEN_PROGRAM,
    });
  }

  /**
   * Returns multiple account info data
   */
  getMultipleAccountsInfo(
    addresses: (string | PublicKey)[],
    commitment?: CommitmentLevel
  ) {
    if (!this.connection) {
      throw new Error("Connection not initialized");
    }
    const publicKeys = addresses.map((addr) =>
      typeof addr === "string" ? new PublicKey(addr) : addr
    );
    return this.connection.getMultipleAccountsInfo(
      publicKeys,
      commitment || this.commitment
    );
  }

  /**
   * Returns transaction signatures for a given address
   */
  async getSignaturesForAddress(
    address: string | PublicKey,
    opts?: {
      limit?: number;
      before?: string;
      until?: string;
    }
  ) {
    if (!this.connection) {
      await this._startConnection();
    }
    const publicKey = typeof address === "string" ? new PublicKey(address) : address;
    return this.connection!.getSignaturesForAddress(publicKey, opts);
  }

  async getTransaction(signature: string, opts?: { commitment?: CommitmentLevel }) {
    if (!this.connection) {
      await this._startConnection();
    }
    return this.connection!.getTransaction(signature, opts);
  }

  /**
   * Returns the estimated fee for a given message
   */
  async getFeeForMessage(message: Uint8Array) {
    if (!this.connection) {
      await this._startConnection();
    }
    return this.connection!.getFeeForMessage(message);
  }

  // ==================== DAS API Methods ====================

  /**
   * Get a single asset by ID
   */
  async getAsset(
    id: string,
    options?: {
      showUnverifiedCollections?: boolean;
      showCollectionMetadata?: boolean;
      showFungible?: boolean;
      showInscription?: boolean;
    }
  ): Promise<DasAsset> {
    const result = (await makeDasRequest("getAsset", {
      id,
      ...(options && { options }),
    })) as DasAsset;
    return result;
  }

  /**
   * Get multiple assets by IDs
   */
  async getAssetBatch(
    ids: string[],
    options?: {
      showUnverifiedCollections?: boolean;
      showCollectionMetadata?: boolean;
      showFungible?: boolean;
      showInscription?: boolean;
    }
  ): Promise<DasAssetBatchResponse> {
    const result = (await makeDasRequest("getAssetBatch", {
      ids,
      ...(options && { options }),
    })) as DasAssetBatchResponse;
    return result;
  }

  /**
   * Get asset proof for compressed NFTs
   */
  async getAssetProof(id: string): Promise<{
    root: string;
    proof: string[];
    node_index: number;
    leaf: string;
    tree_id: string;
    burnt: boolean;
  }> {
    const result = (await makeDasRequest("getAssetProof", { id })) as {
      root: string;
      proof: string[];
      node_index: number;
      leaf: string;
      tree_id: string;
      burnt: boolean;
    };
    return result;
  }

  /**
   * Get assets by owner address
   */
  async getAssetsByOwner(
    ownerAddress: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: {
        sortBy?: "created" | "recent_action" | "updated" | "none";
        sortDirection?: "asc" | "desc";
      };
      before?: string;
      after?: string;
      showUnverifiedCollections?: boolean;
      showCollectionMetadata?: boolean;
      showGrandTotal?: boolean;
      showFungible?: boolean;
      showNativeBalance?: boolean;
      showInscription?: boolean;
      showZeroBalance?: boolean;
    }
  ): Promise<DasAssetsByOwnerResponse> {
    const result = (await makeDasRequest("getAssetsByOwner", {
      ownerAddress,
      ...options,
    })) as DasAssetsByOwnerResponse;
    return result;
  }

  /**
   * Get assets by group (collection)
   */
  async getAssetsByGroup(
    groupKey: string,
    groupValue: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: {
        sortBy?: "created" | "recent_action" | "updated" | "none";
        sortDirection?: "asc" | "desc";
      };
      before?: string;
      after?: string;
      showUnverifiedCollections?: boolean;
      showCollectionMetadata?: boolean;
      showGrandTotal?: boolean;
      showInscription?: boolean;
    }
  ): Promise<DasAssetsByGroupResponse> {
    const result = (await makeDasRequest("getAssetsByGroup", {
      groupKey,
      groupValue,
      ...options,
    })) as DasAssetsByGroupResponse;
    return result;
  }

  /**
   * Get assets by creator address
   */
  async getAssetsByCreator(
    creatorAddress: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: {
        sortBy?: "created" | "recent_action" | "updated" | "none";
        sortDirection?: "asc" | "desc";
      };
      before?: string;
      after?: string;
      showUnverifiedCollections?: boolean;
      showCollectionMetadata?: boolean;
      showGrandTotal?: boolean;
      showInscription?: boolean;
    }
  ): Promise<DasAssetsByCreatorResponse> {
    const result = (await makeDasRequest("getAssetsByCreator", {
      creatorAddress,
      ...options,
    })) as DasAssetsByCreatorResponse;
    return result;
  }

  /**
   * Get assets by authority address
   */
  async getAssetsByAuthority(
    authorityAddress: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: {
        sortBy?: "created" | "recent_action" | "updated" | "none";
        sortDirection?: "asc" | "desc";
      };
      before?: string;
      after?: string;
      showUnverifiedCollections?: boolean;
      showCollectionMetadata?: boolean;
      showGrandTotal?: boolean;
      showInscription?: boolean;
    }
  ): Promise<DasAssetsByOwnerResponse> {
    const result = (await makeDasRequest("getAssetsByAuthority", {
      authorityAddress,
      ...options,
    })) as DasAssetsByOwnerResponse;
    return result;
  }

  /**
   * Search assets with filters
   */
  async searchAssets(
    params: {
      ownerAddress?: string;
      tokenType?: "fungible" | "nonFungible" | "regularNft" | "compressedNft" | "all";
      page?: number;
      limit?: number;
      authorityAddress?: string;
      sortBy?: {
        sortBy?: "created" | "recent_action" | "updated" | "none";
        sortDirection?: "asc" | "desc";
      };
      compressed?: boolean;
      compressible?: boolean;
      creatorAddress?: string;
      creatorVerified?: boolean;
      grouping?: string[];
      tree?: string;
      supply?: number;
      frozen?: boolean;
      burnt?: boolean;
      interface?: string;
      before?: string;
      after?: string;
      options?: {
        showUnverifiedCollections?: boolean;
        showCollectionMetadata?: boolean;
        showGrandTotal?: boolean;
        showNativeBalance?: boolean;
        showInscription?: boolean;
        showZeroBalance?: boolean;
      };
    }
  ): Promise<DasSearchAssetsResponse> {
    const result = (await makeDasRequest("searchAssets", params)) as {
      assets: DasSearchAssetsResponse;
    };
    return result.assets;
  }

  /**
   * Get token accounts
   */
  async getTokenAccounts(
    params: {
      owner: string;
      mint?: string;
      page?: number;
      limit?: number;
      cursor?: string;
      before?: string;
      after?: string;
      options?: {
        showZeroBalance?: boolean;
      };
    }
  ): Promise<DasGetTokenAccountsResponse> {
    const result = (await makeDasRequest("getTokenAccounts", params)) as DasGetTokenAccountsResponse;
    return result;
  }

  /**
   * Get NFT editions
   */
  async getNftEditions(
    mint: string,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{
    last_indexed_slot: number;
    total: number;
    limit: number;
    page: number;
    master_edition_address: string;
    supply: number;
    max_supply: number;
    editions: Array<{
      mint: string;
      edition_address: string;
      edition: number;
      burnt: boolean;
    }>;
  }> {
    const result = (await makeDasRequest("getNftEditions", {
      mint,
      ...options,
    })) as {
      last_indexed_slot: number;
      total: number;
      limit: number;
      page: number;
      master_edition_address: string;
      supply: number;
      max_supply: number;
      editions: Array<{
        mint: string;
        edition_address: string;
        edition: number;
        burnt: boolean;
      }>;
    };
    return result;
  }

  /**
   * Get signatures for asset
   */
  async getSignaturesForAsset(
    id: string,
    options?: {
      page?: number;
      limit?: number;
      before?: string;
      after?: string;
    }
  ): Promise<{
    last_indexed_slot: number;
    total: number;
    limit: number;
    page: number;
    signatures: Array<{
      signature: string;
      slot: number;
      timestamp: number;
    }>;
  }> {
    const result = (await makeDasRequest("getSignaturesForAsset", {
      id,
      ...options,
    })) as {
      last_indexed_slot: number;
      total: number;
      limit: number;
      page: number;
      signatures: Array<{
        signature: string;
        slot: number;
        timestamp: number;
      }>;
    };
    return result;
  }
}

// Export a singleton instance
let rpcInstance: SolanaRPC | null = null;

export async function getSolanaRPC(): Promise<SolanaRPC> {
  if (!rpcInstance) {
    rpcInstance = new SolanaRPC();
  }
  return rpcInstance;
}
