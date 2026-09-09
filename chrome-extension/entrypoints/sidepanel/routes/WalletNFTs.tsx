// entrypoints/sidepanel/routes/WalletNFTs.tsx
/**
 * Wallet NFTs View - TypeScript React Component
 * Displays user's NFT collection with cyberpunk styling
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
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconFilter,
  IconFlame,
  IconInboxOut,
  IconRefresh,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";

interface NFT {
  mint: string;
  name?: string;
  image?: string;
  collection?: string;
  isScam?: boolean;
  isSuspect?: boolean;
  isVerified?: boolean;
}

export default function WalletNFTs() {
  const navigate = useNavigate();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectActive, setSelectActive] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([]);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      setLoading(true);
      const response = await browser.runtime.sendMessage({
        type: "get_wallet_nfts",
      });

      if (response.success && response.nfts) {
        setNfts(Object.values(response.nfts.liquid || []));
      }
    } catch (error) {
      console.error("Error loading NFTs:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load NFTs",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = () => {
    setSelectActive(!selectActive);
    setSelectedNFTs([]);
  };

  const handleNFTClick = (mint: string) => {
    if (selectActive) {
      setSelectedNFTs((prev) =>
        prev.includes(mint)
          ? prev.filter((m) => m !== mint)
          : [...prev, mint]
      );
    } else {
      navigate(`/accounts/wallet/nfts/${mint}`);
    }
  };

  const bulkSend = () => {
    if (selectedNFTs.length > 0) {
      navigate("/accounts/wallet/send-nft", {
        state: { tokens: selectedNFTs },
      });
    }
  };

  const bulkBurn = () => {
    if (selectedNFTs.length > 0) {
      navigate("/accounts/wallet/burn-nft", {
        state: { tokens: selectedNFTs },
      });
    }
  };

  if (loading) {
    return (
      <Center style={{ minHeight: "400px" }}>
        <Stack align="center" gap="md">
          <Loader size="lg" color="#14F195" />
          <Text c="dimmed">Loading NFTs...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between">
        <Title
          order={1}
          style={{
            background: "linear-gradient(135deg, #14F195, #9945FF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          NFTs
        </Title>
        <Button
          onClick={toggleSelect}
          variant={selectActive ? "filled" : "outline"}
          leftSection={<IconFilter size={16} />}
          style={{
            borderColor: selectActive ? "#14F195" : "rgba(153, 69, 255, 0.3)",
            color: selectActive ? "#000" : "#f0f0f5",
            background: selectActive
              ? "linear-gradient(135deg, #14F195, #9945FF)"
              : "rgba(26, 26, 37, 0.8)",
          }}
        >
          SELECT
        </Button>
      </Group>

      {selectActive && selectedNFTs.length > 0 && (
        <Paper
          p="md"
          style={{
            background: "rgba(26, 26, 37, 0.8)",
            border: "1px solid rgba(153, 69, 255, 0.3)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Group justify="space-between">
            <Text fw={600}>
              Selected: <span style={{ color: "#14F195" }}>{selectedNFTs.length}</span>
            </Text>
            <Group gap="xs">
              <Button
                size="sm"
                color="red"
                leftSection={<IconFlame size={14} />}
                onClick={bulkBurn}
                style={{
                  border: "1px solid rgba(255, 68, 68, 0.5)",
                }}
              >
                BURN
              </Button>
              <Button
                size="sm"
                leftSection={<IconInboxOut size={14} />}
                onClick={bulkSend}
                style={{
                  background: "linear-gradient(135deg, #14F195, #9945FF)",
                  border: "1px solid rgba(153, 69, 255, 0.5)",
                }}
              >
                SEND
              </Button>
            </Group>
          </Group>
        </Paper>
      )}

      {nfts.length === 0 ? (
        <Paper
          p="xl"
          style={{
            background: "rgba(26, 26, 37, 0.8)",
            border: "1px solid rgba(153, 69, 255, 0.3)",
            backdropFilter: "blur(10px)",
            textAlign: "center",
          }}
        >
          <Text c="dimmed">No NFTs Detected</Text>
        </Paper>
      ) : (
        <Grid>
          {nfts.map((nft) => {
            const isSelected = selectedNFTs.includes(nft.mint);
            return (
              <Grid.Col key={nft.mint} span={6}>
                <Paper
                  p={0}
                  style={{
                    background: "rgba(26, 26, 37, 0.8)",
                    border: isSelected
                      ? "2px solid #14F195"
                      : "1px solid rgba(153, 69, 255, 0.3)",
                    backdropFilter: "blur(10px)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: isSelected
                      ? "0 0 20px rgba(20, 241, 149, 0.5)"
                      : "none",
                  }}
                  onClick={() => handleNFTClick(nft.mint)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "rgba(153, 69, 255, 0.5)";
                      e.currentTarget.style.boxShadow =
                        "0 0 20px rgba(153, 69, 255, 0.5), 0 0 20px rgba(20, 241, 149, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "rgba(153, 69, 255, 0.3)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingTop: "100%",
                      overflow: "hidden",
                    }}
                  >
                    {nft.image && (
                      <img
                        src={nft.image}
                        alt={nft.name || "NFT"}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: "absolute",
                        top: "7%",
                        left: "3%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      {nft.isScam && (
                        <Badge
                          color="red"
                          style={{
                            background: "rgba(255, 68, 68, 0.3)",
                            border: "1px solid rgba(255, 68, 68, 0.5)",
                            color: "#ff4444",
                          }}
                        >
                          SCAM
                        </Badge>
                      )}
                      {nft.isSuspect && (
                        <Badge
                          color="orange"
                          style={{
                            background: "rgba(255, 165, 0, 0.3)",
                            border: "1px solid rgba(255, 165, 0, 0.5)",
                            color: "#ffa500",
                          }}
                        >
                          POTENTIAL SCAM
                        </Badge>
                      )}
                      {!nft.isVerified && (
                        <Badge
                          variant="light"
                          style={{
                            background: "rgba(26, 26, 37, 0.8)",
                            border: "1px solid rgba(153, 69, 255, 0.3)",
                            color: "#8888a0",
                          }}
                        >
                          Unverified
                        </Badge>
                      )}
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          top: "3%",
                          left: "3%",
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: "#14F195",
                          border: "2px solid #9945FF",
                          boxShadow: "0 0 20px rgba(20, 241, 149, 0.6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 3,
                        }}
                      >
                        <Text size="xs" fw={700} c="#000">
                          ✓
                        </Text>
                      </div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "rgba(0, 0, 0, 0.85)",
                        backdropFilter: "blur(10px)",
                        borderTop: "1px solid rgba(153, 69, 255, 0.3)",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      <Text
                        size="sm"
                        fw={600}
                        style={{
                          color: "#f0f0f5",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {nft.name || nft.mint.substring(0, 8) + "..."}
                      </Text>
                    </div>
                  </div>
                </Paper>
              </Grid.Col>
            );
          })}
        </Grid>
      )}
    </Stack>
  );
}
