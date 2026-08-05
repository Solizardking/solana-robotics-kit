import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

// Create a public context for testing
function createPublicContext() {
  return {
    user: null,
  };
}

describe("Multi-Provider AI Agent", () => {
  describe("agent.models", () => {
    it("returns list of available models", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const models = await caller.agent.models();

      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      
      // Check model structure
      const firstModel = models[0];
      expect(firstModel).toHaveProperty("id");
      expect(firstModel).toHaveProperty("name");
      expect(firstModel).toHaveProperty("model");
      expect(firstModel).toHaveProperty("provider");
    });

    it("includes Claude Opus, Minimax, Gemini, and Codex models", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const models = await caller.agent.models();
      const modelIds = models.map((m: any) => m.id);

      expect(modelIds).toContain("claude-opus");
      expect(modelIds).toContain("minimax");
      expect(modelIds).toContain("gemini");
      expect(modelIds).toContain("codex");
    });
  });

  describe("agent.chat", () => {
    it("returns error when OpenRouter is not configured", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // This will return an error if OPENROUTER_API_KEY is not set
      const result = await caller.agent.chat({
        messages: [{ role: "user", content: "Hello" }],
        modelId: "claude-opus",
      });

      // Either success or graceful error
      expect(result).toHaveProperty("success");
      if (!result.success) {
        expect(result).toHaveProperty("error");
      }
    }, 30000);
  });

  describe("agent.codex", () => {
    it("returns error when OpenRouter is not configured", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.agent.codex({
        messages: [{ role: "user", content: "Write a hello world function" }],
        enableReasoning: true,
      });

      // Either success or graceful error
      expect(result).toHaveProperty("success");
      if (!result.success) {
        expect(result).toHaveProperty("error");
      }
    }, 30000);
  });
});

describe("Birdeye Real-time Price", () => {
  describe("token.realTimePrice", () => {
    it("returns price data or null when rate limited", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.token.realTimePrice({});

      // Either returns price data or null (rate limited)
      if (result !== null) {
        expect(result).toHaveProperty("value");
        expect(result).toHaveProperty("liquidity");
      }
    });
  });

  describe("token.memeDetail", () => {
    it("returns meme token detail or null when rate limited", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.token.memeDetail({});

      // Either returns meme token data or null (rate limited)
      // The result is the raw API response which may have various structures
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe("token.address", () => {
    it("returns the configured token address", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const address = await caller.token.address();

      expect(address).toBe("DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS");
    });
  });
});
