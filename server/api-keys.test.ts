import { describe, expect, it } from "vitest";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;

describe("API Keys Validation", () => {
  describe("HELIUS_API_KEY", () => {
    it("should be configured", () => {
      expect(HELIUS_API_KEY).toBeDefined();
      expect(HELIUS_API_KEY).not.toBe("");
    });

    it("should be able to make a test request to Helius API", async () => {
      if (!HELIUS_API_KEY) {
        console.log("HELIUS_API_KEY not configured, skipping live test");
        return;
      }

      // Test the Helius RPC endpoint with a simple getHealth call
      const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getHealth",
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.result).toBe("ok");
    }, 10000);
  });

  describe("BIRDEYE_API_KEY", () => {
    it("should be configured", () => {
      expect(BIRDEYE_API_KEY).toBeDefined();
      expect(BIRDEYE_API_KEY).not.toBe("");
    });

    it("should be able to make a test request to Birdeye API", async () => {
      if (!BIRDEYE_API_KEY) {
        console.log("BIRDEYE_API_KEY not configured, skipping live test");
        return;
      }

      // Test the Birdeye API with a simple token price request for SOL
      const response = await fetch(
        "https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112",
        {
          headers: {
            "X-API-KEY": BIRDEYE_API_KEY,
            "x-chain": "solana",
          },
        }
      );

      const data = await response.json();
      
      // Handle rate limiting gracefully
      if (response.status === 429 || data.message === 'Too many requests') {
        console.log("Birdeye API rate limited, skipping validation");
        expect(true).toBe(true); // Pass the test when rate limited
        return;
      }

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.value).toBeGreaterThan(0);
    }, 10000);
  });
});
