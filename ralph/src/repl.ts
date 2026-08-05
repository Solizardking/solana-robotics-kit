import readline from "node:readline";
import ora from "ora";
import chalk from "chalk";
import { OpenAI } from "openai";
import { chooseRoute } from "./router.js";
import { MemoryStore } from "./memory.js";
import { SYSTEM_RALPH_OPERATOR } from "./prompts.js";
import { createCoinbaseCharge, displayChargeInfo, handleSolanaPayment } from "./payment.js";
import { displaySolanaPaymentFlow } from "./solana-bridge.js";

type Models = { fast: string; reason: string; code: string };

function nowSessionId() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export async function runRepl(client: OpenAI, models: Models) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const mem = new MemoryStore();
  const session = process.env.RALPH_SESSION || nowSessionId();

  const help = () => {
    console.log(chalk.gray(`
Commands:
  /help        show commands
  /exit        quit
  /summary     show rolling summary
  /clear       start a new session id (today + random)
  /charge      create Coinbase charge for OpenRouter credits
               Usage: /charge <amount> <wallet_address> [chain_id]
               Example: /charge 25.50 0xYourWalletAddress 1
               Chain IDs: 1 (Ethereum), 137 (Polygon), 8453 (Base)
  /charge-sol  show Solana payment options (bridge instructions)
               Usage: /charge-sol <amount> <solana_wallet_address>
`));
  };

  const ask = (q: string) => new Promise<string>(res => rl.question(q, res));

  help();

  while (true) {
    const input = (await ask(chalk.green("ralph> "))).trim();

    if (!input) continue;
    if (input === "/exit") break;
    if (input === "/help") { help(); continue; }

    if (input === "/summary") {
      console.log(chalk.yellow(mem.getSummary(session) ?? "(no summary yet)"));
      continue;
    }

    if (input === "/clear") {
      const newSession = `${nowSessionId()}-${Math.random().toString(16).slice(2, 8)}`;
      process.env.RALPH_SESSION = newSession;
      console.log(chalk.gray(`New session: ${newSession}`));
      continue;
    }

    // Handle Coinbase charge command
    if (input.startsWith("/charge ")) {
      const args = input.slice(8).trim().split(/\s+/);
      if (args.length < 2) {
        console.log(chalk.red("Usage: /charge <amount> <wallet_address> [chain_id]"));
        console.log(chalk.gray("Example: /charge 25.50 0xYourWalletAddress 1"));
        continue;
      }

      const amount = parseFloat(args[0]);
      const walletAddress = args[1];
      const chainId = args[2] ? parseInt(args[2], 10) : 1;

      if (isNaN(amount) || amount <= 0) {
        console.log(chalk.red("Error: Amount must be a positive number"));
        continue;
      }

      if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        console.log(chalk.red("Error: Invalid Ethereum wallet address (must be 0x followed by 40 hex chars)"));
        continue;
      }

      if (![1, 137, 8453].includes(chainId)) {
        console.log(chalk.red("Error: Chain ID must be 1 (Ethereum), 137 (Polygon), or 8453 (Base)"));
        continue;
      }

      const chargeSpin = ora(`Creating Coinbase charge for $${amount.toFixed(2)}...`).start();
      try {
        const charge = await createCoinbaseCharge(client, amount, walletAddress, chainId);
        chargeSpin.stop();
        displayChargeInfo(charge);
      } catch (error: any) {
        chargeSpin.stop();
        console.error(chalk.red(`Error: ${error.message}`));
      }
      continue;
    }

    // Handle Solana payment command
    if (input.startsWith("/charge-sol ")) {
      const args = input.slice(12).trim().split(/\s+/);
      if (args.length < 2) {
        console.log(chalk.red("Usage: /charge-sol <amount> <solana_wallet_address> [ethereum_wallet]"));
        console.log(chalk.gray("Example: /charge-sol 25.50 YourSolanaWalletAddress 0xYourEthWallet"));
        continue;
      }

      const amount = parseFloat(args[0]);
      const solanaWallet = args[1];
      const ethereumWallet = args[2];

      if (isNaN(amount) || amount <= 0) {
        console.log(chalk.red("Error: Amount must be a positive number"));
        continue;
      }

      // Validate Solana address (basic check)
      if (!solanaWallet || solanaWallet.length < 32) {
        console.log(chalk.red("Error: Invalid Solana wallet address"));
        continue;
      }

      // Show complete payment flow
      await displaySolanaPaymentFlow(amount, solanaWallet, ethereumWallet);
      continue;
    }

    // store user turn
    mem.add(session, "user", input);

    const route = chooseRoute(input);
    const model = models[route];

    // memory retrieval
    const summary = mem.getSummary(session);
    const hits = mem.retrieve(session, input, 6);
    const recent = mem.getRecent(session, 10);

    const memoryBlock =
      (summary ? `SESSION SUMMARY:\n${summary}\n\n` : "") +
      (hits.length ? `RELEVANT PAST NOTES:\n${hits.map(h => `- (${h.role}) ${h.content}`).join("\n")}\n\n` : "");

    const messages = [
      { role: "system" as const, content: SYSTEM_RALPH_OPERATOR },
      { role: "system" as const, content: memoryBlock || "No prior memory." },
      ...recent.map(m => ({ role: m.role as any, content: m.content }))
    ];

    const spin = ora(`routing=${route} model=${model}`).start();
    try {
      const resp = await client.chat.completions.create({
        model,
        messages,
        temperature: route === "code" ? 0.2 : 0.6
      });

      const out = resp.choices?.[0]?.message?.content?.trim() ?? "";
      spin.stop();

      console.log(chalk.cyan(out));
      mem.add(session, "assistant", out);

      // summary refresh every ~8 user turns (cheap "context compression")
      const recentForSummary = mem.getRecent(session, 30);
      const userTurns = recentForSummary.filter(x => x.role === "user").length;

      if (userTurns % 8 === 0) {
        const sumSpin = ora("compressing context (rolling summary)…").start();
        const sumResp = await client.chat.completions.create({
          model: models.reason,
          messages: [
            { role: "system", content: "You are a summarizer. Create a compact rolling summary for future retrieval. Keep key decisions, names, files, commands, and TODOs. <= 2500 chars." },
            { role: "user", content: recentForSummary.map(x => `${x.role.toUpperCase()}: ${x.content}`).join("\n\n") }
          ],
          temperature: 0.2
        });

        const newSummary = sumResp.choices?.[0]?.message?.content?.trim() ?? "";
        if (newSummary) mem.upsertSummary(session, newSummary);
        sumSpin.stop();
      }
    } catch (e: any) {
      spin.stop();
      console.error(chalk.red(`Error: ${e?.message ?? String(e)}`));
    }
  }

  rl.close();
}
