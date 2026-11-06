import { afterEach, expect, it, vi } from "vitest";
import { brainReply, brainStatus } from "./lib/clawd-brain";
import { clawdBrainRouter } from "./clawd-brain-router";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it("does not call a provider without a key", async () => {
  vi.stubEnv("NVIDIA_API_KEY", ""); const f = vi.fn(); vi.stubGlobal("fetch", f);
  await expect(brainReply("nvidia", "hello")).rejects.toThrow("not configured");
  expect(f).not.toHaveBeenCalled(); expect(brainStatus().providers.nvidia).toBe(false);
});
it("returns a real provider payload without exposing credentials", async () => {
  vi.stubEnv("XAI_API_KEY", "private-test-value");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "hello" } }] }))));
  expect(await brainReply("xai", "hello")).toMatchObject({ text: "hello", provider: "xai" });
  expect(JSON.stringify(brainStatus())).not.toContain("private-test-value");
});
it("blocks unauthenticated paid model requests", async () => {
  const caller = clawdBrainRouter.createCaller({ user: null, req: {} as any, res: {} as any });
  await expect(caller.chat({ prompt: "hello", provider: "neon" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  await expect(caller.models()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
});
it("rejects an empty upstream reply", async () => {
  vi.stubEnv("NVIDIA_API_KEY", "private-test-value");
  vi.stubGlobal("fetch", async () => new Response('{"choices":[]}'));
  await expect(brainReply("nvidia", "hello")).rejects.toThrow("generation failed");
});
