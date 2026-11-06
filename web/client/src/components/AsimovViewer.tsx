import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Html, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const MESH_BASE = '/asimov/meshes';

type Part = { file: string; pos: [number, number, number]; group: 'pelvis' | 'left-leg' | 'right-leg' | 'torso' | 'left-arm' | 'right-arm' | 'head' };

const PARTS: Part[] = [
  { file: 'IMU_ORIGIN.STL', pos: [0, 0.63, 0], group: 'pelvis' },
  { file: 'WAIST_YAW.STL', pos: [0, 0.78, 0], group: 'torso' },
  { file: 'NECK_YAW.STL', pos: [0, 1.0, 0], group: 'head' },
  { file: 'NECK_PITCH.STL', pos: [0, 1.08, 0], group: 'head' },
  { file: 'LEFT_HIP_PITCH.STL', pos: [-0.052, 0.586, 0.067], group: 'left-leg' },
  { file: 'LEFT_HIP_ROLL.STL', pos: [-0.01, 0.586, 0.107], group: 'left-leg' },
  { file: 'LEFT_HIP_YAW.STL', pos: [-0.052, 0.534, 0.107], group: 'left-leg' },
  { file: 'LEFT_KNEE.STL', pos: [-0.052, 0.338, 0.107], group: 'left-leg' },
  { file: 'LEFT_ANKLE_A.STL', pos: [-0.052, 0.043, 0.107], group: 'left-leg' },
  { file: 'LEFT_ANKLE_B.STL', pos: [-0.052, 0.02, 0.107], group: 'left-leg' },
  { file: 'LEFT_TOE.STL', pos: [0.05, 0.0, 0.107], group: 'left-leg' },
  { file: 'RIGHT_HIP_PITCH.STL', pos: [-0.052, 0.586, -0.067], group: 'right-leg' },
  { file: 'RIGHT_HIP_ROLL.STL', pos: [-0.01, 0.586, -0.107], group: 'right-leg' },
  { file: 'RIGHT_HIP_YAW.STL', pos: [-0.052, 0.534, -0.107], group: 'right-leg' },
  { file: 'RIGHT_KNEE.STL', pos: [-0.052, 0.338, -0.107], group: 'right-leg' },
  { file: 'RIGHT_ANKLE_A.STL', pos: [-0.052, 0.043, -0.107], group: 'right-leg' },
  { file: 'RIGHT_ANKLE_B.STL', pos: [-0.052, 0.02, -0.107], group: 'right-leg' },
  { file: 'RIGHT_TOE.STL', pos: [0.05, 0.0, -0.107], group: 'right-leg' },
  { file: 'LEFT_SHOULDER_PITCH.STL', pos: [0, 0.93, 0.18], group: 'left-arm' },
  { file: 'LEFT_SHOULDER_ROLL.STL', pos: [0, 0.93, 0.22], group: 'left-arm' },
  { file: 'LEFT_SHOULDER_YAW.STL', pos: [0, 0.85, 0.22], group: 'left-arm' },
  { file: 'LEFT_ELBOW.STL', pos: [0, 0.7, 0.22], group: 'left-arm' },
  { file: 'LEFT_WRIST_YAW.STL', pos: [0, 0.55, 0.22], group: 'left-arm' },
  { file: 'RIGHT_SHOULDER_PITCH.STL', pos: [0, 0.93, -0.18], group: 'right-arm' },
  { file: 'RIGHT_SHOULDER_ROLL.STL', pos: [0, 0.93, -0.22], group: 'right-arm' },
  { file: 'RIGHT_SHOULDER_YAW.STL', pos: [0, 0.85, -0.22], group: 'right-arm' },
  { file: 'RIGHT_ELBOW.STL', pos: [0, 0.7, -0.22], group: 'right-arm' },
  { file: 'RIGHT_WRIST_YAW.STL', pos: [0, 0.55, -0.22], group: 'right-arm' },
];

const GROUP_COLOR: Record<Part['group'], string> = {
  pelvis: '#22d3ee',
  torso: '#a855f7',
  head: '#f472b6',
  'left-arm': '#34d399',
  'right-arm': '#34d399',
  'left-leg': '#fb923c',
  'right-leg': '#fb923c',
};

function StlPart({ url, position, color, highlighted }: { url: string; position: [number, number, number]; color: string; highlighted: boolean }) {
  const geometry = useLoader(STLLoader, url) as THREE.BufferGeometry;
  const cleaned = useMemo(() => {
    const g = geometry.clone();
    g.computeVertexNormals();
    g.center();
    return g;
  }, [geometry]);
  return (
    <mesh position={position} geometry={cleaned} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        metalness={0.6}
        roughness={0.35}
        emissive={highlighted ? color : '#000000'}
        emissiveIntensity={highlighted ? 0.45 : 0}
      />
    </mesh>
  );
}

function LoadingHtml() {
  return (
    <Html center>
      <div className="flex items-center gap-2 bg-black/70 px-4 py-2 rounded-lg border border-cyan-500/40">
        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-cyan-300 text-sm">Loading Asimov v1 (45MB STL)…</span>
      </div>
    </Html>
  );
}

export interface AsimovViewerProps {
  highlightGroup?: Part['group'] | null;
  autoRotate?: boolean;
  className?: string;
}

export default function AsimovViewer({ highlightGroup = null, autoRotate = true, className = '' }: AsimovViewerProps) {
  const [scale, setScale] = useState(0.001);
  useEffect(() => {
    setScale(0.001);
  }, []);
  return (
    <div className={`relative w-full h-full min-h-[500px] bg-gradient-to-b from-black via-slate-900 to-purple-950 rounded-xl border border-cyan-500/30 overflow-hidden ${className}`}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[1.6, 1.0, 1.6]} fov={45} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#a855f7" />
        <Suspense fallback={<LoadingHtml />}>
          <group scale={[scale * 1000, scale * 1000, scale * 1000]}>
            {PARTS.map(p => (
              <StlPart
                key={p.file}
                url={`${MESH_BASE}/${p.file}`}
                position={p.pos}
                color={GROUP_COLOR[p.group]}
                highlighted={highlightGroup === p.group}
              />
            ))}
          </group>
          <Environment preset="city" />
        </Suspense>
        <Grid
          position={[0, -0.001, 0]}
          args={[10, 10]}
          cellSize={0.2}
          cellThickness={0.5}
          cellColor="#0891b2"
          sectionSize={1}
          sectionThickness={1.0}
          sectionColor="#a855f7"
          fadeDistance={6}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
        <OrbitControls
          enablePan
          enableZoom
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          target={[0, 0.6, 0]}
          minDistance={1.0}
          maxDistance={5.0}
        />
      </Canvas>
      <div className="absolute bottom-3 left-3 text-xs text-cyan-300/80 font-mono pointer-events-none">
        Asimov v1 · 28 link meshes · 25 actuated DOF · MuJoCo
      </div>
    </div>
  );
}

export { PARTS as ASIMOV_PARTS, GROUP_COLOR as ASIMOV_GROUP_COLOR };
