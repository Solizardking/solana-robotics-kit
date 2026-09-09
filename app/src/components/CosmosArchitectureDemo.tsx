import { useEffect, useState } from 'react';

const CosmosArchitectureDemo = () => {
  const [activeLayer, setActiveLayer] = useState<'perception' | 'intelligence' | 'execution'>('perception');
  const [isStreaming, setIsStreaming] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [currentSignal, setCurrentSignal] = useState<{
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    pattern: string;
    prediction: string;
  } | null>(null);
  const [chartData, setChartData] = useState<{ time: number; price: number }[]>([]);
  const [predictedData, setPredictedData] = useState<
    { time: number; price: number; isPrediction: boolean }[]
  >([]);

  useEffect(() => {
    const generatePrice = (base: number, volatility: number) => {
      return base + (Math.random() - 0.5) * volatility;
    };

    let price = 150;
    const data = [] as { time: number; price: number }[];
    for (let i = 0; i < 30; i += 1) {
      price = generatePrice(price, 5);
      data.push({ time: i, price: Math.max(100, price) });
    }
    setChartData(data);
  }, []);

  useEffect(() => {
    if (!isStreaming) {
      return undefined;
    }

    const interval = setInterval(() => {
      setFrameCount(prev => {
        const newCount = prev + 1;

        if (newCount % 9 === 0) {
          const signals = [
            { action: 'BUY' as const, confidence: 0.82, pattern: 'Bull Flag', prediction: '+2.4%' },
            { action: 'SELL' as const, confidence: 0.75, pattern: 'Double Top', prediction: '-1.8%' },
            { action: 'HOLD' as const, confidence: 0.68, pattern: 'Consolidation', prediction: '±0.5%' }
          ];
          setCurrentSignal(signals[Math.floor(Math.random() * signals.length)]);

          const lastPrice = chartData[chartData.length - 1]?.price || 150;
          const predicted = [] as { time: number; price: number; isPrediction: boolean }[];
          let p = lastPrice;
          for (let i = 0; i < 24; i += 1) {
            p += (Math.random() - 0.48) * 2;
            predicted.push({ time: 30 + i, price: p, isPrediction: true });
          }
          setPredictedData(predicted);
        }

        return newCount;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isStreaming, chartData]);

  const layers = {
    perception: {
      title: 'PERCEPTION LAYER',
      subtitle: 'NVIDIA Cosmos Autoregressive Vision',
      color: '#76b900',
      items: [
        { name: 'Chart Frame Capture', detail: '10 FPS @ 320×512' },
        { name: 'Tokenization', detail: 'DV8x16x16 Encoder' },
        { name: 'Pattern Detection', detail: 'Object Classification' },
        { name: 'Future Prediction', detail: '24 frames (2.4s)' }
      ]
    },
    intelligence: {
      title: 'INTELLIGENCE LAYER',
      subtitle: 'Nemotron Reasoning & Risk',
      color: '#9945FF',
      items: [
        { name: 'Signal Generation', detail: 'BUY/SELL/HOLD' },
        { name: 'Risk Management', detail: 'Position Sizing' },
        { name: 'Ralph Wiggum', detail: 'Agent Persona Core' },
        { name: 'Confidence Scoring', detail: '0-100% Rating' }
      ]
    },
    execution: {
      title: 'EXECUTION LAYER',
      subtitle: 'Solana Blockchain',
      color: '#14F195',
      items: [
        { name: 'Jupiter DEX', detail: 'Route Aggregation' },
        { name: 'Raydium', detail: 'CLMM Pools' },
        { name: 'Transaction', detail: '400ms Finality' },
        { name: 'Confirmation', detail: 'On-chain Settlement' }
      ]
    }
  };

  const currentLayer = layers[activeLayer];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
        color: '#e0e0e0',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #1f1f2f'
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: '32px',
          borderBottom: '1px solid #333',
          paddingBottom: '24px'
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '700',
            background: 'linear-gradient(90deg, #76b900 0%, #9945FF 50%, #14F195 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}
        >
          RALPH WIGGUM × SOLANA VISION AGENT
        </h1>
        <p style={{ color: '#888', fontSize: '14px' }}>
          NVIDIA Cosmos vision + Nemotron chat reasoning for autonomous trading
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div
          style={{
            background: 'rgba(20, 20, 30, 0.8)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #333'
          }}
        >
          <h2 style={{ fontSize: '16px', color: '#9945FF', marginBottom: '16px' }}>
            SYSTEM ARCHITECTURE
          </h2>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {Object.entries(layers).map(([key, layer]) => (
              <button
                key={key}
                onClick={() => setActiveLayer(key as keyof typeof layers)}
                style={{
                  padding: '8px 16px',
                  background: activeLayer === key ? layer.color : 'transparent',
                  color: activeLayer === key ? '#000' : layer.color,
                  border: `1px solid ${layer.color}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              borderLeft: `3px solid ${currentLayer.color}`
            }}
          >
            <h3
              style={{
                color: currentLayer.color,
                fontSize: '14px',
                marginBottom: '4px'
              }}
            >
              {currentLayer.title}
            </h3>
            <p style={{ color: '#666', fontSize: '12px', marginBottom: '16px' }}>
              {currentLayer.subtitle}
            </p>

            {currentLayer.items.map((item, i) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: i < currentLayer.items.length - 1 ? '1px solid #222' : 'none'
                }}
              >
                <span style={{ color: '#fff', fontSize: '13px' }}>{item.name}</span>
                <span style={{ color: currentLayer.color, fontSize: '12px' }}>{item.detail}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${layers.perception.color}40, ${layers.perception.color}20)`,
                    border: `1px solid ${layers.perception.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '4px'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>📊</span>
                </div>
                <span style={{ fontSize: '10px', color: layers.perception.color }}>COSMOS</span>
              </div>

              <div style={{ color: '#444', fontSize: '20px' }}>→</div>

              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${layers.intelligence.color}40, ${layers.intelligence.color}20)`,
                    border: `1px solid ${layers.intelligence.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '4px'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>🧠</span>
                </div>
                <span style={{ fontSize: '10px', color: layers.intelligence.color }}>RALPH</span>
              </div>

              <div style={{ color: '#444', fontSize: '20px' }}>→</div>

              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${layers.execution.color}40, ${layers.execution.color}20)`,
                    border: `1px solid ${layers.execution.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '4px'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>⚡</span>
                </div>
                <span style={{ fontSize: '10px', color: layers.execution.color }}>SOLANA</span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(20, 20, 30, 0.8)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #333'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}
          >
            <h2 style={{ fontSize: '16px', color: '#14F195' }}>LIVE ANALYSIS DEMO</h2>
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              style={{
                padding: '8px 20px',
                background: isStreaming ? '#ff4444' : '#14F195',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '700'
              }}
            >
              {isStreaming ? '■ STOP' : '▶ START'}
            </button>
          </div>

          <div
            style={{
              background: '#0a0a0f',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              height: '200px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 400 160">
              {[0, 40, 80, 120, 160].map(y => (
                <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#1a1a2e" strokeWidth="1" />
              ))}
              {[0, 80, 160, 240, 320, 400].map(x => (
                <line key={x} x1={x} y1="0" x2={x} y2="160" stroke="#1a1a2e" strokeWidth="1" />
              ))}

              <path
                d={chartData
                  .map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.time * 10} ${160 - (d.price - 100)}`)
                  .join(' ')}
                fill="none"
                stroke="#9945FF"
                strokeWidth="2"
              />

              {isStreaming && predictedData.length > 0 && (
                <path
                  d={predictedData
                    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.time * 10} ${160 - (d.price - 100)}`)
                    .join(' ')}
                  fill="none"
                  stroke="#14F195"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.7"
                />
              )}

              <text x="10" y="20" fill="#666" fontSize="10">
                SOL/USDC
              </text>
              {isStreaming && (
                <text x="310" y="20" fill="#14F195" fontSize="10">
                  PREDICTED →
                </text>
              )}
            </svg>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '16px'
            }}
          >
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '11px', color: '#666' }}>FRAMES</div>
              <div style={{ fontSize: '24px', color: '#76b900', fontWeight: '700' }}>{frameCount}</div>
            </div>
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '11px', color: '#666' }}>TOKENS/S</div>
              <div style={{ fontSize: '24px', color: '#9945FF', fontWeight: '700' }}>806</div>
            </div>
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '11px', color: '#666' }}>LATENCY</div>
              <div style={{ fontSize: '24px', color: '#14F195', fontWeight: '700' }}>2.4s</div>
            </div>
          </div>

          {currentSignal && isStreaming && (
            <div
              style={{
                background:
                  currentSignal.action === 'BUY'
                    ? 'rgba(20, 241, 149, 0.1)'
                    : currentSignal.action === 'SELL'
                      ? 'rgba(255, 68, 68, 0.1)'
                      : 'rgba(153, 69, 255, 0.1)',
                border: `1px solid ${
                  currentSignal.action === 'BUY'
                    ? '#14F195'
                    : currentSignal.action === 'SELL'
                      ? '#ff4444'
                      : '#9945FF'
                }`,
                borderRadius: '8px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color:
                      currentSignal.action === 'BUY'
                        ? '#14F195'
                        : currentSignal.action === 'SELL'
                          ? '#ff4444'
                          : '#9945FF'
                  }}
                >
                  {currentSignal.action}
                </span>
                <span
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px'
                  }}
                >
                  {(currentSignal.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                <span>Pattern: {currentSignal.pattern}</span>
                <span>Prediction: {currentSignal.prediction}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: '24px',
          background: 'rgba(20, 20, 30, 0.8)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #333'
        }}
      >
        <h2 style={{ fontSize: '16px', color: '#76b900', marginBottom: '16px' }}>
          COSMOS MODEL SPECIFICATIONS
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Model', value: 'Autoregressive-4B', color: '#76b900' },
            { label: 'Training Data', value: '9,000T Tokens', color: '#9945FF' },
            { label: 'Video Hours', value: '20M Hours', color: '#14F195' },
            { label: 'License', value: 'NVIDIA Open', color: '#FFD700' }
          ].map(spec => (
            <div
              key={spec.label}
              style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>{spec.label}</div>
              <div style={{ fontSize: '16px', color: spec.color, fontWeight: '600' }}>{spec.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
          <p style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
            <span style={{ color: '#76b900' }}>NVIDIA Cosmos</span> world foundation models are pre-trained on 20
            million hours of physical world data. The autoregressive architecture enables real-time next-token
            prediction for chart analysis, while <span style={{ color: '#9945FF' }}>Nemotron</span> handles the
            conversational agent brain and risk narration. The <span style={{ color: '#14F195' }}>Solana
            blockchain</span> provides sub-second transaction finality for instant trade execution.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CosmosArchitectureDemo;
