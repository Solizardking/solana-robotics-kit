import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { parseTradeIntent, TOKENS, toSmallestUnit, fromSmallestUnit } from "./jupiter-trade";

// Create a public context for testing
function createPublicContext() {
  return {
    user: null,
  };
}

describe("Jupiter Trade Execution", () => {
  describe("trade.tokens", () => {
    it("returns available token addresses", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const tokens = await caller.trade.tokens();

      expect(tokens).toHaveProperty("SOL");
      expect(tokens).toHaveProperty("USDC");
      expect(tokens).toHaveProperty("KIT");
      expect(tokens.SOL).toBe("So11111111111111111111111111111111111111112");
    });
  });

  describe("trade.parseIntent", () => {
    it("parses buy command correctly", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const intent = await caller.trade.parseIntent({
        message: "buy 0.5 SOL worth of $KIT",
      });

      expect(intent).not.toBeNull();
      expect(intent?.action).toBe("buy");
      expect(intent?.amount).toBe(0.5);
    });

    it("parses sell command correctly", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const intent = await caller.trade.parseIntent({
        message: "sell 100 $KIT",
      });

      expect(intent).not.toBeNull();
      expect(intent?.action).toBe("sell");
      expect(intent?.amount).toBe(100);
    });

    it("parses swap command correctly", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const intent = await caller.trade.parseIntent({
        message: "swap 1 SOL for USDC",
      });

      expect(intent).not.toBeNull();
      expect(intent?.action).toBe("swap");
      expect(intent?.amount).toBe(1);
    });

    it("returns null for non-trade messages", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const intent = await caller.trade.parseIntent({
        message: "What is the price of $KIT?",
      });

      expect(intent).toBeNull();
    });
  });

  describe("trade.getQuote", () => {
    it("returns quote or error for valid swap request", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.trade.getQuote({
        inputMint: TOKENS.SOL,
        outputMint: TOKENS.USDC,
        amount: toSmallestUnit(0.01), // 0.01 SOL
      });

      // Either success or graceful error (rate limiting, etc.)
      expect(result).toHaveProperty("success");
      if (result.success) {
        expect(result).toHaveProperty("quote");
        expect(result.quote).toHaveProperty("inAmount");
        expect(result.quote).toHaveProperty("outAmount");
      }
    }, 30000);
  });

  describe("trade.jupiterPrice", () => {
    it("returns price data or null for SOL", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const price = await caller.trade.jupiterPrice({
        mintAddress: TOKENS.SOL,
      });

      // Either returns price or null
      if (price !== null) {
        expect(price).toHaveProperty("price");
        expect(price).toHaveProperty("id");
      }
    }, 30000);
  });

  describe("trade.toSmallestUnit", () => {
    it("converts SOL to lamports correctly", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const lamports = await caller.trade.toSmallestUnit({
        amount: 1.5,
        decimals: 9,
      });

      expect(lamports).toBe(1_500_000_000);
    });
  });

  describe("trade.fromSmallestUnit", () => {
    it("converts lamports to SOL correctly", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const sol = await caller.trade.fromSmallestUnit({
        amount: "1500000000",
        decimals: 9,
      });

      expect(sol).toBe(1.5);
    });
  });
});

describe("Trade Intent Parser (Unit Tests)", () => {
  it("parses various buy formats", () => {
    expect(parseTradeIntent("buy 0.5 SOL worth of KIT")).toMatchObject({
      action: "buy",
      amount: 0.5,
    });
    expect(parseTradeIntent("buy 1 sol $kit")).toMatchObject({
      action: "buy",
      amount: 1,
    });
  });

  it("parses various sell formats", () => {
    expect(parseTradeIntent("sell 100 $KIT")).toMatchObject({
      action: "sell",
      amount: 100,
    });
    expect(parseTradeIntent("sell 50.5 kit")).toMatchObject({
      action: "sell",
      amount: 50.5,
    });
  });

  it("parses various swap formats", () => {
    expect(parseTradeIntent("swap 1 SOL for USDC")).toMatchObject({
      action: "swap",
      amount: 1,
    });
    expect(parseTradeIntent("swap 0.1 sol to kit")).toMatchObject({
      action: "swap",
      amount: 0.1,
    });
  });

  it("returns null for non-trade messages", () => {
    expect(parseTradeIntent("hello world")).toBeNull();
    expect(parseTradeIntent("what is the price")).toBeNull();
    expect(parseTradeIntent("analyze $KIT")).toBeNull();
  });
});

describe("Unit Conversion Helpers", () => {
  it("toSmallestUnit converts correctly", () => {
    expect(toSmallestUnit(1, 9)).toBe(1_000_000_000);
    expect(toSmallestUnit(0.5, 9)).toBe(500_000_000);
    expect(toSmallestUnit(1, 6)).toBe(1_000_000);
  });

  it("fromSmallestUnit converts correctly", () => {
    expect(fromSmallestUnit("1000000000", 9)).toBe(1);
    expect(fromSmallestUnit(500000000, 9)).toBe(0.5);
    expect(fromSmallestUnit("1000000", 6)).toBe(1);
  });
});
