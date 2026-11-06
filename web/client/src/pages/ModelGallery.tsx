import { useState, useCallback, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { usePhantomSolana } from '@/hooks/usePhantomSolana';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Upload, 
  Box, 
  Eye, 
  Download, 
  Trash2, 
  Globe, 
  Lock,
  FileBox,
  Loader2,
  Search,
  Grid3X3,
  List,
  Plus,
  Play,
  Wand2
} from 'lucide-react';
import { ModelViewer } from '@/components/ModelViewer';
import { ImageTo3D } from '@/components/ImageTo3D';

const SUPPORTED_EXTENSIONS = ['.vrm', '.glb', '.gltf', '.fbx', '.obj'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface Model3D {
  id: number;
  name: string;
  description: string | null;
  filename: string;
  fileType: string;
  fileSize: number;
  publicUrl: string;
  thumbnailUrl: string | null;
  isPublic: boolean;
  views: number;
  downloads: number;
  createdAt: Date;
  metadata?: {
    vertices?: number;
    faces?: number;
    materials?: number;
    animations?: Array<{ name: string; duration: number; tracks: number }> | string[];
    bones?: number;
    textures?: string[];
  } | null;
}

export default function ModelGallery() {
  const { user } = useAuth();
  const { address: walletAddress, connected } = usePhantomSolana();
  const [activeTab, setActiveTab] = useState('gallery');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadIsPublic, setUploadIsPublic] = useState(false);
  const [uploadTags, setUploadTags] = useState('');

  // Queries
  const { data: myModels, isLoading: loadingMyModels, refetch: refetchMyModels } = trpc.models.list.useQuery(
    { userId: user?.id },
    { enabled: !!user?.id }
  );

  const { data: publicModels, isLoading: loadingPublic } = trpc.models.listPublic.useQuery({
    limit: 50,
    search: searchQuery || undefined,
  });

  // Mutations
  const uploadMutation = trpc.models.upload.useMutation({
    onSuccess: () => {
      toast.success('Model uploaded successfully!');
      refetchMyModels();
      resetUploadForm();
      setActiveTab('my-models');
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const deleteMutation = trpc.models.delete.useMutation({
    onSuccess: () => {
      toast.success('Model deleted');
      refetchMyModels();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const toggleVisibilityMutation = trpc.models.toggleVisibility.useMutation({
    onSuccess: () => {
      toast.success('Visibility updated');
      refetchMyModels();
    },
  });

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadName('');
    setUploadDescription('');
    setUploadIsPublic(false);
    setUploadTags('');
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      toast.error(`Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    setUploadFile(file);
    setUploadName(file.name.replace(/\.[^/.]+$/, ''));

    // Create preview URL for GLB/GLTF files
    if (ext === '.glb' || ext === '.gltf') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!uploadFile || !user?.id) {
      toast.error('Please select a file and ensure you are logged in');
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64
      const buffer = await uploadFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      await uploadMutation.mutateAsync({
        file: base64,
        filename: uploadFile.name,
        name: uploadName || uploadFile.name,
        description: uploadDescription || undefined,
        isPublic: uploadIsPublic,
        tags: uploadTags ? uploadTags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        walletAddress: walletAddress || undefined,
      });
    } catch (error: unknown) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (model: Model3D) => {
    if (confirm(`Are you sure you want to delete "${model.name}"?`)) {
      deleteMutation.mutate({ id: model.id });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const ModelCard = ({ model, showActions = false }: { model: Model3D; showActions?: boolean }) => (
    <Card className="bg-gray-900/50 border-cyan-500/20 hover:border-cyan-500/40 transition-all group">
      <CardContent className="p-4">
        {/* Thumbnail or placeholder */}
        <div className="aspect-square bg-gray-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          {model.thumbnailUrl ? (
            <img src={model.thumbnailUrl} alt={model.name} className="w-full h-full object-cover" />
          ) : (
            <Box className="w-12 h-12 text-cyan-500/50" />
          )}
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-white truncate flex-1">{model.name}</h3>
            <Badge variant="outline" className="text-xs shrink-0">
              {model.fileType.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {model.views}
            </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" /> {model.downloads}
                    </span>
                    <span>{formatFileSize(model.fileSize)}</span>
                    {model.metadata?.animations && model.metadata.animations.length > 0 && (
                      <span className="flex items-center gap-1 text-purple-400" title="Animations">
                        <Play className="w-3 h-3" /> {model.metadata.animations.length}
                      </span>
                    )}
                  </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-cyan-500/30 hover:bg-cyan-500/20"
                  onClick={() => setSelectedModel(model)}
                >
                  <Eye className="w-4 h-4 mr-1" /> Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-gray-900 border-cyan-500/30">
                <DialogHeader>
                  <DialogTitle className="text-cyan-400">{model.name}</DialogTitle>
                </DialogHeader>
                <div className="h-[600px]">
                  <ModelViewer modelUrl={model.publicUrl} className="h-full" />
                </div>
              </DialogContent>
            </Dialog>

            {showActions && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-cyan-400"
                  onClick={() => toggleVisibilityMutation.mutate({ id: model.id, isPublic: !model.isPublic })}
                  title={model.isPublic ? 'Make private' : 'Make public'}
                >
                  {model.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-400"
                  onClick={() => handleDelete(model)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              3D Model Gallery
            </h1>
            <p className="text-gray-400 mt-1">
              Upload, preview, and manage your 3D models (VRM, GLB, FBX, OBJ)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="border-cyan-500/30"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="border-cyan-500/30"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800/50 border border-cyan-500/20 mb-6">
            <TabsTrigger value="gallery" className="data-[state=active]:bg-cyan-500/20">
              <Globe className="w-4 h-4 mr-2" /> Public Gallery
            </TabsTrigger>
            <TabsTrigger value="my-models" className="data-[state=active]:bg-cyan-500/20">
              <FileBox className="w-4 h-4 mr-2" /> My Models
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-cyan-500/20">
              <Upload className="w-4 h-4 mr-2" /> Upload
            </TabsTrigger>
            <TabsTrigger value="generate" className="data-[state=active]:bg-purple-500/20">
              <Wand2 className="w-4 h-4 mr-2" /> Image to 3D
            </TabsTrigger>
          </TabsList>

          {/* Public Gallery */}
          <TabsContent value="gallery">
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-cyan-500/20"
                />
              </div>
            </div>

            {loadingPublic ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : publicModels?.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No public models found</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-4"
              }>
                {publicModels?.map((model: Model3D) => (
                  <ModelCard key={model.id} model={model} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Models */}
          <TabsContent value="my-models">
            {!user ? (
              <Card className="bg-gray-900/50 border-cyan-500/20">
                <CardContent className="py-20 text-center">
                  <Lock className="w-16 h-16 mx-auto mb-4 text-cyan-500/50" />
                  <p className="text-gray-400 mb-4">Please sign in to view your models</p>
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-500">
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            ) : loadingMyModels ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : myModels?.length === 0 ? (
              <Card className="bg-gray-900/50 border-cyan-500/20">
                <CardContent className="py-20 text-center">
                  <Box className="w-16 h-16 mx-auto mb-4 text-cyan-500/50" />
                  <p className="text-gray-400 mb-4">You haven't uploaded any models yet</p>
                  <Button 
                    onClick={() => setActiveTab('upload')}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Upload Your First Model
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-4"
              }>
                {myModels?.map((model: Model3D) => (
                  <ModelCard key={model.id} model={model} showActions />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Upload */}
          <TabsContent value="upload">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Form */}
              <Card className="bg-gray-900/50 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="text-cyan-400">Upload 3D Model</CardTitle>
                  <CardDescription>
                    Supported formats: {SUPPORTED_EXTENSIONS.join(', ')} (max {MAX_FILE_SIZE / 1024 / 1024}MB)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Input */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      uploadFile 
                        ? 'border-cyan-500 bg-cyan-500/10' 
                        : 'border-gray-600 hover:border-cyan-500/50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={SUPPORTED_EXTENSIONS.join(',')}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {uploadFile ? (
                      <div className="space-y-2">
                        <FileBox className="w-12 h-12 mx-auto text-cyan-400" />
                        <p className="text-white font-medium">{uploadFile.name}</p>
                        <p className="text-gray-400 text-sm">{formatFileSize(uploadFile.size)}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="text-gray-400">Click or drag to upload</p>
                      </div>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Name</label>
                      <Input
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        placeholder="Model name"
                        className="bg-gray-800/50 border-cyan-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Description</label>
                      <Textarea
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        placeholder="Describe your model..."
                        className="bg-gray-800/50 border-cyan-500/20"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Tags (comma-separated)</label>
                      <Input
                        value={uploadTags}
                        onChange={(e) => setUploadTags(e.target.value)}
                        placeholder="robot, avatar, character"
                        className="bg-gray-800/50 border-cyan-500/20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={uploadIsPublic}
                        onChange={(e) => setUploadIsPublic(e.target.checked)}
                        className="rounded border-cyan-500/30"
                      />
                      <label htmlFor="isPublic" className="text-sm text-gray-400">
                        Make this model public
                      </label>
                    </div>
                  </div>

                  {/* Upload Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={!uploadFile || !user || isUploading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" /> Upload Model
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card className="bg-gray-900/50 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="text-cyan-400">Live Preview</CardTitle>
                  <CardDescription>
                    Preview your model before uploading (GLB/GLTF only)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {previewUrl ? (
                    <div className="h-[400px] rounded-lg overflow-hidden">
                      <ModelViewer modelUrl={previewUrl} className="h-full" />
                    </div>
                  ) : (
                    <div className="h-[400px] bg-gray-800/50 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Select a GLB or GLTF file to preview</p>
                        <p className="text-sm mt-1">VRM, FBX, and OBJ files will be viewable after upload</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Image to 3D Generation */}
          <TabsContent value="generate">
            <ImageTo3D onModelGenerated={() => {
              refetchMyModels();
              setActiveTab('my-models');
            }} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
