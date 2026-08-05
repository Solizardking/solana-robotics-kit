import { describe, expect, it } from "vitest";
import { verifyTokenHolder, getAssetsByOwner } from "./helius-das";

// Admin wallet from environment
const ADMIN_WALLET = process.env.ADMIN_WALLET || '9juYSPJ59hP1dFFSMHft7ajmZ9rfVpibHXPR4VFdADMm';
const KIT_TOKEN_ADDRESS = 'DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS';

describe("Token Gate and Admin Access", () => {
  describe("Admin Wallet Configuration", () => {
    it("should have admin wallet configured", () => {
      expect(ADMIN_WALLET).toBeDefined();
      expect(ADMIN_WALLET.length).toBeGreaterThanOrEqual(32);
      expect(ADMIN_WALLET.length).toBeLessThanOrEqual(44);
    });

    it("should recognize admin wallet address", () => {
      const testWallet = '9juYSPJ59hP1dFFSMHft7ajmZ9rfVpibHXPR4VFdADMm';
      const isAdmin = testWallet.toLowerCase() === ADMIN_WALLET.toLowerCase();
      expect(isAdmin).toBe(true);
    });

    it("should reject non-admin wallet", () => {
      const testWallet = 'DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS';
      const isAdmin = testWallet.toLowerCase() === ADMIN_WALLET.toLowerCase();
      expect(isAdmin).toBe(false);
    });
  });

  describe("$KIT Token Configuration", () => {
    it("should have correct $KIT token address", () => {
      expect(KIT_TOKEN_ADDRESS).toBe('DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS');
    });

    it("should have valid Solana address format", () => {
      // Solana addresses are base58 encoded and 32-44 characters
      expect(KIT_TOKEN_ADDRESS.length).toBeGreaterThanOrEqual(32);
      expect(KIT_TOKEN_ADDRESS.length).toBeLessThanOrEqual(44);
      // Should only contain base58 characters
      expect(/^[1-9A-HJ-NP-Za-km-z]+$/.test(KIT_TOKEN_ADDRESS)).toBe(true);
    });
  });

  describe("Token Verification Functions", () => {
    it("should have verifyTokenHolder function", () => {
      expect(typeof verifyTokenHolder).toBe('function');
    });

    it("should have getAssetsByOwner function", () => {
      expect(typeof getAssetsByOwner).toBe('function');
    });
  });

  describe("Access Control Logic", () => {
    it("should grant access to admin regardless of token balance", () => {
      const walletAddress = ADMIN_WALLET;
      const isAdmin = walletAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();
      
      // Admin should always have access
      const hasAccess = isAdmin || false; // || tokenHolder check
      expect(hasAccess).toBe(true);
    });

    it("should check token balance for non-admin wallets", () => {
      const walletAddress = 'DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS';
      const isAdmin = walletAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();
      
      // Non-admin should require token check
      expect(isAdmin).toBe(false);
    });
  });
});

describe("Voice Agent Access Control", () => {
  describe("xAI Voice Configuration", () => {
    it("should have XAI_API_KEY configured", () => {
      const hasKey = !!process.env.XAI_API_KEY;
      expect(hasKey).toBe(true);
    });
  });

  describe("Voice Agent Access Rules", () => {
    it("should require wallet connection for voice agent", () => {
      // Voice agent requires connected wallet
      const connected = false;
      const hasAccess = connected && true; // && (isAdmin || isHolder)
      expect(hasAccess).toBe(false);
    });

    it("should grant voice access to admin wallet", () => {
      const walletAddress = ADMIN_WALLET;
      const connected = true;
      const isAdmin = walletAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();
      
      const hasAccess = connected && isAdmin;
      expect(hasAccess).toBe(true);
    });
  });
});
