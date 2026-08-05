import { describe, it, expect, vi } from 'vitest';
import { chatWithGrok, generateGrokImage, GROK_SYSTEM_PROMPT } from './xai';

describe('xAI Grok Integration', () => {
  it('should have GROK_SYSTEM_PROMPT defined', () => {
    expect(GROK_SYSTEM_PROMPT).toBeDefined();
    expect(GROK_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    expect(GROK_SYSTEM_PROMPT).toContain('Grok');
    expect(GROK_SYSTEM_PROMPT).toContain('Solana');
  });

  it('chatWithGrok returns mock response when API key not configured', async () => {
    // When XAI_API_KEY is not set, should return mock response
    const originalKey = process.env.XAI_API_KEY;
    delete process.env.XAI_API_KEY;
    
    const result = await chatWithGrok({
      messages: [
        { role: 'user', content: 'Hello' }
      ],
    });
    
    // Restore key
    if (originalKey) {
      process.env.XAI_API_KEY = originalKey;
    }
    
    expect(result).not.toBeNull();
    expect(result?.content).toContain('Grok');
    expect(result?.model).toBe('mock');
  });

  it('chatWithGrok handles search parameters correctly', async () => {
    const originalKey = process.env.XAI_API_KEY;
    delete process.env.XAI_API_KEY;
    
    const result = await chatWithGrok({
      messages: [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Search for Solana news' }
      ],
      enableSearch: true,
      searchSources: ['web', 'x'],
      maxSearchResults: 5,
    });
    
    if (originalKey) {
      process.env.XAI_API_KEY = originalKey;
    }
    
    expect(result).not.toBeNull();
  });

  it('generateGrokImage returns null when API key not configured', async () => {
    const originalKey = process.env.XAI_API_KEY;
    delete process.env.XAI_API_KEY;
    
    const result = await generateGrokImage('A robot on Solana blockchain');
    
    if (originalKey) {
      process.env.XAI_API_KEY = originalKey;
    }
    
    expect(result).toBeNull();
  });

  it('GROK_SYSTEM_PROMPT contains required information', () => {
    // Check for key information in system prompt
    expect(GROK_SYSTEM_PROMPT).toContain('$KIT');
    expect(GROK_SYSTEM_PROMPT).toContain('Trading');
    expect(GROK_SYSTEM_PROMPT).toContain('SOLtron');
    expect(GROK_SYSTEM_PROMPT).toContain('Jupiter');
  });
});

describe('xAI API Key Validation', () => {
  it('XAI_API_KEY environment variable format check', () => {
    const apiKey = process.env.XAI_API_KEY;
    
    if (apiKey) {
      // If key is set, it should be a non-empty string
      expect(typeof apiKey).toBe('string');
      expect(apiKey.length).toBeGreaterThan(10);
    } else {
      // If not set, test passes (mock mode)
      expect(true).toBe(true);
    }
  });
});
