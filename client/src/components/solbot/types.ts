// SOLbot Types

export interface RobotVariant {
  name: string;
  bodyColor: string;
  accentColor: string;
  trackColor: string;
}

export type Emotion = 'happy' | 'curious' | 'sleepy' | 'excited' | 'thinking' | 'talking';

export interface EmotionProfile {
  eyeScale: number;
  eyeY: number;
  mouthCurve: number;
  glowSpeed: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SolanaLogoProps {
  size?: number;
  color?: string;
  glow?: boolean;
  glowIntensity?: number;
  blinking?: boolean;
}
