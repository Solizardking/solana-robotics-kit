import { gatewayConfigured, gatewayReply } from "./neon-gateway";
export const CLAWD_MINT = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump";
export const GROOT_BUCKET = "https://huggingface.co/buckets/ordlibrary/GR00T-N1.7-3B-bucket";
export type BrainProvider = "neon" | "nvidia" | "xai";
const system = `You are SOLtron, the Solana Robotics AI companion powered by $CLAWD. Product token: $CLAWD, mint ${CLAWD_MINT}. Help with robotics, simulation, and Solana. Your text is advisory. You cannot move hardware, sign transactions, verify payments, or claim a policy is running. NVIDIA Isaac GR00T is a separate vision-language-action policy, not this chat model.`;
export function brainStatus() {
  return { clawdMint: CLAWD_MINT, bucket: GROOT_BUCKET, execution: "advisory-only",
    providers: { neon: gatewayConfigured(), nvidia: Boolean(process.env.NVIDIA_API_KEY), xai: Boolean(process.env.XAI_API_KEY) },
    policy: "not-probed" };
}
export async function brainReply(provider: BrainProvider, prompt: string, model?: string) {
  if (provider === "neon") return gatewayReply(prompt, model, system);
  const key = process.env[provider === "nvidia" ? "NVIDIA_API_KEY" : "XAI_API_KEY"];
  if (!key) throw new Error(`${provider.toUpperCase()}_API_KEY is not configured.`);
  const selected = provider === "nvidia" ? process.env.NVIDIA_MODEL || "nvidia/nemotron-3-nano-30b-a3b" : process.env.XAI_MODEL || "grok-4-fast-reasoning";
  const base = provider === "nvidia" ? "https://integrate.api.nvidia.com/v1" : "https://api.x.ai/v1";
  try {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: selected, messages: [{ role: "system", content: system }, { role: "user", content: prompt }], max_tokens: 512, stream: false }),
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) throw new Error("Provider rejected request");
    const body = await response.json();
    const text = body.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) throw new Error("Empty reply");
    return { text, model: selected, provider };
  } catch { throw new Error(`${provider} generation failed. Check credentials and configured model access.`); }
}
