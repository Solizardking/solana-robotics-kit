/**
 * Solana Robotics Mobile - Type Definitions
 */

import { PublicKey } from '@solana/web3.js';

// =============================================================================
// TOKEN TYPES
// =============================================================================

export interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
}

export interface TokenBalance {
  mint: string;
  balance: number;
  uiAmount: number;
  decimals: number;
}

// =============================================================================
// ROBOT TYPES
// =============================================================================

export type RobotStatus = 'idle' | 'active' | 'busy' | 'offline' | 'error';

export type RobotCapability =
  | 'navigation'
  | 'manipulation'
  | 'delivery'
  | 'vision'
  | 'voice'
  | 'inspection';

export interface RobotInfo {
  id: string;
  name: string;
  publicKey: string;
  status: RobotStatus;
  capabilities: RobotCapability[];
  location?: {
    latitude: number;
    longitude: number;
  };
  batteryLevel?: number;
  ipAddress?: string;
  lastSeen: Date;
}

export interface RobotRegistration {
  robotId: string;
  name: string;
  capabilities: RobotCapability[];
  stakeAmount: number;
  owner: string;
}

export interface RobotTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  robotId?: string;
  reward: number;
  createdAt: Date;
  deadline?: Date;
  requiredCapabilities: RobotCapability[];
}

// =============================================================================
// NVIDIA AI TYPES
// =============================================================================

export interface PerceptionResult {
  objects: DetectedObject[];
  scene: string;
  confidence: number;
  processingTime: number;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ReasoningRequest {
  context: string;
  task: string;
  constraints?: string[];
}

export interface ReasoningResult {
  plan: string[];
  actions: RobotAction[];
  confidence: number;
  reasoning: string;
}

export interface RobotAction {
  type: 'move' | 'grab' | 'release' | 'speak' | 'scan' | 'wait';
  parameters: Record<string, any>;
  duration?: number;
}

// =============================================================================
// WALLET TYPES
// =============================================================================

export interface WalletState {
  connected: boolean;
  publicKey: PublicKey | null;
  address: string | null;
  balance: number;
  kitBalance: number;
}

export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}

// =============================================================================
// APP STATE TYPES
// =============================================================================

export interface AppState {
  isLoading: boolean;
  error: string | null;
  network: 'mainnet-beta' | 'devnet' | 'testnet';
}

export interface RobotConnectionState {
  connected: boolean;
  robot: RobotInfo | null;
  connectionMethod: 'bluetooth' | 'wifi' | 'cloud' | null;
  latency: number;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// =============================================================================
// VIBE TO EARN TYPES
// =============================================================================

export interface DeveloperProfile {
  githubUsername: string;
  walletAddress: string | null;
  totalRewards: number;
  pendingRewards: number;
  tier: 'newcomer' | 'contributor' | 'regular' | 'core' | 'maintainer' | 'legend';
  contributionCount: number;
  streakDays: number;
}

export interface Contribution {
  id: string;
  type: string;
  description: string;
  rewardAmount: number;
  timestamp: Date;
  claimed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  developer: string;
  totalRewards: number;
  tier: string;
  contributionCount: number;
}
