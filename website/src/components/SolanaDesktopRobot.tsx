'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SolanaDesktopRobotProps {
  openvoiceServerUrl?: string;
  onVoiceResponse?: (audioUrl: string) => void;
}

const SolanaDesktopRobot: React.FC<SolanaDesktopRobotProps> = ({
  openvoiceServerUrl = 'http://localhost:5000',
  onVoiceResponse
}) => {
  const [eyeState, setEyeState] = useState('normal');
  const [headTilt, setHeadTilt] = useState(0);
  const [blinking, setBlinking] = useState(false);
  const [emotion, setEmotion] = useState('happy');
  const [glowPulse, setGlowPulse] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeVoice, setActiveVoice] = useState<string | null>(null);
  const [voices, setVoices] = useState<any[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Check server connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${openvoiceServerUrl}/health`);
        if (response.ok) {
          setIsConnected(true);
          loadVoices();
        }
      } catch (error) {
        console.error('OpenVoice server not available:', error);
        setIsConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [openvoiceServerUrl]);

  // Load available voices
  const loadVoices = async () => {
    try {
      const response = await fetch(`${openvoiceServerUrl}/api/voices`);
      const data = await response.json();
      if (data.success) {
        setVoices(data.voices);
        const active = data.voices.find((v: any) => v.active);
        if (active) setActiveVoice(active.name);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  // Blink animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Head movement
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setHeadTilt((Math.random() - 0.5) * 10);
    }, 2000);
    return () => clearInterval(moveInterval);
  }, []);

  // Glow pulse
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setGlowPulse(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(pulseInterval);
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleRecordingStop;
      mediaRecorder.start();
      setIsRecording(true);
      setEmotion('curious');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop recording and process
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsProcessing(true);
      setEmotion('excited');
    }
  };

  // Handle recording stop and send to server
  const handleRecordingStop = async () => {
    if (audioChunksRef.current.length === 0) return;

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      const response = await fetch(`${openvoiceServerUrl}/api/process_audio`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success && data.audio_url) {
        const audioUrl = `${openvoiceServerUrl}${data.audio_url}`;
        
        // Play the response
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = audioUrl;
          audioPlayerRef.current.play();
        }

        // Callback
        if (onVoiceResponse) {
          onVoiceResponse(audioUrl);
        }

        // Update emotion based on response
        if (data.response_text) {
          const text = data.response_text.toLowerCase();
          if (text.includes('happy') || text.includes('great')) {
            setEmotion('happy');
          } else if (text.includes('thinking') || text.includes('consider')) {
            setEmotion('curious');
          }
        }

        setEmotion('happy');
      } else {
        console.error('Server error:', data.error);
        setEmotion('sleepy');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      setEmotion('sleepy');
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  // Synthesize text to speech
  const synthesizeText = async (text: string) => {
    if (!activeVoice) {
      alert('Please select a voice profile first');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${openvoiceServerUrl}/api/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: activeVoice,
          language: 'EN',
          speed: 1.0
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = url;
          audioPlayerRef.current.play();
        }

        if (onVoiceResponse) {
          onVoiceResponse(url);
        }
      }
    } catch (error) {
      console.error('Error synthesizing:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const variants = [
    { name: 'SOL-KIT Mini', bodyColor: '#1a1a2e', accentColor: '#9945FF', trackColor: '#14F195' },
    { name: 'SOL-KIT Pro', bodyColor: '#0f0f1a', accentColor: '#14F195', trackColor: '#9945FF' },
    { name: 'SOL-KIT Elite', bodyColor: '#2a1a3e', accentColor: '#FFD700', trackColor: '#9945FF' },
  ];

  const currentVariant = variants[selectedVariant];
  const glowIntensity = 0.5 + Math.sin(glowPulse * 0.1) * 0.3;

  // Solana Logo SVG Path
  const SolanaLogo = ({ size = 40, color = '#14F195', glow = true }: { size?: number; color?: string; glow?: boolean }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{
      filter: glow ? `drop-shadow(0 0 ${10 * glowIntensity}px ${color})` : 'none',
      transition: 'all 0.3s ease'
    }}>
      <g transform={`scale(${blinking ? '1 0.1' : '1 1'})`} style={{ 
        transformOrigin: 'center',
        transition: 'transform 0.1s ease'
      }}>
        <path 
          d="M15 25 L85 25 L75 40 L5 40 Z" 
          fill={color}
          opacity={0.9}
        />
        <path 
          d="M5 45 L75 45 L85 60 L15 60 Z" 
          fill={color}
          opacity={0.95}
        />
        <path 
          d="M15 65 L85 65 L75 80 L5 80 Z" 
          fill={color}
        />
      </g>
    </svg>
  );

  const emotions = {
    happy: { eyeScale: 1, eyeY: 0, mouthCurve: 10 },
    curious: { eyeScale: 1.1, eyeY: -5, mouthCurve: 0 },
    sleepy: { eyeScale: 0.6, eyeY: 5, mouthCurve: 5 },
    excited: { eyeScale: 1.2, eyeY: -3, mouthCurve: 15 },
  };

  const currentEmotion = emotions[emotion as keyof typeof emotions];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(#9945FF 1px, transparent 1px),
            linear-gradient(90deg, #9945FF 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Floating Particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${10 + (i * 4.5) % 80}%`,
            top: `${10 + (i * 7.3) % 80}%`,
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            backgroundColor: i % 2 === 0 ? '#9945FF' : '#14F195',
            opacity: 0.3 + (i % 5) * 0.1,
            animation: `float ${3 + i % 3}s ease-in-out infinite`
          }}
        />
      ))}

      {/* Title */}
      <div className="text-center mb-8 relative z-10">
        <h1 
          className="text-4xl font-bold mb-2"
          style={{
            background: 'linear-gradient(90deg, #9945FF, #14F195)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          SOL-KIT Desktop Companion
        </h1>
        <p className="text-gray-500 font-mono text-sm">
          Autonomous Desktop Robot • Solana Blockchain Native
        </p>
        {/* Connection Status */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <div 
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}
          />
          <span className="text-xs text-gray-500 font-mono">
            {isConnected ? 'OpenVoice Connected' : 'OpenVoice Offline'}
          </span>
        </div>
      </div>

      {/* Robot Container */}
      <div className="relative z-10 mb-8">
        {/* Ambient Glow */}
        <div 
          className="absolute inset-0 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${currentVariant.accentColor}40, transparent 70%)`,
            transform: 'scale(1.5)',
            opacity: glowIntensity
          }}
        />

        {/* Robot Assembly */}
        <div 
          className="relative"
          style={{
            transform: `perspective(1000px) rotateY(${headTilt * 0.5}deg)`,
            transition: 'transform 0.5s ease-out'
          }}
        >
          {/* Phone/Face - Solana SKR Phone */}
          <div 
            className="relative mx-auto rounded-2xl border-4 overflow-hidden"
            style={{
              width: 220,
              height: 120,
              backgroundColor: '#0a0a0f',
              borderColor: currentVariant.accentColor,
              transform: `rotateZ(${headTilt}deg) translateY(${currentEmotion.eyeY}px)`,
              transition: 'transform 0.3s ease-out',
              boxShadow: `
                0 0 20px ${currentVariant.accentColor}60,
                inset 0 0 30px ${currentVariant.accentColor}20,
                0 10px 40px rgba(0,0,0,0.5)
              `
            }}
          >
            {/* Screen Content */}
            <div className="absolute inset-0 flex items-center justify-center gap-6">
              {/* Left Eye - Solana Logo */}
              <div 
                className="relative"
                style={{
                  transform: `scale(${currentEmotion.eyeScale * (blinking ? 0.1 : 1)})`,
                  transition: 'transform 0.1s ease'
                }}
              >
                <SolanaLogo size={50} color={currentVariant.trackColor} />
              </div>

              {/* Right Eye - Solana Logo */}
              <div 
                className="relative"
                style={{
                  transform: `scale(${currentEmotion.eyeScale * (blinking ? 0.1 : 1)})`,
                  transition: 'transform 0.1s ease'
                }}
              >
                <SolanaLogo size={50} color={currentVariant.trackColor} />
              </div>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Emotion Indicator */}
            {emotion === 'happy' && !isProcessing && (
              <div 
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: currentVariant.trackColor,
                  borderRadius: '0 0 20px 20px',
                  boxShadow: `0 0 10px ${currentVariant.trackColor}`
                }}
              />
            )}

            {/* Side Port Indicators */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1">
              <div className={`w-1 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-purple-500'}`} />
              <div className={`w-1 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-600'}`} />
            </div>

            {/* Solana Branding */}
            <div 
              className="absolute top-2 left-2 font-mono text-xs font-bold"
              style={{ color: currentVariant.accentColor }}
            >
              SKR
            </div>

            {/* Status Dot */}
            <div 
              className="absolute top-2 right-8 w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: currentVariant.trackColor }}
            />
          </div>

          {/* Neck/Mount */}
          <div 
            className="mx-auto relative"
            style={{
              width: 40,
              height: 25,
              background: `linear-gradient(to bottom, ${currentVariant.bodyColor}, #1a1a2e)`,
              clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0 100%)'
            }}
          >
            {/* Neck Rings */}
            <div 
              className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
              style={{ backgroundColor: currentVariant.accentColor + '60' }}
            />
            <div 
              className="absolute top-4 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full"
              style={{ backgroundColor: currentVariant.accentColor + '40' }}
            />
          </div>

          {/* Body */}
          <div 
            className="mx-auto relative rounded-2xl"
            style={{
              width: 180,
              height: 70,
              backgroundColor: currentVariant.bodyColor,
              border: `2px solid ${currentVariant.accentColor}40`,
              boxShadow: `
                0 10px 40px rgba(0,0,0,0.5),
                inset 0 -10px 30px rgba(0,0,0,0.3)
              `
            }}
          >
            {/* Top Deck with Solana Logo */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-20 h-6 rounded-t-lg"
              style={{ backgroundColor: currentVariant.accentColor + '30' }}
            >
              <div className="flex justify-center pt-1">
                <SolanaLogo size={16} color={currentVariant.accentColor} glow={false} />
              </div>
            </div>

            {/* Front Panel */}
            <div 
              className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-lg flex items-center justify-center gap-2 px-3 py-1"
              style={{
                backgroundColor: '#000',
                border: `1px solid ${currentVariant.trackColor}40`
              }}
            >
              {/* LED Strip */}
              <div 
                className="w-16 h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: '#111' }}
              >
                <div 
                  className="h-full rounded-full animate-pulse"
                  style={{
                    width: isProcessing ? '100%' : isRecording ? '80%' : '60%',
                    background: `linear-gradient(90deg, ${currentVariant.trackColor}, ${currentVariant.accentColor})`,
                    boxShadow: `0 0 10px ${currentVariant.trackColor}`
                  }}
                />
              </div>
            </div>

            {/* Side Vents */}
            {[0, 1, 2].map(i => (
              <div
                key={`vent-l-${i}`}
                className="absolute left-2 w-1 rounded-full"
                style={{
                  top: 15 + i * 12,
                  height: 8,
                  backgroundColor: currentVariant.accentColor + '60'
                }}
              />
            ))}
            {[0, 1, 2].map(i => (
              <div
                key={`vent-r-${i}`}
                className="absolute right-2 w-1 rounded-full"
                style={{
                  top: 15 + i * 12,
                  height: 8,
                  backgroundColor: currentVariant.accentColor + '60'
                }}
              />
            ))}

            {/* Model Badge */}
            <div 
              className="absolute top-3 right-4 font-mono text-xs"
              style={{ color: currentVariant.accentColor }}
            >
              01
            </div>
          </div>

          {/* Tracks/Wheels */}
          <div className="flex justify-center gap-20 -mt-2">
            {/* Left Track */}
            <div 
              className="relative rounded-lg"
              style={{
                width: 50,
                height: 30,
                backgroundColor: '#111',
                border: `2px solid ${currentVariant.trackColor}60`,
                boxShadow: `0 5px 20px rgba(0,0,0,0.5)`
              }}
            >
              {[0, 1, 2, 3].map(i => (
                <div
                  key={`tread-l-${i}`}
                  className="absolute w-full h-px"
                  style={{
                    top: 6 + i * 6,
                    backgroundColor: currentVariant.trackColor + '40'
                  }}
                />
              ))}
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                style={{
                  backgroundColor: currentVariant.trackColor,
                  boxShadow: `0 0 10px ${currentVariant.trackColor}`
                }}
              />
            </div>

            {/* Right Track */}
            <div 
              className="relative rounded-lg"
              style={{
                width: 50,
                height: 30,
                backgroundColor: '#111',
                border: `2px solid ${currentVariant.trackColor}60`,
                boxShadow: `0 5px 20px rgba(0,0,0,0.5)`
              }}
            >
              {[0, 1, 2, 3].map(i => (
                <div
                  key={`tread-r-${i}`}
                  className="absolute w-full h-px"
                  style={{
                    top: 6 + i * 6,
                    backgroundColor: currentVariant.trackColor + '40'
                  }}
                />
              ))}
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                style={{
                  backgroundColor: currentVariant.trackColor,
                  boxShadow: `0 0 10px ${currentVariant.trackColor}`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 space-y-4 w-full max-w-2xl">
        {/* Voice Selection */}
        {isConnected && voices.length > 0 && (
          <div className="flex justify-center gap-2 mb-4">
            <span className="text-gray-500 text-sm font-mono">Voice:</span>
            <select
              value={activeVoice || ''}
              onChange={(e) => {
                setActiveVoice(e.target.value);
                fetch(`${openvoiceServerUrl}/api/voices/${e.target.value}/activate`, {
                  method: 'POST'
                });
              }}
              className="px-3 py-1 rounded bg-gray-800 border border-gray-700 text-white text-sm font-mono"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} {voice.active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex justify-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!isConnected || isProcessing}
              className={`px-6 py-3 rounded-lg font-mono text-sm transition-all ${
                isConnected && !isProcessing
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              🎤 Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-6 py-3 rounded-lg font-mono text-sm bg-red-600 hover:bg-red-700 text-white animate-pulse"
            >
              ⏹ Stop Recording
            </button>
          )}
          
          <button
            onClick={() => synthesizeText('Hello! I am SOLtron, your Solana Robotics assistant.')}
            disabled={!isConnected || !activeVoice || isProcessing}
            className={`px-6 py-3 rounded-lg font-mono text-sm transition-all ${
              isConnected && activeVoice && !isProcessing
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            🔊 Test Voice
          </button>
        </div>

        {/* Variant Selector */}
        <div className="flex justify-center gap-3">
          {variants.map((v, i) => (
            <button
              key={v.name}
              onClick={() => setSelectedVariant(i)}
              className={`px-4 py-2 rounded-lg font-mono text-xs transition-all ${
                selectedVariant === i 
                  ? 'border-2' 
                  : 'border border-gray-700 opacity-60 hover:opacity-100'
              }`}
              style={{
                borderColor: selectedVariant === i ? v.accentColor : undefined,
                backgroundColor: selectedVariant === i ? v.accentColor + '20' : 'transparent',
                color: v.accentColor
              }}
            >
              {v.name}
            </button>
          ))}
        </div>

        {/* Emotion Controls */}
        <div className="flex justify-center gap-2">
          {Object.keys(emotions).map(em => (
            <button
              key={em}
              onClick={() => setEmotion(em)}
              className={`px-3 py-1 rounded font-mono text-xs transition-all ${
                emotion === em 
                  ? 'bg-purple-500/30 border-purple-500' 
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
              } border`}
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      {/* Specs Panel */}
      <div 
        className="relative z-10 mt-8 p-4 rounded-lg border max-w-md w-full"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderColor: currentVariant.accentColor + '40'
        }}
      >
        <h3 
          className="font-mono text-sm font-bold mb-3"
          style={{ color: currentVariant.accentColor }}
        >
          ◈ {currentVariant.name} SPECIFICATIONS
        </h3>
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div>
            <span className="text-gray-500">Display:</span>
            <span className="text-white ml-2">Solana SKR Phone</span>
          </div>
          <div>
            <span className="text-gray-500">Eyes:</span>
            <span style={{ color: currentVariant.trackColor }} className="ml-2">Solana Logo Array</span>
          </div>
          <div>
            <span className="text-gray-500">Voice:</span>
            <span className="text-white ml-2">{activeVoice || 'None'}</span>
          </div>
          <div>
            <span className="text-gray-500">AI Core:</span>
            <span className="text-white ml-2">OpenVoice + Gemini</span>
          </div>
          <div>
            <span className="text-gray-500">Connectivity:</span>
            <span className="text-white ml-2">x402 Protocol</span>
          </div>
          <div>
            <span className="text-gray-500">Token:</span>
            <span className="text-green-400 ml-2">$CLAWD Native</span>
          </div>
          <div>
            <span className="text-gray-500">Blockchain:</span>
            <span style={{ color: currentVariant.accentColor }} className="ml-2">Solana Mainnet</span>
          </div>
        </div>

        {/* Contract */}
        <div className="mt-4 pt-3 border-t border-gray-800">
          <span className="text-gray-500 text-xs">$CLAWD Contract:</span>
          <div 
            className="font-mono text-xs mt-1 break-all"
            style={{ color: currentVariant.trackColor }}
          >
            8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
          </div>
        </div>
      </div>

      {/* Hidden Audio Player */}
      <audio ref={audioPlayerRef} className="hidden" />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-15px) translateX(8px); }
          50% { transform: translateY(-8px) translateX(-8px); }
          75% { transform: translateY(-20px) translateX(4px); }
        }
      `}</style>
    </div>
  );
};

export default SolanaDesktopRobot;
