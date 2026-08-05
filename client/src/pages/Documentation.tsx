import { useState, useRef, useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  FileText, 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader2,
  Book,
  Code,
  Cpu,
  Zap,
  ExternalLink,
  Github,
  FileCode,
  Search,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Documentation sections based on uploaded files
const docSections = [
  {
    id: "kit",
    title: "Solana Robotics CLAWD",
    icon: Cpu,
    description: "Hardware & software stack for autonomous robots",
    topics: [
      "NVIDIA Jetson Orin Nano specifications",
      "JetPack SDK 6.1 installation",
      "ROS 2 Humble integration",
      "Cosmos Vision Models",
      "Nemotron Reasoning Models"
    ]
  },
  {
    id: "guide",
    title: "GR00T Trading Guide",
    icon: Bot,
    description: "AI-powered trading robot documentation",
    topics: [
      "System architecture overview",
      "Desktop Trading Companion",
      "Chrome Extension integration",
      "Voice commands with LiveKit",
      "Vision & chart analysis"
    ]
  },
  {
    id: "protocol",
    title: "On-Chain AI Protocol",
    icon: Zap,
    description: "Solana blockchain integration for AI agents",
    topics: [
      "Robot registry on-chain",
      "Task marketplace contracts",
      "Payment rails (SPL tokens)",
      "Action logging & auditing",
      "Multi-robot coordination"
    ]
  },
  {
    id: "agents",
    title: "Self-Sovereign Agents",
    icon: Code,
    description: "Physical agents with blockchain identity",
    topics: [
      "Agent autonomy principles",
      "Decentralized decision making",
      "On-chain identity verification",
      "Cross-agent communication",
      "Safety & compliance"
    ]
  }
];

export default function Documentation() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("kit");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.docs.chat.useMutation();
  const { data: files } = trpc.docs.files.useQuery();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await chatMutation.mutateAsync({
        messages: [...messages, userMessage]
      });

      if (response?.message) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: response.message.content
        }]);
      }
    } catch (error) {
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What is the Solana Robotics CLAWD?",
    "How do I set up NVIDIA Jetson Orin Nano?",
    "Explain the Cosmos Vision Models",
    "How does on-chain robot registry work?",
    "What are the trading capabilities?"
  ];

  return (
    <MainLayout>
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm mb-4">
            <Book className="w-4 h-4" />
            Documentation Hub
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              KNOWLEDGE BASE
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Explore comprehensive documentation for the Solana Robotics CLAWD. 
            Chat with our AI assistant to get instant answers from our docs.
          </p>
        </div>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="bg-gray-900/50 border border-gray-800">
            <TabsTrigger value="chat" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask AI
            </TabsTrigger>
            <TabsTrigger value="docs" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <FileText className="w-4 h-4 mr-2" />
              Browse Docs
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              <FileCode className="w-4 h-4 mr-2" />
              Source Files
            </TabsTrigger>
          </TabsList>

          {/* AI Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat Interface */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-900/50 border-gray-800 h-[600px] flex flex-col">
                  <CardHeader className="border-b border-gray-800 pb-4">
                    <CardTitle className="flex items-center gap-2 text-cyan-400">
                      <Bot className="w-5 h-5" />
                      Pinecone Documentation Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-0">
                    <ScrollArea className="flex-1 p-4">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                            <Bot className="w-8 h-8 text-cyan-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Ask me anything about Solana Robotics
                          </h3>
                          <p className="text-gray-400 text-sm mb-6 max-w-md">
                            I can help you understand the documentation, explain concepts, 
                            and guide you through setting up your robotics system.
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {suggestedQuestions.slice(0, 3).map((q, i) => (
                              <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className="text-xs border-gray-700 hover:border-cyan-500/50 hover:text-cyan-400"
                                onClick={() => setInputValue(q)}
                              >
                                {q}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((msg, i) => (
                            <div
                              key={i}
                              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                            >
                              {msg.role === "assistant" && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                  <Bot className="w-4 h-4 text-white" />
                                </div>
                              )}
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  msg.role === "user"
                                    ? "bg-cyan-500/20 border border-cyan-500/30 text-white"
                                    : "bg-gray-800/50 border border-gray-700 text-gray-200"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                              {msg.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-gray-300" />
                                </div>
                              )}
                            </div>
                          ))}
                          {isLoading && (
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                    <div className="p-4 border-t border-gray-800">
                      <div className="flex gap-2">
                        <Input
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask about Solana Robotics..."
                          className="bg-gray-800/50 border-gray-700 focus:border-cyan-500"
                          disabled={isLoading}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={isLoading || !inputValue.trim()}
                          className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Suggested Questions */}
              <div className="space-y-4">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-400">Suggested Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {suggestedQuestions.map((q, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        className="w-full justify-start text-left text-sm text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10 h-auto py-2"
                        onClick={() => setInputValue(q)}
                      >
                        <ChevronRight className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="line-clamp-2">{q}</span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-400">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <a
                      href="https://github.com/8bitsats/solana-robotics-kit"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-cyan-400 transition-colors"
                    >
                      <Github className="w-4 h-4" />
                      GitHub Repository
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                    <a
                      href="https://x.com/solanarobotics"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-cyan-400 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      @solanarobotics
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Browse Docs Tab */}
          <TabsContent value="docs" className="space-y-6">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation..."
                className="pl-10 bg-gray-900/50 border-gray-800 focus:border-cyan-500"
              />
            </div>

            {/* Documentation Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {docSections.map((section) => (
                <Card
                  key={section.id}
                  className={`bg-gray-900/50 border-gray-800 cursor-pointer transition-all hover:border-cyan-500/50 ${
                    activeSection === section.id ? "border-cyan-500" : ""
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                        <section.icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg text-white mb-1">{section.title}</CardTitle>
                        <p className="text-sm text-gray-400">{section.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.topics.map((topic, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                          <ChevronRight className="w-4 h-4 text-cyan-500" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Source Files Tab */}
          <TabsContent value="files" className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-purple-400" />
                  Indexed Documentation Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {files?.map((file, i) => (
                    <div
                      key={file.id || i}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-purple-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          {file.name.endsWith(".pdf") ? (
                            <FileText className="w-5 h-5 text-purple-400" />
                          ) : (
                            <FileCode className="w-5 h-5 text-cyan-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB • {file.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          file.status === "Available" 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {file.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
