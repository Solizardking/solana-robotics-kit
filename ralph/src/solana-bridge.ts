import chalk from "chalk";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferCheckedInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";

/**
 * Bridge SOL to USDC on Ethereum via Wormhole
 * This is a helper module for Solana → Ethereum bridging
 */
export interface BridgeOptions {
  solanaRpcUrl: string;
  solanaWallet: string; // Base58 address
  amountSOL: number;
  ethereumRecipient: string; // 0x address
}

/**
 * Get instructions for bridging SOL to USDC on Ethereum
 * Note: This is a conceptual implementation - actual Wormhole integration
 * would require the Wormhole SDK and proper contract interactions
 */
export async function getBridgeInstructions(options: BridgeOptions) {
  const { solanaRpcUrl, solanaWallet, amountSOL, ethereumRecipient } = options;

  console.log(chalk.yellow("\n🌉 Solana → Ethereum Bridge Instructions\n"));
  console.log(chalk.gray("Step 1: Bridge SOL to USDC on Ethereum via Wormhole\n"));
  
  console.log(chalk.cyan("Option A: Use Wormhole Portal (Recommended)"));
  console.log(chalk.gray("  1. Visit: https://portalbridge.com"));
  console.log(chalk.gray(`  2. Connect your Solana wallet: ${solanaWallet}`));
  console.log(chalk.gray(`  3. Select: SOL → USDC (Ethereum)`));
  console.log(chalk.gray(`  4. Amount: ${amountSOL} SOL`));
  console.log(chalk.gray(`  5. Recipient: ${ethereumRecipient}`));
  console.log(chalk.gray("  6. Complete the bridge transaction\n"));

  console.log(chalk.cyan("Option B: Use Jupiter Aggregator"));
  console.log(chalk.gray("  1. Visit: https://jup.ag"));
  console.log(chalk.gray(`  2. Swap SOL → USDC (Ethereum)`));
  console.log(chalk.gray(`  3. Bridge to Ethereum network`));
  console.log(chalk.gray(`  4. Amount: $${(amountSOL * 100).toFixed(2)} (assuming $100/SOL)\n`));

  console.log(chalk.cyan("Option C: Manual Bridge (Advanced)"));
  console.log(chalk.gray("  1. Use Wormhole SDK:"));
  console.log(chalk.gray("     npm install @certusone/wormhole-sdk"));
  console.log(chalk.gray("  2. Create transfer transaction"));
  console.log(chalk.gray("  3. Sign and send to Wormhole program\n"));

  return {
    solanaWallet,
    amountSOL,
    ethereumRecipient,
    instructions: "Use Wormhole Portal or Jupiter Aggregator to bridge SOL to USDC on Ethereum"
  };
}

/**
 * Display complete payment flow for Solana users
 */
export async function displaySolanaPaymentFlow(
  amountUSD: number,
  solanaWallet: string,
  ethereumWallet?: string
) {
  console.log(chalk.bold.green("\n💰 Solana Payment Flow for OpenRouter Credits\n"));
  
  console.log(chalk.gray(`Amount needed: $${amountUSD.toFixed(2)}`));
  console.log(chalk.gray(`Solana wallet: ${solanaWallet}`));
  if (ethereumWallet) {
    console.log(chalk.gray(`Ethereum wallet: ${ethereumWallet}\n`));
  }

  // Estimate SOL needed (rough calculation)
  const estimatedSOL = amountUSD / 100; // Assuming $100/SOL, adjust as needed
  console.log(chalk.yellow(`Estimated SOL needed: ~${estimatedSOL.toFixed(4)} SOL\n`));

  console.log(chalk.bold("Step 1: Bridge SOL → USDC (Ethereum)"));
  if (ethereumWallet) {
    await getBridgeInstructions({
      solanaRpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
      solanaWallet,
      amountSOL: estimatedSOL,
      ethereumRecipient: ethereumWallet
    });
  } else {
    console.log(chalk.gray("  → Use Wormhole Portal: https://portalbridge.com"));
    console.log(chalk.gray(`  → Bridge ${estimatedSOL.toFixed(4)} SOL to USDC on Ethereum\n`));
  }

  console.log(chalk.bold("Step 2: Create Coinbase Charge"));
  console.log(chalk.gray("  → Once you have USDC on Ethereum:"));
  console.log(chalk.cyan(`  → Run: /charge ${amountUSD.toFixed(2)} <your_ethereum_wallet> 1\n`));

  console.log(chalk.bold("Step 3: Complete Transaction"));
  console.log(chalk.gray("  → Use the call_data from the charge"));
  console.log(chalk.gray("  → Sign and send the transaction"));
  console.log(chalk.gray("  → OpenRouter will credit your account\n"));
}
