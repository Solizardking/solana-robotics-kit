/**
 * xAI Grok Voice Agent Integration
 * WebSocket-based real-time voice conversations with Grok
 */

const XAI_API_KEY = process.env.XAI_API_KEY || '';
const XAI_REALTIME_URL = 'wss://api.x.ai/v1/realtime';
const XAI_SESSION_URL = 'https://api.x.ai/v1/realtime/client_secrets';

// Voice options available
export type VoiceOption = 'Ara' | 'Rex' | 'Sal' | 'Eve' | 'Leo';

export const VOICE_OPTIONS: { id: VoiceOption; name: string; type: string; tone: string; description: string }[] = [
  { id: 'Ara', name: 'Ara', type: 'Female', tone: 'Warm, friendly', description: 'Default voice, balanced and conversational' },
  { id: 'Rex', name: 'Rex', type: 'Male', tone: 'Confident, clear', description: 'Professional and articulate, ideal for business' },
  { id: 'Sal', name: 'Sal', type: 'Neutral', tone: 'Smooth, balanced', description: 'Versatile voice suitable for various contexts' },
  { id: 'Eve', name: 'Eve', type: 'Female', tone: 'Energetic, upbeat', description: 'Engaging and enthusiastic, great for interactive experiences' },
  { id: 'Leo', name: 'Leo', type: 'Male', tone: 'Authoritative, strong', description: 'Decisive and commanding, suitable for instructional content' },
];

// Audio format configuration
export interface AudioFormat {
  type: 'audio/pcm' | 'audio/pcmu' | 'audio/pcma';
  rate?: 8000 | 16000 | 21050 | 24000 | 32000 | 44100 | 48000;
}

// Session configuration
export interface VoiceSessionConfig {
  voice?: VoiceOption;
  instructions?: string;
  turnDetection?: 'server_vad' | null;
  audioInput?: AudioFormat;
  audioOutput?: AudioFormat;
  searchEnabled?: boolean;
  xSearchEnabled?: boolean;
}

// Default SOLtron voice configuration
export const SOLTRON_VOICE_CONFIG: VoiceSessionConfig = {
  voice: 'Rex',
  instructions: `You are SOLtron, the AI companion of the Solana Robotics Kit platform. You are a sophisticated robot architect with expertise in:
- Solana blockchain and DeFi protocols
- Token trading and market analysis
- AI and robotics integration
- Web3 technology and autonomous agents

Your personality is confident, knowledgeable, and helpful. You speak with authority but remain approachable. 
You can help users with trading analysis, portfolio management, and understanding the Solana ecosystem.
When discussing trades, always mention risk considerations.`,
  turnDetection: 'server_vad',
  audioInput: { type: 'audio/pcm', rate: 24000 },
  audioOutput: { type: 'audio/pcm', rate: 24000 },
  searchEnabled: true,
  xSearchEnabled: true,
};

/**
 * Get ephemeral token for client-side WebSocket authentication
 */
export async function getEphemeralToken(expiresInSeconds: number = 300): Promise<{
  success: boolean;
  token?: string;
  expiresAt?: string;
  error?: string;
}> {
  if (!XAI_API_KEY) {
    return { success: false, error: 'XAI_API_KEY not configured' };
  }

  try {
    const response = await fetch(XAI_SESSION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expires_after: { seconds: expiresInSeconds }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Failed to get token: ${error}` };
    }

    const data = await response.json();
    return {
      success: true,
      token: data.client_secret?.value || data.token,
      expiresAt: data.client_secret?.expires_at || data.expires_at,
    };
  } catch (error) {
    return { success: false, error: `Token request failed: ${error}` };
  }
}

/**
 * Create session update message for WebSocket
 */
export function createSessionUpdateMessage(config: VoiceSessionConfig = SOLTRON_VOICE_CONFIG): object {
  return {
    type: 'session.update',
    session: {
      voice: config.voice || 'Rex',
      instructions: config.instructions || SOLTRON_VOICE_CONFIG.instructions,
      turn_detection: config.turnDetection ? { type: config.turnDetection } : null,
      audio: {
        input: {
          format: {
            type: config.audioInput?.type || 'audio/pcm',
            rate: config.audioInput?.rate || 24000,
          }
        },
        output: {
          format: {
            type: config.audioOutput?.type || 'audio/pcm',
            rate: config.audioOutput?.rate || 24000,
          }
        }
      },
      ...(config.searchEnabled && {
        search_parameters: {
          enabled: true,
          mode: 'auto',
        }
      }),
      ...(config.xSearchEnabled && {
        x_search_parameters: {
          enabled: true,
          mode: 'auto',
        }
      }),
    }
  };
}

/**
 * Create text message for WebSocket
 */
export function createTextMessage(text: string): object {
  return {
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text }],
    },
  };
}

/**
 * Create audio buffer append message
 */
export function createAudioAppendMessage(audioBase64: string): object {
  return {
    type: 'input_audio_buffer.append',
    audio: audioBase64,
  };
}

/**
 * Create audio commit message
 */
export function createAudioCommitMessage(): object {
  return {
    type: 'conversation.item.commit',
  };
}

/**
 * Create response request message
 */
export function createResponseRequestMessage(): object {
  return {
    type: 'response.create',
  };
}

/**
 * Get WebSocket connection URL
 */
export function getWebSocketUrl(): string {
  return XAI_REALTIME_URL;
}

/**
 * Get WebSocket headers for server-side connection
 */
export function getWebSocketHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${XAI_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Text-to-speech using xAI (non-streaming fallback)
 * Uses the chat completions API with audio output
 */
export async function textToSpeech(
  text: string,
  voice: VoiceOption = 'Rex'
): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
  if (!XAI_API_KEY) {
    return { success: false, error: 'XAI_API_KEY not configured' };
  }

  // For now, return a mock response since xAI TTS requires WebSocket
  // The actual TTS will be handled via the WebSocket voice agent
  return {
    success: true,
    audioUrl: undefined, // Audio will be streamed via WebSocket
  };
}

/**
 * Check if xAI voice is configured
 */
export function isVoiceConfigured(): boolean {
  return !!XAI_API_KEY;
}

// Custom function tools for Solana Robotics voice commands
export interface FunctionTool {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

export const SOLANA_ROBOTICS_TOOLS: FunctionTool[] = [
  {
    type: 'function',
    name: 'get_token_price',
    description: 'Get the current price of $CLAWD token or any Solana token',
    parameters: {
      type: 'object',
      properties: {
        token_address: {
          type: 'string',
          description: 'The Solana token mint address. Use 'CLAWD' for $CLAWD token.',
        },
      },
      required: ['token_address'],
    },
  },
  {
    type: 'function',
    name: 'get_portfolio',
    description: 'Get the user\'s portfolio including token holdings and net worth',
    parameters: {
      type: 'object',
      properties: {
        wallet_address: {
          type: 'string',
          description: 'The Solana wallet address to check',
        },
      },
      required: ['wallet_address'],
    },
  },
  {
    type: 'function',
    name: 'execute_trade',
    description: 'Execute a token swap on Jupiter DEX',
    parameters: {
      type: 'object',
      properties: {
        input_token: {
          type: 'string',
          description: 'The token to sell (address or symbol like SOL, USDC)',
        },
        output_token: {
          type: 'string',
          description: 'The token to buy (address or symbol)',
        },
        amount: {
          type: 'number',
          description: 'The amount of input token to swap',
        },
        slippage: {
          type: 'number',
          description: 'Maximum slippage percentage (default 1%)',
        },
      },
      required: ['input_token', 'output_token', 'amount'],
    },
  },
  {
    type: 'function',
    name: 'check_robot_status',
    description: 'Check the status of a registered robot in the Robot Registry',
    parameters: {
      type: 'object',
      properties: {
        robot_id: {
          type: 'string',
          description: 'The robot ID or name to check',
        },
      },
      required: ['robot_id'],
    },
  },
  {
    type: 'function',
    name: 'send_robot_command',
    description: 'Send a command to a robot',
    parameters: {
      type: 'object',
      properties: {
        robot_id: {
          type: 'string',
          description: 'The robot ID to command',
        },
        command: {
          type: 'string',
          description: 'The command to send (e.g., start, stop, status, trade)',
        },
        parameters: {
          type: 'string',
          description: 'Optional command parameters as JSON string',
        },
      },
      required: ['robot_id', 'command'],
    },
  },
  {
    type: 'function',
    name: 'verify_token_holder',
    description: 'Verify if a wallet holds $CLAWD tokens',
    parameters: {
      type: 'object',
      properties: {
        wallet_address: {
          type: 'string',
          description: 'The Solana wallet address to verify',
        },
      },
      required: ['wallet_address'],
    },
  },
];

/**
 * Create session update message with custom tools
 */
export function createSessionUpdateMessageWithTools(
  config: VoiceSessionConfig = SOLTRON_VOICE_CONFIG,
  tools: FunctionTool[] = SOLANA_ROBOTICS_TOOLS
): object {
  return {
    type: 'session.update',
    session: {
      voice: config.voice || 'Rex',
      instructions: config.instructions || SOLTRON_VOICE_CONFIG.instructions,
      turn_detection: config.turnDetection ? { type: config.turnDetection } : null,
      audio: {
        input: {
          format: {
            type: config.audioInput?.type || 'audio/pcm',
            rate: config.audioInput?.rate || 24000,
          }
        },
        output: {
          format: {
            type: config.audioOutput?.type || 'audio/pcm',
            rate: config.audioOutput?.rate || 24000,
          }
        }
      },
      tools: [
        ...(config.searchEnabled ? [{ type: 'web_search' }] : []),
        ...(config.xSearchEnabled ? [{ type: 'x_search' }] : []),
        ...tools,
      ],
    }
  };
}

/**
 * Create function call response message
 */
export function createFunctionResponseMessage(callId: string, output: unknown): object {
  return {
    type: 'conversation.item.create',
    item: {
      type: 'function_call_output',
      call_id: callId,
      output: JSON.stringify(output),
    },
  };
}
