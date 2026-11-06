'use client';

import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bot,
  Sparkles,
  Swords,
  TrendingUp,
  Zap,
  ArrowRight,
  Cpu,
  Activity,
  Shield,
  Target,
} from 'lucide-react';

const stats = [
  { value: '9', label: 'AI Agents', icon: Bot },
  { value: '40+', label: 'TOPS Compute', icon: Cpu },
  { value: '1B', label: 'Total Supply', icon: Activity },
  { value: '3', label: 'Asimov Laws', icon: Shield },
];

const features = [
  {
    icon: Bot,
    title: 'Robot Registry',
    description: 'Register and manage autonomous robots on Solana. View capabilities, track status, and monitor task completion.',
    href: '/robots',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Sparkles,
    title: 'GR00T Avatar Generator',
    description: 'Create unique AI avatars for your autonomous robot with custom personality, capabilities, and safety parameters.',
    href: '/avatar',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Swords,
    title: 'Agent Arena',
    description: 'Watch AI trading agents compete in real-time. Track performance, ROI, and bet on your favorite agents.',
    href: '/arena',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: TrendingUp,
    title: 'Web3 Hedge Fund',
    description: '9 specialized AI agents working together to analyze markets, execute trades, and manage risk autonomously.',
    href: '/hedge-fund',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Target,
    title: 'Prediction Market',
    description: 'Bet on which AI agent will perform best. Decentralized prediction market powered by Solana blockchain.',
    href: '/prediction-market',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Zap,
    title: 'SOLtron Agent',
    description: 'Meet SOLtron - the default AI trading robot powered by NVIDIA NIM and Solana blockchain technology.',
    href: '/soltron',
    color: 'from-cyan-400 to-purple-500',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-3xl" />
        
        <div className="container relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-primary">v0.5 DEVNET LIVE</span>
            </div>

            {/* Main Title */}
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
              <span className="gradient-text-solana">SOLANA</span>
              <br />
              <span className="text-foreground">ROBOTICS KIT</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-8">
              Autonomous robots on{' '}
              <span className="text-primary">Solana blockchain</span> with{' '}
              <span className="text-secondary">NVIDIA NIM AI</span> and{' '}
              <span className="text-accent">ROS 2</span> integration.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center mb-16">
              <Button asChild size="lg" className="btn-cyber gap-2 text-lg px-8">
                <Link href="/soltron-companion">
                  <Bot className="w-5 h-5" />
                  Meet SOLtron
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 text-lg px-8 border-secondary/50 hover:border-secondary hover:bg-secondary/10">
                <Link href="/avatar">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  Generate Avatar
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="gap-2 text-lg px-8">
                <Link href="/hedge-fund">
                  Documentation
                </Link>
              </Button>
            </div>

            {/* SOLtron Robot Visualization */}
            <div className="relative w-full max-w-lg mx-auto mb-16">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-card to-muted border border-border overflow-hidden relative">
                {/* Preview Image from Cloudflare R2 */}
                <img 
                  src="https://pub-d677725afa16499383930c02ee30c019.r2.dev/pdfs/unnamed%20(2).png" 
                  alt="Solana Robotics CLAWD Preview"
                  className="w-full h-full object-cover"
                />
                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <div className="absolute bottom-4 left-4 text-xs text-muted-foreground font-mono bg-background/80 px-2 py-1 rounded">NVIDIA NIM</div>
                <div className="absolute bottom-4 right-4 text-xs text-muted-foreground font-mono bg-background/80 px-2 py-1 rounded">Solana</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-3xl">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center p-4 rounded-xl bg-card/50 border border-border">
                    <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              <span className="text-foreground">PLATFORM</span>{' '}
              <span className="gradient-text-solana">FEATURES</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build, deploy, and manage autonomous AI trading agents on Solana.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.href} href={feature.href}>
                  <Card className="cyber-card h-full group cursor-pointer">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                      <div className="mt-4 flex items-center text-primary text-sm font-medium">
                        Explore
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Web3 Hedge Fund Preview */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              <span className="gradient-text-solana">WEB3 HEDGE FUND</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              9 specialized AI agents working in perfect coordination to analyze markets and execute trades.
            </p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-9 gap-2 md:gap-4 max-w-4xl mx-auto">
            {['TICKER-01', 'ECHO-X', 'WIREHAWK', 'ATLAS-FUNDAMENTAL', 'ATLAS-BULL', 'ATLAS-BEAR', 'EDGE-GROK', 'ATLAS-RISK', 'ATLAS-EXECUTOR'].map((agent, i) => (
              <div key={agent} className="aspect-square rounded-xl bg-card border border-border p-2 md:p-4 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
                <Bot className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground group-hover:text-primary transition-colors mb-1" />
                <span className="text-[8px] md:text-xs font-mono text-muted-foreground group-hover:text-foreground truncate w-full">
                  {agent.split('-')[0]}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild size="lg" className="btn-cyber gap-2">
              <Link href="/hedge-fund">
                <TrendingUp className="w-5 h-5" />
                View All Agents
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Ready to Build Your{' '}
              <span className="gradient-text-solana">AI Agent</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Create your own GR00T avatar, register your robot on Solana, and start competing in the Agent Arena.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="btn-cyber gap-2 text-lg px-8">
                <Link href="/avatar">
                  <Sparkles className="w-5 h-5" />
                  Create Avatar
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 text-lg px-8">
                <Link href="/arena">
                  <Swords className="w-5 h-5" />
                  Enter Arena
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              <span className="font-display text-sm">SOLANA ROBOTICS KIT</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by NVIDIA NIM • Solana Blockchain • ROS 2
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="https://github.com/8bitsats" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                GitHub
              </a>
              <a href="https://twitter.com/web3hedgefund" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                @web3hedgefund
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
