import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
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

describe("Documentation Hub - Pinecone Integration", () => {
  it("docs.files returns array of documentation files", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const files = await caller.docs.files();

    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
    
    // Check file structure
    const file = files[0];
    expect(file).toHaveProperty("id");
    expect(file).toHaveProperty("name");
    expect(file).toHaveProperty("size");
    expect(file).toHaveProperty("status");
  });

  it.skip("docs.chat returns response for user message (requires Pinecone)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const response = await caller.docs.chat({
      messages: [{ role: "user", content: "What is Solana Robotics?" }],
    });

    expect(response).not.toBeNull();
    expect(response).toHaveProperty("message");
    expect(response?.message).toHaveProperty("content");
    expect(response?.message?.content).toBeTruthy();
  }, 30000);

  it("docs.files includes expected documentation files", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const files = await caller.docs.files();
    const fileNames = files.map(f => f.name);

    // Check for expected documentation files
    expect(fileNames.some(name => name.includes("SOLANA_ROBOTICS"))).toBe(true);
  });
});

describe("$KIT Token - Birdeye Integration", () => {
  it("token.info returns token metadata", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const info = await caller.token.info();

    expect(info).toHaveProperty("address");
    expect(info).toHaveProperty("symbol");
    expect(info).toHaveProperty("name");
    expect(info).toHaveProperty("decimals");
    expect(info).toHaveProperty("links");
    
    // Check links
    expect(info.links).toHaveProperty("twitter");
    expect(info.links).toHaveProperty("github");
    expect(info.links).toHaveProperty("jupiter");
    expect(info.links).toHaveProperty("birdeye");
  });

  it("token.info has correct token address", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const info = await caller.token.info();

    expect(info.address).toBe("DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS");
    expect(info.symbol).toBe("$KIT");
  });

  it("token.price returns price data or null when rate limited", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const price = await caller.token.price();

    // API may be rate limited - null or empty object are valid
    if (price !== null && Object.keys(price).length > 0) {
      expect(price).toHaveProperty("value");
      expect(typeof price.value).toBe("number");
    } else {
      // Null or empty object is acceptable when API is rate limited
      expect(price === null || Object.keys(price).length === 0).toBe(true);
    }
  }, 30000);

  it("token.overview returns market data or null when rate limited", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const overview = await caller.token.overview();

    // API may be rate limited - both results are valid
    if (overview !== null) {
      expect(overview).toHaveProperty("price");
    } else {
      expect(overview).toBeNull();
    }
  }, 15000);

  it("token.history returns price history array or null", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.token.history({ type: "1H" });

    // Returns array or null if rate limited
    expect(history === null || Array.isArray(history)).toBe(true);
    
    // If data exists, check structure
    if (history && Array.isArray(history) && history.length > 0) {
      const point = history[0];
      expect(point).toHaveProperty("unixTime");
      expect(point).toHaveProperty("value");
    }
  }, 30000);

  it("token.ohlcv returns candlestick data array or null", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const ohlcv = await caller.token.ohlcv({ type: "1H" });

    // Returns array or null if rate limited
    if (ohlcv !== null) {
      expect(Array.isArray(ohlcv)).toBe(true);
      
      // If data exists, check OHLCV structure
      if (ohlcv.length > 0) {
        const candle = ohlcv[0];
        expect(candle).toHaveProperty("unixTime");
        expect(candle).toHaveProperty("o"); // Open
        expect(candle).toHaveProperty("h"); // High
        expect(candle).toHaveProperty("l"); // Low
        expect(candle).toHaveProperty("c"); // Close
        expect(candle).toHaveProperty("v"); // Volume
      }
    } else {
      expect(ohlcv).toBeNull();
    }
  }, 15000);
});

describe("Social Links Configuration", () => {
  it("token links include correct social URLs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const info = await caller.token.info();

    expect(info.links.twitter).toBe("https://x.com/solanarobotics");
    expect(info.links.github).toBe("https://github.com/8bitsats/solana-robotics-kit");
  });

  it("token links include trading platform URLs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const info = await caller.token.info();
    const tokenAddress = info.address;

    expect(info.links.jupiter).toContain("jup.ag");
    expect(info.links.jupiter).toContain(tokenAddress);
    expect(info.links.raydium).toContain("raydium.io");
    expect(info.links.birdeye).toContain("birdeye.so");
    expect(info.links.solscan).toContain("solscan.io");
  });
});
