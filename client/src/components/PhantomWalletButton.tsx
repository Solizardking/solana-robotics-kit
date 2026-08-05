'use client';

import { useState } from 'react';
import { usePhantomWallet } from '@/contexts/PhantomContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, LogOut, Copy, ExternalLink, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PhantomWalletButtonProps {
  className?: string;
  compact?: boolean;
}

export function PhantomWalletButton({ className = '', compact = false }: PhantomWalletButtonProps) {
  const { 
    isConnected, 
    isLoading, 
    openModal, 
    disconnect, 
    getSolanaAddress,
    getEthereumAddress,
    user 
  } = usePhantomWallet();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const solanaAddress = getSolanaAddress();
  const ethereumAddress = getEthereumAddress();

  const truncateAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const copyAddress = async (address: string | null, type: string) => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success(`${type} address copied!`);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnect();
      toast.success('Wallet disconnected');
    } catch (error) {
      toast.error('Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const openExplorer = (address: string | null, type: 'solana' | 'ethereum') => {
    if (!address) return;
    const url = type === 'solana' 
      ? `https://solscan.io/account/${address}?cluster=devnet`
      : `https://etherscan.io/address/${address}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <Button 
        variant="outline" 
        disabled 
        className={`gap-2 border-primary/50 ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        {!compact && <span>Connecting...</span>}
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <Button
        onClick={openModal}
        className={`gap-2 bg-gradient-to-r from-[#534BB1] to-[#551BF9] hover:from-[#6359c1] hover:to-[#6b2fff] text-white border-0 ${className}`}
      >
        <Wallet className="w-4 h-4" />
        {!compact && <span>Connect Wallet</span>}
      </Button>
    );
  }

  // Connected state
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`gap-2 border-primary/50 hover:border-primary hover:bg-primary/10 ${className}`}
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#534BB1] to-[#551BF9] flex items-center justify-center">
            <Wallet className="w-3 h-3 text-white" />
          </div>
          {!compact && (
            <>
              <span className="font-mono text-sm">
                {truncateAddress(solanaAddress)}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-zinc-950 border-zinc-800">
        {/* User info */}
        {user && (
          <div className="px-3 py-2 border-b border-zinc-800">
            <p className="text-xs text-muted-foreground">Connected via Phantom</p>
            {(user as any).email && (
              <p className="text-sm font-medium truncate">{(user as any).email}</p>
            )}
          </div>
        )}

        {/* Solana Address */}
        {solanaAddress && (
          <>
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground mb-1">Solana</p>
              <p className="font-mono text-sm text-primary">{truncateAddress(solanaAddress)}</p>
            </div>
            <DropdownMenuItem onClick={() => copyAddress(solanaAddress, 'Solana')}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Solana Address
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openExplorer(solanaAddress, 'solana')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Solscan
            </DropdownMenuItem>
          </>
        )}

        {/* Ethereum Address */}
        {ethereumAddress && (
          <>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground mb-1">Ethereum</p>
              <p className="font-mono text-sm text-blue-400">{truncateAddress(ethereumAddress)}</p>
            </div>
            <DropdownMenuItem onClick={() => copyAddress(ethereumAddress, 'Ethereum')}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Ethereum Address
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openExplorer(ethereumAddress, 'ethereum')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Etherscan
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="bg-zinc-800" />
        
        {/* Disconnect */}
        <DropdownMenuItem 
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="text-red-400 focus:text-red-400"
        >
          {isDisconnecting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 mr-2" />
          )}
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PhantomWalletButton;
