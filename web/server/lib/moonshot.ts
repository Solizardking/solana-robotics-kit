/**
 * Moonshot / Kimi K3 client for Solana Robotics Kit
 * =================================================
 * OpenAI-compatible chat + vision for trading desk / robot vision paths.
 *
 * Env (any one key is enough):
 *   MOONSHOT_API_KEY | KIMI_API_KEY | MOONSHOT_AI_API_KEY
 * Optional:
 *   MOONSHOT_BASE_URL  (default https://api.moonshot.ai/v1)
 *   MOONSHOT_MODEL     (default kimi-k3)
 *
 * Full SOL GPT 171-tool catalog: docs/SOL_GPT.md
 * Product path: cheshireterminal.ai/sol-gpt
 */

export const KIMI_K3_MODEL = "kimi-k3";
export const MOONSHOT_API_BASE_URL = "https://api.moonshot.ai/v1";

/** Shipped SOL GPT catalog totals (keep in sync with docs/SOL_GPT.md). */
export const SOL_GPT_TOOL_TOTALS = {
  shipped: 171,
  core: 122,
  specialty: 49,
  groups: 12,
  phoenix: 23,
  imperial: 32,
  solanatracker: 60,
  userSignedLive: 8,
} as const;

const KIMI_RETRYABLE_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
]);

export function isRetryableKimiError(error: unknown): boolean {
  const value = (error && typeof error === "object" ? error : {}) as Record<
    string,
    any
  >;
  const status = Number(value.status ?? value.statusCode ?? value.response?.status);
  if ([408, 409, 425, 429].includes(status) || status >= 500) return true;
  const code = String(value.code ?? value.cause?.code ?? "").toUpperCase();
  return KIMI_RETRYABLE_CODES.has(code);
}

export async function withKimiReconnect<T>(
  operation: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    baseDelayMs?: number;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<T> {
  const maxAttempts = Math.max(1, Math.min(8, Math.floor(options?.maxAttempts ?? 4)));
  const baseDelayMs = Math.max(0, Math.floor(options?.baseDelayMs ?? 350));
  const sleep =
    options?.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !isRetryableKimiError(error)) throw error;
      const exponential = baseDelayMs * 2 ** (attempt - 1);
      const jitter =
        baseDelayMs > 0
          ? Math.floor(Math.random() * Math.max(1, baseDelayMs / 2))
          : 0;
      await sleep(exponential + jitter);
    }
  }
  throw lastError;
}

/**
 * Resolve Moonshot / Kimi API key.
 *   KIMI_API_KEY || MOONSHOT_API_KEY || MOONSHOT_AI_API_KEY
 */
export function getMoonshotApiKey(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return (
    env.KIMI_API_KEY?.trim() ||
    env.MOONSHOT_API_KEY?.trim() ||
    env.MOONSHOT_AI_API_KEY?.trim() ||
    ""
  );
}

export function getKimiApiKey(env: NodeJS.ProcessEnv = process.env): string {
  return getMoonshotApiKey(env);
}

export function isMoonshotConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(getMoonshotApiKey(env));
}

export function isKimiConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return isMoonshotConfigured(env);
}

export function moonshotKeySource(
  env: NodeJS.ProcessEnv = process.env,
): "KIMI_API_KEY" | "MOONSHOT_API_KEY" | "MOONSHOT_AI_API_KEY" | null {
  if (env.KIMI_API_KEY?.trim()) return "KIMI_API_KEY";
  if (env.MOONSHOT_API_KEY?.trim()) return "MOONSHOT_API_KEY";
  if (env.MOONSHOT_AI_API_KEY?.trim()) return "MOONSHOT_AI_API_KEY";
  return null;
}

export function resolveMoonshotBaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const raw =
    env.MOONSHOT_BASE_URL?.trim() ||
    env.KIMI_BASE_URL?.trim() ||
    MOONSHOT_API_BASE_URL;
  return raw.replace(/\/+$/, "");
}

export function resolveMoonshotModel(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return (
    env.MOONSHOT_MODEL?.trim() ||
    env.KIMI_MODEL?.trim() ||
    env.SOL_GPT_MOONSHOT_MODEL?.trim() ||
    KIMI_K3_MODEL
  );
}

export type KimiChatRole = "system" | "user" | "assistant" | "tool";

export type KimiVisionContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type KimiChatMessage = {
  role: KimiChatRole;
  content?: string | KimiVisionContentPart[] | null;
  tools?: unknown[];
  reasoning_content?: string | null;
  tool_calls?: unknown[];
  tool_call_id?: string;
  name?: string;
};

const KIMI_VISION_DATA_URL_RE =
  /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;
export const KIMI_VISION_MAX_DATA_URL_CHARS = 720_000;

/** Validate chart/image vision parts before forwarding to Moonshot. */
export function normalizeKimiVisionContent(
  input: unknown,
): KimiVisionContentPart[] | null {
  if (!Array.isArray(input) || input.length < 2 || input.length > 6) return null;
  const parts: KimiVisionContentPart[] = [];
  let images = 0;
  let text = 0;
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;
    const part = raw as Record<string, any>;
    if (part.type === "text" && typeof part.text === "string") {
      const value = part.text.trim().slice(0, 8_000);
      if (!value) return null;
      parts.push({ type: "text", text: value });
      text++;
      continue;
    }
    if (part.type === "image_url" && part.image_url?.url) {
      const url = String(part.image_url.url).trim();
      if (url.startsWith("https://") && url.length < 2_000) {
        parts.push({ type: "image_url", image_url: { url } });
        images++;
        continue;
      }
      if (
        KIMI_VISION_DATA_URL_RE.test(url) &&
        url.length <= KIMI_VISION_MAX_DATA_URL_CHARS
      ) {
        parts.push({ type: "image_url", image_url: { url } });
        images++;
        continue;
      }
      return null;
    }
    return null;
  }
  if (text < 1 || images < 1) return null;
  return parts;
}

export type MoonshotChatOptions = {
  messages: KimiChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: unknown[];
  toolChoice?: "auto" | "none" | { type: "function"; function: { name: string } };
  stream?: boolean;
  /** Trading desk system preamble when not already in messages */
  tradingSystem?: boolean;
};

export const KIMI_TRADING_SYSTEM = `You are SOL GPT (Kimi K3) for Solana Robotics Kit / Cheshire Terminal.
Non-custodial desk: research, quotes, charts, and user-signed prepare tools only.
Never ask for or accept private keys or seed phrases.
Live spends use prepare_user_swap / prepare_user_transfer / prepare_phoenix_* → browser wallet signs → relay only.
$CLAWD mint: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump.
Prefer core market/wallet/perps tools first; use search_tools for specialty catalog.`;

export type MoonshotChatResult = {
  ok: boolean;
  model: string;
  content: string | null;
  toolCalls?: unknown[];
  raw?: unknown;
  error?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

/** Non-streaming chat completions against Moonshot Open Platform. */
export async function moonshotChat(
  options: MoonshotChatOptions,
  env: NodeJS.ProcessEnv = process.env,
): Promise<MoonshotChatResult> {
  const apiKey = getMoonshotApiKey(env);
  if (!apiKey) {
    return {
      ok: false,
      model: resolveMoonshotModel(env),
      content: null,
      error:
        "Moonshot/Kimi not configured. Set MOONSHOT_API_KEY or KIMI_API_KEY.",
    };
  }

  const model = options.model || resolveMoonshotModel(env);
  const base = resolveMoonshotBaseUrl(env);
  const messages = [...options.messages];
  if (
    options.tradingSystem &&
    !messages.some((m) => m.role === "system")
  ) {
    messages.unshift({ role: "system", content: KIMI_TRADING_SYSTEM });
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.4,
    stream: false,
  };
  if (options.maxTokens != null) body.max_tokens = options.maxTokens;
  if (options.tools?.length) {
    body.tools = options.tools;
    body.tool_choice = options.toolChoice ?? "auto";
  }

  try {
    const result = await withKimiReconnect(async () => {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const err = new Error(
          `Moonshot HTTP ${res.status}: ${text.slice(0, 400)}`,
        ) as Error & { status?: number };
        err.status = res.status;
        throw err;
      }
      return res.json() as Promise<any>;
    });

    const choice = result?.choices?.[0]?.message;
    return {
      ok: true,
      model: result?.model || model,
      content: typeof choice?.content === "string" ? choice.content : null,
      toolCalls: choice?.tool_calls,
      usage: result?.usage,
      raw: result,
    };
  } catch (e) {
    return {
      ok: false,
      model,
      content: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Chart / robot camera vision: text prompt + image data URL or HTTPS URL. */
export async function moonshotVision(params: {
  prompt: string;
  imageUrl: string;
  model?: string;
  temperature?: number;
}): Promise<MoonshotChatResult> {
  const parts = normalizeKimiVisionContent([
    { type: "text", text: params.prompt },
    { type: "image_url", image_url: { url: params.imageUrl } },
  ]);
  if (!parts) {
    return {
      ok: false,
      model: resolveMoonshotModel(),
      content: null,
      error:
        "Invalid vision payload. Need text + image_url (https or data:image/*;base64).",
    };
  }
  return moonshotChat({
    tradingSystem: true,
    temperature: params.temperature ?? 0.3,
    model: params.model,
    messages: [{ role: "user", content: parts }],
  });
}

/** Health / config snapshot — never includes secret values. */
export function moonshotHealthSnapshot(
  env: NodeJS.ProcessEnv = process.env,
): {
  configured: boolean;
  keySource: string | null;
  model: string;
  baseUrl: string;
  provider: string;
  solGptTools: typeof SOL_GPT_TOOL_TOTALS;
  features: { trading: boolean; vision: boolean; coreToolsAlwaysOn: boolean };
} {
  const configured = isMoonshotConfigured(env);
  return {
    configured,
    keySource: moonshotKeySource(env),
    model: resolveMoonshotModel(env),
    baseUrl: resolveMoonshotBaseUrl(env),
    provider: env.SOL_GPT_PROVIDER?.trim() || "auto",
    solGptTools: SOL_GPT_TOOL_TOTALS,
    features: {
      trading: configured,
      vision: configured,
      coreToolsAlwaysOn: configured, // Kimi path loads core tools every turn
    },
  };
}
