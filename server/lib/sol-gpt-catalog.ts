/**
 * SOL GPT shipped tool catalog summary for the kit.
 * Full product surface lives on cheshireterminal.ai/sol-gpt;
 * source of truth in Cheshire: src/lib/sol-gpt/tool-catalog.ts
 *
 * Docs: docs/SOL_GPT.md
 */

export type SolGptToolGroup = {
  id: string;
  name: string;
  tools: number;
  blurb: string;
};

export const SOL_GPT_GROUPS: readonly SolGptToolGroup[] = [
  {
    id: "phoenix",
    name: "Phoenix Eternal",
    tools: 23,
    blurb:
      "Perps research + user-signed trade prep (market/limit, deposit, withdraw, register)",
  },
  {
    id: "imperial",
    name: "Imperial router",
    tools: 32,
    blurb:
      "Multi-venue perps intel (Jupiter / Flash / Phoenix / GMTrade): funding, marks, route, stats",
  },
  {
    id: "market",
    name: "Market data",
    tools: 18,
    blurb: "Prices, search, trending, memes, fees, security",
  },
  {
    id: "ohlcv",
    name: "OHLCV & live tape",
    tools: 10,
    blurb: "Candles, live price, base/quote streams, trades",
  },
  {
    id: "wallet",
    name: "Wallet & portfolio",
    tools: 4,
    blurb: "Net worth, PnL, assets, balances",
  },
  {
    id: "helius",
    name: "Helius Wallet API",
    tools: 8,
    blurb: "Identity, history, transfers, funding, activity stream",
  },
  {
    id: "solanatracker",
    name: "Solana Tracker",
    tools: 60,
    blurb: "Portfolio, PnL, trending, bundlers, search + DAS API",
  },
  {
    id: "trading",
    name: "Swaps & sends",
    tools: 5,
    blurb: "Quotes + user-signed swap/transfer prep (wallet signs)",
  },
  {
    id: "prediction",
    name: "Prediction markets",
    tools: 3,
    blurb: "DFlow / Kalshi read-only market data",
  },
  {
    id: "browser",
    name: "Cloud browser",
    tools: 4,
    blurb: "Browse external sites via Browser Use",
  },
  {
    id: "agents",
    name: "Agents & DAS",
    tools: 2,
    blurb: "Metaplex / Solana agent discovery and assets",
  },
  {
    id: "platform",
    name: "Platform",
    tools: 2,
    blurb: "Sponge status and catalog search",
  },
] as const;

export function solGptCatalogSummary() {
  const shipped = SOL_GPT_GROUPS.reduce((n, g) => n + g.tools, 0);
  return {
    shipped,
    core: 122,
    specialty: shipped - 122,
    groups: SOL_GPT_GROUPS.length,
    groupBreakdown: SOL_GPT_GROUPS,
    models: {
      defaultWhenMoonshotKey: "kimi-k3",
      openrouterFree: "poolside/laguna-s-2.1:free",
      lagunaPaid: "poolside/laguna-s-2.1",
      opus: "anthropic/claude-opus-5-fast",
      deepseek: "deepseek-v4-flash",
    },
    custody: {
      nonCustodial: true,
      livePrepareTools: [
        "prepare_user_swap",
        "prepare_user_transfer",
        "prepare_phoenix_register_trader",
        "prepare_phoenix_deposit",
        "prepare_phoenix_market_order",
        "prepare_phoenix_limit_order",
        "prepare_phoenix_cancel_all",
        "prepare_phoenix_withdraw",
      ],
      notInCatalog: ["execute_swap", "sponge_bridge", "imperial_jwt_order_submit"],
    },
    productUrl: "https://cheshireterminal.ai/sol-gpt",
    docsPath: "docs/SOL_GPT.md",
  };
}
