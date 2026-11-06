import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getRobots, 
  getRobotById, 
  createRobot,
  getAvatars,
  getAvatarById,
  createAvatar,
  getUserAvatars,
  getAgents,
  getAgentById,
  getTrades,
  getAgentTrades,
  createTrade,
  getBets,
  getUserBets,
  createBet,
  getArenaLeaderboard,
  getHedgeFundStats,
  createChatSession,
  getChatSession,
  getUserChatSessions,
  updateChatSessionTitle,
  deleteChatSession,
  addChatMessage,
  getChatMessages,
  getRecentChatMessages,
} from "./db";
import { generateAgentPersonality, generateTradingAnalysis } from "./nvidia";
import { chatWithAssistant, listAssistantFiles } from "./pinecone";
import { getTokenPrice, getTokenOverview, getTokenPriceHistory, getTokenOHLCV, getTrendingTokens, getMemeTokenDetail, getRealTimePrice, CLAWD_TOKEN, CLAWD_TOKEN_ADDRESS } from "./birdeye";
import { verifyTokenHolding, getWalletTokens, getWalletTransactions, CLAWD_TOKEN as HELIUS_CLAWD_TOKEN } from "./helius";
import { getDocumentationPDFs, getGraphicsAssets, getAllDocumentationAssets, getAssetUrl, R2_CONFIG } from "./cloudflare";
import { chatWithGrok, generateGrokImage, grokTradingAssistant, grokVibeCode, searchX, searchWebAndNews, GROK_SYSTEM_PROMPT, type GrokMessage } from "./xai";
import { vibeCode, getVibeModels, getCodeModes, getCodeLanguages, isVibeStudioConfigured, type CodeMode, type CodeLanguage, type VibeModelId } from "./vibe-studio";
import {
  getTreeInfo,
  getAssetsByOwner as getMetaplexAssetsByOwner,
  getAssetsByCollection,
  getAssetById,
  generateRobotPassportMetadata,
  prepareCreateTreeTransaction,
  prepareMintTransaction,
  isValidPublicKey,
  getTreeCostEstimate,
  isMetaplexConfigured,
  getUmiConfig,
  TREE_CONFIG,
  type RobotPassportMetadata,
} from "./metaplex-bubblegum";
import { enhancePromptWithGemini, fillPassportPrompt, editImageWithFlux, isOpenRouterConfigured, chatWithAgent, codeWithCodex, chatWithVision, getAgentModels, TRADING_AGENT_SYSTEM_PROMPT, CODING_AGENT_SYSTEM_PROMPT, type PassportFormData, type ImageSettings, type AgentMessage } from "./openrouter";
import { generateImage as generateOpenAIImage } from "./_core/imageGeneration";
import { getQuote, buildSwapTransaction, getTokenPrice as getJupiterPrice, parseTradeIntent, formatQuoteForDisplay, TOKENS, toSmallestUnit, fromSmallestUnit, type QuoteResponse } from "./jupiter-trade";
import { verifyTokenHolder, getAssetsByOwner, getTokenMetadata, type TokenVerificationResult } from "./helius-das";
import { getWalletNetWorthDetails, getWalletPnL, getWalletPortfolio, getWalletNetWorthChart, getWalletTokenPnL, type WalletPortfolioData } from "./birdeye-wallet";
import { chatWithNemotron, generateVoiceResponse, getSOLtronStatus, type SOLtronMessage } from "./nvidia";
import { getEphemeralToken, VOICE_OPTIONS, SOLTRON_VOICE_CONFIG, createSessionUpdateMessage, isVoiceConfigured, type VoiceOption } from "./xai-voice";
import { uploadModel, deleteModel, listUserModels, getModelInfo, isValidModelFile, SUPPORTED_EXTENSIONS, MAX_FILE_SIZE } from "./supabase-storage";
import * as bagsApi from "./bags-api";
import * as pumpfunSdk from "./pumpfun-sdk";
import * as pumpSdkOfficial from "./pump-sdk-official";
import { models3d } from "../drizzle/schema";
import {
  savePumpfunTrade,
  getPumpfunTrades,
  getPumpfunTradeBySignature,
  updatePumpfunTradeStatus,
  getPumpfunTradeStats,
  createPriceAlert,
  getPriceAlerts,
  getPriceAlertById,
  updatePriceAlert,
  deletePriceAlert,
  getActiveAlertsForToken,
  getAllActiveAlerts,
  saveBondingCurveSnapshot,
  getLatestBondingCurveSnapshot,
  getBondingCurveHistory,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { getDb } from "./db";
import {
  getTokenAccounts,
  getClosableAccounts,
  calculateReclaimableSol,
  prepareCloseAccountsTransaction,
  prepareBurnTokensTransaction,
  isBurnServiceConfigured,
  getBurnServiceConfig,
  getTokenAccountRent,
  isValidPublicKey as isValidBurnPublicKey,
} from "./burn-accounts";
import { clawdBrainRouter } from "./clawd-brain-router";

export const appRouter = router({
  clawdBrain: clawdBrainRouter,
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Robot Registry
  robots: router({
    list: publicProcedure
      .input(z.object({
        type: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getRobots(input);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getRobotById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        codename: z.string().min(1),
        type: z.string(),
        description: z.string(),
        platform: z.string(),
        computeTops: z.number(),
        powerConsumption: z.string(),
        capabilities: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        return createRobot({
          ...input,
          ownerId: ctx.user.id,
        });
      }),
  }),

  // GR00T Avatars
  avatars: router({
    list: publicProcedure.query(async () => {
      return getAvatars();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getAvatarById(input.id);
      }),
    
    getUserAvatars: protectedProcedure.query(async ({ ctx }) => {
      return getUserAvatars(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string(),
        colorScheme: z.string(),
        tradingStyle: z.string(),
        riskTolerance: z.string(),
        capabilities: z.array(z.string()),
        safetyLevel: z.number().min(1).max(5),
      }))
      .mutation(async ({ ctx, input }) => {
        // Generate AI personality using NVIDIA API
        const aiGenerated = await generateAgentPersonality({
          name: input.name,
          description: input.description,
          tradingStyle: input.tradingStyle,
          riskTolerance: input.riskTolerance,
        });

        return createAvatar({
          ...input,
          userId: ctx.user.id,
          personality: aiGenerated.personality,
          aiCapabilities: aiGenerated.capabilities,
          tradingStrategy: aiGenerated.tradingStrategy,
          safetyParameters: aiGenerated.safetyParameters,
        });
      }),
    
    generatePersonality: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string(),
        tradingStyle: z.string(),
        riskTolerance: z.string(),
      }))
      .mutation(async ({ input }) => {
        return generateAgentPersonality(input);
      }),
  }),

  // Hedge Fund Agents
  agents: router({
    list: publicProcedure.query(async () => {
      return getAgents();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getAgentById(input.id);
      }),
    
    analyze: protectedProcedure
      .input(z.object({
        token: z.string(),
        marketData: z.string(),
        sentiment: z.string(),
      }))
      .mutation(async ({ input }) => {
        return generateTradingAnalysis(input);
      }),
  }),

  // Trade Feed
  trades: router({
    list: publicProcedure
      .input(z.object({
        agentId: z.number().optional(),
        type: z.enum(['buy', 'sell']).optional(),
        limit: z.number().default(50),
      }).optional())
      .query(async ({ input }) => {
        return getTrades(input);
      }),
    
    getByAgent: publicProcedure
      .input(z.object({ agentId: z.number() }))
      .query(async ({ input }) => {
        return getAgentTrades(input.agentId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        agentId: z.number(),
        pair: z.string(),
        type: z.enum(['buy', 'sell']),
        amount: z.number(),
        price: z.number(),
        txHash: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createTrade(input);
      }),
  }),

  // Prediction Market
  bets: router({
    list: publicProcedure.query(async () => {
      return getBets();
    }),
    
    getUserBets: protectedProcedure.query(async ({ ctx }) => {
      return getUserBets(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        marketId: z.number(),
        side: z.enum(['yes', 'no']),
        amount: z.number().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createBet({
          ...input,
          userId: ctx.user.id,
        });
      }),
  }),

  // Arena Leaderboard
  arena: router({
    leaderboard: publicProcedure.query(async () => {
      return getArenaLeaderboard();
    }),
  }),

  // Hedge Fund Stats
  hedgeFund: router({
    stats: publicProcedure.query(async () => {
      return getHedgeFundStats();
    }),
  }),

  // Documentation Hub with Pinecone
  docs: router({
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const response = await chatWithAssistant(input.messages);
        return response;
      }),
    
    files: publicProcedure.query(async () => {
      return listAssistantFiles();
    }),
  }),

  // $CLAWD Token with Birdeye
  token: router({
    info: publicProcedure.query(async () => {
      return CLAWD_TOKEN;
    }),
    
    price: publicProcedure.query(async () => {
      return getTokenPrice();
    }),
    
    overview: publicProcedure.query(async () => {
      return getTokenOverview();
    }),
    
    history: publicProcedure
      .input(z.object({
        type: z.enum(['1m', '3m', '15m', '30m', '1H', '2H', '4H', '6H', '8H', '12H', '1D', '3D', '1W', '1M']).default('1H'),
      }).optional())
      .query(async ({ input }) => {
        return getTokenPriceHistory(undefined, input?.type || '1H');
      }),
    
    ohlcv: publicProcedure
      .input(z.object({
        type: z.enum(['1m', '3m', '5m', '15m', '30m', '1H', '2H', '4H', '6H', '8H', '12H', '1D', '3D', '1W', '1M']).default('1H'),
      }).optional())
      .query(async ({ input }) => {
        return getTokenOHLCV(undefined, input?.type || '1H');
      }),
    
    // Token gating verification using Helius DAS API
    verifyHolder: publicProcedure
      .input(z.object({
        walletAddress: z.string().min(32).max(44),
      }))
      .mutation(async ({ input }) => {
        return verifyTokenHolding(input.walletAddress);
      }),
    
    // Get wallet tokens using Helius
    walletTokens: publicProcedure
      .input(z.object({
        walletAddress: z.string().min(32).max(44),
      }))
      .query(async ({ input }) => {
        return getWalletTokens(input.walletAddress);
      }),
    
    // Get wallet transactions using Helius
    walletTransactions: publicProcedure
      .input(z.object({
        walletAddress: z.string().min(32).max(44),
        limit: z.number().min(1).max(100).default(20),
      }))
      .query(async ({ input }) => {
        return getWalletTransactions(input.walletAddress, input.limit);
      }),

    // Get trending tokens from Birdeye
    trending: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(10),
      }).optional())
      .query(async ({ input }) => {
        return getTrendingTokens(input?.limit || 10);
      }),

    // Get meme token detail from Birdeye v3 API
    memeDetail: publicProcedure
      .input(z.object({
        address: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getMemeTokenDetail(input?.address);
      }),

    // Get real-time price with liquidity
    realTimePrice: publicProcedure
      .input(z.object({
        address: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getRealTimePrice(input?.address);
      }),

    // Get the configured token address
    address: publicProcedure.query(() => {
      return CLAWD_TOKEN_ADDRESS;
    }),

    // Check if wallet is admin
    checkAdmin: publicProcedure
      .input(z.object({
        walletAddress: z.string().min(32).max(44),
      }))
      .query(({ input }) => {
        const ADMIN_WALLET = process.env.ADMIN_WALLET || '9juYSPJ59hP1dFFSMHft7ajmZ9rfVpibHXPR4VFdADMm';
        const isAdmin = input.walletAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();
        return {
          isAdmin,
          adminWallet: ADMIN_WALLET,
        };
      }),

    // Combined access check (admin OR token holder)
    checkAccess: publicProcedure
      .input(z.object({
        walletAddress: z.string().min(32).max(44),
      }))
      .mutation(async ({ input }) => {
        const ADMIN_WALLET = process.env.ADMIN_WALLET || '9juYSPJ59hP1dFFSMHft7ajmZ9rfVpibHXPR4VFdADMm';
        const isAdmin = input.walletAddress.toLowerCase() === ADMIN_WALLET.toLowerCase();
        
        if (isAdmin) {
          return {
            hasAccess: true,
            isAdmin: true,
            isHolder: false,
            balance: 0,
            reason: 'Admin wallet',
          };
        }
        
        // Check token holding
        const tokenResult = await verifyTokenHolding(input.walletAddress);
        return {
          hasAccess: tokenResult.isHolder,
          isAdmin: false,
          isHolder: tokenResult.isHolder,
          balance: tokenResult.balance,
          reason: tokenResult.isHolder ? 'Token holder' : 'Insufficient $CLAWD balance',
        };
      }),
  }),

  // Cloudflare R2 Assets
  assets: router({
    // Get documentation PDFs
    pdfs: publicProcedure.query(async () => {
      return getDocumentationPDFs();
    }),
    
    // Get graphics assets
    graphics: publicProcedure.query(async () => {
      return getGraphicsAssets();
    }),
    
    // Get all documentation assets
    all: publicProcedure.query(async () => {
      return getAllDocumentationAssets();
    }),
    
    // Get asset URL
    url: publicProcedure
      .input(z.object({
        path: z.string(),
      }))
      .query(({ input }) => {
        return { url: getAssetUrl(input.path) };
      }),
    
    // Get R2 config
    config: publicProcedure.query(() => {
      return R2_CONFIG;
    }),
  }),

  // Grok AI Agent
  grok: router({
    // Chat with Grok
    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['system', 'user', 'assistant']),
          content: z.string(),
        })),
        enableSearch: z.boolean().default(false),
        searchSources: z.array(z.enum(['web', 'x', 'news'])).optional(),
        maxSearchResults: z.number().min(1).max(20).default(10),
      }))
      .mutation(async ({ input }) => {
        const result = await chatWithGrok({
          messages: input.messages as GrokMessage[],
          enableSearch: input.enableSearch,
          searchSources: input.searchSources,
          maxSearchResults: input.maxSearchResults,
        });
        
        if (!result) {
          return {
            success: false,
            error: 'Failed to get response from Grok',
          };
        }
        
        return {
          success: true,
          content: result.content,
          citations: result.citations,
          model: result.model,
          usage: result.usage,
        };
      }),

    // Quick chat with system prompt
    quickChat: publicProcedure
      .input(z.object({
        message: z.string().min(1).max(4000),
        enableSearch: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const result = await chatWithGrok({
          messages: [
            { role: 'system', content: GROK_SYSTEM_PROMPT },
            { role: 'user', content: input.message },
          ],
          enableSearch: input.enableSearch,
          searchSources: ['web', 'x', 'news'],
          maxSearchResults: 10,
        });
        
        if (!result) {
          return {
            success: false,
            error: 'Failed to get response from Grok',
          };
        }
        
        return {
          success: true,
          content: result.content,
          citations: result.citations,
          model: result.model,
        };
      }),

    // Trading assistant
    trading: publicProcedure
      .input(z.object({
        query: z.string().min(1).max(2000),
      }))
      .mutation(async ({ input }) => {
        const result = await grokTradingAssistant(input.query);
        
        if (!result) {
          return {
            success: false,
            error: 'Failed to get trading analysis',
          };
        }
        
        return {
          success: true,
          content: result.content,
          citations: result.citations,
        };
      }),

    // Vibe coding
    vibeCode: publicProcedure
      .input(z.object({
        request: z.string().min(1).max(2000),
      }))
      .mutation(async ({ input }) => {
        const result = await grokVibeCode(input.request);
        
        if (!result) {
          return {
            success: false,
            error: 'Failed to generate code',
          };
        }
        
        return {
          success: true,
          content: result.content,
        };
      }),

    // Image generation
    generateImage: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1).max(1000),
        count: z.number().min(1).max(4).default(1),
      }))
      .mutation(async ({ input }) => {
        const images = await generateGrokImage(input.prompt, input.count);
        
        if (!images || images.length === 0) {
          return {
            success: false,
            error: 'Failed to generate image',
          };
        }
        
        return {
          success: true,
          images: images.map(img => ({
            url: img.url,
            revisedPrompt: img.revised_prompt,
          })),
        };
      }),

    // X (Twitter) search
    searchX: publicProcedure
      .input(z.object({
        query: z.string().min(1).max(500),
        includedHandles: z.array(z.string()).max(10).optional(),
        excludedHandles: z.array(z.string()).max(10).optional(),
        minFavorites: z.number().optional(),
        minViews: z.number().optional(),
        maxResults: z.number().min(1).max(50).default(20),
      }))
      .mutation(async ({ input }) => {
        const result = await searchX({
          query: input.query,
          includedHandles: input.includedHandles,
          excludedHandles: input.excludedHandles,
          minFavorites: input.minFavorites,
          minViews: input.minViews,
          maxResults: input.maxResults,
        });
        
        if (!result) {
          return {
            success: false,
            error: 'Failed to search X',
          };
        }
        
        return {
          success: true,
          content: result.content,
          citations: result.citations,
          sourcesUsed: result.sourcesUsed,
        };
      }),

    // Web and news search
    searchWeb: publicProcedure
      .input(z.object({
        query: z.string().min(1).max(500),
        maxResults: z.number().min(1).max(50).default(10),
      }))
      .mutation(async ({ input }) => {
        const result = await searchWebAndNews(input.query, input.maxResults);
        
        if (!result) {
          return {
            success: false,
            error: 'Failed to search web',
          };
        }
        
        return {
          success: true,
          content: result.content,
          citations: result.citations,
          sourcesUsed: result.sourcesUsed,
        };
      }),
  }),

  // Multi-provider AI Agent
  agent: router({
    // Get available models
    models: publicProcedure.query(() => {
      return getAgentModels();
    }),

    // Chat with selected model
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['system', 'user', 'assistant']),
          content: z.string(),
          reasoning_details: z.any().optional(),
        })),
        modelId: z.string().default('claude-opus'),
        systemPrompt: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().min(1).max(16384).optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await chatWithAgent(
          input.messages as AgentMessage[],
          input.modelId,
          {
            systemPrompt: input.systemPrompt,
            temperature: input.temperature,
            maxTokens: input.maxTokens,
          }
        );
        
        if (!result) {
          return {
            success: false,
            error: 'Failed to get response from agent',
          };
        }
        
        return {
          success: true,
          content: result.content,
          model: result.model,
          reasoning_details: result.reasoning_details,
        };
      }),

    // Trading assistant with multi-model support
    trading: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['system', 'user', 'assistant']),
          content: z.string(),
        })),
        modelId: z.string().default('claude-opus'),
      }))
      .mutation(async ({ input }) => {
        const result = await chatWithAgent(
          input.messages as AgentMessage[],
          input.modelId,
          {
            systemPrompt: TRADING_AGENT_SYSTEM_PROMPT,
            temperature: 0.7,
          }
        );
        
        if (!result) {
          return {
            success: false,
            error: 'Failed to get trading analysis',
          };
        }
        
        return {
          success: true,
          content: result.content,
          model: result.model,
        };
      }),

    // Codex coding with reasoning
    codex: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['system', 'user', 'assistant']),
          content: z.string(),
          reasoning_details: z.any().optional(),
        })),
        enableReasoning: z.boolean().default(true),
        temperature: z.number().min(0).max(1).optional(),
      }))
      .mutation(async ({ input }) => {
        const messagesWithSystem: AgentMessage[] = [
          { role: 'system', content: CODING_AGENT_SYSTEM_PROMPT },
          ...input.messages as AgentMessage[],
        ];
        
        const result = await codeWithCodex(messagesWithSystem, {
          reasoning: input.enableReasoning,
          temperature: input.temperature,
        });
        
        if (!result) {
          return {
            success: false,
            error: 'Failed to get code from Codex',
          };
        }
        
        return {
          success: true,
          content: result.content,
          model: result.model,
          reasoning_details: result.reasoning_details,
        };
      }),

    // Vision analysis
    vision: publicProcedure
      .input(z.object({
        prompt: z.string().min(1).max(2000),
        imageUrl: z.string().url(),
        modelId: z.string().default('claude-opus'),
      }))
      .mutation(async ({ input }) => {
        const result = await chatWithVision(
          input.prompt,
          input.imageUrl,
          input.modelId
        );
        
        if (!result) {
          return {
            success: false,
            error: 'Failed to analyze image',
          };
        }
        
        return {
          success: true,
          content: result.content,
          model: result.model,
        };
      }),
  }),

  // Robot Passport Generator
  passport: router({
    // Check if OpenRouter is configured
    status: publicProcedure.query(() => {
      return {
        openrouterConfigured: isOpenRouterConfigured(),
        openaiConfigured: !!process.env.OPENAI_API_KEY,
      };
    }),

    // Enhance prompt using Gemini 3 Flash via OpenRouter
    enhancePrompt: publicProcedure
      .input(z.object({
        type: z.enum(['passport', 'coin']),
        formData: z.object({
          robotId: z.string(),
          pubkey: z.string(),
          owner: z.string(),
          title: z.string(),
          reputation: z.string(),
          capabilities: z.string(),
          bagText: z.string(),
          tokenTicker: z.string(),
          customPromptAdditions: z.string().optional(),
        }),
        customAdditions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Fill the prompt template with form data
        const basePrompt = fillPassportPrompt(input.type, input.formData as PassportFormData);
        
        // Enhance with Gemini
        const result = await enhancePromptWithGemini(basePrompt, input.customAdditions);
        
        if (!result) {
          return {
            success: false,
            error: 'Failed to enhance prompt',
          };
        }
        
        return {
          success: true,
          prompt: result.content,
          usage: result.usage,
        };
      }),

    // Generate image using OpenAI gpt-image-1
    generateImage: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1),
        settings: z.object({
          quality: z.enum(['low', 'medium', 'high']),
          size: z.enum(['1024x1024', '1536x1024', '1024x1536']),
          background: z.enum(['opaque', 'transparent']),
        }),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await generateOpenAIImage({
            prompt: input.prompt,
          });
          
          if (!result || !result.url) {
            return {
              success: false,
              error: 'Failed to generate image',
            };
          }
          
          return {
            success: true,
            imageUrl: result.url,
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            success: false,
            error: errorMessage,
          };
        }
      }),

    // Edit image using Flux 2 Klein via OpenRouter
    editImage: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(),
        instructions: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const result = await editImageWithFlux(input.imageUrl, input.instructions);
        
        if (!result) {
          return {
            success: false,
            error: 'Failed to edit image',
          };
        }
        
        return {
          success: true,
          imageUrl: result.imageUrl,
        };
      }),
  }),

  // Trade Execution Router
  trade: router({
    // Get available tokens
    tokens: publicProcedure.query(() => {
      return {
        SOL: TOKENS.SOL,
        USDC: TOKENS.USDC,
        CLAWD: TOKENS.CLAWD,
      };
    }),

    // Get Jupiter price for a token
    jupiterPrice: publicProcedure
      .input(z.object({
        mintAddress: z.string(),
      }))
      .query(async ({ input }) => {
        const price = await getJupiterPrice(input.mintAddress);
        return price;
      }),

    // Parse trade intent from natural language
    parseIntent: publicProcedure
      .input(z.object({
        message: z.string(),
      }))
      .mutation(({ input }) => {
        const intent = parseTradeIntent(input.message);
        return intent;
      }),

    // Get swap quote
    getQuote: publicProcedure
      .input(z.object({
        inputMint: z.string(),
        outputMint: z.string(),
        amount: z.number(),
        slippageBps: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const quote = await getQuote({
          inputMint: input.inputMint,
          outputMint: input.outputMint,
          amount: input.amount,
          slippageBps: input.slippageBps,
        });
        
        if (!quote) {
          return {
            success: false,
            error: 'Failed to get quote from Jupiter',
          };
        }
        
        return {
          success: true,
          quote,
        };
      }),

    // Build swap transaction
    buildTransaction: publicProcedure
      .input(z.object({
        quote: z.any(), // QuoteResponse
        userPublicKey: z.string(),
        prioritizationFeeLamports: z.union([z.number(), z.literal('auto')]).optional(),
      }))
      .mutation(async ({ input }) => {
        const swapTx = await buildSwapTransaction({
          quoteResponse: input.quote as QuoteResponse,
          userPublicKey: input.userPublicKey,
          prioritizationFeeLamports: input.prioritizationFeeLamports,
        });
        
        if (!swapTx) {
          return {
            success: false,
            error: 'Failed to build swap transaction',
          };
        }
        
        return {
          success: true,
          swapTransaction: swapTx.swapTransaction,
          lastValidBlockHeight: swapTx.lastValidBlockHeight,
          prioritizationFeeLamports: swapTx.prioritizationFeeLamports,
        };
      }),

    // Format quote for display
    formatQuote: publicProcedure
      .input(z.object({
        quote: z.any(),
        inputSymbol: z.string(),
        outputSymbol: z.string(),
      }))
      .mutation(({ input }) => {
        const formatted = formatQuoteForDisplay(
          input.quote as QuoteResponse,
          input.inputSymbol,
          input.outputSymbol
        );
        return { formatted };
      }),

    // Helper to convert to smallest unit
    toSmallestUnit: publicProcedure
      .input(z.object({
        amount: z.number(),
        decimals: z.number().optional(),
      }))
      .mutation(({ input }) => {
        return toSmallestUnit(input.amount, input.decimals);
      }),

    // Helper to convert from smallest unit
    fromSmallestUnit: publicProcedure
      .input(z.object({
        amount: z.string(),
        decimals: z.number().optional(),
      }))
      .mutation(({ input }) => {
        return fromSmallestUnit(input.amount, input.decimals);
      }),
  }),

  // Wallet Verification & Portfolio
  wallet: router({
    // Verify $CLAWD token holder status
    verifyHolder: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        tokenAddress: z.string().optional(),
        minBalance: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await verifyTokenHolder(
          input.walletAddress,
          input.tokenAddress,
          input.minBalance
        );
        return result;
      }),

    // Get all assets owned by a wallet
    getAssets: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        page: z.number().optional(),
        limit: z.number().optional(),
        showFungible: z.boolean().optional(),
        showNativeBalance: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        const assets = await getAssetsByOwner(input.walletAddress, {
          page: input.page,
          limit: input.limit,
          showFungible: input.showFungible ?? true,
          showNativeBalance: input.showNativeBalance ?? true,
        });
        return assets;
      }),

    // Get token metadata
    getTokenMetadata: publicProcedure
      .input(z.object({
        tokenAddress: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const metadata = await getTokenMetadata(input.tokenAddress);
        return metadata;
      }),

    // Get wallet net worth details
    getNetWorth: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        sortType: z.enum(['asc', 'desc']).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const netWorth = await getWalletNetWorthDetails(input.walletAddress, {
          sortType: input.sortType,
          limit: input.limit,
          offset: input.offset,
        });
        return netWorth;
      }),

    // Get wallet PnL summary
    getPnL: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        duration: z.enum(['all', '90d', '30d', '7d', '24h']).optional(),
      }))
      .query(async ({ input }) => {
        const pnl = await getWalletPnL(input.walletAddress, input.duration);
        return pnl;
      }),

    // Get wallet net worth chart
    getNetWorthChart: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        timeframe: z.enum(['1h', '1d']).optional(),
      }))
      .query(async ({ input }) => {
        const chart = await getWalletNetWorthChart(input.walletAddress, input.timeframe);
        return chart;
      }),

    // Get PnL per token
    getTokenPnL: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        tokenAddresses: z.array(z.string()),
      }))
      .query(async ({ input }) => {
        const tokenPnL = await getWalletTokenPnL(input.walletAddress, input.tokenAddresses);
        return tokenPnL;
      }),

    // Get comprehensive portfolio data
    getPortfolio: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        tokenAddresses: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        const portfolio = await getWalletPortfolio(input.walletAddress, input.tokenAddresses);
        return portfolio;
      }),
  }),

  // SOLtron AI Companion
  soltron: router({
    // Get SOLtron status and capabilities
    status: publicProcedure.query(() => {
      return getSOLtronStatus();
    }),

    // Chat with SOLtron
    chat: publicProcedure
      .input(z.object({
        message: z.string(),
        context: z.string().optional(),
        walletAddress: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await chatWithNemotron(
          input.message,
          input.context,
          input.walletAddress
        );
        return result;
      }),

    // Generate voice response
    voiceResponse: publicProcedure
      .input(z.object({
        message: z.string(),
        emotion: z.enum(['neutral', 'excited', 'thoughtful', 'concerned']).optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await generateVoiceResponse(
          input.message,
          input.emotion || 'neutral'
        );
        return result;
      }),
  }),

  // Chat session persistence router
  chat: router({
    // Create a new chat session
    createSession: publicProcedure
      .input(z.object({
        walletAddress: z.string().optional(),
        agentType: z.enum(['soltron', 'grok', 'trading', 'codex']).default('soltron'),
        model: z.string().optional(),
        title: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await createChatSession({
          sessionId,
          userId: ctx.user?.id,
          walletAddress: input.walletAddress,
          agentType: input.agentType,
          model: input.model,
          title: input.title,
        });
        return { sessionId };
      }),

    // Get a specific chat session
    getSession: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return getChatSession(input.sessionId);
      }),

    // Get user's chat sessions
    getSessions: publicProcedure
      .input(z.object({
        walletAddress: z.string().optional(),
        limit: z.number().default(20),
      }))
      .query(async ({ input, ctx }) => {
        return getUserChatSessions(ctx.user?.id, input.walletAddress, input.limit);
      }),

    // Update session title
    updateTitle: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        title: z.string(),
      }))
      .mutation(async ({ input }) => {
        await updateChatSessionTitle(input.sessionId, input.title);
        return { success: true };
      }),

    // Delete a chat session
    deleteSession: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        await deleteChatSession(input.sessionId);
        return { success: true };
      }),

    // Add a message to a session
    addMessage: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        role: z.enum(['user', 'assistant', 'system', 'tool']),
        content: z.string(),
        reasoning: z.string().optional(),
        toolCalls: z.array(z.object({
          name: z.string(),
          arguments: z.record(z.string(), z.unknown()),
          result: z.unknown().optional(),
        })).optional(),
        audioUrl: z.string().optional(),
        imageUrl: z.string().optional(),
        metadata: z.object({
          model: z.string().optional(),
          tokens: z.number().optional(),
          latency: z.number().optional(),
          voice: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        await addChatMessage(input);
        return { success: true };
      }),

    // Get messages for a session
    getMessages: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        limit: z.number().default(100),
      }))
      .query(async ({ input }) => {
        return getChatMessages(input.sessionId, input.limit);
      }),

    // Get recent messages for context
    getRecentMessages: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        limit: z.number().default(10),
      }))
      .query(async ({ input }) => {
        return getRecentChatMessages(input.sessionId, input.limit);
      }),
  }),

  // Voice agent router
  voice: router({
    // Get ephemeral token for client-side WebSocket
    getToken: publicProcedure
      .input(z.object({
        expiresInSeconds: z.number().default(300),
      }))
      .mutation(async ({ input }) => {
        return getEphemeralToken(input.expiresInSeconds);
      }),

    // Get available voice options
    getVoices: publicProcedure.query(() => {
      return VOICE_OPTIONS;
    }),

    // Get session configuration for WebSocket
    getSessionConfig: publicProcedure
      .input(z.object({
        voice: z.enum(['Ara', 'Rex', 'Sal', 'Eve', 'Leo']).optional(),
        instructions: z.string().optional(),
        searchEnabled: z.boolean().default(true),
        xSearchEnabled: z.boolean().default(true),
      }))
      .query(({ input }) => {
        return createSessionUpdateMessage({
          ...SOLTRON_VOICE_CONFIG,
          voice: input.voice || SOLTRON_VOICE_CONFIG.voice,
          instructions: input.instructions || SOLTRON_VOICE_CONFIG.instructions,
          searchEnabled: input.searchEnabled,
          xSearchEnabled: input.xSearchEnabled,
        });
      }),

    // Check if voice is configured
    isConfigured: publicProcedure.query(() => {
      return { configured: isVoiceConfigured() };
    }),
  }),

  // 3D Models router
  models: router({
    // Upload a new 3D model
    upload: protectedProcedure
      .input(z.object({
        file: z.string(), // Base64 encoded file
        filename: z.string(),
        name: z.string(),
        description: z.string().optional(),
        isPublic: z.boolean().default(false),
        tags: z.array(z.string()).optional(),
        walletAddress: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64 file
        const buffer = Buffer.from(input.file, 'base64');
        
        // Get file extension
        const ext = input.filename.toLowerCase().slice(input.filename.lastIndexOf('.'));
        const fileType = ext.replace('.', '') as 'vrm' | 'glb' | 'gltf' | 'fbx' | 'obj';
        
        // Upload to Supabase storage
        const uploadResult = await uploadModel({
          file: buffer,
          filename: input.filename,
          userId: ctx.user.id.toString(),
        });
        
        if (!uploadResult.success || !uploadResult.url || !uploadResult.path) {
          throw new Error(uploadResult.error || 'Upload failed');
        }
        
        // Save to database
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const [model] = await db.insert(models3d).values({
          userId: ctx.user.id,
          walletAddress: input.walletAddress || null,
          name: input.name,
          description: input.description || null,
          filename: input.filename,
          fileType,
          fileSize: buffer.length,
          storagePath: uploadResult.path,
          publicUrl: uploadResult.url,
          tags: input.tags || null,
          isPublic: input.isPublic,
        }).$returningId();
        
        return { id: model.id, url: uploadResult.url };
      }),

    // List user's models
    list: protectedProcedure
      .input(z.object({
        userId: z.number().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        const { eq, desc } = await import('drizzle-orm');
        const userId = input.userId || ctx.user.id;
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const results = await db
          .select()
          .from(models3d)
          .where(eq(models3d.userId, userId))
          .orderBy(desc(models3d.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        return results;
      }),

    // List public models
    listPublic: publicProcedure
      .input(z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        search: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { eq, desc, like, and } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        let query = db
          .select()
          .from(models3d)
          .where(
            input.search
              ? and(eq(models3d.isPublic, true), like(models3d.name, `%${input.search}%`))
              : eq(models3d.isPublic, true)
          )
          .orderBy(desc(models3d.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        return query;
      }),

    // Get a single model by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const [model] = await db
          .select()
          .from(models3d)
          .where(eq(models3d.id, input.id));
        
        if (!model) {
          throw new Error('Model not found');
        }
        
        // Increment views
        await db
          .update(models3d)
          .set({ views: model.views + 1 })
          .where(eq(models3d.id, input.id));
        
        return model;
      }),

    // Delete a model
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { eq, and } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get the model first
        const [model] = await db
          .select()
          .from(models3d)
          .where(and(eq(models3d.id, input.id), eq(models3d.userId, ctx.user.id)));
        
        if (!model) {
          throw new Error('Model not found or unauthorized');
        }
        
        // Delete from Supabase storage
        await deleteModel(model.storagePath);
        
        // Delete from database
        await db.delete(models3d).where(eq(models3d.id, input.id));
        
        return { success: true };
      }),

    // Toggle model visibility
    toggleVisibility: protectedProcedure
      .input(z.object({
        id: z.number(),
        isPublic: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { eq, and } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db
          .update(models3d)
          .set({ isPublic: input.isPublic })
          .where(and(eq(models3d.id, input.id), eq(models3d.userId, ctx.user.id)));
        
        return { success: true };
      }),

    // Update model metadata
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        metadata: z.object({
          vertices: z.number().optional(),
          faces: z.number().optional(),
          materials: z.number().optional(),
          animations: z.array(z.string()).optional(),
          bones: z.number().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { eq, and } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const updateData: Record<string, unknown> = {};
        if (input.name) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.tags) updateData.tags = input.tags;
        if (input.metadata) updateData.metadata = input.metadata;
        
        await db
          .update(models3d)
          .set(updateData)
          .where(and(eq(models3d.id, input.id), eq(models3d.userId, ctx.user.id)));
        
        return { success: true };
      }),

    // Get supported file types
    getSupportedTypes: publicProcedure.query(() => {
      return {
        extensions: SUPPORTED_EXTENSIONS,
        maxFileSize: MAX_FILE_SIZE,
      };
    }),

    // Generate 3D model from image using FAL AI
    generateFrom2D: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(),
        model: z.enum(["SEED3D", "HUNYUAN3D_V3"]).default("HUNYUAN3D_V3"),
        options: z.object({
          faceCount: z.number().min(40000).max(1500000).default(500000).optional(),
          generateType: z.enum(["Normal", "LowPoly", "Geometry"]).default("Normal").optional(),
          polygonType: z.enum(["triangle", "quadrilateral"]).default("triangle").optional(),
          enablePbr: z.boolean().default(false).optional(),
          backImageUrl: z.string().url().optional(),
          leftImageUrl: z.string().url().optional(),
          rightImageUrl: z.string().url().optional(),
        }).optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        saveToGallery: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const { generateImageTo3D } = await import("./fal-image-to-3d");
        
        const result = await generateImageTo3D(
          input.imageUrl,
          {
            model: input.model,
            faceCount: input.options?.faceCount,
            generateType: input.options?.generateType,
            polygonType: input.options?.polygonType,
            enablePbr: input.options?.enablePbr,
            backImageUrl: input.options?.backImageUrl,
            leftImageUrl: input.options?.leftImageUrl,
            rightImageUrl: input.options?.rightImageUrl,
          }
        );

        // If saveToGallery is true, save the generated model to the database
        if (input.saveToGallery && result.glbUrl) {
          const db = await getDb();
          if (db) {
            const modelName = input.name || `Generated 3D Model ${new Date().toISOString().split('T')[0]}`;
            await db.insert(models3d).values({
              userId: ctx.user.id,
              name: modelName,
              description: input.description || `Generated from image using ${input.model}`,
              filename: `${modelName.replace(/\s+/g, '_')}.glb`,
              fileType: 'glb',
              fileSize: 0, // Unknown until downloaded
              storagePath: result.glbUrl,
              publicUrl: result.glbUrl,
              isPublic: false,
              metadata: {
                generatedBy: 'FAL_AI',
                model: input.model,
                sourceImage: input.imageUrl,
                requestId: result.requestId,
                seed: result.seed,
              },
            });
          }
        }

        return {
          success: true,
          model: result.model,
          requestId: result.requestId,
          urls: {
            glb: result.glbUrl,
            obj: result.objUrl,
            fbx: result.fbxUrl,
            zip: result.zipUrl,
            thumbnail: result.thumbnailUrl,
          },
          seed: result.seed,
        };
      }),

    // Submit async generation job
    submitGeneration: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(),
        model: z.enum(["SEED3D", "HUNYUAN3D_V3"]).default("HUNYUAN3D_V3"),
        options: z.object({
          faceCount: z.number().min(40000).max(1500000).optional(),
          generateType: z.enum(["Normal", "LowPoly", "Geometry"]).optional(),
          polygonType: z.enum(["triangle", "quadrilateral"]).optional(),
          enablePbr: z.boolean().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const { submitGeneration, FAL_MODELS } = await import("./fal-image-to-3d");
        
        const falInput = input.model === "SEED3D"
          ? { image_url: input.imageUrl }
          : {
              input_image_url: input.imageUrl,
              face_count: input.options?.faceCount || 500000,
              generate_type: input.options?.generateType || "Normal",
              polygon_type: input.options?.polygonType || "triangle",
              enable_pbr: input.options?.enablePbr || false,
            };

        const result = await submitGeneration(input.model, falInput);
        
        return {
          requestId: result.requestId,
          model: input.model,
        };
      }),

    // Check generation status
    checkGenerationStatus: protectedProcedure
      .input(z.object({
        requestId: z.string(),
        model: z.enum(["SEED3D", "HUNYUAN3D_V3"]),
      }))
      .query(async ({ input }) => {
        const { checkGenerationStatus } = await import("./fal-image-to-3d");
        
        const status = await checkGenerationStatus(input.model, input.requestId);
        
        return status;
      }),

    // Get generation result
    getGenerationResult: protectedProcedure
      .input(z.object({
        requestId: z.string(),
        model: z.enum(["SEED3D", "HUNYUAN3D_V3"]),
      }))
      .query(async ({ input }) => {
        const { getGenerationResult } = await import("./fal-image-to-3d");
        
        const result = await getGenerationResult(input.model, input.requestId);
        
        if (input.model === "SEED3D") {
          const seed3dResult = result as { model: { url: string }; usage_tokens: number };
          return {
            model: input.model,
            urls: {
              zip: seed3dResult.model.url,
            },
            usageTokens: seed3dResult.usage_tokens,
          };
        } else {
          const hunyuanResult = result as {
            model_glb: { url: string };
            thumbnail: { url: string };
            model_urls: { glb?: { url: string }; obj?: { url: string }; fbx?: { url: string } };
            seed: number;
          };
          return {
            model: input.model,
            urls: {
              glb: hunyuanResult.model_glb?.url,
              obj: hunyuanResult.model_urls?.obj?.url,
              fbx: hunyuanResult.model_urls?.fbx?.url,
              thumbnail: hunyuanResult.thumbnail?.url,
            },
            seed: hunyuanResult.seed,
          };
        }
      }),

    // Get available FAL models info
    getFalModels: publicProcedure.query(() => {
      return {
        models: [
          {
            id: "SEED3D",
            name: "Seed3D (ByteDance)",
            description: "Fast image-to-3D generation, outputs ZIP with model files",
            features: ["Fast generation", "ZIP output"],
          },
          {
            id: "HUNYUAN3D_V3",
            name: "Hunyuan3D v3",
            description: "High-quality 3D generation with multiple output formats",
            features: [
              "GLB, OBJ, FBX output",
              "Configurable face count (40K-1.5M)",
              "Normal, LowPoly, Geometry modes",
              "PBR materials support",
              "Multi-view input support",
            ],
            options: {
              faceCount: { min: 40000, max: 1500000, default: 500000 },
              generateTypes: ["Normal", "LowPoly", "Geometry"],
              polygonTypes: ["triangle", "quadrilateral"],
            },
          },
        ],
      };
    }),
  }),

  // Token Launch Router (Bags + Pump.fun)
  tokenLaunch: router({
    // Create token info and metadata
    createTokenInfo: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(32),
        symbol: z.string().min(1).max(10),
        description: z.string().min(1).max(1000),
        imageUrl: z.string().url().optional(),
        telegram: z.string().optional(),
        twitter: z.string().optional(),
        website: z.string().url().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await bagsApi.createTokenInfo(input);
        return result;
      }),

    // Create launch transaction
    createLaunchTransaction: protectedProcedure
      .input(z.object({
        ipfs: z.string(),
        tokenMint: z.string(),
        wallet: z.string(),
        initialBuyLamports: z.number(),
        configKey: z.string(),
        tipWallet: z.string().optional(),
        tipLamports: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await bagsApi.createLaunchTransaction(input);
        return result;
      }),

    // Create fee share config
    createFeeShareConfig: protectedProcedure
      .input(z.object({
        payer: z.string(),
        baseMint: z.string(),
        claimersArray: z.array(z.string()),
        basisPointsArray: z.array(z.number()),
        partner: z.string().optional(),
        partnerConfig: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await bagsApi.createFeeShareConfig(input);
        return result;
      }),

    // Get fee share wallet for social username
    getFeeShareWallet: publicProcedure
      .input(z.object({
        provider: z.enum(['twitter', 'github', 'instagram', 'tiktok', 'kick']),
        username: z.string(),
      }))
      .query(async ({ input }) => {
        const result = await bagsApi.getFeeShareWallet(input.provider, input.username);
        return result;
      }),

    // Get claimable positions for a wallet
    getClaimablePositions: publicProcedure
      .input(z.object({ wallet: z.string() }))
      .query(async ({ input }) => {
        const result = await bagsApi.getClaimablePositions(input.wallet);
        return result;
      }),

    // Get claim transactions
    getClaimTransactions: protectedProcedure
      .input(z.object({
        feeClaimer: z.string(),
        tokenMint: z.string(),
        virtualPoolAddress: z.string().optional(),
        dammV2Position: z.string().optional(),
        dammV2Pool: z.string().optional(),
        claimVirtualPoolFees: z.boolean().optional(),
        claimDammV2Fees: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await bagsApi.getClaimTransactions(input);
        return result;
      }),

    // Get token lifetime fees
    getTokenFees: publicProcedure
      .input(z.object({ tokenMint: z.string() }))
      .query(async ({ input }) => {
        const result = await bagsApi.getTokenLifetimeFees(input.tokenMint);
        return result;
      }),

    // Get token claim stats
    getClaimStats: publicProcedure
      .input(z.object({ tokenMint: z.string() }))
      .query(async ({ input }) => {
        const result = await bagsApi.getTokenClaimStats(input.tokenMint);
        return result;
      }),

    // Calculate fees based on market cap
    calculateFees: publicProcedure
      .input(z.object({ marketCapUsd: z.number() }))
      .query(({ input }) => {
        return bagsApi.calculateFees(input.marketCapUsd);
      }),

    // AI-powered one-shot token generation
    generateTokenConcept: protectedProcedure
      .input(z.object({
        theme: z.string().min(1).max(200),
        style: z.enum(['meme', 'utility', 'gaming', 'defi', 'nft', 'ai']).optional(),
      }))
      .mutation(async ({ input }) => {
        // Use OpenRouter to generate token concept
        const prompt = `Generate a creative Solana meme token concept based on the theme: "${input.theme}"

Style: ${input.style || 'meme'}

Provide a JSON response with:
- name: Token name (max 32 chars, catchy and memorable)
- symbol: Ticker symbol (max 10 chars, uppercase)
- description: Token description (max 500 chars, engaging and fun)
- imagePrompt: A detailed prompt for generating the token logo image
- website: A suggested domain name
- tagline: A catchy tagline for the token

Be creative, fun, and crypto-native. Make it viral-worthy!`;

        const messages: AgentMessage[] = [
          { role: 'system', content: 'You are a creative crypto token designer. Generate unique, viral-worthy token concepts. Always respond with valid JSON.' },
          { role: 'user', content: prompt },
        ];

        const response = await chatWithAgent(messages, 'creative');
        
        if (!response) {
          return {
            success: false,
            error: 'No response from AI',
            rawResponse: '',
          };
        }

        try {
          // Parse the JSON from the response
          const jsonMatch = response.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const concept = JSON.parse(jsonMatch[0]);
            return {
              success: true,
              concept,
            };
          }
          throw new Error('No JSON found in response');
        } catch (error) {
          return {
            success: false,
            error: 'Failed to parse token concept',
            rawResponse: response.content,
          };
        }
      }),

    // Generate token image using AI
    generateTokenImage: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1).max(500),
        style: z.enum(['cartoon', 'pixel', '3d', 'minimal', 'realistic']).optional(),
      }))
      .mutation(async ({ input }) => {
        const stylePrompts: Record<string, string> = {
          cartoon: 'cartoon style, vibrant colors, bold outlines',
          pixel: 'pixel art style, 8-bit, retro gaming aesthetic',
          '3d': '3D rendered, glossy, professional',
          minimal: 'minimalist design, clean lines, simple shapes',
          realistic: 'photorealistic, detailed, high quality',
        };

        const fullPrompt = `Token logo design: ${input.prompt}. ${stylePrompts[input.style || 'cartoon']}. Circular logo format, centered composition, suitable for cryptocurrency token.`;

        try {
          const result = await generateOpenAIImage({ prompt: fullPrompt });
          return {
            success: true,
            imageUrl: result.url,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate image',
          };
        }
      }),

    // Get Pump.fun program constants
    getPumpConstants: publicProcedure.query(() => {
      return {
        programId: pumpfunSdk.PUMP_PROGRAM_ID,
        ammProgramId: pumpfunSdk.PUMP_AMM_PROGRAM_ID,
        globalAccount: pumpfunSdk.PUMP_GLOBAL_ACCOUNT,
        feeRecipient: pumpfunSdk.PUMP_FEE_RECIPIENT,
        initialVirtualTokenReserves: pumpfunSdk.INITIAL_VIRTUAL_TOKEN_RESERVES.toString(),
        initialVirtualSolReserves: pumpfunSdk.INITIAL_VIRTUAL_SOL_RESERVES.toString(),
        tokenTotalSupply: pumpfunSdk.TOKEN_TOTAL_SUPPLY.toString(),
        recommendedCuLimit: pumpfunSdk.RECOMMENDED_CU_LIMIT,
      };
    }),

    // Calculate buy quote for Pump.fun bonding curve
    calculateBuyQuote: publicProcedure
      .input(z.object({
        solAmount: z.string(),
        virtualTokenReserves: z.string(),
        virtualSolReserves: z.string(),
        realTokenReserves: z.string(),
        realSolReserves: z.string(),
        tokenTotalSupply: z.string(),
        complete: z.boolean(),
      }))
      .query(({ input }) => {
        const bondingCurve: pumpfunSdk.BondingCurveState = {
          virtualTokenReserves: BigInt(input.virtualTokenReserves),
          virtualSolReserves: BigInt(input.virtualSolReserves),
          realTokenReserves: BigInt(input.realTokenReserves),
          realSolReserves: BigInt(input.realSolReserves),
          tokenTotalSupply: BigInt(input.tokenTotalSupply),
          complete: input.complete,
        };

        const quote = pumpfunSdk.calculateBuyQuote(BigInt(input.solAmount), bondingCurve);
        return {
          inputAmount: quote.inputAmount.toString(),
          outputAmount: quote.outputAmount.toString(),
          fee: quote.fee.toString(),
          priceImpact: quote.priceImpact,
          isBuy: quote.isBuy,
        };
      }),

    // Calculate sell quote for Pump.fun bonding curve
    calculateSellQuote: publicProcedure
      .input(z.object({
        tokenAmount: z.string(),
        virtualTokenReserves: z.string(),
        virtualSolReserves: z.string(),
        realTokenReserves: z.string(),
        realSolReserves: z.string(),
        tokenTotalSupply: z.string(),
        complete: z.boolean(),
      }))
      .query(({ input }) => {
        const bondingCurve: pumpfunSdk.BondingCurveState = {
          virtualTokenReserves: BigInt(input.virtualTokenReserves),
          virtualSolReserves: BigInt(input.virtualSolReserves),
          realTokenReserves: BigInt(input.realTokenReserves),
          realSolReserves: BigInt(input.realSolReserves),
          tokenTotalSupply: BigInt(input.tokenTotalSupply),
          complete: input.complete,
        };

        const quote = pumpfunSdk.calculateSellQuote(BigInt(input.tokenAmount), bondingCurve);
        return {
          inputAmount: quote.inputAmount.toString(),
          outputAmount: quote.outputAmount.toString(),
          fee: quote.fee.toString(),
          priceImpact: quote.priceImpact,
          isBuy: quote.isBuy,
        };
      }),

    // Get bonding curve progress
    getBondingCurveProgress: publicProcedure
      .input(z.object({
        realTokenReserves: z.string(),
      }))
      .query(({ input }) => {
        const bondingCurve: pumpfunSdk.BondingCurveState = {
          virtualTokenReserves: pumpfunSdk.INITIAL_VIRTUAL_TOKEN_RESERVES,
          virtualSolReserves: pumpfunSdk.INITIAL_VIRTUAL_SOL_RESERVES,
          realTokenReserves: BigInt(input.realTokenReserves),
          realSolReserves: BigInt(0),
          tokenTotalSupply: pumpfunSdk.TOKEN_TOTAL_SUPPLY,
          complete: false,
        };

        return {
          progress: pumpfunSdk.getBondingCurveProgress(bondingCurve),
          isReadyForMigration: pumpfunSdk.isReadyForMigration(bondingCurve),
        };
      }),

    // Format token amount
    formatTokenAmount: publicProcedure
      .input(z.object({ amount: z.string() }))
      .query(({ input }) => {
        return pumpfunSdk.formatTokenAmount(BigInt(input.amount));
      }),

    // Format SOL amount
    formatSolAmount: publicProcedure
      .input(z.object({ lamports: z.string() }))
      .query(({ input }) => {
        return pumpfunSdk.formatSolAmount(BigInt(input.lamports));
      }),

    // ========== Official @pump-fun/pump-sdk Integration ==========

    // Get bonding curve state for a token
    getBondingCurveState: publicProcedure
      .input(z.object({ mint: z.string() }))
      .query(async ({ input }) => {
        return pumpSdkOfficial.getBondingCurveState(input.mint);
      }),

    // Prepare buy transaction using official SDK
    prepareBuyTx: publicProcedure
      .input(z.object({
        mint: z.string(),
        user: z.string(),
        solAmount: z.number(),
        slippageBps: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return pumpSdkOfficial.prepareBuyTransaction(input);
      }),

    // Prepare sell transaction using official SDK
    prepareSellTx: publicProcedure
      .input(z.object({
        mint: z.string(),
        user: z.string(),
        tokenAmount: z.number(),
        slippageBps: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return pumpSdkOfficial.prepareSellTransaction(input);
      }),

    // Get creator fee balance
    getCreatorFeeBalance: publicProcedure
      .input(z.object({ user: z.string() }))
      .query(async ({ input }) => {
        return pumpSdkOfficial.getCreatorFeeBalance(input.user);
      }),

    // Prepare claim fee transaction
    prepareClaimFeeTx: publicProcedure
      .input(z.object({ user: z.string() }))
      .mutation(async ({ input }) => {
        return pumpSdkOfficial.prepareClaimFeeTransaction(input.user);
      }),

    // Get fee tier for market cap
    getFeeTier: publicProcedure
      .input(z.object({ marketCapUsd: z.number() }))
      .query(({ input }) => {
        return pumpSdkOfficial.getFeeTierForMarketCap(input.marketCapUsd);
      }),

    // Get all fee tiers
    getAllFeeTiers: publicProcedure.query(() => {
      return pumpSdkOfficial.FEE_TIERS;
    }),

    // Get official SDK constants
    getOfficialSdkConstants: publicProcedure.query(() => {
      return {
        pumpProgramId: pumpSdkOfficial.PUMP_PROGRAM_ID.toBase58(),
        pumpAmmProgramId: pumpSdkOfficial.PUMP_AMM_PROGRAM_ID.toBase58(),
        pumpFeeProgramId: pumpSdkOfficial.PUMP_FEE_PROGRAM_ID.toBase58(),
        defaultDecimals: pumpSdkOfficial.DEFAULT_DECIMALS,
        recommendedCuLimit: pumpSdkOfficial.RECOMMENDED_CU_LIMIT,
        lamportsPerSol: pumpSdkOfficial.LAMPORTS_PER_SOL,
      };
    }),
  }),

  // ==================== TRADE HISTORY ROUTER ====================
  tradeHistory: router({
    // Save a new trade
    saveTrade: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        tradeType: z.enum(['buy', 'sell', 'create', 'create_and_buy']),
        tokenMint: z.string(),
        tokenSymbol: z.string().optional(),
        tokenName: z.string().optional(),
        tokenAmount: z.string(),
        solAmount: z.string(),
        pricePerToken: z.string().optional(),
        slippage: z.string().optional(),
        txSignature: z.string(),
        platform: z.enum(['pump_bonding', 'pump_swap', 'bags']).optional(),
        bondingCurveAddress: z.string().optional(),
        poolAddress: z.string().optional(),
        feesPaid: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return savePumpfunTrade({
          walletAddress: input.walletAddress,
          tradeType: input.tradeType,
          tokenMint: input.tokenMint,
          tokenSymbol: input.tokenSymbol,
          tokenName: input.tokenName,
          tokenAmount: input.tokenAmount,
          solAmount: input.solAmount,
          pricePerToken: input.pricePerToken,
          slippage: input.slippage,
          txSignature: input.txSignature,
          txStatus: 'pending',
          platform: input.platform || 'pump_bonding',
          bondingCurveAddress: input.bondingCurveAddress,
          poolAddress: input.poolAddress,
          feesPaid: input.feesPaid,
        });
      }),

    // Get trades for a wallet
    getTrades: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        limit: z.number().optional(),
        offset: z.number().optional(),
        tokenMint: z.string().optional(),
        tradeType: z.enum(['buy', 'sell', 'create', 'create_and_buy']).optional(),
        platform: z.enum(['pump_bonding', 'pump_swap', 'bags']).optional(),
      }))
      .query(async ({ input }) => {
        return getPumpfunTrades(input.walletAddress, {
          limit: input.limit,
          offset: input.offset,
          tokenMint: input.tokenMint,
          tradeType: input.tradeType,
          platform: input.platform,
        });
      }),

    // Get trade by signature
    getTradeBySignature: publicProcedure
      .input(z.object({ txSignature: z.string() }))
      .query(async ({ input }) => {
        return getPumpfunTradeBySignature(input.txSignature);
      }),

    // Update trade status
    updateTradeStatus: publicProcedure
      .input(z.object({
        txSignature: z.string(),
        status: z.enum(['pending', 'confirmed', 'failed']),
      }))
      .mutation(async ({ input }) => {
        await updatePumpfunTradeStatus(input.txSignature, input.status);
        return { success: true };
      }),

    // Get trade statistics
    getTradeStats: publicProcedure
      .input(z.object({ walletAddress: z.string() }))
      .query(async ({ input }) => {
        return getPumpfunTradeStats(input.walletAddress);
      }),
  }),

  // ==================== PRICE ALERTS ROUTER ====================
  priceAlerts: router({
    // Create a new alert
    create: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        tokenMint: z.string(),
        tokenSymbol: z.string().optional(),
        tokenName: z.string().optional(),
        alertType: z.enum(['price_above', 'price_below', 'mcap_above', 'mcap_below', 'graduation']),
        targetValue: z.string(),
        currentValue: z.string().optional(),
        notificationMethod: z.enum(['in_app', 'email', 'push']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createPriceAlert({
          walletAddress: input.walletAddress,
          tokenMint: input.tokenMint,
          tokenSymbol: input.tokenSymbol,
          tokenName: input.tokenName,
          alertType: input.alertType,
          targetValue: input.targetValue,
          currentValue: input.currentValue,
          notificationMethod: input.notificationMethod || 'in_app',
          notes: input.notes,
        });
      }),

    // Get alerts for a wallet
    getAlerts: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        isActive: z.boolean().optional(),
        tokenMint: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return getPriceAlerts(input.walletAddress, {
          isActive: input.isActive,
          tokenMint: input.tokenMint,
        });
      }),

    // Get alert by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getPriceAlertById(input.id);
      }),

    // Update alert
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean().optional(),
        isTriggered: z.boolean().optional(),
        triggeredAt: z.date().optional(),
        notificationSent: z.boolean().optional(),
        currentValue: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updatePriceAlert(id, data);
        return { success: true };
      }),

    // Delete alert
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePriceAlert(input.id);
        return { success: true };
      }),

    // Toggle alert active status
    toggle: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const alert = await getPriceAlertById(input.id);
        if (!alert) throw new Error('Alert not found');
        await updatePriceAlert(input.id, { isActive: !alert.isActive });
        return { success: true, isActive: !alert.isActive };
      }),

    // Check and trigger alerts for a token
    checkAlerts: publicProcedure
      .input(z.object({
        tokenMint: z.string(),
        currentPrice: z.number(),
        currentMcap: z.number(),
        isGraduated: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const alerts = await getActiveAlertsForToken(input.tokenMint);
        const triggeredAlerts: number[] = [];

        for (const alert of alerts) {
          const targetValue = parseFloat(alert.targetValue);
          let shouldTrigger = false;

          switch (alert.alertType) {
            case 'price_above':
              shouldTrigger = input.currentPrice >= targetValue;
              break;
            case 'price_below':
              shouldTrigger = input.currentPrice <= targetValue;
              break;
            case 'mcap_above':
              shouldTrigger = input.currentMcap >= targetValue;
              break;
            case 'mcap_below':
              shouldTrigger = input.currentMcap <= targetValue;
              break;
            case 'graduation':
              shouldTrigger = input.isGraduated === true;
              break;
          }

          if (shouldTrigger) {
            await updatePriceAlert(alert.id, {
              isTriggered: true,
              triggeredAt: new Date(),
              currentValue: input.currentPrice.toString(),
            });
            triggeredAlerts.push(alert.id);

            // Send notification
            try {
              await notifyOwner({
                title: `Price Alert Triggered: ${alert.tokenSymbol || alert.tokenMint.slice(0, 8)}`,
                content: `Alert type: ${alert.alertType}\nTarget: ${alert.targetValue}\nCurrent: ${input.currentPrice}`,
              });
              await updatePriceAlert(alert.id, { notificationSent: true });
            } catch (e) {
              console.error('Failed to send notification:', e);
            }
          }
        }

        return { triggeredCount: triggeredAlerts.length, triggeredAlerts };
      }),
  }),

  // ==================== BONDING CURVE ROUTER ====================
  bondingCurve: router({
    // Save snapshot
    saveSnapshot: publicProcedure
      .input(z.object({
        tokenMint: z.string(),
        tokenSymbol: z.string().optional(),
        bondingCurveAddress: z.string(),
        virtualTokenReserves: z.string().optional(),
        virtualSolReserves: z.string().optional(),
        realTokenReserves: z.string().optional(),
        realSolReserves: z.string().optional(),
        tokenTotalSupply: z.string().optional(),
        complete: z.boolean().optional(),
        graduationProgress: z.string().optional(),
        marketCap: z.string().optional(),
        pricePerToken: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return saveBondingCurveSnapshot(input);
      }),

    // Get latest snapshot
    getLatest: publicProcedure
      .input(z.object({ tokenMint: z.string() }))
      .query(async ({ input }) => {
        return getLatestBondingCurveSnapshot(input.tokenMint);
      }),

    // Get history
    getHistory: publicProcedure
      .input(z.object({
        tokenMint: z.string(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return getBondingCurveHistory(input.tokenMint, input.limit);
      }),

    // Get live bonding curve state from SDK
    getLiveState: publicProcedure
      .input(z.object({ tokenMint: z.string() }))
      .query(async ({ input }) => {
        try {
          const state = await pumpSdkOfficial.getBondingCurveState(input.tokenMint);
          if (!state) return null;

          // Calculate graduation progress (85 SOL threshold for graduation)
          const GRADUATION_THRESHOLD = 85 * 1e9; // 85 SOL in lamports
          const realSolReserves = Number(state.realSolReserves);
          const graduationProgress = Math.min((realSolReserves / GRADUATION_THRESHOLD) * 100, 100);

          // Use the pricePerToken from the SDK
          const pricePerToken = state.pricePerToken;
          const virtualTokenReserves = Number(state.virtualTokenReserves);

          // Calculate market cap using virtual token reserves as proxy for circulating supply
          // Standard pump.fun total supply is 1 billion tokens
          const TOTAL_SUPPLY = 1_000_000_000 * 1e6; // 1B tokens with 6 decimals
          const marketCap = (pricePerToken * TOTAL_SUPPLY) / 1e9; // in SOL

          return {
            ...state,
            graduationProgress: graduationProgress.toFixed(2),
            pricePerToken: pricePerToken.toString(),
            marketCapSol: marketCap.toFixed(4),
            solToGraduation: ((GRADUATION_THRESHOLD - realSolReserves) / 1e9).toFixed(4),
            isComplete: state.complete,
          };
        } catch (error) {
          console.error('Failed to get bonding curve state:', error);
          return null;
        }
      }),

    // Get graduation threshold info
    getGraduationInfo: publicProcedure.query(() => {
      return {
        thresholdSol: 85,
        thresholdLamports: '85000000000',
        description: 'Token graduates to PumpSwap AMM when bonding curve reaches 85 SOL',
      };
    }),
  }),

  // NFT Forge - Robot Passport Minting
  nftForge: router({
    // Check if Metaplex is configured
    isConfigured: publicProcedure.query(() => isMetaplexConfigured()),

    // Get Umi configuration for client-side
    getConfig: publicProcedure.query(() => getUmiConfig()),

    // Get tree cost estimates
    getTreeCosts: publicProcedure.query(() => {
      return [
        { depth: 14, ...getTreeCostEstimate(14), label: 'Small (~16K NFTs)' },
        { depth: 16, ...getTreeCostEstimate(16), label: 'Medium (~65K NFTs)' },
        { depth: 18, ...getTreeCostEstimate(18), label: 'Large (~262K NFTs)' },
        { depth: 20, ...getTreeCostEstimate(20), label: 'XL (~1M NFTs)' },
      ];
    }),

    // Get tree info
    getTreeInfo: publicProcedure
      .input(z.object({ merkleTreeAddress: z.string() }))
      .query(async ({ input }) => {
        if (!isValidPublicKey(input.merkleTreeAddress)) {
          throw new Error('Invalid Merkle Tree address');
        }
        return getTreeInfo(input.merkleTreeAddress);
      }),

    // Get assets by owner
    getAssetsByOwner: publicProcedure
      .input(z.object({
        ownerAddress: z.string(),
        page: z.number().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        if (!isValidPublicKey(input.ownerAddress)) {
          throw new Error('Invalid owner address');
        }
        return getMetaplexAssetsByOwner(input.ownerAddress, input.page || 1, input.limit || 100);
      }),

    // Get assets by collection
    getAssetsByCollection: publicProcedure
      .input(z.object({
        collectionAddress: z.string(),
        page: z.number().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        if (!isValidPublicKey(input.collectionAddress)) {
          throw new Error('Invalid collection address');
        }
        return getAssetsByCollection(input.collectionAddress, input.page || 1, input.limit || 100);
      }),

    // Get single asset by ID
    getAssetById: publicProcedure
      .input(z.object({ assetId: z.string() }))
      .query(async ({ input }) => {
        if (!isValidPublicKey(input.assetId)) {
          throw new Error('Invalid asset ID');
        }
        return getAssetById(input.assetId);
      }),

    // Prepare tree creation transaction
    prepareCreateTree: protectedProcedure
      .input(z.object({
        treeCreatorAddress: z.string(),
        maxDepth: z.number().optional(),
        maxBufferSize: z.number().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        if (!isValidPublicKey(input.treeCreatorAddress)) {
          throw new Error('Invalid tree creator address');
        }
        return prepareCreateTreeTransaction(
          input.treeCreatorAddress,
          input.maxDepth || TREE_CONFIG.maxDepth,
          input.maxBufferSize || TREE_CONFIG.maxBufferSize,
          input.isPublic || false
        );
      }),

    // Generate Robot Passport metadata
    generatePassportMetadata: protectedProcedure
      .input(z.object({
        robotId: z.string(),
        robotName: z.string(),
        ownerWallet: z.string(),
        imageUrl: z.string(),
        attributes: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
      }))
      .mutation(async ({ input }) => {
        const attrs: Record<string, string | number> = {};
        if (input.attributes) {
          for (const [key, value] of Object.entries(input.attributes)) {
            if (typeof value === 'string' || typeof value === 'number') {
              attrs[key] = value;
            }
          }
        }
        return generateRobotPassportMetadata(
          input.robotId,
          input.robotName,
          input.ownerWallet,
          input.imageUrl,
          attrs
        );
      }),

    // Prepare mint transaction
    prepareMint: protectedProcedure
      .input(z.object({
        merkleTreeAddress: z.string(),
        leafOwnerAddress: z.string(),
        name: z.string(),
        symbol: z.string(),
        description: z.string(),
        image: z.string(),
        attributes: z.array(z.object({
          trait_type: z.string(),
          value: z.union([z.string(), z.number()]),
        })).optional(),
        collectionAddress: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        if (!isValidPublicKey(input.merkleTreeAddress)) {
          throw new Error('Invalid Merkle Tree address');
        }
        if (!isValidPublicKey(input.leafOwnerAddress)) {
          throw new Error('Invalid leaf owner address');
        }
        if (input.collectionAddress && !isValidPublicKey(input.collectionAddress)) {
          throw new Error('Invalid collection address');
        }

        const metadata: RobotPassportMetadata = {
          name: input.name,
          symbol: input.symbol,
          description: input.description,
          image: input.image,
          attributes: input.attributes || [],
          properties: {
            files: [{ uri: input.image, type: 'image/png' }],
            category: 'image',
          },
        };

        return prepareMintTransaction(
          input.merkleTreeAddress,
          input.leafOwnerAddress,
          metadata,
          input.collectionAddress
        );
      }),

    // Validate public key
    validateAddress: publicProcedure
      .input(z.object({ address: z.string() }))
      .query(({ input }) => {
        return { valid: isValidPublicKey(input.address) };
      }),
  }),

  // Vibe Coding Studio
  vibeStudio: router({
    getModels: publicProcedure.query(() => getVibeModels()),
    getModes: publicProcedure.query(() => getCodeModes()),
    getLanguages: publicProcedure.query(() => getCodeLanguages()),
    isConfigured: publicProcedure.query(() => isVibeStudioConfigured()),
    generateCode: protectedProcedure
      .input(z.object({
        prompt: z.string(),
        code: z.string().optional(),
        language: z.enum(['html', 'css', 'javascript', 'typescript', 'react', 'python', 'rust', 'solidity']),
        mode: z.enum(['generate', 'edit', 'explain', 'debug', 'refactor', 'test']),
        modelId: z.enum(['codex', 'opus', 'grok']),
        enableReasoning: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await vibeCode({
          prompt: input.prompt,
          code: input.code,
          language: input.language as CodeLanguage,
          mode: input.mode as CodeMode,
          modelId: input.modelId as VibeModelId,
          enableReasoning: input.enableReasoning,
        });
        if (!result) {
          throw new Error('Failed to generate code. Please check your API configuration.');
        }
        return result;
      }),
  }),

  // Token Burn & Account Closer
  burn: router({
    isConfigured: publicProcedure.query(() => isBurnServiceConfigured()),
    getConfig: publicProcedure.query(() => getBurnServiceConfig()),
    getRentInfo: publicProcedure.query(() => getTokenAccountRent()),
    
    getTokenAccounts: publicProcedure
      .input(z.object({ walletAddress: z.string() }))
      .query(async ({ input }) => {
        if (!isValidBurnPublicKey(input.walletAddress)) {
          throw new Error('Invalid wallet address');
        }
        return getTokenAccounts(input.walletAddress);
      }),
    
    getClosableAccounts: publicProcedure
      .input(z.object({ walletAddress: z.string() }))
      .query(async ({ input }) => {
        if (!isValidBurnPublicKey(input.walletAddress)) {
          throw new Error('Invalid wallet address');
        }
        return getClosableAccounts(input.walletAddress);
      }),
    
    calculateReclaimable: publicProcedure
      .input(z.object({ walletAddress: z.string() }))
      .query(async ({ input }) => {
        if (!isValidBurnPublicKey(input.walletAddress)) {
          throw new Error('Invalid wallet address');
        }
        return calculateReclaimableSol(input.walletAddress);
      }),
    
    prepareCloseTransaction: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        accountsToClose: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        if (!isValidBurnPublicKey(input.walletAddress)) {
          throw new Error('Invalid wallet address');
        }
        return prepareCloseAccountsTransaction(input.walletAddress, input.accountsToClose);
      }),
    
    prepareBurnTransaction: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        mintAddress: z.string(),
        amount: z.string(),
        decimals: z.number(),
        closeAfterBurn: z.boolean().optional().default(false),
      }))
      .mutation(async ({ input }) => {
        if (!isValidBurnPublicKey(input.walletAddress)) {
          throw new Error('Invalid wallet address');
        }
        if (!isValidBurnPublicKey(input.mintAddress)) {
          throw new Error('Invalid mint address');
        }
        return prepareBurnTokensTransaction(
          input.walletAddress,
          input.mintAddress,
          input.amount,
          input.decimals,
          input.closeAfterBurn
        );
      }),
  }),

});

export type AppRouter = typeof appRouter;
