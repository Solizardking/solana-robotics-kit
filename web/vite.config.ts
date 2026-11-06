import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { nodePolyfills } from "vite-plugin-node-polyfills";


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), nodePolyfills()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("three") || id.includes("@react-three")) return "three";
          // Metaplex + Solana + bn.js MUST share one chunk: splitting them
          // creates a circular cross-chunk CJS interop where requireBn assigns
          // onto an uninitialized exports object ("Cannot set properties of
          // undefined (setting 'BN')") and the whole app renders blank.
          if (id.includes("@metaplex-foundation")) return "solana";
          if (id.includes("@solana") || id.includes("@phantom") || id.includes("jupiverse")) return "solana";
          if (id.includes("/bn.js/") || id.includes("/buffer/")) return "solana";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("@trpc") || id.includes("@tanstack/react-query")) return "trpc";
          if (id.includes("framer-motion")) return "framer";
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  define: {
    global: 'globalThis',
  },
});
