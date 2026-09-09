import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";
import { PluginOption } from "vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite({ mode }): { plugins: PluginOption[] } {
    console.log("\nbuilding in mode", mode);
    return {
      plugins: [react()],
    };
  },
  manifest: {
    name: "Solana GR00T",
    description: "AI-powered Solana wallet organizer with RPC-powered tags and trading integration",
    version: "1.1.3",
    web_accessible_resources: [
      {
        matches: ["<all_urls>"],
        resources: ["/injected.js"],
      },
    ],
    action: {
      default_popup: "/popup.html",
      default_icon: {
        "16": "/icons/icon16.png",
        "32": "/icons/icon32.png",
        "48": "/icons/icon48.png",
        "128": "/icons/icon128.png",
      },
    },
    sidebar_action: {
      default_title: "Solana GR00T",
      default_panel: "/sidepanel.html",
    },
    permissions: [
      "sidePanel",
      "storage",
      "downloads",
      "activeTab",
      "tabs",
      "scripting",
      "webRequest",
      "notifications",
    ],
    host_permissions: [
      "http://localhost:*/",
      "https://*.jup.ag/*",
      "https://*.raydium.io/*",
      "https://*.orca.so/*",
      "https://*.meteora.ag/*",
      "https://*.solana.com/*",
      "https://api.mainnet-beta.solana.com/*",
    ],
  },
});
