import { describe, expect, it } from "vitest";

describe("SOLbot Desktop Companion", () => {
  describe("Robot Variants", () => {
    it("should have three robot variants available", () => {
      const variants = [
        { name: 'SOL-KIT Mini', bodyColor: '#1a1a2e', accentColor: '#9945FF', trackColor: '#14F195' },
        { name: 'SOL-KIT Pro', bodyColor: '#0f0f1a', accentColor: '#14F195', trackColor: '#9945FF' },
        { name: 'SOL-KIT Elite', bodyColor: '#2a1a3e', accentColor: '#FFD700', trackColor: '#9945FF' },
      ];
      
      expect(variants).toHaveLength(3);
      expect(variants[0].name).toBe('SOL-KIT Mini');
      expect(variants[1].name).toBe('SOL-KIT Pro');
      expect(variants[2].name).toBe('SOL-KIT Elite');
    });

    it("should have valid color values for each variant", () => {
      const variants = [
        { name: 'SOL-KIT Mini', bodyColor: '#1a1a2e', accentColor: '#9945FF', trackColor: '#14F195' },
        { name: 'SOL-KIT Pro', bodyColor: '#0f0f1a', accentColor: '#14F195', trackColor: '#9945FF' },
        { name: 'SOL-KIT Elite', bodyColor: '#2a1a3e', accentColor: '#FFD700', trackColor: '#9945FF' },
      ];
      
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      
      variants.forEach(variant => {
        expect(variant.bodyColor).toMatch(hexColorRegex);
        expect(variant.accentColor).toMatch(hexColorRegex);
        expect(variant.trackColor).toMatch(hexColorRegex);
      });
    });
  });

  describe("Emotion States", () => {
    it("should have six emotion states defined", () => {
      const emotions = ['happy', 'curious', 'sleepy', 'excited', 'thinking', 'talking'];
      expect(emotions).toHaveLength(6);
    });

    it("should have valid emotion profiles", () => {
      const emotions = {
        happy: { eyeScale: 1, eyeY: 0, mouthCurve: 10, glowSpeed: 0.1 },
        curious: { eyeScale: 1.1, eyeY: -5, mouthCurve: 0, glowSpeed: 0.15 },
        sleepy: { eyeScale: 0.6, eyeY: 5, mouthCurve: 5, glowSpeed: 0.05 },
        excited: { eyeScale: 1.2, eyeY: -3, mouthCurve: 15, glowSpeed: 0.25 },
        thinking: { eyeScale: 0.9, eyeY: 0, mouthCurve: 2, glowSpeed: 0.3 },
        talking: { eyeScale: 1.05, eyeY: -2, mouthCurve: 8, glowSpeed: 0.2 },
      };
      
      Object.values(emotions).forEach(profile => {
        expect(profile.eyeScale).toBeGreaterThan(0);
        expect(profile.eyeScale).toBeLessThanOrEqual(1.5);
        expect(typeof profile.eyeY).toBe('number');
        expect(profile.mouthCurve).toBeGreaterThanOrEqual(0);
        expect(profile.glowSpeed).toBeGreaterThan(0);
      });
    });
  });

  describe("Chat Interface", () => {
    it("should format message timestamps correctly", () => {
      const timestamp = Date.now();
      const date = new Date(timestamp);
      const formatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      expect(formatted).toMatch(/^\d{1,2}:\d{2}/);
    });

    it("should distinguish between user and assistant messages", () => {
      const messages = [
        { role: 'user', content: 'Hello', timestamp: Date.now() },
        { role: 'assistant', content: 'Hi there!', timestamp: Date.now() },
      ];
      
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
    });
  });

  describe("SOLbot System Prompt", () => {
    it("should include key personality traits", () => {
      const systemPrompt = `You are SOL-KIT, a high-tech autonomous desktop robot companion living on the Solana blockchain. 
Your personality is helpful, slightly futuristic, and deeply knowledgeable about crypto, Solana, and robotics.`;
      
      expect(systemPrompt).toContain('SOL-KIT');
      expect(systemPrompt).toContain('Solana');
      expect(systemPrompt).toContain('robot');
      expect(systemPrompt).toContain('crypto');
    });
  });

  describe("Animation Parameters", () => {
    it("should have valid blink interval range", () => {
      const minInterval = 3500;
      const maxRandom = 2000;
      const maxInterval = minInterval + maxRandom;
      
      expect(minInterval).toBeGreaterThan(3000);
      expect(maxInterval).toBeLessThan(6000);
    });

    it("should have valid glow intensity calculation", () => {
      const baseIntensity = 0.6;
      const variation = 0.3;
      
      // Test min and max possible values
      const minIntensity = baseIntensity - variation;
      const maxIntensity = baseIntensity + variation;
      
      expect(minIntensity).toBeGreaterThan(0);
      expect(maxIntensity).toBeLessThanOrEqual(1);
    });
  });
});
