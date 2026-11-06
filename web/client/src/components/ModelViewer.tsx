import { Suspense, useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Grid, Html, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Grid3X3,
  Sun,
  Moon,
  Play,
  Pause,
  RefreshCw,
  SkipBack,
  SkipForward,
  Repeat,
  Gauge
} from 'lucide-react';

interface ModelViewerProps {
  modelUrl: string;
  className?: string;
  onLoad?: (info: ModelInfo) => void;
  onError?: (error: Error) => void;
}

interface ModelInfo {
  vertices: number;
  faces: number;
  materials: number;
  animations: AnimationClipInfo[];
  bones: number;
}

interface AnimationClipInfo {
  name: string;
  duration: number;
  tracks: number;
}

interface AnimationState {
  isPlaying: boolean;
  currentClip: string | null;
  currentTime: number;
  duration: number;
  speed: number;
  loop: boolean;
}

// Loading component
function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-cyan-400 text-sm">Loading model...</span>
      </div>
    </Html>
  );
}

// Error display component
function ErrorDisplay({ message }: { message: string }) {
  return (
    <Html center>
      <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400 text-center max-w-xs">
        <p className="font-semibold">Failed to load model</p>
        <p className="text-sm mt-1">{message}</p>
      </div>
    </Html>
  );
}

// Animation controller interface exposed to parent
interface AnimationController {
  play: () => void;
  pause: () => void;
  stop: () => void;
  setClip: (name: string) => void;
  setTime: (time: number) => void;
  setSpeed: (speed: number) => void;
  setLoop: (loop: boolean) => void;
}

// Model component that loads and displays the 3D model
const Model = forwardRef<AnimationController, { 
  url: string; 
  onLoad?: (info: ModelInfo) => void;
  onError?: (error: Error) => void;
  autoRotate: boolean;
  wireframe: boolean;
  onAnimationUpdate?: (state: AnimationState) => void;
  animationState: AnimationState;
}>(({ 
  url, 
  onLoad, 
  onError,
  autoRotate,
  wireframe,
  onAnimationUpdate,
  animationState
}, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url, true);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const clockRef = useRef(new THREE.Clock());

  // Initialize mixer and actions
  useEffect(() => {
    if (!scene) return;

    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;
    actionsRef.current.clear();

    // Calculate model info
    let vertices = 0;
    let faces = 0;
    let materials = new Set<THREE.Material>();
    let bones = 0;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry;
        if (geometry.attributes.position) {
          vertices += geometry.attributes.position.count;
        }
        if (geometry.index) {
          faces += geometry.index.count / 3;
        } else if (geometry.attributes.position) {
          faces += geometry.attributes.position.count / 3;
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => materials.add(m));
          } else {
            materials.add(child.material);
          }
        }
      }
      if (child instanceof THREE.Bone) {
        bones++;
      }
    });

    // Create animation clip info
    const animationInfos: AnimationClipInfo[] = animations.map(clip => ({
      name: clip.name || `Animation ${animations.indexOf(clip) + 1}`,
      duration: clip.duration,
      tracks: clip.tracks.length
    }));

    // Create actions for all animations
    animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      const clipName = clip.name || `Animation ${animations.indexOf(clip) + 1}`;
      actionsRef.current.set(clipName, action);
    });

    const info: ModelInfo = {
      vertices,
      faces: Math.floor(faces),
      materials: materials.size,
      animations: animationInfos,
      bones,
    };

    onLoad?.(info);

    // Auto-play first animation if available
    if (animations.length > 0 && animationInfos[0]) {
      const firstClip = animationInfos[0].name;
      const action = actionsRef.current.get(firstClip);
      if (action) {
        action.play();
        currentActionRef.current = action;
        onAnimationUpdate?.({
          isPlaying: true,
          currentClip: firstClip,
          currentTime: 0,
          duration: animationInfos[0].duration,
          speed: 1,
          loop: true
        });
      }
    }

    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [scene, animations, onLoad]);

  // Expose animation controls to parent
  useImperativeHandle(ref, () => ({
    play: () => {
      if (currentActionRef.current) {
        currentActionRef.current.paused = false;
      }
    },
    pause: () => {
      if (currentActionRef.current) {
        currentActionRef.current.paused = true;
      }
    },
    stop: () => {
      if (currentActionRef.current) {
        currentActionRef.current.stop();
        currentActionRef.current.reset();
      }
    },
    setClip: (name: string) => {
      const action = actionsRef.current.get(name);
      if (action && mixerRef.current) {
        // Crossfade to new animation
        if (currentActionRef.current && currentActionRef.current !== action) {
          currentActionRef.current.fadeOut(0.3);
        }
        action.reset();
        action.fadeIn(0.3);
        action.play();
        currentActionRef.current = action;
      }
    },
    setTime: (time: number) => {
      if (currentActionRef.current) {
        currentActionRef.current.time = time;
        mixerRef.current?.update(0);
      }
    },
    setSpeed: (speed: number) => {
      if (currentActionRef.current) {
        currentActionRef.current.timeScale = speed;
      }
    },
    setLoop: (loop: boolean) => {
      if (currentActionRef.current) {
        currentActionRef.current.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
        currentActionRef.current.clampWhenFinished = !loop;
      }
    }
  }), []);

  // Sync animation state from parent
  useEffect(() => {
    if (!currentActionRef.current) return;
    
    currentActionRef.current.paused = !animationState.isPlaying;
    currentActionRef.current.timeScale = animationState.speed;
    currentActionRef.current.loop = animationState.loop ? THREE.LoopRepeat : THREE.LoopOnce;
    currentActionRef.current.clampWhenFinished = !animationState.loop;
  }, [animationState.isPlaying, animationState.speed, animationState.loop]);

  // Apply wireframe mode
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            if ('wireframe' in m) m.wireframe = wireframe;
          });
        } else if ('wireframe' in child.material) {
          child.material.wireframe = wireframe;
        }
      }
    });
  }, [scene, wireframe]);

  // Animation update loop
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
      
      // Report current animation time
      if (currentActionRef.current && onAnimationUpdate) {
        const action = currentActionRef.current;
        onAnimationUpdate({
          ...animationState,
          currentTime: action.time,
          duration: action.getClip().duration,
          isPlaying: !action.paused
        });
      }
    }
    
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  // Center and scale the model
  useEffect(() => {
    if (!groupRef.current) return;
    
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    
    scene.position.sub(center);
    groupRef.current.scale.setScalar(scale);
  }, [scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
});

Model.displayName = 'Model';

// Camera controls component
function CameraController({ zoom }: { zoom: number }) {
  const { camera } = useThree();
  
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.z = 5 / zoom;
      camera.updateProjectionMatrix();
    }
  }, [camera, zoom]);

  return null;
}

// Format time as MM:SS.ms
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export function ModelViewer({ modelUrl, className = '', onLoad, onError }: ModelViewerProps) {
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Animation state
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: true,
    currentClip: null,
    currentTime: 0,
    duration: 0,
    speed: 1,
    loop: true
  });
  
  const animationControllerRef = useRef<AnimationController>(null);
  const [isSeeking, setIsSeeking] = useState(false);

  const handleLoad = (info: ModelInfo) => {
    setModelInfo(info);
    if (info.animations.length > 0) {
      setAnimationState(prev => ({
        ...prev,
        currentClip: info.animations[0].name,
        duration: info.animations[0].duration
      }));
    }
    onLoad?.(info);
  };

  const handleError = (err: Error) => {
    setError(err.message);
    onError?.(err);
  };

  const handleAnimationUpdate = useCallback((state: AnimationState) => {
    if (!isSeeking) {
      setAnimationState(prev => ({
        ...prev,
        currentTime: state.currentTime,
        duration: state.duration,
        isPlaying: state.isPlaying
      }));
    }
  }, [isSeeking]);

  const togglePlayPause = () => {
    if (animationState.isPlaying) {
      animationControllerRef.current?.pause();
    } else {
      animationControllerRef.current?.play();
    }
    setAnimationState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleClipChange = (clipName: string) => {
    animationControllerRef.current?.setClip(clipName);
    const clipInfo = modelInfo?.animations.find(a => a.name === clipName);
    setAnimationState(prev => ({
      ...prev,
      currentClip: clipName,
      currentTime: 0,
      duration: clipInfo?.duration || 0
    }));
  };

  const handleTimeChange = (value: number[]) => {
    const time = value[0];
    setIsSeeking(true);
    setAnimationState(prev => ({ ...prev, currentTime: time }));
    animationControllerRef.current?.setTime(time);
    setTimeout(() => setIsSeeking(false), 100);
  };

  const handleSpeedChange = (speed: string) => {
    const speedValue = parseFloat(speed);
    animationControllerRef.current?.setSpeed(speedValue);
    setAnimationState(prev => ({ ...prev, speed: speedValue }));
  };

  const toggleLoop = () => {
    const newLoop = !animationState.loop;
    animationControllerRef.current?.setLoop(newLoop);
    setAnimationState(prev => ({ ...prev, loop: newLoop }));
  };

  const skipToStart = () => {
    animationControllerRef.current?.setTime(0);
    setAnimationState(prev => ({ ...prev, currentTime: 0 }));
  };

  const skipToEnd = () => {
    animationControllerRef.current?.setTime(animationState.duration);
    setAnimationState(prev => ({ ...prev, currentTime: animationState.duration }));
  };

  const resetView = () => {
    setZoom(1);
    setAutoRotate(false);
  };

  const hasAnimations = modelInfo && modelInfo.animations.length > 0;

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {/* Canvas */}
      <div className="w-full h-full min-h-[400px]" style={{ background: darkMode ? '#0a0a0a' : '#f0f0f0' }}>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <CameraController zoom={zoom} />
          
          {/* Lighting */}
          <ambientLight intensity={darkMode ? 0.3 : 0.5} />
          <directionalLight position={[10, 10, 5]} intensity={darkMode ? 1 : 0.8} castShadow />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          
          {/* Environment */}
          <Environment preset={darkMode ? 'night' : 'studio'} />
          
          {/* Grid */}
          {showGrid && (
            <Grid
              args={[10, 10]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor={darkMode ? '#1a1a2e' : '#d0d0d0'}
              sectionSize={2}
              sectionThickness={1}
              sectionColor={darkMode ? '#2a2a4e' : '#a0a0a0'}
              fadeDistance={25}
              fadeStrength={1}
              followCamera={false}
              position={[0, -1.5, 0]}
            />
          )}
          
          {/* Model */}
          <Suspense fallback={<LoadingSpinner />}>
            {error ? (
              <ErrorDisplay message={error} />
            ) : (
              <Model 
                ref={animationControllerRef}
                url={modelUrl} 
                onLoad={handleLoad}
                onError={handleError}
                autoRotate={autoRotate}
                wireframe={wireframe}
                onAnimationUpdate={handleAnimationUpdate}
                animationState={animationState}
              />
            )}
          </Suspense>
          
          {/* Controls */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={false}
          />
        </Canvas>
      </div>

      {/* Animation Controls Panel - Only show if model has animations */}
      {hasAnimations && (
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-purple-500/30 min-w-[280px]">
          <div className="flex items-center gap-2 mb-3">
            <Play className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">Animation Controls</span>
          </div>
          
          {/* Animation Selector */}
          {modelInfo.animations.length > 1 && (
            <div className="mb-3">
              <label className="text-xs text-gray-400 mb-1 block">Animation Clip</label>
              <Select value={animationState.currentClip || ''} onValueChange={handleClipChange}>
                <SelectTrigger className="h-8 bg-black/50 border-purple-500/30 text-sm">
                  <SelectValue placeholder="Select animation" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-purple-500/30">
                  {modelInfo.animations.map((anim) => (
                    <SelectItem key={anim.name} value={anim.name} className="text-sm">
                      {anim.name} ({formatTime(anim.duration)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-1 mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-purple-300 hover:bg-purple-500/20"
              onClick={skipToStart}
              title="Skip to start"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
              onClick={togglePlayPause}
              title={animationState.isPlaying ? 'Pause' : 'Play'}
            >
              {animationState.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-purple-300 hover:bg-purple-500/20"
              onClick={skipToEnd}
              title="Skip to end"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${animationState.loop ? 'text-purple-400' : 'text-gray-500'} hover:text-purple-300 hover:bg-purple-500/20`}
              onClick={toggleLoop}
              title={animationState.loop ? 'Loop enabled' : 'Loop disabled'}
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Timeline / Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>{formatTime(animationState.currentTime)}</span>
              <span>{formatTime(animationState.duration)}</span>
            </div>
            <Slider
              value={[animationState.currentTime]}
              onValueChange={handleTimeChange}
              min={0}
              max={animationState.duration || 1}
              step={0.01}
              className="cursor-pointer"
            />
          </div>
          
          {/* Speed Control */}
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-400">Speed:</span>
            <Select value={animationState.speed.toString()} onValueChange={handleSpeedChange}>
              <SelectTrigger className="h-7 w-20 bg-black/50 border-purple-500/30 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-purple-500/30">
                <SelectItem value="0.25" className="text-xs">0.25x</SelectItem>
                <SelectItem value="0.5" className="text-xs">0.5x</SelectItem>
                <SelectItem value="0.75" className="text-xs">0.75x</SelectItem>
                <SelectItem value="1" className="text-xs">1x</SelectItem>
                <SelectItem value="1.5" className="text-xs">1.5x</SelectItem>
                <SelectItem value="2" className="text-xs">2x</SelectItem>
                <SelectItem value="3" className="text-xs">3x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Main Control Panel */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/30">
        {/* Left controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${autoRotate ? 'text-cyan-400' : 'text-gray-500'} hover:text-cyan-300 hover:bg-cyan-500/20`}
            onClick={() => setAutoRotate(!autoRotate)}
            title="Auto-rotate"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${wireframe ? 'text-cyan-400' : 'text-gray-500'} hover:text-cyan-300 hover:bg-cyan-500/20`}
            onClick={() => setWireframe(!wireframe)}
            title="Wireframe"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${showGrid ? 'text-cyan-400' : 'text-gray-500'} hover:text-cyan-300 hover:bg-cyan-500/20`}
            onClick={() => setShowGrid(!showGrid)}
            title="Show grid"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <ZoomOut className="h-4 w-4 text-gray-400" />
          <Slider
            value={[zoom]}
            onValueChange={([v]) => setZoom(v)}
            min={0.5}
            max={3}
            step={0.1}
            className="flex-1"
          />
          <ZoomIn className="h-4 w-4 text-gray-400" />
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20"
            onClick={resetView}
            title="Reset view"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Model Info Panel */}
      {modelInfo && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/30 text-xs">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-300">
            <span className="text-gray-500">Vertices:</span>
            <span className="text-cyan-400">{modelInfo.vertices.toLocaleString()}</span>
            <span className="text-gray-500">Faces:</span>
            <span className="text-cyan-400">{modelInfo.faces.toLocaleString()}</span>
            <span className="text-gray-500">Materials:</span>
            <span className="text-cyan-400">{modelInfo.materials}</span>
            <span className="text-gray-500">Bones:</span>
            <span className="text-cyan-400">{modelInfo.bones}</span>
            {modelInfo.animations.length > 0 && (
              <>
                <span className="text-gray-500">Animations:</span>
                <span className="text-purple-400 font-medium">{modelInfo.animations.length}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Preload helper for GLTF models
export function preloadModel(url: string) {
  useGLTF.preload(url);
}

export default ModelViewer;
