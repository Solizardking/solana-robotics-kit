/**
 * Cloudflare Workers remote MCP server for Pump.fun token operations
 * Uses HTTP/SSE transport for remote MCP protocol
 */

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PumpFunSDK } from "pumpdotfun-sdk";
import { z } from "zod";

// Environment interface for Cloudflare Workers
interface Env {
  HELIUS_RPC_URL?: string;
  OPENAI_API_KEY?: string;
  SOLANA_PRIVATE_KEY?: string;
  PUMP_KEYS?: KVNamespace; // KV namespace for storing keypairs
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
    name: "get-token-info",
    description: "Get information about a Pump.fun token",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddress: {
          type: "string",
          description: "The token's mint address",
        },
      },
      required: ["tokenAddress"],
    },
  },
  {
    name: "create-token",
    description: "Create a new Pump.fun token",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Token name" },
        symbol: { type: "string", description: "Token symbol" },
        description: { type: "string", description: "Token description" },
        imageUrl: {
          type: "string",
          description: "URL to token image (optional)",
        },
        generateImagePrompt: {
          type: "string",
          description:
            "Prompt to generate an image using OpenAI (alternative to imageUrl)",
        },
        initialBuyAmount: {
          type: "number",
          description: "Initial buy amount in SOL",
        },
        accountName: {
          type: "string",
          description: "Name of the account to use",
        },
      },
      required: ["name", "symbol", "description", "initialBuyAmount"],
    },
  },
  {
    name: "buy-token",
    description: "Buy a Pump.fun token",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddress: { type: "string", description: "The token's mint address" },
        buyAmount: { type: "number", description: "Amount to buy in SOL" },
        accountName: { type: "string", description: "Name of the account to use" },
        slippageBasisPoints: {
          type: "number",
          description: "Slippage tolerance in basis points",
        },
      },
      required: ["tokenAddress", "buyAmount"],
    },
  },
  {
    name: "sell-token",
    description: "Sell a Pump.fun token",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddress: { type: "string", description: "The token's mint address" },
        sellAmount: {
          type: "number",
          description: "Amount of tokens to sell (0 for all)",
        },
        accountName: { type: "string", description: "Name of the account to use" },
        slippageBasisPoints: {
          type: "number",
          description: "Slippage tolerance in basis points",
        },
      },
      required: ["tokenAddress"],
    },
  },
  {
    name: "get-account-balance",
    description: "Get the SOL and token balances for an account",
    inputSchema: {
      type: "object",
      properties: {
        accountName: {
          type: "string",
          description: "Name of the account to check",
        },
        tokenAddress: {
          type: "string",
          description: "Optional token address to check balance for",
        },
      },
    },
  },
  {
    name: "generate-image",
    description: "Generate an image using OpenAI GPT Image models (gpt-image-1.5, gpt-image-1, or gpt-image-1-mini)",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Text prompt describing the image to generate",
        },
        model: {
          type: "string",
          enum: ["gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini"],
          description: "Model to use for image generation (default: gpt-image-1.5)",
        },
        size: {
          type: "string",
          enum: ["1024x1024", "1024x1536", "1536x1024", "auto"],
          description: "Image size (default: 1024x1024)",
        },
        quality: {
          type: "string",
          enum: ["low", "medium", "high", "auto"],
          description: "Image quality (default: high)",
        },
        format: {
          type: "string",
          enum: ["png", "jpeg", "webp"],
          description: "Output format (default: png)",
        },
        background: {
          type: "string",
          enum: ["transparent", "opaque", "auto"],
          description: "Background type (default: auto). Only works with png/webp formats.",
        },
        compression: {
          type: "number",
          description: "Compression level 0-100 for jpeg/webp formats",
        },
      },
      required: ["prompt"],
    },
  },
];

// Initialize provider and SDK
function getProvider(env: Env) {
  const rpcUrl = env.HELIUS_RPC_URL;
  if (!rpcUrl) {
    throw new Error("HELIUS_RPC_URL environment variable is not set");
  }

  const connection = new Connection(rpcUrl);
  const wallet = new Keypair();
  return new AnchorProvider(
    connection,
    {
      publicKey: wallet.publicKey,
      signTransaction: async () => {
        throw new Error("Transaction signing not implemented in Workers");
      },
      signAllTransactions: async () => {
        throw new Error("Transaction signing not implemented in Workers");
      },
    },
    { commitment: "confirmed" }
  );
}

function getSDK(env: Env) {
  const provider = getProvider(env);
  return new PumpFunSDK(provider);
}

// Get or create keypair from KV or env
async function getOrCreateKeypair(
  env: Env,
  accountName: string = "default"
): Promise<Keypair> {
  // Try to get from KV first
  if (env.PUMP_KEYS) {
    const stored = await env.PUMP_KEYS.get(`keypair:${accountName}`);
    if (stored) {
      const keypairData = JSON.parse(stored);
      return Keypair.fromSecretKey(new Uint8Array(keypairData));
    }
  }

  // Try environment variable
  if (env.SOLANA_PRIVATE_KEY && accountName === "default") {
    try {
      const keypairData = JSON.parse(env.SOLANA_PRIVATE_KEY);
      return Keypair.fromSecretKey(new Uint8Array(keypairData));
    } catch {
      // Fall through to generate new
    }
  }

  // Generate new keypair
  const keypair = Keypair.generate();

  // Store in KV if available
  if (env.PUMP_KEYS) {
    await env.PUMP_KEYS.put(
      `keypair:${accountName}`,
      JSON.stringify(Array.from(keypair.secretKey))
    );
  }

  return keypair;
}

// Handle tool calls
async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  env: Env
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  try {
    switch (name) {
      case "get-token-info": {
        const tokenAddress = args?.tokenAddress as string;
        if (!tokenAddress) {
          throw new Error("tokenAddress is required");
        }

        // Note: This would need to call the actual getTokenInfo function
        // For now, return a placeholder
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  message: "Token info retrieval requires backend implementation",
                  tokenAddress,
                  note: "This tool needs the full Pump.fun SDK integration",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get-account-balance": {
        const accountName = (args?.accountName as string) || "default";
        const tokenAddress = args?.tokenAddress as string | undefined;

        const keypair = await getOrCreateKeypair(env, accountName);
        const rpcUrl = env.HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";
        const connection = new Connection(rpcUrl);

        const solBalance = await connection.getBalance(keypair.publicKey);
        const solBalanceFormatted = solBalance / 1e9;

        let tokenBalance = null;
        if (tokenAddress) {
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            keypair.publicKey,
            { mint: new PublicKey(tokenAddress) }
          );
          if (tokenAccounts.value.length > 0) {
            tokenBalance =
              tokenAccounts.value[0].account.data.parsed.info.tokenAmount
                .uiAmount;
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  account: keypair.publicKey.toBase58(),
                  accountName,
                  solBalance: solBalanceFormatted,
                  tokenBalance: tokenAddress
                    ? tokenBalance
                    : "Specify tokenAddress to check token balance",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "generate-image": {
        const prompt = args?.prompt as string;
        if (!prompt) {
          throw new Error("prompt is required");
        }

        if (!env.OPENAI_API_KEY) {
          throw new Error("OPENAI_API_KEY is required for image generation");
        }

        // Use GPT Image models (gpt-image-1.5, gpt-image-1, or gpt-image-1-mini)
        const model = (args?.model as string) || "gpt-image-1.5";
        const size = (args?.size as string) || "1024x1024";
        const quality = (args?.quality as string) || "high";
        const format = (args?.format as string) || "png";
        const background = (args?.background as string) || "auto";

        // Validate model
        const validModels = ["gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini"];
        if (!validModels.includes(model)) {
          throw new Error(`Invalid model. Must be one of: ${validModels.join(", ")}`);
        }

        // Call OpenAI API for image generation
        const requestBody: Record<string, unknown> = {
          model,
          prompt,
          response_format: "b64_json", // Return base64 JSON for better compatibility
          n: 1,
        };

        // Add optional parameters
        if (size !== "auto") {
          requestBody.size = size;
        }
        if (quality !== "auto") {
          requestBody.quality = quality;
        }
        if (format !== "png") {
          requestBody.output_format = format;
        }
        if (background !== "auto") {
          requestBody.background = background;
        }
        if (args?.compression !== undefined) {
          requestBody.output_compression = args.compression;
        }

        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const error = (await response.json()) as { error?: { message?: string } };
          throw new Error(error.error?.message || "Image generation failed");
        }

        const data = (await response.json()) as {
          data: Array<{ b64_json?: string; revised_prompt?: string }>;
        };
        const imageData = data.data[0];

        if (!imageData?.b64_json) {
          throw new Error("No image data returned from OpenAI");
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  imageBase64: imageData.b64_json,
                  revisedPrompt: imageData.revised_prompt,
                  prompt,
                  model,
                  size,
                  quality,
                  format,
                  background,
                  message: "Image generated successfully. Use the imageBase64 field to access the image data.",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "create-token":
      case "buy-token":
      case "sell-token": {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error:
                    "Token creation and trading require transaction signing which needs a backend service. These operations cannot be performed directly from Cloudflare Workers.",
                  suggestion:
                    "Deploy a backend API that handles transaction signing and call it from here.",
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
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

      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(": connected\n\n"));

          if (request.method === "GET") {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ method: "tools/list", result: { tools } })}\n\n`
              )
            );
          }

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
                      encoder.encode(
                        `data: ${JSON.stringify({ id: body.id, result })}\n\n`
                      )
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

    // Handle POST requests for MCP protocol
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
        JSON.stringify({ status: "healthy", service: "pump-mcp" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Root endpoint
    return new Response(
      JSON.stringify({
        name: "Pump.fun MCP Server",
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
