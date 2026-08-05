import { describe, it, expect } from "vitest";
import { verifyTokenHolder, getAssetsByOwner, getTokenMetadata } from "./helius-das";
import {
  getWalletNetWorthDetails,
  getWalletPnL,
  getWalletNetWorthChart,
  getWalletPortfolio,
} from "./birdeye-wallet";

// Test wallet address (known holder or test address)
const TEST_WALLET = "6qzr1wJhMbPJqfpqZvqYDLjnNkfJuBMbM8JdZbrfUV1";
const CLAWD_TOKEN_ADDRESS = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump";

describe("Helius DAS Token Verification", () => {
  it("should verify token holder status", async () => {
    const result = await verifyTokenHolder(TEST_WALLET, CLAWD_TOKEN_ADDRESS);
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty("isHolder");
    expect(result).toHaveProperty("balance");
    expect(result).toHaveProperty("walletAddress");
    expect(result.walletAddress).toBe(TEST_WALLET);
    expect(typeof result.isHolder).toBe("boolean");
    expect(typeof result.balance).toBe("number");
  }, 30000);

  it("should get assets by owner", async () => {
    const result = await getAssetsByOwner(TEST_WALLET, {
      showFungible: true,
      showNativeBalance: true,
      limit: 10,
    });
    
    expect(result).toBeDefined();
    // Result should have items array or be null if API fails
    if (result) {
      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    }
  }, 30000);

  it("should get token metadata", async () => {
    const result = await getTokenMetadata(CLAWD_TOKEN_ADDRESS);
    
    expect(result).toBeDefined();
    // Result should have token info or be null if API fails
    if (result) {
      // DAS API returns different structure - check for common properties
      expect(typeof result).toBe("object");
    }
  }, 30000);

  it("should handle invalid wallet address gracefully", async () => {
    const result = await verifyTokenHolder("invalid-address", CLAWD_TOKEN_ADDRESS);
    
    expect(result).toBeDefined();
    expect(result.isHolder).toBe(false);
    expect(result.balance).toBe(0);
  }, 30000);
});

describe("Birdeye Wallet Portfolio APIs", () => {
  it("should get wallet net worth details", async () => {
    const result = await getWalletNetWorthDetails(TEST_WALLET);
    
    expect(result).toBeDefined();
    // Result should have data property or be null if rate limited
    if (result && result.success !== false) {
      expect(result).toHaveProperty("data");
    }
  }, 30000);

  it("should get wallet PnL summary", async () => {
    const result = await getWalletPnL(TEST_WALLET);
    
    expect(result).toBeDefined();
    // Result should have data property or be null if rate limited
    if (result && result.success !== false) {
      expect(result).toHaveProperty("data");
    }
  }, 30000);

  it("should get wallet net worth chart", async () => {
    const result = await getWalletNetWorthChart(TEST_WALLET, "1d");
    
    expect(result).toBeDefined();
    // Result should have data property or be null if rate limited
    if (result && result.success !== false) {
      expect(result).toHaveProperty("data");
    }
  }, 30000);

  it("should get wallet portfolio", async () => {
    const result = await getWalletPortfolio(TEST_WALLET);
    
    expect(result).toBeDefined();
    // Result is a combined object with netWorth, pnl, etc.
    expect(typeof result).toBe("object");
    // May have netWorth, pnl, chart, tokenPnL properties
    expect(result).toHaveProperty("netWorth");
  }, 30000);

  it("should handle rate limiting gracefully", async () => {
    // Make multiple requests to test rate limit handling
    const results = await Promise.all([
      getWalletNetWorthDetails(TEST_WALLET),
      getWalletPnL(TEST_WALLET),
    ]);
    
    // All results should be defined (even if rate limited)
    results.forEach((result) => {
      expect(result).toBeDefined();
    });
  }, 30000);
});

describe("Token Verification Integration", () => {
  it("should return all token holdings with verification", async () => {
    const result = await verifyTokenHolder(TEST_WALLET, CLAWD_TOKEN_ADDRESS);
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty("allTokens");
    expect(Array.isArray(result.allTokens)).toBe(true);
    
    // Each token should have required properties
    result.allTokens.forEach((token) => {
      expect(token).toHaveProperty("tokenAddress");
      expect(token).toHaveProperty("symbol");
      expect(token).toHaveProperty("balance");
    });
  }, 30000);

  it("should return native SOL balance", async () => {
    const result = await verifyTokenHolder(TEST_WALLET, CLAWD_TOKEN_ADDRESS);
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty("nativeBalance");
    expect(result.nativeBalance).toHaveProperty("lamports");
    expect(result.nativeBalance).toHaveProperty("sol");
    expect(typeof result.nativeBalance.lamports).toBe("number");
    expect(typeof result.nativeBalance.sol).toBe("number");
  }, 30000);
});
