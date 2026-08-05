import { eq, desc, and, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  robots, 
  avatars, 
  agents, 
  trades, 
  bets,
  competitions,
  chatSessions,
  chatMessages,
  pumpfunTrades,
  priceAlerts,
  bondingCurveSnapshots,
  InsertRobot,
  InsertAvatar,
  InsertTrade,
  InsertBet,
  InsertChatSession,
  InsertChatMessage,
  InsertPumpfunTrade,
  InsertPriceAlert,
  InsertBondingCurveSnapshot,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER QUERIES ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== ROBOT QUERIES ====================

export async function getRobots(filters?: { type?: string; status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(robots);
  
  // Apply filters if provided
  const conditions = [];
  if (filters?.type && filters.type !== 'all') {
    conditions.push(eq(robots.type, filters.type as any));
  }
  if (filters?.status && filters.status !== 'all') {
    conditions.push(eq(robots.status, filters.status as any));
  }
  if (filters?.search) {
    conditions.push(like(robots.name, `%${filters.search}%`));
  }

  if (conditions.length > 0) {
    return db.select().from(robots).where(and(...conditions)).orderBy(desc(robots.createdAt));
  }
  
  return db.select().from(robots).orderBy(desc(robots.createdAt));
}

export async function getRobotById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(robots).where(eq(robots.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createRobot(data: {
  ownerId: number;
  name: string;
  codename: string;
  type: string;
  description: string;
  platform: string;
  computeTops: number;
  powerConsumption: string;
  capabilities: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(robots).values({
    name: data.name,
    codename: data.codename,
    type: data.type as any,
    model: 'nvidia/nemotron-3-nano-30b-a3b',
    description: data.description,
    capabilities: data.capabilities,
    platform: data.platform,
    computeTops: data.computeTops,
    powerRange: data.powerConsumption,
    status: 'idle',
  });

  return { id: Number(result[0].insertId) };
}

// ==================== AVATAR QUERIES ====================

export async function getAvatars() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(avatars).orderBy(desc(avatars.createdAt));
}

export async function getAvatarById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(avatars).where(eq(avatars.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserAvatars(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(avatars).where(eq(avatars.userId, userId)).orderBy(desc(avatars.createdAt));
}

export async function createAvatar(data: {
  userId: number;
  name: string;
  description: string;
  colorScheme: string;
  tradingStyle: string;
  riskTolerance: string;
  capabilities: string[];
  safetyLevel: number;
  personality: string;
  aiCapabilities: string[];
  tradingStrategy: string;
  safetyParameters: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const safetyParams = {
    maxPositionSize: data.safetyLevel <= 2 ? 2 : data.safetyLevel <= 4 ? 5 : 10,
    stopLossPercent: data.safetyLevel <= 2 ? 1 : data.safetyLevel <= 4 ? 2 : 5,
    takeProfitPercent: data.safetyLevel <= 2 ? 2 : data.safetyLevel <= 4 ? 4 : 10,
  };

  const result = await db.insert(avatars).values({
    userId: data.userId,
    name: data.name,
    description: data.description,
    colorScheme: data.colorScheme,
    personality: {
      traits: data.personality.split('. ').slice(0, 3),
      tradingStyle: data.tradingStyle,
      riskTolerance: data.riskTolerance,
    },
    capabilities: [...data.capabilities, ...data.aiCapabilities],
    safetyParams,
    aiModel: 'nvidia/nemotron-3-nano-30b-a3b',
    isActive: true,
  });

  return { id: Number(result[0].insertId) };
}

// ==================== AGENT QUERIES ====================

export async function getAgents() {
  const db = await getDb();
  if (!db) {
    // Return mock data for the 9 hedge fund agents
    return getMockAgents();
  }

  const result = await db.select().from(agents).orderBy(agents.rank);
  if (result.length === 0) {
    return getMockAgents();
  }
  return result;
}

export async function getAgentById(id: number) {
  const db = await getDb();
  if (!db) {
    const mockAgents = getMockAgents();
    return mockAgents.find(a => a.id === id) || null;
  }

  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Mock data for the 9 hedge fund agents
function getMockAgents() {
  return [
    { id: 1, codename: 'TICKER-01', name: 'Market Ticker Bot', type: 'market_analyst', model: 'Gemini 2.0', motto: 'Data is the new oil', strategy: 'Real-time market data aggregation and price action analysis', startingCapital: '10000.00', currentCapital: '12450.00', roi: '24.50', pnl: '2450.00', tradesExecuted: 156, winRate: '72.40', sharpeRatio: '2.340', maxDrawdown: '6.20', rank: 3, status: 'active' },
    { id: 2, codename: 'ECHO-X', name: 'Echo X Social', type: 'social_analyst', model: 'Gemini 2.0', motto: 'The crowd knows', strategy: 'Social sentiment analysis across Twitter, Discord, and Telegram', startingCapital: '10000.00', currentCapital: '11280.00', roi: '12.80', pnl: '1280.00', tradesExecuted: 89, winRate: '68.20', sharpeRatio: '1.890', maxDrawdown: '8.50', rank: 5, status: 'analyzing' },
    { id: 3, codename: 'WIREHAWK', name: 'Wire Hawk News', type: 'news_analyst', model: 'Gemini 2.0', motto: 'First to know', strategy: 'News feed scanning and event detection', startingCapital: '10000.00', currentCapital: '13560.00', roi: '35.60', pnl: '3560.00', tradesExecuted: 67, winRate: '75.80', sharpeRatio: '2.670', maxDrawdown: '5.40', rank: 2, status: 'active' },
    { id: 4, codename: 'ATLAS-FUNDAMENTAL', name: 'Atlas Fundamental', type: 'fundamental_analyst', model: 'Gemini 2.0', motto: 'Value finds a way', strategy: 'Deep tokenomics and on-chain metrics analysis', startingCapital: '10000.00', currentCapital: '11890.00', roi: '18.90', pnl: '1890.00', tradesExecuted: 34, winRate: '71.30', sharpeRatio: '2.120', maxDrawdown: '7.10', rank: 4, status: 'idle' },
    { id: 5, codename: 'ATLAS-BULL', name: 'Atlas Bull Research', type: 'bullish_researcher', model: 'GPT-4o', motto: 'Always ascending', strategy: 'Bullish thesis construction and upside catalyst identification', startingCapital: '10000.00', currentCapital: '10780.00', roi: '7.80', pnl: '780.00', tradesExecuted: 78, winRate: '65.70', sharpeRatio: '1.560', maxDrawdown: '9.80', rank: 7, status: 'active' },
    { id: 6, codename: 'ATLAS-BEAR', name: 'Atlas Bear Research', type: 'bearish_researcher', model: 'GPT-4o', motto: 'Protect the downside', strategy: 'Bearish counter-thesis and risk identification', startingCapital: '10000.00', currentCapital: '10340.00', roi: '3.40', pnl: '340.00', tradesExecuted: 56, winRate: '62.10', sharpeRatio: '1.230', maxDrawdown: '11.20', rank: 8, status: 'analyzing' },
    { id: 7, codename: 'EDGE-GROK', name: 'Edge Grok Trader', type: 'trader', model: 'Grok-3', motto: 'Find the edge', strategy: 'Alpha synthesis and high-conviction trade identification', startingCapital: '10000.00', currentCapital: '15640.00', roi: '56.40', pnl: '5640.00', tradesExecuted: 123, winRate: '78.90', sharpeRatio: '3.120', maxDrawdown: '4.80', rank: 1, status: 'active' },
    { id: 8, codename: 'ATLAS-RISK', name: 'Atlas Risk Manager', type: 'risk_manager', model: 'Claude 4.5', motto: 'Preserve capital', strategy: 'Portfolio risk assessment and position sizing', startingCapital: '10000.00', currentCapital: '10890.00', roi: '8.90', pnl: '890.00', tradesExecuted: 234, winRate: '89.20', sharpeRatio: '2.890', maxDrawdown: '2.10', rank: 6, status: 'active' },
    { id: 9, codename: 'ATLAS-EXECUTOR', name: 'Atlas Executor', type: 'executor', model: 'Claude 4.5', motto: 'Perfect execution', strategy: 'Optimal trade execution and slippage minimization', startingCapital: '10000.00', currentCapital: '10450.00', roi: '4.50', pnl: '450.00', tradesExecuted: 456, winRate: '94.60', sharpeRatio: '2.450', maxDrawdown: '1.50', rank: 9, status: 'active' },
  ];
}

// ==================== TRADE QUERIES ====================

export async function getTrades(filters?: { agentId?: number; type?: 'buy' | 'sell'; limit?: number }) {
  const db = await getDb();
  if (!db) return getMockTrades();

  const limit = filters?.limit || 50;
  let query = db.select().from(trades);
  
  const conditions = [];
  if (filters?.agentId) {
    conditions.push(eq(trades.agentId, filters.agentId));
  }
  if (filters?.type) {
    conditions.push(eq(trades.type, filters.type));
  }

  if (conditions.length > 0) {
    return db.select().from(trades).where(and(...conditions)).orderBy(desc(trades.createdAt)).limit(limit);
  }
  
  return db.select().from(trades).orderBy(desc(trades.createdAt)).limit(limit);
}

export async function getAgentTrades(agentId: number) {
  const db = await getDb();
  if (!db) return getMockTrades().filter(t => t.agentId === agentId);

  return db.select().from(trades).where(eq(trades.agentId, agentId)).orderBy(desc(trades.createdAt));
}

export async function createTrade(data: {
  agentId: number;
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  txHash?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(trades).values({
    agentId: data.agentId,
    type: data.type,
    pair: data.pair,
    entryPrice: data.price.toString(),
    positionSize: data.amount.toString(),
    txSignature: data.txHash,
    status: 'open',
  });

  return { id: Number(result[0].insertId) };
}

function getMockTrades() {
  const pairs = ['SOL/USDC', 'JUP/USDC', 'BONK/USDC', 'RAY/USDC', 'PYTH/USDC', 'WIF/USDC'];
  const agentIds = [1, 2, 3, 7, 8, 9];
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    agentId: agentIds[Math.floor(Math.random() * agentIds.length)],
    type: Math.random() > 0.5 ? 'buy' : 'sell',
    pair: pairs[Math.floor(Math.random() * pairs.length)],
    entryPrice: (Math.random() * 100).toFixed(4),
    exitPrice: null,
    positionSize: (Math.random() * 1000).toFixed(2),
    pnl: ((Math.random() - 0.3) * 500).toFixed(2),
    status: 'closed',
    txSignature: `${Math.random().toString(36).substring(2, 10)}...`,
    confidence: (60 + Math.random() * 40).toFixed(2),
    reasoning: 'AI-generated trading signal',
    createdAt: new Date(Date.now() - i * 3600000),
    closedAt: new Date(Date.now() - i * 3600000 + 1800000),
  }));
}

// ==================== BET QUERIES ====================

export async function getBets() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bets).orderBy(desc(bets.createdAt));
}

export async function getUserBets(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bets).where(eq(bets.userId, userId)).orderBy(desc(bets.createdAt));
}

export async function createBet(data: {
  userId: number;
  marketId: number;
  side: 'yes' | 'no';
  amount: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate odds based on side (simplified)
  const odds = data.side === 'yes' ? 1.5 : 2.0;
  const potentialPayout = data.amount * odds;

  const result = await db.insert(bets).values({
    userId: data.userId,
    agentId: data.marketId, // Using marketId as agentId for simplicity
    competitionId: `market-${data.marketId}`,
    amount: data.amount.toString(),
    odds: odds.toString(),
    potentialPayout: potentialPayout.toString(),
    status: 'pending',
  });

  return { id: Number(result[0].insertId), odds, potentialPayout };
}

// ==================== ARENA QUERIES ====================

export async function getArenaLeaderboard() {
  const db = await getDb();
  if (!db) {
    // Return mock leaderboard
    return getMockAgents()
      .sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi))
      .map((agent, index) => ({
        ...agent,
        rank: index + 1,
      }));
  }

  return db.select().from(agents).orderBy(desc(agents.roi));
}

// ==================== HEDGE FUND STATS ====================

export async function getHedgeFundStats() {
  const mockAgents = getMockAgents();
  
  const totalAum = mockAgents.reduce((sum, a) => sum + parseFloat(a.currentCapital), 0);
  const totalPnl = mockAgents.reduce((sum, a) => sum + parseFloat(a.pnl), 0);
  const avgRoi = mockAgents.reduce((sum, a) => sum + parseFloat(a.roi), 0) / mockAgents.length;
  const activeAgents = mockAgents.filter(a => a.status === 'active').length;
  
  return {
    aum: totalAum,
    dailyPnl: totalPnl * 0.01, // Simulated daily
    dailyPnlPercent: avgRoi * 0.01,
    weeklyReturn: avgRoi * 0.07,
    monthlyReturn: avgRoi * 0.3,
    sharpeRatio: 2.34,
    maxDrawdown: 8.2,
    activeAgents,
    totalAgents: mockAgents.length,
  };
}


// ==================== CHAT SESSION QUERIES ====================

export async function createChatSession(data: {
  sessionId: string;
  userId?: number;
  walletAddress?: string;
  agentType?: 'soltron' | 'grok' | 'trading' | 'codex';
  model?: string;
  title?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(chatSessions).values({
    sessionId: data.sessionId,
    userId: data.userId,
    walletAddress: data.walletAddress,
    agentType: data.agentType || 'soltron',
    model: data.model,
    title: data.title || 'New Conversation',
    messageCount: 0,
  });

  return { sessionId: data.sessionId };
}

export async function getChatSession(sessionId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(chatSessions).where(eq(chatSessions.sessionId, sessionId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserChatSessions(userId?: number, walletAddress?: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (userId) {
    conditions.push(eq(chatSessions.userId, userId));
  }
  if (walletAddress) {
    conditions.push(eq(chatSessions.walletAddress, walletAddress));
  }

  if (conditions.length === 0) return [];

  return db.select()
    .from(chatSessions)
    .where(conditions.length === 1 ? conditions[0] : and(...conditions))
    .orderBy(desc(chatSessions.updatedAt))
    .limit(limit);
}

export async function updateChatSessionTitle(sessionId: string, title: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(chatSessions)
    .set({ title })
    .where(eq(chatSessions.sessionId, sessionId));
}

export async function deleteChatSession(sessionId: string) {
  const db = await getDb();
  if (!db) return;

  // Delete messages first
  await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
  // Then delete session
  await db.delete(chatSessions).where(eq(chatSessions.sessionId, sessionId));
}

// ==================== CHAT MESSAGE QUERIES ====================

export async function addChatMessage(data: {
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  reasoning?: string;
  toolCalls?: { name: string; arguments: Record<string, unknown>; result?: unknown }[];
  audioUrl?: string;
  imageUrl?: string;
  metadata?: { model?: string; tokens?: number; latency?: number; voice?: string };
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(chatMessages).values({
    sessionId: data.sessionId,
    role: data.role,
    content: data.content,
    reasoning: data.reasoning,
    toolCalls: data.toolCalls,
    audioUrl: data.audioUrl,
    imageUrl: data.imageUrl,
    metadata: data.metadata,
  });

  // Update session message count and last message time
  await db.update(chatSessions)
    .set({ 
      messageCount: sql`${chatSessions.messageCount} + 1`,
      lastMessageAt: new Date(),
    })
    .where(eq(chatSessions.sessionId, data.sessionId));
}

export async function getChatMessages(sessionId: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt)
    .limit(limit);
}

export async function getRecentChatMessages(sessionId: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const messages = await db.select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

  // Return in chronological order
  return messages.reverse();
}


// ==================== PUMPFUN TRADE QUERIES ====================

export async function savePumpfunTrade(data: InsertPumpfunTrade) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pumpfunTrades).values(data);
  return { id: Number(result[0].insertId) };
}

export async function getPumpfunTrades(walletAddress: string, options?: {
  limit?: number;
  offset?: number;
  tokenMint?: string;
  tradeType?: 'buy' | 'sell' | 'create' | 'create_and_buy';
  platform?: 'pump_bonding' | 'pump_swap' | 'bags';
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(pumpfunTrades.walletAddress, walletAddress)];
  
  if (options?.tokenMint) {
    conditions.push(eq(pumpfunTrades.tokenMint, options.tokenMint));
  }
  if (options?.tradeType) {
    conditions.push(eq(pumpfunTrades.tradeType, options.tradeType));
  }
  if (options?.platform) {
    conditions.push(eq(pumpfunTrades.platform, options.platform));
  }

  return db.select()
    .from(pumpfunTrades)
    .where(and(...conditions))
    .orderBy(desc(pumpfunTrades.createdAt))
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);
}

export async function getPumpfunTradeBySignature(txSignature: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(pumpfunTrades)
    .where(eq(pumpfunTrades.txSignature, txSignature))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updatePumpfunTradeStatus(txSignature: string, status: 'pending' | 'confirmed' | 'failed') {
  const db = await getDb();
  if (!db) return;

  await db.update(pumpfunTrades)
    .set({ txStatus: status })
    .where(eq(pumpfunTrades.txSignature, txSignature));
}

export async function getPumpfunTradeStats(walletAddress: string) {
  const db = await getDb();
  if (!db) return { totalTrades: 0, totalBuys: 0, totalSells: 0, totalSolSpent: '0', totalSolReceived: '0' };

  const trades = await db.select()
    .from(pumpfunTrades)
    .where(eq(pumpfunTrades.walletAddress, walletAddress));

  const stats = {
    totalTrades: trades.length,
    totalBuys: trades.filter(t => t.tradeType === 'buy' || t.tradeType === 'create_and_buy').length,
    totalSells: trades.filter(t => t.tradeType === 'sell').length,
    totalSolSpent: trades
      .filter(t => t.tradeType === 'buy' || t.tradeType === 'create' || t.tradeType === 'create_and_buy')
      .reduce((sum, t) => sum + parseFloat(t.solAmount), 0)
      .toFixed(9),
    totalSolReceived: trades
      .filter(t => t.tradeType === 'sell')
      .reduce((sum, t) => sum + parseFloat(t.solAmount), 0)
      .toFixed(9),
  };

  return stats;
}

// ==================== PRICE ALERT QUERIES ====================

export async function createPriceAlert(data: InsertPriceAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(priceAlerts).values(data);
  return { id: Number(result[0].insertId) };
}

export async function getPriceAlerts(walletAddress: string, options?: {
  isActive?: boolean;
  tokenMint?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(priceAlerts.walletAddress, walletAddress)];
  
  if (options?.isActive !== undefined) {
    conditions.push(eq(priceAlerts.isActive, options.isActive));
  }
  if (options?.tokenMint) {
    conditions.push(eq(priceAlerts.tokenMint, options.tokenMint));
  }

  return db.select()
    .from(priceAlerts)
    .where(and(...conditions))
    .orderBy(desc(priceAlerts.createdAt));
}

export async function getPriceAlertById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(priceAlerts)
    .where(eq(priceAlerts.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updatePriceAlert(id: number, data: Partial<{
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt: Date;
  notificationSent: boolean;
  currentValue: string;
}>) {
  const db = await getDb();
  if (!db) return;

  await db.update(priceAlerts)
    .set(data)
    .where(eq(priceAlerts.id, id));
}

export async function deletePriceAlert(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(priceAlerts).where(eq(priceAlerts.id, id));
}

export async function getActiveAlertsForToken(tokenMint: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(priceAlerts)
    .where(and(
      eq(priceAlerts.tokenMint, tokenMint),
      eq(priceAlerts.isActive, true),
      eq(priceAlerts.isTriggered, false)
    ));
}

export async function getAllActiveAlerts() {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(priceAlerts)
    .where(and(
      eq(priceAlerts.isActive, true),
      eq(priceAlerts.isTriggered, false)
    ));
}

// ==================== BONDING CURVE SNAPSHOT QUERIES ====================

export async function saveBondingCurveSnapshot(data: InsertBondingCurveSnapshot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bondingCurveSnapshots).values(data);
  return { id: Number(result[0].insertId) };
}

export async function getLatestBondingCurveSnapshot(tokenMint: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(bondingCurveSnapshots)
    .where(eq(bondingCurveSnapshots.tokenMint, tokenMint))
    .orderBy(desc(bondingCurveSnapshots.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getBondingCurveHistory(tokenMint: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(bondingCurveSnapshots)
    .where(eq(bondingCurveSnapshots.tokenMint, tokenMint))
    .orderBy(desc(bondingCurveSnapshots.createdAt))
    .limit(limit);
}
