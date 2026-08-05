import React, { useState, useRef, useEffect } from 'react';
import { Message, RobotVariant } from './types';

interface ChatInterfaceProps {
  onSendMessage: (msg: string) => void;
  messages: Message[];
  variant: RobotVariant;
  isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onSendMessage, 
  messages, 
  variant,
  isProcessing 
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col h-[400px] border border-white/10 rounded-2xl bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono text-xs font-bold tracking-widest text-white/80 uppercase">Communication Terminal</span>
        </div>
        <div className="text-[10px] font-mono text-white/30">v2.0.4-LATEST</div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-sm scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-white/20 text-center px-10">
            <p className="mb-2 italic">Waiting for input...</p>
            <p className="text-xs">Ask SOL-CLAWD about the blockchain or just say hi.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div 
              className={`max-w-[85%] px-4 py-2 rounded-xl ${
                msg.role === 'user' 
                  ? 'bg-white/10 text-white rounded-tr-none' 
                  : 'bg-indigo-500/20 text-indigo-100 rounded-tl-none border border-indigo-500/30'
              }`}
            >
              {msg.content}
            </div>
            <span className="text-[10px] mt-1 opacity-30 text-white">
              {msg.role === 'assistant' ? 'SOL-CLAWD' : 'USER'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-2 items-center text-indigo-400">
             <div className="animate-bounce w-1 h-1 bg-current rounded-full" />
             <div className="animate-bounce w-1 h-1 bg-current rounded-full [animation-delay:0.2s]" />
             <div className="animate-bounce w-1 h-1 bg-current rounded-full [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-black/40 border-t border-white/5">
        <div className="relative group">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder={isProcessing ? "SOL-CLAWD is processing..." : "Command SOL-CLAWD..."}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 pr-16 outline-none focus:border-indigo-500/50 transition-all text-sm font-mono placeholder:text-white/20 text-white"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-2 bottom-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-white/20 transition-colors text-xs font-bold uppercase tracking-tighter text-white"
            style={{ backgroundColor: isProcessing ? undefined : variant.accentColor }}
          >
            EXEC
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
