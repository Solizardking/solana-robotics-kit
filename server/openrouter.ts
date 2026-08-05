/**
 * OpenRouter API Integration
 * Multi-model AI for prompt enhancement and image generation
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Model configurations from environment variables
export const OPENROUTER_MODELS = {
  // Passport generation models
  GEMINI_FLASH: process.env.OPENROUTER_MODEL1 || 'google/gemini-3-flash-preview',
  FLUX_KLEIN: process.env.OPENROUTER_MODEL2 || 'black-forest-labs/flux.2-klein-4b',
  
  // Main AI model with reasoning (Claude Opus 4.7)
  MAIN_MODEL: process.env.OPENROUTER_MODELA || 'anthropic/claude-opus-4.7',
  
  // Multi-provider AI agent models
  CLAUDE_OPUS: process.env.OPENROUTER_MODELA || 'anthropic/claude-opus-4.7',
  MINIMAX: process.env.OPENROUTER_MODELB || 'minimax/minimax-m2.1',
  GEMINI_3_FLASH: process.env.OPENROUTER_MODELC || 'google/gemini-3-flash-preview',
  
  // Codex for code generation with reasoning
  CODEX: process.env.OPENROUTER_CODEX || 'openai/gpt-5.2-codex',
};

// Available models for the agent dropdown
export const AGENT_MODELS = [
  { id: 'main-model', name: 'Claude Opus 4.7 (Main)', model: OPENROUTER_MODELS.MAIN_MODEL, provider: 'Anthropic', isMain: true, supportsReasoning: true },
  { id: 'claude-opus', name: 'Claude Opus 4.5', model: OPENROUTER_MODELS.CLAUDE_OPUS, provider: 'Anthropic' },
  { id: 'minimax', name: 'Minimax M2.1', model: OPENROUTER_MODELS.MINIMAX, provider: 'Minimax' },
  { id: 'gemini', name: 'Gemini 3 Flash', model: OPENROUTER_MODELS.GEMINI_3_FLASH, provider: 'Google' },
  { id: 'codex', name: 'GPT-5.2 Codex', model: OPENROUTER_MODELS.CODEX, provider: 'OpenAI', isCodex: true },
];

// Default model selection
export const DEFAULT_AGENT_MODEL = 'main-model';

// Passport prompt templates
export const PASSPORT_PROMPT_TEMPLATE = `Create a detailed robot passport digital identity certificate in a cyberpunk-futuristic style. The design should include:

LAYOUT:
- Horizontal ID card format with a dark green/teal circuit board pattern border
- Left side: Text fields with monospace/terminal-style typography
- Right side: Robot character portrait in a photo-ID style frame
- Solana logo accents in corners

TEXT FIELDS (left side):
- Header: "ROBOT PASSPORT" in bold industrial font
- Subheader: "DIGITAL IDENTITY CERTIFICATE"
- ID: [ROBOT_ID]
- PUBKEY: [TRUNCATED_WALLET]
- OWNER: [OWNER_ADDRESS]
- TITLE: [ROBOT_TITLE]
- REPUTATION: [REPUTATION_SCORE]/100
- CAPABILITIES: {[CAPABILITIES_LIST]}
- Small circuit chip icon near the ID
- Green verification checkmark
- Barcode at bottom

ROBOT CHARACTER (right side):
- Half-mechanical, half-organic humanoid robot
- Exposed brain visible through transparent cranium section
- One glowing orange cybernetic eye, one regular eye
- Metallic skeleton/exoskeleton visible
- Holding a black bag with Solana gradient logo
- Text on bag: "[BAG_TEXT]"
- Industrial/steampunk aesthetic with cables and gears
- Red braided hair/cables flowing from back of head

STYLE:
- Color palette: dark greens, teals, metallic silvers, orange glows, Solana purple/green gradient accents
- Overall aesthetic: cyberpunk meets official government ID document
- Professional yet futuristic feeling
- High detail on mechanical components`;

export const COIN_BADGE_PROMPT_TEMPLATE = `Create a circular coin/badge design featuring a robot character in cyberpunk style:

LAYOUT:
- Perfectly circular metallic coin design
- Multiple concentric ring borders with beveled edges
- Central robot figure occupying 70% of the space
- Text banner at bottom

ROBOT CHARACTER:
- Same half-mechanical humanoid robot as passport
- Exposed brain, one glowing orange eye
- Holding black bag with Solana gradient logo
- Circuit board pattern in background
- Chip/processor icon in upper left

TEXT:
- Bottom banner: "$[TOKEN_TICKER]" in bold metallic letters
- Bag text: "[BAG_TEXT]"

STYLE:
- Metallic silver/chrome coin border
- Dark teal/green background inside coin
- High contrast, collectible coin aesthetic
- Transparent/white background outside coin circle`;

export interface PassportFormData {
  robotId: string;
  pubkey: string;
  owner: string;
  title: string;
  reputation: string;
  capabilities: string;
  bagText: string;
  tokenTicker: string;
  customPromptAdditions?: string;
}

export interface ImageSettings {
  quality: 'low' | 'medium' | 'high';
  size: '1024x1024' | '1536x1024' | '1024x1536';
  background: 'opaque' | 'transparent';
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

/**
 * Check if OpenRouter API key is configured
 */
export function isOpenRouterConfigured(): boolean {
  return !!OPENROUTER_API_KEY && OPENROUTER_API_KEY.length > 10;
}

/**
 * Generate enhanced prompt using Gemini 3 Flash via OpenRouter
 */
export async function enhancePromptWithGemini(
  basePrompt: string,
  customAdditions?: string
): Promise<{ content: string; usage?: { total_tokens: number } } | null> {
  if (!OPENROUTER_API_KEY) {
    console.log('[OpenRouter] API key not configured, returning mock response');
    return {
      content: basePrompt + (customAdditions ? `\n\nAdditional: ${customAdditions}` : ''),
      usage: { total_tokens: 0 },
    };
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://solanarobotics.io',
        'X-Title': 'Solana Robotics Kit',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODELS.GEMINI_FLASH,
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI image prompt engineer specializing in creating detailed, photorealistic image generation prompts. Your prompts should be highly detailed, specific about composition, lighting, colors, textures, and style. Always output ONLY the optimized prompt text, no explanations or preamble.',
          },
          {
            role: 'user',
            content: `Enhance and optimize this image generation prompt for maximum quality and detail. Make it more vivid and specific while maintaining all the core elements. Add specific artistic style references, lighting descriptions, and material textures.

BASE PROMPT:
${basePrompt}

${customAdditions ? `ADDITIONAL REQUIREMENTS:\n${customAdditions}` : ''}

Output ONLY the enhanced prompt, nothing else.`,
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[OpenRouter] Gemini error:', errorData);
      return null;
    }

    const result = await response.json();
    return {
      content: result.choices[0].message.content,
      usage: result.usage,
    };
  } catch (error: any) {
    console.error('[OpenRouter] Gemini request failed:', error.message);
    return null;
  }
}

/**
 * Fill passport prompt template with form data
 */
export function fillPassportPrompt(
  type: 'passport' | 'coin',
  formData: PassportFormData
): string {
  const template = type === 'passport' ? PASSPORT_PROMPT_TEMPLATE : COIN_BADGE_PROMPT_TEMPLATE;
  
  return template
    .replace('[ROBOT_ID]', formData.robotId)
    .replace('[TRUNCATED_WALLET]', formData.pubkey)
    .replace('[OWNER_ADDRESS]', formData.owner)
    .replace('[ROBOT_TITLE]', formData.title)
    .replace('[REPUTATION_SCORE]', formData.reputation)
    .replace('[CAPABILITIES_LIST]', formData.capabilities)
    .replace(/\[BAG_TEXT\]/g, formData.bagText)
    .replace('[TOKEN_TICKER]', formData.tokenTicker);
}

/**
 * Edit image using Flux 2 Klein via OpenRouter
 */
export async function editImageWithFlux(
  imageUrl: string,
  editInstructions: string
): Promise<{ imageUrl: string } | null> {
  if (!OPENROUTER_API_KEY) {
    console.log('[OpenRouter] API key not configured for image editing');
    return null;
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://solanarobotics.io',
        'X-Title': 'Solana Robotics Kit',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODELS.FLUX_KLEIN,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Edit this image with the following instructions: ${editInstructions}`,
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[OpenRouter] Flux error:', errorData);
      return null;
    }

    const result = await response.json();
    const message = result.choices[0].message;

    if (message.images && message.images.length > 0) {
      return { imageUrl: message.images[0].image_url.url };
    }

    return null;
  } catch (error: any) {
    console.error('[OpenRouter] Flux request failed:', error.message);
    return null;
  }
}

/**
 * List available models from OpenRouter
 */
export async function listOpenRouterModels(): Promise<any[] | null> {
  if (!OPENROUTER_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data || [];
  } catch (error: any) {
    console.error('[OpenRouter] List models failed:', error.message);
    return null;
  }
}

/**
 * Get OpenRouter API key status
 */
export async function getOpenRouterStatus(): Promise<{
  configured: boolean;
  valid: boolean;
  models: string[];
}> {
  if (!OPENROUTER_API_KEY) {
    return { configured: false, valid: false, models: [] };
  }

  const models = await listOpenRouterModels();
  return {
    configured: true,
    valid: models !== null,
    models: [OPENROUTER_MODELS.GEMINI_FLASH, OPENROUTER_MODELS.FLUX_KLEIN],
  };
}


/**
 * Multi-provider chat message type
 */
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  reasoning_details?: unknown; // For Codex reasoning preservation
}

/**
 * Chat with a specific model via OpenRouter
 * Supports Claude Opus 4.5, Minimax M2.1, Gemini 3 Flash
 */
export async function chatWithAgent(
  messages: AgentMessage[],
  modelId: string = 'claude-opus',
  options?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
): Promise<{ content: string; model: string; reasoning_details?: unknown } | null> {
  if (!OPENROUTER_API_KEY) {
    console.warn('[OpenRouter] API key not configured');
    return null;
  }

  const selectedModel = AGENT_MODELS.find(m => m.id === modelId);
  if (!selectedModel) {
    console.error('[OpenRouter] Invalid model ID:', modelId);
    return null;
  }

  try {
    const systemMessage = options?.systemPrompt ? [{
      role: 'system' as const,
      content: options.systemPrompt,
    }] : [];

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://solanarobotics.io',
        'X-Title': 'Solana Robotics Kit',
      },
      body: JSON.stringify({
        model: selectedModel.model,
        messages: [...systemMessage, ...messages],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[OpenRouter] Chat error:', errorData);
      return null;
    }

    const result = await response.json();
    const message = result.choices[0].message;

    return {
      content: message.content,
      model: selectedModel.name,
      reasoning_details: message.reasoning_details,
    };
  } catch (error: any) {
    console.error('[OpenRouter] Chat request failed:', error.message);
    return null;
  }
}

/**
 * Chat with vision capability (Claude Opus 4.5)
 * Supports image analysis
 */
export async function chatWithVision(
  prompt: string,
  imageUrl: string,
  modelId: string = 'claude-opus'
): Promise<{ content: string; model: string } | null> {
  if (!OPENROUTER_API_KEY) {
    console.warn('[OpenRouter] API key not configured');
    return null;
  }

  const selectedModel = AGENT_MODELS.find(m => m.id === modelId);
  if (!selectedModel) {
    console.error('[OpenRouter] Invalid model ID:', modelId);
    return null;
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://solanarobotics.io',
        'X-Title': 'Solana Robotics Kit',
      },
      body: JSON.stringify({
        model: selectedModel.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[OpenRouter] Vision error:', errorData);
      return null;
    }

    const result = await response.json();
    return {
      content: result.choices[0].message.content,
      model: selectedModel.name,
    };
  } catch (error: any) {
    console.error('[OpenRouter] Vision request failed:', error.message);
    return null;
  }
}

/**
 * Codex coding with reasoning support
 * Uses GPT-5.2-Codex for code generation with step-by-step reasoning
 */
export interface CodexResponse {
  content: string;
  reasoning_details?: unknown;
  model: string;
}

export async function codeWithCodex(
  messages: AgentMessage[],
  options?: {
    reasoning?: boolean;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<CodexResponse | null> {
  if (!OPENROUTER_API_KEY) {
    console.warn('[OpenRouter] API key not configured');
    return null;
  }

  try {
    const requestBody: any = {
      model: OPENROUTER_MODELS.CODEX,
      messages: messages.map(m => {
        const msg: { role: string; content: string; reasoning_details?: unknown } = {
          role: m.role,
          content: m.content,
        };
        if (m.reasoning_details) {
          msg.reasoning_details = m.reasoning_details;
        }
        return msg;
      }),
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 8192,
    };

    // Enable reasoning if requested
    if (options?.reasoning !== false) {
      requestBody.reasoning = { enabled: true };
    }

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://solanarobotics.io',
        'X-Title': 'Solana Robotics Kit',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[OpenRouter] Codex error:', errorData);
      return null;
    }

    const result = await response.json();
    const message = result.choices[0].message;

    return {
      content: message.content,
      reasoning_details: message.reasoning_details,
      model: 'GPT-5.2 Codex',
    };
  } catch (error: any) {
    console.error('[OpenRouter] Codex request failed:', error.message);
    return null;
  }
}

/**
 * Get list of available agent models
 */
export function getAgentModels() {
  return AGENT_MODELS;
}

/**
 * Trading agent system prompt
 */
export const TRADING_AGENT_SYSTEM_PROMPT = `You are an advanced AI trading assistant for the Solana Robotics Kit platform. You specialize in:

1. **Token Analysis**: Analyze Solana tokens, meme coins, and DeFi protocols
2. **Trading Strategies**: Provide trading insights, entry/exit points, and risk management
3. **Market Intelligence**: Monitor trends, whale movements, and social sentiment
4. **Technical Analysis**: Chart patterns, indicators, and price action analysis
5. **On-chain Data**: Interpret blockchain data, holder distribution, and liquidity metrics

You have access to real-time data from Birdeye, Helius, and Jupiter APIs. Always provide actionable insights with clear reasoning.

When discussing $KIT (Solana Robotics Kit token):
- Address: DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS
- Focus on the robotics and AI narrative
- Consider the meme coin dynamics and community sentiment

Be concise, data-driven, and always include risk disclaimers for trading advice.`;

/**
 * Coding agent system prompt
 */
export const CODING_AGENT_SYSTEM_PROMPT = `You are an expert coding assistant for the Solana Robotics Kit platform. You specialize in:

1. **Solana Development**: Anchor, SPL tokens, PDAs, CPIs
2. **Web3 Integration**: Wallet adapters, transaction signing, RPC calls
3. **TypeScript/React**: Modern frontend development with tRPC
4. **AI Integration**: LLM APIs, embeddings, vector databases
5. **Robotics**: ROS2, NVIDIA NIM, GR00T integration

When generating code:
- Use TypeScript with proper types
- Follow best practices and security guidelines
- Include error handling and edge cases
- Provide clear explanations of the code

Think step-by-step and explain your reasoning process.`;
