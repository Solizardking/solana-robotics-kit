/**
 * xAI Grok Voice Agent Integration
 * Real-time voice conversations via WebSocket
 * Endpoint: wss://api.x.ai/v1/realtime
 */

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_REALTIME_URL = "wss://api.x.ai/v1/realtime";
const XAI_SESSION_URL = "https://api.x.ai/v1/realtime/client_secrets";

// Voice options available
export type VoiceOption = "Ara" | "Rex" | "Sal" | "Eve" | "Leo";

export interface VoiceConfig {
  voice: VoiceOption;
  description: string;
  type: string;
  tone: string;
}

export const VOICE_OPTIONS: Record<VoiceOption, VoiceConfig> = {
  Ara: {
    voice: "Ara",
    description: "Default voice, balanced and conversational",
    type: "Female",
    tone: "Warm, friendly",
  },
  Rex: {
    voice: "Rex",
    description: "Professional and articulate, ideal for business applications",
    type: "Male",
    tone: "Confident, clear",
  },
  Sal: {
    voice: "Sal",
    description: "Versatile voice suitable for various contexts",
    type: "Neutral",
    tone: "Smooth, balanced",
  },
  Eve: {
    voice: "Eve",
    description: "Engaging and enthusiastic, great for interactive experiences",
    type: "Female",
    tone: "Energetic, upbeat",
  },
  Leo: {
    voice: "Leo",
    description: "Decisive and commanding, suitable for instructional content",
    type: "Male",
    tone: "Authoritative, strong",
  },
};

// Audio format configuration
export interface AudioFormat {
  type: "audio/pcm" | "audio/pcmu" | "audio/pcma";
  rate?: number; // Only for audio/pcm: 8000, 16000, 21050, 24000, 32000, 44100, 48000
}

export interface SessionConfig {
  voice: VoiceOption;
  instructions: string;
  turnDetection: "server_vad" | null;
  audio: {
    input: { format: AudioFormat };
    output: { format: AudioFormat };
  };
  tools?: SessionTool[];
}

// Tool types for voice agent
export interface WebSearchTool {
  type: "web_search";
}

export interface XSearchTool {
  type: "x_search";
}

export interface FileSearchTool {
  type: "file_search";
  vector_store_ids: string[];
  max_num_results?: number;
}

export interface FunctionTool {
  type: "function";
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

export type SessionTool = WebSearchTool | XSearchTool | FileSearchTool | FunctionTool;

// Client events (sent to server)
export interface SessionUpdateEvent {
  type: "session.update";
  session: {
    voice?: VoiceOption;
    instructions?: string;
    turn_detection?: { type: "server_vad" | null };
    audio?: {
      input?: { format: AudioFormat };
      output?: { format: AudioFormat };
    };
    tools?: SessionTool[];
  };
}

export interface AudioBufferAppendEvent {
  type: "input_audio_buffer.append";
  audio: string; // Base64 encoded audio
}

export interface AudioBufferCommitEvent {
  type: "input_audio_buffer.commit";
}

export interface AudioBufferClearEvent {
  type: "input_audio_buffer.clear";
}

export interface ConversationItemCreateEvent {
  type: "conversation.item.create";
  previous_item_id?: string;
  item: {
    type: "message" | "function_call_output";
    role?: "user" | "assistant";
    content?: Array<{ type: "input_text"; text: string }>;
    call_id?: string;
    output?: string;
  };
}

export interface ResponseCreateEvent {
  type: "response.create";
}

export type ClientEvent =
  | SessionUpdateEvent
  | AudioBufferAppendEvent
  | AudioBufferCommitEvent
  | AudioBufferClearEvent
  | ConversationItemCreateEvent
  | ResponseCreateEvent;

// Server events (received from server)
export interface SessionUpdatedEvent {
  type: "session.updated";
  session: Record<string, unknown>;
}

export interface ConversationCreatedEvent {
  type: "conversation.created";
  event_id: string;
  conversation: {
    id: string;
    object: string;
  };
}

export interface SpeechStartedEvent {
  type: "input_audio_buffer.speech_started";
  event_id: string;
  item_id: string;
}

export interface SpeechStoppedEvent {
  type: "input_audio_buffer.speech_stopped";
  event_id: string;
  item_id: string;
}

export interface TranscriptionCompletedEvent {
  type: "conversation.item.input_audio_transcription.completed";
  event_id: string;
  item_id: string;
  transcript: string;
}

export interface ConversationItemAddedEvent {
  type: "conversation.item.added";
  event_id: string;
  previous_item_id: string;
  item: {
    id: string;
    type: string;
    role: string;
    content: Array<{ type: string; transcript?: string; text?: string }>;
  };
}

export interface ResponseCreatedEvent {
  type: "response.created";
  event_id: string;
  response: {
    id: string;
    status: string;
  };
}

export interface ResponseDoneEvent {
  type: "response.done";
  event_id: string;
  response: {
    id: string;
    status: string;
  };
}

export interface AudioTranscriptDeltaEvent {
  type: "response.output_audio_transcript.delta";
  event_id: string;
  response_id: string;
  item_id: string;
  delta: string;
}

export interface AudioTranscriptDoneEvent {
  type: "response.output_audio_transcript.done";
  event_id: string;
  response_id: string;
  item_id: string;
}

export interface AudioDeltaEvent {
  type: "response.output_audio.delta";
  event_id: string;
  response_id: string;
  item_id: string;
  delta: string; // Base64 encoded audio
}

export interface AudioDoneEvent {
  type: "response.output_audio.done";
  event_id: string;
  response_id: string;
  item_id: string;
}

export interface FunctionCallArgumentsDoneEvent {
  type: "response.function_call_arguments.done";
  event_id: string;
  name: string;
  call_id: string;
  arguments: string; // JSON string
}

export type ServerEvent =
  | SessionUpdatedEvent
  | ConversationCreatedEvent
  | SpeechStartedEvent
  | SpeechStoppedEvent
  | TranscriptionCompletedEvent
  | ConversationItemAddedEvent
  | ResponseCreatedEvent
  | ResponseDoneEvent
  | AudioTranscriptDeltaEvent
  | AudioTranscriptDoneEvent
  | AudioDeltaEvent
  | AudioDoneEvent
  | FunctionCallArgumentsDoneEvent;

/**
 * Fetch ephemeral token for client-side authentication
 * This should be called from the server and the token passed to the client
 */
export async function getEphemeralToken(expiresInSeconds: number = 300): Promise<{
  success: boolean;
  token?: string;
  expiresAt?: number;
  error?: string;
}> {
  if (!XAI_API_KEY) {
    return {
      success: false,
      error: "XAI_API_KEY is not configured",
    };
  }

  try {
    const response = await fetch(XAI_SESSION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { seconds: expiresInSeconds },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GrokVoice] Failed to get ephemeral token:", response.status, errorText);
      return {
        success: false,
        error: `Failed to get token: ${response.status}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      token: data.client_secret?.value || data.token,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    };
  } catch (error) {
    console.error("[GrokVoice] Error getting ephemeral token:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create default session configuration
 */
export function createDefaultSessionConfig(
  voice: VoiceOption = "Ara",
  instructions: string = "You are SOLtron, a helpful AI assistant for the Solana Robotics platform. You help users with trading, portfolio management, and robot control. Be concise and helpful."
): SessionUpdateEvent {
  return {
    type: "session.update",
    session: {
      voice,
      instructions,
      turn_detection: { type: "server_vad" },
      audio: {
        input: { format: { type: "audio/pcm", rate: 24000 } },
        output: { format: { type: "audio/pcm", rate: 24000 } },
      },
      tools: [
        { type: "web_search" },
        { type: "x_search" },
      ],
    },
  };
}

/**
 * Create session config with custom tools
 */
export function createSessionConfigWithTools(
  voice: VoiceOption,
  instructions: string,
  customTools: FunctionTool[]
): SessionUpdateEvent {
  return {
    type: "session.update",
    session: {
      voice,
      instructions,
      turn_detection: { type: "server_vad" },
      audio: {
        input: { format: { type: "audio/pcm", rate: 24000 } },
        output: { format: { type: "audio/pcm", rate: 24000 } },
      },
      tools: [
        { type: "web_search" },
        { type: "x_search" },
        ...customTools,
      ],
    },
  };
}

/**
 * Create a text message event
 */
export function createTextMessage(text: string): ConversationItemCreateEvent {
  return {
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text }],
    },
  };
}

/**
 * Create a function call response event
 */
export function createFunctionResponse(callId: string, output: unknown): ConversationItemCreateEvent {
  return {
    type: "conversation.item.create",
    item: {
      type: "function_call_output",
      call_id: callId,
      output: JSON.stringify(output),
    },
  };
}

/**
 * Create response request event
 */
export function createResponseRequest(): ResponseCreateEvent {
  return {
    type: "response.create",
  };
}

/**
 * Validate XAI API key is configured
 */
export function validateXaiConfig(): { valid: boolean; error?: string } {
  if (!XAI_API_KEY) {
    return {
      valid: false,
      error: "XAI_API_KEY environment variable is not set",
    };
  }

  return { valid: true };
}

/**
 * Get WebSocket URL for direct connection (server-side only)
 */
export function getWebSocketUrl(): string {
  return XAI_REALTIME_URL;
}

/**
 * Get WebSocket headers for server-side connection
 */
export function getWebSocketHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${XAI_API_KEY}`,
    "Content-Type": "application/json",
  };
}

// Custom function tools for Solana Robotics
export const SOLANA_ROBOTICS_TOOLS: FunctionTool[] = [
  {
    type: "function",
    name: "get_token_price",
    description: "Get the current price of $CLAWD token or any Solana token",
    parameters: {
      type: "object",
      properties: {
        token_address: {
          type: "string",
          description: "The Solana token mint address. Use 'CLAWD' for $CLAWD token.",
        },
      },
      required: ["token_address"],
    },
  },
  {
    type: "function",
    name: "get_portfolio",
    description: "Get the user's portfolio including token holdings and net worth",
    parameters: {
      type: "object",
      properties: {
        wallet_address: {
          type: "string",
          description: "The Solana wallet address to check",
        },
      },
      required: ["wallet_address"],
    },
  },
  {
    type: "function",
    name: "execute_trade",
    description: "Execute a token swap on Jupiter DEX",
    parameters: {
      type: "object",
      properties: {
        input_token: {
          type: "string",
          description: "The token to sell (address or symbol like SOL, USDC)",
        },
        output_token: {
          type: "string",
          description: "The token to buy (address or symbol)",
        },
        amount: {
          type: "number",
          description: "The amount of input token to swap",
        },
        slippage: {
          type: "number",
          description: "Maximum slippage percentage (default 1%)",
        },
      },
      required: ["input_token", "output_token", "amount"],
    },
  },
  {
    type: "function",
    name: "check_robot_status",
    description: "Check the status of a registered robot",
    parameters: {
      type: "object",
      properties: {
        robot_id: {
          type: "string",
          description: "The robot ID or name to check",
        },
      },
      required: ["robot_id"],
    },
  },
  {
    type: "function",
    name: "send_robot_command",
    description: "Send a command to a robot",
    parameters: {
      type: "object",
      properties: {
        robot_id: {
          type: "string",
          description: "The robot ID to command",
        },
        command: {
          type: "string",
          description: "The command to send (e.g., 'start', 'stop', 'status', 'trade')",
        },
        parameters: {
          type: "string",
          description: "Optional command parameters as JSON string",
        },
      },
      required: ["robot_id", "command"],
    },
  },
];
