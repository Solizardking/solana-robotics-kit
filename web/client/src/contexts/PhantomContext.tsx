'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { 
  PhantomProvider as PhantomSDKProvider, 
  usePhantom, 
  useModal,
  darkTheme,
  AddressType 
} from '@phantom/react-sdk';

// Phantom App Configuration
const PHANTOM_APP_ID = 'ca64d843-e155-44d8-87c5-58a33d03470e';
const PHANTOM_APP_NAME = 'Solana Robotics';

// Determine redirect URL based on environment
const getRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000/auth/callback';
    }
    if (hostname.includes('solanarobotics.org')) {
      return 'https://solanarobotics.org/auth/callback';
    }
    // For Manus preview URLs
    return `${window.location.origin}/auth/callback`;
  }
  return 'http://localhost:3000/auth/callback';
};

// Use the dark theme from Phantom SDK
// Custom theming can be applied via CSS variables in the app

interface PhantomContextValue {
  isConnected: boolean;
  isLoading: boolean;
  user: any;
  openModal: () => void;
  closeModal: () => void;
  isModalOpen: boolean;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<Uint8Array | null>;
  signTransaction: (transaction: any) => Promise<any>;
  getSolanaAddress: () => string | null;
  getEthereumAddress: () => string | null;
  solanaBalance: number | null;
}

const PhantomContext = createContext<PhantomContextValue | null>(null);

function PhantomContextProvider({ children }: { children: ReactNode }) {
  const phantom = usePhantom();
  const modal = useModal();
  const [solanaBalance, setSolanaBalance] = useState<number | null>(null);

  // Fetch Solana balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (phantom.isConnected) {
        try {
          // Balance fetching would be done via RPC
          // For now, we'll set a placeholder
          setSolanaBalance(0);
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      } else {
        setSolanaBalance(null);
      }
    };
    fetchBalance();
  }, [phantom.isConnected]);

  const signMessage = async (message: string): Promise<Uint8Array | null> => {
    if (!phantom.isConnected) return null;
    try {
      const encodedMessage = new TextEncoder().encode(message);
      // Use the solana provider from phantom
      const solanaProvider = (phantom as any).solana;
      if (solanaProvider?.signMessage) {
        const signature = await solanaProvider.signMessage(encodedMessage);
        return signature;
      }
      return null;
    } catch (error) {
      console.error('Error signing message:', error);
      return null;
    }
  };

  const signTransaction = async (transaction: any): Promise<any> => {
    if (!phantom.isConnected) return null;
    try {
      const solanaProvider = (phantom as any).solana;
      if (solanaProvider?.signTransaction) {
        const signedTx = await solanaProvider.signTransaction(transaction);
        return signedTx;
      }
      return null;
    } catch (error) {
      console.error('Error signing transaction:', error);
      return null;
    }
  };

  const disconnect = async () => {
    try {
      const wallet = (phantom as any).wallet;
      if (wallet?.disconnect) {
        await wallet.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const getSolanaAddress = (): string | null => {
    const user = phantom.user as any;
    if (user?.solana?.address) {
      return user.solana.address;
    }
    // Try alternative path
    if (user?.addresses?.solana) {
      return user.addresses.solana;
    }
    return null;
  };

  const getEthereumAddress = (): string | null => {
    const user = phantom.user as any;
    if (user?.ethereum?.address) {
      return user.ethereum.address;
    }
    // Try alternative path
    if (user?.addresses?.ethereum) {
      return user.addresses.ethereum;
    }
    return null;
  };

  const value: PhantomContextValue = {
    isConnected: phantom.isConnected,
    isLoading: !phantom.isConnected && modal.isOpened,
    user: phantom.user,
    openModal: modal.open,
    closeModal: modal.close,
    isModalOpen: modal.isOpened,
    disconnect,
    signMessage,
    signTransaction,
    getSolanaAddress,
    getEthereumAddress,
    solanaBalance,
  };

  return (
    <PhantomContext.Provider value={value}>
      {children}
    </PhantomContext.Provider>
  );
}

interface PhantomProviderProps {
  children: ReactNode;
}

export function PhantomProvider({ children }: PhantomProviderProps) {
  const [redirectUrl, setRedirectUrl] = useState('http://localhost:3000/auth/callback');

  useEffect(() => {
    setRedirectUrl(getRedirectUrl());
  }, []);

  return (
    <PhantomSDKProvider
      config={{
        providers: ['google', 'apple', 'injected'],
        appId: PHANTOM_APP_ID,
        addressTypes: [
          AddressType.solana,
          AddressType.ethereum,
          AddressType.bitcoinSegwit,
          AddressType.sui,
        ],
        authOptions: {
          redirectUrl,
        },
      }}
      theme={darkTheme}
      appIcon="/favicon.ico"
      appName={PHANTOM_APP_NAME}
    >
      <PhantomContextProvider>
        {children}
      </PhantomContextProvider>
    </PhantomSDKProvider>
  );
}

export function usePhantomWallet() {
  const context = useContext(PhantomContext);
  if (!context) {
    throw new Error('usePhantomWallet must be used within a PhantomProvider');
  }
  return context;
}

export { PhantomContext };
