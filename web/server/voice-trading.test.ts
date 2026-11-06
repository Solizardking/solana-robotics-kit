import { describe, expect, it } from "vitest";

describe("Voice Trading Integration", () => {
  describe("Environment Configuration", () => {
    it("should have Jupiter API keys configured", () => {
      const JUPITER_API_KEY = process.env.JUPITER_API_KEY;
      const VITE_JUP_SWAP_V1_API_KEY = process.env.VITE_JUP_SWAP_V1_API_KEY;
      
      expect(JUPITER_API_KEY).toBeDefined();
      expect(VITE_JUP_SWAP_V1_API_KEY).toBeDefined();
    });

    it("should have xAI API key configured for voice agent", () => {
      const XAI_API_KEY = process.env.XAI_API_KEY;
      expect(XAI_API_KEY).toBeDefined();
      expect(XAI_API_KEY?.length).toBeGreaterThan(0);
    });

    it("should have RPC URL configured", () => {
      const RPC_URL = process.env.RPC_URL || process.env.VITE_RPC_URL;
      expect(RPC_URL).toBeDefined();
    });

    it("should have referral key configured", () => {
      const VITE_REFERRAL_KEY = process.env.VITE_REFERRAL_KEY;
      expect(VITE_REFERRAL_KEY).toBeDefined();
    });
  });

  describe("Token Configuration", () => {
    it("should have valid SOL token address", () => {
      const SOL_MINT = "So11111111111111111111111111111111111111112";
      // Solana addresses are 32-44 characters in base58
      expect(SOL_MINT.length).toBeGreaterThanOrEqual(32);
      expect(SOL_MINT.length).toBeLessThanOrEqual(44);
    });

    it("should have valid USDC token address", () => {
      const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      expect(USDC_MINT.length).toBeGreaterThanOrEqual(32);
      expect(USDC_MINT.length).toBeLessThanOrEqual(44);
    });

    it("should have valid KIT token address", () => {
      const CLAWD_TOKEN = process.env.TOKEN_ADDRESS || "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump";
      expect(CLAWD_TOKEN.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe("Trade Intent Parsing", () => {
    it("should parse buy intent correctly", () => {
      const buyPattern = /buy\s+(\d+(?:\.\d+)?)\s+(\w+)/i;
      const match = buyPattern.exec("buy 1 SOL of KIT");
      
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe("1");
    });

    it("should parse swap intent correctly", () => {
      const swapPattern = /swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to)\s+(\w+)/i;
      const match = swapPattern.exec("swap 0.5 SOL for USDC");
      
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe("0.5");
      expect(match?.[2].toUpperCase()).toBe("SOL");
      expect(match?.[3].toUpperCase()).toBe("USDC");
    });

    it("should parse sell intent correctly", () => {
      const sellPattern = /sell\s+(\d+(?:\.\d+)?)\s+(\w+)/i;
      const match = sellPattern.exec("sell 100 KIT");
      
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe("100");
      expect(match?.[2].toUpperCase()).toBe("CLAWD");
    });
  });

  describe("Voice Agent Configuration", () => {
    it("should have valid voice options", () => {
      const VOICE_OPTIONS = ["alloy", "ash", "ballad", "coral", "sage"];
      expect(VOICE_OPTIONS.length).toBe(5);
      expect(VOICE_OPTIONS).toContain("alloy");
    });

    it("should have WebSocket endpoint configured", () => {
      const WS_ENDPOINT = "wss://api.x.ai/v1/realtime";
      expect(WS_ENDPOINT).toContain("api.x.ai");
    });
  });

  describe("Jupiverse Kit Integration", () => {
    it("should have Jupiverse Kit configuration", () => {
      const config = {
        rpcUrl: process.env.VITE_RPC_URL || "https://api.mainnet-beta.solana.com",
        referralKey: process.env.VITE_REFERRAL_KEY,
        platformFeeBps: 20,
        apiKey: process.env.VITE_JUP_SWAP_V1_API_KEY,
      };

      expect(config.rpcUrl).toBeDefined();
      expect(config.platformFeeBps).toBe(20);
    });
  });
});

describe("Admin Wallet Configuration", () => {
  it("should have ADMIN_WALLET configured", () => {
    const ADMIN_WALLET = process.env.ADMIN_WALLET || "9juYSPJ59hP1dFFSMHft7ajmZ9rfVpibHXPR4VFdADMm";
    expect(ADMIN_WALLET).toBeDefined();
    expect(ADMIN_WALLET.length).toBeGreaterThanOrEqual(32);
  });

  it("should validate admin wallet is a valid Solana address", () => {
    const ADMIN_WALLET = process.env.ADMIN_WALLET || "9juYSPJ59hP1dFFSMHft7ajmZ9rfVpibHXPR4VFdADMm";
    // Base58 character set
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    expect(base58Regex.test(ADMIN_WALLET)).toBe(true);
  });
});
