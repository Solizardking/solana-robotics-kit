import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@neon/ai-sdk-provider", () => ({ neon: vi.fn((id: string) => id) }));
vi.mock("ai", () => ({ generateText: vi.fn(async () => ({ text: "CLAWD ready." })) }));
import { listGatewayModels, selectGatewayModel, gatewayReply } from "./lib/neon-gateway";
import { generateText } from "ai";
const catalog = [{ id: "locked", enabled: false, architecture: { output_modalities: ["text"] } }, { id: "embedding", enabled: true, architecture: { output_modalities: ["embedding"] } }, { id: "chat", enabled: true, architecture: { output_modalities: ["text"] } }];
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
function configure() { vi.stubEnv("NEON_AI_GATEWAY_BASE_URL", "https://branch.example"); vi.stubEnv("NEON_AI_GATEWAY_TOKEN", "test-secret"); vi.stubEnv("NEON_AI_MODEL", ""); }
describe("Neon gateway", () => {
  it("selects only enabled text models", () => { expect(selectGatewayModel(catalog)).toBe("chat"); expect(() => selectGatewayModel(catalog, "locked")).toThrow(); expect(() => selectGatewayModel(catalog, "embedding")).toThrow(); });
  it("fails clearly without credentials", async () => { vi.stubEnv("NEON_AI_GATEWAY_TOKEN", ""); await expect(listGatewayModels()).rejects.toThrow("not configured"); });
  it("lists the unified branch endpoint and uses the Neon provider", async () => {
    configure(); const fetcher = vi.fn(async () => new Response(JSON.stringify({ data: catalog }))); vi.stubGlobal("fetch", fetcher);
    expect(await gatewayReply("Hello")).toMatchObject({ text: "CLAWD ready.", model: "chat", provider: "neon" });
    expect(String(fetcher.mock.calls[0][0])).toBe("https://branch.example/v1/models");
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({ model: "chat", maxRetries: 0 }));
  });
  it("does not expose upstream errors", async () => {
    configure(); vi.stubGlobal("fetch", async () => new Response("test-secret", { status: 401 }));
    await expect(listGatewayModels()).rejects.toThrow("HTTP 401");
  });
  it("refuses URLs with embedded paths or credentials", async () => {
    configure(); vi.stubEnv("NEON_AI_GATEWAY_BASE_URL", "https://branch.example/v1");
    await expect(listGatewayModels()).rejects.toThrow("bare HTTPS host");
  });
});
