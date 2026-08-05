import { describe, expect, it } from "vitest";
import {
  isAdminWallet,
  getAdminWallet,
  getGateTokenAddress,
  validateAdminWalletConfig,
  validateTokenConfig,
  checkTokenGate,
  getAccessLevel,
} from "./token-gate";

describe("Token Gate System", () => {
  describe("Admin Wallet Configuration", () => {
    it("should have ADMIN_WALLET configured", () => {
      const config = validateAdminWalletConfig();
      expect(config.valid).toBe(true);
      expect(config.wallet).toBe("9juYSPJ59hP1dFFSMHft7ajmZ9rfVpibHXPR4VFdADMm");
    });

    it("should return correct admin wallet address", () => {
      const adminWallet = getAdminWallet();
      expect(adminWallet).toBe("9juYSPJ59hP1dFFSMHft7ajmZ9rfVpibHXPR4VFdADMm");
    });

    it("should correctly identify admin wallet", () => {
      expect(isAdminWallet("9juYSPJ59hP1dFFSMHft7ajmZ9rfVpibHXPR4VFdADMm")).toBe(true);
      expect(isAdminWallet("SomeOtherWalletAddress123456789012345678901234")).toBe(false);
    });
  });

  describe("Token Configuration", () => {
    it("should have TOKEN_ADDRESS configured", () => {
      const config = validateTokenConfig();
      expect(config.valid).toBe(true);
      expect(config.token).toBe("DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS");
    });

    it("should return correct gate token address", () => {
      const tokenAddress = getGateTokenAddress();
      expect(tokenAddress).toBe("DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS");
    });
  });

  describe("Token Gate Access Check", () => {
    it("should grant admin access to admin wallet", async () => {
      const result = await checkTokenGate("9juYSPJ59hP1dFFSMHft7ajmZ9rfVpibHXPR4VFdADMm");
      
      expect(result.hasAccess).toBe(true);
      expect(result.isAdmin).toBe(true);
      expect(result.reason).toContain("Admin wallet");
    });

    it("should return correct access level for admin", async () => {
      const level = await getAccessLevel("9juYSPJ59hP1dFFSMHft7ajmZ9rfVpibHXPR4VFdADMm");
      expect(level).toBe("admin");
    });

    it("should check token holdings for non-admin wallets", async () => {
      // Using a random wallet that likely doesn't hold $KIT
      const result = await checkTokenGate("11111111111111111111111111111111");
      
      // Should not have admin access
      expect(result.isAdmin).toBe(false);
      // Access depends on token holdings
      expect(typeof result.hasAccess).toBe("boolean");
      expect(typeof result.tokenBalance).toBe("number");
    }, 15000); // Increase timeout for network call
  });

  describe("Address Validation", () => {
    it("should validate Solana address format", () => {
      const adminConfig = validateAdminWalletConfig();
      const tokenConfig = validateTokenConfig();
      
      // Both should be valid Solana addresses
      expect(adminConfig.valid).toBe(true);
      expect(tokenConfig.valid).toBe(true);
      expect(adminConfig.error).toBeUndefined();
      expect(tokenConfig.error).toBeUndefined();
    });
  });
});
