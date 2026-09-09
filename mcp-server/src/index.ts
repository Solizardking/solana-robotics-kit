// src/index.ts - MCP Server for Solana Trading
/**
 * Model Context Protocol (MCP) server for Solana blockchain operations.
 * This server enables Claude Desktop to interact with Solana wallets and tokens.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { SolanaAgentKit } from "solana-agent-kit";
import * as dotenv from "dotenv";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { KeypairWallet } from "solana-agent-kit";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
=======
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { KeypairWallet } from "solana-agent-kit";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
>>>>>>> Stashed changes
=======
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { KeypairWallet } from "solana-agent-kit";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
>>>>>>> Stashed changes
=======
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { KeypairWallet } from "solana-agent-kit";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
>>>>>>> Stashed changes
import { spawn } from "child_process";
import { join } from "path";

// Load environment variables
dotenv.config();

// Get configuration from environment
const rpcUrl = process.env.RPC_URL || process.env.SOLANA_RPC_URL || process.env.HELIUS_RPC_URL || "https://mainnet.helius-rpc.com/?api-key=6b52d42b-5d24-4841-a093-02b0d2cc9fc0";
const privateKeyStr = process.env.SOLANA_PRIVATE_KEY;

// Initialize wallet
let wallet: KeypairWallet;

if (privateKeyStr) {
<<<<<<< Updated upstream
  try {
    // Parse private key from JSON array format
    const privateKeyData = JSON.parse(privateKeyStr);
    const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyData), { skipValidation: true });
    wallet = new KeypairWallet(keypair, rpcUrl);
    console.error(`[MCP] Wallet loaded: ${wallet.publicKey.toBase58()}`);
  } catch (error) {
    console.error(`[MCP] Error initializing wallet: ${error}`);
    // Generate a new keypair if parsing fails
    wallet = new KeypairWallet(Keypair.generate(), rpcUrl);
    console.error(`[MCP] Generated new wallet: ${wallet.publicKey.toBase58()}`);
  }
} else {
  console.error("[MCP] No private key provided, generating random keypair");
  wallet = new KeypairWallet(Keypair.generate(), rpcUrl);
  console.error(`[MCP] Generated wallet: ${wallet.publicKey.toBase58()}`);
=======
    try {
        // Parse private key from string format
        const privateKeyData = JSON.parse(privateKeyStr);
        const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyData), { skipValidation: true });
        wallet = new KeypairWallet(keypair, rpcUrl);
        console.error(`Wallet loaded with public key: ${wallet.publicKey.toBase58()}`);
    } catch (error) {
        console.error(`Error initializing wallet: ${error}`);
        process.exit(1);
    }
} else {
    console.error("No private key provided, generating random keypair");
    wallet = new KeypairWallet(Keypair.generate(), rpcUrl);
    console.error(`Generated wallet with public key: ${wallet.publicKey.toBase58()}`);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
}

// Create Solana connection
const connection = new Connection(rpcUrl);

// Initialize Solana Agent Kit
const agent = new SolanaAgentKit(wallet, rpcUrl, {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
});

// Get project root directory (mcp-server is in project root, so go up one level from build/)
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
const projectRoot = join(__dirname, "..", "..");
const browserScriptPath = join(projectRoot, "browser", "browser_api.py");

// Helper function to run Python browser script
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
async function runBrowserScript(action: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python3", [
      browserScriptPath,
      "--action",
      action,
      "--params",
      JSON.stringify(params),
    ], {
      cwd: projectRoot,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
      },
    });

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          // Try to parse JSON output
          const lines = stdout.split("\n");
          const jsonLine = lines.find(line => line.trim().startsWith("{") || line.trim().startsWith("["));
          if (jsonLine) {
            const result = JSON.parse(jsonLine.trim());
            if (result.success) {
              resolve(result.data || result);
            } else {
              reject(new Error(result.error || "Browser script returned error"));
            }
          } else {
            resolve({ output: stdout, stderr: stderr || undefined });
          }
        } catch (error) {
          reject(new Error(`Failed to parse browser script output: ${error}`));
        }
      } else {
        reject(new Error(`Browser script failed with code ${code}: ${stderr || stdout}`));
      }
    });

    pythonProcess.on("error", (error) => {
      reject(new Error(`Failed to start browser script: ${error.message}`));
    });
  });
=======
async function runBrowserScript(instructions: string): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn("python3", [
            browserScriptPath,
            instructions
        ], {
            cwd: projectRoot,
            env: {
                ...process.env,
                PYTHONUNBUFFERED: "1"
            }
        });

=======
async function runBrowserScript(instructions: string): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn("python3", [
            browserScriptPath,
            instructions
        ], {
            cwd: projectRoot,
            env: {
                ...process.env,
                PYTHONUNBUFFERED: "1"
            }
        });

>>>>>>> Stashed changes
=======
async function runBrowserScript(instructions: string): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn("python3", [
            browserScriptPath,
            instructions
        ], {
            cwd: projectRoot,
            env: {
                ...process.env,
                PYTHONUNBUFFERED: "1"
            }
        });

>>>>>>> Stashed changes
        let stdout = "";
        let stderr = "";

        pythonProcess.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        pythonProcess.on("close", (code) => {
            if (code === 0) {
                try {
                    // Try to parse JSON output if available
                    const lines = stdout.split("\n");
                    const jsonLine = lines.find(line => line.trim().startsWith("{") || line.trim().startsWith("["));
                    if (jsonLine) {
                        resolve(JSON.parse(jsonLine.trim()));
                    } else {
                        resolve({ output: stdout, stderr: stderr || undefined });
                    }
                } catch {
                    resolve({ output: stdout, stderr: stderr || undefined });
                }
            } else {
                reject(new Error(`Browser script failed with code ${code}: ${stderr || stdout}`));
            }
        });

        pythonProcess.on("error", (error) => {
            reject(new Error(`Failed to start browser script: ${error.message}`));
        });
    });
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
}

// Create MCP server
const server = new Server(
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  {
    name: "solana-trading-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: "get_wallet_address",
    description: "Get the public key (address) of the connected Solana wallet",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_balance",
    description: "Get the SOL balance of the connected wallet in SOL and lamports",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_asset_info",
    description: "Get information about a Solana token or mint by its address",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddress: {
          type: "string",
          description: "The Solana address (public key) of the token/mint",
        },
      },
      required: ["tokenAddress"],
    },
  },
  {
    name: "get_token_balances",
    description: "Get token balances for the connected wallet (placeholder - not yet implemented)",
    inputSchema: {
      type: "object",
      properties: {
        tokenAddresses: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of token addresses to check. If empty, returns all token balances.",
        },
      },
    },
  },
  {
    name: "browser_navigate",
    description: "Navigate to a URL using the Solana web browser automation",
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
    description: "Check a Solana address on the Solana Explorer using browser automation",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The Solana address to check on the explorer",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "browser_check_token_price",
    description: "Check the price of a token on Birdeye or similar price tracking site using browser automation",
    inputSchema: {
      type: "object",
      properties: {
        tokenSymbol: {
          type: "string",
          description: "The token symbol (e.g., SOL, BONK, USDC)",
        },
      },
      required: ["tokenSymbol"],
    },
  },
  {
    name: "browser_run_automation",
    description: "Run custom browser automation instructions for Solana-related tasks",
    inputSchema: {
      type: "object",
      properties: {
        instructions: {
          type: "string",
          description: "Natural language instructions for browser automation (e.g., 'Check Solana explorer for address X', 'Navigate to jup.ag', 'Check token price of SOL')",
        },
      },
      required: ["instructions"],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_wallet_address": {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  address: wallet.publicKey.toBase58(),
                  network: rpcUrl.includes("devnet") ? "devnet" : rpcUrl.includes("testnet") ? "testnet" : "mainnet",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_balance": {
        const balance = await connection.getBalance(wallet.publicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  address: wallet.publicKey.toBase58(),
                  balance: {
                    sol: solBalance,
                    lamports: balance,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_asset_info": {
        if (!args || !args.tokenAddress) {
          throw new Error("tokenAddress is required");
        }
        const tokenAddress = args.tokenAddress as string;
        const publicKey = new PublicKey(tokenAddress);
        const accountInfo = await connection.getAccountInfo(publicKey);
        
        if (!accountInfo) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    address: tokenAddress,
                    error: "Account not found",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  address: tokenAddress,
                  owner: accountInfo.owner.toBase58(),
                  lamports: accountInfo.lamports,
                  executable: accountInfo.executable,
                  rentEpoch: accountInfo.rentEpoch,
                  dataLength: accountInfo.data.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_token_balances": {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  message: "Token balance retrieval is not yet implemented",
                  address: wallet.publicKey.toBase58(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "browser_navigate": {
        if (!args || !args.url) {
          throw new Error("url is required");
        }
        const result = await runBrowserScript("navigate_to", { url: args.url as string });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "browser_check_explorer": {
        if (!args || !args.address) {
          throw new Error("address is required");
        }
        const result = await runBrowserScript("check_solana_explorer", { address: args.address as string });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "browser_check_token_price": {
        if (!args || !args.tokenSymbol) {
          throw new Error("tokenSymbol is required");
        }
        const result = await runBrowserScript("check_token_price", { token_symbol: args.tokenSymbol as string });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "browser_run_automation": {
        if (!args || !args.instructions) {
          throw new Error("instructions is required");
        }
        const result = await runBrowserScript("run_automation", { instructions: args.instructions as string });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    {
        name: "solana-trading",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
=======
    }
);

// Define tools
const tools: Tool[] = [
    {
        name: "get_wallet_address",
        description: "Get the public key address of the connected Solana wallet",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "get_balance",
        description: "Get the SOL balance of the connected wallet",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "get_asset_info",
        description: "Get information about a Solana token/asset by its address",
        inputSchema: {
            type: "object",
            properties: {
                tokenAddress: {
                    type: "string",
                    description: "The token mint address",
                },
            },
            required: ["tokenAddress"],
        },
    },
    {
        name: "get_token_balances",
        description: "Get token balances for the connected wallet (placeholder)",
        inputSchema: {
            type: "object",
            properties: {
                tokenAddresses: {
                    type: "array",
                    items: { type: "string" },
                    description: "Optional list of token addresses to check",
                },
            },
        },
    },
    {
        name: "browser_navigate",
        description: "Navigate to a URL using the Solana web browser automation",
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
        description: "Check a Solana address on the Solana Explorer using browser automation",
        inputSchema: {
            type: "object",
            properties: {
                address: {
                    type: "string",
                    description: "The Solana address to check on the explorer",
                },
            },
            required: ["address"],
        },
    },
    {
        name: "browser_check_token_price",
        description: "Check the price of a token on Birdeye or similar price tracking site using browser automation",
        inputSchema: {
            type: "object",
            properties: {
                tokenSymbol: {
                    type: "string",
                    description: "The token symbol (e.g., SOL, BONK, USDC)",
                },
            },
            required: ["tokenSymbol"],
        },
    },
    {
        name: "browser_run_automation",
        description: "Run custom browser automation instructions for Solana-related tasks",
        inputSchema: {
            type: "object",
            properties: {
                instructions: {
                    type: "string",
                    description: "Natural language instructions for browser automation (e.g., 'Check Solana explorer for address X', 'Navigate to jup.ag', 'Check token price of SOL')",
                },
            },
            required: ["instructions"],
        },
    },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools,
    };
});

// Handle call tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "get_wallet_address": {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                address: wallet.publicKey.toBase58(),
                            }, null, 2),
                        },
                    ],
                };
            }

            case "get_balance": {
                const balance = await agent.connection.getBalance(wallet.publicKey);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                sol: balance / 1e9,
                                lamports: balance,
                                address: wallet.publicKey.toBase58(),
                            }, null, 2),
                        },
                    ],
                };
            }

            case "get_asset_info": {
                const { tokenAddress } = args as { tokenAddress: string };
                const mintInfo = await connection.getAccountInfo(new PublicKey(tokenAddress));
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                address: tokenAddress,
                                accountInfo: mintInfo ? {
                                    owner: mintInfo.owner.toBase58(),
                                    lamports: mintInfo.lamports,
                                    executable: mintInfo.executable,
                                    rentEpoch: mintInfo.rentEpoch,
                                } : null,
                            }, null, 2),
                        },
                    ],
                };
            }

            case "get_token_balances": {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                message: "Token balance retrieval not fully implemented yet",
                                wallet: wallet.publicKey.toBase58(),
                            }, null, 2),
                        },
                    ],
                };
            }

            case "browser_navigate": {
                const { url } = args as { url: string };
                const result = await runBrowserScript(`Navigate to ${url}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "browser_check_explorer": {
                const { address } = args as { address: string };
                const result = await runBrowserScript(`Check Solana explorer for address ${address}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "browser_check_token_price": {
                const { tokenSymbol } = args as { tokenSymbol: string };
                const result = await runBrowserScript(`Check token price of ${tokenSymbol}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "browser_run_automation": {
                const { instructions } = args as { instructions: string };
                const result = await runBrowserScript(instructions);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
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
                    text: JSON.stringify({
                        error: errorMessage,
                    }, null, 2),
                },
            ],
            isError: true,
        };
>>>>>>> Stashed changes
    }
);

// Define tools
const tools: Tool[] = [
    {
        name: "get_wallet_address",
        description: "Get the public key address of the connected Solana wallet",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "get_balance",
        description: "Get the SOL balance of the connected wallet",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "get_asset_info",
        description: "Get information about a Solana token/asset by its address",
        inputSchema: {
            type: "object",
            properties: {
                tokenAddress: {
                    type: "string",
                    description: "The token mint address",
                },
            },
            required: ["tokenAddress"],
        },
    },
    {
        name: "get_token_balances",
        description: "Get token balances for the connected wallet (placeholder)",
        inputSchema: {
            type: "object",
            properties: {
                tokenAddresses: {
                    type: "array",
                    items: { type: "string" },
                    description: "Optional list of token addresses to check",
                },
            },
        },
    },
    {
        name: "browser_navigate",
        description: "Navigate to a URL using the Solana web browser automation",
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
        description: "Check a Solana address on the Solana Explorer using browser automation",
        inputSchema: {
            type: "object",
            properties: {
                address: {
                    type: "string",
                    description: "The Solana address to check on the explorer",
                },
            },
            required: ["address"],
        },
    },
    {
        name: "browser_check_token_price",
        description: "Check the price of a token on Birdeye or similar price tracking site using browser automation",
        inputSchema: {
            type: "object",
            properties: {
                tokenSymbol: {
                    type: "string",
                    description: "The token symbol (e.g., SOL, BONK, USDC)",
                },
            },
            required: ["tokenSymbol"],
        },
    },
    {
        name: "browser_run_automation",
        description: "Run custom browser automation instructions for Solana-related tasks",
        inputSchema: {
            type: "object",
            properties: {
                instructions: {
                    type: "string",
                    description: "Natural language instructions for browser automation (e.g., 'Check Solana explorer for address X', 'Navigate to jup.ag', 'Check token price of SOL')",
                },
            },
            required: ["instructions"],
        },
    },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools,
    };
});

<<<<<<< Updated upstream
// Handle call tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "get_wallet_address": {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                address: wallet.publicKey.toBase58(),
                            }, null, 2),
                        },
                    ],
                };
            }

            case "get_balance": {
                const balance = await agent.connection.getBalance(wallet.publicKey);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                sol: balance / 1e9,
                                lamports: balance,
                                address: wallet.publicKey.toBase58(),
                            }, null, 2),
                        },
                    ],
                };
            }

            case "get_asset_info": {
                const { tokenAddress } = args as { tokenAddress: string };
                const mintInfo = await connection.getAccountInfo(new PublicKey(tokenAddress));
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                address: tokenAddress,
                                accountInfo: mintInfo ? {
                                    owner: mintInfo.owner.toBase58(),
                                    lamports: mintInfo.lamports,
                                    executable: mintInfo.executable,
                                    rentEpoch: mintInfo.rentEpoch,
                                } : null,
                            }, null, 2),
                        },
                    ],
                };
            }

            case "get_token_balances": {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                message: "Token balance retrieval not fully implemented yet",
                                wallet: wallet.publicKey.toBase58(),
                            }, null, 2),
                        },
                    ],
                };
            }

            case "browser_navigate": {
                const { url } = args as { url: string };
                const result = await runBrowserScript(`Navigate to ${url}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "browser_check_explorer": {
                const { address } = args as { address: string };
                const result = await runBrowserScript(`Check Solana explorer for address ${address}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "browser_check_token_price": {
                const { tokenSymbol } = args as { tokenSymbol: string };
                const result = await runBrowserScript(`Check token price of ${tokenSymbol}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "browser_run_automation": {
                const { instructions } = args as { instructions: string };
                const result = await runBrowserScript(instructions);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
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
                    text: JSON.stringify({
                        error: errorMessage,
                    }, null, 2),
                },
            ],
            isError: true,
        };
>>>>>>> Stashed changes
    }
);

// Define tools
const tools: Tool[] = [
    {
        name: "get_wallet_address",
        description: "Get the public key address of the connected Solana wallet",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "get_balance",
        description: "Get the SOL balance of the connected wallet",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "get_asset_info",
        description: "Get information about a Solana token/asset by its address",
        inputSchema: {
            type: "object",
            properties: {
                tokenAddress: {
                    type: "string",
                    description: "The token mint address",
                },
            },
            required: ["tokenAddress"],
        },
    },
    {
        name: "get_token_balances",
        description: "Get token balances for the connected wallet (placeholder)",
        inputSchema: {
            type: "object",
            properties: {
                tokenAddresses: {
                    type: "array",
                    items: { type: "string" },
                    description: "Optional list of token addresses to check",
                },
            },
        },
    },
    {
        name: "browser_navigate",
        description: "Navigate to a URL using the Solana web browser automation",
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
        description: "Check a Solana address on the Solana Explorer using browser automation",
        inputSchema: {
            type: "object",
            properties: {
                address: {
                    type: "string",
                    description: "The Solana address to check on the explorer",
                },
            },
            required: ["address"],
        },
    },
    {
        name: "browser_check_token_price",
        description: "Check the price of a token on Birdeye or similar price tracking site using browser automation",
        inputSchema: {
            type: "object",
            properties: {
                tokenSymbol: {
                    type: "string",
                    description: "The token symbol (e.g., SOL, BONK, USDC)",
                },
            },
            required: ["tokenSymbol"],
        },
    },
    {
        name: "browser_run_automation",
        description: "Run custom browser automation instructions for Solana-related tasks",
        inputSchema: {
            type: "object",
            properties: {
                instructions: {
                    type: "string",
                    description: "Natural language instructions for browser automation (e.g., 'Check Solana explorer for address X', 'Navigate to jup.ag', 'Check token price of SOL')",
                },
            },
            required: ["instructions"],
        },
    },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools,
    };
});

<<<<<<< Updated upstream
// Handle call tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "get_wallet_address": {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                address: wallet.publicKey.toBase58(),
                            }, null, 2),
                        },
                    ],
                };
            }

            case "get_balance": {
                const balance = await agent.connection.getBalance(wallet.publicKey);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                sol: balance / 1e9,
                                lamports: balance,
                                address: wallet.publicKey.toBase58(),
                            }, null, 2),
                        },
                    ],
                };
            }

            case "get_asset_info": {
                const { tokenAddress } = args as { tokenAddress: string };
                const mintInfo = await connection.getAccountInfo(new PublicKey(tokenAddress));
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                address: tokenAddress,
                                accountInfo: mintInfo ? {
                                    owner: mintInfo.owner.toBase58(),
                                    lamports: mintInfo.lamports,
                                    executable: mintInfo.executable,
                                    rentEpoch: mintInfo.rentEpoch,
                                } : null,
                            }, null, 2),
                        },
                    ],
                };
            }

            case "get_token_balances": {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                message: "Token balance retrieval not fully implemented yet",
                                wallet: wallet.publicKey.toBase58(),
                            }, null, 2),
                        },
                    ],
                };
            }

            case "browser_navigate": {
                const { url } = args as { url: string };
                const result = await runBrowserScript(`Navigate to ${url}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "browser_check_explorer": {
                const { address } = args as { address: string };
                const result = await runBrowserScript(`Check Solana explorer for address ${address}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "browser_check_token_price": {
                const { tokenSymbol } = args as { tokenSymbol: string };
                const result = await runBrowserScript(`Check token price of ${tokenSymbol}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "browser_run_automation": {
                const { instructions } = args as { instructions: string };
                const result = await runBrowserScript(instructions);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
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
                    text: JSON.stringify({
                        error: errorMessage,
                    }, null, 2),
                },
            ],
            isError: true,
        };
>>>>>>> Stashed changes
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: errorMessage,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
<<<<<<< Updated upstream
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[MCP] Solana Trading MCP server running on stdio");
  console.error(`[MCP] Wallet: ${wallet.publicKey.toBase58()}`);
  console.error(`[MCP] RPC: ${rpcUrl}`);
}

main().catch((error) => {
  console.error("[MCP] Fatal error:", error);
  process.exit(1);
=======
=======
// Start the server
async function main() {
>>>>>>> Stashed changes
=======
// Start the server
async function main() {
>>>>>>> Stashed changes
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Solana Trading MCP server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
});
