/**
 * Metaplex MPL-Bubblegum Service Module
 * 
 * Provides compressed NFT (cNFT) minting and collection management
 * for Robot Passport NFTs using Metaplex Bubblegum.
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
  mplBubblegum,
  createTree,
  mintV1,
  mintToCollectionV1,
  findLeafAssetIdPda,
  parseLeafFromMintV1Transaction,
  fetchTreeConfigFromSeeds,
} from '@metaplex-foundation/mpl-bubblegum';
import { 
  mplTokenMetadata,
  createNft,
} from '@metaplex-foundation/mpl-token-metadata';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import {
  generateSigner,
  percentAmount,
  publicKey,
  createSignerFromKeypair,
  signerIdentity,
  type Umi,
  type Signer,
  type PublicKey,
  some,
  none,
} from '@metaplex-foundation/umi';

// Environment configuration
const RPC_URL = process.env.HELIUS_RPC_URL || process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';

// Tree configuration for Robot Passports
// Using depth 14 for ~16,384 cNFTs capacity at ~0.34 SOL cost
export const TREE_CONFIG = {
  maxDepth: 14,
  maxBufferSize: 64,
  canopyDepth: 8,
  estimatedCapacity: 16384,
  estimatedCostSol: 0.34,
};

export interface RobotPassportMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
  };
}

export interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl?: string;
  sellerFeeBasisPoints: number;
}

export interface MintResult {
  success: boolean;
  signature?: string;
  assetId?: string;
  leafIndex?: number;
  error?: string;
}

export interface TreeInfo {
  address: string;
  totalCapacity: number;
  numberMinted: number;
  isPublic: boolean;
  treeCreator: string;
}

export interface CollectionInfo {
  address: string;
  name: string;
  symbol: string;
  uri: string;
}

// Create a server-side Umi instance (no wallet - for read operations)
export function createServerUmi(): Umi {
  const umi = createUmi(RPC_URL)
    .use(mplBubblegum())
    .use(mplTokenMetadata())
    .use(dasApi());
  
  return umi;
}

// Create Umi configuration for client-side use
export function getUmiConfig() {
  return {
    rpcUrl: RPC_URL,
    treeConfig: TREE_CONFIG,
  };
}

/**
 * Fetch tree configuration from a Merkle Tree address
 */
export async function getTreeInfo(merkleTreeAddress: string): Promise<TreeInfo | null> {
  try {
    const umi = createServerUmi();
    const merkleTree = publicKey(merkleTreeAddress);
    
    const treeConfig = await fetchTreeConfigFromSeeds(umi, { merkleTree });
    
    return {
      address: merkleTreeAddress,
      totalCapacity: Number(treeConfig.totalMintCapacity),
      numberMinted: Number(treeConfig.numMinted),
      isPublic: treeConfig.isPublic,
      treeCreator: treeConfig.treeCreator.toString(),
    };
  } catch (error) {
    console.error('[Metaplex] Error fetching tree info:', error);
    return null;
  }
}

/**
 * Fetch cNFTs owned by a wallet address using DAS API
 */
export async function getAssetsByOwner(ownerAddress: string, page = 1, limit = 100) {
  try {
    const umi = createServerUmi();
    const owner = publicKey(ownerAddress);
    
    // Use the DAS API method
    const rpc = umi.rpc as unknown as {
      getAssetsByOwner: (params: { owner: PublicKey; page?: number; limit?: number }) => Promise<{
        items: Array<{
          id: { toString: () => string };
          content?: {
            metadata?: { name?: string; symbol?: string; attributes?: unknown[] };
            json_uri?: string;
            files?: Array<{ uri?: string }>;
            links?: { image?: string };
          };
          ownership?: { owner?: { toString: () => string } };
          compression?: { compressed?: boolean };
          grouping?: Array<{ group_key: string; group_value: string }>;
        }>;
        total: number;
        page?: number;
        limit?: number;
      }>;
    };
    
    const assets = await rpc.getAssetsByOwner({
      owner,
      page,
      limit,
    });
    
    return {
      items: assets.items.map((asset) => ({
        id: asset.id.toString(),
        name: asset.content?.metadata?.name || 'Unknown',
        symbol: asset.content?.metadata?.symbol || '',
        uri: asset.content?.json_uri || '',
        image: asset.content?.files?.[0]?.uri || asset.content?.links?.image || '',
        owner: asset.ownership?.owner?.toString() || '',
        compressed: asset.compression?.compressed || false,
        collection: asset.grouping?.find((g) => g.group_key === 'collection')?.group_value || null,
        attributes: asset.content?.metadata?.attributes || [],
      })),
      total: assets.total,
      page: assets.page || page,
      limit: assets.limit || limit,
    };
  } catch (error) {
    console.error('[Metaplex] Error fetching assets by owner:', error);
    return null;
  }
}

/**
 * Fetch cNFTs in a collection using DAS API
 */
export async function getAssetsByCollection(collectionAddress: string, page = 1, limit = 100) {
  try {
    const umi = createServerUmi();
    
    // Use the DAS API method
    const rpc = umi.rpc as unknown as {
      getAssetsByGroup: (params: { groupKey: string; groupValue: string; page?: number; limit?: number }) => Promise<{
        items: Array<{
          id: { toString: () => string };
          content?: {
            metadata?: { name?: string; symbol?: string; attributes?: unknown[] };
            json_uri?: string;
            files?: Array<{ uri?: string }>;
            links?: { image?: string };
          };
          ownership?: { owner?: { toString: () => string } };
          compression?: { compressed?: boolean };
        }>;
        total: number;
        page?: number;
        limit?: number;
      }>;
    };
    
    const assets = await rpc.getAssetsByGroup({
      groupKey: 'collection',
      groupValue: collectionAddress,
      page,
      limit,
    });
    
    return {
      items: assets.items.map((asset) => ({
        id: asset.id.toString(),
        name: asset.content?.metadata?.name || 'Unknown',
        symbol: asset.content?.metadata?.symbol || '',
        uri: asset.content?.json_uri || '',
        image: asset.content?.files?.[0]?.uri || asset.content?.links?.image || '',
        owner: asset.ownership?.owner?.toString() || '',
        compressed: asset.compression?.compressed || false,
        attributes: [],
      })),
      total: assets.total,
      page: assets.page || page,
      limit: assets.limit || limit,
    };
  } catch (error) {
    console.error('[Metaplex] Error fetching assets by collection:', error);
    return null;
  }
}

/**
 * Fetch a single asset by ID using DAS API
 */
export async function getAssetById(assetId: string) {
  try {
    const umi = createServerUmi();
    const id = publicKey(assetId);
    
    // Use the DAS API method
    const rpc = umi.rpc as unknown as {
      getAsset: (id: PublicKey) => Promise<{
        id: { toString: () => string };
        content?: {
          metadata?: { name?: string; symbol?: string; description?: string; attributes?: unknown[] };
          json_uri?: string;
          files?: Array<{ uri?: string }>;
          links?: { image?: string };
        };
        ownership?: {
          owner?: { toString: () => string };
          delegate?: { toString: () => string };
          frozen?: boolean;
        };
        compression?: {
          compressed?: boolean;
          tree?: { toString: () => string };
          leaf_id?: number;
        };
        grouping?: Array<{ group_key: string; group_value: string }>;
        creators?: unknown[];
        royalty?: unknown;
      }>;
    };
    
    const asset = await rpc.getAsset(id);
    
    return {
      id: asset.id.toString(),
      name: asset.content?.metadata?.name || 'Unknown',
      symbol: asset.content?.metadata?.symbol || '',
      description: asset.content?.metadata?.description || '',
      uri: asset.content?.json_uri || '',
      image: asset.content?.files?.[0]?.uri || asset.content?.links?.image || '',
      owner: asset.ownership?.owner?.toString() || '',
      delegate: asset.ownership?.delegate?.toString() || null,
      frozen: asset.ownership?.frozen || false,
      compressed: asset.compression?.compressed || false,
      merkleTree: asset.compression?.tree?.toString() || null,
      leafIndex: asset.compression?.leaf_id || null,
      collection: asset.grouping?.find((g) => g.group_key === 'collection')?.group_value || null,
      attributes: asset.content?.metadata?.attributes || [],
      creators: asset.creators || [],
      royalty: asset.royalty || null,
    };
  } catch (error) {
    console.error('[Metaplex] Error fetching asset:', error);
    return null;
  }
}

/**
 * Generate Robot Passport metadata
 */
export function generateRobotPassportMetadata(
  robotId: string,
  robotName: string,
  ownerWallet: string,
  imageUrl: string,
  attributes: Record<string, string | number> = {}
): RobotPassportMetadata {
  const defaultAttributes = [
    { trait_type: 'Robot ID', value: robotId },
    { trait_type: 'Owner', value: ownerWallet.slice(0, 8) + '...' + ownerWallet.slice(-4) },
    { trait_type: 'Issued', value: new Date().toISOString().split('T')[0] },
    { trait_type: 'Status', value: 'Active' },
    { trait_type: 'Clearance Level', value: 'Standard' },
  ];
  
  const customAttributes = Object.entries(attributes).map(([key, value]) => ({
    trait_type: key,
    value,
  }));
  
  return {
    name: `Robot Passport: ${robotName}`,
    symbol: 'RPASS',
    description: `Official Robot Passport for ${robotName}. This compressed NFT serves as a digital identity certificate for the robot, verifying ownership and capabilities on the Solana blockchain.`,
    image: imageUrl,
    externalUrl: 'https://solanarobotics.org/passport',
    attributes: [...defaultAttributes, ...customAttributes],
    properties: {
      files: [
        {
          uri: imageUrl,
          type: 'image/png',
        },
      ],
      category: 'image',
    },
  };
}

/**
 * Prepare transaction data for client-side signing
 * Returns serialized transaction that client can sign with their wallet
 */
export function prepareCreateTreeTransaction(
  treeCreatorAddress: string,
  maxDepth = TREE_CONFIG.maxDepth,
  maxBufferSize = TREE_CONFIG.maxBufferSize,
  isPublic = false
) {
  // This returns the configuration needed for client-side tree creation
  return {
    treeCreator: treeCreatorAddress,
    maxDepth,
    maxBufferSize,
    canopyDepth: TREE_CONFIG.canopyDepth,
    isPublic,
    estimatedCostSol: TREE_CONFIG.estimatedCostSol,
    estimatedCapacity: Math.pow(2, maxDepth),
  };
}

/**
 * Prepare mint transaction data for client-side signing
 */
export function prepareMintTransaction(
  merkleTreeAddress: string,
  leafOwnerAddress: string,
  metadata: RobotPassportMetadata,
  collectionAddress?: string
) {
  return {
    merkleTree: merkleTreeAddress,
    leafOwner: leafOwnerAddress,
    metadata: {
      name: metadata.name,
      symbol: metadata.symbol,
      uri: '', // Client will upload metadata and set URI
      sellerFeeBasisPoints: 500, // 5% royalty
      collection: collectionAddress ? { key: collectionAddress, verified: false } : null,
      creators: [
        {
          address: leafOwnerAddress,
          verified: false,
          share: 100,
        },
      ],
    },
    rawMetadata: metadata,
  };
}

/**
 * Validate a Solana public key
 */
export function isValidPublicKey(address: string): boolean {
  try {
    publicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the estimated cost for creating a tree
 */
export function getTreeCostEstimate(maxDepth: number): { costSol: number; capacity: number } {
  const costMap: Record<number, number> = {
    14: 0.34,
    16: 0.71,
    18: 2.10,
    20: 8.50,
    24: 26.12,
  };
  
  return {
    costSol: costMap[maxDepth] || 0.34,
    capacity: Math.pow(2, maxDepth),
  };
}

/**
 * Check if Metaplex/Helius RPC is configured
 */
export function isMetaplexConfigured(): boolean {
  return !!(process.env.HELIUS_RPC_URL || process.env.RPC_URL);
}

// Export types
export type { Umi, Signer, PublicKey };
