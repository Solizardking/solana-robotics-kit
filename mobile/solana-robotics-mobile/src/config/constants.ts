/**
 * Solana Robotics Mobile - Configuration Constants
 */

import { PublicKey, clusterApiUrl } from '@solana/web3.js';

// =============================================================================
// NETWORK CONFIGURATION
// =============================================================================

export const NETWORKS = {
  'mainnet-beta': {
    name: 'Mainnet',
    rpcUrl: clusterApiUrl('mainnet-beta'),
    wsUrl: 'wss://api.mainnet-beta.solana.com',
  },
  devnet: {
    name: 'Devnet',
    rpcUrl: clusterApiUrl('devnet'),
    wsUrl: 'wss://api.devnet.solana.com',
  },
  testnet: {
    name: 'Testnet',
    rpcUrl: clusterApiUrl('testnet'),
    wsUrl: 'wss://api.testnet.solana.com',
  },
} as const;

export type NetworkType = keyof typeof NETWORKS;

export const DEFAULT_NETWORK: NetworkType = 'devnet';

// =============================================================================
// TOKEN CONFIGURATION
// =============================================================================

export const KIT_TOKEN = {
  mint: new PublicKey('DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS'),
  symbol: '$KIT',
  name: 'Solana Robotics Kit Token',
  decimals: 9,
  logoUri: 'https://raw.githubusercontent.com/8bitsats/Solana-Robotics-Kit/main/assets/kit-token.png',
};

export const FEE_WALLET = new PublicKey('DZbPqtV5jrCaT7NY4D7BDwje3r8kw3t7JB43AXZZBAGS');

// =============================================================================
// STAKING TIERS
// =============================================================================

export const STAKING_TIERS = {
  basic: {
    name: 'Basic',
    stake: 100,
    capabilities: ['Standard robot registration'],
  },
  standard: {
    name: 'Standard',
    stake: 500,
    capabilities: ['Enhanced matching', 'Priority support'],
  },
  premium: {
    name: 'Premium',
    stake: 2000,
    capabilities: ['Premium task access', 'Reduced fees', 'Priority matching'],
  },
  enterprise: {
    name: 'Enterprise',
    stake: 10000,
    capabilities: ['Full access', 'Governance voting', 'Custom SLAs', 'Dedicated support'],
  },
} as const;

export type StakingTier = keyof typeof STAKING_TIERS;

// =============================================================================
// ROBOT CONFIGURATION
// =============================================================================

export const ROBOT_CAPABILITIES = [
  { id: 'navigation', name: 'Navigation', icon: 'compass' },
  { id: 'manipulation', name: 'Manipulation', icon: 'hand' },
  { id: 'delivery', name: 'Delivery', icon: 'package' },
  { id: 'vision', name: 'Vision', icon: 'eye' },
  { id: 'voice', name: 'Voice', icon: 'mic' },
  { id: 'inspection', name: 'Inspection', icon: 'search' },
] as const;

export const ROBOT_STATUS_COLORS = {
  idle: '#6B7280',      // Gray
  active: '#10B981',    // Green
  busy: '#F59E0B',      // Yellow
  offline: '#EF4444',   // Red
  error: '#DC2626',     // Dark Red
} as const;

// =============================================================================
// API CONFIGURATION
// =============================================================================

export const API_CONFIG = {
  baseUrl: 'https://api.solanarobotics.org',
  vibeApiUrl: 'https://api.solanarobotics.org/vibe',
  robotApiUrl: 'https://api.solanarobotics.org/robots',
  timeout: 30000,
};

export const BAGS_API = {
  baseUrl: 'https://api.bags.fm',
  version: 'v1',
};

// =============================================================================
// NVIDIA AI CONFIGURATION
// =============================================================================

export const NVIDIA_CONFIG = {
  cosmosEndpoint: 'https://integrate.api.nvidia.com/v1/cosmos',
  nemotronEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
  isaacEndpoint: 'http://localhost:8080/isaac',  // Local Jetson
  models: {
    perception: 'nvidia/cosmos-vision-1.0',
    reasoning: 'nvidia/nemotron-340b-instruct',
    control: 'nvidia/isaac-ros-2',
  },
};

// =============================================================================
// APP CONFIGURATION
// =============================================================================

export const APP_CONFIG = {
  name: 'Solana Robotics',
  version: '1.0.0',
  buildNumber: 1,
  bundleId: 'org.solanarobotics.mobile',
  supportEmail: 'support@solanarobotics.org',
  websiteUrl: 'https://solanarobotics.org',
  discordUrl: 'https://discord.gg/solanarobotics',
  twitterUrl: 'https://twitter.com/SolanaRobotics',
  githubUrl: 'https://github.com/8bitsats/Solana-Robotics-Kit',
};

// =============================================================================
// MOBILE WALLET ADAPTER CONFIGURATION
// =============================================================================

export const MWA_CONFIG = {
  appIdentity: {
    name: APP_CONFIG.name,
    uri: APP_CONFIG.websiteUrl,
    icon: 'favicon.ico',
  },
  cluster: DEFAULT_NETWORK,
};

// =============================================================================
// TRANSACTION CONFIGURATION
// =============================================================================

export const TX_CONFIG = {
  priorityFee: 5000,  // Lamports
  maxRetries: 3,
  confirmationTimeout: 60000,  // ms
  commitment: 'confirmed' as const,
};
