import { describe, it, expect } from 'vitest';
import {
  isOpenRouterConfigured,
  getOpenRouterStatus,
  OPENROUTER_MODELS,
  PASSPORT_PROMPT_TEMPLATE,
  COIN_BADGE_PROMPT_TEMPLATE,
  fillPassportPrompt,
} from './openrouter';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

describe('OpenRouter Integration', () => {
  describe('Configuration', () => {
    it('should have OPENROUTER_API_KEY configured', () => {
      expect(OPENROUTER_API_KEY).toBeDefined();
      expect(OPENROUTER_API_KEY).not.toBe('');
    });

    it('isOpenRouterConfigured returns true when key is set', () => {
      const configured = isOpenRouterConfigured();
      expect(typeof configured).toBe('boolean');
      // Should be true if key is set
      if (OPENROUTER_API_KEY && OPENROUTER_API_KEY.length > 10) {
        expect(configured).toBe(true);
      }
    });

    it('should have model configurations defined', () => {
      expect(OPENROUTER_MODELS.GEMINI_FLASH).toBeDefined();
      expect(OPENROUTER_MODELS.FLUX_KLEIN).toBeDefined();
      expect(typeof OPENROUTER_MODELS.GEMINI_FLASH).toBe('string');
      expect(typeof OPENROUTER_MODELS.FLUX_KLEIN).toBe('string');
    });
  });

  describe('Prompt Templates', () => {
    it('should have passport prompt template defined', () => {
      expect(PASSPORT_PROMPT_TEMPLATE).toBeDefined();
      expect(PASSPORT_PROMPT_TEMPLATE.length).toBeGreaterThan(500);
      expect(PASSPORT_PROMPT_TEMPLATE).toContain('ROBOT PASSPORT');
      expect(PASSPORT_PROMPT_TEMPLATE).toContain('[ROBOT_ID]');
    });

    it('should have coin badge prompt template defined', () => {
      expect(COIN_BADGE_PROMPT_TEMPLATE).toBeDefined();
      expect(COIN_BADGE_PROMPT_TEMPLATE.length).toBeGreaterThan(200);
      expect(COIN_BADGE_PROMPT_TEMPLATE).toContain('[TOKEN_TICKER]');
    });

    it('fillPassportPrompt replaces all placeholders for passport', () => {
      const formData = {
        robotId: 'TEST-001',
        pubkey: 'abc123...xyz',
        owner: 'OwnerWallet',
        title: 'Test Robot',
        reputation: '85',
        capabilities: 'Testing, Validation',
        bagText: 'Test Bag',
        tokenTicker: 'TEST',
      };

      const filled = fillPassportPrompt('passport', formData);
      
      expect(filled).toContain('TEST-001');
      expect(filled).toContain('abc123...xyz');
      expect(filled).toContain('OwnerWallet');
      expect(filled).toContain('Test Robot');
      expect(filled).toContain('85');
      expect(filled).toContain('Testing, Validation');
      expect(filled).toContain('Test Bag');
      expect(filled).not.toContain('[ROBOT_ID]');
      expect(filled).not.toContain('[TRUNCATED_WALLET]');
    });

    it('fillPassportPrompt replaces all placeholders for coin', () => {
      const formData = {
        robotId: 'COIN-001',
        pubkey: 'coin123',
        owner: 'CoinOwner',
        title: 'Coin Robot',
        reputation: '100',
        capabilities: 'Minting',
        bagText: 'Coin Bag',
        tokenTicker: 'COIN',
      };

      const filled = fillPassportPrompt('coin', formData);
      
      expect(filled).toContain('$COIN');
      expect(filled).toContain('Coin Bag');
      expect(filled).not.toContain('[TOKEN_TICKER]');
      expect(filled).not.toContain('[BAG_TEXT]');
    });
  });

  describe('API Validation', () => {
    it('should be able to check OpenRouter status', async () => {
      const status = await getOpenRouterStatus();
      
      expect(status).toBeDefined();
      expect(typeof status.configured).toBe('boolean');
      expect(typeof status.valid).toBe('boolean');
      expect(Array.isArray(status.models)).toBe(true);
      
      if (OPENROUTER_API_KEY) {
        expect(status.configured).toBe(true);
        // API validation may fail due to rate limits, so we just check structure
        expect(status.models.length).toBeGreaterThan(0);
      }
    }, 15000);
  });
});
