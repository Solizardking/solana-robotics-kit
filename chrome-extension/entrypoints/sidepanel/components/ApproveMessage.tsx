// entrypoints/sidepanel/components/ApproveMessage.tsx
/**
 * Message Signing Approval Component
 * Adapted from alpha-wallet, integrated with Solana GR00T desktop automation
 */

import { useState, useEffect } from "react";
import { Button, Card, Stack, Text, Code, Badge, Group, Alert, Textarea } from "@mantine/core";
import { IconCheck, IconX, IconAlertTriangle, IconRobot, IconSignature } from "@tabler/icons-react";

interface MessageData {
  message: string | Uint8Array;
  origin: string;
  requestId: number;
  tabId?: number;
}

interface ApproveMessageProps {
  messageData: MessageData;
  onApprove: (messageData: MessageData) => Promise<void>;
  onReject: () => void;
}

export default function ApproveMessage({
  messageData,
  onApprove,
  onReject,
}: ApproveMessageProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [desktopConnected, setDesktopConnected] = useState(false);
  const [messageText, setMessageText] = useState<string>("");
  const [messageAnalysis, setMessageAnalysis] = useState<{
    decoded?: string;
    risk?: "low" | "medium" | "high";
    purpose?: string;
  } | null>(null);

  useEffect(() => {
    // Check desktop connection status
    browser.runtime.sendMessage({ type: "get_status" }).then((status: {
      connected?: boolean;
    }) => {
      setDesktopConnected(status.connected ?? false);
    });

    // Listen for desktop connection changes
    const listener = (message: Record<string, unknown>) => {
      if (message.type === "connection_status") {
        setDesktopConnected((message.connected as boolean) ?? false);
      }
    };
    browser.runtime.onMessage.addListener(listener);

    // Decode message
    if (typeof messageData.message === "string") {
      setMessageText(messageData.message);
    } else {
      // Try to decode as UTF-8
      try {
        const decoder = new TextDecoder("utf-8");
        setMessageText(decoder.decode(messageData.message));
      } catch {
        setMessageText(`Binary message (${messageData.message.length} bytes)`);
      }
    }

    // Analyze message if desktop agent is connected
    if (desktopConnected) {
      analyzeMessage(messageData.message);
    }

    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }, [messageData, desktopConnected]);

  async function analyzeMessage(message: string | Uint8Array) {
    if (desktopConnected) {
      try {
        const messageStr = typeof message === "string" ? message : new TextDecoder().decode(message);
        const response = await browser.runtime.sendMessage({
          type: "analyze_message",
          message: messageStr,
          origin: messageData.origin,
        });
        if (response?.analysis) {
          setMessageAnalysis(response.analysis);
        }
      } catch (error) {
        console.error("Error analyzing message:", error);
      }
    }
  }

  async function handleApprove() {
    setIsApproving(true);
    try {
      await onApprove(messageData);
    } catch (error) {
      console.error("Error approving message:", error);
      alert("Failed to sign message");
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    setIsRejecting(true);
    try {
      onReject();
    } finally {
      setIsRejecting(false);
    }
  }

  const riskColor = messageAnalysis?.risk === "high" ? "red" :
    messageAnalysis?.risk === "medium" ? "yellow" : "green";

  return (
    <Stack gap="md" p="md">
      {/* Header */}
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconSignature size={20} />
          <Text size="xl" fw={700}>Sign Message</Text>
        </Group>
        {desktopConnected && (
          <Badge
            leftSection={<IconRobot size={14} />}
            color="green"
            variant="light"
          >
            Desktop Agent Connected
          </Badge>
        )}
      </Group>

      {/* Origin Warning */}
      <Alert
        icon={<IconAlertTriangle size={16} />}
        title="Message Signing Request"
        color="blue"
      >
        <Text size="sm">
          <strong>Origin:</strong> {messageData.origin}
        </Text>
        {messageAnalysis?.risk === "high" && (
          <Text size="sm" c="red" mt="xs">
            ⚠️ High risk message detected
          </Text>
        )}
      </Alert>

      {/* Desktop Agent Integration */}
      {desktopConnected && (
        <Card p="sm" withBorder>
          <Group gap="xs" mb="xs">
            <IconRobot size={16} />
            <Text size="sm" fw={600}>Desktop Automation</Text>
          </Group>
          <Text size="xs" c="dimmed">
            Message analysis powered by desktop agent AI.
          </Text>
        </Card>
      )}

      {/* Message Content */}
      <Card p="md" withBorder>
        <Stack gap="sm">
          <Text size="sm" fw={600}>Message to Sign</Text>
          <Textarea
            value={messageText}
            readOnly
            minRows={4}
            maxRows={8}
            styles={{
              input: {
                fontFamily: "monospace",
                fontSize: "0.875rem",
                backgroundColor: "var(--mantine-color-dark-7)",
              },
            }}
          />
          {messageAnalysis?.purpose && (
            <Alert color="blue" size="sm" mt="xs">
              <Text size="xs">
                <strong>Purpose:</strong> {messageAnalysis.purpose}
              </Text>
            </Alert>
          )}
        </Stack>
      </Card>

      {/* Message Analysis */}
      {messageAnalysis && (
        <Card p="sm" withBorder>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Risk Level:</Text>
            <Badge color={riskColor} size="sm">
              {messageAnalysis.risk?.toUpperCase() || "UNKNOWN"}
            </Badge>
          </Group>
        </Card>
      )}

      {/* Raw Message (Collapsible) */}
      <Card p="sm" withBorder>
        <details>
          <summary style={{ cursor: "pointer", fontSize: "0.875rem", color: "var(--mantine-color-dimmed)" }}>
            View Raw Message
          </summary>
          <Code block mt="xs" style={{ fontSize: "0.7rem", wordBreak: "break-all" }}>
            {typeof messageData.message === "string"
              ? messageData.message
              : Array.from(messageData.message)
                  .map((b) => b.toString(16).padStart(2, "0"))
                  .join(" ")}
          </Code>
        </details>
      </Card>

      {/* Action Buttons */}
      <Group grow>
        <Button
          variant="outline"
          color="red"
          leftSection={<IconX size={16} />}
          onClick={handleReject}
          disabled={isApproving || isRejecting}
          loading={isRejecting}
        >
          Reject
        </Button>
        <Button
          leftSection={<IconCheck size={16} />}
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
          loading={isApproving}
          style={{
            background: "linear-gradient(135deg, #14f195 0%, #0ea5e9 100%)",
          }}
        >
          Sign Message
        </Button>
      </Group>

      {/* Warning */}
      <Alert color="yellow" size="sm">
        <Text size="xs">
          ⚠️ Signing a message does not authorize a transaction. Only sign messages from trusted sources.
        </Text>
      </Alert>
    </Stack>
  );
}
