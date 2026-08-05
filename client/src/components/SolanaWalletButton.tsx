import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, Copy, ExternalLink, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SolanaWalletButton() {
  const { setVisible } = useWalletModal();
  const {
    connected,
    connecting,
    address,
    shortAddress,
    balance,
    balanceLoading,
    disconnect,
    wallet,
  } = useSolanaWallet();

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard");
    }
  };

  const openExplorer = () => {
    if (address) {
      window.open(`https://solscan.io/account/${address}?cluster=devnet`, "_blank");
    }
  };

  if (connecting) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2 border-primary/50">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="hidden sm:inline">Connecting...</span>
      </Button>
    );
  }

  if (connected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-500/10 bg-cyan-500/5"
          >
            {wallet?.adapter.icon && (
              <img
                src={wallet.adapter.icon}
                alt={wallet.adapter.name}
                className="w-4 h-4"
              />
            )}
            <span className="font-mono text-cyan-400">{shortAddress}</span>
            {!balanceLoading && balance !== null && (
              <span className="hidden md:inline text-xs text-zinc-500 ml-1">
                ({balance.toFixed(2)} SOL)
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800">
          <div className="px-3 py-2 border-b border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">Connected Wallet</p>
            <p className="font-mono text-sm text-white truncate">{address}</p>
            {balance !== null && (
              <p className="text-sm text-cyan-400 mt-1">
                {balance.toFixed(4)} SOL
              </p>
            )}
          </div>
          <DropdownMenuItem onClick={copyAddress} className="gap-2 cursor-pointer">
            <Copy className="w-4 h-4" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openExplorer} className="gap-2 cursor-pointer">
            <ExternalLink className="w-4 h-4" />
            View on Solscan
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem
            onClick={() => {
              disconnect();
              toast.info("Wallet disconnected");
            }}
            className="gap-2 text-red-400 cursor-pointer focus:text-red-400"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      onClick={() => setVisible(true)}
      size="sm"
      className="gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white border-0"
    >
      <Wallet className="w-4 h-4" />
      <span className="hidden sm:inline">Connect Wallet</span>
    </Button>
  );
}

export default SolanaWalletButton;
