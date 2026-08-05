import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the @solana/web3.js module
vi.mock('@solana/web3.js', () => ({
  Connection: vi.fn().mockImplementation(() => ({
    getParsedTokenAccountsByOwner: vi.fn().mockResolvedValue({
      value: [
        {
          pubkey: { toBase58: () => 'TokenAccount1111111111111111111111111111111' },
          account: {
            data: {
              parsed: {
                info: {
                  mint: 'TokenMint11111111111111111111111111111111111',
                  owner: 'WalletOwner1111111111111111111111111111111',
                  tokenAmount: {
                    amount: '0',
                    decimals: 9,
                    uiAmount: 0,
                  },
                },
              },
            },
          },
        },
      ],
    }),
    getLatestBlockhash: vi.fn().mockResolvedValue({
      blockhash: 'TestBlockhash111111111111111111111111111111',
      lastValidBlockHeight: 12345678,
    }),
    getMinimumBalanceForRentExemption: vi.fn().mockResolvedValue(2039280),
  })),
  PublicKey: vi.fn().mockImplementation((key: string) => ({
    toBase58: () => key,
    toBuffer: () => Buffer.from(key),
    toString: () => key,
  })),
  TransactionMessage: vi.fn().mockImplementation(() => ({
    compileToV0Message: vi.fn().mockReturnValue({}),
  })),
  VersionedTransaction: vi.fn().mockImplementation(() => ({
    serialize: vi.fn().mockReturnValue(Buffer.from('test')),
  })),
  ComputeBudgetProgram: {
    setComputeUnitPrice: vi.fn().mockReturnValue({}),
    setComputeUnitLimit: vi.fn().mockReturnValue({}),
  },
}));

// Mock the @solana/spl-token module
vi.mock('@solana/spl-token', () => ({
  TOKEN_PROGRAM_ID: { toBase58: () => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
  createCloseAccountInstruction: vi.fn().mockReturnValue({}),
  createBurnCheckedInstruction: vi.fn().mockReturnValue({}),
  getAssociatedTokenAddress: vi.fn().mockResolvedValue({
    toBase58: () => 'AssociatedTokenAddress11111111111111111111',
  }),
}));

// Import after mocks
import {
  isBurnServiceConfigured,
  getBurnServiceConfig,
  getTokenAccountRent,
  isValidPublicKey,
  TOKEN_ACCOUNT_RENT,
  BLACKLIST,
  MAX_ACCOUNTS_PER_TX,
} from './burn-accounts';

describe('Burn Accounts Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constants', () => {
    it('should have correct token account rent value', () => {
      expect(TOKEN_ACCOUNT_RENT).toBe(2039280);
    });

    it('should have a blacklist with important tokens', () => {
      expect(BLACKLIST).toContain('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
      expect(BLACKLIST).toContain('EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'); // WIF
      expect(Array.isArray(BLACKLIST)).toBe(true);
    });

    it('should have max accounts per transaction limit', () => {
      expect(MAX_ACCOUNTS_PER_TX).toBe(15);
      expect(typeof MAX_ACCOUNTS_PER_TX).toBe('number');
    });
  });

  describe('isBurnServiceConfigured', () => {
    it('should return true when RPC URL is available', () => {
      const result = isBurnServiceConfigured();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getBurnServiceConfig', () => {
    it('should return service configuration', () => {
      const config = getBurnServiceConfig();
      expect(config).toHaveProperty('rpcUrl');
      expect(config).toHaveProperty('maxAccountsPerTx');
      expect(config).toHaveProperty('blacklistedTokens');
      expect(config.maxAccountsPerTx).toBe(MAX_ACCOUNTS_PER_TX);
    });
  });

  describe('getTokenAccountRent', () => {
    it('should return rent information', () => {
      const rentInfo = getTokenAccountRent();
      expect(rentInfo).toHaveProperty('lamports');
      expect(rentInfo).toHaveProperty('sol');
      expect(rentInfo.lamports).toBe(TOKEN_ACCOUNT_RENT);
      expect(rentInfo.sol).toBeCloseTo(0.00203928, 5);
    });
  });

  describe('isValidPublicKey', () => {
    it('should validate correct Solana addresses', () => {
      expect(isValidPublicKey('11111111111111111111111111111111')).toBe(true);
      expect(isValidPublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidPublicKey('')).toBe(false);
      expect(isValidPublicKey('invalid')).toBe(false);
      expect(isValidPublicKey('0x1234')).toBe(false);
      expect(isValidPublicKey(null as unknown as string)).toBe(false);
      expect(isValidPublicKey(undefined as unknown as string)).toBe(false);
    });
  });
});

describe('Burn Accounts Service - Transaction Preparation', () => {
  describe('prepareCloseAccountsTransaction', () => {
    it('should be importable', async () => {
      const { prepareCloseAccountsTransaction } = await import('./burn-accounts');
      expect(typeof prepareCloseAccountsTransaction).toBe('function');
    });
  });

  describe('prepareBurnTokensTransaction', () => {
    it('should be importable', async () => {
      const { prepareBurnTokensTransaction } = await import('./burn-accounts');
      expect(typeof prepareBurnTokensTransaction).toBe('function');
    });
  });
});

describe('Helius DAS API Integration', () => {
  describe('getWalletAssets', () => {
    it('should be importable', async () => {
      const { getWalletAssets } = await import('./burn-accounts');
      expect(typeof getWalletAssets).toBe('function');
    });
  });
});

describe('Edge Cases', () => {
  it('should handle blacklist array correctly', () => {
    expect(Array.isArray(BLACKLIST)).toBe(true);
    expect(BLACKLIST.includes('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(true);
  });

  it('should have correct max accounts per transaction', () => {
    expect(MAX_ACCOUNTS_PER_TX).toBe(15);
    expect(MAX_ACCOUNTS_PER_TX).toBeGreaterThan(0);
    expect(MAX_ACCOUNTS_PER_TX).toBeLessThanOrEqual(20);
  });
});
