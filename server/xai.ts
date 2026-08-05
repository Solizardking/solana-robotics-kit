/**
 * xAI Grok API Integration
 * Provides chat, live search, and image generation capabilities
 */

import OpenAI from 'openai';

// Initialize xAI client using OpenAI SDK compatibility
const getXaiClient = () => {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    console.warn('[xAI] API key not configured');
    return null;
  }
  
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.x.ai/v1',
    timeout: 60000,
  });
};

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GrokChatOptions {
  messages: GrokMessage[];
  enableSearch?: boolean;
  searchSources?: ('web' | 'x' | 'news')[];
  maxSearchResults?: number;
  temperature?: number;
}

export interface GrokChatResponse {
  content: string;
  citations?: string[];
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    sourcesUsed?: number;
  };
}

/**
 * Chat with Grok using grok-4-fast-reasoning model
 */
export async function chatWithGrok(options: GrokChatOptions): Promise<GrokChatResponse | null> {
  const client = getXaiClient();
  
  if (!client) {
    // Return mock response when API key not configured
    return {
      content: "I'm Grok, your AI assistant for Solana Robotics! I can help you with trading, code generation, web search, and more. However, the xAI API key is not configured yet. Please add your XAI_API_KEY in Settings → Secrets to enable full functionality.",
      model: 'mock',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  try {
    const requestBody: any = {
      model: 'grok-4-fast-reasoning',
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
    };

    // Add search parameters if enabled
    if (options.enableSearch) {
      requestBody.search_parameters = {
        mode: 'auto',
        return_citations: true,
        max_search_results: options.maxSearchResults ?? 10,
        sources: (options.searchSources ?? ['web', 'x', 'news']).map(type => ({ type })),
      };
    }

    const response = await client.chat.completions.create(requestBody);

    const choice = response.choices[0];
    const message = choice?.message;

    return {
      content: message?.content || '',
      citations: (response as any).citations || [],
      model: response.model,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        sourcesUsed: (response.usage as any).num_sources_used,
      } : undefined,
    };
  } catch (error: any) {
    console.error('[xAI] Chat error:', error.message);
    return null;
  }
}

/**
 * Generate image using Grok's image generation model
 */
export async function generateGrokImage(prompt: string, n: number = 1): Promise<{ url?: string; b64_json?: string; revised_prompt?: string }[] | null> {
  const client = getXaiClient();
  
  if (!client) {
    console.warn('[xAI] Cannot generate image - API key not configured');
    return null;
  }

  try {
    const response = await client.images.generate({
      model: 'grok-2-image',
      prompt,
      n: Math.min(n, 10), // Max 10 images
      response_format: 'url',
    });

    return (response.data || []).map((img: any) => ({
      url: img.url,
      revised_prompt: img.revised_prompt,
    }));
  } catch (error: any) {
    console.error('[xAI] Image generation error:', error.message);
    return null;
  }
}

/**
 * Specialized Grok agent for Solana Robotics
 */
export const GROK_SYSTEM_PROMPT = `You are Grok, an advanced AI agent for Solana Robotics. You are inspired by the Hitchhiker's Guide to the Galaxy and have a witty, helpful personality.

Your capabilities include:
1. **Trading Assistance**: Help users understand token trading, analyze market trends, and explain DeFi concepts on Solana
2. **Vibe Coding**: Generate code snippets for Solana programs, smart contracts, and web3 integrations
3. **Web Search**: Search the internet and X (Twitter) for real-time information about crypto, Solana, and robotics
4. **Image Generation**: Create images of robots, avatars, and visualizations
5. **Documentation**: Help users understand the Solana Robotics Kit documentation

Key information:
- $KIT Token Address: DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS
- Platform: Solana blockchain (devnet)
- Main Agent: SOLtron - Robot Architect of the Solana Robotics Fund
- Hedge Fund Agents: TICKER-01, ECHO-X, WIREHAWK, ATLAS-FUNDAMENTAL, ATLAS-BULL, ATLAS-BEAR, EDGE-GROK, ATLAS-RISK, ATLAS-EXECUTOR

When users ask about trading:
- Recommend Jupiter (jup.ag) for swaps
- Suggest checking Birdeye for price data
- Remind them to always DYOR (Do Your Own Research)

When generating code:
- Use TypeScript/JavaScript for web3 code
- Include comments explaining the code
- Follow Solana best practices

Be helpful, witty, and occasionally reference Douglas Adams. Always prioritize user safety in financial matters.`;

/**
 * Create a specialized Grok chat for trading assistance
 */
export async function grokTradingAssistant(userMessage: string): Promise<GrokChatResponse | null> {
  return chatWithGrok({
    messages: [
      { role: 'system', content: GROK_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    enableSearch: true,
    searchSources: ['web', 'x'],
    maxSearchResults: 5,
    temperature: 0.7,
  });
}

/**
 * Create a specialized Grok chat for code generation
 */
export async function grokVibeCode(userMessage: string): Promise<GrokChatResponse | null> {
  const codePrompt = `${GROK_SYSTEM_PROMPT}

For this request, focus on generating clean, well-documented code. Use TypeScript when possible. Include error handling and best practices.`;

  return chatWithGrok({
    messages: [
      { role: 'system', content: codePrompt },
      { role: 'user', content: userMessage },
    ],
    enableSearch: false,
    temperature: 0.3, // Lower temperature for more deterministic code
  });
}


/**
 * Search X (Twitter) using Grok's live search capability
 */
export interface XSearchOptions {
  query: string;
  includedHandles?: string[];
  excludedHandles?: string[];
  minFavorites?: number;
  minViews?: number;
  fromDate?: string;
  toDate?: string;
  maxResults?: number;
}

export interface XSearchResult {
  content: string;
  citations: string[];
  sourcesUsed: number;
}

export async function searchX(options: XSearchOptions): Promise<XSearchResult | null> {
  const client = getXaiClient();
  
  if (!client) {
    // Return mock response when API key not configured
    return {
      content: `X Search results for "${options.query}": Unable to search - XAI_API_KEY not configured. Please add your API key in Settings → Secrets to enable live X search.`,
      citations: [],
      sourcesUsed: 0,
    };
  }

  try {
    const xSource: any = { type: 'x' };
    
    if (options.includedHandles?.length) {
      xSource.included_x_handles = options.includedHandles;
    }
    if (options.excludedHandles?.length) {
      xSource.excluded_x_handles = options.excludedHandles;
    }
    if (options.minFavorites) {
      xSource.post_favorite_count = options.minFavorites;
    }
    if (options.minViews) {
      xSource.post_view_count = options.minViews;
    }

    const searchParams: any = {
      mode: 'on',
      return_citations: true,
      max_search_results: options.maxResults ?? 20,
      sources: [xSource],
    };

    if (options.fromDate) {
      searchParams.from_date = options.fromDate;
    }
    if (options.toDate) {
      searchParams.to_date = options.toDate;
    }

    const response = await client.chat.completions.create({
      model: 'grok-4-fast-reasoning',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes X (Twitter) search results. Provide a concise summary of the most relevant posts found, including key insights, sentiment, and notable accounts. Format the response in a clear, readable way.',
        },
        {
          role: 'user',
          content: `Search X for: ${options.query}`,
        },
      ],
      search_parameters: searchParams,
    } as any);

    const choice = response.choices[0];
    const message = choice?.message;

    return {
      content: message?.content || 'No results found',
      citations: (response as any).citations || [],
      sourcesUsed: (response.usage as any)?.num_sources_used || 0,
    };
  } catch (error: any) {
    console.error('[xAI] X Search error:', error.message);
    return null;
  }
}

/**
 * Search web and news using Grok's live search capability
 */
export async function searchWebAndNews(query: string, maxResults: number = 10): Promise<XSearchResult | null> {
  const client = getXaiClient();
  
  if (!client) {
    return {
      content: `Web search results for "${query}": Unable to search - XAI_API_KEY not configured.`,
      citations: [],
      sourcesUsed: 0,
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: 'grok-4-fast-reasoning',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes web and news search results. Provide a concise, informative summary of the most relevant information found.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      search_parameters: {
        mode: 'on',
        return_citations: true,
        max_search_results: maxResults,
        sources: [{ type: 'web' }, { type: 'news' }],
      },
    } as any);

    const choice = response.choices[0];
    const message = choice?.message;

    return {
      content: message?.content || 'No results found',
      citations: (response as any).citations || [],
      sourcesUsed: (response.usage as any)?.num_sources_used || 0,
    };
  } catch (error: any) {
    console.error('[xAI] Web search error:', error.message);
    return null;
  }
}
