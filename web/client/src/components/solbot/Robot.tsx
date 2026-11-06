import React, { useState, useEffect } from 'react';
import { RobotVariant, Emotion } from './types';
import { SolanaLogo, EMOTIONS } from './constants';

interface RobotProps {
  variant: RobotVariant;
  emotion: Emotion;
  isThinking?: boolean;
}

const Robot: React.FC<RobotProps> = ({ variant, emotion, isThinking }) => {
  const [blinking, setBlinking] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);
  const [glowPulse, setGlowPulse] = useState(0);
  
  const currentEmotionProfile = EMOTIONS[emotion];

  // Blink logic
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Natural head movement
  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (!isThinking) {
        setHeadTilt((Math.random() - 0.5) * 8);
      } else {
        setHeadTilt(prev => prev + (Math.sin(Date.now() / 200) * 2));
      }
    }, 2000);
    return () => clearInterval(moveInterval);
  }, [isThinking]);

  // Ambient glow pulse
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setGlowPulse(prev => (prev + currentEmotionProfile.glowSpeed) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(pulseInterval);
  }, [currentEmotionProfile.glowSpeed]);

  const glowIntensity = 0.6 + Math.sin(glowPulse) * 0.3;

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Ambient Glow */}
      <div 
        className="absolute inset-0 rounded-full blur-[100px] transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle, ${variant.accentColor}40, transparent 70%)`,
          transform: 'scale(1.5)',
          opacity: glowIntensity * 0.8
        }}
      />

      <div 
        className="relative transition-transform duration-500 ease-out"
        style={{
          transform: `perspective(1000px) rotateY(${headTilt * 0.4}deg)`,
        }}
      >
        {/* Face/Screen */}
        <div 
          className="relative mx-auto rounded-3xl border-[3px] overflow-hidden transition-all duration-300"
          style={{
            width: 240,
            height: 140,
            backgroundColor: '#0a0a0f',
            borderColor: variant.accentColor,
            transform: `rotateZ(${headTilt}deg) translateY(${currentEmotionProfile.eyeY}px)`,
            boxShadow: `
              0 0 30px ${variant.accentColor}40,
              inset 0 0 40px ${variant.accentColor}20
            `
          }}
        >
          {/* Eyes Container */}
          <div className="absolute inset-0 flex items-center justify-center gap-10">
            <div 
              className="relative transition-transform duration-200"
              style={{ transform: `scale(${currentEmotionProfile.eyeScale})` }}
            >
              <SolanaLogo 
                size={55} 
                color={variant.trackColor} 
                glowIntensity={glowIntensity} 
                blinking={blinking} 
              />
            </div>
            <div 
              className="relative transition-transform duration-200"
              style={{ transform: `scale(${currentEmotionProfile.eyeScale})` }}
            >
              <SolanaLogo 
                size={55} 
                color={variant.trackColor} 
                glowIntensity={glowIntensity} 
                blinking={blinking} 
              />
            </div>
          </div>

          {/* Mouth / Status Bar */}
          <div 
            className="absolute bottom-5 left-1/2 transform -translate-x-1/2 transition-all duration-300"
            style={{
              width: 50 + currentEmotionProfile.mouthCurve,
              height: 4,
              backgroundColor: variant.trackColor,
              borderRadius: '20px',
              opacity: emotion === 'sleepy' ? 0.3 : 1,
              boxShadow: `0 0 15px ${variant.trackColor}`
            }}
          />

          {/* HUD Details */}
          <div className="absolute top-3 left-4 flex gap-1 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono opacity-50 text-white">SYSTEM_OK</span>
          </div>
          <div className="absolute top-3 right-4 text-[10px] font-mono text-purple-400 opacity-60">
            {isThinking ? 'SYNCING...' : 'IDLE'}
          </div>
        </div>

        {/* Neck */}
        <div 
          className="mx-auto relative -mt-1"
          style={{
            width: 45,
            height: 30,
            background: `linear-gradient(to bottom, ${variant.bodyColor}, #050505)`,
            clipPath: 'polygon(15% 0, 85% 0, 100% 100%, 0 100%)'
          }}
        >
          <div className="absolute top-2 w-full h-1 opacity-30" style={{ background: variant.accentColor }} />
        </div>

        {/* Main Body */}
        <div 
          className="mx-auto relative rounded-2xl border-t-2"
          style={{
            width: 200,
            height: 85,
            backgroundColor: variant.bodyColor,
            borderColor: `${variant.accentColor}40`,
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
          }}
        >
          {/* Internal Electronics Glow */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
             <div className="absolute w-full h-full opacity-10" style={{
               background: `linear-gradient(45deg, ${variant.accentColor}, transparent)`
             }} />
          </div>

          {/* Branding */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-20">
             <SolanaLogo size={20} color={variant.accentColor} glow={false} />
          </div>

          {/* LED Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-2 bg-black rounded-full p-[1px] border border-white/5">
             <div 
               className="h-full rounded-full transition-all duration-500" 
               style={{ 
                 width: isThinking ? '100%' : '40%',
                 background: `linear-gradient(90deg, ${variant.trackColor}, ${variant.accentColor})`,
                 boxShadow: `0 0 10px ${variant.trackColor}`
               }}
             />
          </div>
        </div>

        {/* Tracks */}
        <div className="flex justify-between px-2 -mt-4 w-[240px]">
          <div className="w-14 h-32 bg-[#080808] border-2 rounded-xl" style={{ borderColor: `${variant.trackColor}40` }}>
             <div className="flex flex-col gap-2 p-2 opacity-20">
               {[...Array(6)].map((_, i) => <div key={i} className="h-2 w-full rounded-sm bg-white" />)}
             </div>
          </div>
          <div className="w-14 h-32 bg-[#080808] border-2 rounded-xl" style={{ borderColor: `${variant.trackColor}40` }}>
             <div className="flex flex-col gap-2 p-2 opacity-20">
               {[...Array(6)].map((_, i) => <div key={i} className="h-2 w-full rounded-sm bg-white" />)}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Robot;
