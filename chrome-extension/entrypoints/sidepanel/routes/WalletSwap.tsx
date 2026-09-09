// entrypoints/sidepanel/routes/WalletSwap.tsx
/**
 * Wallet Swap View - TypeScript React Component
 * Wallet selection/switching with cyberpunk styling
 */

import { useState, useEffect } from "react";
import {
  Stack,
  Title,
  Button,
  Paper,
  Grid,
  Text,
  Loader,
  Center,
  Badge,
  Group,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { notifications } from "@mantine/notifications";

interface Namespace {
  name: string;
  address: string;
  isActive?: boolean;
}

export default function WalletSwap() {
  const navigate = useNavigate();
  const location = useLocation();
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);
  const redirectTo = (location.state as { redirect_to?: string })?.redirect_to;

  useEffect(() => {
    const loadWallets = async () => {
      try {
        setLoading(true);
        const response = await browser.runtime.sendMessage({
          type: "get_wallet_namespaces",
        });

        if (response.success && response.namespaces) {
          setNamespaces(response.namespaces);
        }
      } catch (error) {
        console.error("Error loading wallets:", error);
        notifications.show({
          title: "Error",
          message: "Failed to load wallets",
          color: "red",
        });
      } finally {
        setLoading(false);
      }
    };

    loadWallets();
  }, []);


  const handleWalletClick = async (namespace: string) => {
    try {
      const response = await browser.runtime.sendMessage({
        type: "set_active_namespace",
        namespace,
      });

      if (response.success) {
        if (redirectTo) {
          navigate(`/accounts/wallet/${redirectTo}`);
        } else {
          navigate("/accounts/wallet/tokens");
        }
      }
    } catch (error) {
      console.error("Error switching wallet:", error);
      notifications.show({
        title: "Error",
        message: "Failed to switch wallet",
        color: "red",
      });
    }
  };

  if (loading) {
    return (
      <Center style={{ minHeight: "400px" }}>
        <Stack align="center" gap="md">
          <Loader size="lg" color="#14F195" />
          <Text c="dimmed">Loading wallets...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="lg" p="md">
      <Title
        order={1}
        style={{
          background: "linear-gradient(135deg, #14F195, #9945FF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Wallets
      </Title>

      {namespaces.length === 0 && (
        <Paper
          p="xl"
          style={{
            background: "rgba(26, 26, 37, 0.8)",
            border: "1px solid rgba(153, 69, 255, 0.3)",
            backdropFilter: "blur(10px)",
            textAlign: "center",
          }}
        >
          <Text c="dimmed" mb="md">
            No wallets found, to get started click below
          </Text>
        </Paper>
      )}

      <Grid>
        {namespaces.map((ns) => (
          <Grid.Col key={ns.address} span={12}>
            <Paper
              p="md"
              style={{
                background: ns.isActive
                  ? "rgba(20, 241, 149, 0.1)"
                  : "rgba(26, 26, 37, 0.8)",
                border: ns.isActive
                  ? "2px solid #14F195"
                  : "1px solid rgba(153, 69, 255, 0.3)",
                backdropFilter: "blur(10px)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
                boxShadow: ns.isActive
                  ? "0 0 20px rgba(20, 241, 149, 0.5)"
                  : "none",
              }}
              onClick={() => handleWalletClick(ns.name)}
              onMouseEnter={(e) => {
                if (!ns.isActive) {
                  e.currentTarget.style.borderColor = "rgba(153, 69, 255, 0.5)";
                  e.currentTarget.style.boxShadow =
                    "0 0 20px rgba(153, 69, 255, 0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!ns.isActive) {
                  e.currentTarget.style.borderColor = "rgba(153, 69, 255, 0.3)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text
                    fw={600}
                    style={{
                      background: "linear-gradient(135deg, #14F195, #9945FF)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {ns.name}
                  </Text>
                  {ns.isActive && (
                    <Badge
                      color="green"
                      style={{
                        background: "rgba(20, 241, 149, 0.2)",
                        border: "1px solid #14F195",
                        color: "#14F195",
                      }}
                    >
                      Active
                    </Badge>
                  )}
                </Group>
                <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
                  {ns.address.substring(0, 8)}...{ns.address.slice(-8)}
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
        ))}
      </Grid>

      <Button
        component={Link}
        to="/accounts/create-wallet"
        leftSection={<IconPlus size={16} />}
        fullWidth
        size="lg"
        style={{
          background: "linear-gradient(135deg, #14F195, #9945FF)",
          border: "1px solid rgba(153, 69, 255, 0.5)",
          boxShadow: "0 0 20px rgba(153, 69, 255, 0.4)",
        }}
      >
        New/Add Wallet
      </Button>
    </Stack>
  );
}
