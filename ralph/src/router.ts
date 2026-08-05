export type Route = "fast" | "reason" | "code";

export function chooseRoute(userText: string): Route {
  const t = userText.toLowerCase();

  const codeSignals = [
    "typescript", "javascript", "rust", "anchor", "solana", "program", "pda",
    "cli", "bug", "stack trace", "error:", "npm", "pnpm", "yarn", "docker",
    "next.js", "react", "api", "middleware", "sql", "schema"
  ];

  const reasonSignals = [
    "design", "architecture", "tradeoffs", "threat model", "tokenomics",
    "spec", "proposal", "compare", "analysis", "strategy", "roadmap"
  ];

  if (codeSignals.some(s => t.includes(s))) return "code";
  if (reasonSignals.some(s => t.includes(s))) return "reason";
  if (t.length > 400) return "reason";
  return "fast";
}
