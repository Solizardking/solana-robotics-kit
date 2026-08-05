import { OpenAI } from "openai";
import chalk from "chalk";

export interface CoinbaseChargeRequest {
  amount: number;
  sender: string;
  chain_id: number;
}

export interface CoinbaseChargeResponse {
  data: {
    id: string;
    created_at: string;
    expires_at: string;
    web3_data: {
      transfer_intent: {
        call_data: {
          deadline: string;
          fee_amount: string;
          id: string;
          operator: string;
          prefix: string;
          recipient: string;
          recipient_amount: string;
          recipient_currency: string;
          refund_destination: string;
          signature: string;
        };
        metadata: {
          chain_id: number;
          contract_address: string;
          sender: string;
        };
      };
    };
  };
}

/**
 * Create a Coinbase charge for OpenRouter credits
 * Note: OpenRouter's Coinbase API currently supports Ethereum chains (1, 137, 8453)
 * For Solana, we'll need to use a bridge or wait for Solana support
 */
export async function createCoinbaseCharge(
  client: OpenAI,
  amount: number,
  senderAddress: string,
  chainId: number = 1 // Default to Ethereum mainnet
): Promise<CoinbaseChargeResponse> {
  try {
    // OpenRouter's Coinbase endpoint
    const response = await fetch("https://openrouter.ai/api/v1/credits/coinbase", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${client.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.RALPH_SITE_URL || "http://localhost",
        "X-Title": process.env.RALPH_SITE_NAME || "ralph-terminal"
      },
      body: JSON.stringify({
        amount,
        sender: senderAddress,
        chain_id: chainId
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(`Coinbase charge failed: ${error.error || response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(`Failed to create Coinbase charge: ${error.message}`);
  }
}

/**
 * Display charge information in a user-friendly format
 */
export function displayChargeInfo(charge: CoinbaseChargeResponse) {
  const { data } = charge;
  const { call_data, metadata } = data.web3_data.transfer_intent;

  console.log(chalk.bold.green("\n✅ Coinbase Charge Created\n"));
  console.log(chalk.gray("Charge ID:") + ` ${data.id}`);
  console.log(chalk.gray("Created:") + ` ${new Date(data.created_at).toLocaleString()}`);
  console.log(chalk.gray("Expires:") + ` ${new Date(data.expires_at).toLocaleString()}`);
  console.log(chalk.gray("Chain ID:") + ` ${metadata.chain_id}`);
  console.log(chalk.gray("Amount:") + ` ${call_data.recipient_amount} ${call_data.recipient_currency}`);
  console.log(chalk.gray("Fee:") + ` ${call_data.fee_amount}`);
  console.log(chalk.gray("Recipient:") + ` ${call_data.recipient}`);
  console.log(chalk.gray("Operator:") + ` ${call_data.operator}`);
  console.log(chalk.gray("Deadline:") + ` ${new Date(call_data.deadline).toLocaleString()}`);
  
  console.log(chalk.yellow("\n⚠️  Transaction Details:"));
  console.log(chalk.cyan(`  Transfer Intent ID: ${call_data.id}`));
  console.log(chalk.cyan(`  Contract: ${metadata.contract_address}`));
  console.log(chalk.cyan(`  Sender: ${metadata.sender}`));
  
  console.log(chalk.yellow("\n📝 Next Steps:"));
  console.log(chalk.gray("  1. Use the call_data to construct your transaction"));
  console.log(chalk.gray("  2. Sign and send the transaction before the deadline"));
  console.log(chalk.gray("  3. OpenRouter will credit your account once confirmed"));
}

/**
 * Solana-specific payment handler
 * Since OpenRouter Coinbase API doesn't directly support Solana,
 * this provides instructions for alternative methods
 */
export function handleSolanaPayment(amount: number, walletAddress: string) {
  console.log(chalk.yellow("\n⚠️  Solana Payment Notice\n"));
  console.log(chalk.gray("OpenRouter's Coinbase API currently supports:"));
  console.log(chalk.cyan("  - Ethereum (chain_id: 1)"));
  console.log(chalk.cyan("  - Polygon (chain_id: 137)"));
  console.log(chalk.cyan("  - Base (chain_id: 8453)"));
  console.log(chalk.gray("\nSolana is not directly supported yet.\n"));
  
  console.log(chalk.yellow("Options for Solana payments:"));
  console.log(chalk.gray("  1. Use a bridge (e.g., Wormhole) to convert SOL → USDC on Ethereum"));
  console.log(chalk.gray("  2. Use Jupiter Aggregator to swap SOL → USDC (Ethereum)"));
  console.log(chalk.gray("  3. Use Coinbase directly with USDC on supported chains"));
  console.log(chalk.gray("  4. Wait for OpenRouter to add Solana support\n"));
  
  console.log(chalk.cyan("Recommended: Bridge SOL to USDC on Ethereum, then use Coinbase charge"));
  console.log(chalk.gray(`  Amount: $${amount.toFixed(2)}`));
  console.log(chalk.gray(`  Wallet: ${walletAddress}\n`));
}
