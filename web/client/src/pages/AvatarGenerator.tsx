'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Bot,
  Shield,
  Zap,
  Brain,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';

const colorSchemes = [
  { id: 'solana_purple', name: 'Solana Purple', colors: ['#9945FF', '#14F195'] },
  { id: 'cyber_cyan', name: 'Cyber Cyan', colors: ['#00D4FF', '#FF00E5'] },
  { id: 'matrix_green', name: 'Matrix Green', colors: ['#00FF41', '#00D4FF'] },
  { id: 'neon_orange', name: 'Neon Orange', colors: ['#FF6B00', '#FF00E5'] },
];

const personalityTraits = [
  'Analytical', 'Aggressive', 'Conservative', 'Opportunistic',
  'Patient', 'Risk-Taker', 'Methodical', 'Adaptive',
];

const tradingStyles = [
  { id: 'scalper', name: 'Scalper', desc: 'Quick trades, small profits' },
  { id: 'swing', name: 'Swing Trader', desc: 'Hold for days/weeks' },
  { id: 'position', name: 'Position Trader', desc: 'Long-term holdings' },
  { id: 'arbitrage', name: 'Arbitrageur', desc: 'Price discrepancies' },
];

const capabilities = [
  'Chart Analysis', 'Sentiment Analysis', 'News Processing',
  'Risk Management', 'Portfolio Optimization', 'Market Making',
  'Trend Following', 'Mean Reversion',
];

export default function AvatarGenerator() {
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: 'GR00T-Alpha-001',
    description: '',
    colorScheme: 'solana_purple',
    traits: [] as string[],
    tradingStyle: 'swing',
    capabilities: [] as string[],
    maxPositionSize: 5,
    stopLossPercent: 2,
    takeProfitPercent: 4,
  });

  const toggleTrait = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      traits: prev.traits.includes(trait)
        ? prev.traits.filter(t => t !== trait)
        : [...prev.traits, trait].slice(0, 4),
    }));
  };

  const toggleCapability = (cap: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter(c => c !== cap)
        : [...prev.capabilities, cap].slice(0, 4),
    }));
  };

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    setIsGenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsGenerating(false);
    toast.success('Avatar generated successfully!');
    setStep(5);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Basic Information</h3>
                <p className="text-sm text-muted-foreground">Name and describe your avatar</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Avatar Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-card border-border mt-2"
                  placeholder="GR00T-Alpha-001"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-card border-border mt-2 min-h-24"
                  placeholder="Describe your avatar's primary purpose and function..."
                />
              </div>

              <div>
                <Label>Color Scheme</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.id}
                      onClick={() => setFormData(prev => ({ ...prev, colorScheme: scheme.id }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.colorScheme === scheme.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <div className="flex gap-2 mb-2">
                        {scheme.colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className="text-sm font-medium">{scheme.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Personality</h3>
                <p className="text-sm text-muted-foreground">Define your avatar's trading personality</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label>Personality Traits (Select up to 4)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {personalityTraits.map((trait) => (
                    <Badge
                      key={trait}
                      variant={formData.traits.includes(trait) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        formData.traits.includes(trait)
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-primary/10'
                      }`}
                      onClick={() => toggleTrait(trait)}
                    >
                      {formData.traits.includes(trait) && <Check className="w-3 h-3 mr-1" />}
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Trading Style</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {tradingStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setFormData(prev => ({ ...prev, tradingStyle: style.id }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.tradingStyle === style.id
                          ? 'border-secondary bg-secondary/10'
                          : 'border-border bg-card hover:border-secondary/50'
                      }`}
                    >
                      <p className="font-medium">{style.name}</p>
                      <p className="text-sm text-muted-foreground">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Capabilities</h3>
                <p className="text-sm text-muted-foreground">Choose your avatar's abilities</p>
              </div>
            </div>

            <div>
              <Label>Select Capabilities (up to 4)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {capabilities.map((cap) => (
                  <button
                    key={cap}
                    onClick={() => toggleCapability(cap)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.capabilities.includes(cap)
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-card hover:border-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{cap}</span>
                      {formData.capabilities.includes(cap) && (
                        <Check className="w-4 h-4 text-accent" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Safety Parameters</h3>
                <p className="text-sm text-muted-foreground">Set risk management rules</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Max Position Size</Label>
                  <span className="text-primary font-medium">{formData.maxPositionSize}%</span>
                </div>
                <Slider
                  value={[formData.maxPositionSize]}
                  onValueChange={([v]) => setFormData(prev => ({ ...prev, maxPositionSize: v }))}
                  min={1}
                  max={20}
                  step={1}
                  className="py-4"
                />
                <p className="text-sm text-muted-foreground">Maximum percentage of portfolio per trade</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label>Stop Loss</Label>
                  <span className="text-destructive font-medium">{formData.stopLossPercent}%</span>
                </div>
                <Slider
                  value={[formData.stopLossPercent]}
                  onValueChange={([v]) => setFormData(prev => ({ ...prev, stopLossPercent: v }))}
                  min={1}
                  max={10}
                  step={0.5}
                  className="py-4"
                />
                <p className="text-sm text-muted-foreground">Automatic exit on loss</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label>Take Profit</Label>
                  <span className="text-green-500 font-medium">{formData.takeProfitPercent}%</span>
                </div>
                <Slider
                  value={[formData.takeProfitPercent]}
                  onValueChange={([v]) => setFormData(prev => ({ ...prev, takeProfitPercent: v }))}
                  min={1}
                  max={20}
                  step={0.5}
                  className="py-4"
                />
                <p className="text-sm text-muted-foreground">Automatic exit on profit</p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center py-8">
            <div className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center neon-glow-cyan">
              <Bot className="w-16 h-16 text-primary-foreground" />
            </div>
            <h3 className="font-display text-2xl font-bold mb-2 gradient-text-solana">{formData.name}</h3>
            <p className="text-muted-foreground mb-6">Your GR00T avatar has been created!</p>
            
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {formData.traits.map(trait => (
                <Badge key={trait} className="bg-primary/10 text-primary">{trait}</Badge>
              ))}
              {formData.capabilities.map(cap => (
                <Badge key={cap} className="bg-accent/10 text-accent">{cap}</Badge>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-2xl font-bold text-primary">{formData.maxPositionSize}%</p>
                <p className="text-xs text-muted-foreground">Max Position</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-2xl font-bold text-destructive">{formData.stopLossPercent}%</p>
                <p className="text-xs text-muted-foreground">Stop Loss</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-2xl font-bold text-green-500">{formData.takeProfitPercent}%</p>
                <p className="text-xs text-muted-foreground">Take Profit</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">GR00T Avatar Generator</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">
            <span className="gradient-text-solana">CREATE YOUR</span>
            <br />
            <span className="text-foreground">GR00T AVATAR</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Generate a unique AI avatar for your autonomous robot with custom personality, capabilities, and safety parameters.
          </p>
        </div>

        {/* Progress Steps */}
        {step < 5 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold transition-all ${
                    s === step
                      ? 'bg-primary text-primary-foreground neon-glow-cyan'
                      : s < step
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div className={`w-12 h-0.5 ${s < step ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Form Card */}
        <Card className="cyber-card">
          <CardContent className="p-6 md:p-8">
            {renderStep()}

            {/* Navigation */}
            {step < 5 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setStep(s => Math.max(1, s - 1))}
                  disabled={step === 1}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                
                {step < 4 ? (
                  <Button
                    onClick={() => setStep(s => s + 1)}
                    className="btn-cyber gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !isAuthenticated}
                    className="btn-cyber gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Avatar
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-border">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Create Another
                </Button>
                <Button className="btn-cyber">
                  View in Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auth Warning */}
        {!isAuthenticated && (
          <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
            <p className="text-sm text-destructive mb-2">Connect your wallet to generate avatars</p>
            <Button asChild size="sm" variant="destructive">
              <a href={getLoginUrl()}>Connect Wallet</a>
            </Button>
          </div>
        )}

        {/* NVIDIA Badge */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="text-primary">NVIDIA Nemotron-3-Nano-30B</span>
          </p>
        </div>
      </div>
    </div>
  );
}
