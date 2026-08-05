'use client';

import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { usePhantomWallet } from '@/contexts/PhantomContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Bot,
  Sparkles,
  Download,
  Loader2,
  FileText,
  Image as ImageIcon,
  Pencil,
  Zap,
  Settings,
  Terminal,
  Coins,
  IdCard,
  CheckCircle,
  XCircle,
  Info,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'system' | 'api';
}

interface FormData {
  robotId: string;
  pubkey: string;
  owner: string;
  title: string;
  reputation: string;
  capabilities: string;
  bagText: string;
  tokenTicker: string;
  customPromptAdditions: string;
}

interface ImageSettings {
  quality: 'low' | 'medium' | 'high';
  size: '1024x1024' | '1536x1024' | '1024x1536';
  background: 'opaque' | 'transparent';
}

export default function RobotPassport() {
  const { getSolanaAddress, isConnected } = usePhantomWallet();
  const walletAddress = getSolanaAddress();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    robotId: 'SOLTRON-001',
    pubkey: walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : '6qzr...fUV1',
    owner: walletAddress || '[Wallet Address]',
    title: 'Robot Architect of the Solana Robotics Fund',
    reputation: '99',
    capabilities: 'Vision, Strategy, Robotics',
    bagText: 'Solana Robotics CLAWD',
    tokenTicker: 'CLAWD',
    customPromptAdditions: '',
  });

  // Generation state
  const [generationType, setGenerationType] = useState<'passport' | 'coin'>('passport');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editInstructions, setEditInstructions] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Image settings
  const [imageSettings, setImageSettings] = useState<ImageSettings>({
    quality: 'high',
    size: '1024x1024',
    background: 'opaque',
  });

  // tRPC mutations
  const enhancePromptMutation = trpc.passport.enhancePrompt.useMutation();
  const generateImageMutation = trpc.passport.generateImage.useMutation();
  const editImageMutation = trpc.passport.editImage.useMutation();

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  }, []);

  const clearLogs = () => setLogs([]);

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingsChange = (field: keyof ImageSettings, value: string) => {
    setImageSettings(prev => ({ ...prev, [field]: value as ImageSettings[keyof ImageSettings] }));
  };

  // Generate enhanced prompt using Gemini via OpenRouter
  const generatePrompt = async () => {
    setIsGeneratingPrompt(true);
    addLog('Initiating prompt generation with Gemini 3 Flash...', 'system');
    
    try {
      const result = await enhancePromptMutation.mutateAsync({
        type: generationType,
        formData,
        customAdditions: formData.customPromptAdditions,
      });
      
      if (result.success && result.prompt) {
        setGeneratedPrompt(result.prompt);
        addLog('✓ Prompt generated successfully', 'success');
        if (result.usage) {
          addLog(`Token usage: ${result.usage.total_tokens}`, 'info');
        }
      } else {
        addLog(`✗ Error: ${result.error || 'Unknown error'}`, 'error');
        toast.error('Failed to generate prompt');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`✗ Error: ${errorMessage}`, 'error');
      toast.error('Failed to generate prompt');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Generate image using OpenAI gpt-image-1
  const generateImage = async () => {
    if (!generatedPrompt) {
      toast.error('Generate a prompt first');
      return;
    }
    
    setIsGeneratingImage(true);
    addLog('Initiating image generation with OpenAI gpt-image-1...', 'system');
    addLog(`Settings: ${imageSettings.quality} quality, ${imageSettings.size}, ${imageSettings.background} background`, 'info');
    
    try {
      const result = await generateImageMutation.mutateAsync({
        prompt: generatedPrompt,
        settings: imageSettings,
      });
      
      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        setEditedImage(null);
        addLog('✓ Image generated successfully', 'success');
        toast.success('Passport image generated!');
      } else {
        addLog(`✗ Error: ${result.error || 'Unknown error'}`, 'error');
        toast.error('Failed to generate image');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`✗ Error: ${errorMessage}`, 'error');
      toast.error('Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Edit image using Flux via OpenRouter
  const editImage = async () => {
    if (!generatedImage) {
      toast.error('Generate an image first');
      return;
    }
    
    if (!editInstructions.trim()) {
      toast.error('Enter edit instructions');
      return;
    }
    
    setIsEditing(true);
    addLog('Initiating image edit with Flux 2 Klein...', 'system');
    addLog(`Edit instructions: "${editInstructions}"`, 'info');
    
    try {
      const result = await editImageMutation.mutateAsync({
        imageUrl: generatedImage,
        instructions: editInstructions,
      });
      
      if (result.success && result.imageUrl) {
        setEditedImage(result.imageUrl);
        addLog('✓ Image edited successfully', 'success');
        toast.success('Image edited!');
      } else {
        addLog(`✗ Error: ${result.error || 'Unknown error'}`, 'error');
        toast.error('Failed to edit image');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`✗ Error: ${errorMessage}`, 'error');
      toast.error('Failed to edit image');
    } finally {
      setIsEditing(false);
    }
  };

  // One-shot generation
  const generateOneShot = async () => {
    setIsGeneratingPrompt(true);
    addLog('Initiating one-shot generation...', 'system');
    
    try {
      // First generate prompt
      const promptResult = await enhancePromptMutation.mutateAsync({
        type: generationType,
        formData,
        customAdditions: formData.customPromptAdditions,
      });
      
      if (promptResult.success && promptResult.prompt) {
        setGeneratedPrompt(promptResult.prompt);
        addLog('✓ Prompt generated successfully', 'success');
        
        // Then generate image
        setIsGeneratingPrompt(false);
        setIsGeneratingImage(true);
        addLog('Initiating image generation...', 'system');
        
        const imageResult = await generateImageMutation.mutateAsync({
          prompt: promptResult.prompt,
          settings: imageSettings,
        });
        
        if (imageResult.success && imageResult.imageUrl) {
          setGeneratedImage(imageResult.imageUrl);
          setEditedImage(null);
          addLog('✓ Image generated successfully', 'success');
          toast.success('Passport generated!');
        } else {
          addLog(`✗ Error: ${imageResult.error || 'Unknown error'}`, 'error');
          toast.error('Failed to generate image');
        }
      } else {
        addLog(`✗ Error: ${promptResult.error || 'Unknown error'}`, 'error');
        toast.error('Failed to generate prompt');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`✗ Error: ${errorMessage}`, 'error');
      toast.error('Generation failed');
    } finally {
      setIsGeneratingPrompt(false);
      setIsGeneratingImage(false);
    }
  };

  // Download image
  const downloadImage = (imageData: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog(`Downloaded: ${filename}`, 'success');
    toast.success(`Downloaded ${filename}`);
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-3 h-3 text-emerald-400" />;
      case 'error': return <XCircle className="w-3 h-3 text-red-400" />;
      case 'system': return <Cpu className="w-3 h-3 text-cyan-400" />;
      case 'api': return <Zap className="w-3 h-3 text-yellow-400" />;
      default: return <Info className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Scanline overlay effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)',
      }} />
      
      {/* Header */}
      <header className="border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">ROBOT PASSPORT FORGE</h1>
                <p className="text-sm text-muted-foreground">Multi-Model AI Image Generation System</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30">
                Gemini 3 Flash
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium border border-purple-500/30">
                GPT-Image-1
              </span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium border border-cyan-500/30">
                Flux 2 Klein
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            {/* Robot Identity */}
            <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <IdCard className="w-4 h-4 text-cyan-400" />
                  ROBOT IDENTITY
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type Selector */}
                <div className="flex gap-2">
                  <Button
                    variant={generationType === 'passport' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGenerationType('passport')}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Passport
                  </Button>
                  <Button
                    variant={generationType === 'coin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGenerationType('coin')}
                    className="flex-1"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Coin Badge
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">ROBOT_ID</Label>
                    <Input
                      value={formData.robotId}
                      onChange={(e) => handleFormChange('robotId', e.target.value)}
                      className="h-8 text-sm bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">REPUTATION</Label>
                    <Input
                      type="number"
                      value={formData.reputation}
                      onChange={(e) => handleFormChange('reputation', e.target.value)}
                      min="0"
                      max="100"
                      className="h-8 text-sm bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">PUBKEY</Label>
                  <Input
                    value={formData.pubkey}
                    onChange={(e) => handleFormChange('pubkey', e.target.value)}
                    className="h-8 text-sm bg-background/50 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">OWNER</Label>
                  <Input
                    value={formData.owner}
                    onChange={(e) => handleFormChange('owner', e.target.value)}
                    className="h-8 text-sm bg-background/50 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">TITLE</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="h-8 text-sm bg-background/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">CAPABILITIES</Label>
                  <Input
                    value={formData.capabilities}
                    onChange={(e) => handleFormChange('capabilities', e.target.value)}
                    placeholder="Vision, Strategy, Robotics"
                    className="h-8 text-sm bg-background/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">BAG_TEXT</Label>
                    <Input
                      value={formData.bagText}
                      onChange={(e) => handleFormChange('bagText', e.target.value)}
                      className="h-8 text-sm bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">TOKEN_TICKER</Label>
                    <Input
                      value={formData.tokenTicker}
                      onChange={(e) => handleFormChange('tokenTicker', e.target.value)}
                      className="h-8 text-sm bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">CUSTOM ADDITIONS</Label>
                  <Textarea
                    value={formData.customPromptAdditions}
                    onChange={(e) => handleFormChange('customPromptAdditions', e.target.value)}
                    placeholder="Additional style requirements..."
                    className="text-sm bg-background/50 min-h-[60px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Image Settings */}
            <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Settings className="w-4 h-4 text-cyan-400" />
                  IMAGE SETTINGS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">QUALITY</Label>
                    <Select value={imageSettings.quality} onValueChange={(v) => handleSettingsChange('quality', v)}>
                      <SelectTrigger className="h-8 text-sm bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">SIZE</Label>
                    <Select value={imageSettings.size} onValueChange={(v) => handleSettingsChange('size', v)}>
                      <SelectTrigger className="h-8 text-sm bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024x1024">1024×1024</SelectItem>
                        <SelectItem value="1536x1024">1536×1024</SelectItem>
                        <SelectItem value="1024x1536">1024×1536</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">BG</Label>
                    <Select value={imageSettings.background} onValueChange={(v) => handleSettingsChange('background', v)}>
                      <SelectTrigger className="h-8 text-sm bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="opaque">Opaque</SelectItem>
                        <SelectItem value="transparent">Transparent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Generation */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  GENERATION PIPELINE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={generatePrompt}
                    disabled={isGeneratingPrompt}
                    variant="outline"
                    className="border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    {isGeneratingPrompt ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Generate Prompt
                  </Button>
                  <Button
                    onClick={generateImage}
                    disabled={isGeneratingImage || !generatedPrompt}
                    variant="outline"
                    className="border-purple-500/30 hover:bg-purple-500/10"
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4 mr-2" />
                    )}
                    Generate Image
                  </Button>
                </div>
                
                <Button
                  onClick={generateOneShot}
                  disabled={isGeneratingPrompt || isGeneratingImage}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500"
                >
                  {(isGeneratingPrompt || isGeneratingImage) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  One-Shot Generate
                </Button>
              </CardContent>
            </Card>

            {/* Generated Prompt */}
            <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  GENERATED PROMPT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  placeholder="Prompt will appear here after generation..."
                  className="min-h-[200px] text-sm bg-background/50 font-mono"
                />
              </CardContent>
            </Card>

            {/* Image Edit */}
            {generatedImage && (
              <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Pencil className="w-4 h-4 text-cyan-400" />
                    IMAGE EDIT (Flux 2 Klein)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={editInstructions}
                    onChange={(e) => setEditInstructions(e.target.value)}
                    placeholder="Enter edit instructions (e.g., 'Add a golden border', 'Change background to space')"
                    className="min-h-[60px] text-sm bg-background/50"
                  />
                  <Button
                    onClick={editImage}
                    disabled={isEditing || !editInstructions.trim()}
                    variant="outline"
                    className="w-full border-cyan-500/30 hover:bg-cyan-500/10"
                  >
                    {isEditing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Pencil className="w-4 h-4 mr-2" />
                    )}
                    Apply Edit
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Output & Logs */}
          <div className="space-y-6">
            {/* Generated Image */}
            <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  OUTPUT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square rounded-lg border border-border/50 bg-background/30 overflow-hidden flex items-center justify-center">
                  {editedImage || generatedImage ? (
                    <img
                      src={editedImage || generatedImage || ''}
                      alt="Generated passport"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Bot className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Generated image will appear here</p>
                    </div>
                  )}
                </div>
                
                {(editedImage || generatedImage) && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => downloadImage(
                        editedImage || generatedImage || '',
                        `robot-${generationType}-${formData.robotId}.png`
                      )}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={() => {
                        setGeneratedImage(null);
                        setEditedImage(null);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Logs */}
            <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  ACTIVITY LOG
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={clearLogs} className="h-6 px-2 text-xs">
                  Clear
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] rounded-lg border border-border/50 bg-background/30 p-2">
                  {logs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs font-mono">
                          <span className="text-muted-foreground shrink-0">[{log.timestamp}]</span>
                          {getLogIcon(log.type)}
                          <span className={
                            log.type === 'success' ? 'text-emerald-400' :
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'system' ? 'text-cyan-400' :
                            log.type === 'api' ? 'text-yellow-400' :
                            'text-muted-foreground'
                          }>
                            {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
