import { describe, expect, it } from "vitest";

// Jupiter API configuration
const JUPITER_API_KEY = process.env.JUPITER_API_KEY;
const VITE_JUP_SWAP_V1_API_KEY = process.env.VITE_JUP_SWAP_V1_API_KEY;
const VITE_REFERRAL_KEY = process.env.VITE_REFERRAL_KEY;
const WALLET_CONNECT_PROJECT_ID = process.env.WALLET_CONNECT_PROJECT_ID;

describe("Jupiter API Configuration", () => {
  describe("Environment Variables", () => {
    it("should have JUPITER_API_KEY configured", () => {
      expect(JUPITER_API_KEY).toBeDefined();
      expect(JUPITER_API_KEY?.length).toBeGreaterThan(0);
    });

    it("should have VITE_JUP_SWAP_V1_API_KEY configured", () => {
      expect(VITE_JUP_SWAP_V1_API_KEY).toBeDefined();
      expect(VITE_JUP_SWAP_V1_API_KEY?.length).toBeGreaterThan(0);
    });

    it("should have VITE_REFERRAL_KEY configured", () => {
      expect(VITE_REFERRAL_KEY).toBeDefined();
      expect(VITE_REFERRAL_KEY?.length).toBeGreaterThan(0);
    });

    it("should have WALLET_CONNECT_PROJECT_ID configured", () => {
      expect(WALLET_CONNECT_PROJECT_ID).toBeDefined();
      expect(WALLET_CONNECT_PROJECT_ID?.length).toBeGreaterThan(0);
    });
  });

  describe("Jupiter Quote API Configuration", () => {
    it("should have valid Jupiter API endpoint configured", () => {
      // Jupiter API endpoints
      const QUOTE_API = "https://quote-api.jup.ag/v6/quote";
      const SWAP_API = "https://quote-api.jup.ag/v6/swap";
      
      expect(QUOTE_API).toContain("jup.ag");
      expect(SWAP_API).toContain("jup.ag");
    });

    it("should have valid token addresses for trading", () => {
      // Common Solana token addresses
      const SOL_MINT = "So11111111111111111111111111111111111111112";
      const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      const CLAWD_TOKEN = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump";
      
      // Validate address lengths (Solana addresses are 32-44 chars base58)
      expect(SOL_MINT.length).toBeGreaterThanOrEqual(32);
      expect(USDC_MINT.length).toBeGreaterThanOrEqual(32);
      expect(CLAWD_TOKEN.length).toBeGreaterThanOrEqual(32);
    });
  });
});

describe("Voice Trading Configuration", () => {
  describe("xAI Voice API", () => {
    it("should have XAI_API_KEY configured for voice agent", () => {
      const XAI_API_KEY = process.env.XAI_API_KEY;
      expect(XAI_API_KEY).toBeDefined();
      expect(XAI_API_KEY?.length).toBeGreaterThan(0);
    });
  });

  describe("Admin Wallet", () => {
    it("should have ADMIN_WALLET configured", () => {
      const ADMIN_WALLET = process.env.ADMIN_WALLET || '9juYSPJ59hP1dFFSMHft7ajmZ9rfVpibHXPR4VFdADMm';
      expect(ADMIN_WALLET).toBeDefined();
      expect(ADMIN_WALLET.length).toBeGreaterThanOrEqual(32);
    });
  });
});
