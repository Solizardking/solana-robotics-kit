import { useEffect, useState } from "react";
import "./ClawdDesktopRobot.css";
type Emotion = "happy" | "curious" | "sleepy" | "excited";
export default function ClawdDesktopRobot({ busy = false, speaking = false }: { busy?: boolean; speaking?: boolean }) {
  const [selectedVariant, setSelectedVariant] = useState(() => { const v = Number(new URLSearchParams(window.location.search).get("finish")); return Number.isInteger(v) && v >= 0 && v <= 2 ? v : 0; });
  const [chosenEmotion, setEmotion] = useState<Emotion>(() => { const e = new URLSearchParams(window.location.search).get("mood"); return ["happy", "curious", "sleepy", "excited"].includes(e || "") ? e as Emotion : "happy"; });
  const emotion = busy ? "curious" : speaking ? "excited" : chosenEmotion;
  const [blinking, setBlinking] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("finish", String(selectedVariant)); url.searchParams.set("mood", chosenEmotion);
    window.history.replaceState(window.history.state, "", url);
  }, [selectedVariant, chosenEmotion]);
  const glowPulse = 12;
  const isProcessing = busy;
  const isRecording = false;
  const isConnected = speaking;
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (paused || reduced.matches) { setHeadTilt(0); setBlinking(false); return; }
    let blinkTimer: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      setBlinking(true);
      setHeadTilt((Math.random() - 0.5) * 8);
      blinkTimer = setTimeout(() => setBlinking(false), 140);
    }, 3800);
    return () => { clearInterval(timer); clearTimeout(blinkTimer); };
  }, [paused]);
  const variants = [
    { name: 'SOLtron Mini', bodyColor: '#1a1a2e', accentColor: '#9945FF', trackColor: '#14F195' },
    { name: 'SOLtron Pro', bodyColor: '#0f0f1a', accentColor: '#14F195', trackColor: '#9945FF' },
    { name: 'SOLtron Elite', bodyColor: '#2a1a3e', accentColor: '#FFD700', trackColor: '#9945FF' },
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
    <section aria-label="Animated CLAWD desktop robot" className="clawd-robot-stage relative flex min-h-[470px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 px-3 py-10">
      <div className="pointer-events-none absolute inset-0 clawd-robot-grid" />
      <p className="relative z-10 mb-12 text-[10px] uppercase tracking-[.25em] text-slate-400">Desktop companion · visual preview</p>
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
          {/* Phone/Face - Solana CLAWD Phone */}
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
              CLAWD
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


      <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-2" aria-label="Robot finish">
        {variants.map((v, i) => <button type="button" key={v.name} aria-pressed={selectedVariant === i} onClick={() => setSelectedVariant(i)} className="rounded-full border px-4 py-2 text-xs transition-colors" style={{ borderColor: selectedVariant === i ? v.accentColor : "#30313d", color: selectedVariant === i ? v.accentColor : "#b5b6c5" }}>{v.name}</button>)}
      </div>
      <div className="relative z-10 mt-3 flex flex-wrap justify-center gap-2" aria-label="Robot expression">
        {(Object.keys(emotions) as Emotion[]).map(e => <button type="button" key={e} aria-pressed={chosenEmotion === e} onClick={() => setEmotion(e)} className={`rounded-md px-3 py-2 text-xs capitalize ${chosenEmotion === e ? "bg-white/10 text-white" : "text-slate-400"}`}>{e}</button>)}
      </div>
      <button type="button" className="relative z-10 mt-4 text-xs text-slate-400 underline" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Resume idle animation" : "Pause idle animation"}</button>
    </section>
  );
}
