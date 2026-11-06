import { useState, useRef, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Code2, 
  Sparkles, 
  Brain, 
  Zap, 
  Copy, 
  Download, 
  RefreshCw,
  Eye,
  FileCode,
  Wand2,
  Bug,
  MessageSquare,
  TestTube,
  Loader2,
  ChevronDown,
  ChevronUp,
  Terminal
} from 'lucide-react';

type CodeMode = 'generate' | 'edit' | 'explain' | 'debug' | 'refactor' | 'test';
type CodeLanguage = 'html' | 'css' | 'javascript' | 'typescript' | 'react' | 'python' | 'rust' | 'solidity';
type VibeModelId = 'codex' | 'opus' | 'grok';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  timestamp: Date;
}

const MODEL_INFO = {
  codex: { name: 'GPT-5.2 Codex', icon: '🧠', color: 'text-green-400', description: 'Advanced reasoning' },
  opus: { name: 'Claude Opus 4.5', icon: '🎭', color: 'text-purple-400', description: 'Complex understanding' },
  grok: { name: 'Grok Code Fast', icon: '⚡', color: 'text-cyan-400', description: 'Fast generation' },
};

const MODE_INFO = {
  generate: { name: 'Generate', icon: Sparkles, description: 'Create new code' },
  edit: { name: 'Edit', icon: Wand2, description: 'Modify code' },
  explain: { name: 'Explain', icon: MessageSquare, description: 'Understand code' },
  debug: { name: 'Debug', icon: Bug, description: 'Fix issues' },
  refactor: { name: 'Refactor', icon: RefreshCw, description: 'Improve structure' },
  test: { name: 'Test', icon: TestTube, description: 'Generate tests' },
};

const LANGUAGE_INFO: Record<CodeLanguage, { name: string; extension: string; previewable: boolean }> = {
  html: { name: 'HTML', extension: '.html', previewable: true },
  css: { name: 'CSS', extension: '.css', previewable: true },
  javascript: { name: 'JavaScript', extension: '.js', previewable: true },
  typescript: { name: 'TypeScript', extension: '.ts', previewable: false },
  react: { name: 'React/TSX', extension: '.tsx', previewable: false },
  python: { name: 'Python', extension: '.py', previewable: false },
  rust: { name: 'Rust', extension: '.rs', previewable: false },
  solidity: { name: 'Solidity', extension: '.sol', previewable: false },
};

export function VibeStudio() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [reasoning, setReasoning] = useState<unknown>(null);
  const [selectedModel, setSelectedModel] = useState<VibeModelId>('codex');
  const [selectedMode, setSelectedMode] = useState<CodeMode>('generate');
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('html');
  const [enableReasoning, setEnableReasoning] = useState(true);
  const [showReasoning, setShowReasoning] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  
  const previewRef = useRef<HTMLIFrameElement>(null);
  
  const vibeCodeMutation = trpc.vibeStudio.generateCode.useMutation({
    onSuccess: (data: { code: string; explanation?: string; reasoning_details?: unknown; model: string }) => {
      if (data) {
        setGeneratedCode(data.code);
        setExplanation(data.explanation || '');
        setReasoning(data.reasoning_details || null);
        
        setConversation(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.explanation || 'Code generated successfully.',
            code: data.code,
            timestamp: new Date(),
          },
        ]);
        
        toast.success(`Code ${selectedMode === 'generate' ? 'generated' : 'processed'} with ${data.model}`);
        
        if (LANGUAGE_INFO[selectedLanguage].previewable && selectedMode === 'generate') {
          setActiveTab('preview');
        }
      }
    },
    onError: (error: { message: string }) => {
      toast.error(`Failed: ${error.message}`);
    },
  });
  
  useEffect(() => {
    if (previewRef.current && generatedCode && LANGUAGE_INFO[selectedLanguage].previewable) {
      const previewDoc = previewRef.current.contentDocument;
      if (previewDoc) {
        let previewHtml = '';
        
        if (selectedLanguage === 'html') {
          if (generatedCode.includes('<html') || generatedCode.includes('<!DOCTYPE')) {
            previewHtml = generatedCode;
          } else {
            previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; padding: 1rem; }
  </style>
</head>
<body>
  ${generatedCode}
</body>
</html>`;
          }
        } else if (selectedLanguage === 'css') {
          previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Preview</title>
  <style>${generatedCode}</style>
</head>
<body>
  <div class="preview-container">
    <h1>CSS Preview</h1>
    <p>Your styles are applied to this page.</p>
    <button>Sample Button</button>
    <div class="box">Sample Box</div>
  </div>
</body>
</html>`;
        } else if (selectedLanguage === 'javascript') {
          previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JS Preview</title>
  <style>
    body { font-family: system-ui; padding: 1rem; background: #1a1a2e; color: #eee; }
    #output { background: #16213e; padding: 1rem; border-radius: 8px; white-space: pre-wrap; font-family: monospace; }
  </style>
</head>
<body>
  <h2>JavaScript Output</h2>
  <div id="output"></div>
  <script>
    const output = document.getElementById('output');
    const originalLog = console.log;
    console.log = (...args) => {
      output.textContent += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ') + '\\n';
      originalLog.apply(console, args);
    };
    try {
      ${generatedCode}
    } catch (e) {
      output.textContent += 'Error: ' + e.message;
    }
  </script>
</body>
</html>`;
        }
        
        previewDoc.open();
        previewDoc.write(previewHtml);
        previewDoc.close();
      }
    }
  }, [generatedCode, selectedLanguage]);
  
  const handleGenerate = useCallback(() => {
    if (!prompt.trim() && selectedMode === 'generate') {
      toast.error('Please enter a prompt');
      return;
    }
    
    if (!code.trim() && selectedMode !== 'generate') {
      toast.error('Please enter code to process');
      return;
    }
    
    setConversation(prev => [
      ...prev,
      {
        role: 'user',
        content: prompt,
        code: selectedMode !== 'generate' ? code : undefined,
        timestamp: new Date(),
      },
    ]);
    
    vibeCodeMutation.mutate({
      prompt,
      code: selectedMode !== 'generate' ? code : undefined,
      language: selectedLanguage,
      mode: selectedMode,
      modelId: selectedModel,
      enableReasoning: selectedModel === 'codex' && enableReasoning,
    });
  }, [prompt, code, selectedLanguage, selectedMode, selectedModel, enableReasoning, vibeCodeMutation]);
  
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedCode);
    toast.success('Code copied to clipboard');
  }, [generatedCode]);
  
  const handleDownload = useCallback(() => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibe-code${LANGUAGE_INFO[selectedLanguage].extension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Code downloaded');
  }, [generatedCode, selectedLanguage]);
  
  const handleUseAsInput = useCallback(() => {
    setCode(generatedCode);
    setSelectedMode('edit');
    toast.info('Code moved to input for editing');
  }, [generatedCode]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
                <Terminal className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Vibe Coding Studio
                </h1>
                <p className="text-sm text-slate-400">Multi-model AI code generation & editing</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-slate-400">AI Model:</Label>
                <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as VibeModelId)}>
                  <SelectTrigger className="w-[200px] bg-slate-800/50 border-purple-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODEL_INFO).map(([id, info]) => (
                      <SelectItem key={id} value={id}>
                        <div className="flex items-center gap-2">
                          <span>{info.icon}</span>
                          <span>{info.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedModel === 'codex' && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={enableReasoning}
                    onCheckedChange={setEnableReasoning}
                    id="reasoning"
                  />
                  <Label htmlFor="reasoning" className="text-slate-400 flex items-center gap-1">
                    <Brain className="w-4 h-4" /> Reasoning
                  </Label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="bg-slate-900/50 border-purple-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-purple-400" />
                  Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(MODE_INFO).map(([id, info]) => {
                    const Icon = info.icon;
                    return (
                      <Button
                        key={id}
                        variant={selectedMode === id ? 'default' : 'outline'}
                        className={`flex flex-col h-auto py-3 ${
                          selectedMode === id 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : 'bg-transparent border-slate-700 hover:bg-slate-800'
                        }`}
                        onClick={() => setSelectedMode(id as CodeMode)}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-xs">{info.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-purple-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-cyan-400" />
                  Language
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as CodeLanguage)}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LANGUAGE_INFO).map(([id, info]) => (
                      <SelectItem key={id} value={id}>
                        <div className="flex items-center gap-2">
                          <span>{info.name}</span>
                          {info.previewable && (
                            <Badge variant="outline" className="text-xs">Preview</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-purple-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  {selectedMode === 'generate' ? 'Describe what you want' : 'Instructions'}
                </CardTitle>
                <CardDescription>
                  {selectedMode === 'generate' 
                    ? 'Describe the code you want to generate in natural language'
                    : `Describe how you want to ${selectedMode} the code`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    selectedMode === 'generate'
                      ? 'e.g., Create a responsive navbar with a hamburger menu...'
                      : selectedMode === 'debug'
                      ? 'Describe the issue you\'re experiencing...'
                      : 'Enter your instructions...'
                  }
                  className="min-h-[120px] bg-slate-800/50 border-slate-700 resize-none"
                />
              </CardContent>
            </Card>
            
            {selectedMode !== 'generate' && (
              <Card className="bg-slate-900/50 border-purple-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-green-400" />
                    Input Code
                  </CardTitle>
                  <CardDescription>
                    Paste the code you want to {selectedMode}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={`Paste your ${LANGUAGE_INFO[selectedLanguage].name} code here...`}
                    className="min-h-[200px] bg-slate-950 border-slate-700 font-mono text-sm resize-none"
                  />
                </CardContent>
              </Card>
            )}
            
            <Button
              onClick={handleGenerate}
              disabled={vibeCodeMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold"
            >
              {vibeCodeMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {MODEL_INFO[selectedModel].icon} Processing with {MODEL_INFO[selectedModel].name}...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  {MODE_INFO[selectedMode].name} Code
                </>
              )}
            </Button>
          </div>
          
          <div className="space-y-4">
            <Card className="bg-slate-900/50 border-purple-500/20 h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {activeTab === 'code' ? (
                      <Code2 className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-cyan-400" />
                    )}
                    Output
                  </CardTitle>
                  
                  {generatedCode && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={handleCopy}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDownload}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleUseAsInput}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'code' | 'preview')}>
                  <TabsList className="bg-slate-800/50">
                    <TabsTrigger value="code" className="data-[state=active]:bg-purple-600">
                      <Code2 className="w-4 h-4 mr-2" /> Code
                    </TabsTrigger>
                    {LANGUAGE_INFO[selectedLanguage].previewable && (
                      <TabsTrigger value="preview" className="data-[state=active]:bg-cyan-600">
                        <Eye className="w-4 h-4 mr-2" /> Preview
                      </TabsTrigger>
                    )}
                  </TabsList>
                  
                  <TabsContent value="code" className="mt-4">
                    <div className="relative">
                      <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 overflow-auto max-h-[400px] text-sm font-mono">
                        {generatedCode || (
                          <span className="text-slate-500">
                            Generated code will appear here...
                          </span>
                        )}
                      </pre>
                      {generatedCode && (
                        <Badge className="absolute top-2 right-2 bg-slate-800">
                          {LANGUAGE_INFO[selectedLanguage].name}
                        </Badge>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preview" className="mt-4">
                    <div className="bg-white rounded-lg overflow-hidden border border-slate-700">
                      <iframe
                        ref={previewRef}
                        title="Code Preview"
                        className="w-full h-[400px]"
                        sandbox="allow-scripts"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                {explanation && (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-cyan-400" />
                        Explanation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{explanation}</p>
                    </CardContent>
                  </Card>
                )}
                
                {reasoning !== null && selectedModel === 'codex' && (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader 
                      className="pb-2 cursor-pointer"
                      onClick={() => setShowReasoning(!showReasoning)}
                    >
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-400" />
                          AI Reasoning
                        </span>
                        {showReasoning ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    {showReasoning && (
                      <CardContent>
                        <pre className="text-xs text-slate-400 whitespace-pre-wrap overflow-auto max-h-[200px]">
                          {String(JSON.stringify(reasoning, null, 2))}
                        </pre>
                      </CardContent>
                    )}
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {conversation.length > 0 && (
          <Card className="mt-6 bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Session History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-purple-900/30 border border-purple-500/30 ml-8'
                        : 'bg-slate-800/50 border border-slate-700 mr-8'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={msg.role === 'user' ? 'default' : 'secondary'}>
                        {msg.role === 'user' ? 'You' : 'AI'}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{msg.content}</p>
                    {msg.code && (
                      <pre className="mt-2 p-2 bg-slate-950 rounded text-xs font-mono overflow-auto max-h-[100px]">
                        {msg.code.slice(0, 200)}...
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {Object.entries(MODEL_INFO).map(([id, info]) => (
            <Card 
              key={id}
              className={`bg-slate-900/50 border-purple-500/20 cursor-pointer transition-all ${
                selectedModel === id ? 'ring-2 ring-purple-500' : 'hover:border-purple-500/40'
              }`}
              onClick={() => setSelectedModel(id as VibeModelId)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{info.icon}</span>
                  <div>
                    <h3 className={`font-semibold ${info.color}`}>{info.name}</h3>
                    <p className="text-xs text-slate-400">{info.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VibeStudio;
