// entrypoints/sidepanel/routes/TrustedSites.tsx
/**
 * Trusted Sites Management
 * Adapted from alpha-wallet, integrated with Solana GR00T desktop automation
 */

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Stack,
  Text,
  Group,
  Badge,
  Switch,
  TextInput,
  ActionIcon,
  Alert,
  Table,
  Modal,
} from "@mantine/core";
import { IconTrash, IconPlus, IconRobot, IconShield, IconAlertTriangle } from "@tabler/icons-react";
import { useLoaderData, useFetcher } from "react-router-dom";

interface TrustedSite {
  origin: string;
  allowed: boolean;
  maxSpend?: number;
  tokenFilters?: string[];
  autoApprove?: boolean;
  desktopAgentIntegration?: boolean;
  createdAt: number;
  lastUsed?: number;
}

export async function loader() {
  // Load trusted sites from storage
  const result = await browser.storage.local.get("trustedSites");
  const trustedSites: Record<string, TrustedSite> = result.trustedSites || {};
  return { trustedSites: Object.entries(trustedSites).map(([origin, site]) => ({ origin, ...site })) };
}

export default function TrustedSites() {
  const { trustedSites: initialSites } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const [trustedSites, setTrustedSites] = useState<TrustedSite[]>(initialSites);
  const [desktopConnected, setDesktopConnected] = useState(false);
  const [newSiteModalOpen, setNewSiteModalOpen] = useState(false);
  const [newSiteOrigin, setNewSiteOrigin] = useState("");
  const fetcher = useFetcher();

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

    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }, []);

  async function saveTrustedSites(sites: TrustedSite[]) {
    const sitesMap: Record<string, TrustedSite> = {};
    sites.forEach((site) => {
      sitesMap[site.origin] = site;
    });
    await browser.storage.local.set({ trustedSites: sitesMap });
    setTrustedSites(sites);
  }

  async function addTrustedSite(origin: string) {
    const newSite: TrustedSite = {
      origin,
      allowed: true,
      createdAt: Date.now(),
      desktopAgentIntegration: desktopConnected,
    };
    await saveTrustedSites([...trustedSites, newSite]);
    setNewSiteModalOpen(false);
    setNewSiteOrigin("");
  }

  async function removeTrustedSite(origin: string) {
    await saveTrustedSites(trustedSites.filter((site) => site.origin !== origin));
  }

  async function updateTrustedSite(origin: string, updates: Partial<TrustedSite>) {
    await saveTrustedSites(
      trustedSites.map((site) =>
        site.origin === origin ? { ...site, ...updates } : site
      )
    );
  }

  return (
    <Stack gap="md" p="md">
      {/* Header */}
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconShield size={24} />
          <Text size="xl" fw={700}>Trusted Sites</Text>
        </Group>
        {desktopConnected && (
          <Badge
            leftSection={<IconRobot size={14} />}
            color="green"
            variant="light"
          >
            Desktop Agent Active
          </Badge>
        )}
      </Group>

      {/* Info Alert */}
      <Alert icon={<IconAlertTriangle size={16} />} color="blue" title="Trusted Sites">
        <Text size="sm">
          Manage websites that can automatically connect to your wallet. Trusted sites can request
          transactions and messages without manual approval.
        </Text>
        {desktopConnected && (
          <Text size="xs" mt="xs" c="dimmed">
            Desktop agent integration allows for enhanced security analysis and automated transaction handling.
          </Text>
        )}
      </Alert>

      {/* Add New Site */}
      <Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setNewSiteModalOpen(true)}
          style={{
            background: "linear-gradient(135deg, #14f195 0%, #0ea5e9 100%)",
          }}
        >
          Add Trusted Site
        </Button>
      </Group>

      {/* Trusted Sites List */}
      {trustedSites.length === 0 ? (
        <Card p="xl" withBorder>
          <Text ta="center" c="dimmed">
            No trusted sites configured. Add a site to allow automatic connections.
          </Text>
        </Card>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Origin</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Auto-Approve</Table.Th>
              <Table.Th>Desktop Agent</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {trustedSites.map((site) => (
              <Table.Tr key={site.origin}>
                <Table.Td>
                  <Text size="sm" style={{ fontFamily: "monospace" }}>
                    {site.origin}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={site.allowed ? "green" : "red"} size="sm">
                    {site.allowed ? "Allowed" : "Blocked"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Switch
                    checked={site.autoApprove ?? false}
                    onChange={(e) =>
                      updateTrustedSite(site.origin, { autoApprove: e.currentTarget.checked })
                    }
                    size="sm"
                  />
                </Table.Td>
                <Table.Td>
                  {site.desktopAgentIntegration ? (
                    <Badge color="green" size="sm" leftSection={<IconRobot size={12} />}>
                      Integrated
                    </Badge>
                  ) : (
                    <Text size="xs" c="dimmed">Not integrated</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Switch
                      checked={site.allowed}
                      onChange={(e) =>
                        updateTrustedSite(site.origin, { allowed: e.currentTarget.checked })
                      }
                      size="sm"
                    />
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => removeTrustedSite(site.origin)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {/* Add Site Modal */}
      <Modal
        opened={newSiteModalOpen}
        onClose={() => setNewSiteModalOpen(false)}
        title="Add Trusted Site"
      >
        <Stack gap="md">
          <TextInput
            label="Origin (e.g., https://example.com)"
            placeholder="https://example.com"
            value={newSiteOrigin}
            onChange={(e) => setNewSiteOrigin(e.currentTarget.value)}
            required
          />
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setNewSiteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addTrustedSite(newSiteOrigin)}
              disabled={!newSiteOrigin}
              style={{
                background: "linear-gradient(135deg, #14f195 0%, #0ea5e9 100%)",
              }}
            >
              Add Site
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
