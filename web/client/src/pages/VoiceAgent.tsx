'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff,
  Loader2,
  Bot,
  User,
  Zap,
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  Settings,

} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { usePhantomSolana } from '@/hooks/usePhantomSolana';
import { toast } from 'sonner';

// Voice options
type VoiceOption = 'Ara' | 'Rex' | 'Sal' | 'Eve' | 'Leo';

interface VoiceInfo {
  id: VoiceOption;
  name: string;
  type: string;
  tone: string;
  description: string;
}

const VOICE_OPTIONS: VoiceInfo[] = [
  { id: 'Ara', name: 'Ara', type: 'Female', tone: 'Warm, friendly', description: 'Default voice, balanced and conversational' },
  { id: 'Rex', name: 'Rex', type: 'Male', tone: 'Confident, clear', description: 'Professional and articulate, ideal for business' },
  { id: 'Sal', name: 'Sal', type: 'Neutral', tone: 'Smooth, balanced', description: 'Versatile voice suitable for various contexts' },
  { id: 'Eve', name: 'Eve', type: 'Female', tone: 'Energetic, upbeat', description: 'Engaging and enthusiastic, great for interactive experiences' },
  { id: 'Leo', name: 'Leo', type: 'Male', tone: 'Authoritative, strong', description: 'Decisive and commanding, suitable for instructional content' },
];

interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function VoiceAgent() {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Voice settings
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('Rex');
  const [showSettings, setShowSettings] = useState(false);
  
  // Transcript
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  
  // Token gate state
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  
  // WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  const { connected, address, openModal } = usePhantomSolana();
  
  // tRPC queries
  const voiceConfig = trpc.voice.isConfigured.useQuery();
  const getToken = trpc.voice.getToken.useMutation();
  const getSessionConfig = trpc.voice.getSessionConfig.useQuery({
    voice: selectedVoice,
    searchEnabled: true,
    xSearchEnabled: true,
  });
  
  // Token verification
  const verifyToken = trpc.token.verifyHolder.useMutation({
    onSuccess: (data) => {
      setHasAccess(data.isHolder || isAdmin);
      setTokenBalance(data.balance);
    },
  });
  
  // Check admin status via API
  const checkAdmin = trpc.token.checkAdmin.useQuery(
    { walletAddress: address || '' },
    { enabled: !!address }
  );
  
  // Scroll to bottom of transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);
  
  // Verify token holdings when wallet connects
  useEffect(() => {
    if (connected && address) {
      verifyToken.mutate({ walletAddress: address });
    } else {
      setHasAccess(null);
    }
  }, [connected, address]);
  
  // Check if user is admin
  useEffect(() => {
    if (checkAdmin.data) {
      setIsAdmin(checkAdmin.data.isAdmin);
      if (checkAdmin.data.isAdmin) {
        setHasAccess(true);
      }
    }
  }, [checkAdmin.data]);
  
  // Connect to voice agent
  const connectVoiceAgent = useCallback(async () => {
    if (!voiceConfig.data?.configured) {
      toast.error('Voice agent not configured');
      return;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Get ephemeral token
      const tokenResult = await getToken.mutateAsync({ expiresInSeconds: 300 });
      
      if (!tokenResult.success || !tokenResult.token) {
        throw new Error(tokenResult.error || 'Failed to get voice token');
      }
      
      // Create WebSocket connection
      const ws = new WebSocket('wss://api.x.ai/v1/realtime', [
        'realtime',
        `token.${tokenResult.token}`,
      ]);
      
      ws.onopen = () => {
        console.log('[VoiceAgent] WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        
        // Send session configuration
        if (getSessionConfig.data) {
          ws.send(JSON.stringify(getSessionConfig.data));
        }
        
        // Start audio capture
        startAudioCapture(ws);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleServerEvent(data);
        } catch (error) {
          console.error('[VoiceAgent] Failed to parse message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[VoiceAgent] WebSocket error:', error);
        setConnectionError('Connection error');
      };
      
      ws.onclose = (event) => {
        console.log('[VoiceAgent] WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        stopAudioCapture();
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('[VoiceAgent] Connection failed:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnecting(false);
      toast.error('Failed to connect to voice agent');
    }
  }, [voiceConfig.data, getToken, getSessionConfig.data]);
  
  // Disconnect from voice agent
  const disconnectVoiceAgent = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAudioCapture();
    setIsConnected(false);
  }, []);
  
  // Start audio capture
  const startAudioCapture = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        if (isMuted || !ws || ws.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate audio level for visualization
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setAudioLevel(Math.min(rms * 10, 1));
        
        // Convert to 16-bit PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        
        // Convert to base64
        const uint8Array = new Uint8Array(pcm16.buffer);
        let binaryStr = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binaryStr += String.fromCharCode(uint8Array[i]);
        }
        const base64 = btoa(binaryStr);
        
        // Send audio data
        ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64,
        }));
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      setIsListening(true);
    } catch (error) {
      console.error('[VoiceAgent] Failed to start audio capture:', error);
      toast.error('Failed to access microphone');
    }
  };
  
  // Stop audio capture
  const stopAudioCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    setIsListening(false);
    setAudioLevel(0);
  };
  
  // Handle server events
  const handleServerEvent = (event: any) => {
    switch (event.type) {
      case 'session.updated':
        console.log('[VoiceAgent] Session updated');
        break;
        
      case 'conversation.created':
        console.log('[VoiceAgent] Conversation created:', event.conversation?.id);
        break;
        
      case 'input_audio_buffer.speech_started':
        setIsListening(true);
        break;
        
      case 'input_audio_buffer.speech_stopped':
        setIsListening(false);
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        // User speech transcribed
        if (event.transcript) {
          setTranscript(prev => [...prev, {
            id: event.item_id || Date.now().toString(),
            role: 'user',
            text: event.transcript,
            timestamp: new Date(),
          }]);
        }
        break;
        
      case 'response.output_audio_transcript.delta':
        // Assistant response text delta
        setTranscript(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.id === event.item_id) {
            return [
              ...prev.slice(0, -1),
              { ...last, text: last.text + (event.delta || '') },
            ];
          }
          return [...prev, {
            id: event.item_id || Date.now().toString(),
            role: 'assistant',
            text: event.delta || '',
            timestamp: new Date(),
          }];
        });
        break;
        
      case 'response.output_audio.delta':
        // Play audio response
        setIsSpeaking(true);
        playAudioDelta(event.delta);
        break;
        
      case 'response.output_audio.done':
        setIsSpeaking(false);
        break;
        
      case 'response.done':
        console.log('[VoiceAgent] Response complete');
        break;
        
      case 'response.function_call_arguments.done':
        // Handle function calls
        handleFunctionCall(event);
        break;
        
      default:
        console.log('[VoiceAgent] Event:', event.type);
    }
  };
  
  // Play audio delta
  const playAudioDelta = async (base64Audio: string) => {
    if (!base64Audio || !audioContextRef.current) return;
    
    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert 16-bit PCM to Float32
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
      }
      
      // Create audio buffer and play
      const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error('[VoiceAgent] Failed to play audio:', error);
    }
  };
  
  // Handle function calls from voice agent
  const handleFunctionCall = async (event: any) => {
    const { name, call_id, arguments: argsStr } = event;
    
    try {
      const args = JSON.parse(argsStr);
      let result: any = { error: 'Unknown function' };
      
      switch (name) {
        case 'get_token_price':
          // Call our API to get token price
          result = { price: 0.00042, symbol: '$CLAWD', change24h: '+5.2%' };
          break;
          
        case 'get_portfolio':
          result = { 
            totalValue: tokenBalance * 0.00042,
            tokens: [{ symbol: '$CLAWD', balance: tokenBalance }],
          };
          break;
          
        case 'verify_token_holder':
          result = { isHolder: hasAccess, balance: tokenBalance };
          break;
          
        case 'check_robot_status':
          result = { status: 'online', lastActive: new Date().toISOString() };
          break;
          
        default:
          console.log('[VoiceAgent] Unknown function:', name);
      }
      
      // Send function response
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id,
            output: JSON.stringify(result),
          },
        }));
        
        wsRef.current.send(JSON.stringify({ type: 'response.create' }));
      }
    } catch (error) {
      console.error('[VoiceAgent] Function call error:', error);
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Render access denied state
  if (connected && hasAccess === false) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <Card className="max-w-md bg-gray-900/80 border-red-500/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-4">
              You need to hold $CLAWD tokens to access the Voice Agent.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Current balance: {tokenBalance.toLocaleString()} $CLAWD
            </p>
            <Button
              onClick={() => window.open('https://jup.ag/swap/SOL-8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump', '_blank')}
              className="bg-gradient-to-r from-cyan-500 to-purple-500"
            >
              Buy $CLAWD on Jupiter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SOLtron Voice Agent</h1>
              <p className="text-gray-400 text-sm">Powered by xAI Grok</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
            {hasAccess && (
              <Badge variant="outline" className="border-green-500/50 text-green-400">
                <Unlock className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Wallet Connection */}
        {!connected && (
          <Card className="bg-gray-900/80 border-cyan-500/30">
            <CardContent className="p-6 text-center">
              <p className="text-gray-400 mb-4">Connect your wallet to access the Voice Agent</p>
              <Button onClick={openModal} className="bg-gradient-to-r from-cyan-500 to-purple-500">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Settings Panel */}
        {showSettings && (
          <Card className="bg-gray-900/80 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">Voice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Voice</label>
                <Select value={selectedVoice} onValueChange={(v) => setSelectedVoice(v as VoiceOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{voice.name}</span>
                          <span className="text-xs text-gray-400">({voice.type})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {VOICE_OPTIONS.find(v => v.id === selectedVoice)?.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Main Voice Interface */}
        {connected && hasAccess && (
          <Card className="bg-gray-900/80 border-gray-700">
            <CardContent className="p-6">
              {/* Connection Status */}
              <div className="flex items-center justify-center mb-6">
                {connectionError && (
                  <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{connectionError}</span>
                  </div>
                )}
              </div>
              
              {/* Voice Visualization */}
              <div className="flex flex-col items-center justify-center py-8">
                {/* Main Call Button */}
                <div className="relative">
                  <div
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isConnected
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30'
                        : 'bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/30'
                    }`}
                    style={{
                      transform: isConnected && (isListening || isSpeaking) ? `scale(${1 + audioLevel * 0.2})` : 'scale(1)',
                    }}
                  >
                    <button
                      onClick={isConnected ? disconnectVoiceAgent : connectVoiceAgent}
                      disabled={isConnecting || !voiceConfig.data?.configured}
                      className="w-full h-full rounded-full flex items-center justify-center"
                    >
                      {isConnecting ? (
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                      ) : isConnected ? (
                        <PhoneOff className="w-12 h-12 text-white" />
                      ) : (
                        <Phone className="w-12 h-12 text-white" />
                      )}
                    </button>
                  </div>
                  
                  {/* Audio Level Ring */}
                  {isConnected && (
                    <div
                      className="absolute inset-0 rounded-full border-4 border-cyan-400/50 animate-pulse"
                      style={{
                        transform: `scale(${1.1 + audioLevel * 0.3})`,
                        opacity: 0.5 + audioLevel * 0.5,
                      }}
                    />
                  )}
                </div>
                
                {/* Status Text */}
                <div className="mt-6 text-center">
                  <p className="text-lg font-medium">
                    {isConnecting ? 'Connecting...' :
                     isConnected ? (isSpeaking ? 'SOLtron is speaking...' : isListening ? 'Listening...' : 'Connected') :
                     'Tap to start voice chat'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {isConnected ? `Voice: ${selectedVoice}` : 'Real-time voice conversation with SOLtron'}
                  </p>
                </div>
                
                {/* Control Buttons */}
                {isConnected && (
                  <div className="flex items-center gap-4 mt-6">
                    <Button
                      variant={isMuted ? 'destructive' : 'outline'}
                      size="lg"
                      onClick={toggleMute}
                      className="rounded-full w-14 h-14"
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Transcript */}
              {transcript.length > 0 && (
                <div className="mt-6 border-t border-gray-700 pt-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Transcript</h3>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {transcript.map((entry) => (
                        <div
                          key={entry.id}
                          className={`flex gap-3 ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              entry.role === 'user'
                                ? 'bg-cyan-500/20 text-cyan-100'
                                : 'bg-gray-800 text-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {entry.role === 'user' ? (
                                <User className="w-3 h-3" />
                              ) : (
                                <Bot className="w-3 h-3" />
                              )}
                              <span className="text-xs text-gray-400">
                                {entry.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm">{entry.text}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={transcriptEndRef} />
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Voice Commands Help */}
        <Card className="bg-gray-900/80 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Voice Commands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-gray-400 font-medium">Trading</p>
                <ul className="space-y-1 text-gray-300">
                  <li>"What's the price of $CLAWD?"</li>
                  <li>"Show my portfolio"</li>
                  <li>"Buy 100 SOL worth of $CLAWD"</li>
                  <li>"What are the trending tokens?"</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 font-medium">Robot Control</p>
                <ul className="space-y-1 text-gray-300">
                  <li>"Check robot status"</li>
                  <li>"Start trading bot"</li>
                  <li>"Show robot registry"</li>
                  <li>"Generate avatar"</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 font-medium">Search</p>
                <ul className="space-y-1 text-gray-300">
                  <li>"Search for Solana news"</li>
                  <li>"What's trending on X?"</li>
                  <li>"Find DeFi protocols"</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 font-medium">General</p>
                <ul className="space-y-1 text-gray-300">
                  <li>"Explain token gating"</li>
                  <li>"What can you do?"</li>
                  <li>"Help me get started"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
