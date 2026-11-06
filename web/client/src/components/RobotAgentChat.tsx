'use client';

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bot, 
  Send, 
  Loader2, 
  Code, 
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRightLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import { usePhantomSolana } from '@/hooks/usePhantomSolana';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  reasoning_details?: unknown;
  timestamp: Date;
  tradeIntent?: TradeIntent;
  quote?: any;
}

interface TradeIntent {
  action: 'buy' | 'sell' | 'swap';
  inputToken: string;
  outputToken: string;
  amount: number;
  amountType: 'input' | 'output';
}

interface RobotAgentChatProps {
  className?: string;
  defaultOpen?: boolean;
  mode?: 'trading' | 'coding' | 'chat';
}

export function RobotAgentChat({ 
  className = '', 
  defaultOpen = false,
  mode: initialMode = 'trading' 
}: RobotAgentChatProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('claude-opus');
  const [mode, setMode] = useState<'trading' | 'coding' | 'chat'>(initialMode);
  const [pendingTrade, setPendingTrade] = useState<{ quote: any; intent: TradeIntent } | null>(null);
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Phantom wallet hook
  const { address: walletAddress, signAndSendTransaction, connected: isConnected, openModal } = usePhantomSolana();

  // Get available models
  const { data: models } = trpc.agent.models.useQuery();

  // Mutations for different modes
  const chatMutation = trpc.agent.chat.useMutation();
  const tradingMutation = trpc.agent.trading.useMutation();
  const codexMutation = trpc.agent.codex.useMutation();

  // Trade execution mutations
  const parseIntentMutation = trpc.trade.parseIntent.useMutation();
  const getQuoteMutation = trpc.trade.getQuote.useMutation();
  const buildTransactionMutation = trpc.trade.buildTransaction.useMutation();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize agent on mount
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        role: 'assistant',
        content: mode === 'trading' 
          ? "🤖 **SOLtron Trading Agent initialized.** I'm powered by multi-model AI via OpenRouter. Ask me about $CLAWD token analysis, trading strategies, or market insights. Select a model from the dropdown to switch providers."
          : mode === 'coding'
          ? "💻 **Codex Agent initialized.** I'm powered by GPT-5.2 Codex with step-by-step reasoning. Ask me to write Solana programs, smart contracts, or web3 integrations."
          : "✨ **AI Agent initialized.** I can help with any questions. Select a model from the dropdown to switch between Claude, Minimax, or Gemini.",
        model: 'System',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, mode]);

  // Execute a pending trade
  const executeTrade = async () => {
    if (!pendingTrade || !walletAddress) {
      toast.error('No pending trade or wallet not connected');
      return;
    }

    setIsExecutingTrade(true);
    try {
      // Build the transaction
      const txResult = await buildTransactionMutation.mutateAsync({
        quote: pendingTrade.quote,
        userPublicKey: walletAddress,
        prioritizationFeeLamports: 'auto',
      });

      if (!txResult.success || !txResult.swapTransaction) {
        throw new Error(txResult.error || 'Failed to build transaction');
      }

      // Decode and sign the transaction
      const { Transaction: SolanaTransaction } = await import('@solana/web3.js');
      const txBuffer = Buffer.from(txResult.swapTransaction as string, 'base64');
      const transaction = SolanaTransaction.from(txBuffer);

      // Sign and send
      const signature = await signAndSendTransaction(transaction);

      if (signature) {
        const successMessage: Message = {
          role: 'assistant',
          content: `✅ **Trade executed successfully!**\n\nTransaction signature: \`${signature}\`\n\n[View on Solscan](https://solscan.io/tx/${signature}?cluster=devnet)`,
          model: 'System',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, successMessage]);
        toast.success('Trade executed successfully!');
      } else {
        throw new Error('Transaction signing failed');
      }
    } catch (error: any) {
      console.error('Trade execution error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ **Trade failed:** ${error.message || 'Unknown error'}`,
        model: 'System',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Trade execution failed');
    } finally {
      setIsExecutingTrade(false);
      setPendingTrade(null);
    }
  };

  // Cancel pending trade
  const cancelTrade = () => {
    setPendingTrade(null);
    const cancelMessage: Message = {
      role: 'assistant',
      content: '❌ Trade cancelled.',
      model: 'System',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Check if this is a trade command in trading mode
      if (mode === 'trading') {
        const tradeIntent = await parseIntentMutation.mutateAsync({ message: userInput });
        
        if (tradeIntent) {
          // This is a trade command - get a quote
          const LAMPORTS_PER_SOL = 1_000_000_000;
          const amountInLamports = Math.floor(tradeIntent.amount * LAMPORTS_PER_SOL);
          
          const quoteResult = await getQuoteMutation.mutateAsync({
            inputMint: tradeIntent.inputToken,
            outputMint: tradeIntent.outputToken,
            amount: amountInLamports,
            slippageBps: 50,
          });

          if (quoteResult.success && quoteResult.quote) {
            const inAmount = parseFloat(quoteResult.quote.inAmount) / LAMPORTS_PER_SOL;
            const outAmount = parseFloat(quoteResult.quote.outAmount) / LAMPORTS_PER_SOL;
            const priceImpact = parseFloat(quoteResult.quote.priceImpactPct);
            const routes = quoteResult.quote.routePlan?.map((r: any) => r.swapInfo?.label).join(' → ') || 'Direct';

            const quoteMessage: Message = {
              role: 'assistant',
              content: `📊 **Swap Quote Ready**\n\n` +
                `**${tradeIntent.action.toUpperCase()}:** ${inAmount.toFixed(6)} → ${outAmount.toFixed(6)}\n` +
                `**Price Impact:** ${priceImpact.toFixed(4)}%\n` +
                `**Route:** ${routes}\n` +
                `**Slippage:** 0.5%\n\n` +
                `${!isConnected ? '⚠️ Connect your wallet to execute this trade.' : 'Click **Execute Trade** below to proceed or **Cancel** to abort.'}`,
              model: 'Jupiter',
              quote: quoteResult.quote,
              tradeIntent,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, quoteMessage]);
            setPendingTrade({ quote: quoteResult.quote, intent: tradeIntent });
            setIsLoading(false);
            return;
          } else {
            toast.error('Failed to get quote from Jupiter');
          }
        }
      }

      // Regular chat/trading analysis
      const messageHistory = messages
        .filter(m => m.role !== 'assistant' || !m.content.includes('initialized'))
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          reasoning_details: m.reasoning_details,
        }));

      let result;

      if (mode === 'coding') {
        result = await codexMutation.mutateAsync({
          messages: [...messageHistory, { role: 'user', content: userInput }],
          enableReasoning: true,
        });
      } else if (mode === 'trading') {
        result = await tradingMutation.mutateAsync({
          messages: [...messageHistory, { role: 'user', content: userInput }],
          modelId: selectedModel,
        });
      } else {
        result = await chatMutation.mutateAsync({
          messages: [...messageHistory, { role: 'user', content: userInput }],
          modelId: selectedModel,
        });
      }

      if (result.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.content || 'No response received.',
          model: result.model,
          reasoning_details: (result as any).reasoning_details,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        toast.error(result.error || 'Failed to get response');
        // Remove the user message if failed
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'trading': return <TrendingUp className="h-4 w-4" />;
      case 'coding': return <Code className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'trading': return 'text-cyan-400 border-cyan-500/50';
      case 'coding': return 'text-green-400 border-green-500/50';
      default: return 'text-purple-400 border-purple-500/50';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-6 z-40 p-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 ${className}`}
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-20 right-6 z-40 w-96 max-h-[600px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-gray-700 ${getModeColor()}`}>
            {getModeIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">
              {mode === 'trading' ? 'Trading Agent' : mode === 'coding' ? 'Codex Agent' : 'AI Agent'}
            </h3>
            <p className="text-xs text-gray-400">
              {models?.find(m => m.id === selectedModel)?.provider || 'OpenRouter'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <SelectTrigger className="w-24 h-7 text-xs bg-gray-800 border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trading">Trading</SelectItem>
              <SelectItem value="coding">Coding</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Model Selector */}
      {mode !== 'coding' && (
        <div className="p-2 border-b border-gray-700 bg-gray-800/30">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-full h-8 text-xs bg-gray-800 border-gray-600">
              <SelectValue placeholder="Select model..." />
            </SelectTrigger>
            <SelectContent>
              {models?.filter(m => !m.isCodex).map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <span>{model.name}</span>
                    <span className="text-xs text-gray-500">({model.provider})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}
              >
                {message.role === 'assistant' && message.model && (
                  <div className="text-xs text-gray-500 mb-1 font-mono">
                    {message.model}
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
                {/* Trade execution buttons */}
                {message.quote && pendingTrade && (
                  <div className="mt-3 flex gap-2">
                    {isConnected ? (
                      <>
                        <Button
                          size="sm"
                          onClick={executeTrade}
                          disabled={isExecutingTrade}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50"
                        >
                          {isExecutingTrade ? (
                            <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Executing...</>
                          ) : (
                            <><ArrowRightLeft className="h-3 w-3 mr-1" /> Execute Trade</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelTrade}
                          disabled={isExecutingTrade}
                          className="text-red-400 border-red-500/50 hover:bg-red-500/10"
                        >
                          <X className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={openModal}
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50"
                      >
                        Connect Wallet to Trade
                      </Button>
                    )}
                  </div>
                )}
                {Boolean(message.reasoning_details) && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-400">
                      View reasoning
                    </summary>
                    <pre className="mt-1 p-2 bg-gray-900 rounded text-gray-400 overflow-x-auto">
                      {String(JSON.stringify(message.reasoning_details, null, 2))}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'trading' 
                ? "Ask about $CLAWD, trading strategies..." 
                : mode === 'coding'
                ? "Describe what code you need..."
                : "Ask anything..."
            }
            className="flex-1 bg-gray-800 border-gray-600 text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default RobotAgentChat;
