// services/grokService.ts
/**
 * Grok (xAI) chat service with live search capabilities
 * Uses XAI_API_KEY from browser storage
 * Uses Responses API for conversation chaining
 */

export interface GrokMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GrokChatResponse {
  text: string;
  responseId?: string;
  citations?: string[];
  sources?: string[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    num_sources_used?: number;
  };
}

export interface GrokStreamChunk {
  text: string;
  done: boolean;
  responseId?: string;
  citations?: string[];
}

/**
 * Get XAI API key from browser storage
 */
async function getXaiApiKey(): Promise<string | null> {
  try {
    const result = await browser.storage.local.get("XAI_API_KEY");
    if (result.XAI_API_KEY && typeof result.XAI_API_KEY === "string") {
      return result.XAI_API_KEY;
    }
  } catch (e) {
    console.warn("Could not read XAI_API_KEY from storage:", e);
  }
  return null;
}

/**
 * Make a request to xAI API
 */
async function makeXaiRequest(
  endpoint: string,
  body: Record<string, unknown>,
  apiKey: string
): Promise<Response> {
  const response = await fetch(`https://api.x.ai/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || `API request failed: ${response.statusText}`);
  }

  return response;
}

/**
 * Send a chat message to Grok with live search
 */
export async function sendGrokMessage(
  messages: GrokMessage[],
  options?: {
    enableSearch?: boolean;
    searchMode?: "auto" | "on" | "off";
    returnCitations?: boolean;
    previousResponseId?: string;
    model?: string;
  }
): Promise<GrokChatResponse> {
  const apiKey = await getXaiApiKey();
  if (!apiKey) {
    throw new Error("XAI_API_KEY not found. Please set it in extension settings.");
  }

  const model = options?.model || "grok-4";
  const enableSearch = options?.enableSearch !== false;
  const searchMode = options?.searchMode || "auto";

  // Use Responses API via chat/completions endpoint
  const requestBody: Record<string, unknown> = {
    model: `grok-4`, // Use grok-4 for Responses API
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  };

  // Add previous response ID for conversation chaining (Responses API)
  if (options?.previousResponseId) {
    requestBody.previous_response_id = options.previousResponseId;
  }

  // Add agentic search tools if enabled
  if (enableSearch) {
    requestBody.tools = [
      {
        type: "web_search",
      },
      {
        type: "x_search",
      },
    ];
    // Include citations in response
    if (options?.returnCitations !== false) {
      requestBody.include = ["citations"];
    }
  }

  // Use chat/completions endpoint (Responses API uses this endpoint)
  const response = await makeXaiRequest("chat/completions", requestBody, apiKey);
  const data = (await response.json()) as {
    id: string;
    choices: Array<{
      message: {
        role: string;
        content: string;
      };
    }>;
    citations?: string[];
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      num_sources_used?: number;
    };
  };

  return {
    text: data.choices[0]?.message?.content || "",
    responseId: data.id,
    citations: data.citations,
    sources: data.citations,
    usage: data.usage,
  };
}

/**
 * Stream a chat message to Grok with live search
 */
export async function* streamGrokMessage(
  messages: GrokMessage[],
  options?: {
    enableSearch?: boolean;
    searchMode?: "auto" | "on" | "off";
    returnCitations?: boolean;
    previousResponseId?: string;
    model?: string;
  }
): AsyncGenerator<GrokStreamChunk, void, unknown> {
  const apiKey = await getXaiApiKey();
  if (!apiKey) {
    throw new Error("XAI_API_KEY not found. Please set it in extension settings.");
  }

  const model = options?.model || "grok-4";
  const enableSearch = options?.enableSearch !== false;
  const searchMode = options?.searchMode || "auto";

  // Use Responses API via chat/completions endpoint with streaming
  const requestBody: Record<string, unknown> = {
    model: `grok-4`, // Use grok-4 for Responses API
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    stream: true,
  };

  // Add previous response ID for conversation chaining (Responses API)
  if (options?.previousResponseId) {
    requestBody.previous_response_id = options.previousResponseId;
  }

  // Add agentic search tools if enabled
  if (enableSearch) {
    requestBody.tools = [
      {
        type: "web_search",
      },
      {
        type: "x_search",
      },
    ];
    // Include citations in response
    if (options?.returnCitations !== false) {
      requestBody.include = ["citations"];
    }
  }

  // Use chat/completions endpoint for streaming (Responses API uses this)
  const response = await makeXaiRequest("chat/completions", requestBody, apiKey);

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let responseId: string | undefined;
  let citations: string[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            yield { text: "", done: true, responseId, citations };
            return;
          }

          try {
            const parsed = JSON.parse(data) as {
              id?: string;
              choices?: Array<{
                delta?: {
                  content?: string;
                };
              }>;
              citations?: string[];
            };

            if (parsed.id) {
              responseId = parsed.id;
            }

            if (parsed.citations) {
              citations = parsed.citations;
            }

            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              yield { text: content, done: false, responseId };
            }
          } catch (e) {
            // Skip invalid JSON
            console.warn("Failed to parse SSE data:", e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  yield { text: "", done: true, responseId, citations };
}

/**
 * Check if XAI API key is configured
 */
export async function hasXaiApiKey(): Promise<boolean> {
  const apiKey = await getXaiApiKey();
  return apiKey !== null && apiKey.length > 0;
}

/**
 * Set XAI API key in storage
 */
export async function setXaiApiKey(apiKey: string): Promise<void> {
  await browser.storage.local.set({ XAI_API_KEY: apiKey });
}
