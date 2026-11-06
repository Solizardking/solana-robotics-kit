import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  walletAddress: varchar("walletAddress", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Robots table for the Robot Registry
 */
export const robots = mysqlTable("robots", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  codename: varchar("codename", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", [
    "market_analyst",
    "social_analyst", 
    "news_analyst",
    "fundamental_analyst",
    "bullish_researcher",
    "bearish_researcher",
    "trader",
    "risk_manager",
    "executor"
  ]).notNull(),
  model: varchar("model", { length: 128 }).notNull(),
  description: text("description"),
  capabilities: json("capabilities").$type<string[]>(),
  platform: varchar("platform", { length: 64 }),
  computeTops: int("computeTops"),
  powerRange: varchar("powerRange", { length: 32 }),
  status: mysqlEnum("status", ["active", "idle", "busy", "offline"]).default("idle").notNull(),
  tasksCompleted: int("tasksCompleted").default(0).notNull(),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Robot = typeof robots.$inferSelect;
export type InsertRobot = typeof robots.$inferInsert;

/**
 * GR00T Avatars created by users
 */
export const avatars = mysqlTable("avatars", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  colorScheme: varchar("colorScheme", { length: 64 }).default("solana_purple"),
  personality: json("personality").$type<{
    traits: string[];
    tradingStyle: string;
    riskTolerance: string;
  }>(),
  capabilities: json("capabilities").$type<string[]>(),
  safetyParams: json("safetyParams").$type<{
    maxPositionSize: number;
    stopLossPercent: number;
    takeProfitPercent: number;
  }>(),
  aiModel: varchar("aiModel", { length: 128 }).default("nvidia/nemotron-3-nano-30b-a3b"),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Avatar = typeof avatars.$inferSelect;
export type InsertAvatar = typeof avatars.$inferInsert;

/**
 * Web3 Hedge Fund Agents - The 9 specialized AI agents
 */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  codename: varchar("codename", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", [
    "market_analyst",
    "social_analyst",
    "news_analyst", 
    "fundamental_analyst",
    "bullish_researcher",
    "bearish_researcher",
    "trader",
    "risk_manager",
    "executor"
  ]).notNull(),
  model: varchar("model", { length: 128 }).notNull(),
  motto: text("motto"),
  strategy: text("strategy"),
  startingCapital: decimal("startingCapital", { precision: 18, scale: 2 }).default("10000.00").notNull(),
  currentCapital: decimal("currentCapital", { precision: 18, scale: 2 }).default("10000.00").notNull(),
  roi: decimal("roi", { precision: 10, scale: 4 }).default("0.0000").notNull(),
  pnl: decimal("pnl", { precision: 18, scale: 2 }).default("0.00").notNull(),
  tradesExecuted: int("tradesExecuted").default(0).notNull(),
  winRate: decimal("winRate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  sharpeRatio: decimal("sharpeRatio", { precision: 6, scale: 3 }).default("0.000").notNull(),
  maxDrawdown: decimal("maxDrawdown", { precision: 5, scale: 2 }).default("0.00").notNull(),
  rank: int("rank"),
  status: mysqlEnum("status", ["active", "idle", "competing"]).default("idle").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Trade history for agents
 */
export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  type: mysqlEnum("type", ["buy", "sell", "long", "short"]).notNull(),
  pair: varchar("pair", { length: 32 }).notNull(),
  entryPrice: decimal("entryPrice", { precision: 18, scale: 8 }).notNull(),
  exitPrice: decimal("exitPrice", { precision: 18, scale: 8 }),
  positionSize: decimal("positionSize", { precision: 18, scale: 8 }).notNull(),
  pnl: decimal("pnl", { precision: 18, scale: 2 }),
  status: mysqlEnum("status", ["open", "closed", "cancelled"]).default("open").notNull(),
  txSignature: varchar("txSignature", { length: 128 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  reasoning: text("reasoning"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

/**
 * Prediction Market Bets
 */
export const bets = mysqlTable("bets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId").notNull(),
  competitionId: varchar("competitionId", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 18, scale: 6 }).notNull(),
  currency: varchar("currency", { length: 16 }).default("USDC").notNull(),
  odds: decimal("odds", { precision: 8, scale: 4 }),
  potentialPayout: decimal("potentialPayout", { precision: 18, scale: 6 }),
  status: mysqlEnum("status", ["pending", "won", "lost", "cancelled"]).default("pending").notNull(),
  txSignature: varchar("txSignature", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  settledAt: timestamp("settledAt"),
});

export type Bet = typeof bets.$inferSelect;
export type InsertBet = typeof bets.$inferInsert;

/**
 * Arena Competitions
 */
export const competitions = mysqlTable("competitions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  prizePool: decimal("prizePool", { precision: 18, scale: 2 }).default("0.00").notNull(),
  bettingVolume: decimal("bettingVolume", { precision: 18, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["upcoming", "live", "completed"]).default("upcoming").notNull(),
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),
  winnerId: int("winnerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Competition = typeof competitions.$inferSelect;
export type InsertCompetition = typeof competitions.$inferInsert;


/**
 * SOLtron Chat Sessions for persistent conversation history
 */
export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  userId: int("userId"),
  walletAddress: varchar("walletAddress", { length: 64 }),
  title: varchar("title", { length: 256 }),
  agentType: mysqlEnum("agentType", ["soltron", "grok", "trading", "codex"]).default("soltron").notNull(),
  model: varchar("model", { length: 128 }),
  messageCount: int("messageCount").default(0).notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

/**
 * Chat Messages within sessions
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system", "tool"]).notNull(),
  content: text("content").notNull(),
  reasoning: text("reasoning"),
  toolCalls: json("toolCalls").$type<{
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
  }[]>(),
  audioUrl: text("audioUrl"),
  imageUrl: text("imageUrl"),
  metadata: json("metadata").$type<{
    model?: string;
    tokens?: number;
    latency?: number;
    voice?: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;


/**
 * 3D Models uploaded by users (VRM, GLB, FBX, OBJ)
 */
export const models3d = mysqlTable("models_3d", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  walletAddress: varchar("walletAddress", { length: 64 }),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  filename: varchar("filename", { length: 256 }).notNull(),
  fileType: mysqlEnum("fileType", ["vrm", "glb", "gltf", "fbx", "obj"]).notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  storagePath: varchar("storagePath", { length: 512 }).notNull(),
  publicUrl: text("publicUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  metadata: json("metadata").$type<{
    vertices?: number;
    faces?: number;
    materials?: number;
    animations?: string[];
    bones?: number;
    textures?: string[];
    // FAL AI generation metadata
    generatedBy?: string;
    model?: string;
    sourceImage?: string;
    requestId?: string;
    seed?: number;
  }>(),
  tags: json("tags").$type<string[]>(),
  isPublic: boolean("isPublic").default(false).notNull(),
  downloads: int("downloads").default(0).notNull(),
  views: int("views").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Model3D = typeof models3d.$inferSelect;
export type InsertModel3D = typeof models3d.$inferInsert;


/**
 * Pump.fun Trade History for tracking all trades
 */
export const pumpfunTrades = mysqlTable("pumpfun_trades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  walletAddress: varchar("walletAddress", { length: 64 }).notNull(),
  tradeType: mysqlEnum("tradeType", ["buy", "sell", "create", "create_and_buy"]).notNull(),
  tokenMint: varchar("tokenMint", { length: 64 }).notNull(),
  tokenSymbol: varchar("tokenSymbol", { length: 32 }),
  tokenName: varchar("tokenName", { length: 128 }),
  tokenAmount: decimal("tokenAmount", { precision: 24, scale: 9 }).notNull(),
  solAmount: decimal("solAmount", { precision: 18, scale: 9 }).notNull(),
  pricePerToken: decimal("pricePerToken", { precision: 24, scale: 18 }),
  slippage: decimal("slippage", { precision: 5, scale: 2 }),
  txSignature: varchar("txSignature", { length: 128 }).notNull(),
  txStatus: mysqlEnum("txStatus", ["pending", "confirmed", "failed"]).default("pending").notNull(),
  platform: mysqlEnum("platform", ["pump_bonding", "pump_swap", "bags"]).default("pump_bonding").notNull(),
  bondingCurveAddress: varchar("bondingCurveAddress", { length: 64 }),
  poolAddress: varchar("poolAddress", { length: 64 }),
  feesPaid: decimal("feesPaid", { precision: 18, scale: 9 }),
  blockTime: timestamp("blockTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PumpfunTrade = typeof pumpfunTrades.$inferSelect;
export type InsertPumpfunTrade = typeof pumpfunTrades.$inferInsert;

/**
 * Price Alerts for token price and market cap notifications
 */
export const priceAlerts = mysqlTable("price_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  walletAddress: varchar("walletAddress", { length: 64 }).notNull(),
  tokenMint: varchar("tokenMint", { length: 64 }).notNull(),
  tokenSymbol: varchar("tokenSymbol", { length: 32 }),
  tokenName: varchar("tokenName", { length: 128 }),
  alertType: mysqlEnum("alertType", ["price_above", "price_below", "mcap_above", "mcap_below", "graduation"]).notNull(),
  targetValue: decimal("targetValue", { precision: 24, scale: 9 }).notNull(),
  currentValue: decimal("currentValue", { precision: 24, scale: 9 }),
  isActive: boolean("isActive").default(true).notNull(),
  isTriggered: boolean("isTriggered").default(false).notNull(),
  triggeredAt: timestamp("triggeredAt"),
  notificationSent: boolean("notificationSent").default(false).notNull(),
  notificationMethod: mysqlEnum("notificationMethod", ["in_app", "email", "push"]).default("in_app").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = typeof priceAlerts.$inferInsert;

/**
 * Bonding Curve Snapshots for tracking graduation progress
 */
export const bondingCurveSnapshots = mysqlTable("bonding_curve_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  tokenMint: varchar("tokenMint", { length: 64 }).notNull(),
  tokenSymbol: varchar("tokenSymbol", { length: 32 }),
  bondingCurveAddress: varchar("bondingCurveAddress", { length: 64 }).notNull(),
  virtualTokenReserves: decimal("virtualTokenReserves", { precision: 24, scale: 0 }),
  virtualSolReserves: decimal("virtualSolReserves", { precision: 24, scale: 0 }),
  realTokenReserves: decimal("realTokenReserves", { precision: 24, scale: 0 }),
  realSolReserves: decimal("realSolReserves", { precision: 24, scale: 0 }),
  tokenTotalSupply: decimal("tokenTotalSupply", { precision: 24, scale: 0 }),
  complete: boolean("complete").default(false).notNull(),
  graduationProgress: decimal("graduationProgress", { precision: 5, scale: 2 }),
  marketCap: decimal("marketCap", { precision: 18, scale: 2 }),
  pricePerToken: decimal("pricePerToken", { precision: 24, scale: 18 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BondingCurveSnapshot = typeof bondingCurveSnapshots.$inferSelect;
export type InsertBondingCurveSnapshot = typeof bondingCurveSnapshots.$inferInsert;
