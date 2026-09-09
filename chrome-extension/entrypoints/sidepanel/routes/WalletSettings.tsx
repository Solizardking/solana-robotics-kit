// entrypoints/sidepanel/routes/WalletSettings.tsx
/**
 * Wallet Settings View - TypeScript React Component
 * Settings management with cyberpunk styling
 */

import { Stack, Title, Button, Group, Paper } from "@mantine/core";
import { Link } from "react-router-dom";
import {
  IconWallet,
  IconShield,
  IconServer,
  IconClock,
  IconWorld,
  IconPlug,
  IconCreditCard,
  IconKey,
} from "@tabler/icons-react";

export default function WalletSettings() {
  return (
    <Stack gap="md" p="md">
      <Title
        order={1}
        style={{
          background: "linear-gradient(135deg, #14F195, #9945FF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Settings
      </Title>

      <Stack gap="sm">
        <Button
          component={Link}
          to="/accounts/wallet/settings/wallet-name"
          leftSection={<IconWallet size={16} />}
          variant="outline"
          fullWidth
          justify="flex-start"
          style={{
            background: "rgba(26, 26, 37, 0.8)",
            border: "1px solid rgba(153, 69, 255, 0.3)",
            color: "#f0f0f5",
            backdropFilter: "blur(10px)",
          }}
        >
          Wallet
        </Button>

        <Button
          component={Link}
          to="/accounts/wallet/settings/trusted-apps"
          leftSection={<IconShield size={16} />}
          variant="outline"
          fullWidth
          justify="flex-start"
          style={{
            background: "rgba(26, 26, 37, 0.8)",
            border: "1px solid rgba(153, 69, 255, 0.3)",
            color: "#f0f0f5",
            backdropFilter: "blur(10px)",
          }}
        >
          Trusted Apps
        </Button>

        <Button
          component={Link}
          to="/accounts/wallet/settings/rpc"
          leftSection={<IconServer size={16} />}
          variant="outline"
          fullWidth
          justify="flex-start"
          style={{
            background: "rgba(26, 26, 37, 0.8)",
            border: "1px solid rgba(153, 69, 255, 0.3)",
            color: "#f0f0f5",
            backdropFilter: "blur(10px)",
          }}
        >
          RPC
        </Button>

        <Button
          component={Link}
          to="/accounts/wallet/settings/lock-timeout"
          leftSection={<IconClock size={16} />}
          variant="outline"
          fullWidth
          justify="flex-start"
          style={{
            background: "rgba(26, 26, 37, 0.8)",
            border: "1px solid rgba(153, 69, 255, 0.3)",
            color: "#f0f0f5",
            backdropFilter: "blur(10px)",
          }}
        >
          Lock Timeout
        </Button>

        <Button
          component={Link}
          to="/accounts/wallet/settings/default-explorer"
          leftSection={<IconWorld size={16} />}
          variant="outline"
          fullWidth
          justify="flex-start"
          style={{
            background: "rgba(26, 26, 37, 0.8)",
            border: "1px solid rgba(153, 69, 255, 0.3)",
            color: "#f0f0f5",
            backdropFilter: "blur(10px)",
          }}
        >
          Default Explorer
        </Button>

        <Button
          component={Link}
          to="/accounts/wallet/settings/plugins"
          leftSection={<IconPlug size={16} />}
          variant="outline"
          fullWidth
          justify="flex-start"
          style={{
            background: "rgba(26, 26, 37, 0.8)",
            border: "1px solid rgba(153, 69, 255, 0.3)",
            color: "#f0f0f5",
            backdropFilter: "blur(10px)",
          }}
        >
          Enabled Plugins
        </Button>

        <Button
          component={Link}
          to="/accounts/wallet/settings/credits"
          leftSection={<IconCreditCard size={16} />}
          variant="outline"
          fullWidth
          justify="flex-start"
          style={{
            background: "rgba(26, 26, 37, 0.8)",
            border: "1px solid rgba(153, 69, 255, 0.3)",
            color: "#f0f0f5",
            backdropFilter: "blur(10px)",
          }}
        >
          Credits
        </Button>
      </Stack>

      <Paper
        p="md"
        mt="md"
        style={{
          background: "rgba(255, 68, 68, 0.1)",
          border: "1px solid rgba(255, 68, 68, 0.3)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Button
          component={Link}
          to="/accounts/wallet/settings/export-key"
          leftSection={<IconKey size={16} />}
          color="red"
          variant="outline"
          fullWidth
          justify="flex-start"
          style={{
            border: "2px solid rgba(255, 68, 68, 0.5)",
            color: "#ff4444",
          }}
        >
          Export Private Key
        </Button>
      </Paper>
    </Stack>
  );
}
