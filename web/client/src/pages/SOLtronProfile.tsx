'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Zap,
  Bot,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Brain,
  Cpu,
  Target,
  BarChart3,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Search,
  Image as ImageIcon,
  Code,
  History,
  Trash2,
  Plus,
  Loader2,
  RefreshCw,
  MessageSquare,
  X,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { usePhantomSolana } from '@/hooks/usePhantomSolana';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';

// SOLtron data
const soltronData = {
  name: 'SOLtron',
  codename: 'SOLTRON-PRIME',
  version: 'v2.1.0',
  model: 'NVIDIA Nemotron-3-Nano-30B',
  status: 'active',
  uptime: '99.97%',
  totalTrades: 1247,
  winRate: 73.8,
  roi: 156.4,
  pnl: 15640,
  sharpeRatio: 2.89,
  maxDrawdown: 6.2,
  avgTradeSize: 250,
  avgHoldTime: '4.2h',
};

const capabilities = [
  { name: 'Market Analysis', level: 95, icon: BarChart3 },
  { name: 'Sentiment Detection', level: 88, icon: Brain },
  { name: 'Risk Management', level: 92, icon: Shield },
  { name: 'Trade Execution', level: 97, icon: Target },
  { name: 'Pattern Recognition', level: 91, icon: Activity },
  { name: 'News Processing', level: 85, icon: Cpu },
];

const recentTrades = [
  { id: 1, pair: 'SOL/USDC', type: 'buy', amount: 125, price: 98.45, pnl: 234.50, time: '2h ago', status: 'closed' },
  { id: 2, pair: 'JUP/USDC', type: 'sell', amount: 500, price: 0.82, pnl: -45.20, time: '4h ago', status: 'closed' },
  { id: 3, pair: 'BONK/USDC', type: 'buy', amount: 10000000, price: 0.000012, pnl: 156.80, time: '6h ago', status: 'closed' },
  { id: 4, pair: 'RAY/USDC', type: 'buy', amount: 200, price: 2.34, pnl: 89.30, time: '8h ago', status: 'closed' },
  { id: 5, pair: 'PYTH/USDC', type: 'sell', amount: 1000, price: 0.45, pnl: 67.40, time: '12h ago', status: 'closed' },
];

const performanceHistory = [
  { period: '24h', roi: 2.4, trades: 12, winRate: 75 },
  { period: '7d', roi: 8.7, trades: 67, winRate: 71 },
  { period: '30d', roi: 34.2, trades: 234, winRate: 74 },
  { period: 'All Time', roi: 156.4, trades: 1247, winRate: 73.8 },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  timestamp: Date;
  isStreaming?: boolean;
  audioUrl?: string;
  imageUrl?: string;
  citations?: string[];
}

interface ChatSession {
  sessionId: string;
  title: string;
  agentType: string;
  messageCount: number;
  updatedAt: Date;
}

type ChatMode = 'chat' | 'search' | 'image' | 'code';

export default function SOLtronProfile() {
  const [activeTab, setActiveTab] = useState('overview');
  const [chatMode, setChatMode] = useState<ChatMode>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>('Rex');
  const [showReasoning, setShowReasoning] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { address } = usePhantomSolana();
  
  // tRPC mutations and queries
  const createSession = trpc.chat.createSession.useMutation();
  const addMessage = trpc.chat.addMessage.useMutation();
  const getMessages = trpc.chat.getMessages.useQuery(
    { sessionId: currentSessionId || '' },
    { enabled: !!currentSessionId }
  );
  const getSessions = trpc.chat.getSessions.useQuery(
    { walletAddress: address || undefined, limit: 20 },
    { enabled: !!address }
  );
  const deleteSession = trpc.chat.deleteSession.useMutation();
  const voiceConfig = trpc.voice.isConfigured.useQuery();
  const voices = trpc.voice.getVoices.useQuery();
  
  // Grok chat mutation
  const grokChat = trpc.grok.chat.useMutation();
  const grokSearch = trpc.grok.searchWeb.useMutation();
  const grokXSearch = trpc.grok.searchX.useMutation();
  const grokImage = trpc.grok.generateImage.useMutation();
  const grokCode = trpc.grok.vibeCode.useMutation();
  
  // SOLtron chat mutation
  const soltronChat = trpc.soltron.chat.useMutation();
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load sessions on mount
  useEffect(() => {
    if (getSessions.data) {
      setSessions(getSessions.data.map((s: any) => ({
        sessionId: s.sessionId,
        title: s.title || 'Untitled',
        agentType: s.agentType || 'soltron',
        messageCount: s.messageCount || 0,
        updatedAt: new Date(s.updatedAt || s.createdAt),
      })));
    }
  }, [getSessions.data]);
  
  // Load messages when session changes
  useEffect(() => {
    if (getMessages.data && currentSessionId) {
      setMessages(getMessages.data.map((m: any) => ({
        id: m.id?.toString() || Math.random().toString(),
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        reasoning: m.reasoning,
        timestamp: new Date(m.createdAt),
        audioUrl: m.audioUrl,
        imageUrl: m.imageUrl,
      })));
    }
  }, [getMessages.data, currentSessionId]);
  
  // Create new session
  const handleNewSession = async () => {
    try {
      const result = await createSession.mutateAsync({
        walletAddress: address || undefined,
        agentType: 'soltron',
        title: 'New Conversation',
      });
      setCurrentSessionId(result.sessionId);
      setMessages([]);
      setShowHistory(false);
      getSessions.refetch();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };
  
  // Load existing session
  const handleLoadSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowHistory(false);
  };
  
  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync({ sessionId });
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      getSessions.refetch();
      toast.success('Session deleted');
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };
  
  // Send message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Create session if needed
    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        const result = await createSession.mutateAsync({
          walletAddress: address || undefined,
          agentType: 'soltron',
          title: userMessage.content.slice(0, 50),
        });
        sessionId = result.sessionId;
        setCurrentSessionId(sessionId);
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    }
    
    // Save user message to database
    if (sessionId) {
      try {
        await addMessage.mutateAsync({
          sessionId,
          role: 'user',
          content: userMessage.content,
        });
      } catch (error) {
        console.error('Failed to save message:', error);
      }
    }
    
    // Add streaming placeholder
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }]);
    
    try {
      let response: any;
      
      switch (chatMode) {
        case 'search':
          // Use Grok web search
          response = await grokSearch.mutateAsync({
            query: userMessage.content,
            maxResults: 10,
          });
          break;
          
        case 'image':
          // Use Grok image generation
          response = await grokImage.mutateAsync({
            prompt: userMessage.content,
            count: 1,
          });
          break;
          
        case 'code':
          // Use Grok vibe code
          response = await grokCode.mutateAsync({
            request: userMessage.content,
          });
          break;
          
        default:
          // Use SOLtron chat with NVIDIA Nemotron
          response = await soltronChat.mutateAsync({
            message: userMessage.content,
            context: messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n'),
            walletAddress: address || undefined,
          });
      }
      
      // Process response
      let assistantContent = '';
      let reasoning = '';
      let imageUrl = '';
      let citations: string[] = [];
      
      if (chatMode === 'image' && response?.images) {
        imageUrl = response.images[0]?.url || '';
        assistantContent = response.images[0]?.revised_prompt || 'Image generated successfully!';
      } else if (chatMode === 'search' && response) {
        assistantContent = response.content || 'No results found.';
        citations = response.citations || [];
      } else if (response) {
        assistantContent = response.content || response.message || 'I apologize, but I encountered an issue processing your request.';
        reasoning = response.reasoning || '';
      }
      
      // Update message with response
      setMessages(prev => prev.map(m => 
        m.id === assistantId 
          ? { ...m, content: assistantContent, reasoning, imageUrl, citations, isStreaming: false }
          : m
      ));
      
      // Save assistant message to database
      if (sessionId) {
        try {
          await addMessage.mutateAsync({
            sessionId,
            role: 'assistant',
            content: assistantContent,
            reasoning,
            imageUrl: imageUrl || undefined,
          });
        } catch (error) {
          console.error('Failed to save assistant message:', error);
        }
      }
      
      // Speak response if voice enabled
      if (voiceEnabled && assistantContent && chatMode !== 'image') {
        speakText(assistantContent);
      }
      
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m => 
        m.id === assistantId 
          ? { ...m, content: `Error: ${error.message || 'Failed to get response'}`, isStreaming: false }
          : m
      ));
    } finally {
      setIsLoading(false);
      getSessions.refetch();
    }
  };
  
  // Text-to-speech using Web Speech API
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 0.9;
      
      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.toLowerCase().includes('male') || 
        v.name.toLowerCase().includes('david') ||
        v.name.toLowerCase().includes('james')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Stop speaking
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };
  
  // Voice recording using Web Speech API
  const startRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => {
        setIsRecording(false);
        toast.error('Voice recognition failed');
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      
      recognition.start();
    } else {
      toast.error('Voice recognition not supported in this browser');
    }
  };
  
  const stopRecording = () => {
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Hero Section */}
        <div className="relative mb-8 p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-border overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/20 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            {/* Animated Robot Avatar */}
            <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-primary/30 flex items-center justify-center relative neon-glow-cyan">
              {/* Eyes with animation */}
              <div className="flex gap-8">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-primary-foreground" />
                </div>
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center animate-pulse" style={{ animationDelay: '0.2s' }}>
                  <div className="w-4 h-4 rounded-full bg-primary-foreground" />
                </div>
              </div>
              {/* Mouth - animated when speaking */}
              <div className={`absolute bottom-10 w-20 h-2 bg-primary/50 rounded-full transition-all ${isSpeaking ? 'h-4 animate-pulse' : ''}`} />
              {/* Antenna */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1 h-6 bg-primary">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-secondary neon-glow-magenta animate-pulse" />
              </div>
              {/* Status Indicator */}
              <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text-solana">{soltronData.name}</h1>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">ACTIVE</Badge>
              </div>
              <p className="text-muted-foreground font-mono mb-4">{soltronData.codename} • {soltronData.version}</p>
              <p className="text-lg text-muted-foreground mb-4">
                The default AI trading robot powered by <span className="text-primary">NVIDIA NIM</span> and{' '}
                <span className="text-secondary">Solana blockchain</span> technology.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge variant="outline" className="gap-1">
                  <Cpu className="w-3 h-3" />
                  {soltronData.model}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Activity className="w-3 h-3" />
                  {soltronData.uptime} Uptime
                </Badge>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-card/50 border border-border text-center">
                <p className="font-display text-3xl font-bold text-green-500">+{soltronData.roi}%</p>
                <p className="text-sm text-muted-foreground">Total ROI</p>
              </div>
              <div className="p-4 rounded-xl bg-card/50 border border-border text-center">
                <p className="font-display text-3xl font-bold text-primary">{soltronData.winRate}%</p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chat">Chat with SOLtron</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="trades">Trade History</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Chat History Sidebar */}
              <Card className="cyber-card lg:col-span-1">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Chat History
                    </CardTitle>
                    <Button size="sm" variant="ghost" onClick={handleNewSession}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {sessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No chat history</p>
                    ) : (
                      <div className="space-y-2">
                        {sessions.map((session) => (
                          <div
                            key={session.sessionId}
                            className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                              currentSessionId === session.sessionId
                                ? 'bg-primary/10 border border-primary/30'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleLoadSession(session.sessionId)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{session.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {session.messageCount} messages
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSession(session.sessionId);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Main Chat Area */}
              <Card className="cyber-card lg:col-span-3">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      Chat with SOLtron
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {/* Mode Selector */}
                      <Select value={chatMode} onValueChange={(v) => setChatMode(v as ChatMode)}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chat">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Chat
                            </div>
                          </SelectItem>
                          <SelectItem value="search">
                            <div className="flex items-center gap-2">
                              <Search className="w-4 h-4" />
                              Search
                            </div>
                          </SelectItem>
                          <SelectItem value="image">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              Image
                            </div>
                          </SelectItem>
                          <SelectItem value="code">
                            <div className="flex items-center gap-2">
                              <Code className="w-4 h-4" />
                              Code
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Voice Toggle */}
                      <Button
                        size="icon"
                        variant={voiceEnabled ? 'default' : 'outline'}
                        className="h-8 w-8"
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                      >
                        {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </Button>
                      
                      {/* Reasoning Toggle */}
                      <Button
                        size="sm"
                        variant={showReasoning ? 'default' : 'outline'}
                        onClick={() => setShowReasoning(!showReasoning)}
                      >
                        <Brain className="w-4 h-4 mr-1" />
                        Reasoning
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Messages Area */}
                  <ScrollArea className="h-[400px] pr-4 mb-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Bot className="w-16 h-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          Ask SOLtron about trading strategies, market analysis, code generation, or search the web and X.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl p-4 ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {/* Reasoning (if enabled and available) */}
                              {showReasoning && message.reasoning && (
                                <div className="mb-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
                                  <div className="flex items-center gap-2 text-yellow-500 mb-1">
                                    <Brain className="w-4 h-4" />
                                    <span className="font-medium">Reasoning</span>
                                  </div>
                                  <p className="text-muted-foreground">{message.reasoning}</p>
                                </div>
                              )}
                              
                              {/* Content */}
                              {message.isStreaming ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Thinking...</span>
                                </div>
                              ) : message.role === 'assistant' ? (
                                <Streamdown>{message.content}</Streamdown>
                              ) : (
                                <p>{message.content}</p>
                              )}
                              
                              {/* Image */}
                              {message.imageUrl && (
                                <div className="mt-3">
                                  <img
                                    src={message.imageUrl}
                                    alt="Generated"
                                    className="rounded-lg max-w-full"
                                  />
                                </div>
                              )}
                              
                              {/* Citations */}
                              {message.citations && message.citations.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border/50">
                                  <p className="text-xs text-muted-foreground mb-1">Sources:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {message.citations.slice(0, 5).map((citation, i) => (
                                      <a
                                        key={i}
                                        href={citation}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline truncate max-w-[200px]"
                                      >
                                        [{i + 1}]
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Timestamp */}
                              <p className="text-xs opacity-50 mt-2">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                  
                  {/* Speaking indicator */}
                  {isSpeaking && (
                    <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-primary/10 rounded-lg">
                      <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                      <span className="text-sm">SOLtron is speaking...</span>
                      <Button size="sm" variant="ghost" onClick={stopSpeaking}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Input Area */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant={isRecording ? 'destructive' : 'outline'}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder={
                        chatMode === 'search' ? 'Search the web and X...' :
                        chatMode === 'image' ? 'Describe an image to generate...' :
                        chatMode === 'code' ? 'Describe what code you need...' :
                        'Ask SOLtron anything...'
                      }
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="cyber-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total P&L</p>
                      <p className="font-display text-xl font-bold text-green-500">+${soltronData.pnl.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="cyber-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Trades</p>
                      <p className="font-display text-xl font-bold">{soltronData.totalTrades}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="cyber-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                      <p className="font-display text-xl font-bold">{soltronData.sharpeRatio}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="cyber-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Drawdown</p>
                      <p className="font-display text-xl font-bold text-destructive">-{soltronData.maxDrawdown}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  About SOLtron
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  SOLtron is the flagship AI trading agent of the Solana Robotics CLAWD platform. Powered by NVIDIA's 
                  Nemotron-3-Nano-30B model, SOLtron combines advanced reasoning capabilities with real-time market 
                  analysis to identify and execute profitable trading opportunities on the Solana blockchain.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <h4 className="font-medium mb-2">Trading Strategy</h4>
                    <p className="text-sm text-muted-foreground">
                      Multi-factor momentum strategy with sentiment overlay. Combines technical analysis, 
                      on-chain metrics, and social sentiment for signal generation.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <h4 className="font-medium mb-2">Risk Parameters</h4>
                    <p className="text-sm text-muted-foreground">
                      Max position size: 5% of portfolio. Stop loss: 2%. Take profit: 4%. 
                      Daily loss limit: 3% of portfolio.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Capabilities Tab */}
          <TabsContent value="capabilities" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {capabilities.map((cap) => (
                <Card key={cap.name} className="cyber-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <cap.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{cap.name}</p>
                        <p className="text-sm text-muted-foreground">{cap.level}%</p>
                      </div>
                    </div>
                    <Progress value={cap.level} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="space-y-6">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="font-display">Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTrades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          trade.type === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          {trade.type === 'buy' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{trade.pair}</p>
                          <p className="text-sm text-muted-foreground">{trade.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">${trade.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {performanceHistory.map((period) => (
                <Card key={period.period} className="cyber-card">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">{period.period}</p>
                    <p className={`font-display text-2xl font-bold ${period.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {period.roi >= 0 ? '+' : ''}{period.roi}%
                    </p>
                    <div className="flex justify-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{period.trades} trades</span>
                      <span>{period.winRate}% win</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
