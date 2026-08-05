'use client';

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Search,
  Code,
  TrendingUp,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Zap,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  timestamp: Date;
}

interface GrokAgentProps {
  defaultOpen?: boolean;
}

export default function GrokAgent({ defaultOpen = false }: GrokAgentProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey there! I'm Grok, your AI assistant for Solana Robotics. I can help you with:\n\n🔍 **Web Search** - Real-time info from the web and X\n💹 **Trading** - Token analysis and market insights\n💻 **Vibe Coding** - Generate Solana code snippets\n🎨 **Image Generation** - Create robot avatars\n\nWhat would you like to explore today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'search' | 'code' | 'trading' | 'image'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickChatMutation = trpc.grok.quickChat.useMutation();
  const tradingMutation = trpc.grok.trading.useMutation();
  const vibeCodeMutation = trpc.grok.vibeCode.useMutation();
  const generateImageMutation = trpc.grok.generateImage.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string, citations?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      citations,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      let response;

      switch (activeMode) {
        case 'search':
        case 'chat':
          response = await quickChatMutation.mutateAsync({
            message: userMessage,
            enableSearch: activeMode === 'search',
          });
          if (response.success) {
            addMessage('assistant', response.content || 'No response', response.citations);
          } else {
            addMessage('assistant', `Error: ${response.error || 'Unknown error'}`);
          }
          break;

        case 'trading':
          response = await tradingMutation.mutateAsync({ query: userMessage });
          if (response.success) {
            addMessage('assistant', response.content || 'No response', response.citations);
          } else {
            addMessage('assistant', `Error: ${response.error || 'Unknown error'}`);
          }
          break;

        case 'code':
          response = await vibeCodeMutation.mutateAsync({ request: userMessage });
          if (response.success) {
            addMessage('assistant', response.content || 'No response');
          } else {
            addMessage('assistant', `Error: ${response.error || 'Unknown error'}`);
          }
          break;

        case 'image':
          response = await generateImageMutation.mutateAsync({
            prompt: userMessage,
            count: 1,
          });
          if (response.success && response.images && response.images.length > 0) {
            const imageContent = response.images
              .map(img => `![Generated Image](${img.url})\n\n*Prompt: ${img.revisedPrompt || userMessage}*`)
              .join('\n\n');
            addMessage('assistant', imageContent);
          } else {
            addMessage('assistant', `Error: ${response.error || 'Failed to generate image'}`);
          }
          break;
      }
    } catch (error: any) {
      console.error('Grok error:', error);
      addMessage('assistant', `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const modeButtons = [
    { mode: 'chat' as const, icon: MessageSquare, label: 'Chat', color: 'text-cyan-400' },
    { mode: 'search' as const, icon: Search, label: 'Search', color: 'text-emerald-400' },
    { mode: 'trading' as const, icon: TrendingUp, label: 'Trading', color: 'text-yellow-400' },
    { mode: 'code' as const, icon: Code, label: 'Code', color: 'text-purple-400' },
    { mode: 'image' as const, icon: ImageIcon, label: 'Image', color: 'text-pink-400' },
  ];

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 flex items-center justify-center group"
      >
        <Bot className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 bg-card border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 transition-all duration-300 ${
        isMinimized
          ? 'bottom-6 right-6 w-80 h-14'
          : 'bottom-6 right-6 w-96 h-[600px] max-h-[80vh]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Grok Agent</h3>
            <p className="text-xs text-muted-foreground">Powered by xAI</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Mode Selector */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border/50 overflow-x-auto">
            {modeButtons.map(({ mode, icon: Icon, label, color }) => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeMode === mode
                    ? `bg-white/10 ${color}`
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 180px)' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                      : 'bg-white/5 border border-border/50'
                  }`}
                >
                  <div className="text-sm prose prose-invert prose-sm max-w-none">
                    <Streamdown>{message.content}</Streamdown>
                  </div>
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <p className="text-xs text-muted-foreground mb-1">Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.citations.slice(0, 3).map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {new URL(url).hostname}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-border/50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-card rounded-b-xl">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeMode === 'search'
                    ? 'Search the web and X...'
                    : activeMode === 'trading'
                    ? 'Ask about trading...'
                    : activeMode === 'code'
                    ? 'Describe the code you need...'
                    : activeMode === 'image'
                    ? 'Describe the image to generate...'
                    : 'Ask Grok anything...'
                }
                className="flex-1 bg-white/5 border-border/50 focus:border-cyan-500"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Mode: {modeButtons.find(m => m.mode === activeMode)?.label}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
