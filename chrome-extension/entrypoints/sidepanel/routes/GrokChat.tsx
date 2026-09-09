// entrypoints/sidepanel/routes/GrokChat.tsx
/**
 * Grok Chat Interface - Agentic Solana Wallet Assistant
 * Features live search and conversation chaining
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Stack,
  Textarea,
  Button,
  Group,
  Paper,
  Text,
  ScrollArea,
  Title,
  Badge,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconSend, IconRobot, IconSearch, IconSettings, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import GrokAnimatedMessage from "../components/GrokAnimatedMessage";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  timestamp: number;
}

export default function GrokChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const prevStreamingTextRef = useRef("");

  const checkApiKey = useCallback(async () => {
    try {
      const response = await browser.runtime.sendMessage({ type: "check_xai_api_key" });
      setHasApiKey(response.hasKey || false);
      if (!response.hasKey) {
        notifications.show({
          title: "API Key Required",
          message: "Please set your XAI_API_KEY in extension settings to use Grok chat.",
          color: "yellow",
          autoClose: 10000,
        });
      }
    } catch (error) {
      console.error("Error checking API key:", error);
      setHasApiKey(false);
    }
  }, []);

  // Check for API key on mount
  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  // Auto-scroll to bottom when new messages arrive or streaming text updates
  useEffect(() => {
    const shouldScroll =
      messages.length !== prevMessageCountRef.current ||
      streamingText !== prevStreamingTextRef.current;

    if (shouldScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      prevMessageCountRef.current = messages.length;
      prevStreamingTextRef.current = streamingText;
    }
  }, [messages, streamingText]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !hasApiKey) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = input.trim();
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    try {
      // Prepare messages for API (include system message only if it's the first message)
      const apiMessages: Array<{ role: string; content: string }> = [];
      
      // Add system message only for first interaction
      if (messages.length === 0) {
        apiMessages.push({
          role: "system",
          content:
            "You are Grok, an AI assistant integrated into a Solana wallet extension. You help users with Solana blockchain operations, wallet management, DeFi, NFTs, and trading. You have access to live search capabilities to provide up-to-date information. Be helpful, concise, and focus on Solana ecosystem topics. When users ask about their wallets or transactions, use the available Solana RPC and DAS API methods to fetch real-time data.",
        });
      }

      // Add previous messages (last 10 to avoid token limits)
      const recentMessages = messages.slice(-10);
      for (const m of recentMessages) {
        apiMessages.push({ role: m.role, content: m.content });
      }

      // Add current user message
      apiMessages.push({ role: "user", content: messageToSend });

      // Send to background script
      const response = await browser.runtime.sendMessage({
        type: "grok_chat",
        messages: apiMessages,
        options: {
          previousResponseId: currentResponseId,
          enableSearch: true,
          searchMode: "auto",
          returnCitations: true,
          model: "grok-4",
        },
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to get response from Grok");
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: response.text || "",
        citations: response.citations || response.sources,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
      setStreamingText("");

      if (response.responseId) {
        setCurrentResponseId(response.responseId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to send message",
        color: "red",
        autoClose: 5000,
      });
      setIsLoading(false);
      setStreamingText("");
    }
  }, [input, isLoading, hasApiKey, messages, currentResponseId]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentResponseId(null);
    setStreamingText("");
  };

  if (hasApiKey === null) {
    return (
      <Stack gap="md" align="center" justify="center" style={{ minHeight: "400px" }}>
        <Text>Checking API key...</Text>
      </Stack>
    );
  }

  if (!hasApiKey) {
    return (
      <Stack gap="lg">
        <Title order={1}>Grok Chat</Title>
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              To use Grok chat, you need to set your XAI API key.
            </Text>
            <Button
              onClick={() => {
                // Navigate to settings or show API key input
                notifications.show({
                  title: "API Key Setup",
                  message: "Please set XAI_API_KEY in browser storage.local",
                  color: "blue",
                });
              }}
            >
              Set API Key
            </Button>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack gap="md" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconRobot
            size={24}
            style={{
              color: "#14F195",
              filter: "drop-shadow(0 0 10px rgba(20, 241, 149, 0.6))",
              animation: "grok-pulse 2s infinite",
            }}
          />
          <Title
            order={2}
            style={{
              background: "linear-gradient(135deg, #14F195, #9945FF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Grok Assistant
          </Title>
          <Badge
            variant="light"
            style={{
              background: "rgba(153, 69, 255, 0.2)",
              border: "1px solid rgba(153, 69, 255, 0.4)",
              color: "#9945FF",
            }}
          >
            <IconSearch size={12} style={{ marginRight: 4 }} />
            Live Search
          </Badge>
        </Group>
        <Group gap="xs">
          <Tooltip label="Clear Chat">
            <ActionIcon variant="subtle" onClick={clearChat} disabled={messages.length === 0}>
              <IconX size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Settings">
            <ActionIcon variant="subtle" onClick={() => navigate("/accounts/home")}>
              <IconSettings size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <ScrollArea
        ref={scrollAreaRef}
        style={{ flex: 1, minHeight: 0 }}
        type="scroll"
        offsetScrollbars
      >
        <Stack gap="md" p="xs">
          {messages.length === 0 && (
            <Paper
              p="xl"
              withBorder
              style={{
                textAlign: "center",
                background: "rgba(26, 26, 37, 0.8)",
                border: "1px solid rgba(153, 69, 255, 0.3)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Stack gap="md">
                <IconRobot
                  size={48}
                  style={{
                    margin: "0 auto",
                    color: "#14F195",
                    filter: "drop-shadow(0 0 20px rgba(20, 241, 149, 0.6))",
                    animation: "grok-pulse 2s infinite",
                  }}
                />
                <Text
                  size="lg"
                  fw={500}
                  style={{
                    background: "linear-gradient(135deg, #14F195, #9945FF)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Welcome to Grok!
                </Text>
                <Text size="sm" c="dimmed">
                  I'm your Solana wallet assistant with live search capabilities. Ask me anything
                  about Solana, DeFi, NFTs, or your wallet!
                </Text>
                <Group justify="center" gap="xs" mt="md">
                  <Badge
                    leftSection={<IconSearch size={12} />}
                    variant="light"
                    style={{
                      background: "rgba(153, 69, 255, 0.2)",
                      border: "1px solid rgba(153, 69, 255, 0.4)",
                      color: "#9945FF",
                    }}
                  >
                    Live Search Enabled
                  </Badge>
                </Group>
              </Stack>
            </Paper>
          )}

          {messages.map((message) => {
            if (message.role === "assistant") {
              return (
                <GrokAnimatedMessage
                  key={message.id}
                  message={message.content}
                  citations={message.citations}
                  isTyping={false}
                />
              );
            }
            return (
              <Paper
                key={message.id}
                p="md"
                withBorder
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "85%",
                  background: "linear-gradient(135deg, rgba(153, 69, 255, 0.2), rgba(20, 241, 149, 0.1))",
                  border: "1px solid rgba(153, 69, 255, 0.4)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Text
                  size="sm"
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "#f0f0f5",
                  }}
                >
                  {message.content}
                </Text>
              </Paper>
            );
          })}

          {streamingText && (
            <GrokAnimatedMessage
              message={streamingText}
              isTyping={true}
            />
          )}

          {isLoading && !streamingText && (
            <Paper p="md" withBorder style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
              <Text size="sm" c="dimmed">
                Grok is thinking...
              </Text>
            </Paper>
          )}

          <div ref={messagesEndRef} />
        </Stack>
      </ScrollArea>

      <Paper
        p="md"
        withBorder
        style={{
          background: "rgba(26, 26, 37, 0.8)",
          border: "1px solid rgba(153, 69, 255, 0.3)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Stack gap="sm">
          <Group gap="xs" align="flex-end">
            <Textarea
              placeholder="Ask Grok anything about Solana, DeFi, NFTs, or your wallet..."
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading || !hasApiKey}
              minRows={2}
              maxRows={5}
              autosize
              style={{ flex: 1 }}
              styles={{
                input: {
                  backgroundColor: "rgba(18, 18, 26, 0.8)",
                  border: "1px solid rgba(153, 69, 255, 0.3)",
                  color: "#f0f0f5",
                },
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || !hasApiKey}
              leftSection={<IconSend size={16} />}
              loading={isLoading}
              style={{
                background: "linear-gradient(135deg, #14F195, #9945FF)",
                border: "1px solid rgba(153, 69, 255, 0.5)",
                boxShadow: "0 0 20px rgba(153, 69, 255, 0.4)",
              }}
            >
              Send
            </Button>
          </Group>
          <Text size="xs" c="dimmed" ta="center">
            Press Enter to send, Shift+Enter for new line
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
