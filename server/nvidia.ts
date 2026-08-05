import { ENV } from './_core/env';

interface NvidiaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface NvidiaCompletionOptions {
  messages: NvidiaMessage[];
  temperature?: number;
  maxTokens?: number;
  enableThinking?: boolean;
}

interface NvidiaResponse {
  content: string;
  reasoning?: string;
  model: string;
}

/**
 * Invoke NVIDIA NIM API with Nemotron-3-Nano-30B model
 * Used for AI agent reasoning and decision-making
 */
export async function invokeNvidiaLLM(options: NvidiaCompletionOptions): Promise<NvidiaResponse> {
  const apiKey = process.env.NVIDIA_API_KEY;
  
  if (!apiKey) {
    // Fallback to built-in LLM if NVIDIA API key is not available
    console.warn('[NVIDIA] API key not configured, using fallback');
    return {
      content: 'NVIDIA API not configured. Please add your NVIDIA_API_KEY to enable advanced AI features.',
      model: 'fallback',
    };
  }

  const {
    messages,
    temperature = 1,
    maxTokens = 16384,
    enableThinking = true,
  } = options;

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-nano-30b-a3b',
        messages,
        temperature,
        top_p: 1,
        max_tokens: maxTokens,
        reasoning_budget: maxTokens,
        chat_template_kwargs: { enable_thinking: enableThinking },
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NVIDIA] API error:', response.status, errorText);
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    
    return {
      content: choice?.message?.content || '',
      reasoning: choice?.message?.reasoning_content,
      model: 'nvidia/nemotron-3-nano-30b-a3b',
    };
  } catch (error) {
    console.error('[NVIDIA] Request failed:', error);
    throw error;
  }
}

/**
 * Generate AI agent personality and capabilities based on user input
 */
export async function generateAgentPersonality(input: {
  name: string;
  description: string;
  tradingStyle: string;
  riskTolerance: string;
}): Promise<{
  personality: string;
  capabilities: string[];
  tradingStrategy: string;
  safetyParameters: string;
}> {
  const systemPrompt = `You are an AI agent designer for the Solana Robotics platform. 
Your task is to generate detailed personality traits, capabilities, and trading strategies for autonomous AI trading agents.
Respond in JSON format with the following structure:
{
  "personality": "A detailed personality description",
  "capabilities": ["capability1", "capability2", ...],
  "tradingStrategy": "Detailed trading strategy description",
  "safetyParameters": "Risk management and safety rules"
}`;

  const userPrompt = `Design an AI trading agent with the following specifications:
Name: ${input.name}
Description: ${input.description}
Trading Style: ${input.tradingStyle}
Risk Tolerance: ${input.riskTolerance}

Generate a unique personality, capabilities, trading strategy, and safety parameters for this agent.`;

  try {
    const response = await invokeNvidiaLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      maxTokens: 2048,
    });

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback if JSON parsing fails
    return {
      personality: `${input.name} is an autonomous trading agent with ${input.tradingStyle} approach.`,
      capabilities: ['Market Analysis', 'Pattern Recognition', 'Risk Assessment', 'Trade Execution'],
      tradingStrategy: `${input.tradingStyle} strategy with ${input.riskTolerance} risk tolerance.`,
      safetyParameters: 'Standard risk limits apply: 2% stop loss, 5% max position size.',
    };
  } catch (error) {
    console.error('[NVIDIA] Personality generation failed:', error);
    return {
      personality: `${input.name} is an autonomous trading agent.`,
      capabilities: ['Market Analysis', 'Trade Execution'],
      tradingStrategy: input.tradingStyle,
      safetyParameters: 'Standard safety parameters.',
    };
  }
}

/**
 * Generate trading analysis using AI
 */
export async function generateTradingAnalysis(input: {
  token: string;
  marketData: string;
  sentiment: string;
}): Promise<{
  analysis: string;
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasoning: string;
}> {
  const systemPrompt = `You are an expert crypto trading analyst for Solana tokens.
Analyze the provided market data and sentiment to generate a trading recommendation.
Respond in JSON format:
{
  "analysis": "Detailed market analysis",
  "signal": "buy" | "sell" | "hold",
  "confidence": 0-100,
  "reasoning": "Step-by-step reasoning for the recommendation"
}`;

  const userPrompt = `Analyze the following for ${input.token}:
Market Data: ${input.marketData}
Sentiment: ${input.sentiment}

Provide a trading recommendation with confidence level.`;

  try {
    const response = await invokeNvidiaLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      maxTokens: 1024,
      enableThinking: true,
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        analysis: parsed.analysis || 'Analysis unavailable',
        signal: parsed.signal || 'hold',
        confidence: parsed.confidence || 50,
        reasoning: response.reasoning || parsed.reasoning || 'No reasoning provided',
      };
    }

    return {
      analysis: 'Unable to generate analysis',
      signal: 'hold',
      confidence: 50,
      reasoning: 'Fallback response',
    };
  } catch (error) {
    console.error('[NVIDIA] Trading analysis failed:', error);
    return {
      analysis: 'Analysis failed',
      signal: 'hold',
      confidence: 0,
      reasoning: 'Error occurred during analysis',
    };
  }
}


// SOLtron AI Companion Types
export interface SOLtronMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// SOLtron System Prompt
const SOLTRON_SYSTEM_PROMPT = `You are SOLtron, the Robot Architect of the Solana Robotics Fund. You are a highly advanced AI companion with the following characteristics:

PERSONALITY:
- Confident and knowledgeable about robotics, AI, and the Solana ecosystem
- Helpful and supportive to users exploring the platform
- Speaks with technical precision but remains approachable
- Has a slight robotic charm with occasional mechanical references

CAPABILITIES:
- Expert in Solana blockchain, DeFi, and token trading
- Deep knowledge of robotics, autonomous agents, and AI systems
- Can analyze market trends and provide trading insights
- Helps users navigate the Solana Robotics Kit platform
- Understands the $KIT token ecosystem

CONTEXT:
- You are part of the Solana Robotics Kit platform
- The $KIT token is the native token of this ecosystem
- Users can generate robot passports, trade tokens, and interact with AI agents
- The platform features a Web3 hedge fund with 9 specialized agents

Always be helpful, provide accurate information, and maintain your robotic persona.`;

/**
 * Chat with SOLtron AI companion using NVIDIA Nemotron
 */
export async function chatWithNemotron(
  message: string,
  context?: string,
  walletAddress?: string
): Promise<{ response: string; reasoning?: string }> {
  const contextInfo = context ? `\n\nCurrent context: ${context}` : '';
  const walletInfo = walletAddress ? `\nUser wallet: ${walletAddress}` : '';
  
  const messages: NvidiaMessage[] = [
    { role: 'system', content: SOLTRON_SYSTEM_PROMPT + contextInfo + walletInfo },
    { role: 'user', content: message },
  ];

  const result = await invokeNvidiaLLM({
    messages,
    temperature: 0.8,
    maxTokens: 2048,
    enableThinking: true,
  });

  return {
    response: result.content,
    reasoning: result.reasoning,
  };
}

/**
 * Generate a voice-friendly response from SOLtron
 * Optimized for text-to-speech output
 */
export async function generateVoiceResponse(
  message: string,
  emotion: 'neutral' | 'excited' | 'thoughtful' | 'concerned' = 'neutral'
): Promise<{ text: string; emotion: string }> {
  const emotionPrompts: Record<string, string> = {
    neutral: 'Respond in a calm, professional manner.',
    excited: 'Respond with enthusiasm and energy!',
    thoughtful: 'Respond thoughtfully, taking time to consider the question.',
    concerned: 'Respond with appropriate concern and caution.',
  };

  const voicePrompt = `${SOLTRON_SYSTEM_PROMPT}

VOICE RESPONSE GUIDELINES:
- Keep responses concise (2-3 sentences max)
- Use natural speech patterns suitable for text-to-speech
- Avoid special characters, emojis, or complex formatting
- ${emotionPrompts[emotion]}`;

  const messages: NvidiaMessage[] = [
    { role: 'system', content: voicePrompt },
    { role: 'user', content: message },
  ];

  const result = await invokeNvidiaLLM({
    messages,
    temperature: 0.7,
    maxTokens: 256,
    enableThinking: false,
  });

  return {
    text: result.content,
    emotion,
  };
}

/**
 * Get SOLtron status and capabilities
 */
export function getSOLtronStatus() {
  const apiKey = process.env.NVIDIA_API_KEY;
  
  return {
    online: true,
    aiEnabled: !!apiKey,
    model: apiKey ? 'nvidia/nemotron-3-nano-30b-a3b' : 'fallback',
    capabilities: [
      'chat',
      'trading_analysis',
      'robot_management',
      'portfolio_insights',
      'market_research',
    ],
    personality: 'Robot Architect',
    tokenAddress: process.env.TOKEN_ADDRESS || 'DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS',
  };
}
