import React from 'react';
import { RobotVariant, Emotion, EmotionProfile, SolanaLogoProps } from './types';

export const VARIANTS: RobotVariant[] = [
  { name: 'SOL-CLAWD Mini', bodyColor: '#1a1a2e', accentColor: '#9945FF', trackColor: '#14F195' },
  { name: 'SOL-CLAWD Pro', bodyColor: '#0f0f1a', accentColor: '#14F195', trackColor: '#9945FF' },
  { name: 'SOL-CLAWD Elite', bodyColor: '#2a1a3e', accentColor: '#FFD700', trackColor: '#9945FF' },
  { name: 'CLAWD', bodyColor: '#1a2e1a', accentColor: '#00FF00', trackColor: '#FF6B00' },
  { name: 'CLAWD Quantum', bodyColor: '#1a1a3e', accentColor: '#00FFFF', trackColor: '#FF00FF' },
];

export const EMOTIONS: Record<Emotion, EmotionProfile> = {
  happy: { eyeScale: 1, eyeY: 0, mouthCurve: 10, glowSpeed: 0.1 },
  curious: { eyeScale: 1.1, eyeY: -5, mouthCurve: 0, glowSpeed: 0.15 },
  sleepy: { eyeScale: 0.6, eyeY: 5, mouthCurve: 5, glowSpeed: 0.05 },
  excited: { eyeScale: 1.2, eyeY: -3, mouthCurve: 15, glowSpeed: 0.25 },
  thinking: { eyeScale: 0.9, eyeY: 0, mouthCurve: 2, glowSpeed: 0.3 },
  talking: { eyeScale: 1.05, eyeY: -2, mouthCurve: 8, glowSpeed: 0.2 },
};

export const SolanaLogo: React.FC<SolanaLogoProps> = ({ 
  size = 40, 
  color = '#14F195', 
  glow = true, 
  glowIntensity = 1, 
  blinking = false 
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{
    filter: glow ? `drop-shadow(0 0 ${10 * glowIntensity}px ${color})` : 'none',
    transition: 'all 0.3s ease'
  }}>
    <g transform={`scale(${blinking ? '1 0.1' : '1 1'})`} style={{ 
      transformOrigin: 'center',
      transition: 'transform 0.1s ease'
    }}>
      <path d="M15 25 L85 25 L75 40 L5 40 Z" fill={color} opacity={0.9} />
      <path d="M5 45 L75 45 L85 60 L15 60 Z" fill={color} opacity={0.95} />
      <path d="M15 65 L85 65 L75 80 L5 80 Z" fill={color} />
    </g>
  </svg>
);
