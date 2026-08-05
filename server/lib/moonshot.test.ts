import { describe, expect, it } from "vitest";
import {
  getMoonshotApiKey,
  isMoonshotConfigured,
  moonshotHealthSnapshot,
  moonshotKeySource,
  normalizeKimiVisionContent,
  resolveMoonshotBaseUrl,
  resolveMoonshotModel,
  SOL_GPT_TOOL_TOTALS,
  KIMI_K3_MODEL,
} from "./moonshot";
import { solGptCatalogSummary, SOL_GPT_GROUPS } from "./sol-gpt-catalog";

describe("moonshot config", () => {
  it("resolves key from MOONSHOT_API_KEY", () => {
    const env = { MOONSHOT_API_KEY: " sk-test " } as NodeJS.ProcessEnv;
    expect(getMoonshotApiKey(env)).toBe("sk-test");
    expect(isMoonshotConfigured(env)).toBe(true);
    expect(moonshotKeySource(env)).toBe("MOONSHOT_API_KEY");
  });

  it("prefers KIMI_API_KEY alias", () => {
    const env = {
      KIMI_API_KEY: "sk-kimi",
      MOONSHOT_API_KEY: "sk-moon",
    } as NodeJS.ProcessEnv;
    expect(getMoonshotApiKey(env)).toBe("sk-kimi");
    expect(moonshotKeySource(env)).toBe("KIMI_API_KEY");
  });

  it("defaults model to kimi-k3", () => {
    expect(resolveMoonshotModel({})).toBe(KIMI_K3_MODEL);
    expect(resolveMoonshotModel({ MOONSHOT_MODEL: "kimi-k3" })).toBe("kimi-k3");
  });

  it("defaults base URL", () => {
    expect(resolveMoonshotBaseUrl({})).toBe("https://api.moonshot.ai/v1");
  });

  it("health snapshot never leaks secrets", () => {
    const snap = moonshotHealthSnapshot({
      MOONSHOT_API_KEY: "sk-super-secret-key-value",
      MOONSHOT_MODEL: "kimi-k3",
    } as NodeJS.ProcessEnv);
    expect(snap.configured).toBe(true);
    expect(snap.keySource).toBe("MOONSHOT_API_KEY");
    expect(snap.model).toBe("kimi-k3");
    expect(JSON.stringify(snap)).not.toContain("sk-super-secret");
    expect(snap.features.trading).toBe(true);
    expect(snap.features.vision).toBe(true);
    expect(snap.solGptTools.shipped).toBe(171);
  });

  it("validates vision content shape", () => {
    const ok = normalizeKimiVisionContent([
      { type: "text", text: "What is the trend?" },
      {
        type: "image_url",
        image_url: { url: "https://example.com/chart.png" },
      },
    ]);
    expect(ok).not.toBeNull();
    expect(ok?.length).toBe(2);

    expect(normalizeKimiVisionContent([{ type: "text", text: "only" }])).toBeNull();
  });
});

describe("sol-gpt catalog", () => {
  it("sums to 171 shipped tools", () => {
    const sum = SOL_GPT_GROUPS.reduce((n, g) => n + g.tools, 0);
    expect(sum).toBe(171);
    expect(SOL_GPT_TOOL_TOTALS.shipped).toBe(171);
    const summary = solGptCatalogSummary();
    expect(summary.shipped).toBe(171);
    expect(summary.core).toBe(122);
    expect(summary.custody.nonCustodial).toBe(true);
    expect(summary.models.defaultWhenMoonshotKey).toBe("kimi-k3");
  });
});
