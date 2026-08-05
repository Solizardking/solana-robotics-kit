/**
 * Helius API Integration for Token Gating
 * Uses DAS API to verify $KIT token holdings
 */

import { ENV } from './_core/env';

// $KIT Token Address
const KIT_TOKEN_ADDRESS = 'DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS';

// Minimum token amount required for access (in token units)
const MIN_TOKEN_AMOUNT = 1;

interface HeliusAsset {
  id: string;
  content: {
    metadata: {
      name: string;
      symbol: string;
    };
  };
  token_info?: {
    balance: string;
    decimals: number;
    associated_token_address: string;
  };
}

interface HeliusResponse {
  total: number;
  limit: number;
  items: HeliusAsset[];
}

/**
 * Get Helius RPC URL with API key
 */
function getHeliusRpcUrl(): string {
  const apiKey = process.env.HELIUS_API_KEY;
  const rpcUrl = process.env.HELIUS_RPC_URL;
  
  if (rpcUrl) {
    return rpcUrl;
  }
  
  if (apiKey) {
    return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
  }
  
  // Fallback to devnet for testing
  return 'https://api.devnet.solana.com';
}

/**
 * Verify if a wallet holds $KIT tokens using Helius DAS API
 */
export async function verifyTokenHolding(walletAddress: string): Promise<{
  isHolder: boolean;
  balance: number;
  tokenAddress: string;
  error?: string;
}> {
  const apiKey = process.env.HELIUS_API_KEY;
  
  // If no API key, return mock data for development
  if (!apiKey) {
    console.log('[Helius] No API key configured, using mock verification');
    return {
      isHolder: true, // Allow access in dev mode
      balance: 1000000,
      tokenAddress: KIT_TOKEN_ADDRESS,
      error: 'API key not configured - mock mode enabled',
    };
  }

  try {
    const response = await fetch(getHeliusRpcUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'token-gate-check',
        method: 'searchAssets',
        params: {
          ownerAddress: walletAddress,
          tokenType: 'fungible',
          displayOptions: {
            showFungible: true,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Unknown Helius error');
    }

    const assets: HeliusAsset[] = data.result?.items || [];
    
    // Find $KIT token in the wallet
    const kitToken = assets.find(
      (asset) => asset.id === KIT_TOKEN_ADDRESS
    );

    if (kitToken && kitToken.token_info) {
      const balance = parseInt(kitToken.token_info.balance, 10);
      const decimals = kitToken.token_info.decimals || 9;
      const humanBalance = balance / Math.pow(10, decimals);
      
      return {
        isHolder: humanBalance >= MIN_TOKEN_AMOUNT,
        balance: humanBalance,
        tokenAddress: KIT_TOKEN_ADDRESS,
      };
    }

    return {
      isHolder: false,
      balance: 0,
      tokenAddress: KIT_TOKEN_ADDRESS,
    };
  } catch (error: any) {
    console.error('[Helius] Token verification error:', error);
    return {
      isHolder: false,
      balance: 0,
      tokenAddress: KIT_TOKEN_ADDRESS,
      error: error.message,
    };
  }
}

/**
 * Get all fungible token balances for a wallet
 */
export async function getWalletTokens(walletAddress: string): Promise<{
  tokens: Array<{
    address: string;
    name: string;
    symbol: string;
    balance: number;
    decimals: number;
  }>;
  error?: string;
}> {
  const apiKey = process.env.HELIUS_API_KEY;
  
  // If no API key, return mock data
  if (!apiKey) {
    return {
      tokens: [
        {
          address: KIT_TOKEN_ADDRESS,
          name: 'Solana Robotics Kit',
          symbol: 'KIT',
          balance: 1000000,
          decimals: 9,
        },
        {
          address: 'So11111111111111111111111111111111111111112',
          name: 'Wrapped SOL',
          symbol: 'SOL',
          balance: 5.5,
          decimals: 9,
        },
      ],
      error: 'API key not configured - mock mode enabled',
    };
  }

  try {
    const response = await fetch(getHeliusRpcUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'get-wallet-tokens',
        method: 'searchAssets',
        params: {
          ownerAddress: walletAddress,
          tokenType: 'fungible',
          displayOptions: {
            showFungible: true,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Unknown Helius error');
    }

    const assets: HeliusAsset[] = data.result?.items || [];
    
    const tokens = assets
      .filter((asset) => asset.token_info)
      .map((asset) => {
        const balance = parseInt(asset.token_info!.balance, 10);
        const decimals = asset.token_info!.decimals || 9;
        
        return {
          address: asset.id,
          name: asset.content?.metadata?.name || 'Unknown',
          symbol: asset.content?.metadata?.symbol || '???',
          balance: balance / Math.pow(10, decimals),
          decimals,
        };
      });

    return { tokens };
  } catch (error: any) {
    console.error('[Helius] Get wallet tokens error:', error);
    return {
      tokens: [],
      error: error.message,
    };
  }
}

/**
 * Get transaction history for a wallet
 */
export async function getWalletTransactions(
  walletAddress: string,
  limit: number = 20
): Promise<{
  transactions: Array<{
    signature: string;
    timestamp: number;
    type: string;
    fee: number;
    status: string;
  }>;
  error?: string;
}> {
  const apiKey = process.env.HELIUS_API_KEY;
  
  // If no API key, return mock data
  if (!apiKey) {
    return {
      transactions: [
        {
          signature: '5xYz...mock1',
          timestamp: Date.now() - 3600000,
          type: 'SWAP',
          fee: 0.000005,
          status: 'confirmed',
        },
        {
          signature: '3aBc...mock2',
          timestamp: Date.now() - 7200000,
          type: 'TRANSFER',
          fee: 0.000005,
          status: 'confirmed',
        },
      ],
      error: 'API key not configured - mock mode enabled',
    };
  }

  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${apiKey}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    const data = await response.json();
    
    const transactions = data.map((tx: any) => ({
      signature: tx.signature,
      timestamp: tx.timestamp * 1000,
      type: tx.type || 'UNKNOWN',
      fee: tx.fee / 1e9,
      status: tx.transactionError ? 'failed' : 'confirmed',
    }));

    return { transactions };
  } catch (error: any) {
    console.error('[Helius] Get transactions error:', error);
    return {
      transactions: [],
      error: error.message,
    };
  }
}

export const KIT_TOKEN = {
  address: KIT_TOKEN_ADDRESS,
  name: 'Solana Robotics Kit',
  symbol: 'KIT',
  decimals: 9,
  minRequired: MIN_TOKEN_AMOUNT,
};
