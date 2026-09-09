// entrypoints/sidepanel/components/ApproveTransaction.tsx
/**
 * Transaction Approval Component
 * Adapted from alpha-wallet, integrated with Solana GR00T desktop automation
 */

import { useState, useEffect } from "react";
import { Button, Card, Stack, Text, Code, Badge, Group, Alert } from "@mantine/core";
import { IconCheck, IconX, IconAlertTriangle, IconRobot, IconPlug } from "@tabler/icons-react";

interface TransactionData {
  transaction: string; // Base64 encoded transaction
  origin: string;
  requestId: number;
  tabId?: number;
}

interface ApproveTransactionProps {
  transactionData: TransactionData;
  onApprove: (transactionData: TransactionData) => Promise<void>;
  onReject: () => void;
}

export default function ApproveTransaction({
  transactionData,
  onApprove,
  onReject,
}: ApproveTransactionProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [desktopConnected, setDesktopConnected] = useState(false);
  const [autoExecutionEnabled, setAutoExecutionEnabled] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<{
    type?: string;
    amount?: string;
    recipient?: string;
    fee?: string;
    risk?: "low" | "medium" | "high";
  } | null>(null);

  useEffect(() => {
    // Check desktop connection status
    browser.runtime.sendMessage({ type: "get_status" }).then((status: {
      connected?: boolean;
      autoExecutionEnabled?: boolean;
    }) => {
      setDesktopConnected(status.connected ?? false);
      setAutoExecutionEnabled(status.autoExecutionEnabled ?? false);
    });

    // Listen for desktop connection changes
    const listener = (message: Record<string, unknown>) => {
      if (message.type === "connection_status") {
        setDesktopConnected((message.connected as boolean) ?? false);
      }
    };
    browser.runtime.onMessage.addListener(listener);

    // Analyze transaction (could be enhanced with desktop agent analysis)
    analyzeTransaction(transactionData.transaction);

    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }, [transactionData]);

  async function analyzeTransaction(transactionBase64: string) {
    // Send to desktop agent for analysis if connected
    if (desktopConnected) {
      try {
        const response = await browser.runtime.sendMessage({
          type: "analyze_transaction",
          transaction: transactionBase64,
          origin: transactionData.origin,
        });
        if (response?.analysis) {
          setTransactionDetails(response.analysis);
        }
      } catch (error) {
        console.error("Error analyzing transaction:", error);
      }
    }
  }

  async function handleApprove() {
    setIsApproving(true);
    try {
      // If desktop agent is connected and auto-execution is enabled, send to agent
      if (desktopConnected && autoExecutionEnabled) {
        await browser.runtime.sendMessage({
          type: "execute_transaction",
          transaction: transactionData.transaction,
          origin: transactionData.origin,
          requestId: transactionData.requestId,
        });
      }
      await onApprove(transactionData);
    } catch (error) {
      console.error("Error approving transaction:", error);
      alert("Failed to approve transaction");
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

  const riskColor = transactionDetails?.risk === "high" ? "red" :
    transactionDetails?.risk === "medium" ? "yellow" : "green";

  return (
    <Stack gap="md" p="md">
      {/* Header */}
      <Group justify="space-between" align="center">
        <Text size="xl" fw={700}>Approve Transaction</Text>
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
        title="Transaction Request"
        color="blue"
      >
        <Text size="sm">
          <strong>Origin:</strong> {transactionData.origin}
        </Text>
        {transactionDetails?.risk === "high" && (
          <Text size="sm" c="red" mt="xs">
            ⚠️ High risk transaction detected
          </Text>
        )}
      </Alert>

      {/* Desktop Agent Integration */}
      {desktopConnected && (
        <Card p="sm" withBorder>
          <Group gap="xs" mb="xs">
            <IconPlug size={16} />
            <Text size="sm" fw={600}>Desktop Automation</Text>
          </Group>
          {autoExecutionEnabled ? (
            <Alert color="yellow" size="sm">
              Auto-execution is enabled. This transaction will be automatically processed by the desktop agent.
            </Alert>
          ) : (
            <Text size="xs" c="dimmed">
              Desktop agent is connected but auto-execution is disabled.
            </Text>
          )}
        </Card>
      )}

      {/* Transaction Details */}
      <Card p="md" withBorder>
        <Stack gap="sm">
          <Text size="sm" fw={600}>Transaction Details</Text>
          {transactionDetails ? (
            <>
              {transactionDetails.type && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Type:</Text>
                  <Text size="sm">{transactionDetails.type}</Text>
                </Group>
              )}
              {transactionDetails.amount && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Amount:</Text>
                  <Text size="sm" fw={600}>{transactionDetails.amount}</Text>
                </Group>
              )}
              {transactionDetails.recipient && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Recipient:</Text>
                  <Code size="xs">{transactionDetails.recipient.slice(0, 8)}...{transactionDetails.recipient.slice(-8)}</Code>
                </Group>
              )}
              {transactionDetails.fee && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Fee:</Text>
                  <Text size="sm">{transactionDetails.fee}</Text>
                </Group>
              )}
              {transactionDetails.risk && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Risk Level:</Text>
                  <Badge color={riskColor} size="sm">
                    {transactionDetails.risk.toUpperCase()}
                  </Badge>
                </Group>
              )}
            </>
          ) : (
            <Text size="xs" c="dimmed">
              Analyzing transaction...
            </Text>
          )}
        </Stack>
      </Card>

      {/* Raw Transaction (Collapsible) */}
      <Card p="sm" withBorder>
        <details>
          <summary style={{ cursor: "pointer", fontSize: "0.875rem", color: "var(--mantine-color-dimmed)" }}>
            View Raw Transaction
          </summary>
          <Code block mt="xs" style={{ fontSize: "0.7rem", wordBreak: "break-all" }}>
            {transactionData.transaction}
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
          Approve
        </Button>
      </Group>

      {/* Auto-execution Warning */}
      {desktopConnected && autoExecutionEnabled && (
        <Alert color="yellow" size="sm">
          <Text size="xs">
            ⚠️ Auto-execution is enabled. Approving will immediately execute this transaction via the desktop agent.
          </Text>
        </Alert>
      )}
    </Stack>
  );
}
