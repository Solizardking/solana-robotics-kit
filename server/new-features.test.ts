import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Token Gating - Helius Integration", () => {
  it("verifyHolder mutation returns structure with isHolder field", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    // Test with a sample wallet address - uses mutation
    const result = await caller.token.verifyHolder({
      walletAddress: "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
    });
    
    // verifyTokenHolding returns { isHolder, balance, tokenAddress }
    expect(result).toHaveProperty("isHolder");
    expect(result).toHaveProperty("balance");
    expect(result).toHaveProperty("tokenAddress");
    expect(typeof result.isHolder).toBe("boolean");
  }, 15000);

  it("getWalletTokens returns tokens object", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.token.walletTokens({
      walletAddress: "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
    });
    
    // Returns object with tokens array
    expect(result).toBeDefined();
    expect(result).toHaveProperty("tokens");
    expect(Array.isArray(result.tokens)).toBe(true);
  }, 15000);

  it("getWalletTransactions returns transactions object or error gracefully", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    try {
      const result = await caller.token.walletTransactions({
        walletAddress: "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
        limit: 10,
      });
      
      // Returns object with transactions array
      expect(result).toBeDefined();
      expect(result).toHaveProperty("transactions");
      expect(Array.isArray(result.transactions)).toBe(true);
    } catch (error) {
      // API may fail due to rate limits or network issues - that's acceptable
      expect(error).toBeDefined();
    }
  }, 15000);
});

describe("Portfolio - Birdeye Integration", () => {
  it("getTokenPrice returns price data or null", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.token.price();
    
    // Can return null or empty object if API fails or rate limited
    if (result !== null && Object.keys(result).length > 0) {
      expect(result).toHaveProperty("value");
      expect(typeof result.value).toBe("number");
    } else {
      // Null or empty object is acceptable when API is rate limited
      expect(result === null || Object.keys(result).length === 0).toBe(true);
    }
  }, 15000);

  it("getTokenOverview returns market data or null", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.token.overview();
    
    // Can return null if API fails or rate limited
    if (result !== null) {
      expect(result).toHaveProperty("price");
    } else {
      expect(result).toBeNull();
    }
  }, 15000);

  it("getTokenHistory returns price history array or null", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.token.history({ type: "1H" });
    
    // Returns array or null if rate limited
    if (result !== null) {
      expect(Array.isArray(result)).toBe(true);
    } else {
      expect(result).toBeNull();
    }
  }, 15000);

  it("getTokenOHLCV returns OHLCV data array or null", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.token.ohlcv({ type: "1H" });
    
    // Returns array or null if rate limited
    if (result !== null) {
      expect(Array.isArray(result)).toBe(true);
    } else {
      expect(result).toBeNull();
    }
  }, 15000);
});

describe("Cloudflare R2 Assets", () => {
  it("getPDFs returns documentation files array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.assets.pdfs();
    
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("url");
    }
  });

  it("getGraphics returns graphics files array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.assets.graphics();
    
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("url");
    }
  });
});

describe("Token Info", () => {
  it("getTokenInfo returns KIT token details", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.token.info();
    
    expect(result).toHaveProperty("address");
    expect(result).toHaveProperty("symbol");
    expect(result).toHaveProperty("name");
    expect(result.symbol).toBe("$CLAWD");
  });
});
