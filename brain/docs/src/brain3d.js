/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * Meta Mesh Brain 3D: a React Three Fiber neural mesh that chats through the
 * backend OpenRouter route and speaks its answers with the Web Speech API.
 * The browser never sees provider keys; it only calls /api/openrouter/chat.
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import htm from "htm";

const html = htm.bind(React.createElement);

const MESH_GREEN = new THREE.Color("#14f195");
const MESH_PURPLE = new THREE.Color("#9945ff");

// Shared mutable voice state so the 3D scene can react to speech without
// re-rendering React on every animation frame.
const voiceState = {
  speaking: false,
  listening: false,
  thinking: false,
  level: 0,
};

function apiBase() {
  const fromQuery = new URLSearchParams(window.location.search).get("api");
  if (fromQuery) return fromQuery.replace(/\/+$/, "");
  const stored = window.localStorage.getItem("meta-mesh-api-base");
  if (stored) return stored.replace(/\/+$/, "");
  return "";
}

/* ------------------------------------------------------------------ */
/* Geometry: a wrinkled two-hemisphere cortical point cloud            */
/* ------------------------------------------------------------------ */

function buildBrainGeometry(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    // Random direction on the unit sphere.
    const u = Math.random() * 2 - 1;
    const phi = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    let x = s * Math.cos(phi);
    let y = u;
    let z = s * Math.sin(phi);

    // Bias points toward the outer shell so the cortex reads as a surface.
    const shell = 0.62 + 0.38 * Math.cbrt(Math.random());

    // Cortical wrinkles: radial ripple over the ellipsoid.
    const theta = Math.atan2(z, x);
    const lat = Math.asin(y);
    const wrinkle =
      1 +
      0.085 * Math.sin(6 * theta + 2 * lat) * Math.sin(4 * lat + 1.7) +
      0.05 * Math.sin(11 * theta) * Math.cos(7 * lat);

    // Brain-ish ellipsoid: longer front-back (z), flatter top (y).
    x *= 0.95 * wrinkle * shell;
    y *= 0.78 * wrinkle * shell;
    z *= 1.18 * wrinkle * shell;

    // Split into hemispheres with a longitudinal fissure along x = 0.
    const side = x >= 0 ? 1 : -1;
    x = side * (Math.abs(x) * 0.92 + 0.075);

    // Slight cerebellum bulge at the lower back.
    if (z < -0.55 && y < -0.1) {
      y *= 1.12;
      z *= 1.06;
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Solana palette: green cortex with purple deep tissue.
    const depth = shell; // ~0.62 core .. 1 surface
    color.copy(MESH_PURPLE).lerp(MESH_GREEN, 0.35 + 0.65 * (depth - 0.62) / 0.38);
    color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.12);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

/* ------------------------------------------------------------------ */
/* Scene components                                                    */
/* ------------------------------------------------------------------ */

function NeuralBrain() {
  const pointsRef = useRef();
  const geometry = useMemo(() => buildBrainGeometry(6500), []);
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.024,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speak = voiceState.level;
    const idlePulse = 0.5 + 0.5 * Math.sin(t * 1.7);
    material.size = 0.022 + idlePulse * 0.007 + speak * 0.03;
    material.opacity = 0.8 + idlePulse * 0.1 + speak * 0.1;
    if (pointsRef.current) {
      const breathe = 1 + 0.015 * Math.sin(t * 1.1) + speak * 0.06;
      pointsRef.current.scale.setScalar(breathe);
    }
  });

  return html`<points ref=${pointsRef} geometry=${geometry} material=${material} />`;
}

function Synapses() {
  const SEGMENTS = 90;
  const lastShuffle = useRef(0);
  const source = useMemo(() => buildBrainGeometry(700).getAttribute("position"), []);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(SEGMENTS * 2 * 3), 3)
    );
    return geo;
  }, []);
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: MESH_GREEN,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speak = voiceState.level;
    // Refire synapses faster while the brain is talking or thinking.
    const interval = voiceState.speaking || voiceState.thinking ? 0.35 : 1.4;
    if (t - lastShuffle.current > interval) {
      lastShuffle.current = t;
      const target = geometry.getAttribute("position");
      for (let seg = 0; seg < SEGMENTS; seg += 1) {
        const a = Math.floor(Math.random() * source.count);
        const b = Math.floor(Math.random() * source.count);
        target.setXYZ(seg * 2, source.getX(a), source.getY(a), source.getZ(a));
        target.setXYZ(seg * 2 + 1, source.getX(b), source.getY(b), source.getZ(b));
      }
      target.needsUpdate = true;
    }
    material.opacity = 0.14 + 0.1 * Math.abs(Math.sin(t * 6)) + speak * 0.45;
    material.color.copy(MESH_GREEN).lerp(MESH_PURPLE, speak * 0.6);
  });

  return html`<lineSegments geometry=${geometry} material=${material} />`;
}

function SignalRings() {
  const groupRef = useRef();
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const speak = voiceState.level;
    groupRef.current.rotation.z += delta * (0.15 + speak * 0.9);
    groupRef.current.rotation.x += delta * 0.05;
    groupRef.current.scale.setScalar(1 + speak * 0.08);
  });
  return html`
    <group ref=${groupRef}>
      <mesh rotation-x=${Math.PI / 2}>
        <torusGeometry args=${[1.85, 0.008, 8, 160]} />
        <meshBasicMaterial color="#14f195" transparent opacity=${0.35} />
      </mesh>
      <mesh rotation-x=${Math.PI / 2.6} rotation-y=${0.6}>
        <torusGeometry args=${[2.15, 0.005, 8, 160]} />
        <meshBasicMaterial color="#9945ff" transparent opacity=${0.28} />
      </mesh>
    </group>
  `;
}

function Starfield() {
  const geometry = useMemo(() => {
    const COUNT = 1400;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i += 1) {
      const r = 14 + Math.random() * 26;
      const u = Math.random() * 2 - 1;
      const phi = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      positions[i * 3] = r * s * Math.cos(phi);
      positions[i * 3 + 1] = r * u;
      positions[i * 3 + 2] = r * s * Math.sin(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);
  return html`
    <points geometry=${geometry}>
      <pointsMaterial
        color="#7da895"
        size=${0.06}
        transparent
        opacity=${0.55}
        sizeAttenuation
        depthWrite=${false}
      />
    </points>
  `;
}

function BrainRig({ children }) {
  const groupRef = useRef();
  const drag = useRef({ active: false, x: 0, y: 0, rx: 0.15, ry: 0.6 });
  const { gl, camera } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    const down = (event) => {
      drag.current.active = true;
      drag.current.x = event.clientX;
      drag.current.y = event.clientY;
    };
    const move = (event) => {
      if (!drag.current.active) return;
      drag.current.ry += (event.clientX - drag.current.x) * 0.005;
      drag.current.rx += (event.clientY - drag.current.y) * 0.005;
      drag.current.rx = Math.max(-1.2, Math.min(1.2, drag.current.rx));
      drag.current.x = event.clientX;
      drag.current.y = event.clientY;
    };
    const up = () => {
      drag.current.active = false;
    };
    const wheel = (event) => {
      event.preventDefault();
      camera.position.z = Math.max(
        2.6,
        Math.min(9, camera.position.z + event.deltaY * 0.0035)
      );
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl, camera]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (!drag.current.active) drag.current.ry += delta * 0.12;
    groupRef.current.rotation.y +=
      (drag.current.ry - groupRef.current.rotation.y) * 0.08;
    groupRef.current.rotation.x +=
      (drag.current.rx - groupRef.current.rotation.x) * 0.08;

    // Smooth the speech level toward its target every frame.
    const target = voiceState.speaking
      ? 0.55 + 0.45 * Math.abs(Math.sin(state.clock.elapsedTime * 7.3))
      : voiceState.thinking
        ? 0.25 + 0.15 * Math.abs(Math.sin(state.clock.elapsedTime * 3))
        : 0;
    voiceState.level += (target - voiceState.level) * Math.min(1, delta * 6);
  });

  return html`<group ref=${groupRef}>${children}</group>`;
}

function BrainScene() {
  return html`
    <${Canvas}
      className="scene-layer"
      camera=${{ position: [0, 0.4, 4.2], fov: 50 }}
      gl=${{ antialias: true, alpha: true }}
      dpr=${[1, 2]}
    >
      <color attach="background" args=${["#050807"]} />
      <fog attach="fog" args=${["#050807", 6, 30]} />
      <ambientLight intensity=${0.6} />
      <${BrainRig}>
        <${NeuralBrain} />
        <${Synapses} />
        <${SignalRings} />
      <//>
      <${Starfield} />
    <//>
  `;
}

/* ------------------------------------------------------------------ */
/* Voice: speech synthesis output + speech recognition input           */
/* ------------------------------------------------------------------ */

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const preferred = ["Samantha", "Google US English", "Karen", "Daniel"];
  for (const name of preferred) {
    const match = voices.find((voice) => voice.name.includes(name));
    if (match) return match;
  }
  return voices.find((voice) => voice.lang?.startsWith("en")) ?? voices[0] ?? null;
}

function speak(text, { onStart, onEnd } = {}) {
  if (!("speechSynthesis" in window) || !text) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 1.02;
  utterance.pitch = 0.92;
  utterance.onstart = () => {
    voiceState.speaking = true;
    onStart?.();
  };
  const finish = () => {
    voiceState.speaking = false;
    onEnd?.();
  };
  utterance.onend = finish;
  utterance.onerror = finish;
  window.speechSynthesis.speak(utterance);
}

function makeRecognizer({ onTranscript, onStateChange, onError }) {
  const Recognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;
  if (!Recognition) return null;
  const recognizer = new Recognition();
  let lastFinalTranscript = "";
  recognizer.lang = "en-US";
  recognizer.continuous = false;
  recognizer.interimResults = true;
  recognizer.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0]?.transcript ?? "")
      .join(" ")
      .trim();
    const isFinal = event.results[event.results.length - 1]?.isFinal ?? false;
    if (isFinal && transcript === lastFinalTranscript) return;
    if (isFinal) lastFinalTranscript = transcript;
    onTranscript(transcript, isFinal);
  };
  recognizer.onstart = () => {
    lastFinalTranscript = "";
    voiceState.listening = true;
    onStateChange(true);
  };
  const stop = () => {
    voiceState.listening = false;
    onStateChange(false);
  };
  recognizer.onend = stop;
  recognizer.onerror = (event) => {
    onError?.(event.error || "voice error");
    stop();
  };
  return recognizer;
}

/* ------------------------------------------------------------------ */
/* Chat HUD                                                            */
/* ------------------------------------------------------------------ */

const GREETING =
  "I am the Meta Mesh brain. Ask me about Solana chain health, decoded " +
  "Brain2Qwerty intent, or market context. Everything I propose stays " +
  "approval-gated: no keys, no signing, no submitted trades.";

function ChatHUD() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const [speakingUi, setSpeakingUi] = useState(false);
  const [health, setHealth] = useState(null);
  const logRef = useRef();
  const recognizerRef = useRef(null);
  const voiceOnRef = useRef(voiceOn);
  const messagesRef = useRef(messages);
  const busyRef = useRef(busy);
  voiceOnRef.current = voiceOn;
  messagesRef.current = messages;
  busyRef.current = busy;

  const appendMessage = (message) => {
    const nextMessages = [...messagesRef.current, message];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    return nextMessages;
  };

  const stopSpeech = () => {
    window.speechSynthesis?.cancel();
    voiceState.speaking = false;
    setSpeakingUi(false);
  };

  useEffect(() => {
    fetch(`${apiBase()}/api/health`)
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false }));
    // Preload voices; some browsers populate the list asynchronously.
    window.speechSynthesis?.getVoices();
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async (rawText) => {
    const text = (rawText ?? input).trim();
    if (!text || busyRef.current) return;
    setInput("");
    stopSpeech();

    const nextMessages = appendMessage({ role: "user", content: text });
    busyRef.current = true;
    setBusy(true);
    voiceState.thinking = true;
    try {
      const response = await fetch(`${apiBase()}/api/openrouter/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.role !== "error")
            .slice(-12)
            .map(({ role, content }) => ({ role, content })),
          max_tokens: 384,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.detail || `Backend error ${response.status}`);
      }
      const reply =
        payload.text?.trim() || "The mesh returned no text for that one.";
      appendMessage({ role: "assistant", content: reply });
      if (voiceOnRef.current) {
        speak(reply, {
          onStart: () => setSpeakingUi(true),
          onEnd: () => setSpeakingUi(false),
        });
      }
    } catch (error) {
      appendMessage({
        role: "error",
        content:
          `Could not reach the brain: ${error.message}. ` +
          "Start the backend (uvicorn solana_robot_harness.api:app) and set " +
          "OPENROUTER_API_KEY in .env.",
      });
    } finally {
      voiceState.thinking = false;
      busyRef.current = false;
      setBusy(false);
    }
  };

  const toggleMic = () => {
    if (listening) {
      recognizerRef.current?.stop();
      return;
    }
    if (!recognizerRef.current) {
      recognizerRef.current = makeRecognizer({
        onTranscript: (transcript, isFinal) => {
          setInput(transcript);
          if (isFinal && transcript) send(transcript);
        },
        onStateChange: setListening,
        onError: (message) => {
          appendMessage({
            role: "error",
            content: `Speech recognition failed: ${message}.`,
          });
        },
      });
    }
    if (!recognizerRef.current) {
      appendMessage({
        role: "error",
        content: "Speech recognition is not available in this browser.",
      });
      return;
    }
    stopSpeech();
    try {
      recognizerRef.current.start();
    } catch (error) {
      appendMessage({
        role: "error",
        content:
          `Speech recognition could not start: ${error.message || "already active"}.`,
      });
    }
  };

  const openrouterReady = Boolean(health?.credentials?.openrouter);
  const statusLabel = health
    ? openrouterReady
      ? "openrouter live"
      : health.ok
        ? "backend up - set OPENROUTER_API_KEY"
        : "backend offline"
    : "checking backend...";

  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  return html`
    <div className="hud">
      <div className="hud-top">
        <div className="hud-brand">
          <strong>Meta Mesh Brain 3D</strong>
          <span>React Three Fiber cortex - OpenRouter voice</span>
        </div>
        <div className="hud-links">
          <span className="status-pill">
            <span
              className=${`status-dot ${health ? (openrouterReady ? "ok" : "bad") : ""}`}
            ></span>
            ${statusLabel}
          </span>
          <a href="./index.html">Mesh home</a>
        </div>
      </div>

      ${speakingUi && lastAssistant
        ? html`<div className="caption">${lastAssistant.content}</div>`
        : null}

      <div className="chat-dock">
        <div className="chat-head">
          <span>Talk to the brain</span>
          <div className="chat-head-controls">
            <button
              className=${`chip ${voiceOn ? "on" : ""}`}
              onClick=${() => {
                if (voiceOn) {
                  stopSpeech();
                }
                setVoiceOn(!voiceOn);
              }}
            >
              ${voiceOn ? "voice on" : "voice off"}
            </button>
          </div>
        </div>
        <div className="chat-log" ref=${logRef}>
          ${messages.map(
            (message, index) => html`
              <div key=${index} className=${`msg ${message.role}`}>
                <span className="who">
                  ${message.role === "user"
                    ? "operator"
                    : message.role === "error"
                      ? "mesh error"
                      : "mesh brain"}
                </span>
                ${message.content}
              </div>
            `
          )}
          ${busy
            ? html`<div className="msg assistant pending">synapses firing...</div>`
            : null}
        </div>
        <div className="chat-input-row">
          <button
            className=${`btn btn-mic ${listening ? "listening" : ""}`}
            onClick=${toggleMic}
            title="Speak to the brain"
          >
            ${listening ? "listening" : "mic"}
          </button>
          <input
            value=${input}
            placeholder="Ask the mesh brain..."
            onChange=${(event) => setInput(event.target.value)}
            onKeyDown=${(event) => {
              if (event.key === "Enter") send();
            }}
          />
          <button className="btn btn-send" disabled=${busy} onClick=${() => send()}>
            send
          </button>
        </div>
      </div>
    </div>
  `;
}

function App() {
  return html`
    <div className="scene-layer">
      <${BrainScene} />
      <${ChatHUD} />
    </div>
  `;
}

const rootElement = document.getElementById("brain-root");
rootElement.innerHTML = "";
createRoot(rootElement).render(html`<${App} />`);
