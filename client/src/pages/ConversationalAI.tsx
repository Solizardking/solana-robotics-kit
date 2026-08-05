import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { usePhantomWallet } from "@/contexts/PhantomContext";
// Jupiverse-kit removed due to build memory issues - using native Jupiter API via VoiceSwap
import VoiceSwap from "@/components/VoiceSwap";
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  Bot,
  Wallet,
  TrendingUp,
  ArrowLeftRight,
  Shield,
  Zap,
  MessageSquare,
  Settings,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react";

// Voice options for xAI
const VOICE_OPTIONS = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "ash", name: "Ash", description: "Warm and friendly" },
  { id: "ballad", name: "Ballad", description: "Smooth and melodic" },
  { id: "coral", name: "Coral", description: "Clear and professional" },
  { id: "sage", name: "Sage", description: "Calm and wise" },
];

// Trade intent parsing
interface TradeIntent {
  action: "buy" | "sell" | "swap";
  inputToken: string;
  outputToken: string;
  amount: number;
  confirmed: boolean;
}

// Transcript message
interface TranscriptMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  tradeIntent?: TradeIntent;
}

export default function ConversationalAI() {
  const phantom = usePhantomWallet();
  const connected = phantom?.isConnected || false;
  const address = phantom?.getSolanaAddress() || null;
  const connect = phantom?.openModal || (() => {});
  
  // Voice agent state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [volume, setVolume] = useState([80]);
  
  // Access control
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  
  // Transcript
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  
  // Trade confirmation
  const [pendingTrade, setPendingTrade] = useState<TradeIntent | null>(null);
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const [lastTradeResult, setLastTradeResult] = useState<{ txid?: string; error?: string } | null>(null);
  
  // Active tab
  const [activeTab, setActiveTab] = useState("voice");
  
  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // API queries
  const voiceVoices = trpc.voice.getVoices.useQuery();
  const getToken = trpc.voice.getToken.useMutation();
  
  const verifyToken = trpc.token.verifyHolder.useMutation({
    onSuccess: (data) => {
      setHasAccess(data.isHolder);
      setTokenBalance(data.balance);
    },
  });
  
  const checkAdmin = trpc.token.checkAdmin.useQuery(
    { walletAddress: address || "" },
    { enabled: !!address }
  );
  
  // Scroll to bottom of transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);
  
  // Check admin status
  useEffect(() => {
    if (checkAdmin.data) {
      setIsAdmin(checkAdmin.data.isAdmin);
      if (checkAdmin.data.isAdmin) {
        setHasAccess(true);
      }
    }
  }, [checkAdmin.data]);
  
  // Verify token when wallet connects
  useEffect(() => {
    if (connected && address && !isAdmin) {
      verifyToken.mutate({ walletAddress: address });
    } else if (!connected) {
      setHasAccess(null);
    }
  }, [connected, address, isAdmin]);
  
  // Add message to transcript
  const addMessage = useCallback((role: "user" | "assistant" | "system", content: string, tradeIntent?: TradeIntent) => {
    setTranscript(prev => [...prev, {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      tradeIntent,
    }]);
  }, []);
  
  // Parse trade intent from voice command
  const parseTradeIntent = (text: string): TradeIntent | null => {
    const lowerText = text.toLowerCase();
    
    // Patterns for trade commands
    const buyPattern = /buy\s+(\d+(?:\.\d+)?)\s+(\w+)/i;
    const sellPattern = /sell\s+(\d+(?:\.\d+)?)\s+(\w+)/i;
    const swapPattern = /swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to)\s+(\w+)/i;
    
    let match;
    
    if ((match = swapPattern.exec(lowerText))) {
      return {
        action: "swap",
        amount: parseFloat(match[1]),
        inputToken: match[2].toUpperCase(),
        outputToken: match[3].toUpperCase(),
        confirmed: false,
      };
    }
    
    if ((match = buyPattern.exec(lowerText))) {
      return {
        action: "buy",
        amount: parseFloat(match[1]),
        inputToken: "SOL",
        outputToken: match[2].toUpperCase(),
        confirmed: false,
      };
    }
    
    if ((match = sellPattern.exec(lowerText))) {
      return {
        action: "sell",
        amount: parseFloat(match[1]),
        inputToken: match[2].toUpperCase(),
        outputToken: "SOL",
        confirmed: false,
      };
    }
    
    return null;
  };
  
  // Connect to voice agent
  const connectVoiceAgent = useCallback(async () => {
    if (!voiceVoices.data) {
      toast.error("xAI voice agent is not configured. Please contact admin.");
      return;
    }
    
    if (!hasAccess) {
      toast.error("You need to hold $CLAWD tokens or be an admin to use the voice agent.");
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // Get ephemeral token
      const tokenResult = await getToken.mutateAsync({ expiresInSeconds: 300 });
      
      if (!tokenResult.token) {
        throw new Error("Failed to get ephemeral token");
      }
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // Create audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Connect to xAI Realtime API
      const ws = new WebSocket("wss://api.x.ai/v1/realtime?model=grok-2-public");
      wsRef.current = ws;
      
      ws.onopen = () => {
        // Send session configuration
        ws.send(JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            voice: selectedVoice,
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: { model: "whisper-1" },
            turn_detection: { type: "server_vad" },
            instructions: `You are SOLtron, an AI trading assistant for the Solana Robotics CLAWD platform. 
            You help users execute trades on Jupiter, check token prices, manage their portfolio, and control robots.
            When a user wants to trade, parse their intent and ask for confirmation before executing.
            Be concise and helpful. The user's wallet address is: ${address || "not connected"}.
            Available commands: buy/sell/swap tokens, check price, portfolio status, robot commands.`,
            tools: [
              {
                type: "function",
                name: "execute_trade",
                description: "Execute a token swap on Jupiter",
                parameters: {
                  type: "object",
                  properties: {
                    inputToken: { type: "string", description: "Input token symbol (e.g., SOL, USDC)" },
                    outputToken: { type: "string", description: "Output token symbol (e.g., KIT, SOL)" },
                    amount: { type: "number", description: "Amount to swap" },
                  },
                  required: ["inputToken", "outputToken", "amount"],
                },
              },
              {
                type: "function",
                name: "get_token_price",
                description: "Get the current price of a token",
                parameters: {
                  type: "object",
                  properties: {
                    token: { type: "string", description: "Token symbol" },
                  },
                  required: ["token"],
                },
              },
              {
                type: "function",
                name: "get_portfolio",
                description: "Get the user's portfolio and holdings",
                parameters: { type: "object", properties: {} },
              },
            ],
          },
        }));
        
        setIsConnected(true);
        setIsConnecting(false);
        addMessage("system", "Voice agent connected. Say something to start trading!");
        
        toast.success("Voice agent is ready. Start speaking!");
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case "conversation.item.input_audio_transcription.completed":
            const userText = data.transcript;
            addMessage("user", userText);
            
            // Check for trade intent
            const tradeIntent = parseTradeIntent(userText);
            if (tradeIntent) {
              setPendingTrade(tradeIntent);
            }
            break;
            
          case "response.audio_transcript.delta":
            // Handle streaming transcript
            break;
            
          case "response.audio_transcript.done":
            addMessage("assistant", data.transcript);
            break;
            
          case "response.audio.delta":
            // Handle audio playback
            if (isSpeakerOn && audioContextRef.current) {
              // Decode and play audio
              const audioData = atob(data.delta);
              const audioBuffer = new Uint8Array(audioData.length);
              for (let i = 0; i < audioData.length; i++) {
                audioBuffer[i] = audioData.charCodeAt(i);
              }
              // Play audio...
            }
            break;
            
          case "response.function_call_arguments.done":
            // Handle function calls
            handleFunctionCall(data.name, JSON.parse(data.arguments));
            break;
            
          case "error":
            console.error("Voice agent error:", data.error);
            addMessage("system", `Error: ${data.error.message}`);
            break;
        }
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnecting(false);
        toast.error("Failed to connect to voice agent.");
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        addMessage("system", "Voice agent disconnected.");
      };
      
    } catch (error) {
      console.error("Failed to connect:", error);
      setIsConnecting(false);
      toast.error(error instanceof Error ? error.message : "Connection failed");
    }
  }, [voiceVoices.data, hasAccess, selectedVoice, address, getToken, addMessage, isSpeakerOn]);
  
  // Disconnect voice agent
  const disconnectVoiceAgent = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsConnected(false);
  }, []);
  
  // Handle function calls from voice agent
  const handleFunctionCall = async (name: string, args: Record<string, unknown>) => {
    switch (name) {
      case "execute_trade":
        const tradeIntent: TradeIntent = {
          action: "swap",
          inputToken: args.inputToken as string,
          outputToken: args.outputToken as string,
          amount: args.amount as number,
          confirmed: false,
        };
        setPendingTrade(tradeIntent);
        addMessage("system", `Trade request: Swap ${tradeIntent.amount} ${tradeIntent.inputToken} for ${tradeIntent.outputToken}. Please confirm.`);
        break;
        
      case "get_token_price":
        addMessage("system", `Fetching price for ${args.token}...`);
        // Would call price API here
        break;
        
      case "get_portfolio":
        addMessage("system", "Fetching your portfolio...");
        // Would call portfolio API here
        break;
    }
  };
  
  // Handle trade completion from VoiceSwap
  const handleTradeComplete = (txid: string) => {
    setLastTradeResult({ txid });
    addMessage("assistant", `Trade executed successfully! Transaction: ${txid.slice(0, 8)}...${txid.slice(-8)}`);
    setPendingTrade(null);
  };

  // Handle trade error from VoiceSwap
  const handleTradeError = (error: string) => {
    setLastTradeResult({ error });
    addMessage("system", `Trade failed: ${error}`);
  };

  // Confirm and execute trade (legacy - now uses VoiceSwap)
  const confirmTrade = async () => {
    if (!pendingTrade || !connected) return;
    // Trade execution is now handled by VoiceSwap component
    toast.info("Please use the swap panel to confirm your trade.");
  };
  
  // Cancel pending trade
  const cancelTrade = () => {
    setPendingTrade(null);
    addMessage("system", "Trade cancelled.");
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                <Bot className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SOLtron Voice Trading</h1>
                <p className="text-sm text-muted-foreground">AI-powered voice trading on Jupiter</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Access badges */}
              {isAdmin && (
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              {hasAccess && !isAdmin && (
                <Badge variant="outline" className="border-green-500/50 text-green-400">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified Holder
                </Badge>
              )}
              
              {/* Wallet connection */}
              {!connected ? (
                <Button onClick={connect} variant="outline" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              ) : (
                <Badge variant="secondary" className="font-mono">
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="voice" className="gap-2">
                  <Mic className="h-4 w-4" />
                  Voice Agent
                </TabsTrigger>
                <TabsTrigger value="swap" className="gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Swap
                </TabsTrigger>
                <TabsTrigger value="terminal" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Terminal
                </TabsTrigger>
              </TabsList>
              
              {/* Voice Agent Tab */}
              <TabsContent value="voice" className="space-y-4">
                {/* Voice Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-cyan-400" />
                      Voice Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Connection status */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
                        <span className="font-medium">
                          {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}
                        </span>
                      </div>
                      
                      <Button
                        onClick={isConnected ? disconnectVoiceAgent : connectVoiceAgent}
                        disabled={isConnecting || !hasAccess}
                        variant={isConnected ? "destructive" : "default"}
                        className="gap-2"
                      >
                        {isConnecting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isConnected ? (
                          <PhoneOff className="h-4 w-4" />
                        ) : (
                          <Phone className="h-4 w-4" />
                        )}
                        {isConnected ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                    
                    {/* Voice settings */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Voice</label>
                        <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isConnected}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VOICE_OPTIONS.map(voice => (
                              <SelectItem key={voice.id} value={voice.id}>
                                {voice.name} - {voice.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Volume</label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                          >
                            {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                          </Button>
                          <Slider
                            value={volume}
                            onValueChange={setVolume}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Mute button */}
                    {isConnected && (
                      <Button
                        onClick={toggleMute}
                        variant={isMuted ? "destructive" : "outline"}
                        className="w-full gap-2"
                      >
                        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        {isMuted ? "Unmute Microphone" : "Mute Microphone"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
                
                {/* Transcript */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-purple-400" />
                      Conversation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      {transcript.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <Bot className="h-12 w-12 mb-4 opacity-50" />
                          <p>Connect to start a conversation</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {transcript.map(msg => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] p-3 rounded-lg ${
                                  msg.role === "user"
                                    ? "bg-cyan-500/20 text-cyan-100"
                                    : msg.role === "assistant"
                                    ? "bg-purple-500/20 text-purple-100"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                <p className="text-sm">{msg.content}</p>
                                <span className="text-xs opacity-50 mt-1 block">
                                  {msg.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          ))}
                          <div ref={transcriptEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Swap Tab */}
              <TabsContent value="swap">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowLeftRight className="h-5 w-5 text-cyan-400" />
                      Jupiter Swap
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center min-h-[400px]">
                      <VoiceSwap
                        voiceIntent={pendingTrade}
                        onTradeComplete={handleTradeComplete}
                        onTradeError={handleTradeError}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Terminal Tab */}
              <TabsContent value="terminal">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-400" />
                      Trading Terminal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                      <div className="text-center space-y-2">
                        <Bot className="h-16 w-16 mx-auto text-cyan-400 opacity-50" />
                        <h3 className="text-lg font-semibold">Voice-Controlled Trading</h3>
                        <p className="text-muted-foreground max-w-md">
                          Use the voice agent to execute trades. Say commands like "swap 0.1 SOL for KIT" 
                          or "buy 100 USDC worth of SOL" to get started.
                        </p>
                      </div>
                      <VoiceSwap
                        voiceIntent={pendingTrade}
                        onTradeComplete={handleTradeComplete}
                        onTradeError={handleTradeError}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Voice Swap Component */}
            <VoiceSwap
              voiceIntent={pendingTrade}
              onTradeComplete={handleTradeComplete}
              onTradeError={handleTradeError}
            />
            
            {/* Last Trade Result */}
            {lastTradeResult && (
              <Card className={lastTradeResult.txid ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"}>
                <CardContent className="pt-4">
                  {lastTradeResult.txid ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">Trade successful!</span>
                      <a
                        href={`https://solscan.io/tx/${lastTradeResult.txid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline ml-auto"
                      >
                        View TX
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm">{lastTradeResult.error}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Voice Commands */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cyan-400" />
                  Voice Commands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-2 rounded bg-muted/50">
                    <p className="font-medium text-cyan-400">"Buy 1 SOL of KIT"</p>
                    <p className="text-muted-foreground">Purchase tokens</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="font-medium text-cyan-400">"Swap 0.5 SOL for USDC"</p>
                    <p className="text-muted-foreground">Execute a swap</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="font-medium text-cyan-400">"What's the price of KIT?"</p>
                    <p className="text-muted-foreground">Check token price</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="font-medium text-cyan-400">"Show my portfolio"</p>
                    <p className="text-muted-foreground">View holdings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Token Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  $CLAWD Token
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Balance</span>
                    <span className="font-mono">{tokenBalance.toLocaleString()} KIT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Access Status</span>
                    <Badge variant={hasAccess ? "default" : "secondary"}>
                      {hasAccess ? "Verified" : "Not Verified"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
