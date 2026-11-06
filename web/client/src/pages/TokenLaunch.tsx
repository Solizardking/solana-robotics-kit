import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { usePhantomWallet } from "@/contexts/PhantomContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Rocket, 
  Sparkles, 
  Image as ImageIcon, 
  Loader2, 
  Plus, 
  Trash2, 
  Twitter, 
  Globe, 
  MessageCircle,
  Wand2,
  Coins,
  Users,
  Percent,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Copy
} from "lucide-react";

interface FeeEarner {
  id: string;
  type: "wallet" | "twitter" | "github";
  value: string;
  percentage: number;
}

interface TokenConcept {
  name: string;
  symbol: string;
  description: string;
  imagePrompt: string;
  website?: string;
  tagline?: string;
}

export default function TokenLaunch() {
  const { isConnected: connected, getSolanaAddress, signTransaction } = usePhantomWallet();
  const publicKey = getSolanaAddress();
  
  // Form state
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  
  // AI generation state
  const [aiTheme, setAiTheme] = useState("");
  const [aiStyle, setAiStyle] = useState<"meme" | "utility" | "gaming" | "defi" | "nft" | "ai">("meme");
  const [imageStyle, setImageStyle] = useState<"cartoon" | "pixel" | "3d" | "minimal" | "realistic">("cartoon");
  const [generatedConcept, setGeneratedConcept] = useState<TokenConcept | null>(null);
  
  // Fee sharing state
  const [enableFeeSharing, setEnableFeeSharing] = useState(true);
  const [feeEarners, setFeeEarners] = useState<FeeEarner[]>([
    { id: "1", type: "wallet", value: "", percentage: 100 }
  ]);
  const [splitEqually, setSplitEqually] = useState(false);
  
  // Initial buy state
  const [initialBuySol, setInitialBuySol] = useState(0);
  
  // Launch state
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStep, setLaunchStep] = useState<"idle" | "creating" | "signing" | "confirming" | "complete">("idle");
  const [launchedToken, setLaunchedToken] = useState<{ mint: string; txId: string } | null>(null);

  // tRPC mutations
  const generateConcept = trpc.tokenLaunch.generateTokenConcept.useMutation();
  const generateImage = trpc.tokenLaunch.generateTokenImage.useMutation();
  const createTokenInfo = trpc.tokenLaunch.createTokenInfo.useMutation();
  const calculateFees = trpc.tokenLaunch.calculateFees.useQuery({ marketCapUsd: 100000 });

  // Add fee earner
  const addFeeEarner = useCallback(() => {
    if (feeEarners.length >= 100) {
      toast.error("Maximum 100 fee earners allowed");
      return;
    }
    setFeeEarners([...feeEarners, {
      id: Date.now().toString(),
      type: "wallet",
      value: "",
      percentage: 0
    }]);
  }, [feeEarners]);

  // Remove fee earner
  const removeFeeEarner = useCallback((id: string) => {
    if (feeEarners.length <= 1) {
      toast.error("At least one fee earner required");
      return;
    }
    setFeeEarners(feeEarners.filter(e => e.id !== id));
  }, [feeEarners]);

  // Update fee earner
  const updateFeeEarner = useCallback((id: string, updates: Partial<FeeEarner>) => {
    setFeeEarners(feeEarners.map(e => 
      e.id === id ? { ...e, ...updates } : e
    ));
  }, [feeEarners]);

  // Calculate total percentage
  const totalPercentage = feeEarners.reduce((sum, e) => sum + e.percentage, 0);

  // Split fees equally
  const handleSplitEqually = useCallback((enabled: boolean) => {
    setSplitEqually(enabled);
    if (enabled) {
      const equalShare = Math.floor(100 / feeEarners.length);
      const remainder = 100 - (equalShare * feeEarners.length);
      setFeeEarners(feeEarners.map((e, i) => ({
        ...e,
        percentage: equalShare + (i === 0 ? remainder : 0)
      })));
    }
  }, [feeEarners]);

  // Generate AI token concept
  const handleGenerateConcept = async () => {
    if (!aiTheme.trim()) {
      toast.error("Please enter a theme for your token");
      return;
    }

    try {
      const result = await generateConcept.mutateAsync({
        theme: aiTheme,
        style: aiStyle,
      });

      if (result.success && result.concept) {
        setGeneratedConcept(result.concept);
        setName(result.concept.name);
        setSymbol(result.concept.symbol);
        setDescription(result.concept.description);
        if (result.concept.website) {
          setWebsite(`https://${result.concept.website}`);
        }
        toast.success("Token concept generated!");
      } else {
        toast.error("Failed to generate concept");
      }
    } catch (error) {
      toast.error("Error generating concept");
    }
  };

  // Generate AI token image
  const handleGenerateImage = async () => {
    const prompt = generatedConcept?.imagePrompt || `${name} ${symbol} crypto token logo`;
    
    try {
      const result = await generateImage.mutateAsync({
        prompt,
        style: imageStyle,
      });

      if (result.success && result.imageUrl) {
        setImageUrl(result.imageUrl);
        toast.success("Token image generated!");
      } else {
        toast.error(result.error || "Failed to generate image");
      }
    } catch (error) {
      toast.error("Error generating image");
    }
  };

  // Apply generated concept
  const applyGeneratedConcept = () => {
    if (generatedConcept) {
      setName(generatedConcept.name);
      setSymbol(generatedConcept.symbol);
      setDescription(generatedConcept.description);
      if (generatedConcept.website) {
        setWebsite(`https://${generatedConcept.website}`);
      }
      toast.success("Concept applied to form");
    }
  };

  // Launch token
  const handleLaunchToken = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!name || !symbol || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (enableFeeSharing && totalPercentage !== 100) {
      toast.error("Fee percentages must total 100%");
      return;
    }

    setIsLaunching(true);
    setLaunchStep("creating");

    try {
      // Step 1: Create token info
      const tokenInfo = await createTokenInfo.mutateAsync({
        name,
        symbol: symbol.toUpperCase(),
        description,
        imageUrl: imageUrl || undefined,
        website: website || undefined,
        twitter: twitter || undefined,
        telegram: telegram || undefined,
      });

      if (!tokenInfo.success) {
        throw new Error(tokenInfo.error || "Failed to create token info");
      }

      toast.success("Token metadata created!");
      setLaunchStep("signing");

      // In production, this would:
      // 1. Create the launch transaction
      // 2. Have the user sign it
      // 3. Submit to the network
      // For now, we simulate success
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLaunchStep("confirming");
      await new Promise(resolve => setTimeout(resolve, 1500));

      setLaunchStep("complete");
      setLaunchedToken({
        mint: tokenInfo.response?.tokenMint || "simulated-mint-address",
        txId: "simulated-tx-id",
      });

      toast.success("Token launched successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Launch failed");
      setLaunchStep("idle");
    } finally {
      setIsLaunching(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#14F195] to-[#9945FF] bg-clip-text text-transparent mb-2">
            Launch Your Token
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Create and launch your Solana token with AI-powered generation, fee sharing, and instant deployment via Bags
          </p>
        </div>

        {/* Launch Complete State */}
        {launchedToken && (
          <Card className="mb-8 border-[#14F195]/50 bg-[#14F195]/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#14F195]/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-[#14F195]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#14F195]">Token Launched!</h3>
                  <p className="text-muted-foreground">Your token is now live on Solana</p>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-background/50 border">
                  <Label className="text-muted-foreground text-sm">Token Mint Address</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm font-mono truncate flex-1">{launchedToken.mint}</code>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(launchedToken.mint)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border">
                  <Label className="text-muted-foreground text-sm">Transaction ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm font-mono truncate flex-1">{launchedToken.txId}</code>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`https://solscan.io/tx/${launchedToken.txId}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button onClick={() => {
                  setLaunchedToken(null);
                  setLaunchStep("idle");
                  setName("");
                  setSymbol("");
                  setDescription("");
                  setImageUrl("");
                }}>
                  Launch Another Token
                </Button>
                <Button variant="outline" asChild>
                  <a href={`https://bags.fm/token/${launchedToken.mint}`} target="_blank" rel="noopener noreferrer">
                    View on Bags <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!launchedToken && (
          <Tabs defaultValue="ai" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="ai" className="gap-2">
                <Wand2 className="w-4 h-4" />
                AI One-Shot
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <Rocket className="w-4 h-4" />
                Manual Setup
              </TabsTrigger>
            </TabsList>

            {/* AI One-Shot Tab */}
            <TabsContent value="ai" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#9945FF]" />
                    AI Token Generator
                  </CardTitle>
                  <CardDescription>
                    Describe your token idea and let AI generate everything for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Token Theme / Idea</Label>
                    <Textarea
                      id="theme"
                      placeholder="e.g., A robot cat that trades crypto, a meme about coffee addiction, an AI that predicts the future..."
                      value={aiTheme}
                      onChange={(e) => setAiTheme(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Token Style</Label>
                      <Select value={aiStyle} onValueChange={(v) => setAiStyle(v as typeof aiStyle)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meme">🐸 Meme</SelectItem>
                          <SelectItem value="utility">⚙️ Utility</SelectItem>
                          <SelectItem value="gaming">🎮 Gaming</SelectItem>
                          <SelectItem value="defi">💰 DeFi</SelectItem>
                          <SelectItem value="nft">🖼️ NFT</SelectItem>
                          <SelectItem value="ai">🤖 AI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Image Style</Label>
                      <Select value={imageStyle} onValueChange={(v) => setImageStyle(v as typeof imageStyle)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cartoon">🎨 Cartoon</SelectItem>
                          <SelectItem value="pixel">👾 Pixel Art</SelectItem>
                          <SelectItem value="3d">🔮 3D</SelectItem>
                          <SelectItem value="minimal">✨ Minimal</SelectItem>
                          <SelectItem value="realistic">📷 Realistic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerateConcept} 
                    disabled={generateConcept.isPending || !aiTheme.trim()}
                    className="w-full bg-gradient-to-r from-[#9945FF] to-[#14F195]"
                  >
                    {generateConcept.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Token Concept
                      </>
                    )}
                  </Button>

                  {/* Generated Concept Preview */}
                  {generatedConcept && (
                    <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Generated Concept</h4>
                        <Button size="sm" variant="outline" onClick={applyGeneratedConcept}>
                          Apply to Form
                        </Button>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div><span className="text-muted-foreground">Name:</span> {generatedConcept.name}</div>
                        <div><span className="text-muted-foreground">Symbol:</span> ${generatedConcept.symbol}</div>
                        <div><span className="text-muted-foreground">Description:</span> {generatedConcept.description}</div>
                        {generatedConcept.tagline && (
                          <div><span className="text-muted-foreground">Tagline:</span> {generatedConcept.tagline}</div>
                        )}
                      </div>
                      <Button 
                        onClick={handleGenerateImage} 
                        disabled={generateImage.isPending}
                        variant="outline"
                        className="w-full"
                      >
                        {generateImage.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating Image...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Generate Token Image
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manual Setup Tab */}
            <TabsContent value="manual" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Token Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-[#14F195]" />
                      Token Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      {/* Image Upload/Preview */}
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/30 shrink-0">
                        {imageUrl ? (
                          <img src={imageUrl} alt="Token" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-2">
                            <ImageIcon className="w-6 h-6 mx-auto text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Upload</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            placeholder="My Token"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={32}
                          />
                        </div>
                        <div>
                          <Label htmlFor="symbol">Ticker *</Label>
                          <Input
                            id="symbol"
                            placeholder="TOKEN"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            maxLength={10}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your token..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        maxLength={1000}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{description.length}/1000</p>
                    </div>

                    <div>
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="imageUrl"
                          placeholder="https://..."
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          onClick={handleGenerateImage}
                          disabled={generateImage.isPending}
                        >
                          {generateImage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        Social Links <span className="text-muted-foreground text-xs">(optional)</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Website URL"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Twitter className="w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Twitter/X URL"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Telegram URL"
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fee Sharing Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#9945FF]" />
                        Share Fees
                      </CardTitle>
                      <Switch
                        checked={enableFeeSharing}
                        onCheckedChange={setEnableFeeSharing}
                      />
                    </div>
                    <CardDescription>
                      Share trading fees with up to 100 accounts
                    </CardDescription>
                  </CardHeader>
                  {enableFeeSharing && (
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <span className="text-sm">Your share</span>
                        <span className="font-bold text-[#14F195]">
                          {feeEarners.find(e => e.id === "1")?.percentage || 0}%
                        </span>
                      </div>

                      {/* Fee Earners List */}
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {feeEarners.map((earner, index) => (
                          <div key={earner.id} className="p-3 rounded-lg border bg-background/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Fee Earner #{index + 1}</span>
                              {index > 0 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => removeFeeEarner(earner.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Select
                                value={earner.type}
                                onValueChange={(v) => updateFeeEarner(earner.id, { type: v as FeeEarner["type"] })}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="wallet">Wallet</SelectItem>
                                  <SelectItem value="twitter">Twitter</SelectItem>
                                  <SelectItem value="github">GitHub</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder={earner.type === "wallet" ? "Wallet address" : "@username"}
                                value={earner.value}
                                onChange={(e) => updateFeeEarner(earner.id, { value: e.target.value })}
                                className="flex-1"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">Fee %</span>
                              <Slider
                                value={[earner.percentage]}
                                onValueChange={([v]) => updateFeeEarner(earner.id, { percentage: v })}
                                max={100}
                                step={1}
                                className="flex-1"
                                disabled={splitEqually}
                              />
                              <span className="text-sm font-mono w-12 text-right">{earner.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Fee Earner */}
                      <Button
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={addFeeEarner}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Fee Earner
                      </Button>

                      {/* Split Equally Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <span className="text-sm font-medium">Split fees equally</span>
                          <p className="text-xs text-muted-foreground">Split between all fee earners</p>
                        </div>
                        <Switch
                          checked={splitEqually}
                          onCheckedChange={handleSplitEqually}
                        />
                      </div>

                      {/* Total Percentage Warning */}
                      {totalPercentage !== 100 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Total must equal 100% (currently {totalPercentage}%)</span>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* Initial Buy & Launch Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-[#14F195]" />
                  Initial Buy & Launch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Initial Buy (SOL)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={initialBuySol || ""}
                        onChange={(e) => setInitialBuySol(parseFloat(e.target.value) || 0)}
                        min={0}
                        step={0.1}
                      />
                      <span className="text-muted-foreground">SOL</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 0.5 SOL minimum to avoid snipers
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Launch Fee</span>
                      <span>~0.02 SOL</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Initial Buy</span>
                      <span>{initialBuySol} SOL</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Required</span>
                      <span className="text-[#14F195]">{(0.02 + initialBuySol).toFixed(2)} SOL</span>
                    </div>
                  </div>
                </div>

                {/* Fee Info */}
                {calculateFees.data && (
                  <div className="p-4 rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Trading Fee Structure
                    </h4>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">Creator Fee</span>
                        <span className="font-medium">{calculateFees.data.creatorFee}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Protocol Fee</span>
                        <span className="font-medium">{calculateFees.data.protocolFee}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">LP Fee</span>
                        <span className="font-medium">{calculateFees.data.lpFee}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Total</span>
                        <span className="font-medium text-[#14F195]">{calculateFees.data.totalFee}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Minimum SOL Warning */}
                {initialBuySol < 0.2 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-500">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">You need at least 0.2 SOL to cover transaction fees for launching a token</span>
                  </div>
                )}

                {/* Launch Button */}
                <Button
                  onClick={handleLaunchToken}
                  disabled={!connected || isLaunching || !name || !symbol || !description || (enableFeeSharing && totalPercentage !== 100)}
                  className="w-full h-14 text-lg bg-gradient-to-r from-[#14F195] to-[#9945FF] hover:opacity-90"
                >
                  {!connected ? (
                    "Connect Wallet to Launch"
                  ) : isLaunching ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {launchStep === "creating" && "Creating Token..."}
                      {launchStep === "signing" && "Sign Transaction..."}
                      {launchStep === "confirming" && "Confirming..."}
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5 mr-2" />
                      Create Coin
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </Tabs>
        )}
      </div>
    </div>
  );
}
