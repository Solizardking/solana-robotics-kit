/**
 * Cloudflare Workers remote MCP server for Solana trading
 * Uses HTTP/SSE transport for remote MCP protocol
 */

import { SolanaAgentKit } from "solana-agent-kit";
import { KeypairWallet } from "solana-agent-kit";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

// Environment interface for Cloudflare Workers
interface Env {
  RPC_URL?: string;
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  HELIUS_RPC_URL?: string;
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  SOLANA_PRIVATE_KEY?: string;
  OPENAI_API_KEY?: string;
  E2B_API_KEY?: string;
  BROWSER_API_URL?: string;
}

// Tool definitions
interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

const tools: Tool[] = [
  {
    name: "get_wallet_address",
    description: "Get the public key address of the agent's wallet",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_balance",
    description: "Get the SOL balance of the agent's wallet",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_asset_info",
    description: "Get information about a Solana asset (token or NFT)",
    inputSchema: {
      type: "object",
      properties: {
        asset_address: {
          type: "string",
          description: "The address of the asset to query",
        },
      },
      required: ["asset_address"],
    },
  },
  {
    name: "get_token_balances",
    description: "Get all token balances for the agent's wallet",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "browser_navigate",
    description: "Navigate the browser to a URL",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to navigate to",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "browser_check_explorer",
    description: "Check Solana Explorer for an address",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The Solana address to check",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "browser_check_token_price",
    description: "Check token price on Birdeye",
    inputSchema: {
      type: "object",
      properties: {
        token_symbol: {
          type: "string",
          description: "The token symbol to check (e.g., SOL, BONK)",
        },
      },
      required: ["token_symbol"],
    },
  },
  {
    name: "browser_run_automation",
    description: "Run custom browser automation with instructions",
    inputSchema: {
      type: "object",
      properties: {
        instructions: {
          type: "string",
          description: "Instructions for browser automation",
        },
      },
      required: ["instructions"],
    },
  },
];

// Initialize wallet and agent
function initializeAgent(env: Env) {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  const rpcUrl = env.RPC_URL || env.HELIUS_RPC_URL || "https://mainnet.helius-rpc.com/?api-key=6b52d42b-5d24-4841-a093-02b0d2cc9fc0";
=======
  const rpcUrl = env.RPC_URL || "https://api.mainnet-beta.solana.com";
>>>>>>> Stashed changes
=======
  const rpcUrl = env.RPC_URL || "https://api.mainnet-beta.solana.com";
>>>>>>> Stashed changes
=======
  const rpcUrl = env.RPC_URL || "https://api.mainnet-beta.solana.com";
>>>>>>> Stashed changes
  let wallet: KeypairWallet;

  if (env.SOLANA_PRIVATE_KEY) {
    try {
      const privateKeyData = JSON.parse(env.SOLANA_PRIVATE_KEY);
      const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyData), { skipValidation: true });
      wallet = new KeypairWallet(keypair, rpcUrl);
    } catch (error) {
      console.error(`Error initializing wallet: ${error}`);
      wallet = new KeypairWallet(Keypair.generate(), rpcUrl);
    }
  } else {
    wallet = new KeypairWallet(Keypair.generate(), rpcUrl);
  }

  const agent = new SolanaAgentKit(wallet, rpcUrl, {
    OPENAI_API_KEY: env.OPENAI_API_KEY || "",
  });

  const connection = new Connection(rpcUrl);

  return { agent, wallet, connection };
}

// Handle tool calls
async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  env: Env
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  try {
    const { agent, wallet, connection } = initializeAgent(env);

    switch (name) {
      case "get_wallet_address": {
        const address = wallet.publicKey.toBase58();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ address }, null, 2),
            },
          ],
        };
      }

      case "get_balance": {
        const balance = await connection.getBalance(wallet.publicKey);
        const solBalance = balance / 1e9;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ balance: solBalance, lamports: balance }, null, 2),
            },
          ],
        };
      }

      case "get_asset_info": {
        const assetAddress = args?.asset_address as string;
        if (!assetAddress) {
          throw new Error("asset_address is required");
        }
        const accountInfo = await connection.getAccountInfo(new PublicKey(assetAddress));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  address: assetAddress,
                  accountInfo: accountInfo
                    ? {
                        owner: accountInfo.owner.toBase58(),
                        lamports: accountInfo.lamports,
                        executable: accountInfo.executable,
                      }
                    : null,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_token_balances": {
        const tokenProgramId = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
          programId: tokenProgramId,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  wallet: wallet.publicKey.toBase58(),
                  tokenAccounts: tokenAccounts.value.map((acc) => ({
                    pubkey: acc.pubkey.toBase58(),
                    mint: acc.account.data.parsed.info.mint,
                    balance: acc.account.data.parsed.info.tokenAmount.uiAmount,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "browser_navigate": {
        const url = args?.url as string;
        if (!url) {
          throw new Error("url is required");
        }
        return await callBrowserAPI(env.BROWSER_API_URL || "", "navigate_to", { url });
      }

      case "browser_check_explorer": {
        const address = args?.address as string;
        if (!address) {
          throw new Error("address is required");
        }
        return await callBrowserAPI(env.BROWSER_API_URL || "", "check_solana_explorer", { address });
      }

      case "browser_check_token_price": {
        const tokenSymbol = args?.token_symbol as string;
        if (!tokenSymbol) {
          throw new Error("token_symbol is required");
        }
        return await callBrowserAPI(env.BROWSER_API_URL || "", "check_token_price", {
          token_symbol: tokenSymbol,
        });
      }

      case "browser_run_automation": {
        const instructions = args?.instructions as string;
        if (!instructions) {
          throw new Error("instructions is required");
        }
        return await callBrowserAPI(env.BROWSER_API_URL || "", "run_automation", { instructions });
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

// Helper function to call browser API
async function callBrowserAPI(
  apiUrl: string,
  action: string,
  params: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  if (!apiUrl) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: "BROWSER_API_URL not configured. Browser automation requires a backend API.",
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  try {
    const instructions =
      action === "run_automation"
        ? (params.instructions as string)
        : action === "navigate_to"
        ? `Navigate to ${params.url}`
        : action === "check_solana_explorer"
        ? `Check Solana explorer for address ${params.address}`
        : action === "check_token_price"
        ? `Check token price of ${params.token_symbol}`
        : "";

    const response = await fetch(`${apiUrl}/api/browser/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instructions,
        url: params.url,
      }),
    });

    const data = (await response.json()) as { success: boolean; result?: unknown; error?: string };
    if (data.success) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data.result, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: data.error || "Browser automation failed" }, null, 2),
          },
        ],
        isError: true,
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

// Handle MCP protocol requests
async function handleMCPRequest(method: string, params: unknown, env: Env) {
  if (method === "tools/list") {
    return {
      tools,
    };
  }

  if (method === "tools/call") {
    const callParams = params as { name: string; arguments?: Record<string, unknown> };
    const { name, arguments: args } = callParams;
    return await handleToolCall(name, args || {}, env);
  }

  throw new Error(`Unknown method: ${method}`);
}

// Cloudflare Workers export
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle SSE endpoint for MCP protocol
    if (url.pathname === "/sse") {
      const encoder = new TextEncoder();

      // Create a readable stream for SSE
      const stream = new ReadableStream({
        async start(controller) {
          // Send initial connection
          controller.enqueue(encoder.encode(": connected\n\n"));

          // Handle GET request for SSE connection
          if (request.method === "GET") {
            // Send available tools
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ method: "tools/list", result: { tools } })}\n\n`)
            );
          }

          // For POST requests with tool calls
          if (request.method === "POST" && request.body) {
            try {
              const reader = request.body.getReader();
              const decoder = new TextDecoder();

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                try {
                  const body = JSON.parse(chunk) as {
                    method: string;
                    params?: unknown;
                    id?: string | number;
                  };

                  if (body.method) {
                    const result = await handleMCPRequest(body.method, body.params, env);
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ id: body.id, result })}\n\n`)
                    );
                  }
                } catch {
                  // Ignore parse errors
                }
              }
            } catch (error) {
              console.error("Error processing request:", error);
            }
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Handle POST requests for MCP protocol (JSON-RPC style)
    if (url.pathname === "/mcp" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          method: string;
          params?: unknown;
          id?: string | number;
        };

        const result = await handleMCPRequest(body.method, body.params, env);

        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: body.id,
            result,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32603, message: errorMessage },
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    // Handle OPTIONS for CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Health check
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({ status: "healthy", service: "solana-trading-mcp" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Root endpoint
    return new Response(
      JSON.stringify({
        name: "Solana Trading MCP Server",
        version: "1.0.0",
        endpoint: "/sse",
        methods: ["GET", "POST", "OPTIONS"],
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  },
};
