import type { InjectedEvent } from "../injected/events";
import type { SidePanelEvent } from "../sidepanel/events";
import { makeConnectionSubmitForwardedEvent } from "./events";
import type { Address } from "@solana/addresses";

// WebSocket connection to desktop agent
let desktopConnection: WebSocket | null = null;
let isDesktopConnected = false;
let connectionUrl = "ws://localhost:8765";
let apiKey = "";
let voiceEnabled = false;
let visionEnabled = false;
let autoExecutionEnabled = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const DEFAULT_RPC_URL = "https://ancient-burned-friday.solana-mainnet.quiknode.pro/bc8308dfa6d609f531f014aeee4ca28e16934efb/";

type SidePanel = {
  setOptions({
    path,
    enabled,
  }: {
    path: string;
    enabled: boolean;
  }): Promise<void>;

  open({ tabId }: { tabId: number }): Promise<void>;

  setPanelBehavior({
    openPanelOnActionClick,
  }: {
    openPanelOnActionClick: boolean;
  }): Promise<void>;
};

type OpenSidePanelInput = {
  event: InjectedEvent;
  tabId: number;
  forOrigin: string;
};

function openSidePanel({ event, tabId, forOrigin }: OpenSidePanelInput) {
  if (event.type === "requestConnection") {
    const encodedForOrigin = encodeURIComponent(forOrigin);

    const url = `/sidepanel.html?connect=1&tabId=${tabId}&requestId=${event.requestId}&forOrigin=${encodedForOrigin}`;

    const sidePanel = (browser as { sidePanel?: unknown })
      .sidePanel as unknown as SidePanel;

    sidePanel.setOptions({
      path: url,
      enabled: true,
    });

    sidePanel
      .open({
        tabId,
      })
      .catch((e) => {
        console.error("error opening sidepanel", e);
        // failed to open side panel, for now don't provide a popup fallback
      });
  }
}

// Initialize default RPC_URL and connect to desktop
async function initializeDefaults() {
  // Set default RPC_URL if not already set
  const stored = await browser.storage.local.get("RPC_URL");
  if (!stored.RPC_URL) {
    await browser.storage.local.set({ RPC_URL: DEFAULT_RPC_URL });
    console.log("Set default RPC_URL:", DEFAULT_RPC_URL);
  }

  // Set default HELIUS_RPC_URL if not already set
  const heliusStored = await browser.storage.local.get("HELIUS_RPC_URL");
  if (!heliusStored.HELIUS_RPC_URL) {
    await browser.storage.local.set({ HELIUS_RPC_URL: "https://mainnet.helius-rpc.com" });
    console.log("Set default HELIUS_RPC_URL: https://mainnet.helius-rpc.com");
  }

  // Note: XAI_API_KEY should be set by user, no default value

  // Load saved settings
  const settings = await browser.storage.local.get([
    "connectionUrl",
    "apiKey",
    "voiceEnabled",
    "visionEnabled",
    "autoExecutionEnabled",
  ]);
  
  connectionUrl = (settings.connectionUrl as string | undefined) || "ws://localhost:8765";
  apiKey = (settings.apiKey as string | undefined) || "";
  voiceEnabled = (settings.voiceEnabled as boolean | undefined) || false;
  visionEnabled = (settings.visionEnabled as boolean | undefined) || false;
  autoExecutionEnabled = (settings.autoExecutionEnabled as boolean | undefined) || false;
  
  console.log("Settings loaded:", {
    connectionUrl,
    voiceEnabled,
    visionEnabled,
    autoExecutionEnabled,
  });

  // Auto-connect to desktop agent
  connectToDesktop();
}

// WebSocket connection management
function connectToDesktop() {
  if (desktopConnection && desktopConnection.readyState === WebSocket.OPEN) {
    console.log("Already connected to desktop agent");
    return;
  }

  console.log(`Connecting to desktop agent at ${connectionUrl}...`);

  try {
    desktopConnection = new WebSocket(connectionUrl);

    desktopConnection.onopen = () => {
      console.log("Connected to desktop agent");
      isDesktopConnected = true;
      reconnectAttempts = 0;

      // Authenticate
      sendToDesktop({
        type: "auth",
        apiKey: apiKey,
      });

      // Notify popup
      broadcastMessage({ type: "connection_status", connected: true });
    };

    desktopConnection.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleDesktopMessage(message);
      } catch (error) {
        console.error("Error parsing message from desktop:", error);
      }
    };

    desktopConnection.onerror = (error) => {
      console.error("WebSocket error:", error);
      isDesktopConnected = false;
      const errorMessage = "Connection failed. Make sure the desktop agent is running.";
      broadcastMessage({
        type: "connection_error",
        error: errorMessage,
        suggestion: "Start the desktop agent with: python solana_trading_desktop.py",
      });
    };

    desktopConnection.onclose = () => {
      console.log("Disconnected from desktop agent");
      isDesktopConnected = false;
      broadcastMessage({ type: "connection_status", connected: false });

      // Attempt reconnection
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        setTimeout(connectToDesktop, delay);
      }
    };
  } catch (error) {
    console.error("Error creating WebSocket connection:", error);
    isDesktopConnected = false;
  }
}

function disconnectFromDesktop() {
  if (desktopConnection) {
    desktopConnection.close();
    desktopConnection = null;
    isDesktopConnected = false;
  }
}

function sendToDesktop(message: Record<string, unknown>): boolean {
  if (desktopConnection && desktopConnection.readyState === WebSocket.OPEN) {
    desktopConnection.send(JSON.stringify(message));
    return true;
  } else {
    console.error("Cannot send message - not connected to desktop");
    return false;
  }
}

// Message handlers for desktop agent
function handleDesktopMessage(message: Record<string, unknown>) {
  console.log("Message from desktop:", message.type);

  switch (message.type) {
    case "auth_success":
      console.log("Authentication successful");
      broadcastMessage({ type: "auth_success" });
      break;

    case "auth_failed":
      console.error("Authentication failed");
      broadcastMessage({ type: "auth_failed", reason: message.reason });
      break;

    case "analysis_result":
      // Handle analysis results (website, transaction, message)
      if (message.analysis) {
        broadcastMessage({
          type: "analysis_result",
          analysis: message.analysis,
          requestId: message.requestId,
        });
      }
      broadcastToActiveTab({
        type: "show_analysis",
        analysis: message.analysis,
      });
      break;

    case "transaction_result":
      broadcastMessage({
        type: "transaction_result",
        status: message.status,
        signature: message.signature,
        error: message.error,
        requestId: message.requestId,
      });
      break;

    case "trade_executed":
      broadcastMessage({
        type: "trade_notification",
        trade: message.trade,
      });
      // Show notification
      browser.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Trade Executed",
        message: `${(message.trade as { action?: string }).action || "Trade"} ${(message.trade as { amount?: string }).amount || ""} ${(message.trade as { symbol?: string }).symbol || ""}`,
        priority: 2,
      });
      break;

    case "voice_transcript":
      broadcastMessage({
        type: "voice_transcript",
        text: message.text,
        confidence: message.confidence,
      });
      break;

    case "code_result":
      broadcastMessage({
        type: "code_result",
        result: message.result,
        error: message.error,
      });
      break;

    case "alert": {
      const title = (message.title as string | undefined) || "Alert";
      const alertMessage = (message.message as string | undefined) || "";
      browser.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: title,
        message: alertMessage,
        priority: 2,
      });
      break;
    }

    default:
      broadcastMessage(message);
  }
}

// Message broadcasting
function broadcastMessage(message: Record<string, unknown>) {
  // Send to popup
  browser.runtime.sendMessage(message).catch(() => {
    // Popup not open, ignore
  });

  // Send to all tabs
  browser.tabs.query({}).then((tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        browser.tabs.sendMessage(tab.id, message).catch(() => {
          // Tab doesn't have content script, ignore
        });
      }
    });
  });
}

function broadcastToActiveTab(message: Record<string, unknown>) {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    if (tabs[0]?.id) {
      browser.tabs.sendMessage(tabs[0].id, message).catch((error) => {
        console.error("Error sending to active tab:", error);
      });
    }
  });
}

function main() {
  // Initialize defaults on startup
  initializeDefaults();

  // Load saved settings on install
  browser.runtime.onInstalled.addListener(() => {
    console.log("Solana GR00T Extension installed");
    browser.storage.local
      .get(["connectionUrl", "apiKey", "voiceEnabled", "visionEnabled", "autoExecutionEnabled"])
      .then((result) => {
        connectionUrl = (result.connectionUrl as string | undefined) || "ws://localhost:8765";
        apiKey = (result.apiKey as string | undefined) || "";
        voiceEnabled = (result.voiceEnabled as boolean | undefined) || false;
        visionEnabled = (result.visionEnabled as boolean | undefined) || false;
        autoExecutionEnabled = (result.autoExecutionEnabled as boolean | undefined) || false;
        console.log("Settings loaded:", {
          connectionUrl,
          voiceEnabled,
          visionEnabled,
          autoExecutionEnabled,
        });
      });
  });

  browser.runtime.onMessage.addListener(async (request: Record<string, unknown>, sender: chrome.runtime.MessageSender) => {
    // Handle WebSocket/trading messages from popup
    switch (request.type) {
      case "connect": {
        const url = request.url as string | undefined;
        const key = request.apiKey as string | undefined;
        connectionUrl = url || connectionUrl;
        apiKey = key || apiKey;
        connectToDesktop();
        return Promise.resolve({ success: true });
      }

      case "disconnect":
        disconnectFromDesktop();
        return Promise.resolve({ success: true });

      case "get_status":
        return Promise.resolve({
          connected: isDesktopConnected,
          connectionUrl: connectionUrl,
          voiceEnabled: voiceEnabled,
          visionEnabled: visionEnabled,
          autoExecutionEnabled: autoExecutionEnabled,
        });

      case "update_settings": {
        const settings = request.settings as {
          voiceEnabled?: boolean;
          visionEnabled?: boolean;
          autoExecutionEnabled?: boolean;
        } | undefined;
        if (settings) {
          voiceEnabled = settings.voiceEnabled ?? voiceEnabled;
          visionEnabled = settings.visionEnabled ?? visionEnabled;
          autoExecutionEnabled = settings.autoExecutionEnabled ?? autoExecutionEnabled;
          browser.storage.local.set({
            voiceEnabled,
            visionEnabled,
            autoExecutionEnabled,
          });
        }
        return Promise.resolve({ success: true });
      }

      case "analyze_chart":
        if (
          sendToDesktop({
            type: "analyze_chart",
            image: request.image,
            pair: request.pair,
            timeframe: request.timeframe,
          })
        ) {
          return Promise.resolve({ success: true });
        } else {
          return Promise.resolve({ success: false, error: "Not connected to desktop" });
        }

      case "execute_trade":
        if (
          sendToDesktop({
            type: "execute_trade",
            symbol: request.symbol,
            action: request.action,
            amount: request.amount,
            options: request.options,
          })
        ) {
          return Promise.resolve({ success: true });
        } else {
          return Promise.resolve({ success: false, error: "Not connected to desktop" });
        }

      case "get_balance":
        if (sendToDesktop({ type: "get_balance" })) {
          return Promise.resolve({ success: true });
        } else {
          return Promise.resolve({ success: false, error: "Not connected to desktop" });
        }

      case "get_positions":
        if (sendToDesktop({ type: "get_positions" })) {
          return Promise.resolve({ success: true });
        } else {
          return Promise.resolve({ success: false, error: "Not connected to desktop" });
        }

      case "voice_command":
        if (
          sendToDesktop({
            type: "voice_command",
            command: request.command,
            audioData: request.audioData,
          })
        ) {
          return Promise.resolve({ success: true });
        } else {
          return Promise.resolve({ success: false, error: "Not connected to desktop" });
        }

      case "execute_code":
        if (
          sendToDesktop({
            type: "execute_code",
            code: request.code,
            language: request.language || "python",
          })
        ) {
          return Promise.resolve({ success: true });
        } else {
          return Promise.resolve({ success: false, error: "Not connected to desktop" });
        }

      case "vibe_code":
        if (
          sendToDesktop({
            type: "vibe_code",
            prompt: request.prompt,
            context: request.context,
          })
        ) {
          return Promise.resolve({ success: true });
        } else {
          return Promise.resolve({ success: false, error: "Not connected to desktop" });
        }

      case "emergency_stop":
        if (sendToDesktop({ type: "emergency_stop" })) {
          browser.notifications.create({
            type: "basic",
            iconUrl: "icons/icon128.png",
            title: "Emergency Stop",
            message: "All trading has been stopped",
            priority: 2,
          });
          return Promise.resolve({ success: true });
        } else {
          return Promise.resolve({ success: false, error: "Not connected to desktop" });
        }

      case "get_stats":
        // Return stats (placeholder for now)
        return Promise.resolve({
          success: true,
          stats: {
            pnl: 0,
            winRate: 0,
            totalTrades: 0,
            activePositions: 0,
          },
        });

      case "create_wallet": {
        return (async () => {
          const { createWallet } = await import("~/wallet/walletManager");
          const options = request.options as {
            label?: string;
            isAgentWallet?: boolean;
            notes?: string;
            tags?: string[];
          } | undefined;
          
          try {
            const walletInfo = await createWallet(options);
            return { success: true, wallet: walletInfo };
          } catch (error) {
            console.error("Error creating wallet:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })();
      }

      case "create_agent_wallet": {
        return (async () => {
          const { createAgentWallet } = await import("~/wallet/walletManager");
          const options = request.options as {
            label?: string;
            notes?: string;
            tags?: string[];
          } | undefined;
          
          try {
            const walletInfo = await createAgentWallet(options);
            return { success: true, wallet: walletInfo };
          } catch (error) {
            console.error("Error creating agent wallet:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })();
      }

      case "get_managed_wallets": {
        return (async () => {
          const { getAllManagedWallets } = await import("~/wallet/walletManager");
          try {
            const wallets = await getAllManagedWallets();
            return { success: true, wallets };
          } catch (error) {
            console.error("Error getting managed wallets:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })();
      }

      case "get_agent_wallets": {
        return (async () => {
          const { getAgentWallets } = await import("~/wallet/walletManager");
          try {
            const wallets = await getAgentWallets();
            return { success: true, wallets };
          } catch (error) {
            console.error("Error getting agent wallets:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })();
      }

      case "sign_message": {
        return (async () => {
          const { signMessage } = await import("~/wallet/walletManager");
          const address = request.address as string;
          const message = request.message as Uint8Array;
          
          try {
            const signature = await signMessage(address as Address, message);
            return { success: true, signature };
          } catch (error) {
            console.error("Error signing message:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })();
      }

      case "analyze_transaction":
        if (
          sendToDesktop({
            type: "analyze_transaction",
            transaction: request.transaction as string,
            origin: request.origin as string,
          })
        ) {
          return Promise.resolve({ success: true });
        } else {
          return Promise.resolve({ success: false, error: "Not connected to desktop" });
        }

      case "analyze_message":
        if (
          sendToDesktop({
            type: "analyze_message",
            message: request.message as string,
            origin: request.origin as string,
          })
        ) {
          return Promise.resolve({ success: true });
        } else {
          return Promise.resolve({ success: false, error: "Not connected to desktop" });
        }

      case "execute_transaction":
        if (
          sendToDesktop({
            type: "execute_transaction",
            transaction: request.transaction as string,
            origin: request.origin as string,
            requestId: request.requestId as number,
          })
        ) {
          return Promise.resolve({ success: true });
        } else {
          return Promise.resolve({ success: false, error: "Not connected to desktop" });
        }

      case "check_xai_api_key": {
        return (async () => {
          try {
            const result = await browser.storage.local.get("XAI_API_KEY");
            const hasKey = result.XAI_API_KEY && typeof result.XAI_API_KEY === "string" && result.XAI_API_KEY.length > 0;
            return { hasKey };
          } catch (error) {
            console.error("Error checking XAI API key:", error);
            return { hasKey: false };
          }
        })();
      }

      case "grok_chat": {
        return (async () => {
          const { sendGrokMessage } = await import("~/services/grokService");
          const messages = request.messages as Array<{ role: "system" | "user" | "assistant"; content: string }>;
          const options = request.options as {
            enableSearch?: boolean;
            searchMode?: "auto" | "on" | "off";
            returnCitations?: boolean;
            previousResponseId?: string;
            model?: string;
          } | undefined;

          try {
            const response = await sendGrokMessage(messages, options);
            return { success: true, ...response };
          } catch (error) {
            console.error("Error sending Grok message:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })();
      }

      case "get_wallet_tokens": {
        return (async () => {
          try {
            // TODO: Implement token fetching from wallet manager
            // This would use the wallet manager to get tokens for the active wallet
            return { success: true, tokens: { liquid: {} } };
          } catch (error) {
            console.error("Error getting wallet tokens:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })();
      }

      case "get_wallet_nfts": {
        return (async () => {
          try {
            // TODO: Implement NFT fetching from wallet manager
            // This would use the wallet manager to get NFTs for the active wallet
            return { success: true, nfts: { liquid: {} } };
          } catch (error) {
            console.error("Error getting wallet NFTs:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })();
      }

      case "get_token_prices": {
        return (async () => {
          try {
            // TODO: Implement price fetching
            // This would fetch token prices from a price API
            return { success: true, prices: {} };
          } catch (error) {
            console.error("Error getting token prices:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })();
      }

      case "get_wallet_namespaces": {
        return (async () => {
          try {
            // Get all wallet addresses
            const { getAllWalletAddresses } = await import("~/wallet/keyStorage");
            const addresses = await getAllWalletAddresses();
            
            // Convert to namespace format
            const namespaces = addresses.map((addr, index) => ({
              name: `Wallet ${index + 1}`,
              address: addr,
              isActive: index === 0, // First wallet is active by default
            }));

            return { success: true, namespaces };
          } catch (error) {
            console.error("Error getting wallet namespaces:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })();
      }

      case "get_active_wallet_name": {
        return (async () => {
          try {
            // TODO: Get active wallet name from storage
            const result = await browser.storage.local.get("activeWalletName");
            return {
              success: true,
              name: result.activeWalletName || "Wallet",
            };
          } catch (error) {
            console.error("Error getting active wallet name:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })();
      }

      case "set_active_namespace": {
        return (async () => {
          try {
            const namespace = request.namespace as string;
            // Store active namespace
            await browser.storage.local.set({ activeNamespace: namespace });
            return { success: true };
          } catch (error) {
            console.error("Error setting active namespace:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })();
      }


      default: {
        // Handle Wallet Standard messages
        if (sender.url === undefined) {
          return;
        }

        const event = request as InjectedEvent | SidePanelEvent;

        if (event.origin === "injected") {
          // We handle events from the injected wallet by opening a sidepanel
          const tabId = sender.tab?.id ?? 0;
          openSidePanel({
            event,
            tabId,
            forOrigin: new URL(sender.url).hostname,
          });
        } else if (event.origin === "sidePanel") {
          // We handle events from the sidepanel by forwarding them to the content script
          browser.tabs.sendMessage(
            event.tabId,
            makeConnectionSubmitForwardedEvent({
              requestId: event.requestId,
              forOrigin: event.forOrigin,
              addresses: event.addresses,
            })
          );
        }
        break;
      }
    }
    return true; // Keep message channel open for async responses
  });

  const sidePanel = (browser as { sidePanel?: unknown })
    .sidePanel as unknown as SidePanel;

  // Allows users to open the side panel by clicking on the action toolbar icon
  sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

  // Keyboard command handlers
  browser.commands.onCommand.addListener((command: string) => {
    console.log("Command received:", command);

    switch (command) {
      case "toggle-voice":
        voiceEnabled = !voiceEnabled;
        browser.storage.local.set({ voiceEnabled });
        broadcastMessage({ type: "voice_toggled", enabled: voiceEnabled });
        break;

      case "take-screenshot":
        broadcastToActiveTab({ type: "capture_chart" });
        break;

      case "open-vibe-coder":
        broadcastToActiveTab({ type: "open_vibe_coder" });
        break;

      case "emergency-stop":
        sendToDesktop({ type: "emergency_stop" });
        browser.notifications.create({
          type: "basic",
          iconUrl: "icons/icon128.png",
          title: "Emergency Stop",
          message: "All trading has been stopped",
          priority: 2,
        });
        break;
    }
  });

  // Tab updates - notify content scripts of extension state
  browser.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
    if (changeInfo.status === "complete" && isDesktopConnected) {
      browser.tabs.sendMessage(tabId, {
        type: "extension_state",
        connected: isDesktopConnected,
        voiceEnabled: voiceEnabled,
        visionEnabled: visionEnabled,
        autoExecutionEnabled: autoExecutionEnabled,
      }).catch(() => {
        // Tab doesn't have content script, ignore
      });
    }
  });
}

export default defineBackground(() => {
  main();
  console.log("Solana GR00T Extension background service worker loaded");
});
