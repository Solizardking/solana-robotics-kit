import axios from "axios";

const BIRDEYE_API_URL = "https://public-api.birdeye.so";
// Use TOKEN_ADDRESS from environment or fallback to default $CLAWD address
const CLAWD_TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump";

interface TokenPrice {
  value: number;
  updateUnixTime: number;
  updateHumanTime: string;
  priceChange24h: number;
}

interface TokenOverview {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  extensions?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    description?: string;
  };
  logoURI?: string;
  liquidity: number;
  price: number;
  priceChange24hPercent: number;
  volume24h: number;
  volume24hChangePercent: number;
  mc: number; // Market cap
  supply: number;
  holder: number;
  trade24h: number;
  trade24hChangePercent: number;
  buy24h: number;
  sell24h: number;
  uniqueWallet24h: number;
  uniqueWallet24hChangePercent: number;
  lastTradeUnixTime: number;
}

interface TokenSecurity {
  creatorAddress: string;
  creationTx: string;
  creationTime: number;
  top10HolderPercent: number;
  top10HolderBalance: number;
  top10UserPercent: number;
  top10UserBalance: number;
  isTrueToken: boolean;
  totalSupply: number;
  ownerAddress?: string;
  ownerBalance?: number;
  ownerPercentage?: number;
  creatorBalance?: number;
  creatorPercentage?: number;
  metaplexUpdateAuthority?: string;
  metaplexOwnerUpdateAuthority?: boolean;
  isMutable: boolean;
  freezeAuthority?: string;
  mintAuthority?: string;
}

/**
 * Get token price from Birdeye
 */
export async function getTokenPrice(tokenAddress: string = CLAWD_TOKEN_ADDRESS): Promise<TokenPrice | null> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  
  if (!apiKey) {
    console.warn("[Birdeye] API key not configured, returning mock price");
    return {
      value: 0.00042069,
      updateUnixTime: Math.floor(Date.now() / 1000),
      updateHumanTime: new Date().toISOString(),
      priceChange24h: 12.5
    };
  }

  try {
    const response = await axios.get(
      `${BIRDEYE_API_URL}/defi/price`,
      {
        params: { address: tokenAddress },
        headers: {
          "X-API-KEY": apiKey,
          "x-chain": "solana"
        }
      }
    );

    // Return null if API returns empty data
    if (!response.data.data || Object.keys(response.data.data).length === 0) {
      console.warn("[Birdeye] Price API returned empty data");
      return null;
    }
    return response.data.data;
  } catch (error: any) {
    console.error("[Birdeye] Price error:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Get token overview from Birdeye
 */
export async function getTokenOverview(tokenAddress: string = CLAWD_TOKEN_ADDRESS): Promise<TokenOverview | null> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  
  if (!apiKey) {
    console.warn("[Birdeye] API key not configured, returning mock overview");
    return {
      address: CLAWD_TOKEN_ADDRESS,
      decimals: 9,
      symbol: '$CLAWD',
      name: "CLAWD",
      extensions: {
        website: "https://cheshireterminal.ai",
        twitter: "https://x.com/solanarobotics",
        description: "The native utility token of the Solana Robotics / CLAWD ecosystem"
      },
      logoURI: "/clawd-token.png",
      liquidity: 125000,
      price: 0.00042069,
      priceChange24hPercent: 12.5,
      volume24h: 45000,
      volume24hChangePercent: 25.3,
      mc: 420690,
      supply: 1000000000,
      holder: 1250,
      trade24h: 890,
      trade24hChangePercent: 15.2,
      buy24h: 520,
      sell24h: 370,
      uniqueWallet24h: 245,
      uniqueWallet24hChangePercent: 8.5,
      lastTradeUnixTime: Math.floor(Date.now() / 1000)
    };
  }

  try {
    const response = await axios.get(
      `${BIRDEYE_API_URL}/defi/token_overview`,
      {
        params: { address: tokenAddress },
        headers: {
          "X-API-KEY": apiKey,
          "x-chain": "solana"
        }
      }
    );

    return response.data.data;
  } catch (error: any) {
    console.error("[Birdeye] Overview error:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Get token security info from Birdeye
 */
export async function getTokenSecurity(tokenAddress: string = CLAWD_TOKEN_ADDRESS): Promise<TokenSecurity | null> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  
  if (!apiKey) {
    console.warn("[Birdeye] API key not configured, returning mock security");
    return {
      creatorAddress: "8bit...sats",
      creationTx: "mock-tx-hash",
      creationTime: Date.now() - 86400000 * 30,
      top10HolderPercent: 35.5,
      top10HolderBalance: 355000000,
      top10UserPercent: 28.2,
      top10UserBalance: 282000000,
      isTrueToken: true,
      totalSupply: 1000000000,
      isMutable: false
    };
  }

  try {
    const response = await axios.get(
      `${BIRDEYE_API_URL}/defi/token_security`,
      {
        params: { address: tokenAddress },
        headers: {
          "X-API-KEY": apiKey,
          "x-chain": "solana"
        }
      }
    );

    return response.data.data;
  } catch (error: any) {
    console.error("[Birdeye] Security error:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Get token price history from Birdeye
 */
export async function getTokenPriceHistory(
  tokenAddress: string = CLAWD_TOKEN_ADDRESS,
  type: "1m" | "3m" | "15m" | "30m" | "1H" | "2H" | "4H" | "6H" | "8H" | "12H" | "1D" | "3D" | "1W" | "1M" = "1H",
  timeFrom?: number,
  timeTo?: number
): Promise<Array<{ unixTime: number; value: number }> | null> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  
  if (!apiKey) {
    console.warn("[Birdeye] API key not configured, returning mock history");
    const now = Math.floor(Date.now() / 1000);
    const history = [];
    for (let i = 24; i >= 0; i--) {
      history.push({
        unixTime: now - i * 3600,
        value: 0.00042069 * (1 + (Math.random() - 0.5) * 0.1)
      });
    }
    return history;
  }

  try {
    const response = await axios.get(
      `${BIRDEYE_API_URL}/defi/history_price`,
      {
        params: {
          address: tokenAddress,
          address_type: "token",
          type,
          time_from: timeFrom,
          time_to: timeTo
        },
        headers: {
          "X-API-KEY": apiKey,
          "x-chain": "solana"
        }
      }
    );

    return response.data.data?.items || [];
  } catch (error: any) {
    console.error("[Birdeye] History error:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Get OHLCV data from Birdeye
 */
export async function getTokenOHLCV(
  tokenAddress: string = CLAWD_TOKEN_ADDRESS,
  type: "1m" | "3m" | "5m" | "15m" | "30m" | "1H" | "2H" | "4H" | "6H" | "8H" | "12H" | "1D" | "3D" | "1W" | "1M" = "1H",
  timeFrom?: number,
  timeTo?: number
): Promise<Array<{
  unixTime: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}> | null> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  
  if (!apiKey) {
    console.warn("[Birdeye] API key not configured, returning mock OHLCV");
    const now = Math.floor(Date.now() / 1000);
    const ohlcv = [];
    let lastClose = 0.00042069;
    for (let i = 24; i >= 0; i--) {
      const open = lastClose;
      const change = (Math.random() - 0.5) * 0.05;
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      ohlcv.push({
        unixTime: now - i * 3600,
        o: open,
        h: high,
        l: low,
        c: close,
        v: 1000 + Math.random() * 5000
      });
      lastClose = close;
    }
    return ohlcv;
  }

  try {
    const response = await axios.get(
      `${BIRDEYE_API_URL}/defi/ohlcv`,
      {
        params: {
          address: tokenAddress,
          type,
          time_from: timeFrom,
          time_to: timeTo
        },
        headers: {
          "X-API-KEY": apiKey,
          "x-chain": "solana"
        }
      }
    );

    return response.data.data?.items || [];
  } catch (error: any) {
    console.error("[Birdeye] OHLCV error:", error.response?.data || error.message);
    return null;
  }
}

export const CLAWD_TOKEN = {
  address: CLAWD_TOKEN_ADDRESS,
  symbol: '$CLAWD',
  name: "CLAWD",
  decimals: 9,
  links: {
    twitter: "https://x.com/solanarobotics",
    github: "https://github.com/8bitsats/solana-robotics-kit",
    jupiter: `https://jup.ag/swap/SOL-${CLAWD_TOKEN_ADDRESS}`,
    raydium: `https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${CLAWD_TOKEN_ADDRESS}`,
    birdeye: `https://birdeye.so/token/${CLAWD_TOKEN_ADDRESS}?chain=solana`,
    solscan: `https://solscan.io/token/${CLAWD_TOKEN_ADDRESS}`
  }
};


/**
 * Get trending tokens from Birdeye
 */
export interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  mc: number;
}

export async function getTrendingTokens(limit: number = 10): Promise<TrendingToken[] | null> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  
  if (!apiKey) {
    console.warn("[Birdeye] API key not configured, returning mock trending tokens");
    // Return mock trending tokens
    return [
      {
        address: CLAWD_TOKEN_ADDRESS,
        symbol: '$CLAWD',
        name: "CLAWD",
        price: 0.00042069,
        priceChange24h: 5.23,
        volume24h: 125000,
        mc: 420690,
      },
      {
        address: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        name: "Solana",
        price: 185.42,
        priceChange24h: 2.15,
        volume24h: 1250000000,
        mc: 85000000000,
      },
      {
        address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        symbol: "USDC",
        name: "USD Coin",
        price: 1.00,
        priceChange24h: 0.01,
        volume24h: 2500000000,
        mc: 32000000000,
      },
      {
        address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
        symbol: "JUP",
        name: "Jupiter",
        price: 0.85,
        priceChange24h: -1.23,
        volume24h: 45000000,
        mc: 1200000000,
      },
      {
        address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        symbol: "BONK",
        name: "Bonk",
        price: 0.00002345,
        priceChange24h: 8.45,
        volume24h: 85000000,
        mc: 1500000000,
      },
    ];
  }

  try {
    const response = await axios.get(
      `${BIRDEYE_API_URL}/defi/token_trending`,
      {
        params: {
          sort_by: "volume24hUSD",
          sort_type: "desc",
          offset: 0,
          limit,
        },
        headers: {
          "X-API-KEY": apiKey,
          "x-chain": "solana"
        }
      }
    );

    const tokens = response.data.data?.tokens || [];
    return tokens.map((t: any) => ({
      address: t.address,
      symbol: t.symbol,
      name: t.name,
      logoURI: t.logoURI,
      price: t.price || 0,
      priceChange24h: t.priceChange24hPercent || 0,
      volume24h: t.volume24hUSD || 0,
      mc: t.mc || 0,
    }));
  } catch (error: any) {
    console.error("[Birdeye] Trending error:", error.response?.data || error.message);
    return null;
  }
}


/**
 * Meme token detail from Birdeye v3 API
 * More accurate for meme tokens on Meteora, Pump.fun, etc.
 */
export interface MemeTokenDetail {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUri?: string;
  description?: string;
  twitter?: string;
  website?: string;
  price: number;
  liquidity: number;
  totalSupply: number;
  circulatingSupply: number;
  fdv: number;
  marketCap: number;
  priceChange24h?: number;
  source?: string;
  creator?: string;
  creationTime?: number;
  graduated?: boolean;
  progressPercent?: number;
}

export async function getMemeTokenDetail(tokenAddress: string = CLAWD_TOKEN_ADDRESS): Promise<MemeTokenDetail | null> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  
  if (!apiKey) {
    console.warn("[Birdeye] API key not configured, returning mock meme token detail");
    return {
      address: tokenAddress,
      name: "CLAWD",
      symbol: 'CLAWD',
      decimals: 9,
      logoUri: "https://ipfs.io/ipfs/QmXuZwv5qfnAJm3LTodfebBmj7x9pH3nJ663g8R2oHp6s5",
      description: "Robotics is evolving. AI is accelerating. Now it's all coming on-chain.",
      twitter: "https://x.com/solanarobotics",
      website: "https://solanarobotics.org",
      price: 0.000007971,
      liquidity: 7618.04,
      totalSupply: 999914072.2,
      circulatingSupply: 999914072.2,
      fdv: 7970.52,
      marketCap: 7970.52,
      priceChange24h: -45.67,
      source: "meteora_dynamic_bonding_curve",
      graduated: false,
      progressPercent: 15.81,
    };
  }

  try {
    const response = await axios.get(
      `${BIRDEYE_API_URL}/defi/v3/token/meme/detail/single`,
      {
        params: {
          address: tokenAddress,
        },
        headers: {
          "X-API-KEY": apiKey,
          "x-chain": "solana",
          "accept": "application/json",
        }
      }
    );

    const data = response.data.data;
    if (!data) {
      console.warn("[Birdeye] Meme token detail returned empty data");
      return null;
    }

    return {
      address: data.address,
      name: data.name,
      symbol: data.symbol,
      decimals: data.decimals,
      logoUri: data.logo_uri,
      description: data.extensions?.description,
      twitter: data.extensions?.twitter,
      website: data.extensions?.website,
      price: data.price || 0,
      liquidity: data.liquidity || 0,
      totalSupply: data.total_supply || 0,
      circulatingSupply: data.circulating_supply || 0,
      fdv: data.fdv || 0,
      marketCap: data.market_cap || 0,
      priceChange24h: data.price_change_24h,
      source: data.meme_info?.source,
      creator: data.meme_info?.creator,
      creationTime: data.meme_info?.creation_time,
      graduated: data.meme_info?.graduated,
      progressPercent: data.meme_info?.progress_percent,
    };
  } catch (error: any) {
    console.error("[Birdeye] Meme token detail error:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Get real-time price with liquidity from Birdeye
 * Uses the v1 price endpoint with include_liquidity=true
 */
export interface RealTimePrice {
  value: number;
  updateUnixTime: number;
  updateHumanTime: string;
  priceChange24h: number;
  priceInNative: number;
  liquidity: number;
  isScaledUiToken: boolean;
}

export async function getRealTimePrice(tokenAddress: string = CLAWD_TOKEN_ADDRESS): Promise<RealTimePrice | null> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  
  if (!apiKey) {
    console.warn("[Birdeye] API key not configured, returning mock real-time price");
    return {
      value: 0.000007971,
      updateUnixTime: Math.floor(Date.now() / 1000),
      updateHumanTime: new Date().toISOString(),
      priceChange24h: -45.67,
      priceInNative: 0.0000000564,
      liquidity: 7618.04,
      isScaledUiToken: false,
    };
  }

  try {
    const response = await axios.get(
      `${BIRDEYE_API_URL}/defi/price`,
      {
        params: {
          address: tokenAddress,
          include_liquidity: true,
          ui_amount_mode: "raw",
        },
        headers: {
          "X-API-KEY": apiKey,
          "x-chain": "solana",
          "accept": "application/json",
        }
      }
    );

    const data = response.data.data;
    if (!data) {
      console.warn("[Birdeye] Real-time price returned empty data");
      return null;
    }

    return {
      value: data.value || 0,
      updateUnixTime: data.updateUnixTime,
      updateHumanTime: data.updateHumanTime,
      priceChange24h: data.priceChange24h || 0,
      priceInNative: data.priceInNative || 0,
      liquidity: data.liquidity || 0,
      isScaledUiToken: data.isScaledUiToken || false,
    };
  } catch (error: any) {
    console.error("[Birdeye] Real-time price error:", error.response?.data || error.message);
    return null;
  }
}

// Export the token address for use in other modules
export { CLAWD_TOKEN_ADDRESS };
