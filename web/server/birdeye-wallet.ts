/**
 * Birdeye Wallet API Integration
 * Used for fetching wallet net worth, portfolio, and PnL data
 */

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY || "";
const BIRDEYE_BASE_URL = "https://public-api.birdeye.so";

// Common headers for Birdeye API requests
function getBirdeyeHeaders() {
  return {
    "X-API-KEY": BIRDEYE_API_KEY,
    "accept": "application/json",
    "x-chain": "solana",
  };
}

export interface NetWorthAsset {
  symbol: string;
  token_address: string;
  decimal: number;
  balance: string;
  price: number;
  value: number;
}

export interface WalletNetWorth {
  wallet_address: string;
  currency: string;
  net_worth: number;
  requested_timestamp: string;
  resolved_timestamp: string;
  net_assets: NetWorthAsset[];
}

export interface WalletNetWorthResponse {
  success: boolean;
  data: WalletNetWorth;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

/**
 * Get current net worth details of a wallet
 */
export async function getWalletNetWorthDetails(
  walletAddress: string,
  options?: {
    sortType?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }
): Promise<WalletNetWorthResponse | null> {
  try {
    if (!BIRDEYE_API_KEY) {
      console.error("[Birdeye Wallet] API key not configured");
      return null;
    }

    const params = new URLSearchParams({
      wallet: walletAddress,
      sort_type: options?.sortType || "desc",
      limit: String(options?.limit || 100),
      offset: String(options?.offset || 0),
    });

    const response = await fetch(
      `${BIRDEYE_BASE_URL}/wallet/v2/net-worth-details?${params}`,
      {
        method: "GET",
        headers: getBirdeyeHeaders(),
      }
    );

    if (!response.ok) {
      console.error("[Birdeye Wallet] HTTP error:", response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error("[Birdeye Wallet] API error:", data.message);
      return null;
    }

    return data as WalletNetWorthResponse;
  } catch (error) {
    console.error("[Birdeye Wallet] getWalletNetWorthDetails error:", error);
    return null;
  }
}

export interface NetWorthSummary {
  wallet: string;
  net_worth: number;
}

export interface MultipleNetWorthResponse {
  success: boolean;
  data: {
    wallets: NetWorthSummary[];
  };
}

/**
 * Get net worth summary for multiple wallets (up to 100)
 */
export async function getMultipleWalletsNetWorth(
  wallets: string[]
): Promise<MultipleNetWorthResponse | null> {
  try {
    if (!BIRDEYE_API_KEY) {
      console.error("[Birdeye Wallet] API key not configured");
      return null;
    }

    if (wallets.length > 100) {
      console.error("[Birdeye Wallet] Maximum 100 wallets per request");
      return null;
    }

    const response = await fetch(
      `${BIRDEYE_BASE_URL}/wallet/v2/net-worth-summary/multiple`,
      {
        method: "POST",
        headers: {
          ...getBirdeyeHeaders(),
          "content-type": "application/json",
        },
        body: JSON.stringify({ wallets }),
      }
    );

    if (!response.ok) {
      console.error("[Birdeye Wallet] HTTP error:", response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error("[Birdeye Wallet] API error:", data.message);
      return null;
    }

    return data as MultipleNetWorthResponse;
  } catch (error) {
    console.error("[Birdeye Wallet] getMultipleWalletsNetWorth error:", error);
    return null;
  }
}

export interface PnLCounts {
  total_buy: number;
  total_sell: number;
  total_trade: number;
  total_win: number;
  total_loss: number;
  win_rate: number;
}

export interface PnLCashflow {
  total_invested: number;
  total_sold: number;
  current_value?: number;
}

export interface PnLData {
  realized_profit_usd: number;
  realized_profit_percent: number;
  unrealized_usd: number;
  total_usd: number;
  avg_profit_per_trade_usd: number;
}

export interface WalletPnLSummary {
  unique_tokens: number;
  counts: PnLCounts;
  cashflow_usd: PnLCashflow;
  pnl: PnLData;
}

export interface WalletPnLResponse {
  success: boolean;
  data: {
    summary: WalletPnLSummary;
  };
}

/**
 * Get PnL summary for a wallet
 */
export async function getWalletPnL(
  walletAddress: string,
  duration: "all" | "90d" | "30d" | "7d" | "24h" = "all"
): Promise<WalletPnLResponse | null> {
  try {
    if (!BIRDEYE_API_KEY) {
      console.error("[Birdeye Wallet] API key not configured");
      return null;
    }

    const params = new URLSearchParams({
      wallet: walletAddress,
      duration,
    });

    const response = await fetch(
      `${BIRDEYE_BASE_URL}/wallet/v2/pnl/summary?${params}`,
      {
        method: "GET",
        headers: getBirdeyeHeaders(),
      }
    );

    if (!response.ok) {
      console.error("[Birdeye Wallet] HTTP error:", response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error("[Birdeye Wallet] API error:", data.message);
      return null;
    }

    return data as WalletPnLResponse;
  } catch (error) {
    console.error("[Birdeye Wallet] getWalletPnL error:", error);
    return null;
  }
}

export interface TokenPnLData {
  symbol: string;
  decimals: number;
  counts: {
    total_buy: number;
    total_sell: number;
    total_trade: number;
  };
  quantity: {
    total_bought_amount: number;
    total_sold_amount: number;
    holding: number;
  };
  cashflow_usd: {
    cost_of_quantity_sold: number;
    total_invested: number;
    total_sold: number;
    current_value: number;
  };
  pnl: {
    realized_profit_usd: number;
    realized_profit_percent: number;
    unrealized_usd: number;
    unrealized_percent: number;
    total_usd: number;
    total_percent: number;
    avg_profit_per_trade_usd: number;
  };
  pricing: {
    current_price: number;
    avg_buy_cost: number;
    avg_sell_cost: number;
  };
}

export interface TokenPnLResponse {
  success: boolean;
  data: {
    meta: {
      address: string;
      currency: string;
      holding_check: boolean;
      time: string;
    };
    tokens: Record<string, TokenPnLData>;
  };
}

/**
 * Get PnL per token for a wallet
 */
export async function getWalletTokenPnL(
  walletAddress: string,
  tokenAddresses: string[]
): Promise<TokenPnLResponse | null> {
  try {
    if (!BIRDEYE_API_KEY) {
      console.error("[Birdeye Wallet] API key not configured");
      return null;
    }

    if (tokenAddresses.length > 50) {
      console.error("[Birdeye Wallet] Maximum 50 tokens per request");
      return null;
    }

    const params = new URLSearchParams({
      wallet: walletAddress,
      token_addresses: tokenAddresses.join(","),
    });

    const response = await fetch(
      `${BIRDEYE_BASE_URL}/wallet/v2/pnl?${params}`,
      {
        method: "GET",
        headers: getBirdeyeHeaders(),
      }
    );

    if (!response.ok) {
      console.error("[Birdeye Wallet] HTTP error:", response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error("[Birdeye Wallet] API error:", data.message);
      return null;
    }

    return data as TokenPnLResponse;
  } catch (error) {
    console.error("[Birdeye Wallet] getWalletTokenPnL error:", error);
    return null;
  }
}

export interface NetWorthChartPoint {
  timestamp: number;
  net_worth: number;
}

export interface NetWorthChartResponse {
  success: boolean;
  data: {
    items: NetWorthChartPoint[];
  };
}

/**
 * Get net worth chart data for a wallet
 */
export async function getWalletNetWorthChart(
  walletAddress: string,
  timeframe: "1h" | "1d" = "1d"
): Promise<NetWorthChartResponse | null> {
  try {
    if (!BIRDEYE_API_KEY) {
      console.error("[Birdeye Wallet] API key not configured");
      return null;
    }

    const params = new URLSearchParams({
      wallet: walletAddress,
      type: timeframe,
    });

    const response = await fetch(
      `${BIRDEYE_BASE_URL}/wallet/v2/net-worth-chart?${params}`,
      {
        method: "GET",
        headers: getBirdeyeHeaders(),
      }
    );

    if (!response.ok) {
      console.error("[Birdeye Wallet] HTTP error:", response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error("[Birdeye Wallet] API error:", data.message);
      return null;
    }

    return data as NetWorthChartResponse;
  } catch (error) {
    console.error("[Birdeye Wallet] getWalletNetWorthChart error:", error);
    return null;
  }
}

export interface WalletPortfolioData {
  netWorth: WalletNetWorth | null;
  pnl: WalletPnLSummary | null;
  tokenPnL: Record<string, TokenPnLData> | null;
  chartData: NetWorthChartPoint[] | null;
}

/**
 * Get comprehensive portfolio data for a wallet
 */
export async function getWalletPortfolio(
  walletAddress: string,
  tokenAddresses?: string[]
): Promise<WalletPortfolioData> {
  const [netWorthResult, pnlResult, chartResult] = await Promise.all([
    getWalletNetWorthDetails(walletAddress),
    getWalletPnL(walletAddress),
    getWalletNetWorthChart(walletAddress),
  ]);

  let tokenPnLResult = null;
  if (tokenAddresses && tokenAddresses.length > 0) {
    const tokenPnLResponse = await getWalletTokenPnL(walletAddress, tokenAddresses);
    tokenPnLResult = tokenPnLResponse?.data?.tokens || null;
  }

  return {
    netWorth: netWorthResult?.data || null,
    pnl: pnlResult?.data?.summary || null,
    tokenPnL: tokenPnLResult,
    chartData: chartResult?.data?.items || null,
  };
}
