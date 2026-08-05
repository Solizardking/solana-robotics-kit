import { useState, useCallback, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Image as ImageIcon, 
  Wand2, 
  Loader2, 
  Download, 
  Eye,
  Settings2,
  Sparkles,
  Box,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { ModelViewer } from '@/components/ModelViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type FalModel = 'SEED3D' | 'HUNYUAN3D_V3';
type GenerateType = 'Normal' | 'LowPoly' | 'Geometry';
type PolygonType = 'triangle' | 'quadrilateral';

interface GenerationResult {
  success: boolean;
  model: FalModel;
  requestId: string;
  urls: {
    glb?: string;
    obj?: string;
    fbx?: string;
    zip?: string;
    thumbnail?: string;
  };
  seed?: number;
}

interface GenerationStatus {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  logs?: string[];
  progress?: number;
}

export function ImageTo3D({ onModelGenerated }: { onModelGenerated?: () => void }) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [saveToGallery, setSaveToGallery] = useState(true);
  
  // Model options
  const [selectedModel, setSelectedModel] = useState<FalModel>('HUNYUAN3D_V3');
  const [faceCount, setFaceCount] = useState(500000);
  const [generateType, setGenerateType] = useState<GenerateType>('Normal');
  const [polygonType, setPolygonType] = useState<PolygonType>('triangle');
  const [enablePbr, setEnablePbr] = useState(false);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);
  
  // Polling interval ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Get FAL models info
  const { data: falModelsInfo } = trpc.models.getFalModels.useQuery();

  // Submit generation mutation
  const submitMutation = trpc.models.submitGeneration.useMutation({
    onSuccess: (data) => {
      setRequestId(data.requestId);
      setGenerationStatus({ status: 'IN_QUEUE' });
      setLogs(['Generation request submitted...', 'Waiting in queue...']);
      toast.success('Generation started! This may take a few minutes.');
    },
    onError: (error) => {
      toast.error(`Generation failed: ${error.message}`);
      setIsGenerating(false);
    },
  });

  // Check status query
  const statusQuery = trpc.models.checkGenerationStatus.useQuery(
    { requestId: requestId || '', model: selectedModel },
    { 
      enabled: !!requestId && isGenerating,
      refetchInterval: isGenerating ? 3000 : false,
    }
  );

  // Get result query
  const resultQuery = trpc.models.getGenerationResult.useQuery(
    { requestId: requestId || '', model: selectedModel },
    { enabled: !!requestId && generationStatus?.status === 'COMPLETED' }
  );

  // Direct generation mutation (synchronous with polling)
  const generateMutation = trpc.models.generateFrom2D.useMutation({
    onSuccess: (data) => {
      setGenerationResult(data);
      setIsGenerating(false);
      setGenerationStatus({ status: 'COMPLETED' });
      setLogs(prev => [...prev, '✓ Generation complete!']);
      toast.success('3D model generated successfully!');
      if (onModelGenerated) {
        onModelGenerated();
      }
    },
    onError: (error) => {
      toast.error(`Generation failed: ${error.message}`);
      setIsGenerating(false);
      setGenerationStatus({ status: 'FAILED' });
      setLogs(prev => [...prev, `✗ Error: ${error.message}`]);
    },
  });

  // Handle status updates
  useEffect(() => {
    if (statusQuery.data) {
      setGenerationStatus(statusQuery.data);
      if (statusQuery.data.logs) {
        setLogs(prev => {
          const newLogs = statusQuery.data.logs?.filter(log => !prev.includes(log)) || [];
          return [...prev, ...newLogs];
        });
      }
      
      if (statusQuery.data.status === 'COMPLETED') {
        setIsGenerating(false);
        toast.success('3D model generated successfully!');
        if (onModelGenerated) {
          onModelGenerated();
        }
      } else if (statusQuery.data.status === 'FAILED') {
        setIsGenerating(false);
        toast.error('Generation failed. Please try again.');
      }
    }
  }, [statusQuery.data, onModelGenerated]);

  // Handle result
  useEffect(() => {
    if (resultQuery.data) {
      setGenerationResult({
        success: true,
        model: selectedModel,
        requestId: requestId || '',
        urls: resultQuery.data.urls,
        seed: resultQuery.data.seed,
      });
    }
  }, [resultQuery.data, selectedModel, requestId]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Maximum size: 10MB');
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setModelName(file.name.replace(/\.[^/.]+$/, ''));
  }, []);

  const handleGenerate = async () => {
    if (!imageFile || !user) {
      toast.error('Please select an image and ensure you are logged in');
      return;
    }

    setIsGenerating(true);
    setGenerationResult(null);
    setLogs(['Starting 3D generation...']);
    setGenerationStatus({ status: 'IN_QUEUE' });

    try {
      // Convert image to base64 data URL
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // Use the synchronous generation with built-in polling
        generateMutation.mutate({
          imageUrl: base64,
          model: selectedModel,
          options: selectedModel === 'HUNYUAN3D_V3' ? {
            faceCount,
            generateType,
            polygonType,
            enablePbr,
          } : undefined,
          name: modelName || undefined,
          description: modelDescription || undefined,
          saveToGallery,
        });
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setModelName('');
    setModelDescription('');
    setGenerationResult(null);
    setGenerationStatus(null);
    setLogs([]);
    setRequestId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    switch (generationStatus?.status) {
      case 'IN_QUEUE':
        return <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />;
      case 'IN_PROGRESS':
        return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'FAILED':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getProgressValue = () => {
    switch (generationStatus?.status) {
      case 'IN_QUEUE':
        return 10;
      case 'IN_PROGRESS':
        return 50;
      case 'COMPLETED':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Section */}
      <Card className="bg-gray-900/50 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Image to 3D Generator
          </CardTitle>
          <CardDescription>
            Transform any image into a 3D model using FAL AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              imagePreview 
                ? 'border-cyan-500 bg-cyan-500/10' 
                : 'border-gray-600 hover:border-cyan-500/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imagePreview ? (
              <div className="space-y-3">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-48 mx-auto rounded-lg object-contain"
                />
                <p className="text-sm text-gray-400">Click to change image</p>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                <p className="text-gray-400">Click or drag to upload an image</p>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP (max 10MB)</p>
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label className="text-gray-300">AI Model</Label>
            <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as FalModel)}>
              <SelectTrigger className="bg-gray-800/50 border-cyan-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HUNYUAN3D_V3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Hunyuan3D v3 (High Quality)</span>
                  </div>
                </SelectItem>
                <SelectItem value="SEED3D">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Seed3D (Fast)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {selectedModel === 'HUNYUAN3D_V3' 
                ? 'Best quality with GLB, OBJ, FBX outputs and configurable options'
                : 'Faster generation, outputs ZIP with model files'}
            </p>
          </div>

          {/* Hunyuan3D Options */}
          {selectedModel === 'HUNYUAN3D_V3' && (
            <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Settings2 className="w-4 h-4" />
                <span>Generation Options</span>
              </div>

              {/* Face Count */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400 text-sm">Face Count</Label>
                  <Badge variant="outline" className="text-xs">
                    {faceCount.toLocaleString()}
                  </Badge>
                </div>
                <Slider
                  value={[faceCount]}
                  onValueChange={([v]) => setFaceCount(v)}
                  min={40000}
                  max={1500000}
                  step={10000}
                  className="py-2"
                />
                <p className="text-xs text-gray-500">Higher = more detail, slower generation</p>
              </div>

              {/* Generate Type */}
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Style</Label>
                <Select value={generateType} onValueChange={(v) => setGenerateType(v as GenerateType)}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal (Realistic)</SelectItem>
                    <SelectItem value="LowPoly">Low Poly (Stylized)</SelectItem>
                    <SelectItem value="Geometry">Geometry Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Polygon Type */}
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Polygon Type</Label>
                <Select value={polygonType} onValueChange={(v) => setPolygonType(v as PolygonType)}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="triangle">Triangles</SelectItem>
                    <SelectItem value="quadrilateral">Quads</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* PBR Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-400 text-sm">PBR Materials</Label>
                  <p className="text-xs text-gray-500">Enable physically-based rendering</p>
                </div>
                <Switch checked={enablePbr} onCheckedChange={setEnablePbr} />
              </div>
            </div>
          )}

          {/* Model Info */}
          <div className="space-y-3">
            <div>
              <Label className="text-gray-300">Model Name</Label>
              <Input
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="My 3D Model"
                className="bg-gray-800/50 border-cyan-500/20 mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={modelDescription}
                onChange={(e) => setModelDescription(e.target.value)}
                placeholder="Describe your model..."
                className="bg-gray-800/50 border-cyan-500/20 mt-1"
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Save to Gallery</Label>
              <Switch checked={saveToGallery} onCheckedChange={setSaveToGallery} />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!imageFile || !user || isGenerating}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating 3D Model...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate 3D Model
              </>
            )}
          </Button>

          {!user && (
            <p className="text-center text-sm text-yellow-500">
              Please sign in to generate 3D models
            </p>
          )}
        </CardContent>
      </Card>

      {/* Output Section */}
      <Card className="bg-gray-900/50 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Box className="w-5 h-5" />
            Generation Result
          </CardTitle>
          <CardDescription>
            Preview and download your generated 3D model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Display */}
          {generationStatus && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <span className="text-sm text-gray-300">
                  {generationStatus.status === 'IN_QUEUE' && 'Waiting in queue...'}
                  {generationStatus.status === 'IN_PROGRESS' && 'Generating 3D model...'}
                  {generationStatus.status === 'COMPLETED' && 'Generation complete!'}
                  {generationStatus.status === 'FAILED' && 'Generation failed'}
                </span>
              </div>
              <Progress value={getProgressValue()} className="h-2" />
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {logs.slice(-10).map((log, i) => (
                  <p key={i} className="text-xs text-gray-400 font-mono">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Result Preview */}
          {generationResult?.urls?.glb ? (
            <div className="space-y-4">
              <div className="h-[350px] rounded-lg overflow-hidden border border-cyan-500/20">
                <ModelViewer modelUrl={generationResult.urls.glb} className="h-full" />
              </div>
              
              {/* Download Links */}
              <div className="flex flex-wrap gap-2">
                {generationResult.urls.glb && (
                  <a href={generationResult.urls.glb} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-cyan-500/30">
                      <Download className="w-4 h-4 mr-1" /> GLB
                    </Button>
                  </a>
                )}
                {generationResult.urls.obj && (
                  <a href={generationResult.urls.obj} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-cyan-500/30">
                      <Download className="w-4 h-4 mr-1" /> OBJ
                    </Button>
                  </a>
                )}
                {generationResult.urls.fbx && (
                  <a href={generationResult.urls.fbx} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-cyan-500/30">
                      <Download className="w-4 h-4 mr-1" /> FBX
                    </Button>
                  </a>
                )}
                {generationResult.urls.zip && (
                  <a href={generationResult.urls.zip} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-cyan-500/30">
                      <Download className="w-4 h-4 mr-1" /> ZIP
                    </Button>
                  </a>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                <Badge variant="outline">{generationResult.model}</Badge>
                {generationResult.seed && (
                  <Badge variant="outline">Seed: {generationResult.seed}</Badge>
                )}
                <Badge variant="outline">ID: {generationResult.requestId.slice(0, 8)}...</Badge>
              </div>

              {/* Reset Button */}
              <Button variant="outline" onClick={resetForm} className="w-full border-gray-600">
                Generate Another Model
              </Button>
            </div>
          ) : generationResult?.urls?.zip ? (
            <div className="space-y-4">
              <div className="h-[350px] bg-gray-800/50 rounded-lg flex items-center justify-center border border-cyan-500/20">
                <div className="text-center">
                  <Box className="w-16 h-16 mx-auto mb-4 text-cyan-500/50" />
                  <p className="text-gray-400">Seed3D model generated</p>
                  <p className="text-sm text-gray-500">Download ZIP to view</p>
                </div>
              </div>
              
              <a href={generationResult.urls.zip} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-500">
                  <Download className="w-4 h-4 mr-2" /> Download ZIP
                </Button>
              </a>

              <Button variant="outline" onClick={resetForm} className="w-full border-gray-600">
                Generate Another Model
              </Button>
            </div>
          ) : (
            <div className="h-[350px] bg-gray-800/50 rounded-lg flex items-center justify-center border border-cyan-500/20">
              <div className="text-center text-gray-400">
                <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Upload an image and click generate</p>
                <p className="text-sm mt-1">Your 3D model will appear here</p>
              </div>
            </div>
          )}

          {/* Model Info */}
          {falModelsInfo && (
            <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
              <p className="text-xs text-gray-400 mb-2">Available Models:</p>
              <div className="space-y-2">
                {falModelsInfo.models.map((model) => (
                  <div key={model.id} className="text-xs">
                    <span className="text-cyan-400">{model.name}</span>
                    <span className="text-gray-500 ml-2">- {model.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
