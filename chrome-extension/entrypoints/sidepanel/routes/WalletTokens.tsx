// entrypoints/sidepanel/routes/WalletTokens.tsx
/**
 * Wallet Tokens View - TypeScript React Component
 * Displays user's token portfolio with cyberpunk styling
 */

import { useState, useEffect } from "react";
import {
  Stack,
  Group,
  Title,
  Text,
  Button,
  Paper,
  Grid,
  Badge,
  Loader,
  Center,
} from "@mantine/core";
import { IconInbox, IconInboxOut, IconRefresh } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";

interface Token {
  mint: string;
  amount: {
    uiAmount: number;
    decimals: number;
  };
  meta?: {
    data?: {
      name?: string;
      symbol?: string;
      uri?: string;
    };
  };
}

interface TokenPrice {
  [mint: string]: number;
}

export default function WalletTokens() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokenPrices, setTokenPrices] = useState<TokenPrice>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [walletName, setWalletName] = useState("Wallet");

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      setLoading(true);
      // Get tokens from wallet manager
      const response = await browser.runtime.sendMessage({
        type: "get_wallet_tokens",
      });

      if (response.success && response.tokens) {
        const sorted = Object.values(response.tokens.liquid || []).sort(
          (a: Token, b: Token) => {
            const priceA = tokenPrices[a.mint] || 0;
            const priceB = tokenPrices[b.mint] || 0;
            return b.amount.uiAmount * priceB - a.amount.uiAmount * priceA;
          }
        ) as Token[];

        setTokens(sorted);

        // Calculate total price
        const total = sorted.reduce((sum, token) => {
          return sum + token.amount.uiAmount * (tokenPrices[token.mint] || 0);
        }, 0);
        setTotalPrice(total);
      }

      // Get prices
      const priceResponse = await browser.runtime.sendMessage({
        type: "get_token_prices",
      });

      if (priceResponse.success && priceResponse.prices) {
        setTokenPrices(priceResponse.prices);
      }

      // Get wallet name
      const walletResponse = await browser.runtime.sendMessage({
        type: "get_active_wallet_name",
      });

      if (walletResponse.success && walletResponse.name) {
        setWalletName(walletResponse.name);
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load tokens",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center style={{ minHeight: "400px" }}>
        <Stack align="center" gap="md">
          <Loader size="lg" color="#14F195" />
          <Text c="dimmed">Loading tokens...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="lg" p="md">
      <Title
        order={5}
        style={{
          background: "linear-gradient(135deg, #14F195, #9945FF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Welcome Back, {walletName}!
      </Title>

      <Title
        order={1}
        style={{
          fontSize: "2.5em",
          background: "linear-gradient(135deg, #14F195, #9945FF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {totalPrice.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })}
      </Title>

      <Group gap="md">
        <Button
          component={Link}
          to="/accounts/wallet/deposit"
          leftSection={<IconInbox size={16} />}
          style={{
            background: "linear-gradient(135deg, #14F195, #9945FF)",
            border: "1px solid rgba(153, 69, 255, 0.5)",
            boxShadow: "0 0 20px rgba(153, 69, 255, 0.4)",
            flex: 1,
          }}
        >
          Deposit
        </Button>
        <Button
          component={Link}
          to="/accounts/wallet/send"
          leftSection={<IconInboxOut size={16} />}
          style={{
            background: "linear-gradient(135deg, #14F195, #9945FF)",
            border: "1px solid rgba(153, 69, 255, 0.5)",
            boxShadow: "0 0 20px rgba(153, 69, 255, 0.4)",
            flex: 1,
          }}
        >
          Send
        </Button>
      </Group>

      {tokens.length === 0 ? (
        <Paper
          p="xl"
          style={{
            background: "rgba(26, 26, 37, 0.8)",
            border: "1px solid rgba(153, 69, 255, 0.3)",
            backdropFilter: "blur(10px)",
            textAlign: "center",
          }}
        >
          <Stack gap="md">
            <Text c="dimmed">No Token Assets Detected</Text>
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={loadTokens}
              style={{
                background: "linear-gradient(135deg, #14F195, #9945FF)",
                border: "1px solid rgba(153, 69, 255, 0.5)",
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Grid>
          {tokens.map((token) => {
            const price = tokenPrices[token.mint] || 0;
            const usdValue = token.amount.uiAmount * price;
            const tokenName =
              token.meta?.data?.name ||
              token.mint.substring(0, 8) + "..." + token.mint.slice(-8);
            const symbol = token.meta?.data?.symbol || "TOKEN";

            return (
              <Grid.Col key={token.mint} span={12}>
                <Paper
                  p="md"
                  style={{
                    background: "rgba(26, 26, 37, 0.8)",
                    border: "1px solid rgba(153, 69, 255, 0.3)",
                    backdropFilter: "blur(10px)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onClick={() =>
                    navigate(`/accounts/wallet/tokens/${token.mint}`)
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(153, 69, 255, 0.5)";
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(153, 69, 255, 0.5), 0 0 20px rgba(20, 241, 149, 0.3)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(153, 69, 255, 0.3)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Stack gap={0}>
                        <Text
                          fw={600}
                          style={{
                            background: "linear-gradient(135deg, #14F195, #9945FF)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          {tokenName}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {symbol}
                        </Text>
                      </Stack>
                      <Stack gap={0} align="flex-end">
                        <Text fw={600} c="#14F195">
                          {token.amount.uiAmount.toLocaleString("en-US", {
                            maximumFractionDigits: 3,
                          })}
                        </Text>
                        {usdValue > 0 && (
                          <Text size="sm" c="dimmed">
                            {usdValue.toLocaleString("en-US", {
                              style: "currency",
                              currency: "USD",
                            })}
                          </Text>
                        )}
                      </Stack>
                    </Group>
                  </Stack>
                </Paper>
              </Grid.Col>
            );
          })}
        </Grid>
      )}
    </Stack>
  );
}
