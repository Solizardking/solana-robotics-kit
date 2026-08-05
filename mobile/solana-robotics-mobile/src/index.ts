/**
 * Solana Robotics Mobile App
 * Main entry point with polyfills
 */

// Import polyfills first
import './polyfills';

// Export all services
export { SolanaService, solanaService } from './services/SolanaService';
export { RobotService, robotService } from './services/RobotService';

// Export hooks
export {
  useStore,
  useWallet,
  useRobot,
  useApp,
  useTasks,
  useDeveloper,
  useWalletActions,
  useRobotActions,
  useAppActions,
} from './hooks/useStore';

// Export types
export * from './types';

// Export config
export * from './config/constants';
