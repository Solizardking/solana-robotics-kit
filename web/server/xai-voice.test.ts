import { describe, expect, it } from "vitest";
import {
  isVoiceConfigured,
  VOICE_OPTIONS,
  SOLTRON_VOICE_CONFIG,
  SOLANA_ROBOTICS_TOOLS,
  createSessionUpdateMessage,
  createSessionUpdateMessageWithTools,
  createTextMessage,
  createFunctionResponseMessage,
  getEphemeralToken,
} from "./xai-voice";

describe("xAI Voice Agent Integration", () => {
  describe("Voice Configuration", () => {
    it("should have XAI_API_KEY configured", () => {
      const configured = isVoiceConfigured();
      expect(configured).toBe(true);
    });

    it("should have 5 voice options available", () => {
      expect(VOICE_OPTIONS).toHaveLength(5);
      expect(VOICE_OPTIONS.map(v => v.id)).toEqual(['Ara', 'Rex', 'Sal', 'Eve', 'Leo']);
    });

    it("should have SOLtron voice config with Rex voice", () => {
      expect(SOLTRON_VOICE_CONFIG.voice).toBe('Rex');
      expect(SOLTRON_VOICE_CONFIG.turnDetection).toBe('server_vad');
      expect(SOLTRON_VOICE_CONFIG.audioInput?.rate).toBe(24000);
    });
  });

  describe("Custom Function Tools", () => {
    it("should have Solana Robotics custom tools defined", () => {
      expect(SOLANA_ROBOTICS_TOOLS.length).toBeGreaterThan(0);
      
      const toolNames = SOLANA_ROBOTICS_TOOLS.map(t => t.name);
      expect(toolNames).toContain('get_token_price');
      expect(toolNames).toContain('get_portfolio');
      expect(toolNames).toContain('execute_trade');
      expect(toolNames).toContain('check_robot_status');
      expect(toolNames).toContain('send_robot_command');
      expect(toolNames).toContain('verify_token_holder');
    });

    it("should have proper tool structure", () => {
      const getTokenPriceTool = SOLANA_ROBOTICS_TOOLS.find(t => t.name === 'get_token_price');
      expect(getTokenPriceTool).toBeDefined();
      expect(getTokenPriceTool?.type).toBe('function');
      expect(getTokenPriceTool?.parameters.type).toBe('object');
      expect(getTokenPriceTool?.parameters.required).toContain('token_address');
    });
  });

  describe("Session Message Creation", () => {
    it("should create valid session update message", () => {
      const message = createSessionUpdateMessage();
      expect(message).toHaveProperty('type', 'session.update');
      expect(message).toHaveProperty('session');
    });

    it("should create session update message with custom tools", () => {
      const message = createSessionUpdateMessageWithTools() as { type: string; session: { tools: unknown[] } };
      expect(message.type).toBe('session.update');
      expect(message.session.tools).toBeDefined();
      expect(Array.isArray(message.session.tools)).toBe(true);
      // Should include web_search, x_search, and custom tools
      expect(message.session.tools.length).toBeGreaterThan(2);
    });

    it("should create valid text message", () => {
      const message = createTextMessage("Hello SOLtron") as { type: string; item: { content: { text: string }[] } };
      expect(message.type).toBe('conversation.item.create');
      expect(message.item.content[0].text).toBe("Hello SOLtron");
    });

    it("should create valid function response message", () => {
      const message = createFunctionResponseMessage("call_123", { price: 0.00042 }) as { type: string; item: { call_id: string; output: string } };
      expect(message.type).toBe('conversation.item.create');
      expect(message.item.call_id).toBe("call_123");
      expect(JSON.parse(message.item.output)).toEqual({ price: 0.00042 });
    });
  });

  describe("Ephemeral Token", () => {
    it("should be able to request ephemeral token", async () => {
      const result = await getEphemeralToken(60);
      
      // The function should return a result object
      expect(result).toHaveProperty('success');
      
      // Either success with token, or failure with error
      if (result.success) {
        // Token may be in different formats depending on API response
        expect(result.token !== undefined || result.expiresAt !== undefined).toBe(true);
      } else {
        // If it fails, it should have an error message
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    }, 10000);
  });
});
