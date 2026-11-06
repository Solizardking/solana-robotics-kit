import { neon } from "@neon/ai-sdk-provider";
import { generateText } from "ai";

export type GatewayModel = { id: string; enabled: boolean; owned_by?: string; architecture?: { output_modalities?: string[] } };
export function gatewayConfigured() {
  return Boolean(process.env.NEON_AI_GATEWAY_TOKEN && process.env.NEON_AI_GATEWAY_BASE_URL);
}
export async function listGatewayModels(): Promise<GatewayModel[]> {
  if (!gatewayConfigured()) throw new Error("Neon AI Gateway is not configured. Run neon login, neon init, then neon deploy.");
  const base = new URL(process.env.NEON_AI_GATEWAY_BASE_URL!);
  if (base.protocol !== "https:" || base.pathname !== "/" || base.search || base.hash || base.username || base.password) {
    throw new Error("NEON_AI_GATEWAY_BASE_URL must be a bare HTTPS host.");
  }
  const response = await fetch(new URL("/v1/models", base), {
    headers: { Authorization: `Bearer ${process.env.NEON_AI_GATEWAY_TOKEN}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Neon model discovery failed (HTTP ${response.status}).`);
  const body = await response.json();
  if (!Array.isArray(body.data)) throw new Error("Invalid Neon model catalog.");
  return body.data.filter((m: GatewayModel) => typeof m.id === "string");
}
export function selectGatewayModel(models: GatewayModel[], requested?: string) {
  const available = models.filter(m => m.enabled === true && m.architecture?.output_modalities?.includes("text"));
  if (requested) {
    if (!available.some(m => m.id === requested)) throw new Error("Selected model is not enabled for text generation on this branch.");
    return requested;
  }
  const model = available.find(m => m.id === "claude-haiku-4-5") ?? available.find(m => m.id === "gpt-5-mini") ?? available[0];
  if (!model) throw new Error("No enabled text model is available on this branch.");
  return model.id;
}
export async function gatewayReply(prompt: string, requested?: string, system?: string) {
  const model = selectGatewayModel(await listGatewayModels(), requested ?? process.env.NEON_AI_MODEL);
  try {
    const result = await generateText({ model: neon(model), prompt, system, maxOutputTokens: 512,
      maxRetries: 0, abortSignal: AbortSignal.timeout(60000) });
    if (!result.text.trim()) throw new Error("Empty reply");
    return { text: result.text, model, provider: "neon" as const };
  } catch {
    // Provider errors can contain request headers. Do not return or log the raw error.
    throw new Error("Neon generation failed. Check branch access, credits, and model availability.");
  }
}
