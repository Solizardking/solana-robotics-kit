import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health for Render / load balancers (always available)
  // Moonshot snapshot reports configured=true|false only — never the API key.
  const { moonshotHealthSnapshot } = await import("../lib/moonshot");
  const { solGptCatalogSummary } = await import("../lib/sol-gpt-catalog");
  const healthPayload = () => ({
    ok: true,
    service: "solana-robotics-api",
    clawd: "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump",
    moonshot: moonshotHealthSnapshot(),
    solGpt: solGptCatalogSummary(),
  });
  app.get("/health", (_req, res) => {
    res.status(200).json(healthPayload());
  });
  app.get("/api/health", (_req, res) => {
    res.status(200).json(healthPayload());
  });
  // Lightweight Kimi chat (requires MOONSHOT_API_KEY / KIMI_API_KEY)
  app.post("/api/sol-gpt/kimi", async (req, res) => {
    try {
      const { moonshotChat, moonshotVision, isMoonshotConfigured } =
        await import("../lib/moonshot");
      if (!isMoonshotConfigured()) {
        res.status(503).json({
          ok: false,
          error:
            "Moonshot/Kimi not configured. Set MOONSHOT_API_KEY or KIMI_API_KEY.",
        });
        return;
      }
      const body = req.body ?? {};
      const prompt = typeof body.prompt === "string" ? body.prompt : body.message;
      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ ok: false, error: "prompt (string) required" });
        return;
      }
      if (typeof body.imageUrl === "string" && body.imageUrl) {
        const result = await moonshotVision({
          prompt,
          imageUrl: body.imageUrl,
          model: body.model,
        });
        res.status(result.ok ? 200 : 502).json(result);
        return;
      }
      const result = await moonshotChat({
        tradingSystem: body.trading !== false,
        model: body.model,
        temperature: body.temperature,
        messages: [{ role: "user", content: prompt }],
      });
      res.status(result.ok ? 200 : 502).json(result);
    } catch (e) {
      res.status(500).json({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Render and other PaaS inject PORT — bind that exactly in production.
  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port =
    process.env.NODE_ENV === "production"
      ? preferredPort
      : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // 0.0.0.0 required on Render
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
