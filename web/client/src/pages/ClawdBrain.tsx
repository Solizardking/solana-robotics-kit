import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, ArrowUp, AudioLines, Copy, Cpu, ExternalLink, Share2, Sparkles, Square, Volume2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ClawdDesktopRobot from "@/components/ClawdDesktopRobot";
import "./SoltronCompanion.css";
import { isLoginConfigured } from "@/const";

const mint = "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump";
const starters = ["Introduce yourself as SOLtron in one sentence.", "Help me plan my first robot simulation.", "Explain how $CLAWD fits Solana Robotics."];
export default function ClawdBrain() {
  const [provider, setProvider] = useState<"neon" | "nvidia" | "xai">("neon");
  const [model, setModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const status = trpc.clawdBrain.status.useQuery();
  const auth = trpc.auth.me.useQuery(undefined, { retry: false });
  const models = trpc.clawdBrain.models.useQuery(undefined, { enabled: provider === "neon" && Boolean(status.data?.providers.neon) && Boolean(auth.data), retry: false });
  const chat = trpc.clawdBrain.chat.useMutation();
  useEffect(() => {
    setVoiceSupported("speechSynthesis" in window);
    const title = document.title;
    document.title = "Meet SOLtron — powered by $CLAWD | Solana Robotics";
    return () => { document.title = title; window.speechSynthesis?.cancel(); };
  }, []);
  function speak(text: string) {
    if (!voiceSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.03;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => { setSpeaking(false); setNotice("Browser voice could not play. Try again or use the text reply."); };
    window.speechSynthesis.speak(utterance);
  }
  async function copy(value: string, message: string) {
    try { await navigator.clipboard.writeText(value); setNotice(message); }
    catch { setNotice("Clipboard access is unavailable. Copy the page URL from your browser."); }
  }
  function shareUrl() { const url = new URL(window.location.href); url.pathname = "/soltron-companion"; return url.toString(); }
  async function share() {
    const data = { title: "Meet SOLtron", text: "A little robot. A big Solana brain. Meet SOLtron, powered by $CLAWD.", url: shareUrl() };
    if (navigator.share) {
      try { await navigator.share(data); setNotice("Share dialog opened."); }
      catch (error) { if ((error as Error).name !== "AbortError") setNotice("Sharing is unavailable. Use Copy link."); }
    } else await copy(data.url, "SOLtron link copied. Share your robot.");
  }
  const configured = Boolean(status.data?.providers[provider]);
  return <main className="soltron-companion">
    <div className="soltron-topline"><Link href="/">SOLANA ROBOTICS <ArrowUpRight size={13} /></Link><span>COMPANION LAB / 001</span></div>
    <header className="soltron-hero">
      <div><p className="soltron-eyebrow"><span /> BUILT ON SOLANA · POWERED BY $CLAWD</p>
        <h1>A little robot.<br /><span>A big personality.</span></h1>
        <p className="soltron-intro">Meet <strong>SOLtron.</strong> Your expressive AI companion for ideas, code, and the next generation of robotics. Pick a look. Start a conversation. Make it yours.</p>
        <div className="soltron-actions"><a href="#talk-to-soltron" className="soltron-primary">Meet your SOLtron <ArrowUpRight size={17}/></a><button onClick={share}><Share2 size={16}/> Share SOLtron</button></div>
      </div>
      <div className="soltron-edition"><span>01</span><p>DESKTOP SERIES<br/>SOLTRON / GENESIS</p></div>
    </header>
    <div className="soltron-workbench">
      <div className="soltron-visual">
        <div className="soltron-panel-label"><span><span className="soltron-dot"/> PERSONALITY ONLINE</span><span>INTERACTIVE PREVIEW</span></div>
        <ClawdDesktopRobot busy={chat.isPending} speaking={speaking}/>
        <div className="soltron-voice"><div><AudioLines size={21}/><span>Give it a voice<small>Browser speech · no cloned voice required</small></span></div>
          {speaking ? <button onClick={() => { window.speechSynthesis.cancel(); setSpeaking(false); }}><Square size={13}/> Stop</button> : <button disabled={!voiceSupported} onClick={() => speak("Hey, I'm SOLtron. A little robot with a big Solana brain. Powered by Clawd. What are we building today?")}><Volume2 size={16}/> Say hello</button>}
        </div>
        <div className="soltron-under-robot"><span>Animated companion, ready to customize.</span><button onClick={() => copy(shareUrl(), "Your robot link is copied, including its finish and expression.")}><Copy size={14}/> Copy link</button></div>
      </div>
      <section className="soltron-chat" id="talk-to-soltron">
        <div className="soltron-panel-label"><span><Sparkles size={14}/> THE CONVERSATION</span><span>{chat.isPending ? "THINKING" : "YOUR MOVE"}</span></div>
        <h2>What are we building?</h2><p>Bring an idea. SOLtron helps you find the next step.</p>
        <form onSubmit={e => { e.preventDefault(); chat.mutate({ provider, prompt, model: provider === "neon" && model ? model : undefined }); }}>
          <div className="soltron-provider-row"><label>AI provider<select value={provider} onChange={e => { setProvider(e.target.value as typeof provider); setModel(""); chat.reset(); }}><option value="neon">Neon AI Gateway</option><option value="nvidia">NVIDIA Nemotron</option><option value="xai">xAI Grok</option></select></label>
            <span className={configured ? "soltron-configured" : "soltron-unconfigured"}>{status.isLoading ? "Checking…" : configured ? "Key configured" : "Setup needed"}</span></div>
          {provider === "neon" && configured && auth.data && <label>Branch model<select value={model} onChange={e => setModel(e.target.value)}><option value="">Choose enabled model automatically</option>{models.data?.filter(m => m.enabled && m.architecture?.output_modalities?.includes("text")).map(m => <option key={m.id} value={m.id}>{m.id}</option>)}</select></label>}
          <div className="soltron-chat-space" aria-live="polite">
            {chat.data ? <article><span className="soltron-reply-label">SOLTRON / {chat.data.provider}</span><p>{chat.data.text}</p><small>{chat.data.model}</small>{voiceSupported && <button type="button" onClick={() => speak(chat.data!.text)}><Volume2 size={14}/> Read reply</button>}</article> : <div className="soltron-welcome"><div>✳</div><p>Your next idea starts here.</p><small>Choose a conversation starter or write your own.</small></div>}
            {(chat.error || models.error) && <p className="soltron-error" role="alert">{chat.error?.message || models.error?.message}</p>}
          </div>
          <div className="soltron-starters">{starters.map((s, i) => <button key={s} type="button" onClick={() => setPrompt(s)}>{["Say gm", "Build a robot", "Explore $CLAWD"][i]} <ArrowUpRight size={12}/></button>)}</div>
          <label className="soltron-message"><span className="sr-only">Message SOLtron</span><textarea value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={8000} required placeholder="Ask SOLtron anything about your next build…"/><button type="submit" aria-label="Send message" disabled={chat.isPending || !prompt.trim() || !configured || !auth.data}><ArrowUp size={20}/></button></label>
          <p className="soltron-chat-note">{!auth.data ? (isLoginConfigured() ? "Sign in using the site menu to send messages. " : "Site sign-in needs configuration before messages can be sent. ") : ""}{!configured ? `${provider === "neon" ? "Neon gateway" : provider} credentials are not connected yet. ` : ""}Chat is advisory. Hardware and transactions stay under your control.</p>
        </form>
      </section>
    </div>
    <section className="soltron-gallery" aria-label="SOLtron in the lab">
      <figure><img src="/images/soltron-rover.jpg" alt="SOLtron rover with its Solana backpack in the Solana Robotics lab" loading="lazy" /><figcaption>SOLTRON ROVER · LAB UNIT 001</figcaption></figure>
      <figure><img src="/images/soltron-humanoid.jpg" alt="SOLtron humanoid in purple armor with its Solana-green pixel smile" loading="lazy" /><figcaption>SOLTRON HUMANOID · GENESIS FINISH</figcaption></figure>
      <figure><img src="/images/soltron-workbench.jpg" alt="SOLtron on the workbench beside the purple CLAWD modular gripper kit — built on Solana, powered by $CLAWD" loading="lazy" /><figcaption>ON THE BENCH · WITH THE $CLAWD GRIPPER KIT</figcaption></figure>
    </section>
    {notice && <p role="status" className="soltron-notice">{notice}</p>}
    {status.error && <p role="alert" className="soltron-notice">Provider status could not be loaded.</p>}
    <section className="soltron-foundation"><div><Cpu size={22}/><h2>A personality on screen.<br/>A path to physical AI.</h2><p>The companion brings your ideas to life. NVIDIA GR00T is the separate vision-language-action foundation for robot policy development.</p></div><div className="soltron-checkpoint"><span>SELECTED CHECKPOINT</span><h3>GR00T N1.7 / 3B</h3><p>ordlibrary · Hugging Face bucket</p><a href="https://huggingface.co/buckets/ordlibrary/GR00T-N1.7-3B-bucket" target="_blank" rel="noreferrer">Explore model files <ExternalLink size={14}/></a><small>Policy runtime not connected. ASV-1 embodiment validation required before hardware use.</small></div></section>
    <footer className="soltron-footer"><div><strong>SOLtron</strong><span>Built on Solana. Powered by $CLAWD.</span></div><button onClick={() => copy(mint, "$CLAWD mint copied.")} title={mint}>$CLAWD <span>8cHz…pump</span><Copy size={13}/></button><a href="https://github.com/Solizardking/Solana-Robotics" target="_blank" rel="noreferrer">Build with us <ArrowUpRight size={15}/></a></footer>
  </main>;
}
