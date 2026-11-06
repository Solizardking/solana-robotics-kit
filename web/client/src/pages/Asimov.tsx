import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AsimovViewer, { ASIMOV_GROUP_COLOR } from '@/components/AsimovViewer';
import {
  ExternalLink, Download, Cpu, Ruler, Weight, Activity,
  Zap, ShieldCheck, Sparkles, Bot, Database, Network, Coins, Map as MapIcon
} from 'lucide-react';

type Group = keyof typeof ASIMOV_GROUP_COLOR;

const SPECS = [
  { icon: Ruler, label: 'Height', value: '1.2 m' },
  { icon: Weight, label: 'Weight', value: '35 kg' },
  { icon: Activity, label: 'Actuated DOF', value: '25 + 2 passive' },
  { icon: Zap, label: 'Kit Compute', value: 'Orin Nano (motors) + Pi + Topion' },
  { icon: Cpu, label: 'CAN Bus', value: '5 × 1Mbps + 1 × 500kbps' },
  { icon: ShieldCheck, label: 'Materials', value: '7075 Al + MJF PA12' },
];

/** Working Menlo docs — deep paths often soft-404 on docs.menlo.ai */
const MENLO_DOCS = [
  { label: 'Asimov 1 overview', href: 'https://docs.menlo.ai/asimov/1' },
  { label: 'Asimov API', href: 'https://docs.menlo.ai/asimov/1/api' },
  { label: 'Robot control', href: 'https://docs.menlo.ai/asimov/1/api/robot-control' },
  { label: 'Python SDK', href: 'https://docs.menlo.ai/platform/reference/python-sdk' },
  { label: 'Platform intro', href: 'https://docs.menlo.ai/platform/get-started/introduction' },
  { label: 'Kit integration guide', href: '/docs/ASIMOV_INTEGRATION.md' },
];

const LOADS = [
  { activity: 'Squat', load: '5 kg' },
  { activity: 'Bicep curl', load: '15 kg / arm' },
  { activity: 'Lateral raise', load: '18 kg / arm' },
];

const SUBSYSTEMS: { name: string; group: Group; description: string }[] = [
  { name: 'Pelvis & IMU', group: 'pelvis', description: 'Floating-base origin. 6-DOF IMU lives here. Joint commands chain outward from this frame.' },
  { name: 'Torso', group: 'torso', description: '1 DOF waist yaw. Houses the speaker and bridges power between legs and arms.' },
  { name: 'Head', group: 'head', description: '2 DOF neck (yaw + pitch). Quad mic array, monocular 2MP camera. Passive damping springs.' },
  { name: 'Left Leg', group: 'left-leg', description: '6 DOF (hip pitch/roll/yaw, knee, ankle pitch/roll) + toe. Friction-tuned foot capsules.' },
  { name: 'Right Leg', group: 'right-leg', description: 'Mirror of left leg. Identical actuator profile, opposite-axis joints.' },
  { name: 'Left Arm', group: 'left-arm', description: '5 DOF (shoulder pitch/roll/yaw, elbow, wrist yaw). Carries 18 kg lateral raise.' },
  { name: 'Right Arm', group: 'right-arm', description: 'Mirror of left arm. Same payload envelope.' },
];

const DEPIN_PILLARS = [
  {
    icon: Database,
    title: 'Data is the bottleneck',
    body: 'Open robotics datasets total ~5 TB versus 100 TB+ for LLM corpora. Robotics needs proprioceptive + multi-modal sensor data the open web simply does not contain.',
  },
  {
    icon: Network,
    title: 'DePIN closes the gap',
    body: 'Cryptoeconomic incentives reward distributed contributors for collecting, validating, and benchmarking real-world data. Hivemapper, NATIX, Frodobots, Reborn already prove the flywheel works.',
  },
  {
    icon: Coins,
    title: 'On-chain provenance',
    body: 'Every Asimov v1 deployed on this network is registered as a Robot Passport NFT (compressed via Bubblegum). Telemetry, training contributions, and operator history are signed and queryable.',
  },
  {
    icon: MapIcon,
    title: 'Open hardware + open weights',
    body: 'Asimov v1 is CERN-OHL-S-2.0 hardware. Pair it with open MuJoCo training and a community-owned policy and you get a full open stack — no proprietary moat between you and a working humanoid.',
  },
];

export default function Asimov() {
  const [highlight, setHighlight] = useState<Group | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero */}
        <header className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">Open Hardware</Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40">CERN-OHL-S-2.0</Badge>
            <Badge className="bg-pink-500/20 text-pink-300 border border-pink-500/40">25 DOF Humanoid</Badge>
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Solana Robotics Network</Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            Asimov v1 — On-Chain Humanoid
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            A 1.2&nbsp;m, 35&nbsp;kg open-source biped with 25 actuated joints, deployable on the Solana Robotics network. Mechanical CAD, MuJoCo simulation,
            and on-chain identity wired into one stack — your gateway to the physical-AI flywheel.
          </p>
          <div className="flex gap-3 flex-wrap pt-2">
            <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
              <a href="https://asimov.inc/diy-kit" target="_blank" rel="noreferrer">
                Pre-order DIY Kit <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="https://manual.asimov.inc" target="_blank" rel="noreferrer">
                Assembly Manual <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/asimov/asimov.xml" download>
                MuJoCo XML <Download className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="https://docs.menlo.ai/platform/reference/python-sdk" target="_blank" rel="noreferrer">
                Menlo Python SDK <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {MENLO_DOCS.map(d => (
              <a
                key={d.href}
                href={d.href}
                target={d.href.startsWith('http') ? '_blank' : undefined}
                rel={d.href.startsWith('http') ? 'noreferrer' : undefined}
                className="text-xs text-cyan-400/90 hover:text-cyan-300 underline-offset-2 hover:underline"
              >
                {d.label}
              </a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground max-w-3xl">
            Direct control uses <code className="text-cyan-300">ASIMOV_API_KEY</code> via{' '}
            <code className="text-cyan-300">packages/asimov</code>. Hardware fabric: Orin Nano
            motors (:9101), Raspberry Pi sensors (:9102), Topion expansion (:9103). Stock Asimov
            is Pi 5 + Radxa CM5 — this kit overlays Orin for motor/AI policy.
          </p>
        </header>

        {/* CLAWD ASV-1 posters */}
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
              CLAWD ASV-1 — Open Source Humanoid Robotics Kit
            </h2>
            <p className="text-muted-foreground max-w-3xl">
              The CLAWD ASV-1 program: Solana-native bodywork, the modular CLAWD gripper system, and
              on-chain robot identity on the Asimov platform. AI. Robotics. Solana. Built together —
              powered by $CLAWD. Click either poster for the full-size version.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <a href="/images/clawd-asv1-vision.png" target="_blank" rel="noreferrer" className="block group">
              <img
                src="/images/clawd-asv1-vision.png"
                alt="CLAWD ASV-1 vision poster — the kit, the modular CLAWD gripper, the roadmap, and the funding breakdown"
                className="w-full rounded-xl border border-purple-500/30 shadow-lg shadow-purple-950/40 transition group-hover:border-purple-400/60"
                loading="lazy"
              />
              <p className="text-sm text-muted-foreground mt-2 group-hover:text-purple-300">
                The Vision — kit overview, gripper, roadmap &amp; funding
              </p>
            </a>
            <a href="/images/clawd-asv1-blueprint.png" target="_blank" rel="noreferrer" className="block group">
              <img
                src="/images/clawd-asv1-blueprint.png"
                alt="CLAWD ASV-1 blueprint poster — key specifications, detailed views, and the exploded modular parts view"
                className="w-full rounded-xl border border-cyan-500/30 shadow-lg shadow-cyan-950/40 transition group-hover:border-cyan-400/60"
                loading="lazy"
              />
              <p className="text-sm text-muted-foreground mt-2 group-hover:text-cyan-300">
                The Blueprint — key specifications, detailed views &amp; exploded parts
              </p>
            </a>
          </div>
        </section>

        {/* Viewer + Specs */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-black/40 border-cyan-500/30">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-cyan-300">
                  <Bot className="w-5 h-5" /> 3D Skeleton
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setAutoRotate(r => !r)}>
                  {autoRotate ? 'Pause rotation' : 'Auto-rotate'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-[600px]">
                  <AsimovViewer highlightGroup={highlight} autoRotate={autoRotate} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(Object.keys(ASIMOV_GROUP_COLOR) as Group[]).map(g => (
                    <button
                      key={g}
                      onMouseEnter={() => setHighlight(g)}
                      onMouseLeave={() => setHighlight(null)}
                      className="px-3 py-1.5 rounded-md text-xs font-mono border transition-all hover:scale-105"
                      style={{
                        borderColor: ASIMOV_GROUP_COLOR[g],
                        color: ASIMOV_GROUP_COLOR[g],
                        background: highlight === g ? `${ASIMOV_GROUP_COLOR[g]}22` : 'transparent',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {SPECS.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 text-sm">
                    <Icon className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-muted-foreground text-xs uppercase tracking-wide">{label}</div>
                      <div className="font-mono text-foreground">{value}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-pink-300">Payload Envelope</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <tbody>
                    {LOADS.map(({ activity, load }) => (
                      <tr key={activity} className="border-b border-border/30 last:border-0">
                        <td className="py-2 text-muted-foreground">{activity}</td>
                        <td className="py-2 text-right font-mono text-pink-300">{load}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Subsystems / DePIN tabs */}
        <Tabs defaultValue="subsystems" className="w-full">
          <TabsList className="bg-black/40 border border-cyan-500/30">
            <TabsTrigger value="subsystems">Subsystems</TabsTrigger>
            <TabsTrigger value="depin">DePIN Thesis</TabsTrigger>
            <TabsTrigger value="onchain">On-Chain Hooks</TabsTrigger>
          </TabsList>

          <TabsContent value="subsystems" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              {SUBSYSTEMS.map(s => (
                <Card
                  key={s.group + s.name}
                  className="bg-black/40 border-border/40 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onMouseEnter={() => setHighlight(s.group)}
                  onMouseLeave={() => setHighlight(null)}
                >
                  <CardContent className="p-4 flex gap-3">
                    <div className="w-1 rounded-full" style={{ background: ASIMOV_GROUP_COLOR[s.group] }} />
                    <div>
                      <div className="font-semibold text-foreground">{s.name}</div>
                      <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="depin" className="mt-4 space-y-4">
            <Card className="bg-gradient-to-br from-purple-950/40 to-cyan-950/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                  Why physical AI lives on-chain
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <p>
                  Robotics is nearing its ChatGPT moment. Waymos shuttle passengers, Figure and Agility ship humanoids into factories,
                  and food delivery bots roll through Miami and LA. The blocker isn’t algorithms — it’s <strong className="text-foreground">data</strong>.
                </p>
                <p>
                  All open robotics datasets combined sit at ~5 TB. LLM corpora are 100 TB+. The physical world is unpredictable, edge-case-rich,
                  and proprietary data captured by Tesla and DeepMind doesn’t ship with the robot you build at home.
                </p>
                <p>
                  DePIN networks reward distributed contributors for collecting telemetry, demonstrations, and benchmarks.
                  An Asimov v1 deployed on this network earns $CLAWD for verifiable training data — and every contribution is a signed, on-chain artifact.
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {DEPIN_PILLARS.map(p => (
                <Card key={p.title} className="bg-black/40 border-cyan-500/20">
                  <CardContent className="p-5 flex gap-4">
                    <p.icon className="w-6 h-6 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">{p.title}</div>
                      <p className="text-sm text-muted-foreground mt-1">{p.body}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="onchain" className="mt-4 space-y-3">
            <Card className="bg-black/40 border-emerald-500/30">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Integrations available today
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/passport" className="text-cyan-300 hover:underline">Robot Passport →</a>{' '}
                    Mint a Bubblegum cNFT identity for your Asimov v1 build (joint config, owner key, reputation).
                  </li>
                  <li>
                    <a href="/models" className="text-cyan-300 hover:underline">3D Model Gallery →</a>{' '}
                    Upload custom mesh edits or trained policies; pin GLB/VRM artifacts to Supabase storage.
                  </li>
                  <li>
                    <a href="/terminal" className="text-cyan-300 hover:underline">Trading Terminal →</a>{' '}
                    Sandbox for the upcoming Asimov API — the same chat surface will issue real CAN-bus commands once live.
                  </li>
                  <li>
                    <a href="/launch" className="text-cyan-300 hover:underline">Token Launch →</a>{' '}
                    Spin up a sub-token for your fleet (skill licensing, data marketplace pre-pays).
                  </li>
                  <li>
                    <a href="/voice" className="text-cyan-300 hover:underline">Voice Agent →</a>{' '}
                    xAI Grok realtime tied to robot commands — hold to talk, robot responds with TTS + actions.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
