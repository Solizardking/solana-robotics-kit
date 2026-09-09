/**
 * Chat with Docs Component
 *
 * Interactive documentation chat interface powered by NVIDIA NeMo Retriever
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  sources?: Source[];
  timestamp: number;
}

interface Source {
  source: string;
  relevance: number;
  content_preview: string;
}

interface Suggestion {
  text: string;
  category: string;
}

const EXAMPLE_QUESTIONS: Suggestion[] = [
  { text: "What are TICKER-01's superpowers?", category: "Agents" },
  { text: "How do I deploy the arena?", category: "Deployment" },
  { text: "Show me the agent registration smart contract", category: "Code" },
  { text: "What's the difference between ATLAS-BULL and ATLAS-BEAR?", category: "Agents" },
  { text: "How does the prediction market calculate payouts?", category: "Technical" },
  { text: "What models are available in the NVIDIA NIM integration?", category: "AI Models" },
];

export default function ChatWithDocs() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (question?: string) => {
    const messageText = question || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call API
      const response = await fetch('/api/docs/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversation_id: 'session-1',
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        reasoning: data.reasoning,
        sources: data.sources,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Get follow-up suggestions
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }

    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Chat with Docs</h1>
            <p className="text-sm text-slate-400">Ask me anything about Solana Automation</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Powered by</span>
          <span className="text-sm font-semibold text-green-400">NVIDIA NeMo Retriever</span>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome to the Documentation Hub
              </h2>
              <p className="text-slate-400 text-lg">
                Ask me anything about the Solana Automation Kit
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
              {EXAMPLE_QUESTIONS.map((q, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendMessage(q.text)}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition-all text-left group"
                >
                  <div className="text-xs text-blue-400 mb-2">{q.category}</div>
                  <div className="text-sm text-slate-200 group-hover:text-white">
                    {q.text}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800/80 border border-slate-700/50 text-slate-100'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>

                  {/* Reasoning Toggle */}
                  {message.reasoning && (
                    <motion.button
                      onClick={() => setShowReasoning(
                        showReasoning === message.id ? null : message.id
                      )}
                      className="mt-2 text-xs text-slate-400 hover:text-blue-400 flex items-center space-x-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>
                        {showReasoning === message.id ? 'Hide' : 'Show'} reasoning
                      </span>
                    </motion.button>
                  )}

                  {/* Reasoning Content */}
                  {showReasoning === message.id && message.reasoning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30"
                    >
                      <div className="text-xs text-slate-400 mb-1">Reasoning Process:</div>
                      <p className="text-xs text-slate-300 font-mono leading-relaxed">
                        {message.reasoning}
                      </p>
                    </motion.div>
                  )}

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => setShowSources(
                          showSources === message.id ? null : message.id
                        )}
                        className="text-xs text-slate-400 hover:text-blue-400 flex items-center space-x-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>
                          {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
                        </span>
                      </button>

                      {showSources === message.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2"
                        >
                          {message.sources.map((source, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-slate-900/30 border border-slate-700/30"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-mono text-blue-400">
                                  {source.source}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {(source.relevance * 100).toFixed(0)}% relevant
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 line-clamp-2">
                                {source.content_preview}
                              </p>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2 text-slate-400"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm">Thinking...</span>
          </motion.div>
        )}

        {/* Follow-up Suggestions */}
        {suggestions.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2"
          >
            <span className="text-xs text-slate-500">Suggested follow-ups:</span>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(suggestion)}
                className="px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 text-xs text-slate-300 hover:text-white transition-all"
              >
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-slate-800/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about agents, deployment, code examples..."
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 focus:outline-none text-white placeholder-slate-500 transition-all"
                disabled={isLoading}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                input.trim() && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              }`}
            >
              Send
            </motion.button>
          </div>

          <div className="mt-2 text-xs text-slate-500 text-center">
            Powered by NVIDIA Nemotron-3-Nano-30B with NeMo Retriever
          </div>
        </div>
      </div>
    </div>
  );
}
