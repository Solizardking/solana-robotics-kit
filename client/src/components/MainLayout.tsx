'use client';

import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl, isLoginConfigured } from '@/const';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PhantomWalletButton } from '@/components/PhantomWalletButton';
import TokenPrice from '@/components/TokenPrice';
import XSearchBar from '@/components/XSearchBar';
import TrendingTokensTicker from '@/components/TrendingTokensTicker';
import { toast } from 'sonner';
import {
  Bot,
  Home,
  Cpu,
  Sparkles,
  Swords,
  TrendingUp,
  Target,
  Zap,
  Activity,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  User,
  ChevronRight,
  Terminal,
  Book,
  ExternalLink,
  Wallet,
  Shield,
  BarChart3,
  Copy,
  Check,
  ShoppingCart,
  IdCard,
  Github,
  Mic,
  MessageSquare,
  Rocket,
  Coins,
  History,
  Bell,
  Code2,
  Stamp,
  Flame,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MainLayoutProps {
  children: ReactNode;
}

const CLAWD_CONTRACT_ADDRESS = '8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump';
const JUPITER_SWAP_URL = `https://jup.ag/swap/SOL-${CLAWD_CONTRACT_ADDRESS}`;

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/gate', label: 'Token Gate', icon: Shield },
  { href: '/robots', label: 'Robot Registry', icon: Bot },
  { href: '/soltron-companion', label: 'SOLtron Companion', icon: Cpu },
  { href: '/asimov', label: 'Asimov v1', icon: Cpu },
  { href: '/avatar', label: 'GR00T Avatar', icon: Sparkles },
  { href: '/arena', label: 'Agent Arena', icon: Swords },
  { href: '/hedge-fund', label: 'Hedge Fund', icon: TrendingUp },
  { href: '/prediction-market', label: 'Prediction Market', icon: Target },
  { href: '/portfolio', label: 'Portfolio', icon: BarChart3 },
  { href: '/soltron', label: 'SOLtron', icon: Zap },
  { href: '/trade-feed', label: 'Live Trades', icon: Activity },
  { href: '/terminal', label: 'Trading Terminal', icon: Terminal },
  { href: '/docs', label: 'Documentation', icon: Book },
  { href: '/passport', label: 'Robot Passport', icon: IdCard },
  { href: '/models', label: '3D Models', icon: Cpu },
  { href: '/voice', label: 'Voice Agent', icon: Mic },
  { href: '/ai', label: 'AI Trading', icon: MessageSquare },
  { href: '/solbot', label: 'SOLbot', icon: Bot },
  { href: '/launch', label: 'Token Launch', icon: Rocket },
  { href: '/fees', label: 'Claim Fees', icon: Coins },
  { href: '/history', label: 'Trade History', icon: History },
  { href: '/alerts', label: 'Price Alerts', icon: Bell },
  { href: '/vibe-studio', label: 'Vibe Studio', icon: Code2 },
  { href: '/nft-forge', label: 'NFT Forge', icon: Stamp },
  { href: '/burn', label: 'Burn & Reclaim', icon: Flame },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const socialLinks = [
  {
    href: 'https://x.com/solanarobotics',
    label: 'X (Twitter)',
    icon: () => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    href: 'https://github.com/8bitsats/solana-robotics-kit',
    label: 'GitHub',
    icon: Github,
  },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(CLAWD_CONTRACT_ADDRESS);
      setCopied(true);
      toast.success('Contract address copied!', {
        description: CLAWD_CONTRACT_ADDRESS.slice(0, 20) + '...',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Trending Tokens Ticker - Desktop Only */}
      <div className="hidden lg:block fixed top-0 left-64 right-0 z-40">
        <TrendingTokensTicker />
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-foreground hover:text-primary transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img src="/manus-storage/kit-logo_cd359140.png" alt="$CLAWD Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-lg gradient-text-solana">SOLANA ROBOTICS</span>
          </Link>

          <div className="flex items-center gap-2">
            <PhantomWalletButton />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden neon-glow-cyan">
                <img src="/manus-storage/kit-logo_cd359140.png" alt="$CLAWD Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="font-display text-sm font-bold gradient-text-solana">SOLANA ROBOTICS</h1>
                <p className="text-xs text-muted-foreground">v0.5 devnet</p>
              </div>
            </Link>
            
            {/* Contract Address - Glowing Neon with Copy Button */}
            <div className="mt-3 p-2 rounded-lg bg-black/40 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">$CLAWD Contract</p>
                <button
                  onClick={copyToClipboard}
                  className="p-1 rounded hover:bg-emerald-500/20 transition-colors group"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                  )}
                </button>
              </div>
              <a 
                href={`https://solscan.io/token/${CLAWD_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1"
              >
                <span 
                  className="font-mono text-[9px] tracking-tight break-all transition-all duration-300"
                  style={{
                    background: 'linear-gradient(90deg, #10b981, #a855f7, #10b981)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'shimmer 3s linear infinite',
                    textShadow: '0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)',
                    filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6)) drop-shadow(0 0 16px rgba(168, 85, 247, 0.4))',
                  }}
                >
                  {CLAWD_CONTRACT_ADDRESS}
                </span>
                <ExternalLink className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </a>
            </div>

            {/* Buy $CLAWD Button */}
            <a
              href={JUPITER_SWAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg font-semibold text-sm transition-all duration-300 bg-gradient-to-r from-emerald-500 to-purple-500 hover:from-emerald-400 hover:to-purple-400 text-white shadow-lg hover:shadow-emerald-500/25"
              style={{
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(168, 85, 247, 0.2)',
              }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buy $CLAWD</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>

          {/* Token Price - Compact */}
          <div className="px-3 py-2 border-b border-sidebar-border">
            <TokenPrice compact />
          </div>

          {/* X Search Bar */}
          <div className="px-3 py-2 border-b border-sidebar-border">
            <XSearchBar />
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-primary/10 text-primary neon-glow-cyan'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-primary" />}
                  </Link>
                );
              })}
            </nav>

            {/* Social Links */}
            <div className="px-3 mt-4 pt-4 border-t border-sidebar-border">
              <p className="px-3 text-xs text-muted-foreground uppercase tracking-wider mb-2">Community</p>
              <div className="space-y-1">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary transition-all duration-200 group"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      <span className="font-medium text-sm">{link.label}</span>
                      <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                    </a>
                  );
                })}
              </div>
            </div>
          </ScrollArea>

          {/* Wallet & User Section */}
          <div className="p-4 border-t border-sidebar-border space-y-3">
            {/* Solana Wallet Button */}
            <div className="hidden lg:block">
              <PhantomWalletButton />
            </div>
            
            {/* User Auth Button */}
            <div className="hidden lg:block">
              <UserButton user={user} isAuthenticated={isAuthenticated} logout={logout} loading={loading} />
            </div>
            
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">Powered by NVIDIA NIM</p>
              <p className="text-xs text-primary">Solana Blockchain</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  );
}

interface UserButtonProps {
  user: ReturnType<typeof useAuth>['user'];
  isAuthenticated: boolean;
  logout: () => void;
  loading: boolean;
}

function UserButton({ user, isAuthenticated, logout, loading }: UserButtonProps) {
  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2 w-full">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </Button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 border-purple-500/50 hover:border-purple-400 hover:bg-purple-500/10 w-full">
            <User className="w-4 h-4 text-purple-400" />
            <span className="truncate">{user.name || 'User'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-zinc-950 border-zinc-800">
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-400">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (!isLoginConfigured()) {
    return <Button disabled variant="outline" size="sm" title="Site sign-in is not configured">Sign-in unavailable</Button>;
  }

  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="gap-2 w-full border-zinc-700 hover:border-zinc-600"
    >
      <a href={getLoginUrl()}>
        <User className="w-4 h-4" />
        <span>Sign In</span>
      </a>
    </Button>
  );
}
