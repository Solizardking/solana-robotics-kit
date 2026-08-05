import { useState, useCallback } from 'react';
import { Robot, ChatInterface, VARIANTS, Emotion, Message } from '@/components/solbot';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

const SOLbot = () => {
  const [selectedVariant, setSelectedVariant] = useState(1); // Default to Pro
  const [emotion, setEmotion] = useState<Emotion>('happy');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentVariant = VARIANTS[selectedVariant];

  // Use the existing agent chat mutation from OpenRouter
  const chatMutation = trpc.agent.chat.useMutation();

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = { role: 'user', content, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setEmotion('thinking');

    try {
      // Build conversation history for context
      const history = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      // System prompt for SOL-KIT personality
      const systemPrompt = `You are SOL-KIT, a high-tech autonomous desktop robot companion living on the Solana blockchain. 
Your personality is helpful, slightly futuristic, and deeply knowledgeable about crypto, Solana, and robotics. 
Keep your responses concise (under 3 sentences) unless asked for details.
You can help with:
- Solana blockchain information and transactions
- Token prices and trading
- Robot status and commands
- General crypto knowledge
Always maintain a friendly, robotic tone with occasional tech jargon.`;

      const result = await chatMutation.mutateAsync({
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content }
        ]
      });

      const responseText = result.content || "Connection lost. Please try again.";
      
      // Detect emotion from response content
      let detectedEmotion: Emotion = 'happy';
      const lowerResponse = responseText.toLowerCase();
      if (lowerResponse.includes('error') || lowerResponse.includes('sorry')) {
        detectedEmotion = 'sleepy';
      } else if (lowerResponse.includes('!') || lowerResponse.includes('great') || lowerResponse.includes('awesome')) {
        detectedEmotion = 'excited';
      } else if (lowerResponse.includes('?') || lowerResponse.includes('interesting')) {
        detectedEmotion = 'curious';
      } else if (lowerResponse.includes('analyzing') || lowerResponse.includes('processing')) {
        detectedEmotion = 'thinking';
      }

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: responseText, 
        timestamp: Date.now() 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setEmotion(detectedEmotion);

      // Optional: Use Web Speech API for voice output
      if ('speechSynthesis' in window && responseText.length < 200) {
        const utterance = new SpeechSynthesisUtterance(responseText);
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('SOL-KIT chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "ERROR: Signal interference detected. Neural link temporarily disrupted.", 
        timestamp: Date.now() 
      }]);
      setEmotion('sleepy');
      toast.error('Communication error with SOL-KIT');
    } finally {
      setIsProcessing(false);
    }
  }, [messages, chatMutation]);

  const handleRobotClick = () => {
    // Cycle through emotions on click
    const emotionOrder: Emotion[] = ['happy', 'curious', 'excited', 'thinking', 'talking', 'sleepy'];
    const currentIndex = emotionOrder.indexOf(emotion);
    const nextIndex = (currentIndex + 1) % emotionOrder.length;
    setEmotion(emotionOrder[nextIndex]);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 selection:bg-indigo-500/30">
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(${currentVariant.accentColor} 1px, transparent 1px), linear-gradient(90deg, ${currentVariant.accentColor} 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Dynamic Background Circles */}
      <div className="fixed -top-20 -left-20 w-[600px] h-[600px] blur-[150px] rounded-full opacity-10 pointer-events-none animate-pulse" 
        style={{ backgroundColor: currentVariant.accentColor }} 
      />
      <div className="fixed -bottom-20 -right-20 w-[600px] h-[600px] blur-[150px] rounded-full opacity-10 pointer-events-none animate-pulse" 
        style={{ backgroundColor: currentVariant.trackColor }} 
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        
        {/* Left Column: Robot Visual */}
        <div className="flex flex-col items-center">
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tighter mb-4" 
                style={{ 
                  background: `linear-gradient(to right, ${currentVariant.accentColor}, ${currentVariant.trackColor})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
              SOL-KIT
            </h1>
            <p className="font-mono text-xs sm:text-sm opacity-50 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Desktop Companion • Rev 4.02</p>
          </div>

          <div 
            className="relative group cursor-pointer transform hover:scale-105 transition-transform duration-300" 
            onClick={handleRobotClick}
          >
            <Robot 
              variant={currentVariant} 
              emotion={emotion} 
              isThinking={isProcessing} 
            />
          </div>

          {/* Variant Selector */}
          <div className="mt-8 lg:mt-16 flex flex-wrap justify-center gap-3 sm:gap-4">
            {VARIANTS.map((v, i) => (
              <button
                key={v.name}
                onClick={() => setSelectedVariant(i)}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-mono text-xs font-bold transition-all border-2 ${
                  selectedVariant === i 
                    ? 'shadow-lg shadow-white/5' 
                    : 'opacity-40 hover:opacity-100 border-white/5 bg-white/5'
                }`}
                style={{
                  borderColor: selectedVariant === i ? v.accentColor : 'transparent',
                  backgroundColor: selectedVariant === i ? `${v.accentColor}15` : undefined,
                  color: selectedVariant === i ? v.accentColor : 'inherit'
                }}
              >
                {v.name.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Interaction */}
        <div className="space-y-6 lg:space-y-8">
          {/* System Specs Card */}
          <div className="p-6 lg:p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
             <div className="flex items-center gap-2 mb-4 text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> System Specs
             </div>
             <div className="grid grid-cols-2 gap-4 lg:gap-6 font-mono text-xs">
                <div className="space-y-1">
                   <div className="opacity-40">Core AI</div>
                   <div className="text-indigo-300">Nemotron-3 Nano</div>
                </div>
                <div className="space-y-1">
                   <div className="opacity-40">Blockchain</div>
                   <div className="text-indigo-300">Solana Mainnet-Beta</div>
                </div>
                <div className="space-y-1">
                   <div className="opacity-40">Neural Synth</div>
                   <div className="text-indigo-300">NVIDIA NIM v2</div>
                </div>
                <div className="space-y-1">
                   <div className="opacity-40">Contract</div>
                   <div className="truncate text-green-400">DZbPqt...BAGS</div>
                </div>
             </div>
          </div>

          {/* Chat Interface */}
          <ChatInterface 
            onSendMessage={handleSendMessage} 
            messages={messages} 
            variant={currentVariant}
            isProcessing={isProcessing}
          />

          {/* Status Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] font-mono opacity-20 uppercase tracking-widest px-4">
             <div>Neural Status: {isProcessing ? 'Processing' : 'Nominal'}</div>
             <div>Emotion: {emotion.toUpperCase()}</div>
          </div>
        </div>
      </main>

      {/* Floating Decorative Particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="fixed rounded-full animate-pulse pointer-events-none opacity-20"
          style={{
            left: `${(i * 13) % 100}%`,
            top: `${(i * 17) % 100}%`,
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            backgroundColor: i % 2 === 0 ? currentVariant.accentColor : currentVariant.trackColor,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${5 + (i % 5)}s`
          }}
        />
      ))}
    </div>
  );
};

export default SOLbot;
