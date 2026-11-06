/**
 * Jupiter Trade Execution Module
 * Provides direct trade execution through Jupiter API
 */

const JUPITER_API_URL = 'https://quote-api.jup.ag/v6';
const JUPITER_PRICE_API_URL = 'https://api.jup.ag/price/v2';

// Common token addresses
export const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  CLAWD: process.env.TOKEN_ADDRESS || process.env.CLAWD_TOKEN_ADDRESS || '8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump',
};

export interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number; // in smallest unit (lamports for SOL)
  slippageBps?: number; // basis points, default 50 (0.5%)
  onlyDirectRoutes?: boolean;
}

export interface QuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot: number;
  timeTaken: number;
}

export interface SwapTransactionParams {
  quoteResponse: QuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: number | 'auto';
}

export interface SwapTransactionResponse {
  swapTransaction: string; // base64 encoded transaction
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}

export interface TokenPrice {
  id: string;
  type: string;
  price: string;
  extraInfo?: {
    lastSwappedPrice?: {
      lastJupiterSellAt: number;
      lastJupiterSellPrice: string;
      lastJupiterBuyAt: number;
      lastJupiterBuyPrice: string;
    };
    quotedPrice?: {
      buyPrice: string;
      buyAt: number;
      sellPrice: string;
      sellAt: number;
    };
    confidenceLevel: string;
    depth?: {
      buyPriceImpactRatio: { [key: string]: number };
      sellPriceImpactRatio: { [key: string]: number };
    };
  };
}

/**
 * Get real-time token price from Jupiter
 */
export async function getTokenPrice(mintAddress: string): Promise<TokenPrice | null> {
  try {
    const response = await fetch(
      `${JUPITER_PRICE_API_URL}?ids=${mintAddress}&showExtraInfo=true`
    );

    if (!response.ok) {
      console.error('[Jupiter] Price API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.data?.[mintAddress] || null;
  } catch (error: any) {
    console.error('[Jupiter] Price fetch failed:', error.message);
    return null;
  }
}

/**
 * Get swap quote from Jupiter
 */
export async function getQuote(params: QuoteParams): Promise<QuoteResponse | null> {
  try {
    const searchParams = new URLSearchParams({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: params.amount.toString(),
      slippageBps: (params.slippageBps || 50).toString(),
    });

    if (params.onlyDirectRoutes) {
      searchParams.set('onlyDirectRoutes', 'true');
    }

    const response = await fetch(`${JUPITER_API_URL}/quote?${searchParams}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Jupiter] Quote error:', errorData);
      return null;
    }

    const quote = await response.json();
    return quote;
  } catch (error: any) {
    console.error('[Jupiter] Quote fetch failed:', error.message);
    return null;
  }
}

/**
 * Build swap transaction from quote
 * Returns base64 encoded transaction for client-side signing
 */
export async function buildSwapTransaction(
  params: SwapTransactionParams
): Promise<SwapTransactionResponse | null> {
  try {
    const response = await fetch(`${JUPITER_API_URL}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse: params.quoteResponse,
        userPublicKey: params.userPublicKey,
        wrapAndUnwrapSol: params.wrapAndUnwrapSol ?? true,
        dynamicComputeUnitLimit: params.dynamicComputeUnitLimit ?? true,
        prioritizationFeeLamports: params.prioritizationFeeLamports ?? 'auto',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Jupiter] Swap transaction error:', errorData);
      return null;
    }

    const swapData = await response.json();
    return swapData;
  } catch (error: any) {
    console.error('[Jupiter] Swap transaction build failed:', error.message);
    return null;
  }
}

/**
 * Parse trade intent from natural language
 * Returns structured trade parameters
 */
export interface TradeIntent {
  action: 'buy' | 'sell' | 'swap';
  inputToken: string;
  outputToken: string;
  amount: number;
  amountType: 'input' | 'output'; // whether amount refers to input or output
  slippageBps?: number;
}

export function parseTradeIntent(message: string): TradeIntent | null {
  const lowerMessage = message.toLowerCase();
  
  // Common patterns
  const buyPattern = /buy\s+(\d+(?:\.\d+)?)\s*(?:sol|usdc)?\s*(?:worth\s+(?:of\s+)?)?(\$?clawd|\$?kit|sol|usdc)/i;
  const sellPattern = /sell\s+(\d+(?:\.\d+)?)\s*(\$?clawd|\$?kit|sol|usdc)/i;
  const swapPattern = /swap\s+(\d+(?:\.\d+)?)\s*(sol|usdc|clawd|kit)\s+(?:for|to)\s*(sol|usdc|clawd|kit)/i;

  // Try buy pattern
  const buyMatch = message.match(buyPattern);
  if (buyMatch) {
    const amount = parseFloat(buyMatch[1]);
    const outputToken = buyMatch[2].toUpperCase().replace('$', '');
    
    return {
      action: 'buy',
      inputToken: 'SOL',
      outputToken: outputToken === 'CLAWD' ? TOKENS.CLAWD : TOKENS[outputToken as keyof typeof TOKENS] || outputToken,
      amount,
      amountType: 'input',
    };
  }

  // Try sell pattern
  const sellMatch = message.match(sellPattern);
  if (sellMatch) {
    const amount = parseFloat(sellMatch[1]);
    const inputToken = sellMatch[2].toUpperCase().replace('$', '');
    
    return {
      action: 'sell',
      inputToken: inputToken === 'CLAWD' ? TOKENS.CLAWD : TOKENS[inputToken as keyof typeof TOKENS] || inputToken,
      outputToken: 'SOL',
      amount,
      amountType: 'input',
    };
  }

  // Try swap pattern
  const swapMatch = message.match(swapPattern);
  if (swapMatch) {
    const amount = parseFloat(swapMatch[1]);
    let inputToken = swapMatch[2].toUpperCase();
    let outputToken = swapMatch[3].toUpperCase();
    
    inputToken = inputToken === 'CLAWD' ? TOKENS.CLAWD : TOKENS[inputToken as keyof typeof TOKENS] || inputToken;
    outputToken = outputToken === 'CLAWD' ? TOKENS.CLAWD : TOKENS[outputToken as keyof typeof TOKENS] || outputToken;
    
    return {
      action: 'swap',
      inputToken,
      outputToken,
      amount,
      amountType: 'input',
    };
  }

  return null;
}

/**
 * Format quote for display
 */
export function formatQuoteForDisplay(quote: QuoteResponse, inputSymbol: string, outputSymbol: string): string {
  const inAmount = parseFloat(quote.inAmount) / 1e9; // Assuming SOL decimals
  const outAmount = parseFloat(quote.outAmount) / 1e9;
  const priceImpact = parseFloat(quote.priceImpactPct);
  
  const routes = quote.routePlan.map(r => r.swapInfo.label).join(' → ');
  
  return `
**Swap Quote:**
- Input: ${inAmount.toFixed(6)} ${inputSymbol}
- Output: ${outAmount.toFixed(6)} ${outputSymbol}
- Price Impact: ${priceImpact.toFixed(4)}%
- Slippage: ${quote.slippageBps / 100}%
- Route: ${routes}

Ready to execute? Reply "confirm" to proceed or "cancel" to abort.
  `.trim();
}

/**
 * Get $CLAWD token price
 */
export async function getClawdPrice(): Promise<{ price: number; priceChange24h?: number } | null> {
  const price = await getTokenPrice(TOKENS.CLAWD);
  if (!price) return null;
  
  return {
    price: parseFloat(price.price),
    priceChange24h: undefined, // Jupiter doesn't provide 24h change
  };
}

/**
 * Calculate amount in lamports/smallest unit
 */
export function toSmallestUnit(amount: number, decimals: number = 9): number {
  return Math.floor(amount * Math.pow(10, decimals));
}

/**
 * Convert from smallest unit to human readable
 */
export function fromSmallestUnit(amount: string | number, decimals: number = 9): number {
  return parseFloat(amount.toString()) / Math.pow(10, decimals);
}
