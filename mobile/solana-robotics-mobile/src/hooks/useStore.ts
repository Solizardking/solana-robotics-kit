/**
 * Global State Store using Zustand
 * Manages app-wide state for wallet, robot, and UI
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PublicKey } from '@solana/web3.js';
import {
  WalletState,
  RobotInfo,
  RobotConnectionState,
  AppState,
  DeveloperProfile,
  RobotTask,
  NetworkType,
} from '@types/index';
import { DEFAULT_NETWORK } from '@config/constants';

// =============================================================================
// STORE TYPES
// =============================================================================

interface StoreState {
  // App State
  app: AppState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNetwork: (network: NetworkType) => void;

  // Wallet State
  wallet: WalletState;
  setWallet: (wallet: Partial<WalletState>) => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
  updateBalance: (sol: number, kit: number) => void;

  // Robot State
  robot: RobotConnectionState;
  availableRobots: RobotInfo[];
  setRobot: (robot: Partial<RobotConnectionState>) => void;
  setAvailableRobots: (robots: RobotInfo[]) => void;
  connectRobot: (robot: RobotInfo) => void;
  disconnectRobot: () => void;

  // Tasks
  tasks: RobotTask[];
  currentTask: RobotTask | null;
  setTasks: (tasks: RobotTask[]) => void;
  setCurrentTask: (task: RobotTask | null) => void;

  // Developer Profile (Vibe to Earn)
  developer: DeveloperProfile | null;
  setDeveloper: (developer: DeveloperProfile | null) => void;

  // UI State
  modalVisible: string | null;
  showModal: (modalId: string) => void;
  hideModal: () => void;

  // Reset
  reset: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialAppState: AppState = {
  isLoading: false,
  error: null,
  network: DEFAULT_NETWORK,
};

const initialWalletState: WalletState = {
  connected: false,
  publicKey: null,
  address: null,
  balance: 0,
  kitBalance: 0,
};

const initialRobotState: RobotConnectionState = {
  connected: false,
  robot: null,
  connectionMethod: null,
  latency: 0,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // ==================== App State ====================
      app: initialAppState,

      setLoading: (isLoading) =>
        set((state) => ({ app: { ...state.app, isLoading } })),

      setError: (error) =>
        set((state) => ({ app: { ...state.app, error } })),

      setNetwork: (network) =>
        set((state) => ({ app: { ...state.app, network } })),

      // ==================== Wallet State ====================
      wallet: initialWalletState,

      setWallet: (wallet) =>
        set((state) => ({ wallet: { ...state.wallet, ...wallet } })),

      connectWallet: () =>
        set((state) => ({
          wallet: { ...state.wallet, connected: true },
        })),

      disconnectWallet: () =>
        set(() => ({ wallet: initialWalletState })),

      updateBalance: (balance, kitBalance) =>
        set((state) => ({
          wallet: { ...state.wallet, balance, kitBalance },
        })),

      // ==================== Robot State ====================
      robot: initialRobotState,
      availableRobots: [],

      setRobot: (robot) =>
        set((state) => ({ robot: { ...state.robot, ...robot } })),

      setAvailableRobots: (robots) =>
        set(() => ({ availableRobots: robots })),

      connectRobot: (robot) =>
        set(() => ({
          robot: {
            connected: true,
            robot,
            connectionMethod: 'wifi',
            latency: 0,
          },
        })),

      disconnectRobot: () =>
        set(() => ({ robot: initialRobotState })),

      // ==================== Tasks ====================
      tasks: [],
      currentTask: null,

      setTasks: (tasks) => set(() => ({ tasks })),

      setCurrentTask: (currentTask) => set(() => ({ currentTask })),

      // ==================== Developer Profile ====================
      developer: null,

      setDeveloper: (developer) => set(() => ({ developer })),

      // ==================== UI State ====================
      modalVisible: null,

      showModal: (modalId) => set(() => ({ modalVisible: modalId })),

      hideModal: () => set(() => ({ modalVisible: null })),

      // ==================== Reset ====================
      reset: () =>
        set(() => ({
          app: initialAppState,
          wallet: initialWalletState,
          robot: initialRobotState,
          availableRobots: [],
          tasks: [],
          currentTask: null,
          developer: null,
          modalVisible: null,
        })),
    }),
    {
      name: 'solana-robotics-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these fields
        app: { network: state.app.network },
        developer: state.developer,
      }),
    }
  )
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

export const useWallet = () => useStore((state) => state.wallet);
export const useRobot = () => useStore((state) => state.robot);
export const useApp = () => useStore((state) => state.app);
export const useTasks = () => useStore((state) => state.tasks);
export const useDeveloper = () => useStore((state) => state.developer);

// =============================================================================
// ACTION HOOKS
// =============================================================================

export const useWalletActions = () => {
  const store = useStore();
  return {
    setWallet: store.setWallet,
    connectWallet: store.connectWallet,
    disconnectWallet: store.disconnectWallet,
    updateBalance: store.updateBalance,
  };
};

export const useRobotActions = () => {
  const store = useStore();
  return {
    setRobot: store.setRobot,
    setAvailableRobots: store.setAvailableRobots,
    connectRobot: store.connectRobot,
    disconnectRobot: store.disconnectRobot,
  };
};

export const useAppActions = () => {
  const store = useStore();
  return {
    setLoading: store.setLoading,
    setError: store.setError,
    setNetwork: store.setNetwork,
  };
};

export default useStore;
